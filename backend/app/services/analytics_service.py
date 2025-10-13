"""Analytics Service for question mastery radar and performance windows.

This service provides high-performance analytics queries for the dashboard:
- Question mastery radar: Topic-level performance visualization
- Performance windows: Historical performance trends over time

Design:
- Async SQLAlchemy queries on pre-aggregated tables
- Optional Redis caching with 5-minute TTL
- < 500ms query performance
- Graceful degradation when data is missing
"""

from __future__ import annotations

import datetime
import logging
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select, and_, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics_aggregates import (
    TopicDailyStats,
    DailyUserStats,
)
from app.models.analytics_events import StudySession, QuestionAttempt
from app.models.topics import Topic, TopicMastery

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for dashboard analytics queries.

    Provides:
    - Question mastery radar (topic-level performance)
    - Performance windows (historical trends)

    All queries are optimized for < 500ms response time.
    """

    def __init__(self, db: AsyncSession, cache=None):
        """Initialize analytics service.

        Args:
            db: Async database session
            cache: Optional Redis cache instance (from cache.py)
        """
        self.db = db
        self.cache = cache
        self._cache_ttl = 300  # 5 minutes

    async def get_question_mastery_radar(
        self,
        user_id: UUID,
        limit: int = 8,
        min_attempts: int = 5
    ) -> List[Dict]:
        """Get topic-level question mastery for radar chart.

        Returns top N topics by question volume with performance metrics.
        Optimized query using TopicMastery + TopicDailyStats aggregates.

        Args:
            user_id: User ID
            limit: Number of topics to return (default 8 for radar chart)
            min_attempts: Minimum question attempts required (default 5)

        Returns:
            List of dicts with structure:
            {
                "topic_id": "uuid",
                "topic_name": "Cardiovascular",
                "mastery_score": 0.75,  # 0.0-1.0
                "accuracy_rate": 0.80,  # % correct
                "questions_attempted": 45,
                "avg_response_time_seconds": 32.5,
                "last_studied_at": "2025-01-15T10:30:00Z"
            }

        Cache Key: analytics:radar:{user_id}:{limit}:{min_attempts}
        TTL: 5 minutes
        """
        # Try cache first
        cache_key = f"analytics:radar:{user_id}:{limit}:{min_attempts}"
        if self.cache:
            try:
                cached = await self.cache.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit for radar chart: {user_id}")
                    return cached
            except Exception as e:
                logger.warning(f"Cache read failed: {e}")

        # Query TopicMastery with Topic names
        stmt = (
            select(
                TopicMastery.topic_id,
                Topic.name.label("topic_name"),
                TopicMastery.mastery_score,
                TopicMastery.retention_rate.label("accuracy_rate"),
                TopicMastery.questions_attempted,
                TopicMastery.avg_response_time_seconds,
                TopicMastery.last_studied_at
            )
            .join(Topic, TopicMastery.topic_id == Topic.id)
            .where(
                and_(
                    TopicMastery.user_id == user_id,
                    TopicMastery.questions_attempted >= min_attempts
                )
            )
            .order_by(
                TopicMastery.questions_attempted.desc(),  # Most practiced topics
                TopicMastery.mastery_score.desc()  # Then by mastery
            )
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        # Format response
        radar_data = []
        for row in rows:
            radar_data.append({
                "topic_id": str(row.topic_id),
                "topic_name": row.topic_name,
                "mastery_score": round(row.mastery_score, 2),
                "accuracy_rate": round(row.accuracy_rate, 2),
                "questions_attempted": row.questions_attempted,
                "avg_response_time_seconds": (
                    round(row.avg_response_time_seconds, 1)
                    if row.avg_response_time_seconds else None
                ),
                "last_studied_at": (
                    row.last_studied_at.isoformat()
                    if row.last_studied_at else None
                )
            })

        # Handle insufficient data
        if len(radar_data) < 3:
            logger.info(
                f"Insufficient radar data for user {user_id}: "
                f"{len(radar_data)} topics with {min_attempts}+ attempts"
            )
            # Return what we have with a flag
            return radar_data

        # Cache result
        if self.cache:
            try:
                await self.cache.set(cache_key, radar_data, ttl=self._cache_ttl)
            except Exception as e:
                logger.warning(f"Cache write failed: {e}")

        logger.info(f"Radar chart for user {user_id}: {len(radar_data)} topics")
        return radar_data

    async def get_performance_windows(
        self,
        user_id: UUID,
        windows: List[int] = [7, 30, 90],
        include_sessions: bool = True
    ) -> Dict[str, Dict]:
        """Get performance metrics over multiple time windows.

        Calculates accuracy, volume, and trends for 7-day, 30-day, 90-day windows.
        Uses DailyUserStats for efficient aggregation.

        Args:
            user_id: User ID
            windows: List of day windows to calculate (default [7, 30, 90])
            include_sessions: Include detailed session breakdown

        Returns:
            Dict with structure:
            {
                "7d": {
                    "accuracy_rate": 0.82,
                    "questions_attempted": 45,
                    "questions_correct": 37,
                    "study_minutes": 240,
                    "sessions_count": 8,
                    "topics_studied": 5,
                    "trend": "improving",  # or "stable" or "declining"
                    "sessions": [...]  # if include_sessions=True
                },
                "30d": {...},
                "90d": {...}
            }

        Cache Key: analytics:windows:{user_id}:{windows}:{include_sessions}
        TTL: 5 minutes
        """
        # Try cache first
        cache_key = f"analytics:windows:{user_id}:{','.join(map(str, windows))}:{include_sessions}"
        if self.cache:
            try:
                cached = await self.cache.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit for performance windows: {user_id}")
                    return cached
            except Exception as e:
                logger.warning(f"Cache read failed: {e}")

        now = datetime.datetime.now(datetime.timezone.utc)
        result = {}

        for window_days in windows:
            window_start = now - datetime.timedelta(days=window_days)
            window_key = f"{window_days}d"

            # Query DailyUserStats for this window
            stmt = (
                select(
                    func.sum(DailyUserStats.questions_attempted).label("total_questions"),
                    func.sum(DailyUserStats.questions_correct).label("total_correct"),
                    func.sum(DailyUserStats.total_study_minutes).label("total_minutes"),
                    func.sum(DailyUserStats.sessions_count).label("total_sessions"),
                    func.count(DailyUserStats.unique_topics_studied).label("unique_topics"),
                    func.avg(DailyUserStats.accuracy_rate).label("avg_accuracy")
                )
                .where(
                    and_(
                        DailyUserStats.user_id == user_id,
                        DailyUserStats.stat_date >= window_start.date()
                    )
                )
            )

            query_result = await self.db.execute(stmt)
            row = query_result.first()

            # Handle no data
            if not row or row.total_questions is None or row.total_questions == 0:
                result[window_key] = self._empty_window_data()
                continue

            # Calculate accuracy
            accuracy = (
                row.total_correct / row.total_questions
                if row.total_questions > 0 else 0.0
            )

            # Calculate trend (compare first half vs second half of window)
            trend = await self._calculate_trend(user_id, window_start, now)

            window_data = {
                "accuracy_rate": round(accuracy, 2),
                "questions_attempted": int(row.total_questions or 0),
                "questions_correct": int(row.total_correct or 0),
                "study_minutes": int(row.total_minutes or 0),
                "sessions_count": int(row.total_sessions or 0),
                "topics_studied": int(row.unique_topics or 0),
                "trend": trend
            }

            # Add session breakdown if requested
            if include_sessions:
                sessions = await self._get_recent_sessions(
                    user_id,
                    window_start,
                    limit=20
                )
                window_data["sessions"] = sessions

            result[window_key] = window_data

        # Cache result
        if self.cache:
            try:
                await self.cache.set(cache_key, result, ttl=self._cache_ttl)
            except Exception as e:
                logger.warning(f"Cache write failed: {e}")

        # Log summary
        window_summary = ', '.join([
            f"{w}d={result[f'{w}d']['questions_attempted']}q"
            for w in windows
        ])
        logger.info(f"Performance windows for user {user_id}: {window_summary}")
        return result

    async def _calculate_trend(
        self,
        user_id: UUID,
        window_start: datetime.datetime,
        window_end: datetime.datetime
    ) -> str:
        """Calculate performance trend over a window.

        Compares first half vs second half accuracy.

        Args:
            user_id: User ID
            window_start: Start of window
            window_end: End of window

        Returns:
            "improving", "stable", or "declining"
        """
        # Split window in half
        window_midpoint = window_start + (window_end - window_start) / 2

        # First half accuracy
        stmt_first = (
            select(
                func.sum(DailyUserStats.questions_attempted).label("attempts"),
                func.sum(DailyUserStats.questions_correct).label("correct")
            )
            .where(
                and_(
                    DailyUserStats.user_id == user_id,
                    DailyUserStats.stat_date >= window_start.date(),
                    DailyUserStats.stat_date < window_midpoint.date()
                )
            )
        )
        result_first = await self.db.execute(stmt_first)
        first_half = result_first.first()

        # Second half accuracy
        stmt_second = (
            select(
                func.sum(DailyUserStats.questions_attempted).label("attempts"),
                func.sum(DailyUserStats.questions_correct).label("correct")
            )
            .where(
                and_(
                    DailyUserStats.user_id == user_id,
                    DailyUserStats.stat_date >= window_midpoint.date(),
                    DailyUserStats.stat_date <= window_end.date()
                )
            )
        )
        result_second = await self.db.execute(stmt_second)
        second_half = result_second.first()

        # Calculate accuracies
        if not first_half or not first_half.attempts or first_half.attempts < 5:
            return "stable"  # Insufficient data for first half
        if not second_half or not second_half.attempts or second_half.attempts < 5:
            return "stable"  # Insufficient data for second half

        first_accuracy = first_half.correct / first_half.attempts
        second_accuracy = second_half.correct / second_half.attempts

        # Threshold: 5% change
        change = second_accuracy - first_accuracy
        if change > 0.05:
            return "improving"
        elif change < -0.05:
            return "declining"
        else:
            return "stable"

    async def _get_recent_sessions(
        self,
        user_id: UUID,
        since: datetime.datetime,
        limit: int = 20
    ) -> List[Dict]:
        """Get recent study sessions for a user.

        Args:
            user_id: User ID
            since: Get sessions since this timestamp
            limit: Max sessions to return

        Returns:
            List of session dicts with basic metrics
        """
        stmt = (
            select(
                StudySession.id,
                StudySession.started_at,
                StudySession.duration_seconds,
                StudySession.questions_attempted,
                StudySession.questions_correct,
                StudySession.materials_viewed,
                StudySession.xp_earned
            )
            .where(
                and_(
                    StudySession.user_id == user_id,
                    StudySession.started_at >= since,
                    StudySession.is_active == False  # Only completed sessions
                )
            )
            .order_by(StudySession.started_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        sessions = []
        for row in rows:
            accuracy = (
                row.questions_correct / row.questions_attempted
                if row.questions_attempted > 0 else None
            )
            sessions.append({
                "session_id": str(row.id),
                "started_at": row.started_at.isoformat(),
                "duration_minutes": round(row.duration_seconds / 60, 1),
                "questions_attempted": row.questions_attempted,
                "accuracy_rate": round(accuracy, 2) if accuracy is not None else None,
                "materials_viewed": row.materials_viewed,
                "xp_earned": row.xp_earned
            })

        return sessions

    def _empty_window_data(self) -> Dict:
        """Return empty window data structure for no-data case."""
        return {
            "accuracy_rate": 0.0,
            "questions_attempted": 0,
            "questions_correct": 0,
            "study_minutes": 0,
            "sessions_count": 0,
            "topics_studied": 0,
            "trend": "stable",
            "sessions": []
        }

    async def get_topic_performance_detail(
        self,
        user_id: UUID,
        topic_id: UUID,
        days: int = 30
    ) -> Dict:
        """Get detailed performance for a specific topic.

        Deep dive into a single topic's performance over time.

        Args:
            user_id: User ID
            topic_id: Topic ID
            days: Number of days to analyze

        Returns:
            Dict with detailed topic performance:
            {
                "topic_id": "uuid",
                "topic_name": "Cardiovascular",
                "mastery_score": 0.75,
                "questions_attempted": 45,
                "accuracy_rate": 0.80,
                "daily_stats": [
                    {
                        "date": "2025-01-15",
                        "questions_attempted": 5,
                        "accuracy_rate": 0.8,
                        "study_minutes": 25,
                        "mastery_change": 0.05
                    },
                    ...
                ],
                "weak_areas": [...]  # Future: subtopic breakdown
            }
        """
        # Get topic info and current mastery
        stmt_mastery = (
            select(
                TopicMastery,
                Topic.name.label("topic_name")
            )
            .join(Topic, TopicMastery.topic_id == Topic.id)
            .where(
                and_(
                    TopicMastery.user_id == user_id,
                    TopicMastery.topic_id == topic_id
                )
            )
        )
        result = await self.db.execute(stmt_mastery)
        mastery_row = result.first()

        if not mastery_row:
            # No data for this topic
            return {
                "topic_id": str(topic_id),
                "topic_name": "Unknown",
                "mastery_score": 0.0,
                "questions_attempted": 0,
                "accuracy_rate": 0.0,
                "daily_stats": []
            }

        mastery = mastery_row[0]
        topic_name = mastery_row.topic_name

        # Get daily stats for this topic
        window_start = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)

        stmt_daily = (
            select(TopicDailyStats)
            .where(
                and_(
                    TopicDailyStats.user_id == user_id,
                    TopicDailyStats.topic_id == topic_id,
                    TopicDailyStats.stat_date >= window_start.date()
                )
            )
            .order_by(TopicDailyStats.stat_date.asc())
        )

        result_daily = await self.db.execute(stmt_daily)
        daily_rows = result_daily.scalars().all()

        daily_stats = []
        for day in daily_rows:
            daily_stats.append({
                "date": day.stat_date.isoformat(),
                "questions_attempted": day.questions_attempted,
                "accuracy_rate": round(day.accuracy_rate, 2),
                "study_minutes": day.study_minutes,
                "mastery_change": round(day.mastery_change, 2)
            })

        return {
            "topic_id": str(topic_id),
            "topic_name": topic_name,
            "mastery_score": round(mastery.mastery_score, 2),
            "questions_attempted": mastery.questions_attempted,
            "accuracy_rate": round(mastery.retention_rate, 2),
            "avg_response_time_seconds": (
                round(mastery.avg_response_time_seconds, 1)
                if mastery.avg_response_time_seconds else None
            ),
            "last_studied_at": (
                mastery.last_studied_at.isoformat()
                if mastery.last_studied_at else None
            ),
            "daily_stats": daily_stats
        }

    async def get_overall_stats(self, user_id: UUID) -> Dict:
        """Get high-level overview statistics for dashboard header.

        Quick summary metrics shown at top of dashboard.

        Args:
            user_id: User ID

        Returns:
            Dict with overall stats:
            {
                "total_study_minutes": 1200,
                "total_questions": 450,
                "overall_accuracy": 0.82,
                "current_streak_days": 7,
                "topics_mastered": 12,
                "topics_in_progress": 8,
                "level": 15,
                "xp": 12500
            }
        """
        # Get from TopicMastery aggregates
        stmt = (
            select(
                func.sum(TopicMastery.total_study_minutes).label("total_minutes"),
                func.sum(TopicMastery.questions_attempted).label("total_questions"),
                func.sum(TopicMastery.questions_correct).label("total_correct"),
                func.sum(
                    case((TopicMastery.mastery_score >= 0.8, 1), else_=0)
                ).label("topics_mastered"),
                func.sum(
                    case(
                        (and_(
                            TopicMastery.mastery_score >= 0.3,
                            TopicMastery.mastery_score < 0.8
                        ), 1),
                        else_=0
                    )
                ).label("topics_in_progress")
            )
            .where(TopicMastery.user_id == user_id)
        )

        result = await self.db.execute(stmt)
        row = result.first()

        # Calculate overall accuracy
        overall_accuracy = 0.0
        if row and row.total_questions and row.total_questions > 0:
            overall_accuracy = row.total_correct / row.total_questions

        # Get recent stats for streak (would come from UserLearningMetrics in full impl)
        # For now, return basic data
        return {
            "total_study_minutes": int(row.total_minutes or 0) if row else 0,
            "total_questions": int(row.total_questions or 0) if row else 0,
            "overall_accuracy": round(overall_accuracy, 2),
            "current_streak_days": 0,  # TODO: Implement with UserLearningMetrics
            "topics_mastered": int(row.topics_mastered or 0) if row else 0,
            "topics_in_progress": int(row.topics_in_progress or 0) if row else 0,
            "level": 1,  # TODO: Implement with gamification
            "xp": 0  # TODO: Implement with gamification
        }

    async def invalidate_cache(self, user_id: UUID) -> None:
        """Invalidate all cached analytics for a user.

        Call this after study sessions or when real-time updates are needed.

        Args:
            user_id: User ID to invalidate cache for
        """
        if not self.cache:
            return

        # Delete all analytics cache keys for this user
        patterns = [
            f"analytics:radar:{user_id}:*",
            f"analytics:windows:{user_id}:*"
        ]

        try:
            for pattern in patterns:
                await self.cache.delete_pattern(pattern)
            logger.info(f"Invalidated analytics cache for user {user_id}")
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {e}")
