import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Dream, User
from ..services.auth import get_current_user

router = APIRouter()


class DreamIn(BaseModel):
    content: str


class DreamOut(BaseModel):
    id: str
    content: str
    created_at: datetime.datetime


@router.post("/", response_model=DreamOut)
async def create_dream(
    body: DreamIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dream = Dream(user_id=user.id, content=body.content)
    db.add(dream)
    await db.commit()
    await db.refresh(dream)
    return DreamOut(id=str(dream.id), content=dream.content, created_at=dream.created_at)


@router.get("/", response_model=list[DreamOut])
async def list_dreams(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dream).where(Dream.user_id == user.id).order_by(Dream.created_at.desc())
    )
    dreams = result.scalars().all()
    return [DreamOut(id=str(d.id), content=d.content, created_at=d.created_at) for d in dreams]
