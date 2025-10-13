"""Analytics event tracking tables for world-class medical education analytics.

Design principles:
- Immutable event log (append-only, never update/delete)
- Partitioned by date for query performance
- Indexed for common query patterns
- HIPAA-adjacent privacy (no PII beyond user_id)
- Supports real-time and batch analytics
"""

from __future__ import annotations

import datetime
import uuid
from enum import Enum
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class EventTypeEnum(str, Enum):
    """Event types for analytics tracking."""

    # Study session events
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    SESSION_PAUSE = "session_pause"
    SESSION_RESUME = "session_resume"

    # Material interaction events
    MATERIAL_OPEN = "material_open"
    MATERIAL_READ = "material_read"  # Chunk or page read
    MATERIAL_COMPLETE = "material_complete"
    MATERIAL_BOOKMARK = "material_bookmark"
    MATERIAL_HIGHLIGHT = "material_highlight"
    MATERIAL_NOTE = "material_note"

    # Question/quiz events
    QUESTION_VIEW = "question_view"
    QUESTION_ATTEMPT = "question_attempt"
    QUESTION_SUBMIT = "question_submit"
    QUESTION_REVIEW = "question_review"
    QUIZ_START = "quiz_start"
    QUIZ_COMPLETE = "quiz_complete"

    # AI coach events
    AI_QUESTION_ASKED = "ai_question_asked"
    AI_RESPONSE_RECEIVED = "ai_response_received"
    AI_FEEDBACK_POSITIVE = "ai_feedback_positive"
    AI_FEEDBACK_NEGATIVE = "ai_feedback_negative"
    AI_HINT_REQUESTED = "ai_hint_requested"
    AI_EXPLANATION_REQUESTED = "ai_explanation_requested"

    # Gamification events
    XP_EARNED = "xp_earned"
    LEVEL_UP = "level_up"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    STREAK_CONTINUED = "streak_continued"
    STREAK_BROKEN = "streak_broken"

    # Search and discovery
    SEARCH_PERFORMED = "search_performed"
    TOPIC_EXPLORED = "topic_explored"
    RELATED_CONTENT_CLICKED = "related_content_clicked"


class StudyEvent(Base):
    """Immutable event log for all study-related activities.

    This is the primary event table - append-only, never update.
    Partitioned by created_at (monthly partitions) for performance.
    """

    __tablename__ = "study_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Timestamps (all in UTC)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    event_timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )  # When event actually occurred (may differ from created_at for offline events)

    # Context IDs (nullable - depends on event type)
    material_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=True
    )
    chunk_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("material_chunks.id", ondelete="CASCADE"),
        nullable=True,
    )
    question_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # FK to questions table (not created yet)
    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # FK to topics table

    # Event metadata (flexible JSONB for event-specific data)
    properties: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default={}, server_default="{}"
    )
    # Examples:
    # - session_start: {"device_type": "web", "user_agent": "..."}
    # - material_read: {"time_spent_seconds": 45, "scroll_depth_percent": 80}
    # - question_submit: {"answer": "B", "is_correct": true, "time_spent_seconds": 32}
    # - ai_question_asked: {"question_length": 120, "context_provided": true}

    # Client context (for debugging and analytics)
    client_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # 'web', 'mobile', 'tablet'

    # Relationships
    user = relationship("User")
    material = relationship("Material")
    chunk = relationship("MaterialChunk")

    # Indexes for common query patterns
    __table_args__ = (
        # Composite indexes for analytics queries
        Index("ix_study_events_user_created", "user_id", "created_at"),
        Index("ix_study_events_user_event_type", "user_id", "event_type"),
        Index(
            "ix_study_events_user_session_created", "user_id", "session_id", "created_at"
        ),
        Index("ix_study_events_material_created", "material_id", "created_at"),
        Index("ix_study_events_topic_created", "topic_id", "created_at"),
        Index("ix_study_events_event_created", "event_type", "created_at"),
        # For time-range queries
        Index("ix_study_events_created_user", "created_at", "user_id"),
    )


