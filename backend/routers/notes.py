import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Note, User
from ..services.auth import get_current_user

router = APIRouter()


class NoteIn(BaseModel):
    content: str


class NoteOut(BaseModel):
    id: str
    content: str
    created_at: datetime.datetime


@router.post("/", response_model=NoteOut)
async def create_note(
    body: NoteIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = Note(user_id=user.id, content=body.content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return NoteOut(id=str(note.id), content=note.content, created_at=note.created_at)


@router.get("/", response_model=list[NoteOut])
async def list_notes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Note).where(Note.user_id == user.id).order_by(Note.created_at.desc())
    )
    notes = result.scalars().all()
    return [NoteOut(id=str(n.id), content=n.content, created_at=n.created_at) for n in notes]
