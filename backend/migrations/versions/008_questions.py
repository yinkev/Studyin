"""Questions and attempts tables

Revision ID: 008_questions
Revises: 007_insights
Create Date: 2025-10-13
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = '008_questions'
down_revision = '007_insights'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'questions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('topic', sa.String(length=200), nullable=False),
        sa.Column('stem', sa.Text(), nullable=False),
        sa.Column('options', JSONB(), nullable=False),
        sa.Column('correct_index', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_questions_user_topic', 'questions', ['user_id', 'topic'])

    op.create_table(
        'question_attempts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('question_id', UUID(as_uuid=True), sa.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('chosen_index', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('time_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_attempts_user_question', 'question_attempts', ['user_id', 'question_id'])


def downgrade() -> None:
    op.drop_index('ix_attempts_user_question', table_name='question_attempts')
    op.drop_table('question_attempts')
    op.drop_index('ix_questions_user_topic', table_name='questions')
    op.drop_table('questions')

