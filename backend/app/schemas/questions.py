from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MCQOption(BaseModel):
    text: str


class QuestionResponse(BaseModel):
    id: UUID
    topic: str
    stem: str
    options: List[MCQOption]
    difficulty: int

    class Config:
        from_attributes = True


class GenerateQuestionsRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    difficulty: int = Field(ge=1, le=5, default=3)
    num_questions: int = Field(ge=1, le=10, default=5)
    use_context: bool = Field(default=True)


class GenerateQuestionsResponse(BaseModel):
    questions: List[QuestionResponse]


class AnswerQuestionRequest(BaseModel):
    chosen_index: int = Field(ge=0, le=3)
    time_seconds: Optional[int] = Field(default=None, ge=0)


class AnswerQuestionResponse(BaseModel):
    correct: bool
    explanation: str
    xp_earned: int
    fsrs_card_id: Optional[UUID] = None

