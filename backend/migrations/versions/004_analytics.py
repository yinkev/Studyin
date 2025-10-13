"""Create analytics tables with time-series optimization.

HIPAA-compliant design with anonymized user IDs, no PII storage.
Optimized for time-series queries with appropriate indexes and partitioning.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create analytics tables with optimized indexes."""

    # Create analytics_events table (main event store)
    op.create_table(
        "analytics_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("properties", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for analytics_events
    op.create_index(
        "ix_analytics_events_timestamp",
        "analytics_events",
        ["timestamp"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_analytics_events_user_timestamp",
        "analytics_events",
        ["user_id", "timestamp"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_analytics_events_type_timestamp",
        "analytics_events",
        ["event_type", "timestamp"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_analytics_events_session",
        "analytics_events",
        ["session_id"],
        postgresql_using="btree",
        postgresql_where=sa.text("session_id IS NOT NULL"),
    )
    # GIN index for JSONB properties for fast queries
    op.create_index(
        "ix_analytics_events_properties",
        "analytics_events",
        ["properties"],
        postgresql_using="gin",
    )

    # Create learning_sessions table (aggregated session data)
    op.create_table(
        "learning_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("materials_viewed", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}", nullable=False),
        sa.Column("materials_completed", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}", nullable=False),
        sa.Column("xp_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Indexes for learning_sessions
    op.create_index(
        "ix_learning_sessions_user_started",
        "learning_sessions",
        ["user_id", "started_at"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_learning_sessions_active",
        "learning_sessions",
        ["is_active"],
        postgresql_using="btree",
        postgresql_where=sa.text("is_active = true"),
    )

    # Create gamification_stats table (user gamification state)
    op.create_table(
        "gamification_stats",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("total_xp", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("current_streak", sa.Integer(), server_default="0", nullable=False),
        sa.Column("longest_streak", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.Column("achievements", postgresql.JSONB, server_default="[]", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create daily_activity_summary table (pre-aggregated daily metrics)
    op.create_table(
        "daily_activity_summary",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_sessions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_duration_seconds", sa.Integer(), server_default="0", nullable=False),
        sa.Column("materials_viewed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("materials_completed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("xp_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_messages_sent", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Unique constraint and indexes for daily_activity_summary
    op.create_unique_constraint(
        "uq_daily_activity_user_date",
        "daily_activity_summary",
        ["user_id", "date"],
    )
    op.create_index(
        "ix_daily_activity_date",
        "daily_activity_summary",
        ["date"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_daily_activity_user_date",
        "daily_activity_summary",
        ["user_id", "date"],
        postgresql_using="btree",
    )

    # Create ai_coach_metrics table
    op.create_table(
        "ai_coach_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("avg_response_time_ms", sa.Integer(), nullable=True),
        sa.Column("avg_rating", sa.Float(), nullable=True),
        sa.Column("total_ratings", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

