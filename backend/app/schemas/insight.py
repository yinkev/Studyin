from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InsightBase(BaseModel):
    source: str = Field(default="chat", pattern=r"^(chat|mcq|manual)$")
    content: str = Field(min_length=1, max_length=10000)
    tags: List[str] = Field(default_factory=list)


class InsightCreate(InsightBase):
    pass


class InsightUpdate(BaseModel):
    content: Optional[str] = Field(default=None, max_length=10000)
    tags: Optional[List[str]] = None


class InsightResponse(InsightBase):
    id: UUID

    class Config:
        from_attributes = True

