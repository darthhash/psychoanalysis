import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Message, Session, User
from ..services.auth import get_current_user
from ..services.cooldown import compute_cooldown, get_cooldown_until
from ..services.llm import (
    check_interpretation_moment,
    check_session_cut,
    extract_key_signifier,
    generate_interpretation,
    generate_summary,
    get_analyst_response,
)
from ..services.rag import format_rag_context

router = APIRouter()


class MessageIn(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime.datetime


class SessionOut(BaseModel):
    id: str
    started_at: datetime.datetime
    ended_at: datetime.datetime | None
    interpretation: str | None
    summary: str | None
    key_signifier: str | None
    end_type: str | None
    message_count: int
    cooldown_until: datetime.datetime | None


class MessageResponse(BaseModel):
    message: MessageOut
    session_ended: bool
    end_type: str | None
    interpretation: str | None
    tension: int
    key_signifier: str | None
    cooldown_until: datetime.datetime | None


def session_to_out(s: Session) -> SessionOut:
    return SessionOut(
        id=str(s.id),
        started_at=s.started_at,
        ended_at=s.ended_at,
        interpretation=s.interpretation,
        summary=s.summary,
        key_signifier=s.key_signifier,
        end_type=s.end_type,
        message_count=s.message_count or 0,
        cooldown_until=s.cooldown_until,
    )


async def _end_session(session: Session, end_type: str, history: list[dict], db: AsyncSession):
    """Shared logic for ending a session."""
    import logging
    logger = logging.getLogger(__name__)

    session.ended_at = datetime.datetime.utcnow()
    session.end_type = end_type
    session.message_count = len([m for m in history if m["role"] == "user"])

    depth = session.message_count or 0
    session.cooldown_until = compute_cooldown(depth)

    if history:
        try:
            session.summary = await generate_summary(history)
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            session.summary = None
        try:
            session.key_signifier = await extract_key_signifier(history)
        except Exception as e:
            logger.error(f"Key signifier extraction failed: {e}")
            session.key_signifier = None


async def _get_prior_sessions_context(db: AsyncSession, user_id, current_session_id) -> list[dict]:
    """Get summaries and key signifiers from prior sessions for cross-session memory."""
    result = await db.execute(
        select(Session)
        .where(
            Session.user_id == user_id,
            Session.ended_at.isnot(None),
            Session.id != current_session_id,
        )
        .order_by(Session.ended_at.desc())
        .limit(5)
    )
    prior = result.scalars().all()
    if not prior:
        return []
    return [
        {
            "end_type": s.end_type,
            "summary": s.summary,
            "key_signifier": s.key_signifier,
            "interpretation": s.interpretation,
        }
        for s in prior
        if s.summary
    ]


# ---------- endpoints ----------

@router.post("/start", response_model=SessionOut)
async def start_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cooldown = await get_cooldown_until(db, user.id)
    if cooldown:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Session cooldown active",
                "cooldown_until": cooldown.isoformat(),
            },
        )

    session = Session(user_id=user.id, message_count=0)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session_to_out(session)


@router.post("/{session_id}/message", response_model=MessageResponse)
async def send_message(
    session_id: str,
    body: MessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.id == uuid.UUID(session_id), Session.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session already ended")

    # Save user message
    user_msg = Message(session_id=session.id, role="user", content=body.content)
    db.add(user_msg)
    await db.flush()

    # Build conversation history
    history = [{"role": m.role, "content": m.content} for m in session.messages]
    history.append({"role": "user", "content": body.content})

    # Count session number for this user
    session_count_result = await db.execute(
        select(Session).where(Session.user_id == user.id)
    )
    session_number = len(session_count_result.scalars().all())

    # Cross-session memory
    prior_sessions = await _get_prior_sessions_context(db, user.id, session.id)

    # Check if last session was user_exit
    last_exit_note = ""
    if prior_sessions and prior_sessions[0].get("end_type") == "user_exit" and len(history) <= 2:
        last_exit_note = "\nNote: the analysand left the previous session on their own. You may address this."

    rag_context = ""
    reply_text = await get_analyst_response(history, rag_context, prior_sessions, last_exit_note)

    assistant_msg = Message(session_id=session.id, role="assistant", content=reply_text)
    db.add(assistant_msg)

    full_history = history + [{"role": "assistant", "content": reply_text}]
    session_ended = False
    end_type = None
    tension = 0

    # Check interpretation moment (returns score + bool)
    tension, should_interpret = await check_interpretation_moment(full_history)
    if should_interpret and not session.interpretation:
        interpretation = await generate_interpretation(full_history, rag_context)
        session.interpretation = interpretation
        await _end_session(session, "interpretation", full_history, db)
        session_ended = True
        end_type = "interpretation"
        tension = 100

    # If no interpretation, check if analyst wants to cut (dynamic min exchanges)
    min_exchanges = min(4 + session_number, 12)
    user_exchange_count = len([m for m in full_history if m["role"] == "user"])
    if not session_ended and user_exchange_count >= min_exchanges:
        should_cut = await check_session_cut(full_history, session_number)
        if should_cut:
            await _end_session(session, "analyst_cut", full_history, db)
            session_ended = True
            end_type = "analyst_cut"

    await db.commit()
    await db.refresh(assistant_msg)

    return MessageResponse(
        message=MessageOut(
            id=str(assistant_msg.id),
            role=assistant_msg.role,
            content=assistant_msg.content,
            created_at=assistant_msg.created_at,
        ),
        session_ended=session_ended,
        end_type=end_type,
        interpretation=session.interpretation if session_ended else None,
        key_signifier=session.key_signifier if session_ended else None,
        cooldown_until=session.cooldown_until if session_ended else None,
        tension=tension,
    )


@router.post("/{session_id}/exit", response_model=SessionOut)
async def user_exit_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User voluntarily exits. Marked as user_exit — analyst will remember."""
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.id == uuid.UUID(session_id), Session.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session already ended")

    history = [{"role": m.role, "content": m.content} for m in session.messages]
    await _end_session(session, "user_exit", history, db)
    await db.commit()
    await db.refresh(session)
    return session_to_out(session)


@router.get("/{session_id}/messages", response_model=list[MessageOut])
async def get_messages(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .join(Session)
        .where(Message.session_id == uuid.UUID(session_id), Session.user_id == user.id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [
        MessageOut(id=str(m.id), role=m.role, content=m.content, created_at=m.created_at)
        for m in messages
    ]


@router.get("/cooldown")
async def check_cooldown(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cooldown = await get_cooldown_until(db, user.id)
    return {
        "active": cooldown is not None,
        "cooldown_until": cooldown.isoformat() if cooldown else None,
    }


@router.get("/history", response_model=list[SessionOut])
async def session_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user.id)
        .order_by(Session.started_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    return [session_to_out(s) for s in sessions]
