"""Topic taxonomy and mastery tracking for medical education.

Medical subject hierarchy (e.g., Cardiology → Heart Failure → Systolic Dysfunction)
Enables:
- Topic-based progress tracking
- Knowledge gap identification
- Prerequisite learning paths
- Exam readiness by topic
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


class Topic(Base):
    """Medical subject/topic taxonomy.

    Hierarchical structure: System → Subject → Subtopic
    Example: Cardiovascular → Heart Failure → Systolic Dysfunction
    """

    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Hierarchy
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    level: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 0=System, 1=Subject, 2=Subtopic
    path: Mapped[str] = mapped_column(
        String(500), nullable=False, index=True
    )  # Materialized path: "cardio.heart_failure.systolic"

    # Topic details
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(
        String(200), nullable=False, unique=True, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Medical curriculum metadata
    board_exam_weight: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )  # USMLE/COMLEX importance
    difficulty_level: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3
    )  # 1-5 scale
    estimated_study_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Prerequisites (array of topic IDs that should be studied first)
    prerequisites: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=[], server_default="[]"
    )

    # Content counts (denormalized for performance)
    materials_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    learners_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # How many users studied this

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
    parent = relationship("Topic", remote_side=[id], backref="children")

    __table_args__ = (
        Index("ix_topics_parent_level", "parent_id", "level"),
        CheckConstraint("level >= 0 AND level <= 3", name="ck_level_range"),
        CheckConstraint(
            "difficulty_level >= 1 AND difficulty_level <= 5", name="ck_difficulty_range"
        ),
        CheckConstraint(
            "board_exam_weight >= 0 AND board_exam_weight <= 10",
            name="ck_weight_range",
        ),
    )


class TopicMastery(Base):
    """User mastery level for each topic.

    Computed from question attempts, material interactions, and AI coach sessions.
    Updated in real-time or via batch job (depending on calculation complexity).
    """

    __tablename__ = "topic_mastery"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )

    # Mastery metrics (0.0 - 1.0 scale)
    mastery_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, index=True
    )
    # Composite score considering:
    # - Question accuracy
    # - Retrieval strength (spaced repetition)
    # - Material completion
    # - Response time (faster = stronger memory)
    # - Forgetting curve estimation

    confidence_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Statistical confidence in mastery_score
    retrieval_strength: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Memory strength (forgetting curve)
    retention_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # % correct over time

    # Progress tracking
    first_studied_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_studied_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    days_since_last_study: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Study volume
    total_study_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Available materials

    # Question performance
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_attempt_accuracy: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Only first attempts
    avg_response_time_seconds: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )

    # Learning trajectory
    mastery_trend: Mapped[str] = mapped_column(
        String(20), nullable=False, default="improving"
    )  # 'improving', 'stable', 'declining'
    predicted_exam_score: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # Predicted % correct on exam

    # Next review (spaced repetition)
    next_review_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    review_interval_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )  # SM-2 algorithm

    # Metadata
    last_calculated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    calculation_version: Mapped[str] = mapped_column(
        String(10), nullable=False, default="1.0"
    )  # For algorithm versioning

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
    topic = relationship("Topic")

    __table_args__ = (
        Index("ix_topic_mastery_user_topic", "user_id", "topic_id", unique=True),
        Index("ix_topic_mastery_user_mastery", "user_id", "mastery_score"),
        Index("ix_topic_mastery_user_next_review", "user_id", "next_review_at"),
        Index("ix_topic_mastery_topic_mastery", "topic_id", "mastery_score"),
        CheckConstraint(
            "mastery_score >= 0.0 AND mastery_score <= 1.0", name="ck_mastery_range"
        ),
        CheckConstraint(
            "confidence_score >= 0.0 AND confidence_score <= 1.0",
            name="ck_confidence_range",
        ),
        CheckConstraint(
            "retrieval_strength >= 0.0 AND retrieval_strength <= 1.0",
            name="ck_retrieval_range",
        ),
        CheckConstraint(
            "retention_rate >= 0.0 AND retention_rate <= 1.0", name="ck_retention_range"
        ),
        CheckConstraint(
            "first_attempt_accuracy >= 0.0 AND first_attempt_accuracy <= 1.0",
            name="ck_accuracy_range",
        ),
    )


class TopicRelationship(Base):
    """Relationships between topics beyond parent-child hierarchy.

    Examples:
    - "Heart Failure" is related to "Pulmonary Edema"
    - "Diabetes" is related to "Diabetic Retinopathy"
    - "Pharmacology-ACE Inhibitors" is related to "Cardiology-Heart Failure"
    """

    __tablename__ = "topic_relationships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    source_topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    target_topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )

    relationship_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'prerequisite', 'related', 'complication', 'treatment'
    strength: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )  # 0.0-1.0 relationship strength

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    source_topic = relationship("Topic", foreign_keys=[source_topic_id])
    target_topic = relationship("Topic", foreign_keys=[target_topic_id])

    __table_args__ = (
        Index(
            "ix_topic_relationships_source_target",
            "source_topic_id",
            "target_topic_id",
            unique=True,
        ),
        Index("ix_topic_relationships_target", "target_topic_id"),
        CheckConstraint(
            "source_topic_id != target_topic_id", name="ck_no_self_reference"
        ),
        CheckConstraint(
            "strength >= 0.0 AND strength <= 1.0", name="ck_strength_range"
        ),
    )
