"""Pre-aggregated analytics tables for fast dashboard queries.

These tables are updated via:
- Real-time: After each study session/event (for current day)
- Batch: Nightly job for historical data
- Materialized views: For complex multi-table aggregations

Why aggregates?
- Analytics queries on raw events are expensive
- Users expect fast dashboard load times
- Historical data rarely changes
"""

from __future__ import annotations

import datetime
import uuid
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class DailyUserStats(Base):
    """Daily aggregated statistics per user.

    One row per user per day. Updated in real-time or end-of-day batch.
    Powers:
    - Activity heatmaps
    - Streak tracking
    - Daily goal tracking
    - 30-day rolling metrics
    """

    __tablename__ = "daily_user_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    stat_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)

    # Session metrics
    sessions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_study_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_study_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Excludes pauses
    avg_session_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    longest_session_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Content interaction
    materials_viewed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunks_read: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unique_topics_studied: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Question performance
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_attempt_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_attempt_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # % correct
    avg_response_time_seconds: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )

    # AI coach
    ai_questions_asked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_hints_requested: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_positive_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_negative_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Gamification
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    achievements_unlocked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level_at_end_of_day: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Goal tracking
    daily_goal_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=60
    )  # User's goal
    goal_achieved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # Met goal?
    goal_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # % of goal

    # Metadata
    is_finalized: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # True after day ends
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
        Index("ix_daily_user_stats_user_date", "user_id", "stat_date", unique=True),
        Index("ix_daily_user_stats_date", "stat_date"),
        Index("ix_daily_user_stats_user_finalized", "user_id", "is_finalized"),
        CheckConstraint("sessions_count >= 0", name="ck_sessions_positive"),
        CheckConstraint("total_study_minutes >= 0", name="ck_study_minutes_positive"),
        CheckConstraint(
            "active_study_minutes <= total_study_minutes",
            name="ck_active_lte_total",
        ),
        CheckConstraint(
            "accuracy_rate >= 0.0 AND accuracy_rate <= 1.0", name="ck_accuracy_range"
        ),
        CheckConstraint(
            "goal_percentage >= 0.0 AND goal_percentage <= 2.0",
            name="ck_goal_range",
        ),  # Allow >100%
    )


class WeeklyUserStats(Base):
    """Weekly aggregated statistics per user.

    One row per user per week (ISO week, Monday-Sunday).
    Updated via weekly batch job.
    Powers:
    - Weekly performance trends
    - Longitudinal progress tracking
    - Week-over-week comparisons
    """

    __tablename__ = "weekly_user_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    week: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True
    )  # ISO week (1-53)
    week_start_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    week_end_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)

    # Aggregated metrics (sum of daily stats)
    active_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Days with activity
    total_study_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sessions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unique_topics_studied: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Week-over-week changes
    study_minutes_change: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # vs previous week
    accuracy_change: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # vs previous week
    mastery_improvement_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Topics with increased mastery

    # Weekly goals
    weekly_goal_achieved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    goal_streak_weeks: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Consecutive weeks meeting goal

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
        Index("ix_weekly_user_stats_user_year_week", "user_id", "year", "week", unique=True),
        Index("ix_weekly_user_stats_year_week", "year", "week"),
        CheckConstraint("week >= 1 AND week <= 53", name="ck_week_range"),
        CheckConstraint("active_days >= 0 AND active_days <= 7", name="ck_days_range"),
    )


class TopicDailyStats(Base):
    """Daily topic statistics per user.

    Tracks daily engagement with each topic.
    Powers:
    - Topic-level progress tracking
    - Focus area identification
    - Study pattern analysis
    """

    __tablename__ = "topic_daily_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    stat_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)

    # Study volume
    study_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_viewed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    materials_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Question performance
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_response_time_seconds: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )

    # Mastery progression
    mastery_at_start: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Score at start of day
    mastery_at_end: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Score at end of day
    mastery_change: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Delta

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user = relationship("User")
    topic = relationship("Topic")

    __table_args__ = (
        Index(
            "ix_topic_daily_stats_user_topic_date",
            "user_id",
            "topic_id",
            "stat_date",
            unique=True,
        ),
        Index("ix_topic_daily_stats_user_date", "user_id", "stat_date"),
        Index("ix_topic_daily_stats_topic_date", "topic_id", "stat_date"),
    )


