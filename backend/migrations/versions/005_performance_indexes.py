from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes to ai_coach_metrics and gamification_stats
    op.create_index('idx_ai_metrics_user_id', 'ai_coach_metrics', ['user_id'])
    op.create_index('idx_ai_metrics_conversation_id', 'ai_coach_metrics', ['conversation_id'])
    op.create_index('idx_ai_metrics_user_conversation', 'ai_coach_metrics', ['user_id', 'conversation_id'])

    op.create_index('idx_gamification_user_id', 'gamification_stats', ['user_id'])
    op.create_index('idx_gamification_level', 'gamification_stats', ['current_level'])
    op.create_index('idx_gamification_last_activity', 'gamification_stats', ['last_activity_date'])


def downgrade() -> None:
    # Drop gamification indexes
    op.drop_index('idx_gamification_last_activity', 'gamification_stats')
    op.drop_index('idx_gamification_level', 'gamification_stats')
    op.drop_index('idx_gamification_user_id', 'gamification_stats')

    # Drop ai_coach_metrics indexes
    op.drop_index('idx_ai_metrics_user_conversation', 'ai_coach_metrics')
    op.drop_index('idx_ai_metrics_conversation_id', 'ai_coach_metrics')
    op.drop_index('idx_ai_metrics_user_id', 'ai_coach_metrics')

