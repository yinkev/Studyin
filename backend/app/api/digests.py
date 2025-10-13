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
    text = "".join(text_chunks)
    # naive parse
    import json
    try:
        if "```json" in text:
            text = text.split("```json")[1].split("```", 1)[0]
        data = json.loads(text)
    except Exception:
        data = {
            "title": "Today’s Digest",
            "bullets": ["Review core mechanisms", "Practice 2 MCQs", "Reflect with a 2‑sentence summary"],
            "mini_case": text[:400],
            "mnemonic": "FOCUS: Facts, Organize, Curate, Understand, Summarize",
        }
    return data

