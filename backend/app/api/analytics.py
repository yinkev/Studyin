"""Analytics API endpoints for dashboards and reporting.

Provides aggregated metrics with privacy-first design.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.analytics import (
    ActivityHeatmap,
    GamificationProgress,
    LearningOverview,
)
from app.services.analytics.tracker import AnalyticsTracker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/learning/overview", response_model=LearningOverview)
async def get_learning_overview(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> LearningOverview:
    """Get learning overview metrics for the current user.

    Returns aggregated metrics for the specified period (default 30 days).
    """
    try:
        tracker = AnalyticsTracker(db)
        user_id = UUID(current_user["sub"])
        anonymized_user = tracker._anonymize_user_id(user_id)

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get learning sessions data
        sessions_query = await db.execute(
            """
            SELECT
                COUNT(*) as total_sessions,
                COALESCE(SUM(duration_seconds), 0) as total_duration,
                COALESCE(AVG(duration_seconds), 0) as avg_duration,
                COALESCE(SUM(xp_earned), 0) as total_xp
            FROM learning_sessions
            WHERE user_id = :user_id
                AND started_at >= :start_date
                AND started_at <= :end_date
            """,
            {
                "user_id": anonymized_user,
                "start_date": start_date,
                "end_date": end_date,
            },
        )
        sessions_data = sessions_query.first()

        # Get materials data
        materials_query = await db.execute(
            """
            SELECT
                COALESCE(SUM(materials_viewed), 0) as total_viewed,
                COALESCE(SUM(materials_completed), 0) as total_completed
            FROM daily_activity_summary
            WHERE user_id = :user_id
                AND date >= :start_date
                AND date <= :end_date
            """,
            {
                "user_id": anonymized_user,
                "start_date": start_date.date(),
                "end_date": end_date.date(),
            },
        )
        materials_data = materials_query.first()

        # Get gamification stats
        gamification_query = await db.execute(
            """
            SELECT
                current_level,
                current_streak,
                longest_streak,
                COALESCE(jsonb_array_length(achievements), 0) as achievements_count
            FROM gamification_stats
            WHERE user_id = :user_id
            """,
            {"user_id": anonymized_user},
        )
        gamification_data = gamification_query.first()

        # Get daily active days
        active_days_query = await db.execute(
            """
            SELECT COUNT(DISTINCT date) as active_days
            FROM daily_activity_summary
            WHERE user_id = :user_id
                AND date >= :start_date
                AND date <= :end_date
                AND total_duration_seconds > 0
            """,
            {
                "user_id": anonymized_user,
                "start_date": start_date.date(),
                "end_date": end_date.date(),
            },
        )
        active_days_data = active_days_query.first()

        # Calculate metrics
        total_sessions = sessions_data.total_sessions if sessions_data else 0
        total_duration_hours = (
            sessions_data.total_duration / 3600 if sessions_data else 0
        )
        avg_session_duration_minutes = (
            sessions_data.avg_duration / 60 if sessions_data else 0
        )
        materials_viewed = materials_data.total_viewed if materials_data else 0
        materials_completed = materials_data.total_completed if materials_data else 0
        completion_rate = (
            materials_completed / materials_viewed if materials_viewed > 0 else 0
        )

        return LearningOverview(
            total_sessions=total_sessions,
            total_duration_hours=round(total_duration_hours, 2),
            avg_session_duration_minutes=round(avg_session_duration_minutes, 1),
            materials_viewed=materials_viewed,
            materials_completed=materials_completed,
            completion_rate=round(completion_rate * 100, 1),
            total_xp_earned=sessions_data.total_xp if sessions_data else 0,
            current_level=gamification_data.current_level if gamification_data else 1,
            current_streak=gamification_data.current_streak if gamification_data else 0,
            longest_streak=gamification_data.longest_streak if gamification_data else 0,
            achievements_earned=gamification_data.achievements_count if gamification_data else 0,
            daily_active_days=active_days_data.active_days if active_days_data else 0,
        )

    except Exception as e:
        logger.error(f"Error getting learning overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve learning overview",
        )


@router.get("/learning/heatmap", response_model=list[ActivityHeatmap])
async def get_activity_heatmap(
    days: int = Query(default=365, ge=7, le=365, description="Number of days to include"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[ActivityHeatmap]:
    """Get activity heatmap data for calendar visualization.

    Returns daily activity metrics for the specified period.
    """
    try:
        tracker = AnalyticsTracker(db)
        user_id = UUID(current_user["sub"])
        anonymized_user = tracker._anonymize_user_id(user_id)

        # Calculate date range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)

        # Get daily activity data
        query = await db.execute(
            """
            SELECT
                date,
                total_sessions as activity_count,
                total_duration_seconds / 60 as duration_minutes,
                xp_earned
            FROM daily_activity_summary
            WHERE user_id = :user_id
                AND date >= :start_date
                AND date <= :end_date
            ORDER BY date
            """,
            {
                "user_id": anonymized_user,
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        heatmap_data = []
        for row in query:
            heatmap_data.append(
                ActivityHeatmap(
                    date=row.date.isoformat(),
                    activity_count=row.activity_count,
                    duration_minutes=int(row.duration_minutes),
                    xp_earned=row.xp_earned,
                )
            )

        return heatmap_data

    except Exception as e:
        logger.error(f"Error getting activity heatmap: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity heatmap",
        )


@router.get("/gamification/progress", response_model=GamificationProgress)
async def get_gamification_progress(
    days: int = Query(default=30, ge=7, le=90, description="Number of days for history"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> GamificationProgress:
    """Get gamification progress and XP trends.

    Returns current gamification status and historical trends.
    """
    try:
        tracker = AnalyticsTracker(db)
        user_id = UUID(current_user["sub"])
        anonymized_user = tracker._anonymize_user_id(user_id)

        # Get current gamification stats
        stats_query = await db.execute(
            """
            SELECT
                total_xp,
                current_level,
                achievements
            FROM gamification_stats
            WHERE user_id = :user_id
            """,
            {"user_id": anonymized_user},
        )
        stats = stats_query.first()

        if not stats:
            # Return default values for new users
            return GamificationProgress(
                current_xp=0,
                current_level=1,
                xp_to_next_level=100,
                level_progress_percentage=0,
                total_achievements=0,
                recent_achievements=[],
                xp_history=[],
                streak_history=[],
            )

        # Calculate XP progress to next level (simple formula: level * 100 XP per level)
        current_level_xp = (stats.current_level - 1) * 100
        next_level_xp = stats.current_level * 100
        xp_in_current_level = stats.total_xp - current_level_xp
        xp_to_next_level = next_level_xp - stats.total_xp
        level_progress_percentage = (xp_in_current_level / 100) * 100

        # Get recent achievements (last 5)
        recent_achievements = []
        if stats.achievements:
            achievements_list = (
                stats.achievements
                if isinstance(stats.achievements, list)
                else [stats.achievements]
            )
            # Sort by earned_at and take last 5
            achievements_list.sort(
                key=lambda x: x.get("earned_at", ""), reverse=True
            )
            recent_achievements = achievements_list[:5]

        # Get XP history for the specified period
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)

        xp_history_query = await db.execute(
            """
            SELECT
                date,
                xp_earned
            FROM daily_activity_summary
            WHERE user_id = :user_id
                AND date >= :start_date
                AND date <= :end_date
            ORDER BY date
            """,
            {
                "user_id": anonymized_user,
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        xp_history = []
        cumulative_xp = stats.total_xp - sum(
            row.xp_earned for row in xp_history_query
        )

        for row in xp_history_query:
            cumulative_xp += row.xp_earned
            xp_history.append(
                {
                    "date": row.date.isoformat(),
                    "daily_xp": row.xp_earned,
                    "total_xp": cumulative_xp,
                }
            )

        # Get streak history
        streak_history_query = await db.execute(
            """
            SELECT
                timestamp::date as date,
                MAX((properties->>'streak_days')::int) as streak_days
            FROM analytics_events
            WHERE user_id = :user_id
                AND event_type = 'streak_update'
                AND timestamp >= :start_date
            GROUP BY timestamp::date
            ORDER BY date
            """,
            {
                "user_id": anonymized_user,
                "start_date": datetime.combine(start_date, datetime.min.time()),
            },
        )

        streak_history = [
            {"date": row.date.isoformat(), "streak": row.streak_days}
            for row in streak_history_query
        ]

        return GamificationProgress(
            current_xp=stats.total_xp,
            current_level=stats.current_level,
            xp_to_next_level=xp_to_next_level,
            level_progress_percentage=round(level_progress_percentage, 1),
            total_achievements=len(stats.achievements) if stats.achievements else 0,
            recent_achievements=recent_achievements,
            xp_history=xp_history,
            streak_history=streak_history,
        )

    except Exception as e:
        logger.error(f"Error getting gamification progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve gamification progress",
        )


@router.post("/events/track")
async def track_event(
    event_type: str,
    properties: dict[str, Any] = {},
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict[str, str]:
    """Track a custom analytics event.

    This is a generic endpoint for tracking various events from the frontend.
    """
    try:
        tracker = AnalyticsTracker(db)
        user_id = UUID(current_user["sub"])

        # Map event types to specific tracking methods
        if event_type == "session_start":
            material_id = properties.get("material_id")
            session_id = await tracker.start_learning_session(user_id, material_id)
            return {"message": "Session started", "session_id": str(session_id)}

        elif event_type == "session_end":
            session_id = properties.get("session_id")
            xp_earned = properties.get("xp_earned", 0)
            result = await tracker.end_learning_session(user_id, session_id, xp_earned)
            return {"message": "Session ended", "summary": result}

        elif event_type == "material_interaction":
            await tracker.track_material_interaction(
                user_id=user_id,
                material_id=UUID(properties["material_id"]),
                material_type=properties.get("material_type", "unknown"),
                interaction_type=properties.get("interaction_type", "view"),
                progress_percentage=properties.get("progress_percentage"),
                time_spent_seconds=properties.get("time_spent_seconds"),
            )
            return {"message": "Material interaction tracked"}

        elif event_type == "ai_interaction":
            await tracker.track_ai_coach_interaction(
                user_id=user_id,
                conversation_id=UUID(properties["conversation_id"]),
                event_type=properties["event_type"],
                message_id=properties.get("message_id"),
                response_time_ms=properties.get("response_time_ms"),
                rating=properties.get("rating"),
                feedback_type=properties.get("feedback_type"),
            )
            return {"message": "AI interaction tracked"}

        else:
            # For unrecognized events, store as generic events
            logger.warning(f"Unknown event type: {event_type}")
            return {"message": f"Unknown event type: {event_type}"}

    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required property: {e}",
        )
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track event",
        )


@router.get("/system/metrics")
async def get_system_metrics(
    hours: int = Query(default=24, ge=1, le=168, description="Hours of data to retrieve"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),  # Require auth but don't use user ID
) -> dict[str, Any]:
    """Get system-wide metrics for monitoring.

    Returns aggregated system metrics without user-specific data.
    """
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        # Get API metrics
        api_metrics_query = await db.execute(
            """
            SELECT
                COUNT(*) as total_requests,
                COUNT(DISTINCT endpoint) as unique_endpoints,
                AVG(response_time_ms) as avg_response_time,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as p50_response_time,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
                PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
                SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as server_error_count
            FROM system_metrics
            WHERE timestamp >= :start_time
                AND timestamp <= :end_time
            """,
            {"start_time": start_time, "end_time": end_time},
        )
        api_metrics = api_metrics_query.first()

        # Get error breakdown
        error_breakdown_query = await db.execute(
            """
            SELECT
                error_type,
                COUNT(*) as count
            FROM system_metrics
            WHERE timestamp >= :start_time
                AND timestamp <= :end_time
                AND error_type IS NOT NULL
            GROUP BY error_type
            ORDER BY count DESC
            LIMIT 10
            """,
            {"start_time": start_time, "end_time": end_time},
        )
        error_breakdown = [
            {"error_type": row.error_type, "count": row.count}
            for row in error_breakdown_query
        ]

        # Get top endpoints by request count
        top_endpoints_query = await db.execute(
            """
            SELECT
                endpoint,
                method,
                COUNT(*) as request_count,
                AVG(response_time_ms) as avg_response_time
            FROM system_metrics
            WHERE timestamp >= :start_time
                AND timestamp <= :end_time
                AND endpoint IS NOT NULL
            GROUP BY endpoint, method
            ORDER BY request_count DESC
            LIMIT 10
            """,
            {"start_time": start_time, "end_time": end_time},
        )
        top_endpoints = [
            {
                "endpoint": row.endpoint,
                "method": row.method,
                "request_count": row.request_count,
                "avg_response_time": round(row.avg_response_time, 2)
                if row.avg_response_time
                else None,
            }
            for row in top_endpoints_query
        ]

        # Get active users count (unique users with events)
        active_users_query = await db.execute(
            """
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM analytics_events
            WHERE timestamp >= :start_time
                AND timestamp <= :end_time
            """,
            {"start_time": start_time, "end_time": end_time},
        )
        active_users = active_users_query.first()

        return {
            "time_range": {"start": start_time.isoformat(), "end": end_time.isoformat()},
            "api_metrics": {
                "total_requests": api_metrics.total_requests if api_metrics else 0,
                "unique_endpoints": api_metrics.unique_endpoints if api_metrics else 0,
                "avg_response_time_ms": round(api_metrics.avg_response_time, 2)
                if api_metrics and api_metrics.avg_response_time
                else None,
                "p50_response_time_ms": round(api_metrics.p50_response_time, 2)
                if api_metrics and api_metrics.p50_response_time
                else None,
                "p95_response_time_ms": round(api_metrics.p95_response_time, 2)
                if api_metrics and api_metrics.p95_response_time
                else None,
                "p99_response_time_ms": round(api_metrics.p99_response_time, 2)
                if api_metrics and api_metrics.p99_response_time
                else None,
                "error_count": api_metrics.error_count if api_metrics else 0,
                "server_error_count": api_metrics.server_error_count if api_metrics else 0,
                "error_rate": round(
                    (api_metrics.error_count / api_metrics.total_requests * 100), 2
                )
                if api_metrics and api_metrics.total_requests > 0
                else 0,
            },
            "error_breakdown": error_breakdown,
            "top_endpoints": top_endpoints,
            "active_users": active_users.active_users if active_users else 0,
        }

    except Exception as e:
        logger.error(f"Error getting system metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system metrics",
        )