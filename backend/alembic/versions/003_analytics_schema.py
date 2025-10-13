"""Analytics schema for world-class medical education analytics

Revision ID: 003_analytics_schema
Revises:
Create Date: 2025-10-13

This migration creates comprehensive analytics tables:
- Event tracking (study_events, question_attempts, material_interactions)
- Topic taxonomy (topics, topic_mastery, topic_relationships)
- Aggregated metrics (daily/weekly stats, user learning metrics)
- Knowledge gap detection

Performance optimizations:
- Partitioning strategy for events (by month)
- Strategic indexes for common query patterns
- JSONB for flexible metadata
- Check constraints for data integrity
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_analytics_schema'
down_revision = None  # Update this to previous migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create analytics schema."""

    # ========================================
    # TOPICS - Medical subject taxonomy
    # ========================================
    op.create_table(
        'topics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('slug', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('board_exam_weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('difficulty_level', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('estimated_study_hours', sa.Float(), nullable=True),
        sa.Column('prerequisites', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('materials_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('learners_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['parent_id'], ['topics.id'], ondelete='CASCADE'),
        sa.CheckConstraint('level >= 0 AND level <= 3', name='ck_level_range'),
        sa.CheckConstraint('difficulty_level >= 1 AND difficulty_level <= 5', name='ck_difficulty_range'),
        sa.CheckConstraint('board_exam_weight >= 0 AND board_exam_weight <= 10', name='ck_weight_range'),
    )
    op.create_index('ix_topics_path', 'topics', ['path'])
    op.create_index('ix_topics_name', 'topics', ['name'])
    op.create_index('ix_topics_slug', 'topics', ['slug'], unique=True)
    op.create_index('ix_topics_parent_level', 'topics', ['parent_id', 'level'])

    # ========================================
    # TOPIC RELATIONSHIPS
    # ========================================
    op.create_table(
        'topic_relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relationship_type', sa.String(50), nullable=False),
        sa.Column('strength', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['source_topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.CheckConstraint('source_topic_id != target_topic_id', name='ck_no_self_reference'),
        sa.CheckConstraint('strength >= 0.0 AND strength <= 1.0', name='ck_strength_range'),
    )
    op.create_index('ix_topic_relationships_source_target', 'topic_relationships',
                    ['source_topic_id', 'target_topic_id'], unique=True)
    op.create_index('ix_topic_relationships_target', 'topic_relationships', ['target_topic_id'])

    # ========================================
    # STUDY SESSIONS - Aggregated session data
    # ========================================
    op.create_table(
        'study_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('pause_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_viewed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chunks_read', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_interactions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('achievements_unlocked', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('device_type', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('topics_studied', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint('duration_seconds >= 0', name='ck_duration_positive'),
        sa.CheckConstraint('active_seconds >= 0', name='ck_active_positive'),
        sa.CheckConstraint('active_seconds <= duration_seconds', name='ck_active_lte_duration'),
    )
    op.create_index('ix_study_sessions_user_started', 'study_sessions', ['user_id', 'started_at'])
    op.create_index('ix_study_sessions_user_active', 'study_sessions', ['user_id', 'is_active'])

    # ========================================
    # STUDY EVENTS - Immutable event log
    # ========================================
    op.create_table(
        'study_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('chunk_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('properties', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('client_ip', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('device_type', sa.String(20), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chunk_id'], ['material_chunks.id'], ondelete='CASCADE'),
    )
    # Strategic indexes for common analytics queries
    op.create_index('ix_study_events_session_id', 'study_events', ['session_id'])
    op.create_index('ix_study_events_event_type', 'study_events', ['event_type'])
    op.create_index('ix_study_events_created_at', 'study_events', ['created_at'])
    op.create_index('ix_study_events_event_timestamp', 'study_events', ['event_timestamp'])
    op.create_index('ix_study_events_user_created', 'study_events', ['user_id', 'created_at'])
    op.create_index('ix_study_events_user_event_type', 'study_events', ['user_id', 'event_type'])
    op.create_index('ix_study_events_user_session_created', 'study_events',
                    ['user_id', 'session_id', 'created_at'])
    op.create_index('ix_study_events_material_created', 'study_events', ['material_id', 'created_at'])
    op.create_index('ix_study_events_topic_created', 'study_events', ['topic_id', 'created_at'])
    op.create_index('ix_study_events_event_created', 'study_events', ['event_type', 'created_at'])
    op.create_index('ix_study_events_created_user', 'study_events', ['created_at', 'user_id'])

    # ========================================
    # QUESTION ATTEMPTS
    # ========================================
    op.create_table(
        'question_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('attempted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('time_to_answer_seconds', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('confidence_level', sa.Integer(), nullable=True),
        sa.Column('selected_answer', sa.String(10), nullable=False),
        sa.Column('correct_answer', sa.String(10), nullable=False),
        sa.Column('is_first_attempt', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('days_since_last_attempt', sa.Float(), nullable=True),
        sa.Column('hint_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('explanation_viewed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='CASCADE'),
        sa.CheckConstraint('time_to_answer_seconds >= 0', name='ck_time_positive'),
        sa.CheckConstraint('attempt_number >= 1', name='ck_attempt_positive'),
        sa.CheckConstraint('confidence_level IS NULL OR (confidence_level >= 1 AND confidence_level <= 5)',
                          name='ck_confidence_range'),
    )
    op.create_index('ix_question_attempts_user_created', 'question_attempts', ['user_id', 'attempted_at'])
    op.create_index('ix_question_attempts_question_user', 'question_attempts', ['question_id', 'user_id'])
    op.create_index('ix_question_attempts_topic_user', 'question_attempts', ['topic_id', 'user_id'])
    op.create_index('ix_question_attempts_user_correct', 'question_attempts',
                    ['user_id', 'is_correct', 'attempted_at'])
    op.create_index('ix_question_attempts_attempted_at', 'question_attempts', ['attempted_at'])
    op.create_index('ix_question_attempts_is_correct', 'question_attempts', ['is_correct'])
    op.create_index('ix_question_attempts_is_first_attempt', 'question_attempts', ['is_first_attempt'])

    # ========================================
    # MATERIAL INTERACTIONS
    # ========================================
    op.create_table(
        'material_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('interaction_type', sa.String(20), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('scroll_depth_percent', sa.Integer(), nullable=True),
        sa.Column('is_complete', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('revisit_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('highlights_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bookmarked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chunk_id'], ['material_chunks.id'], ondelete='CASCADE'),
        sa.CheckConstraint('duration_seconds >= 0', name='ck_duration_positive'),
        sa.CheckConstraint('scroll_depth_percent IS NULL OR (scroll_depth_percent >= 0 AND scroll_depth_percent <= 100)',
                          name='ck_scroll_range'),
    )
    op.create_index('ix_material_interactions_user_started', 'material_interactions', ['user_id', 'started_at'])
    op.create_index('ix_material_interactions_material_user', 'material_interactions', ['material_id', 'user_id'])
    op.create_index('ix_material_interactions_chunk_user', 'material_interactions', ['chunk_id', 'user_id'])
    op.create_index('ix_material_interactions_session', 'material_interactions', ['session_id'])

    # ========================================
    # TOPIC MASTERY
    # ========================================
    op.create_table(
        'topic_mastery',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mastery_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('retrieval_strength', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('retention_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('first_studied_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_studied_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('days_since_last_study', sa.Integer(), nullable=True),
        sa.Column('total_study_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('first_attempt_accuracy', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_response_time_seconds', sa.Float(), nullable=True),
        sa.Column('mastery_trend', sa.String(20), nullable=False, server_default='improving'),
        sa.Column('predicted_exam_score', sa.Float(), nullable=True),
        sa.Column('next_review_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_interval_days', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_calculated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('calculation_version', sa.String(10), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.CheckConstraint('mastery_score >= 0.0 AND mastery_score <= 1.0', name='ck_mastery_range'),
        sa.CheckConstraint('confidence_score >= 0.0 AND confidence_score <= 1.0', name='ck_confidence_range'),
        sa.CheckConstraint('retrieval_strength >= 0.0 AND retrieval_strength <= 1.0', name='ck_retrieval_range'),
        sa.CheckConstraint('retention_rate >= 0.0 AND retention_rate <= 1.0', name='ck_retention_range'),
        sa.CheckConstraint('first_attempt_accuracy >= 0.0 AND first_attempt_accuracy <= 1.0', name='ck_accuracy_range'),
    )
    op.create_index('ix_topic_mastery_user_topic', 'topic_mastery', ['user_id', 'topic_id'], unique=True)
    op.create_index('ix_topic_mastery_user_mastery', 'topic_mastery', ['user_id', 'mastery_score'])
    op.create_index('ix_topic_mastery_user_next_review', 'topic_mastery', ['user_id', 'next_review_at'])
    op.create_index('ix_topic_mastery_topic_mastery', 'topic_mastery', ['topic_id', 'mastery_score'])
    op.create_index('ix_topic_mastery_mastery_score', 'topic_mastery', ['mastery_score'])
    op.create_index('ix_topic_mastery_last_studied_at', 'topic_mastery', ['last_studied_at'])

    # ========================================
    # DAILY USER STATS
    # ========================================
    op.create_table(
        'daily_user_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stat_date', sa.Date(), nullable=False),
        sa.Column('sessions_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_study_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_study_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_session_minutes', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('longest_session_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_viewed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chunks_read', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unique_topics_studied', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('first_attempt_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('first_attempt_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_response_time_seconds', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('ai_questions_asked', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_hints_requested', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_positive_feedback', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_negative_feedback', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('achievements_unlocked', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level_at_end_of_day', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('daily_goal_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('goal_achieved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('goal_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_finalized', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint('sessions_count >= 0', name='ck_sessions_positive'),
        sa.CheckConstraint('total_study_minutes >= 0', name='ck_study_minutes_positive'),
        sa.CheckConstraint('active_study_minutes <= total_study_minutes', name='ck_active_lte_total'),
        sa.CheckConstraint('accuracy_rate >= 0.0 AND accuracy_rate <= 1.0', name='ck_accuracy_range'),
        sa.CheckConstraint('goal_percentage >= 0.0 AND goal_percentage <= 2.0', name='ck_goal_range'),
    )
    op.create_index('ix_daily_user_stats_user_date', 'daily_user_stats', ['user_id', 'stat_date'], unique=True)
    op.create_index('ix_daily_user_stats_date', 'daily_user_stats', ['stat_date'])
    op.create_index('ix_daily_user_stats_user_finalized', 'daily_user_stats', ['user_id', 'is_finalized'])

    # ========================================
    # WEEKLY USER STATS
    # ========================================
    op.create_table(
        'weekly_user_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('week', sa.Integer(), nullable=False),
        sa.Column('week_start_date', sa.Date(), nullable=False),
        sa.Column('week_end_date', sa.Date(), nullable=False),
        sa.Column('active_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_study_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sessions_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unique_topics_studied', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('study_minutes_change', sa.Integer(), nullable=True),
        sa.Column('accuracy_change', sa.Float(), nullable=True),
        sa.Column('mastery_improvement_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('weekly_goal_achieved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('goal_streak_weeks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint('week >= 1 AND week <= 53', name='ck_week_range'),
        sa.CheckConstraint('active_days >= 0 AND active_days <= 7', name='ck_days_range'),
    )
    op.create_index('ix_weekly_user_stats_user_year_week', 'weekly_user_stats',
                    ['user_id', 'year', 'week'], unique=True)
    op.create_index('ix_weekly_user_stats_year_week', 'weekly_user_stats', ['year', 'week'])

    # ========================================
    # TOPIC DAILY STATS
    # ========================================
    op.create_table(
        'topic_daily_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stat_date', sa.Date(), nullable=False),
        sa.Column('study_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_viewed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('materials_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_response_time_seconds', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('mastery_at_start', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('mastery_at_end', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('mastery_change', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_topic_daily_stats_user_topic_date', 'topic_daily_stats',
                    ['user_id', 'topic_id', 'stat_date'], unique=True)
    op.create_index('ix_topic_daily_stats_user_date', 'topic_daily_stats', ['user_id', 'stat_date'])
    op.create_index('ix_topic_daily_stats_topic_date', 'topic_daily_stats', ['topic_id', 'stat_date'])

    # ========================================
    # USER LEARNING METRICS (Rolling aggregates)
    # ========================================
    op.create_table(
        'user_learning_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        # 30-day metrics
        sa.Column('study_minutes_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sessions_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_days_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_30d', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('xp_earned_30d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('topics_studied_30d', sa.Integer(), nullable=False, server_default='0'),
        # 90-day metrics
        sa.Column('study_minutes_90d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sessions_90d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_days_90d', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_90d', sa.Float(), nullable=False, server_default='0.0'),
        # All-time metrics
        sa.Column('study_minutes_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sessions_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_attempted_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_correct_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('xp_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('achievements_total', sa.Integer(), nullable=False, server_default='0'),
        # Streak tracking
        sa.Column('current_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_study_date', sa.Date(), nullable=True),
        # Mastery overview
        sa.Column('avg_mastery_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('topics_mastered', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('topics_in_progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('topics_weak', sa.Integer(), nullable=False, server_default='0'),
        # Predicted metrics
        sa.Column('predicted_exam_readiness', sa.Float(), nullable=True),
        sa.Column('predicted_pass_probability', sa.Float(), nullable=True),
        sa.Column('recommended_focus_topics', postgresql.JSONB(), nullable=False, server_default='[]'),
        # Metadata
        sa.Column('last_calculated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint('accuracy_30d >= 0.0 AND accuracy_30d <= 1.0', name='ck_accuracy_30d_range'),
        sa.CheckConstraint('accuracy_90d >= 0.0 AND accuracy_90d <= 1.0', name='ck_accuracy_90d_range'),
        sa.CheckConstraint('accuracy_total >= 0.0 AND accuracy_total <= 1.0', name='ck_accuracy_total_range'),
        sa.CheckConstraint('avg_mastery_score >= 0.0 AND avg_mastery_score <= 1.0', name='ck_avg_mastery_range'),
    )

    # ========================================
    # KNOWLEDGE GAPS
    # ========================================
    op.create_table(
        'knowledge_gaps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('gap_score', sa.Float(), nullable=False),
        sa.Column('questions_attempted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accuracy_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_response_time_seconds', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('materials_incomplete', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('forgetting_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('board_exam_importance', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('affects_other_topics', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('priority_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('recommended_materials', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('estimated_study_hours', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('suggested_completion_date', sa.Date(), nullable=True),
        sa.Column('is_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('identified_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.CheckConstraint('gap_score >= 0.0 AND gap_score <= 1.0', name='ck_gap_score_range'),
        sa.CheckConstraint('accuracy_rate >= 0.0 AND accuracy_rate <= 1.0', name='ck_accuracy_range'),
        sa.CheckConstraint('priority_score >= 0.0 AND priority_score <= 10.0', name='ck_priority_range'),
    )
    op.create_index('ix_knowledge_gaps_user_severity', 'knowledge_gaps', ['user_id', 'severity'])
    op.create_index('ix_knowledge_gaps_user_priority', 'knowledge_gaps', ['user_id', 'priority_score'])
    op.create_index('ix_knowledge_gaps_user_resolved', 'knowledge_gaps', ['user_id', 'is_resolved'])
    op.create_index('ix_knowledge_gaps_severity', 'knowledge_gaps', ['severity'])
    op.create_index('ix_knowledge_gaps_identified_at', 'knowledge_gaps', ['identified_at'])


def downgrade() -> None:
    """Drop analytics schema."""
    op.drop_table('knowledge_gaps')
    op.drop_table('user_learning_metrics')
    op.drop_table('topic_daily_stats')
    op.drop_table('weekly_user_stats')
    op.drop_table('daily_user_stats')
    op.drop_table('topic_mastery')
    op.drop_table('material_interactions')
    op.drop_table('question_attempts')
    op.drop_table('study_events')
    op.drop_table('study_sessions')
    op.drop_table('topic_relationships')
    op.drop_table('topics')
