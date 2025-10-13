"""create material_chunks table"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = None  # First migration for MVP
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "material_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_material_chunks_material_id", "material_chunks", ["material_id"])
    op.create_unique_constraint(
        "uq_material_chunks_material_id_chunk_index",
        "material_chunks",
        ["material_id", "chunk_index"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_material_chunks_material_id_chunk_index", "material_chunks", type_="unique")
    op.drop_index("ix_material_chunks_material_id", table_name="material_chunks")
    op.drop_table("material_chunks")
