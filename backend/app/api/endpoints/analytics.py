"""Analytics API endpoints.

Example implementation of analytics endpoints using the schema.
"""

from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.analytics_aggregates import (
    DailyUserStats,
    KnowledgeGap,
    TopicDailyStats,
    UserLearningMetrics,
)
from app.models.analytics_events import QuestionAttempt, StudySession
from app.models.topics import Topic, TopicMastery
from app.models.user import User

router = APIRouter()


# ============================================================================
# DASHBOARD - Main Analytics View
# ============================================================================


@router.get("/dashboard")
async def get_user_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive user dashboard.

    Returns:
    - 30-day overview metrics
    - Activity heatmap (last 90 days)
    - Recent study sessions
    - Topic mastery summary
    - Top knowledge gaps

    Expected: < 200ms (all queries use indexed PK/FK lookups)
    """

    # Query 1: User learning metrics (1 row)
    metrics_result = await db.execute(
        select(UserLearningMetrics).where(
            UserLearningMetrics.user_id == current_user.id
        )
    )
    metrics = metrics_result.scalar_one_or_none()

    if not metrics:
        # First time user - create empty metrics
        metrics = UserLearningMetrics(user_id=current_user.id)
        db.add(metrics)
        await db.commit()
        await db.refresh(metrics)

    # Query 2: Daily stats for heatmap (90 rows)
    daily_stats_result = await db.execute(
        select(DailyUserStats)
        .where(DailyUserStats.user_id == current_user.id)
        .where(DailyUserStats.stat_date >= date.today() - timedelta(days=90))
        .order_by(DailyUserStats.stat_date)
    )
    daily_stats = daily_stats_result.scalars().all()

    # Query 3: Recent study sessions (20 rows)
    sessions_result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == current_user.id)
        .where(StudySession.is_active == False)
        .where(StudySession.started_at >= datetime.utcnow() - timedelta(days=30))
        .order_by(StudySession.started_at.desc())
        .limit(20)
    )
    recent_sessions = sessions_result.scalars().all()

    # Query 4: Topic mastery summary (10 rows)
    mastery_result = await db.execute(
        select(TopicMastery, Topic)
        .join(Topic, TopicMastery.topic_id == Topic.id)
        .where(TopicMastery.user_id == current_user.id)
        .where(TopicMastery.mastery_score > 0)  # Only studied topics
        .order_by(TopicMastery.mastery_score.asc())  # Weakest first
        .limit(10)
    )
    weak_topics = [
        {
            "topic_id": str(mastery.topic_id),
            "topic_name": topic.name,
            "mastery_score": mastery.mastery_score,
            "questions_attempted": mastery.questions_attempted,
            "accuracy": (
                mastery.questions_correct / mastery.questions_attempted
                if mastery.questions_attempted > 0
                else 0.0
            ),
            "last_studied": mastery.last_studied_at.isoformat()
            if mastery.last_studied_at
            else None,
        }
        for mastery, topic in mastery_result.all()
    ]

    # Query 5: Knowledge gaps (5 rows)
    gaps_result = await db.execute(
        select(KnowledgeGap, Topic)
        .join(Topic, KnowledgeGap.topic_id == Topic.id)
        .where(KnowledgeGap.user_id == current_user.id)
        .where(KnowledgeGap.is_resolved == False)
        .order_by(KnowledgeGap.priority_score.desc())
        .limit(5)
    )
    knowledge_gaps = [
        {
            "topic_id": str(gap.topic_id),
            "topic_name": topic.name,
            "severity": gap.severity,
            "gap_score": gap.gap_score,
            "priority_score": gap.priority_score,
            "estimated_hours": gap.estimated_study_hours,
            "recommended_materials": gap.recommended_materials,
        }
        for gap, topic in gaps_result.all()
    ]

    return {
        "overview": {
            "study_minutes_30d": metrics.study_minutes_30d,
            "sessions_30d": metrics.sessions_30d,
            "active_days_30d": metrics.active_days_30d,
            "accuracy_30d": metrics.accuracy_30d,
            "xp_earned_30d": metrics.xp_earned_30d,
            "current_streak_days": metrics.current_streak_days,
            "longest_streak_days": metrics.longest_streak_days,
            "avg_mastery_score": metrics.avg_mastery_score,
            "topics_mastered": metrics.topics_mastered,
            "topics_weak": metrics.topics_weak,
            "predicted_exam_readiness": metrics.predicted_exam_readiness,
        },
        "heatmap": [
            {
                "date": stat.stat_date.isoformat(),
                "study_minutes": stat.total_study_minutes,
                "questions_attempted": stat.questions_attempted,
                "accuracy": stat.accuracy_rate,
                "xp_earned": stat.xp_earned,
                "goal_achieved": stat.goal_achieved,
            }
            for stat in daily_stats
        ],
        "recent_sessions": [
            {
                "session_id": str(session.id),
                "started_at": session.started_at.isoformat(),
                "duration_minutes": session.duration_seconds // 60,
                "materials_viewed": session.materials_viewed,
                "questions_attempted": session.questions_attempted,
                "questions_correct": session.questions_correct,
                "xp_earned": session.xp_earned,
            }
            for session in recent_sessions
        ],
        "weak_topics": weak_topics,
        "knowledge_gaps": knowledge_gaps,
    }


# ============================================================================
# TOPIC ANALYTICS
# ============================================================================


@router.get("/topics/{topic_id}")
async def get_topic_analytics(
    topic_id: UUID,
    days: int = Query(default=90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed analytics for a specific topic.

    Returns:
    - Current mastery status
    - Progress over time
    - Question performance
    - Recommended next review date

    Expected: < 100ms (indexed queries)
    """

    # Query 1: Current mastery
    mastery_result = await db.execute(
        select(TopicMastery, Topic)
        .join(Topic, TopicMastery.topic_id == Topic.id)
        .where(TopicMastery.user_id == current_user.id)
        .where(TopicMastery.topic_id == topic_id)
    )
    mastery_data = mastery_result.first()

    if not mastery_data:
        raise HTTPException(status_code=404, detail="Topic not studied yet")

    mastery, topic = mastery_data

    # Query 2: Daily progress
    daily_result = await db.execute(
        select(TopicDailyStats)
        .where(TopicDailyStats.user_id == current_user.id)
        .where(TopicDailyStats.topic_id == topic_id)
        .where(TopicDailyStats.stat_date >= date.today() - timedelta(days=days))
        .order_by(TopicDailyStats.stat_date)
    )
    daily_progress = daily_result.scalars().all()

    return {
        "topic": {
            "id": str(topic.id),
            "name": topic.name,
            "level": topic.level,
            "board_exam_weight": topic.board_exam_weight,
            "difficulty_level": topic.difficulty_level,
        },
        "mastery": {
            "score": mastery.mastery_score,
            "confidence": mastery.confidence_score,
            "retrieval_strength": mastery.retrieval_strength,
            "retention_rate": mastery.retention_rate,
            "trend": mastery.mastery_trend,
            "first_studied_at": mastery.first_studied_at.isoformat()
            if mastery.first_studied_at
            else None,
            "last_studied_at": mastery.last_studied_at.isoformat()
            if mastery.last_studied_at
            else None,
            "next_review_at": mastery.next_review_at.isoformat()
            if mastery.next_review_at
            else None,
            "review_interval_days": mastery.review_interval_days,
        },
        "study_volume": {
            "total_minutes": mastery.total_study_minutes,
            "materials_completed": mastery.materials_completed,
            "materials_total": mastery.materials_total,
        },
        "question_performance": {
            "attempted": mastery.questions_attempted,
            "correct": mastery.questions_correct,
            "first_attempt_accuracy": mastery.first_attempt_accuracy,
            "avg_response_time_seconds": mastery.avg_response_time_seconds,
        },
        "daily_progress": [
            {
                "date": day.stat_date.isoformat(),
                "study_minutes": day.study_minutes,
                "questions_attempted": day.questions_attempted,
                "accuracy": day.accuracy_rate,
                "mastery_at_end": day.mastery_at_end,
                "mastery_change": day.mastery_change,
            }
            for day in daily_progress
        ],
    }


