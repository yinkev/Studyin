"""Pydantic schemas for FSRS API endpoints.

Request and response models for the spaced repetition API.
"""

from __future__ import annotations

import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# Request schemas

class CreateCardRequest(BaseModel):
    """Request to create a new FSRS card."""

    chunk_id: Optional[UUID] = Field(None, description="Material chunk ID to review")
    topic_id: Optional[UUID] = Field(None, description="Topic ID to review")
    flashcard_content: Optional[str] = Field(
        None,
        description="Custom flashcard content",
        max_length=5000
    )
    initial_due_date: Optional[datetime.datetime] = Field(
        None,
        description="When to first review (defaults to now)"
    )

    @field_validator("flashcard_content")
    @classmethod
    def validate_content(cls, v: Optional[str], info) -> Optional[str]:
        values = info.data
        if not any([values.get("chunk_id"), values.get("topic_id"), v]):
            raise ValueError("Must provide chunk_id, topic_id, or flashcard_content")
        return v


class SubmitReviewRequest(BaseModel):
    """Request to submit a review."""

    rating: int = Field(..., ge=1, le=4, description="1=Again, 2=Hard, 3=Good, 4=Easy")
    review_duration_seconds: Optional[float] = Field(
        None,
        ge=0,
        description="How long review took in seconds"
    )


class GetDueCardsRequest(BaseModel):
    """Query parameters for getting due cards."""

    limit: int = Field(20, ge=1, le=100, description="Max cards to return")
    topic_id: Optional[UUID] = Field(None, description="Filter by topic")
    include_new: bool = Field(True, description="Include new cards")


class OptimizeParametersRequest(BaseModel):
    """Request to optimize FSRS parameters."""

    topic_id: Optional[UUID] = Field(None, description="Optimize for specific topic")
    min_reviews: int = Field(
        100,
        ge=50,
        le=10000,
        description="Minimum reviews required"
    )


# Response schemas

class FSRSCardResponse(BaseModel):
    """FSRS card response."""

    id: UUID
    user_id: UUID
    chunk_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    flashcard_content: Optional[str] = None

    # Content fields (populated from chunk/topic)
    question: Optional[str] = Field(
        None,
        description="Question text for the flashcard"
    )
    answer: Optional[str] = Field(
        None,
        description="Answer text for the flashcard"
    )
    content_preview: Optional[str] = Field(
        None,
        description="Preview of the content (truncated if long)",
        max_length=200
    )
    content_source: Optional[str] = Field(
        None,
        description="Source of content: 'chunk', 'topic', or 'custom'"
    )

    # FSRS state
    difficulty: float
    stability: float
    retrievability: float
    state: str

    # Scheduling
    due_date: datetime.datetime
    last_review: Optional[datetime.datetime] = None
    elapsed_days: int
    scheduled_days: int

    # Statistics
    reps: int
    lapses: int
    consecutive_correct: int
    average_response_time_seconds: Optional[float] = None

    # Timestamps
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class ReviewLogResponse(BaseModel):
    """Review log response."""

    id: UUID
    card_id: UUID
    rating: int
    review_duration_seconds: Optional[float]
    reviewed_at: datetime.datetime

    # State changes
    state_before: str
    state_after: str
    difficulty_before: float
    difficulty_after: float
    stability_before: float
    stability_after: float

    # Scheduling
    scheduled_days: int
    elapsed_days: int

    model_config = {"from_attributes": True}


class FSRSParametersResponse(BaseModel):
    """FSRS parameters response."""

    id: UUID
    user_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    parameters: dict
    version: str
    optimized: bool
    sample_size: int
    loss: Optional[float] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class DueCardsResponse(BaseModel):
    """Response for due cards query."""

    cards: list[FSRSCardResponse]
    total_count: int
    has_more: bool


class RetentionPredictionResponse(BaseModel):
    """Response for retention prediction."""

    card_id: UUID
    retention_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Predicted probability of successful recall"
    )
    days_since_review: Optional[int] = None
    stability_days: float
    optimal_review_date: datetime.datetime


class UpcomingReviewsResponse(BaseModel):
    """Response for upcoming review schedule."""

    schedule: dict[str, int] = Field(
        ...,
        description="Map of date (YYYY-MM-DD) to review count"
    )
    total_reviews: int
    days_ahead: int


class CardStatsResponse(BaseModel):
    """Response for card statistics."""

    total_cards: int
    due_today: int
    new: int
    learning: int
    review: int
    relearning: int
    average_stability_days: float
    total_reviews: int
    cards_by_state: dict[str, int]


class BulkCreateCardsRequest(BaseModel):
    """Request to bulk create cards."""

    chunk_ids: list[UUID] = Field(
        default_factory=list,
        description="List of chunk IDs to create cards for"
    )
    topic_ids: list[UUID] = Field(
        default_factory=list,
        description="List of topic IDs to create cards for"
    )
    initial_due_date: Optional[datetime.datetime] = Field(
        None,
        description="When to first review all cards"
    )

    @field_validator("chunk_ids", "topic_ids")
    @classmethod
    def validate_not_empty(cls, v: list, info) -> list:
        values = info.data
        if not v and not values.get("chunk_ids") and not values.get("topic_ids"):
            raise ValueError("Must provide at least one chunk_id or topic_id")
        return v


class BulkCreateCardsResponse(BaseModel):
    """Response for bulk card creation."""

    created_count: int
    skipped_count: int = Field(
        0,
        description="Cards that already existed"
    )
    cards: list[FSRSCardResponse]


class ReviewSuccessResponse(BaseModel):
    """Response after successful review submission."""

    card: FSRSCardResponse
    next_review_date: datetime.datetime
    interval_days: int
    retention_probability: float
    xp_earned: int = Field(0, description="XP earned from review")
    streak_maintained: bool = Field(False, description="Whether streak was maintained")


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
