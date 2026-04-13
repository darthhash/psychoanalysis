import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Session

BASE_COOLDOWN_MINUTES = 30
MAX_COOLDOWN_MINUTES = 180


async def get_cooldown_until(db: AsyncSession, user_id) -> datetime.datetime | None:
    result = await db.execute(
        select(Session.cooldown_until)
        .where(Session.user_id == user_id, Session.cooldown_until.isnot(None))
        .order_by(Session.ended_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row and row > datetime.datetime.utcnow():
        return row
    return None


def compute_cooldown(message_count: int = 0) -> datetime.datetime:
    """Dynamic cooldown: deeper sessions = longer pause.

    Base: 30min. Each user message adds 10min. Cap at 3 hours.
    """
    minutes = min(BASE_COOLDOWN_MINUTES + message_count * 10, MAX_COOLDOWN_MINUTES)
    return datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes)