# ============================================================================
# KNOWLEDGE GAPS
# ============================================================================


@router.get("/knowledge-gaps")
async def get_knowledge_gaps(
    severity: Optional[str] = Query(None, regex="^(critical|high|medium|low)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personalized knowledge gap recommendations.

    Returns prioritized list of topics needing attention.

    Expected: < 50ms (indexed query)
    """

    query = (
        select(KnowledgeGap, Topic)
        .join(Topic, KnowledgeGap.topic_id == Topic.id)
        .where(KnowledgeGap.user_id == current_user.id)
        .where(KnowledgeGap.is_resolved == False)
    )

    if severity:
        query = query.where(KnowledgeGap.severity == severity)

    query = query.order_by(KnowledgeGap.priority_score.desc()).limit(20)

    result = await db.execute(query)
    gaps = result.all()

    return {
        "gaps": [
            {
                "gap_id": str(gap.id),
                "topic_id": str(gap.topic_id),
                "topic_name": topic.name,
                "severity": gap.severity,
                "gap_score": gap.gap_score,
                "priority_score": gap.priority_score,
                "evidence": {
                    "questions_attempted": gap.questions_attempted,
                    "accuracy_rate": gap.accuracy_rate,
                    "avg_response_time": gap.avg_response_time_seconds,
                    "materials_incomplete": gap.materials_incomplete,
                    "forgetting_rate": gap.forgetting_rate,
                },
                "impact": {
                    "board_exam_importance": gap.board_exam_importance,
                    "affects_other_topics": gap.affects_other_topics,
                },
                "recommendations": {
                    "materials": gap.recommended_materials,
                    "estimated_hours": gap.estimated_study_hours,
                    "suggested_completion": gap.suggested_completion_date.isoformat()
                    if gap.suggested_completion_date
                    else None,
                },
                "identified_at": gap.identified_at.isoformat(),
            }
            for gap, topic in gaps
        ]
    }


# ============================================================================
# QUESTION PERFORMANCE
# ============================================================================


@router.get("/questions/performance")
async def get_question_performance(
    topic_id: Optional[UUID] = None,
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get question attempt statistics.

    Returns:
    - Overall accuracy
    - First attempt accuracy
    - Average response time
    - Performance by difficulty

    Expected: < 200ms (indexed aggregation)
    """

    # Base query
    query = select(
        func.count(QuestionAttempt.id).label("total_attempts"),
        func.sum(
            func.cast(QuestionAttempt.is_correct, db.bind.dialect.BIGINT)
        ).label("correct_attempts"),
        func.avg(QuestionAttempt.time_to_answer_seconds).label("avg_response_time"),
    ).where(QuestionAttempt.user_id == current_user.id)

    # Add time filter
    query = query.where(
        QuestionAttempt.attempted_at
        >= datetime.utcnow() - timedelta(days=days)
    )

    # Add topic filter if provided
    if topic_id:
        query = query.where(QuestionAttempt.topic_id == topic_id)

    # Execute
    result = await db.execute(query)
    stats = result.first()

    # First attempt stats
    first_query = (
        select(
            func.count(QuestionAttempt.id).label("first_attempts"),
            func.sum(
                func.cast(QuestionAttempt.is_correct, db.bind.dialect.BIGINT)
            ).label("first_correct"),
        )
        .where(QuestionAttempt.user_id == current_user.id)
        .where(QuestionAttempt.is_first_attempt == True)
        .where(
            QuestionAttempt.attempted_at
            >= datetime.utcnow() - timedelta(days=days)
        )
    )

    if topic_id:
        first_query = first_query.where(QuestionAttempt.topic_id == topic_id)

    first_result = await db.execute(first_query)
    first_stats = first_result.first()

    total = stats.total_attempts or 0
    correct = stats.correct_attempts or 0
    first_total = first_stats.first_attempts or 0
    first_correct = first_stats.first_correct or 0

    return {
        "overall": {
            "total_attempts": total,
            "correct_attempts": correct,
            "accuracy": correct / total if total > 0 else 0.0,
            "avg_response_time_seconds": float(stats.avg_response_time or 0),
        },
        "first_attempts": {
            "total": first_total,
            "correct": first_correct,
            "accuracy": first_correct / first_total if first_total > 0 else 0.0,
        },
        "time_period_days": days,
        "topic_filter": str(topic_id) if topic_id else None,
    }


# ============================================================================
# STUDY PATTERNS
# ============================================================================


@router.get("/study-patterns")
async def get_study_patterns(
    days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get study pattern insights.

    Returns:
    - Best study times (by hour/day)
    - Average session duration
    - Study consistency
    - Peak performance periods

    Expected: < 500ms (aggregation query)
    """

    # Get daily stats for period
    result = await db.execute(
        select(DailyUserStats)
        .where(DailyUserStats.user_id == current_user.id)
        .where(DailyUserStats.stat_date >= date.today() - timedelta(days=days))
        .order_by(DailyUserStats.stat_date)
    )
    daily_stats = result.scalars().all()

    if not daily_stats:
        return {"message": "Not enough data for pattern analysis"}

    # Calculate patterns
    total_days = len(daily_stats)
    active_days = sum(1 for s in daily_stats if s.sessions_count > 0)
    total_minutes = sum(s.total_study_minutes for s in daily_stats)
    avg_accuracy = (
        sum(s.accuracy_rate for s in daily_stats if s.questions_attempted > 0)
        / len([s for s in daily_stats if s.questions_attempted > 0])
        if any(s.questions_attempted > 0 for s in daily_stats)
        else 0.0
    )

    return {
        "consistency": {
            "total_days_analyzed": total_days,
            "active_days": active_days,
            "study_frequency": active_days / total_days if total_days > 0 else 0.0,
            "current_streak": await _get_current_streak(current_user.id, db),
        },
        "volume": {
            "total_study_minutes": total_minutes,
            "avg_minutes_per_day": total_minutes / total_days
            if total_days > 0
            else 0.0,
            "avg_minutes_per_active_day": total_minutes / active_days
            if active_days > 0
            else 0.0,
        },
        "performance": {
            "avg_accuracy": avg_accuracy,
            "best_day_accuracy": max(
                (s.accuracy_rate for s in daily_stats if s.questions_attempted > 0),
                default=0.0,
            ),
            "consistency_score": await _calculate_consistency_score(daily_stats),
        },
    }


async def _get_current_streak(user_id: UUID, db: AsyncSession) -> int:
    """Calculate current study streak."""
    result = await db.execute(
        select(UserLearningMetrics.current_streak_days).where(
            UserLearningMetrics.user_id == user_id
        )
    )
    streak = result.scalar_one_or_none()
    return streak or 0


async def _calculate_consistency_score(daily_stats: List[DailyUserStats]) -> float:
    """Calculate study consistency score (0.0-1.0)."""
    if not daily_stats:
        return 0.0

    # Score based on:
    # - Active days ratio
    # - Study time variance (lower is better)
    # - Goal achievement rate

    active_days = sum(1 for s in daily_stats if s.sessions_count > 0)
    goal_achieved = sum(1 for s in daily_stats if s.goal_achieved)

    active_ratio = active_days / len(daily_stats)
    goal_ratio = goal_achieved / len(daily_stats)

    # Combine scores
    consistency = 0.5 * active_ratio + 0.5 * goal_ratio

    return round(consistency, 2)
