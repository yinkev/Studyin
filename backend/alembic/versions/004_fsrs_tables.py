"""FSRS (Free Spaced Repetition Scheduler) tables

Revision ID: 004_fsrs_tables
Revises: 003_analytics_schema
Create Date: 2025-10-13

This migration creates FSRS tables for optimal spaced repetition scheduling:
- fsrs_cards: Individual review cards with FSRS memory model parameters
- fsrs_review_logs: Historical log of all review attempts
- fsrs_parameters: User-specific and topic-specific FSRS algorithm parameters

Based on the official py-fsrs library (v6.2.0) specifications:
- 21-parameter FSRS-4.5 algorithm
- DSR model (Difficulty, Stability, Retrievability)
- Support for personalized parameter optimization
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_fsrs_tables'
down_revision = '003_analytics_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create FSRS tables."""

    # ========================================
    # FSRS CARDS - Individual review items
    # ========================================
    op.create_table(
        'fsrs_cards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),

        # Card ownership and content
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('flashcard_content', sa.Text(), nullable=True),

        # FSRS memory model parameters
        sa.Column('difficulty', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('stability', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('retrievability', sa.Float(), nullable=False, server_default='1.0'),

        # Card state
        sa.Column('state', sa.String(20), nullable=False, server_default='new'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_review', sa.DateTime(timezone=True), nullable=True),
        sa.Column('elapsed_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('scheduled_days', sa.Integer(), nullable=False, server_default='0'),

        # Review statistics
        sa.Column('reps', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('lapses', sa.Integer(), nullable=False, server_default='0'),

        # Performance tracking
        sa.Column('ease_factor', sa.Float(), nullable=False, server_default='2.5'),
        sa.Column('average_response_time_seconds', sa.Float(), nullable=True),
        sa.Column('consecutive_correct', sa.Integer(), nullable=False, server_default='0'),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),

        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chunk_id'], ['material_chunks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),

        # Constraints
        sa.CheckConstraint(
            "(chunk_id IS NOT NULL) OR (topic_id IS NOT NULL) OR (flashcard_content IS NOT NULL)",
            name='ck_fsrs_card_has_content'
        ),
        sa.CheckConstraint('difficulty >= 0.0 AND difficulty <= 10.0', name='ck_difficulty_range'),
        sa.CheckConstraint('stability >= 0.0', name='ck_stability_positive'),
        sa.CheckConstraint('retrievability >= 0.0 AND retrievability <= 1.0', name='ck_retrievability_range'),
        sa.CheckConstraint(
            "state IN ('new', 'learning', 'review', 'relearning')",
            name='ck_valid_state'
        ),
        sa.CheckConstraint('reps >= 0', name='ck_reps_positive'),
        sa.CheckConstraint('lapses >= 0', name='ck_lapses_positive'),
    )

    # Indexes for FSRS cards
    op.create_index('ix_fsrs_cards_user_due', 'fsrs_cards', ['user_id', 'due_date'])
    op.create_index('ix_fsrs_cards_user_state', 'fsrs_cards', ['user_id', 'state'])
    op.create_index('ix_fsrs_cards_chunk', 'fsrs_cards', ['chunk_id'])
    op.create_index('ix_fsrs_cards_topic', 'fsrs_cards', ['topic_id'])
    op.create_index('ix_fsrs_cards_user_updated', 'fsrs_cards', ['user_id', 'updated_at'])
    op.create_index('ix_fsrs_cards_due_date', 'fsrs_cards', ['due_date'])
    op.create_index('ix_fsrs_cards_state', 'fsrs_cards', ['state'])

    # ========================================
    # FSRS REVIEW LOGS - Review history
    # ========================================
    op.create_table(
        'fsrs_review_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('card_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),

        # Review details
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_duration_seconds', sa.Float(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),

        # Card state snapshots
        sa.Column('state_before', sa.String(20), nullable=False),
        sa.Column('difficulty_before', sa.Float(), nullable=False),
        sa.Column('stability_before', sa.Float(), nullable=False),
        sa.Column('state_after', sa.String(20), nullable=False),
        sa.Column('difficulty_after', sa.Float(), nullable=False),
        sa.Column('stability_after', sa.Float(), nullable=False),

        # Scheduling info
        sa.Column('scheduled_days', sa.Integer(), nullable=False),
        sa.Column('elapsed_days', sa.Integer(), nullable=False),

        # Context
        sa.Column('review_context', postgresql.JSONB(), nullable=True),

        # Foreign keys
        sa.ForeignKeyConstraint(['card_id'], ['fsrs_cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),

        # Constraints
        sa.CheckConstraint('rating >= 1 AND rating <= 4', name='ck_rating_range'),
    )

    # Indexes for review logs
    op.create_index('ix_fsrs_review_logs_card', 'fsrs_review_logs', ['card_id', 'reviewed_at'])
    op.create_index('ix_fsrs_review_logs_user_date', 'fsrs_review_logs', ['user_id', 'reviewed_at'])
    op.create_index('ix_fsrs_review_logs_user_rating', 'fsrs_review_logs', ['user_id', 'rating'])
    op.create_index('ix_fsrs_review_logs_reviewed_at', 'fsrs_review_logs', ['reviewed_at'])

    # ========================================
    # FSRS PARAMETERS - Algorithm configuration
    # ========================================
    op.create_table(
        'fsrs_parameters',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),

        # Scope of parameters
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=True),

        # FSRS parameters (19-21 weights stored as JSONB)
        sa.Column('parameters', postgresql.JSONB(), nullable=False),
        # Structure: {
        #   "w": [0.4, 0.6, 2.4, 5.8, ...],  # 19-21 weights
        #   "request_retention": 0.9,
        #   "maximum_interval": 36500,
        #   "enable_fuzz": true,
        # }

        # Metadata
        sa.Column('version', sa.String(10), nullable=False, server_default='4.5'),
        sa.Column('optimized', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sample_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('loss', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),

        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
    )

    # Indexes for parameters
    op.create_index(
        'ix_fsrs_parameters_user_topic',
        'fsrs_parameters',
        ['user_id', 'topic_id'],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL")
    )
    op.create_index(
        'ix_fsrs_parameters_global',
        'fsrs_parameters',
        ['id'],
        postgresql_where=sa.text("user_id IS NULL AND topic_id IS NULL")
    )

    # ========================================
    # CREATE DEFAULT GLOBAL PARAMETERS
    # ========================================
    # Insert default FSRS-4.5 parameters from py-fsrs research
    op.execute("""
        INSERT INTO fsrs_parameters (id, user_id, topic_id, parameters, version, optimized, sample_size)
        VALUES (
            gen_random_uuid(),
            NULL,
            NULL,
            '{
                "w": [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.72, 0.53],
                "request_retention": 0.9,
                "maximum_interval": 36500,
                "enable_fuzz": true
            }',
            '4.5',
            0,
            0
        );
    """)


def downgrade() -> None:
    """Drop FSRS tables."""
    op.drop_table('fsrs_parameters')
    op.drop_table('fsrs_review_logs')
    op.drop_table('fsrs_cards')
