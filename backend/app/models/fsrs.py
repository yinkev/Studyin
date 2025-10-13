"""FSRS (Free Spaced Repetition Scheduler) models for optimal review scheduling.

FSRS is a modern spaced repetition algorithm that uses a memory model to predict
optimal review intervals. It's designed to maximize long-term retention while
minimizing study time.

Key concepts:
- Cards: Individual study items (material chunks, questions)
- Difficulty: How hard the card is to remember (0.0-10.0)
- Stability: How long (in days) the memory will last at 90% retention
- Retrievability: Current probability of successful recall (0.0-1.0)
- Review Log: Historical record of all review attempts

Medical education optimizations:
- Longer intervals for core concepts (anatomy, physiology)
- Shorter intervals for clinical details (drug names, dosages)
- Integration with question performance and topic mastery
"""

from __future__ import annotations

import datetime
import uuid
from typing import Optional

from sqlalchemy import (
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


class FSRSCard(Base):
    """FSRS card state for a study item.

    Each card represents one item to be reviewed (chunk, question, flashcard).
    The FSRS algorithm updates difficulty, stability, and due date after each review.

    Attributes:
        difficulty: How hard to remember (0.0-10.0, higher=harder)
        stability: Memory stability in days (time until 90% retention)
        retrievability: Current recall probability (0.0-1.0)
        state: current | new | learning | review | relearning
        due_date: When the next review is scheduled
        last_review: When the card was last reviewed
        elapsed_days: Days since last review (for algorithm)
        scheduled_days: Days the card was scheduled for
        reps: Total number of reviews
        lapses: Number of times card was forgotten
    """

    __tablename__ = "fsrs_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Card ownership and content
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Link to study content (one of these will be set)
    chunk_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("material_chunks.id", ondelete="CASCADE"), nullable=True
    )
    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )

    # Custom flashcard (future feature)
    flashcard_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # FSRS memory model parameters
    difficulty: Mapped[float] = mapped_column(
        Float, nullable=False, default=5.0
    )  # 0.0-10.0 (initial difficulty)

    stability: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Days until 90% retention

    retrievability: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )  # Current recall probability (0.0-1.0)

    # Card state
    state: Mapped[str] = mapped_column(
        String(20), nullable=False, default="new", index=True
    )  # 'new', 'learning', 'review', 'relearning'

    # Scheduling
    due_date: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    last_review: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    elapsed_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Days since last review
    scheduled_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Days card was scheduled for

    # Review statistics
    reps: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Total reviews
    lapses: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Times forgotten

    # Performance tracking
    ease_factor: Mapped[float] = mapped_column(
        Float, nullable=False, default=2.5
    )  # Legacy SM-2 compatibility

    average_response_time_seconds: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )

    consecutive_correct: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # Metadata
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
    user = relationship("User", backref="fsrs_cards")
    chunk = relationship("MaterialChunk", backref="fsrs_cards")
    topic = relationship("Topic", backref="fsrs_cards")
    reviews = relationship("FSRSReviewLog", back_populates="card", cascade="all, delete-orphan")

    __table_args__ = (
        # Efficiently find due cards for a user
        Index("ix_fsrs_cards_user_due", "user_id", "due_date"),
        Index("ix_fsrs_cards_user_state", "user_id", "state"),

        # Find cards by content
        Index("ix_fsrs_cards_chunk", "chunk_id"),
        Index("ix_fsrs_cards_topic", "topic_id"),

        # Performance queries
        Index("ix_fsrs_cards_user_updated", "user_id", "updated_at"),

        # Ensure at least one content reference
        CheckConstraint(
            "(chunk_id IS NOT NULL) OR (topic_id IS NOT NULL) OR (flashcard_content IS NOT NULL)",
            name="ck_fsrs_card_has_content"
        ),

        # FSRS parameter constraints
        CheckConstraint(
            "difficulty >= 0.0 AND difficulty <= 10.0",
            name="ck_difficulty_range"
        ),
        CheckConstraint(
            "stability >= 0.0",
            name="ck_stability_positive"
        ),
        CheckConstraint(
            "retrievability >= 0.0 AND retrievability <= 1.0",
            name="ck_retrievability_range"
        ),
        CheckConstraint(
            "state IN ('new', 'learning', 'review', 'relearning')",
            name="ck_valid_state"
        ),
        CheckConstraint(
            "reps >= 0",
            name="ck_reps_positive"
        ),
        CheckConstraint(
            "lapses >= 0",
            name="ck_lapses_positive"
        ),
    )


