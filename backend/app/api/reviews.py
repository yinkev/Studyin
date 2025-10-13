"""FSRS Review API endpoints.

Endpoints for spaced repetition scheduling:
- GET /api/reviews/due - Get cards due for review
- POST /api/reviews/{card_id} - Submit review
- GET /api/reviews/schedule - View upcoming reviews
- GET /api/reviews/retention/{card_id} - Predict retention
- POST /api/reviews/cards - Create new review card
- POST /api/reviews/cards/bulk - Bulk create cards
- GET /api/reviews/stats - User statistics
- POST /api/reviews/optimize - Optimize parameters
"""

from __future__ import annotations

import datetime
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_or_demo as get_current_user, get_db
from app.models.user import User
from app.schemas.fsrs import (
    BulkCreateCardsRequest,
    BulkCreateCardsResponse,
    CardStatsResponse,
    CreateCardRequest,
    DueCardsResponse,
    ErrorResponse,
    FSRSCardResponse,
    GetDueCardsRequest,
    OptimizeParametersRequest,
    FSRSParametersResponse,
    RetentionPredictionResponse,
    ReviewSuccessResponse,
    SubmitReviewRequest,
    UpcomingReviewsResponse,
)
from app.services.fsrs_service import FSRSService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("/due", response_model=DueCardsResponse)
async def get_due_cards(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    topic_id: Annotated[UUID | None, Query()] = None,
    include_new: Annotated[bool, Query()] = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DueCardsResponse:
    """Get cards due for review.

    Returns cards that are due or overdue for review, ordered by priority
    (most overdue and weakest memories first).

    Args:
        limit: Maximum number of cards to return (1-100)
        topic_id: Optional filter by specific topic
        include_new: Whether to include new (never reviewed) cards
        db: Database session
        current_user: Authenticated user

    Returns:
        DueCardsResponse with list of cards and metadata
    """
    service = FSRSService(db)

    cards = await service.get_due_cards(
        user_id=current_user.id,
        limit=limit,
        topic_id=topic_id,
        include_new=include_new,
    )

    # Convert to response models
    card_responses = [FSRSCardResponse.model_validate(card) for card in cards]

    # Check if there are more cards beyond the limit
    has_more = len(cards) == limit

    return DueCardsResponse(
        cards=card_responses,
        total_count=len(card_responses),
        has_more=has_more,
    )


@router.get("/count")
async def count_due_cards(
    include_new: Annotated[bool, Query()] = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return total number of cards currently due.

    Optimized count query separate from the list endpoint.
    """
    from sqlalchemy import select, and_
    from app.models.fsrs import FSRSCard

    now = datetime.datetime.now(datetime.UTC)
    conditions = [FSRSCard.user_id == current_user.id, FSRSCard.due_date <= now]
    if not include_new:
        conditions.append(FSRSCard.state != "new")

    stmt = select(FSRSCard.id).where(and_(*conditions))
    result = await db.execute(stmt)
    count = len(result.scalars().all())
    return {"due": count}


@router.post("/{card_id}", response_model=ReviewSuccessResponse)
async def submit_review(
    card_id: UUID,
    review: SubmitReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewSuccessResponse:
    """Submit a review for a card.

    Updates the card's memory state using FSRS algorithm and schedules
    the next review. Also updates topic mastery and awards XP.

    Args:
        card_id: UUID of card being reviewed
        review: Review data (rating, duration)
        db: Database session
        current_user: Authenticated user

    Returns:
        ReviewSuccessResponse with updated card and gamification data

    Raises:
        HTTPException: If card not found or doesn't belong to user
    """
    service = FSRSService(db)

    try:
        # Submit review and update card
        card = await service.schedule_review(
            card_id=card_id,
            rating=review.rating,
            review_duration_seconds=review.review_duration_seconds,
        )

        # Verify card belongs to user
        if card.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Card does not belong to current user",
            )

        # Calculate XP earned (basic implementation - can be enhanced)
        xp_earned = _calculate_xp(
            rating=review.rating,
            card_state=card.state,
            consecutive_correct=card.consecutive_correct,
        )

        # Calculate retention probability
        retention = await service.predict_retention(card_id)

        return ReviewSuccessResponse(
            card=FSRSCardResponse.model_validate(card),
            next_review_date=card.due_date,
            interval_days=card.scheduled_days,
            retention_probability=retention,
            xp_earned=xp_earned,
            streak_maintained=True,  # TODO: Integrate with streak system
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to submit review for card {card_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process review",
        )


@router.get("/schedule", response_model=UpcomingReviewsResponse)
async def get_upcoming_reviews(
    days_ahead: Annotated[int, Query(ge=1, le=30)] = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UpcomingReviewsResponse:
    """Get upcoming review schedule.

    Returns a calendar of reviews scheduled for the next N days.
    Useful for visualizing review load and planning study time.

    Args:
        days_ahead: Number of days to look ahead (1-30)
        db: Database session
        current_user: Authenticated user

    Returns:
        UpcomingReviewsResponse with schedule by date
    """
    service = FSRSService(db)

    schedule = await service.get_upcoming_reviews(
        user_id=current_user.id,
        days_ahead=days_ahead,
    )

    # Convert dates to strings for JSON serialization
    schedule_str = {date.isoformat(): count for date, count in schedule.items()}

    total_reviews = sum(schedule.values())

    return UpcomingReviewsResponse(
        schedule=schedule_str,
        total_reviews=total_reviews,
        days_ahead=days_ahead,
    )


@router.get("/retention/{card_id}", response_model=RetentionPredictionResponse)
async def predict_card_retention(
    card_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetentionPredictionResponse:
    """Predict current retention probability for a card.

    Uses the FSRS memory model to estimate the probability of successful
    recall at the current time. Useful for deciding whether to review early.

    Args:
        card_id: UUID of card
        db: Database session
        current_user: Authenticated user

    Returns:
        RetentionPredictionResponse with retention probability

    Raises:
        HTTPException: If card not found or doesn't belong to user
    """
    service = FSRSService(db)

    try:
        retention = await service.predict_retention(card_id)

        # Get card details
        from sqlalchemy import select
        from app.models.fsrs import FSRSCard

        stmt = select(FSRSCard).where(FSRSCard.id == card_id)
        result = await db.execute(stmt)
        card = result.scalar_one_or_none()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card not found",
            )

        if card.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Card does not belong to current user",
            )

        days_since_review = None
        if card.last_review:
            days_since_review = (
                datetime.datetime.now(datetime.UTC) - card.last_review
            ).days

        # Calculate optimal review date (when retention drops to ~90%)
        # R = 0.9^(t/S), solve for t when R = 0.9
        optimal_review_date = card.last_review + datetime.timedelta(days=card.stability) if card.last_review else datetime.datetime.now(datetime.UTC)

        return RetentionPredictionResponse(
            card_id=card_id,
            retention_probability=retention,
            days_since_review=days_since_review,
            stability_days=card.stability,
            optimal_review_date=optimal_review_date,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to predict retention for card {card_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate retention",
        )


@router.post("/cards", response_model=FSRSCardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
    request: CreateCardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FSRSCardResponse:
    """Create a new review card.

    Creates a card linked to a material chunk, topic, or custom flashcard.
    New cards are due immediately by default.

    Args:
        request: Card creation data
        db: Database session
        current_user: Authenticated user

    Returns:
        FSRSCardResponse with created card

    Raises:
        HTTPException: If creation fails or validation error
    """
    service = FSRSService(db)

    try:
        card = await service.create_card(
            user_id=current_user.id,
            chunk_id=request.chunk_id,
            topic_id=request.topic_id,
            flashcard_content=request.flashcard_content,
            initial_due_date=request.initial_due_date,
        )

        return FSRSCardResponse.model_validate(card)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to create card: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create card",
        )


@router.post("/cards/bulk", response_model=BulkCreateCardsResponse, status_code=status.HTTP_201_CREATED)
async def bulk_create_cards(
    request: BulkCreateCardsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BulkCreateCardsResponse:
    """Bulk create review cards.

    Create multiple cards at once from lists of chunk IDs and topic IDs.
    Skips cards that already exist for the user.

    Args:
        request: Bulk creation data
        db: Database session
        current_user: Authenticated user

    Returns:
        BulkCreateCardsResponse with created cards count
    """
    service = FSRSService(db)

    created_cards = []
    skipped_count = 0

    # Create cards for chunks
    for chunk_id in request.chunk_ids:
        try:
            card = await service.create_card(
                user_id=current_user.id,
                chunk_id=chunk_id,
                initial_due_date=request.initial_due_date,
            )
            created_cards.append(card)
        except Exception as e:
            logger.warning(f"Skipped creating card for chunk {chunk_id}: {e}")
            skipped_count += 1

    # Create cards for topics
    for topic_id in request.topic_ids:
        try:
            card = await service.create_card(
                user_id=current_user.id,
                topic_id=topic_id,
                initial_due_date=request.initial_due_date,
            )
            created_cards.append(card)
        except Exception as e:
            logger.warning(f"Skipped creating card for topic {topic_id}: {e}")
            skipped_count += 1

    card_responses = [FSRSCardResponse.model_validate(card) for card in created_cards]

    return BulkCreateCardsResponse(
        created_count=len(created_cards),
        skipped_count=skipped_count,
        cards=card_responses,
    )


@router.get("/stats", response_model=CardStatsResponse)
async def get_card_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CardStatsResponse:
    """Get card statistics for current user.

    Returns overview of user's card collection including counts by state,
    due cards, average stability, and total reviews.

    Args:
        db: Database session
        current_user: Authenticated user

    Returns:
        CardStatsResponse with statistics
    """
    service = FSRSService(db)

    stats = await service.get_card_stats(user_id=current_user.id)

    return CardStatsResponse(**stats)


@router.post("/optimize", response_model=FSRSParametersResponse)
async def optimize_parameters(
    request: OptimizeParametersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FSRSParametersResponse:
    """Optimize FSRS parameters from review history.

    Analyzes the user's review history to tune the FSRS algorithm for their
    specific learning patterns. Requires minimum number of reviews (default 100).

    Personalized parameters typically improve prediction accuracy by 5-10%.

    Args:
        request: Optimization parameters
        db: Database session
        current_user: Authenticated user

    Returns:
        FSRSParametersResponse with optimized parameters

    Raises:
        HTTPException: If insufficient review data
    """
    service = FSRSService(db)

    try:
        params = await service.optimize_parameters(
            user_id=current_user.id,
            topic_id=request.topic_id,
            min_reviews=request.min_reviews,
        )

        if not params:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient review data. Need at least {request.min_reviews} reviews.",
            )

        return FSRSParametersResponse.model_validate(params)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to optimize parameters: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize parameters",
        )


def _calculate_xp(rating: int, card_state: str, consecutive_correct: int) -> int:
    """Calculate XP earned from a review.

    XP formula:
    - Base XP: 10 points
    - Rating bonus: +0 (Again), +5 (Hard), +10 (Good), +20 (Easy)
    - State bonus: +5 (learning), +10 (review), +15 (relearning)
    - Streak bonus: +2 per consecutive correct (max +20)

    Args:
        rating: Review rating (1-4)
        card_state: Card state (new, learning, review, relearning)
        consecutive_correct: Number of consecutive correct reviews

    Returns:
        XP earned
    """
    base_xp = 10

    # Rating bonus
    rating_bonus = {1: 0, 2: 5, 3: 10, 4: 20}.get(rating, 0)

    # State bonus
    state_bonus = {
        "new": 0,
        "learning": 5,
        "review": 10,
        "relearning": 15,
    }.get(card_state, 0)

    # Streak bonus (capped at +20)
    streak_bonus = min(consecutive_correct * 2, 20)

    total_xp = base_xp + rating_bonus + state_bonus + streak_bonus

    return total_xp