class UserLearningMetrics(Base):
    """Rolling aggregated metrics per user (30-day, 90-day, all-time).

    Single row per user with multiple time windows.
    Updated daily via batch job.
    Powers:
    - Dashboard overview
    - Progress summaries
    - Comparative analytics
    """

    __tablename__ = "user_learning_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # 30-day rolling metrics
    study_minutes_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sessions_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_days_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_attempted_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_30d: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    xp_earned_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    topics_studied_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # 90-day rolling metrics
    study_minutes_90d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sessions_90d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_days_90d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_90d: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # All-time metrics
    study_minutes_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sessions_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_attempted_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    xp_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    achievements_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Streak tracking
    current_streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_study_date: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)

    # Mastery overview
    avg_mastery_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # Across all topics
    topics_mastered: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Mastery >= 0.8
    topics_in_progress: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # 0.3 <= mastery < 0.8
    topics_weak: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Mastery < 0.3

    # Predicted metrics (ML-based)
    predicted_exam_readiness: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # 0.0-1.0
    predicted_pass_probability: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )  # 0.0-1.0
    recommended_focus_topics: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=[], server_default="[]"
    )  # Array of topic IDs

    # Metadata
    last_calculated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
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
        CheckConstraint(
            "accuracy_30d >= 0.0 AND accuracy_30d <= 1.0", name="ck_accuracy_30d_range"
        ),
        CheckConstraint(
            "accuracy_90d >= 0.0 AND accuracy_90d <= 1.0", name="ck_accuracy_90d_range"
        ),
        CheckConstraint(
            "accuracy_total >= 0.0 AND accuracy_total <= 1.0",
            name="ck_accuracy_total_range",
        ),
        CheckConstraint(
            "avg_mastery_score >= 0.0 AND avg_mastery_score <= 1.0",
            name="ck_avg_mastery_range",
        ),
    )


class KnowledgeGap(Base):
    """Identified knowledge gaps for targeted learning.

    Computed via analytics job. Prioritizes topics needing attention.
    Powers:
    - Personalized study recommendations
    - Weakness identification
    - Learning path optimization
    """

    __tablename__ = "knowledge_gaps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )

    # Gap severity
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # 'critical', 'high', 'medium', 'low'
    gap_score: Mapped[float] = mapped_column(
        Float, nullable=False, index=True
    )  # 0.0-1.0 (higher = bigger gap)

    # Evidence
    questions_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_response_time_seconds: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    materials_incomplete: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    forgetting_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )  # How fast user forgets

    # Impact
    board_exam_importance: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )  # Topic weight
    affects_other_topics: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Prerequisite for N topics
    priority_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, index=True
    )  # Weighted priority

    # Recommendations
    recommended_materials: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=[], server_default="[]"
    )  # Array of material IDs
    estimated_study_hours: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )
    suggested_completion_date: Mapped[Optional[datetime.date]] = mapped_column(
        Date, nullable=True
    )

    # Status
    is_acknowledged: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # User saw recommendation
    is_resolved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # Gap closed
    resolved_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Metadata
    identified_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    last_updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user = relationship("User")
    topic = relationship("Topic")

    __table_args__ = (
        Index("ix_knowledge_gaps_user_severity", "user_id", "severity"),
        Index("ix_knowledge_gaps_user_priority", "user_id", "priority_score"),
        Index("ix_knowledge_gaps_user_resolved", "user_id", "is_resolved"),
        CheckConstraint(
            "gap_score >= 0.0 AND gap_score <= 1.0", name="ck_gap_score_range"
        ),
        CheckConstraint(
            "accuracy_rate >= 0.0 AND accuracy_rate <= 1.0", name="ck_accuracy_range"
        ),
        CheckConstraint(
            "priority_score >= 0.0 AND priority_score <= 10.0",
            name="ck_priority_range",
        ),
    )
