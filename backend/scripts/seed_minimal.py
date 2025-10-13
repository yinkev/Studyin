from __future__ import annotations

"""
Seed a minimal local dataset for StudyIn development.

Creates:
- users: hardcoded demo user (id=00000000-0000-0000-0000-000000000001)
- materials: one sample text file owned by the demo user
- material_chunks: 3 small chunks from the sample text
- embeddings: stores chunk embeddings in Chroma if GEMINI_API_KEY is set

Safe to run multiple times (idempotent-ish):
- Will create tables if missing
- Will upsert chunks in the vector store
"""

import asyncio
import os
import textwrap
import uuid
from pathlib import Path

import sys
sys.path.append(str(Path(__file__).resolve().parents[1]))  # add backend/ to import path

from app.api.deps import HARDCODED_USER_ID, HARDCODED_USER_EMAIL  # type: ignore
from app.core.password import hash_password  # type: ignore
from app.db.session import engine, SessionLocal  # type: ignore
from app.models.base import Base  # type: ignore
from app.models.material import Material  # type: ignore
from app.models.chunk import MaterialChunk  # type: ignore
from app.models.user import User  # type: ignore
from app.config import settings  # type: ignore


SAMPLE_TEXT = textwrap.dedent(
    """
    Renal Physiology – Glomerular Filtration Overview

    The nephron filters blood plasma in the glomerulus, producing an ultrafiltrate that flows into the tubule. Filtration is driven by Starling forces across the filtration barrier.

    Key determinants include hydrostatic pressure in the glomerular capillaries (PGC), hydrostatic pressure in Bowman’s space (PBS), and oncotic pressure in the glomerular capillaries (πGC). Changes in afferent/efferent arteriole tone alter GFR.

    Clinical correlation: Constriction of the afferent arteriole decreases renal plasma flow and GFR; constriction of the efferent arteriole decreases renal plasma flow but may transiently increase GFR.
    """
).strip()


async def create_tables_if_missing() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def ensure_demo_user(session) -> User:
    user = await session.get(User, HARDCODED_USER_ID)
    if user:
        return user
    user = User(
        id=HARDCODED_USER_ID,
        email=HARDCODED_USER_EMAIL,
        password_hash=hash_password("demo-password-not-for-production"),
    )
    session.add(user)
    await session.commit()
    return user


def chunk_text(text: str) -> list[str]:
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    return parts[:3] if parts else [text[:500]]


async def seed_materials(session) -> None:
    uploads_dir = Path(settings.UPLOAD_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    sample_path = uploads_dir / "sample_renal_physiology.txt"
    sample_path.write_text(SAMPLE_TEXT)

    user = await ensure_demo_user(session)

    # Upsert material by filename for the demo user
    from sqlalchemy import select

    existing = await session.execute(
        select(Material).where(Material.user_id == user.id, Material.filename == sample_path.name)
    )
    material = existing.scalar_one_or_none()
    if not material:
        material = Material(
            user_id=user.id,
            filename=sample_path.name,
            file_path=str(sample_path),
            file_size=len(SAMPLE_TEXT.encode("utf-8")),
            file_type="text/plain",
            processing_status="complete",
        )
        session.add(material)
        await session.flush()

    # Ensure chunks
    pieces = chunk_text(SAMPLE_TEXT)
    from sqlalchemy import select as _select
    result = await session.execute(
        _select(MaterialChunk).where(MaterialChunk.material_id == material.id)
    )
    rows = result.scalars().all()
    existing_chunks = {c.chunk_index: c for c in rows}
    for idx, piece in enumerate(pieces):
        if idx in existing_chunks:
            existing_chunks[idx].content = piece
        else:
            session.add(MaterialChunk(material_id=material.id, content=piece, chunk_index=idx))

    await session.commit()

    # Store embeddings if configured
    try:
        if not settings.GEMINI_API_KEY:
            print("[seed] GEMINI_API_KEY not set; skipping embeddings. RAG retrieval will be sparse.")
            return
        from app.services.embedding_service import get_embedding_service

        # Pull chunk data into plain Python; then embed outside DB ops
        result = await session.execute(
            _select(MaterialChunk.id, MaterialChunk.content, MaterialChunk.chunk_index)
            .where(MaterialChunk.material_id == material.id)
        )
        chunk_rows = [(str(i), c, int(idx)) for (i, c, idx) in result.all()]

        svc = get_embedding_service()
        for chunk_id, content, idx in chunk_rows:
            svc.store_chunk_embedding(
                chunk_id=chunk_id,
                text=content,
                metadata={
                    "material_id": str(material.id),
                    "chunk_index": idx,
                },
            )
        print("[seed] Stored embeddings for", len(material.chunks), "chunks.")
    except Exception as e:
        print("[seed] Skipped embeddings:", e)


async def main() -> None:
    await create_tables_if_missing()
    async with SessionLocal() as session:
        await seed_materials(session)


if __name__ == "__main__":
    asyncio.run(main())
