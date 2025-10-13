from __future__ import annotations

import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="chat")  # chat|mcq|manual
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)  # JSON array of strings
    insight_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

