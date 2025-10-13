"""Create insights table for saved notes

Revision ID: 007_insights
Revises: 006_fsrs_spaced_repetition
Create Date: 2025-10-13
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = '007_insights'
down_revision = '006_fsrs_spaced_repetition'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'insights',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('source', sa.String(length=16), nullable=False, server_default='chat'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tags', JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('metadata', JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    # GIN index for tags searching
    op.create_index('ix_insights_tags', 'insights', ['tags'], postgresql_using='gin')
    op.create_index('ix_insights_user_id', 'insights', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_insights_user_id', table_name='insights')
    op.drop_index('ix_insights_tags', table_name='insights')
    op.drop_table('insights')

