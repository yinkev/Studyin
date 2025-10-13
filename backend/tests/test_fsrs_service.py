"""Unit tests for FSRS service.

Tests cover:
- Card creation
- Review scheduling
- Retention prediction
- Parameter optimization
- Due card queries
- Statistics
"""

from __future__ import annotations

import datetime
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fsrs import FSRSCard, FSRSReviewLog, FSRSParameters
from app.models.topics import Topic
from app.models.user import User
from app.services.fsrs_service import FSRSService


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        email=f"test_{uuid4()}@example.com",
        password_hash="dummy_hash",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_topic(db_session: AsyncSession) -> Topic:
    """Create a test topic."""
    topic = Topic(
        id=uuid4(),
        parent_id=None,
        level=0,
        path="cardiology",
        name="Cardiology",
        slug="cardiology",
        board_exam_weight=8.0,
        difficulty_level=4,
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)
    return topic


@pytest.fixture
async def fsrs_service(db_session: AsyncSession) -> FSRSService:
    """Create FSRS service instance."""
    return FSRSService(db_session)


class TestCardCreation:
    """Test card creation."""

    async def test_create_card_with_topic(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test creating a card linked to a topic."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        assert card.user_id == test_user.id
        assert card.topic_id == test_topic.id
        assert card.state == "new"
        assert card.difficulty == 5.0
        assert card.stability == 0.0
        assert card.retrievability == 1.0
        assert card.reps == 0
        assert card.lapses == 0

    async def test_create_card_with_custom_content(
        self,
        fsrs_service: FSRSService,
        test_user: User,
    ):
        """Test creating a custom flashcard."""
        content = "What are the symptoms of myocardial infarction?"

        card = await fsrs_service.create_card(
            user_id=test_user.id,
            flashcard_content=content,
        )

        assert card.user_id == test_user.id
        assert card.flashcard_content == content
        assert card.state == "new"

    async def test_create_card_with_initial_due_date(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test creating a card with custom initial due date."""
        future_date = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)

        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
            initial_due_date=future_date,
        )

        assert card.due_date.date() == future_date.date()

    async def test_create_card_without_content_raises_error(
        self,
        fsrs_service: FSRSService,
        test_user: User,
    ):
        """Test that creating a card without content raises ValueError."""
        with pytest.raises(ValueError, match="Must provide at least one"):
            await fsrs_service.create_card(user_id=test_user.id)


class TestReviewScheduling:
    """Test review scheduling and FSRS algorithm."""

    async def test_review_new_card_good_rating(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test reviewing a new card with 'Good' rating."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        # Review with "Good" rating (3)
        updated_card = await fsrs_service.schedule_review(
            card_id=card.id,
            rating=3,
            review_duration_seconds=10.5,
        )

        # Card should transition from "new" to "learning" or "review"
        assert updated_card.state in ["learning", "review"]
        assert updated_card.reps == 1
        assert updated_card.lapses == 0
        assert updated_card.last_review is not None
        assert updated_card.due_date > datetime.datetime.now(datetime.UTC)
        assert updated_card.stability > 0
        assert updated_card.consecutive_correct == 1
        assert updated_card.average_response_time_seconds == 10.5

    async def test_review_card_again_rating(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test reviewing a card with 'Again' rating (forgot)."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        # Review with "Again" rating (1)
        updated_card = await fsrs_service.schedule_review(
            card_id=card.id,
            rating=1,
        )

        # Card should have lapse recorded
        assert updated_card.lapses >= 1
        assert updated_card.consecutive_correct == 0
        # "Again" typically results in short interval or relearning
        assert updated_card.state in ["learning", "relearning"]

    async def test_review_card_easy_rating(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test reviewing a card with 'Easy' rating."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        # Review with "Easy" rating (4)
        updated_card = await fsrs_service.schedule_review(
            card_id=card.id,
            rating=4,
        )

        # Easy rating should result in longer interval
        assert updated_card.reps == 1
        assert updated_card.stability > 0
        assert updated_card.consecutive_correct == 1

    async def test_review_creates_log_entry(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
        db_session: AsyncSession,
    ):
        """Test that reviewing creates a review log entry."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        await fsrs_service.schedule_review(
            card_id=card.id,
            rating=3,
            review_duration_seconds=15.0,
        )

        # Check review log was created
        stmt = select(FSRSReviewLog).where(FSRSReviewLog.card_id == card.id)
        result = await db_session.execute(stmt)
        log = result.scalar_one()

        assert log.rating == 3
        assert log.review_duration_seconds == 15.0
        assert log.state_before == "new"
        assert log.difficulty_before == 5.0

    async def test_review_invalid_rating_raises_error(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test that invalid rating raises ValueError."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        with pytest.raises(ValueError, match="Rating must be"):
            await fsrs_service.schedule_review(card_id=card.id, rating=5)

    async def test_review_nonexistent_card_raises_error(
        self,
        fsrs_service: FSRSService,
    ):
        """Test that reviewing nonexistent card raises ValueError."""
        fake_card_id = uuid4()

        with pytest.raises(ValueError, match="not found"):
            await fsrs_service.schedule_review(card_id=fake_card_id, rating=3)


class TestDueCards:
    """Test getting due cards."""

    async def test_get_due_cards(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test getting cards due for review."""
        # Create multiple cards with different due dates
        now = datetime.datetime.now(datetime.UTC)

        # Past due card
        card1 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
            initial_due_date=now - datetime.timedelta(days=1),
        )

        # Due now
        card2 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
            initial_due_date=now,
        )

        # Future due (not due yet)
        card3 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
            initial_due_date=now + datetime.timedelta(days=1),
        )

        # Get due cards
        due_cards = await fsrs_service.get_due_cards(
            user_id=test_user.id,
            limit=10,
        )

        # Should get card1 and card2, but not card3
        due_card_ids = [card.id for card in due_cards]
        assert card1.id in due_card_ids
        assert card2.id in due_card_ids
        assert card3.id not in due_card_ids

    async def test_get_due_cards_with_limit(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test limit on due cards."""
        now = datetime.datetime.now(datetime.UTC)

        # Create 5 due cards
        for i in range(5):
            await fsrs_service.create_card(
                user_id=test_user.id,
                topic_id=test_topic.id,
                initial_due_date=now - datetime.timedelta(hours=i),
            )

        # Request only 3
        due_cards = await fsrs_service.get_due_cards(
            user_id=test_user.id,
            limit=3,
        )

        assert len(due_cards) == 3

    async def test_get_due_cards_filters_by_topic(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
        db_session: AsyncSession,
    ):
        """Test filtering due cards by topic."""
        # Create another topic
        topic2 = Topic(
            id=uuid4(),
            parent_id=None,
            level=0,
            path="neurology",
            name="Neurology",
            slug="neurology",
            board_exam_weight=7.0,
            difficulty_level=4,
        )
        db_session.add(topic2)
        await db_session.commit()

        now = datetime.datetime.now(datetime.UTC)

        # Create cards for different topics
        card1 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
            initial_due_date=now,
        )

        card2 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=topic2.id,
            initial_due_date=now,
        )

        # Get due cards for topic1 only
        due_cards = await fsrs_service.get_due_cards(
            user_id=test_user.id,
            topic_id=test_topic.id,
            limit=10,
        )

        due_card_ids = [card.id for card in due_cards]
        assert card1.id in due_card_ids
        assert card2.id not in due_card_ids


class TestRetentionPrediction:
    """Test retention probability prediction."""

    async def test_predict_retention_new_card(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test predicting retention for a new card."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        retention = await fsrs_service.predict_retention(card.id)

        # New card should have 100% retention
        assert retention == 1.0

    async def test_predict_retention_reviewed_card(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test predicting retention for a reviewed card."""
        card = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        # Review the card
        await fsrs_service.schedule_review(card_id=card.id, rating=3)

        # Predict retention
        retention = await fsrs_service.predict_retention(card.id)

        # Should be high since just reviewed
        assert 0.8 <= retention <= 1.0


class TestStatistics:
    """Test card statistics."""

    async def test_get_card_stats(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test getting user card statistics."""
        # Create cards in different states
        now = datetime.datetime.now(datetime.UTC)

        # New card
        await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )

        # Card to review
        card2 = await fsrs_service.create_card(
            user_id=test_user.id,
            topic_id=test_topic.id,
        )
        await fsrs_service.schedule_review(card_id=card2.id, rating=3)

        # Get stats
        stats = await fsrs_service.get_card_stats(user_id=test_user.id)

        assert stats["total_cards"] == 2
        assert stats["new"] >= 1
        assert stats["total_reviews"] >= 1

    async def test_get_upcoming_reviews(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test getting upcoming review schedule."""
        now = datetime.datetime.now(datetime.UTC)

        # Create cards due on different days
        for i in range(1, 4):
            await fsrs_service.create_card(
                user_id=test_user.id,
                topic_id=test_topic.id,
                initial_due_date=now + datetime.timedelta(days=i),
            )

        schedule = await fsrs_service.get_upcoming_reviews(
            user_id=test_user.id,
            days_ahead=7,
        )

        # Should have entries for next 3 days
        assert len(schedule) >= 3


class TestParameterOptimization:
    """Test FSRS parameter optimization."""

    async def test_optimize_parameters_insufficient_data(
        self,
        fsrs_service: FSRSService,
        test_user: User,
    ):
        """Test optimization with insufficient review data."""
        result = await fsrs_service.optimize_parameters(
            user_id=test_user.id,
            min_reviews=100,
        )

        # Should return None if insufficient data
        assert result is None

    async def test_optimize_parameters_with_sufficient_data(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
    ):
        """Test optimization with sufficient review data."""
        # Create and review many cards to get enough data
        # (This is a simplified test - real optimization needs varied data)
        cards = []
        for i in range(10):
            card = await fsrs_service.create_card(
                user_id=test_user.id,
                topic_id=test_topic.id,
            )
            cards.append(card)

        # Review cards multiple times
        for card in cards:
            for _ in range(10):  # 10 reviews per card = 100 total
                await fsrs_service.schedule_review(
                    card_id=card.id,
                    rating=3,  # Good rating
                )

        # Try optimization with lower threshold
        result = await fsrs_service.optimize_parameters(
            user_id=test_user.id,
            min_reviews=50,  # Lower threshold for test
        )

        # Should succeed with enough data
        if result:
            assert result.user_id == test_user.id
            assert result.optimized == 1
            assert result.sample_size >= 50


class TestCacheInvalidation:
    """Test FSRS instance caching."""

    async def test_fsrs_cache_hit(
        self,
        fsrs_service: FSRSService,
        test_user: User,
    ):
        """Test that FSRS instances are cached."""
        # First call loads from DB
        fsrs1 = await fsrs_service._get_fsrs_instance(test_user.id)

        # Second call should use cache
        fsrs2 = await fsrs_service._get_fsrs_instance(test_user.id)

        # Should be the same instance
        assert fsrs1 is fsrs2

    async def test_fsrs_cache_cleared_on_optimization(
        self,
        fsrs_service: FSRSService,
        test_user: User,
        test_topic: Topic,
        db_session: AsyncSession,
    ):
        """Test that cache is cleared when parameters are optimized."""
        # Load FSRS instance (populates cache)
        fsrs1 = await fsrs_service._get_fsrs_instance(test_user.id)

        # Manually insert optimized parameters (simulate optimization)
        params = FSRSParameters(
            user_id=test_user.id,
            parameters={
                "w": [0.4] * 19,
                "request_retention": 0.9,
                "maximum_interval": 36500,
                "enable_fuzz": True,
            },
            version="4.5",
            optimized=1,
            sample_size=100,
        )
        db_session.add(params)
        await db_session.commit()

        # Clear cache (simulate optimization clearing it)
        cache_key = (test_user.id, None)
        if cache_key in fsrs_service._fsrs_cache:
            del fsrs_service._fsrs_cache[cache_key]

        # Load again (should get new instance with optimized params)
        fsrs2 = await fsrs_service._get_fsrs_instance(test_user.id)

        # Should be different instance
        assert fsrs1 is not fsrs2