class StudySession(Base):
    """Aggregated study session data for performance.

    Updated when session ends. Contains computed metrics.
    Enables fast "recent sessions" queries without scanning event table.
    """

    __tablename__ = "study_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Session timing
    started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    ended_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Total duration
    active_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Active study time (excludes pauses)
    pause_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Session metrics
    materials_viewed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunks_read: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_interactions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Gamification
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    achievements_unlocked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Session context
    device_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )  # False when session ends

    # Topics studied (array of topic IDs)
    topics_studied: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default={}, server_default="{}"
    )
    # Format: {"topic_id": "time_spent_seconds"}

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user = relationship("User")

    __table_args__ = (
        Index("ix_study_sessions_user_started", "user_id", "started_at"),
        Index("ix_study_sessions_user_active", "user_id", "is_active"),
        CheckConstraint("duration_seconds >= 0", name="ck_duration_positive"),
        CheckConstraint("active_seconds >= 0", name="ck_active_positive"),
        CheckConstraint("active_seconds <= duration_seconds", name="ck_active_lte_duration"),
    )


class QuestionAttempt(Base):
    """Question attempt tracking for spaced repetition and mastery analytics.

    Each row represents one attempt at answering a question.
    Critical for:
    - Forgetting curve calculation
    - Retrieval strength estimation
    - Knowledge gap identification
    - Exam readiness prediction
    """

    __tablename__ = "question_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )  # FK to questions table
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )  # FK to topics table

    # Attempt details
    attempted_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    time_to_answer_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Response time
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)
    confidence_level: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 1-5 scale (if user provided)

    # Answer details
    selected_answer: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # e.g., "A", "B", "C", "D"
    correct_answer: Mapped[str] = mapped_column(String(10), nullable=False)

    # Context
    is_first_attempt: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, index=True
    )
    attempt_number: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )  # nth attempt at this question
    days_since_last_attempt: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # For spaced repetition

    # AI assistance used
    hint_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    explanation_viewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user = relationship("User")
    session = relationship("StudySession")

    __table_args__ = (
        Index("ix_question_attempts_user_created", "user_id", "attempted_at"),
        Index("ix_question_attempts_question_user", "question_id", "user_id"),
        Index("ix_question_attempts_topic_user", "topic_id", "user_id"),
        Index(
            "ix_question_attempts_user_correct", "user_id", "is_correct", "attempted_at"
        ),
        CheckConstraint("time_to_answer_seconds >= 0", name="ck_time_positive"),
        CheckConstraint("attempt_number >= 1", name="ck_attempt_positive"),
        CheckConstraint(
            "confidence_level IS NULL OR (confidence_level >= 1 AND confidence_level <= 5)",
            name="ck_confidence_range",
        ),
    )


class MaterialInteraction(Base):
    """Material reading/interaction tracking for engagement analytics.

    Tracks detailed interaction with study materials at chunk level.
    Enables:
    - Reading pattern analysis
    - Engagement scoring
    - Content difficulty estimation
    - Study behavior insights
    """

    __tablename__ = "material_interactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False
    )
    chunk_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("material_chunks.id", ondelete="CASCADE"),
        nullable=True,
    )
    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # FK to topics table

    # Interaction details
    interaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'read', 'highlight', 'note', 'bookmark'
    started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    ended_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Engagement metrics
    scroll_depth_percent: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # How far user scrolled
    is_complete: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # Fully read/completed
    revisit_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )  # How many times viewed

    # Content annotations
    highlights_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bookmarked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user = relationship("User")
    session = relationship("StudySession")
    material = relationship("Material")
    chunk = relationship("MaterialChunk")

    __table_args__ = (
        Index("ix_material_interactions_user_started", "user_id", "started_at"),
        Index("ix_material_interactions_material_user", "material_id", "user_id"),
        Index("ix_material_interactions_chunk_user", "chunk_id", "user_id"),
        Index("ix_material_interactions_session", "session_id"),
        CheckConstraint("duration_seconds >= 0", name="ck_duration_positive"),
        CheckConstraint(
            "scroll_depth_percent IS NULL OR (scroll_depth_percent >= 0 AND scroll_depth_percent <= 100)",
            name="ck_scroll_range",
        ),
    )
