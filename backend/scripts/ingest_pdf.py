from __future__ import annotations

"""
Ingest a PDF into the StudyIn RAG store.

Pipeline:
 1) Extract page text via PyMuPDF (no OCR)
 2) If a page has too little text (threshold), optionally run Tesseract OCR on a rendered page image
 3) Chunk per page (or paragraphs) and store as Material + MaterialChunk rows
 4) Embed each chunk with Gemini text embeddings (gemini-embedding-001) and upsert to Chroma

Usage:
  $ source backend/venv/bin/activate
  $ python scripts/ingest_pdf.py /path/to/lecture.pdf --enable-ocr

Environment required:
  - GEMINI_API_KEY in backend/.env
  - Tesseract installed if --enable-ocr (brew install tesseract)
"""

import argparse
import asyncio
import os
from pathlib import Path
from typing import List

import fitz  # PyMuPDF
from PIL import Image
import pytesseract

from sqlalchemy import select

from app.api.deps import HARDCODED_USER_EMAIL, HARDCODED_USER_ID
from app.core.password import hash_password
from app.db.session import engine, SessionLocal
from app.models.base import Base
from app.models.material import Material
from app.models.chunk import MaterialChunk
from app.models.user import User
from app.config import settings
from app.services.embedding_service import get_embedding_service


def _extract_text_blocks(page: fitz.Page) -> str:
    # Simple extraction; can be enhanced later
    return page.get_text("text") or ""


def _ocr_page(page: fitz.Page, dpi: int = 300) -> str:
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    # Tesseract settings: LSTM engine, block of text; tweak later for labels
    config = "--oem 1 --psm 6 -l eng+equ"
    try:
        text = pytesseract.image_to_string(img, config=config)
    except Exception as exc:
        print("[ingest] OCR error:", exc)
        text = ""
    return text


def _chunk_text(text: str, max_chars: int = 1200) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    buf = ""
    for p in paragraphs:
        if len(buf) + len(p) + 2 <= max_chars:
            buf = (buf + "\n\n" + p) if buf else p
        else:
            if buf:
                chunks.append(buf)
            buf = p
    if buf:
        chunks.append(buf)
    return chunks


async def _ensure_demo_user(session) -> User:
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


async def ingest_pdf(path: Path, enable_ocr: bool = False) -> None:
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        user = await _ensure_demo_user(session)

        uploads_dir = Path(settings.UPLOAD_DIR)
        uploads_dir.mkdir(parents=True, exist_ok=True)

        # Upsert material by filename
        stmt = select(Material).where(Material.user_id == user.id, Material.filename == path.name)
        existing = await session.execute(stmt)
        material = existing.scalar_one_or_none()
        if not material:
            material = Material(
                user_id=user.id,
                filename=path.name,
                file_path=str(path.resolve()),
                file_size=path.stat().st_size,
                file_type="application/pdf",
                processing_status="complete",
            )
            session.add(material)
            await session.flush()

        doc = fitz.open(path)
        total_chunks = 0
        svc = get_embedding_service()

        for page_index in range(len(doc)):
            page = doc[page_index]
            text = _extract_text_blocks(page)

            if enable_ocr and len(text.strip()) < 40:
                ocr_text = _ocr_page(page)
                if len(ocr_text.strip()) > len(text.strip()):
                    text = (text + "\n\n" + ocr_text).strip()

            chunks = _chunk_text(text)
            if not chunks:
                continue

            # Ensure chunk rows exist / update
            # Refresh material to load relationship
            await session.refresh(material)
            existing_by_index = {c.chunk_index: c for c in material.chunks}
            base_idx = max(existing_by_index.keys(), default=-1) + 1

            for offset, chunk_text in enumerate(chunks):
                idx = base_idx + offset
                if idx in existing_by_index:
                    existing_by_index[idx].content = chunk_text
                else:
                    session.add(MaterialChunk(material_id=material.id, content=chunk_text, chunk_index=idx))
                total_chunks += 1
            await session.commit()

            # After commit, re-query chunks for IDs, then embed
            await session.refresh(material)
            for chunk in material.chunks:
                if chunk.content in chunks:  # simple heuristic to avoid re-embedding everything
                    svc.store_chunk_embedding(
                        chunk_id=str(chunk.id),
                        text=chunk.content,
                        metadata={
                            "material_id": str(material.id),
                            "chunk_index": int(chunk.chunk_index),
                            "filename": material.filename,
                        },
                    )

        print(f"[ingest] Ingested {total_chunks} chunks from {path.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest a PDF into StudyIn RAG store")
    parser.add_argument("pdf", type=str, help="Path to PDF file")
    parser.add_argument("--enable-ocr", action="store_true", help="Run Tesseract OCR on low-text pages")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        raise SystemExit(f"File not found: {pdf_path}")

    asyncio.run(ingest_pdf(pdf_path, enable_ocr=args.enable_ocr))


if __name__ == "__main__":
    main()

