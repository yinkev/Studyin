"""Create FSRS (Free Spaced Repetition Scheduler) tables.

Revision ID: 006
Revises: 005
Create Date: 2025-10-13

This migration adds tables for the FSRS spaced repetition system:
- fsrs_cards: Individual study items with memory model state
- fsrs_review_logs: Historical record of all review attempts
- fsrs_parameters: User-specific or global FSRS algorithm parameters

FSRS is optimized for medical education with:
- High-performance indexes for "cards due for review" queries
- Historical review logs for algorithm optimization
- Personalized parameters for each user/subject
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create FSRS tables with optimized indexes."""

    # 1. Create fsrs_cards table
    op.create_table(
        "fsrs_cards",
        # Primary key
        sa.Column("id", UUID(as_uuid=True), primary_key=True),

        # Ownership and content references
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_id", UUID(as_uuid=True), sa.ForeignKey("material_chunks.id", ondelete="CASCADE"), nullable=True),
        sa.Column("topic_id", UUID(as_uuid=True), sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=True),
        sa.Column("flashcard_content", sa.Text, nullable=True),

        # FSRS memory model parameters
        sa.Column("difficulty", sa.Float, nullable=False, server_default="5.0"),
        sa.Column("stability", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("retrievability", sa.Float, nullable=False, server_default="1.0"),

        # Card state
        sa.Column("state", sa.String(20), nullable=False, server_default="new"),

        # Scheduling
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_review", sa.DateTime(timezone=True), nullable=True),
        sa.Column("elapsed_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("scheduled_days", sa.Integer, nullable=False, server_default="0"),

        # Review statistics
        sa.Column("reps", sa.Integer, nullable=False, server_default="0"),
        sa.Column("lapses", sa.Integer, nullable=False, server_default="0"),
        sa.Column("ease_factor", sa.Float, nullable=False, server_default="2.5"),
        sa.Column("average_response_time_seconds", sa.Float, nullable=True),
        sa.Column("consecutive_correct", sa.Integer, nullable=False, server_default="0"),

        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),

        # Constraints
        sa.CheckConstraint(
            "(chunk_id IS NOT NULL) OR (topic_id IS NOT NULL) OR (flashcard_content IS NOT NULL)",
            name="ck_fsrs_card_has_content"
        ),
        sa.CheckConstraint("difficulty >= 0.0 AND difficulty <= 10.0", name="ck_difficulty_range"),
        sa.CheckConstraint("stability >= 0.0", name="ck_stability_positive"),
        sa.CheckConstraint("retrievability >= 0.0 AND retrievability <= 1.0", name="ck_retrievability_range"),
        sa.CheckConstraint("state IN ('new', 'learning', 'review', 'relearning')", name="ck_valid_state"),
        sa.CheckConstraint("reps >= 0", name="ck_reps_positive"),
        sa.CheckConstraint("lapses >= 0", name="ck_lapses_positive"),
    )

    # Indexes for fsrs_cards (optimized for common queries)
    op.create_index("ix_fsrs_cards_user_due", "fsrs_cards", ["user_id", "due_date"])
    op.create_index("ix_fsrs_cards_user_state", "fsrs_cards", ["user_id", "state"])
    op.create_index("ix_fsrs_cards_chunk", "fsrs_cards", ["chunk_id"])
    op.create_index("ix_fsrs_cards_topic", "fsrs_cards", ["topic_id"])
    op.create_index("ix_fsrs_cards_user_updated", "fsrs_cards", ["user_id", "updated_at"])
    op.create_index("ix_fsrs_cards_due_date", "fsrs_cards", ["due_date"])
    op.create_index("ix_fsrs_cards_state", "fsrs_cards", ["state"])

    # 2. Create fsrs_review_logs table
    op.create_table(
        "fsrs_review_logs",
        # Primary key
        sa.Column("id", UUID(as_uuid=True), primary_key=True),

        # Foreign keys
        sa.Column("card_id", UUID(as_uuid=True), sa.ForeignKey("fsrs_cards.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),

        # Review details
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("review_duration_seconds", sa.Float, nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),

        # State snapshots
        sa.Column("state_before", sa.String(20), nullable=False),
        sa.Column("difficulty_before", sa.Float, nullable=False),
        sa.Column("stability_before", sa.Float, nullable=False),
        sa.Column("state_after", sa.String(20), nullable=False),
        sa.Column("difficulty_after", sa.Float, nullable=False),
        sa.Column("stability_after", sa.Float, nullable=False),

        # Scheduling
        sa.Column("scheduled_days", sa.Integer, nullable=False),
        sa.Column("elapsed_days", sa.Integer, nullable=False),

        # Context
        sa.Column("review_context", JSONB, nullable=True),

        # Constraints
        sa.CheckConstraint("rating >= 1 AND rating <= 4", name="ck_rating_range"),
    )

    # Indexes for fsrs_review_logs (optimized for analytics and algorithm optimization)
    op.create_index("ix_fsrs_review_logs_card", "fsrs_review_logs", ["card_id", "reviewed_at"])
    op.create_index("ix_fsrs_review_logs_user_date", "fsrs_review_logs", ["user_id", "reviewed_at"])
    op.create_index("ix_fsrs_review_logs_user_rating", "fsrs_review_logs", ["user_id", "rating"])
    op.create_index("ix_fsrs_review_logs_reviewed_at", "fsrs_review_logs", ["reviewed_at"])

    # 3. Create fsrs_parameters table
    op.create_table(
        "fsrs_parameters",
        # Primary key
        sa.Column("id", UUID(as_uuid=True), primary_key=True),

        # Scope (NULL = global default)
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("topic_id", UUID(as_uuid=True), sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=True),

        # FSRS algorithm parameters (19 weights + config)
        sa.Column("parameters", JSONB, nullable=False),

        # Metadata
        sa.Column("version", sa.String(10), nullable=False, server_default="4.5"),
        sa.Column("optimized", sa.Integer, nullable=False, server_default="0"),
        sa.Column("sample_size", sa.Integer, nullable=False, server_default="0"),
        sa.Column("loss", sa.Float, nullable=True),

        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # Indexes for fsrs_parameters
    op.create_index(
        "ix_fsrs_parameters_user_topic",
        "fsrs_parameters",
        ["user_id", "topic_id"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL")
    )
    op.create_index(
        "ix_fsrs_parameters_global",
        "fsrs_parameters",
        ["id"],
        postgresql_where=sa.text("user_id IS NULL AND topic_id IS NULL")
    )

    # 4. Insert default global FSRS parameters (FSRS-4.5 defaults)
    # These are research-backed defaults from the FSRS paper
    default_parameters = {
        "w": [
            0.40255, 1.18385, 3.173, 15.69105, 7.1949,
            0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
            1.01925, 1.9395, 0.11, 0.29605, 2.2698,
            0.2315, 2.9898, 0.51655, 0.6621
        ],
        "request_retention": 0.9,  # Target 90% retention
        "maximum_interval": 36500,  # Max 100 years
        "enable_fuzz": True,  # Add randomness to intervals
    }

    op.execute(
        sa.text("""
            INSERT INTO fsrs_parameters (id, user_id, topic_id, parameters, version, optimized, sample_size)
            VALUES (
                gen_random_uuid(),
                NULL,
                NULL,
                :parameters::jsonb,
                '4.5',
                0,
                0
            )
        """).bindparams(
            parameters=sa.literal(str(default_parameters).replace("'", '"'))
        )
    )

    print("FSRS tables created successfully with optimized indexes")


def downgrade() -> None:
    """Drop FSRS tables and indexes."""

    # Drop tables in reverse order (respects foreign keys)
    op.drop_table("fsrs_parameters")
    op.drop_table("fsrs_review_logs")
    op.drop_table("fsrs_cards")

    print("FSRS tables dropped successfully")
