from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_demo, get_db
from app.models.user import User
from app.models.chunk import MaterialChunk
from app.services.codex_llm import get_codex_llm

router = APIRouter(prefix="/api/digests", tags=["digests"]) 


@router.get("/latest")
async def latest_digest(
    days: int = Query(default=2, ge=1, le=14),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
) -> Dict[str, Any]:
    """Return a quick bite-size digest using recent chunks."""
    since = datetime.utcnow() - timedelta(days=days)
    res = await db.execute(
        select(MaterialChunk)
        .where(MaterialChunk.created_at >= since)
        .order_by(desc(MaterialChunk.created_at))
        .limit(20)
    )
    chunks = res.scalars().all()
    context = "\n\n".join(c.content for c in chunks)

    prompt = f"""Create a bite-size medical study digest for a student.
Context from their materials (last {days} days):\n{context}\n
Output in JSON with keys: title, bullets (array of 3 concise items), mini_case (short paragraph), mnemonic (short)."""
    codex = get_codex_llm()
    text_chunks = []
    async for chunk in codex.generate_completion(prompt, model="gpt-5", temperature=0.5):
        text_chunks.append(chunk)
    text = "".join(text_chunks).strip()
    # Parse JSON if present; otherwise derive deterministically from text (no static placeholders)
    import json, re
    if "{" in text and "}" in text:
        try:
            if "```json" in text:
                text = text.split("```json")[1].split("```", 1)[0]
            data = json.loads(text)
            return data
        except Exception:
            pass

    # Derive bullets and sections from plain text
    # 1) Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    bullets = [s.strip() for s in sentences if len(s.strip()) > 0][:3]
    # 2) Mini-case: take next ~3 sentences
    mini_case = " ".join(sentences[3:6]).strip()[:600]
    # 3) Mnemonic: pick capitalized initials of first bullet’s words up to 6 letters
    words = re.findall(r"[A-Za-z]+", bullets[0] if bullets else "Study Focus")
    initials = "".join(w[0].upper() for w in words[:6]) or "FOCUS"
    mnemonic = initials

    return {
        "title": f"Digest: {topic}",
        "bullets": bullets,
        "mini_case": mini_case,
        "mnemonic": mnemonic,
    }
