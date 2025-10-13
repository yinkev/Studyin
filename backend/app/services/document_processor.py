from __future__ import annotations

import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

try:  # pragma: no cover - dependency guard
    from PyPDF2 import PdfReader
except ImportError as exc:  # pragma: no cover - raised when dependency missing
    raise RuntimeError("PyPDF2 must be installed to extract PDF text.") from exc


def extract_text_from_pdf(file_path: str | Path) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {path}")

    logger.debug("extracting_text_from_pdf", extra={"file_path": str(path)})

    reader = PdfReader(str(path))
    pages = []

    for index, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
        except Exception as exc:  # pragma: no cover - PyPDF2 edge cases
            logger.warning(
                "pdf_page_extraction_failed",
                extra={"file_path": str(path), "page": index, "error": str(exc)},
            )
            page_text = ""
        pages.append(page_text)

    return "\n".join(pages).strip()


def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be a positive integer")

    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    for start_index in range(0, len(words), chunk_size):
        chunk_words = words[start_index : start_index + chunk_size]
        chunk = " ".join(chunk_words).strip()
        if chunk:
            chunks.append(chunk)

    return chunks