class FSRSReviewLog(Base):
    """Historical log of every review attempt.

    Each review records:
    - Rating given (1-4: Again, Hard, Good, Easy)
    - Time taken to answer
    - Card state before and after review
    - Scheduled interval

    This data is used for:
    - Algorithm optimization (personalized FSRS parameters)
    - Learning analytics
    - Performance tracking
    - Retention analysis
    """

    __tablename__ = "fsrs_review_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fsrs_cards.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Review details
    rating: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 1=Again, 2=Hard, 3=Good, 4=Easy

    review_duration_seconds: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )

    reviewed_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    # Card state snapshot (before review)
    state_before: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    difficulty_before: Mapped[float] = mapped_column(Float, nullable=False)
    stability_before: Mapped[float] = mapped_column(Float, nullable=False)

    # Card state snapshot (after review)
    state_after: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    difficulty_after: Mapped[float] = mapped_column(Float, nullable=False)
    stability_after: Mapped[float] = mapped_column(Float, nullable=False)

    # Scheduling info
    scheduled_days: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Days until next review
    elapsed_days: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Days since last review

    # Context
    review_context: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # Extra metadata (device, session_id, etc.)

    # Relationships
    card = relationship("FSRSCard", back_populates="reviews")
    user = relationship("User", backref="fsrs_reviews")

    __table_args__ = (
        Index("ix_fsrs_review_logs_card", "card_id", "reviewed_at"),
        Index("ix_fsrs_review_logs_user_date", "user_id", "reviewed_at"),
        Index("ix_fsrs_review_logs_user_rating", "user_id", "rating"),
        CheckConstraint(
            "rating >= 1 AND rating <= 4",
            name="ck_rating_range"
        ),
    )


class FSRSParameters(Base):
    """User-specific or global FSRS algorithm parameters.

    FSRS uses 19 parameters to model memory. These can be:
    - Global defaults (for all users)
    - Personalized per user (optimized from their review history)
    - Subject-specific (different for anatomy vs. pharmacology)

    Default parameters are research-backed, but personalization improves
    prediction accuracy by ~5-10%.
    """

    __tablename__ = "fsrs_parameters"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Scope of parameters
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )  # NULL = global default

    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )  # Subject-specific (e.g., pharmacology)

    # FSRS parameters (19 parameters as per FSRS-4.5)
    # Stored as JSONB for flexibility as algorithm evolves
    parameters: Mapped[dict] = mapped_column(
        JSONB, nullable=False
    )
    # Structure: {
    #   "w": [0.4, 0.6, 2.4, 5.8, 4.93, ...],  # 19 weights
    #   "request_retention": 0.9,  # Target retention (0.8-0.95)
    #   "maximum_interval": 36500,  # Max days between reviews
    #   "enable_fuzz": true,  # Add randomness to intervals
    # }

    # Metadata
    version: Mapped[str] = mapped_column(
        String(10), nullable=False, default="4.5"
    )  # FSRS version

    optimized: Mapped[bool] = mapped_column(
        Integer, nullable=False, default=0
    )  # 0=default, 1=optimized from data

    sample_size: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Number of reviews used for optimization

    loss: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # Optimization loss (lower=better fit)

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
    user = relationship("User", backref="fsrs_parameters")
    topic = relationship("Topic", backref="fsrs_parameters")

    __table_args__ = (
        # Unique constraint: one parameter set per user/topic combination
        Index(
            "ix_fsrs_parameters_user_topic",
            "user_id",
            "topic_id",
            unique=True,
            postgresql_where="user_id IS NOT NULL"
        ),
        # Global default (user_id=NULL, topic_id=NULL)
        Index(
            "ix_fsrs_parameters_global",
            postgresql_where="user_id IS NULL AND topic_id IS NULL"
        ),
    )
