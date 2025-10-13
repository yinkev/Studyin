from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_demo, get_db
from app.models.user import User
from app.models.insight import Insight
from app.schemas.insight import InsightCreate, InsightUpdate, InsightResponse

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/", response_model=List[InsightResponse])
async def list_insights(
    q: Optional[str] = Query(default=None, description="Full-text search in content"),
    tag: Optional[str] = Query(default=None, description="Filter by tag"),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    stmt = select(Insight).where(Insight.user_id == current_user.id).order_by(Insight.created_at.desc()).limit(limit)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Insight.content.ilike(like))
    if tag:
        # tags is JSON array, use containment
        stmt = stmt.where(func.jsonb_contains(Insight.tags, func.to_jsonb([tag])))  # type: ignore
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.post("/", response_model=InsightResponse, status_code=status.HTTP_201_CREATED)
async def create_insight(
    payload: InsightCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    ins = Insight(
        user_id=current_user.id,
        source=payload.source,
        content=payload.content,
        tags=list(payload.tags or []),
        metadata={},
    )
    db.add(ins)
    await db.commit()
    await db.refresh(ins)
    return ins


@router.patch("/{insight_id}", response_model=InsightResponse)
async def update_insight(
    insight_id: UUID,
    payload: InsightUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    ins = await db.get(Insight, insight_id)
    if not ins or ins.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Insight not found")

    if payload.content is not None:
        ins.content = payload.content
    if payload.tags is not None:
        ins.tags = list(payload.tags)

    await db.commit()
    await db.refresh(ins)
    return ins


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    ins = await db.get(Insight, insight_id)
    if not ins or ins.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Insight not found")

    await db.delete(ins)
    await db.commit()
    return None

