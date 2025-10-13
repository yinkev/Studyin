from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_demo, get_db
from app.models.user import User
from app.services.rag_service import get_rag_service
from app.models.questions import Question
from sqlalchemy import select
from app.services.codex_llm import get_codex_llm

router = APIRouter(prefix="/api/teach", tags=["teach"]) 


@router.post("/first-pass")
async def first_pass(
    topic: str,
    minutes: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
) -> Dict[str, Any]:
    """Return a structured first-pass teaching flow for a topic/material."""
    rag = get_rag_service()
    chunks = await rag.retrieve_context(session=db, user_id=current_user.id, query=topic, top_k=6)
    context_text = "\n\n".join(ch.content for ch in chunks)

    codex = get_codex_llm()
    # Ask for key ideas and quick skim bullets
    teaching = await codex.generate_teaching_response(context=context_text, question=f"Summarize key ideas for a first pass on {topic}.", user_level=3)
    # Generate 2 quick MCQs for comprehension checks
    raw_mcqs = await codex.generate_questions(topic=topic, difficulty=2, num_questions=2, context=context_text)

    # Persist generated MCQs as Questions for tracking/answers
    mcqs = []
    for item in raw_mcqs:
        stem = item.get("question") or item.get("stem")
        options = item.get("options") or []
        correct_index = int(item.get("correct_index", 0))
        explanation = item.get("explanation") or ""
        if not stem or not options or len(options) < 4:
            continue
        q = Question(
            user_id=current_user.id,
            topic=topic,
            stem=str(stem),
            options=[{"text": str(opt)} for opt in options],
            correct_index=correct_index,
            explanation=str(explanation),
            difficulty=2,
        )
        db.add(q)
        await db.flush()
        mcqs.append({
            "id": str(q.id),
            "topic": q.topic,
            "stem": q.stem,
            "options": [o["text"] for o in q.options],
            "correct_index": q.correct_index,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
        })

    await db.commit()

    return {
        "minutes": minutes,
        "topic": topic,
        "skim_bullets": teaching.split("\n")[:6],
        "key_points": teaching,
        "mcqs": mcqs,
        "reflection_prompt": f"In 2-3 sentences, explain the most important mechanism in {topic}.",
        "context_chunks": [c.as_display_dict() for c in chunks],
    }
