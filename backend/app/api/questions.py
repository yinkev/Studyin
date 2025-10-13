from __future__ import annotations

import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_demo, get_db
from app.models.user import User
from app.models.questions import Question, QuestionAttempt
from app.schemas.questions import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionResponse,
    AnswerQuestionRequest,
    AnswerQuestionResponse,
)
from app.services.codex_llm import get_codex_llm
from app.services.rag_service import get_rag_service
from app.services.analytics.tracker import AnalyticsTracker
from app.services.fsrs_service import FSRSService

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.post("/generate", response_model=GenerateQuestionsResponse)
async def generate_questions(
    payload: GenerateQuestionsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    """Generate NBME-style questions using Codex + optional RAG context."""
    ctx_text = None
    if payload.use_context:
        rag = get_rag_service()
        chunks = await rag.retrieve_context(session=db, user_id=current_user.id, query=payload.topic, top_k=4)
        ctx_text = "\n\n".join(ch.content for ch in chunks)

    codex = get_codex_llm()
    raw_questions = await codex.generate_questions(
        topic=payload.topic,
        difficulty=payload.difficulty,
        num_questions=payload.num_questions,
        context=ctx_text,
    )

    questions: List[QuestionResponse] = []
    for item in raw_questions:
        # Normalize structure
        stem = item.get("question") or item.get("stem")
        options = item.get("options") or []
        correct_index = int(item.get("correct_index", 0))
        explanation = item.get("explanation") or ""
        if not stem or not options or len(options) < 4:
            # Skip malformed
            continue

        q = Question(
            user_id=current_user.id,
            topic=payload.topic,
            stem=str(stem),
            options=[{"text": str(opt)} for opt in options],
            correct_index=correct_index,
            explanation=str(explanation),
            difficulty=payload.difficulty,
        )
        db.add(q)
        await db.flush()
        questions.append(
            QuestionResponse.model_validate(
                {
                    "id": q.id,
                    "topic": q.topic,
                    "stem": q.stem,
                    "options": q.options,
                    "difficulty": q.difficulty,
                }
            )
        )

    await db.commit()
    return GenerateQuestionsResponse(questions=questions)


@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    res = await db.execute(select(Question).where(Question.user_id == current_user.id).order_by(Question.created_at.desc()).limit(50))
    rows = res.scalars().all()
    return [
        QuestionResponse.model_validate(
            {
                "id": q.id,
                "topic": q.topic,
                "stem": q.stem,
                "options": q.options,
                "difficulty": q.difficulty,
            }
        )
        for q in rows
    ]


@router.post("/{question_id}/answer", response_model=AnswerQuestionResponse)
async def answer_question(
    question_id: uuid.UUID,
    payload: AnswerQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
):
    q = await db.get(Question, question_id)
    if not q or q.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = int(payload.chosen_index) == int(q.correct_index)
    attempt = QuestionAttempt(
        user_id=current_user.id,
        question_id=q.id,
        chosen_index=payload.chosen_index,
        is_correct=is_correct,
        time_seconds=payload.time_seconds,
    )
    db.add(attempt)

    # Simple XP: base 10, difficulty multiplier
    xp_earned = (10 + (q.difficulty - 3) * 2) * (2 if is_correct else 1)

    # Optionally create an FSRS card when user answers (correct or incorrect)
    fsrs_card_id = None
    try:
        fsrs = FSRSService(db)
        # Build flashcard content from question and explanation
        flash = f"Q: {q.stem}\nA: {q.explanation}"
        card = await fsrs.create_card(user_id=current_user.id, flashcard_content=flash)
        fsrs_card_id = card.id
    except Exception:
        fsrs_card_id = None

    # Track analytics
    tracker = AnalyticsTracker(db)
    try:
        await tracker.track_event(
            user_id=current_user.id,
            event_type="question_attempt",
            properties={
                "question_id": str(q.id),
                "topic": q.topic,
                "is_correct": is_correct,
                "difficulty": q.difficulty,
                "time_seconds": payload.time_seconds,
                "xp_earned": xp_earned,
            },
        )
    except Exception:
        pass

    await db.commit()
    return AnswerQuestionResponse(
        correct=is_correct,
        explanation=q.explanation,
        xp_earned=int(xp_earned),
        fsrs_card_id=fsrs_card_id,
    )
