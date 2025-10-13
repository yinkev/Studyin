"""Analytics event tracking service.

Provides utilities for tracking user events, managing sessions,
and computing metrics with HIPAA compliance.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import date, datetime, timedelta
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import and_, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.analytics import (
    AICoachEvent,
    EventType,
    GamificationEvent,
    LearningSessionEvent,
    MaterialInteractionEvent,
    SystemMetricEvent,
)
from app.services.analytics.event_bus import publish_event

logger = logging.getLogger(__name__)


class AnalyticsTracker:
    """Analytics tracking service."""

    def __init__(self, db_session: AsyncSession):
        """Initialize the tracker.

        Args:
            db_session: Database session for persistence
        """
        self.db = db_session
        self._active_sessions: dict[UUID, UUID] = {}  # user_id -> session_id

    def _anonymize_user_id(self, user_id: UUID) -> UUID:
        """Anonymize user ID for HIPAA compliance.

        Args:
            user_id: Original user ID

        Returns:
            Anonymized UUID that's consistent for the same input
        """
        # Create a deterministic hash-based UUID
        hash_input = f"analytics:{str(user_id)}:salt"
        hash_bytes = hashlib.sha256(hash_input.encode()).digest()[:16]
        return UUID(bytes=hash_bytes)

    async def start_learning_session(
        self,
        user_id: UUID,
        material_id: Optional[UUID] = None,
    ) -> UUID:
        """Start a new learning session.

        Args:
            user_id: User ID (will be anonymized)
            material_id: Optional initial material ID

        Returns:
            Session ID
        """
        session_id = uuid4()
        anonymized_user = self._anonymize_user_id(user_id)

        # Create event
        event = LearningSessionEvent(
            event_id=uuid4(),
            event_type=EventType.SESSION_START,
            user_id=anonymized_user,
            session_id=session_id,
            material_id=material_id,
            materials_viewed=[material_id] if material_id else [],
        )

        # Publish to event bus
        await publish_event(event)

        # Store in database
        await self.db.execute(
            text("""
            INSERT INTO learning_sessions (id, user_id, started_at, materials_viewed, is_active)
            VALUES (:id, :user_id, :started_at, :materials_viewed, true)
            """),
            {
                "id": session_id,
                "user_id": anonymized_user,
                "started_at": event.timestamp,
                "materials_viewed": [material_id] if material_id else [],
            },
        )
        await self.db.commit()

        # Track active session
        self._active_sessions[anonymized_user] = session_id

        logger.info(f"Started learning session {session_id}")
        return session_id

    async def end_learning_session(
        self,
        user_id: UUID,
        session_id: Optional[UUID] = None,
        xp_earned: int = 0,
    ) -> Optional[dict[str, Any]]:
        """End a learning session.

        Args:
            user_id: User ID (will be anonymized)
            session_id: Optional session ID (uses active if not provided)
            xp_earned: XP earned in the session

        Returns:
            Session summary or None if no active session
        """
        anonymized_user = self._anonymize_user_id(user_id)

        # Get session ID
        if not session_id:
            session_id = self._active_sessions.get(anonymized_user)
        if not session_id:
            logger.warning(f"No active session for user {anonymized_user}")
            return None

        # Get session data
        result = await self.db.execute(
            text("""
            SELECT started_at, materials_viewed, materials_completed
            FROM learning_sessions
            WHERE id = :id AND user_id = :user_id AND is_active = true
            """),
            {"id": session_id, "user_id": anonymized_user},
        )
        session_data = result.first()

        if not session_data:
            logger.warning(f"Session {session_id} not found or inactive")
            return None

        # Calculate duration
        now = datetime.utcnow()
        duration = (now - session_data.started_at).total_seconds()

        # Create end event
        event = LearningSessionEvent(
            event_id=uuid4(),
            event_type=EventType.SESSION_END,
            user_id=anonymized_user,
            session_id=session_id,
            duration_seconds=int(duration),
            materials_viewed=session_data.materials_viewed or [],
            xp_earned=xp_earned,
        )

        # Publish to event bus
        await publish_event(event)

        # Update session in database
        await self.db.execute(
            text("""
            UPDATE learning_sessions
            SET ended_at = :ended_at,
                duration_seconds = :duration,
                xp_earned = :xp_earned,
                is_active = false,
                updated_at = :updated_at
            WHERE id = :id
            """),
            {
                "id": session_id,
                "ended_at": now,
                "duration": int(duration),
                "xp_earned": xp_earned,
                "updated_at": now,
            },
        )

        # Update daily summary
        await self._update_daily_summary(
            anonymized_user,
            sessions=1,
            duration=int(duration),
            materials_viewed=len(session_data.materials_viewed or []),
            materials_completed=len(session_data.materials_completed or []),
            xp_earned=xp_earned,
        )

        await self.db.commit()

        # Clear active session
        self._active_sessions.pop(anonymized_user, None)

        logger.info(f"Ended learning session {session_id}")

        return {
            "session_id": session_id,
            "duration_seconds": int(duration),
            "materials_viewed": len(session_data.materials_viewed or []),
            "materials_completed": len(session_data.materials_completed or []),
            "xp_earned": xp_earned,
        }

    async def track_material_interaction(
        self,
        user_id: UUID,
        material_id: UUID,
        material_type: str,
        interaction_type: str,
        progress_percentage: Optional[float] = None,
        time_spent_seconds: Optional[int] = None,
    ) -> None:
        """Track material interaction.

        Args:
            user_id: User ID (will be anonymized)
            material_id: Material ID
            material_type: Type of material (pdf, video, etc.)
            interaction_type: Type of interaction (view, complete, etc.)
            progress_percentage: Optional progress percentage
            time_spent_seconds: Optional time spent
        """
        anonymized_user = self._anonymize_user_id(user_id)
        session_id = self._active_sessions.get(anonymized_user)

        # Determine event type
        if interaction_type == "complete":
            event_type = EventType.MATERIAL_COMPLETE
        else:
            event_type = EventType.MATERIAL_VIEW

        # Create event
        event = MaterialInteractionEvent(
            event_id=uuid4(),
            event_type=event_type,
            user_id=anonymized_user,
            session_id=session_id,
            material_id=material_id,
            material_type=material_type,
            interaction_type=interaction_type,
            progress_percentage=progress_percentage,
            time_spent_seconds=time_spent_seconds,
        )

        # Publish to event bus
        await publish_event(event)

        # Update session if active
        if session_id:
            if interaction_type == "view":
                await self.db.execute(
                    text("""
                    UPDATE learning_sessions
                    SET materials_viewed = array_append(
                        COALESCE(materials_viewed, ARRAY[]::uuid[]),
                        :material_id
                    )
                    WHERE id = :session_id
                    AND NOT (:material_id = ANY(COALESCE(materials_viewed, ARRAY[]::uuid[])))
                    """),
                    {"session_id": session_id, "material_id": material_id},
                )
            elif interaction_type == "complete":
                await self.db.execute(
                    text("""
                    UPDATE learning_sessions
                    SET materials_completed = array_append(
                        COALESCE(materials_completed, ARRAY[]::uuid[]),
                        :material_id
                    )
                    WHERE id = :session_id
                    AND NOT (:material_id = ANY(COALESCE(materials_completed, ARRAY[]::uuid[])))
                    """),
                    {"session_id": session_id, "material_id": material_id},
                )

        await self.db.commit()

        logger.debug(f"Tracked material interaction: {interaction_type} for {material_id}")

    async def track_gamification_event(
        self,
        user_id: UUID,
        event_type: EventType,
        xp_amount: Optional[int] = None,
        new_level: Optional[int] = None,
        achievement_id: Optional[str] = None,
        streak_days: Optional[int] = None,
    ) -> None:
        """Track gamification events.

        Args:
            user_id: User ID (will be anonymized)
            event_type: Type of gamification event
            xp_amount: XP amount for XP_EARNED events
            new_level: New level for LEVEL_UP events
            achievement_id: Achievement ID for ACHIEVEMENT_EARNED events
            streak_days: Streak days for STREAK_UPDATE events
        """
        anonymized_user = self._anonymize_user_id(user_id)
        session_id = self._active_sessions.get(anonymized_user)

        # Get current gamification stats
        result = await self.db.execute(
            text("""
            SELECT total_xp, current_level, current_streak
            FROM gamification_stats
            WHERE user_id = :user_id
            """),
            {"user_id": anonymized_user},
        )
        current_stats = result.first()

        # Create event
        event = GamificationEvent(
            event_id=uuid4(),
            event_type=event_type,
            user_id=anonymized_user,
            session_id=session_id,
            xp_amount=xp_amount,
            new_level=new_level,
            achievement_id=achievement_id,
            streak_days=streak_days,
            previous_value=(
                current_stats.total_xp
                if current_stats and event_type == EventType.XP_EARNED
                else None
            ),
        )

        # Publish to event bus
        await publish_event(event)

        # Update gamification stats
        if event_type == EventType.XP_EARNED and xp_amount:
            await self._update_gamification_stats(
                anonymized_user, xp_earned=xp_amount
            )
        elif event_type == EventType.LEVEL_UP and new_level:
            await self._update_gamification_stats(
                anonymized_user, new_level=new_level
            )
        elif event_type == EventType.ACHIEVEMENT_EARNED and achievement_id:
            await self._add_achievement(anonymized_user, achievement_id)
        elif event_type == EventType.STREAK_UPDATE and streak_days is not None:
            await self._update_streak(anonymized_user, streak_days)

        await self.db.commit()

        logger.debug(f"Tracked gamification event: {event_type}")

    async def track_ai_coach_interaction(
        self,
        user_id: UUID,
        conversation_id: UUID,
        event_type: EventType,
        message_id: Optional[UUID] = None,
        response_time_ms: Optional[int] = None,
        rating: Optional[int] = None,
        feedback_type: Optional[str] = None,
    ) -> None:
        """Track AI coach interactions.

        Args:
            user_id: User ID (will be anonymized)
            conversation_id: Conversation ID
            event_type: Type of AI event
            message_id: Optional message ID
            response_time_ms: Response time in milliseconds
            rating: Optional rating (1-5)
            feedback_type: Type of feedback
        """
        anonymized_user = self._anonymize_user_id(user_id)
        session_id = self._active_sessions.get(anonymized_user)

        # Create event
        event = AICoachEvent(
            event_id=uuid4(),
            event_type=event_type,
            user_id=anonymized_user,
            session_id=session_id,
            conversation_id=conversation_id,
            message_id=message_id,
            response_time_ms=response_time_ms,
            rating=rating,
            feedback_type=feedback_type,
        )

        # Publish to event bus
        await publish_event(event)

        # Update AI coach metrics
        await self._update_ai_coach_metrics(
            anonymized_user,
            conversation_id,
            event_type,
            response_time_ms,
            rating,
        )

        if event_type == EventType.AI_MESSAGE_SENT:
            await self._update_daily_summary(
                anonymized_user, ai_messages_sent=1
            )

        await self.db.commit()

        logger.debug(f"Tracked AI coach interaction: {event_type}")

    async def track_system_metric(
        self,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        response_time_ms: Optional[int] = None,
        error_type: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Track system metrics.

        Args:
            endpoint: API endpoint
            method: HTTP method
            status_code: Response status code
            response_time_ms: Response time in milliseconds
            error_type: Type of error if any
            user_id: Optional user ID (will be anonymized)
        """
        anonymized_user = self._anonymize_user_id(user_id) if user_id else None

        # Determine event type
        if error_type:
            event_type = EventType.API_ERROR
        else:
            event_type = EventType.API_REQUEST

        # Create event
        event = SystemMetricEvent(
            event_id=uuid4(),
            event_type=event_type,
            user_id=anonymized_user,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            error_type=error_type,
        )

        # Publish to event bus
        await publish_event(event)

        # Store in system metrics table
        await self.db.execute(
            text("""
            INSERT INTO system_metrics
            (id, timestamp, endpoint, method, status_code, response_time_ms, error_type, user_id)
            VALUES (:id, :timestamp, :endpoint, :method, :status_code, :response_time_ms, :error_type, :user_id)
            """),
            {
                "id": event.event_id,
                "timestamp": event.timestamp,
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "error_type": error_type,
                "user_id": anonymized_user,
            },
        )

        await self.db.commit()

        logger.debug(f"Tracked system metric: {event_type} for {endpoint}")

    async def _update_daily_summary(
        self,
        user_id: UUID,
        sessions: int = 0,
        duration: int = 0,
        materials_viewed: int = 0,
        materials_completed: int = 0,
        xp_earned: int = 0,
        ai_messages_sent: int = 0,
    ) -> None:
        """Update daily activity summary.

        Args:
            user_id: Anonymized user ID
            sessions: Number of sessions to add
            duration: Duration in seconds to add
            materials_viewed: Materials viewed count to add
            materials_completed: Materials completed count to add
            xp_earned: XP earned to add
            ai_messages_sent: AI messages sent count to add
        """
        today = date.today()

        # Upsert daily summary
        stmt = insert(self.db.get_bind().dialect.insert_ignore_into(
            "daily_activity_summary"
        )).values(
            id=uuid4(),
            user_id=user_id,
            date=today,
            total_sessions=sessions,
            total_duration_seconds=duration,
            materials_viewed=materials_viewed,
            materials_completed=materials_completed,
            xp_earned=xp_earned,
            ai_messages_sent=ai_messages_sent,
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "date"],
            set_={
                "total_sessions": stmt.excluded.total_sessions + sessions,
                "total_duration_seconds": stmt.excluded.total_duration_seconds + duration,
                "materials_viewed": stmt.excluded.materials_viewed + materials_viewed,
                "materials_completed": stmt.excluded.materials_completed + materials_completed,
                "xp_earned": stmt.excluded.xp_earned + xp_earned,
                "ai_messages_sent": stmt.excluded.ai_messages_sent + ai_messages_sent,
                "updated_at": func.now(),
            },
        )

        await self.db.execute(stmt)

    async def _update_gamification_stats(
        self,
        user_id: UUID,
        xp_earned: int = 0,
        new_level: Optional[int] = None,
    ) -> None:
        """Update gamification statistics.

        Args:
            user_id: Anonymized user ID
            xp_earned: XP to add
            new_level: New level to set
        """
        # Upsert gamification stats
        stmt = insert(self.db.get_bind().dialect.insert_ignore_into(
            "gamification_stats"
        )).values(
            user_id=user_id,
            total_xp=xp_earned,
            current_level=new_level or 1,
            last_activity_date=date.today(),
        )

        update_dict = {
            "total_xp": stmt.excluded.total_xp + xp_earned,
            "last_activity_date": date.today(),
            "updated_at": func.now(),
        }

        if new_level:
            update_dict["current_level"] = new_level

        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id"],
            set_=update_dict,
        )

        await self.db.execute(stmt)

    async def _add_achievement(
        self,
        user_id: UUID,
        achievement_id: str,
    ) -> None:
        """Add achievement to user's collection.

        Args:
            user_id: Anonymized user ID
            achievement_id: Achievement ID to add
        """
        await self.db.execute(
            text("""
            UPDATE gamification_stats
            SET achievements = achievements || :achievement::jsonb,
                updated_at = NOW()
            WHERE user_id = :user_id
            """),
            {
                "user_id": user_id,
                "achievement": json.dumps(
                    {"id": achievement_id, "earned_at": datetime.utcnow().isoformat()}
                ),
            },
        )

    async def _update_streak(self, user_id: UUID, streak_days: int) -> None:
        """Update user's streak.

        Args:
            user_id: Anonymized user ID
            streak_days: New streak value
        """
        await self.db.execute(
            text("""
            UPDATE gamification_stats
            SET current_streak = :streak_days,
                longest_streak = GREATEST(longest_streak, :streak_days),
                last_activity_date = :today,
                updated_at = NOW()
            WHERE user_id = :user_id
            """),
            {"user_id": user_id, "streak_days": streak_days, "today": date.today()},
        )

    async def _update_ai_coach_metrics(
        self,
        user_id: UUID,
        conversation_id: UUID,
        event_type: EventType,
        response_time_ms: Optional[int] = None,
        rating: Optional[int] = None,
    ) -> None:
        """Update AI coach metrics.

        Args:
            user_id: Anonymized user ID
            conversation_id: Conversation ID
            event_type: Event type
            response_time_ms: Response time
            rating: User rating
        """
        # Check if metrics exist
        result = await self.db.execute(
            text("""
            SELECT id, message_count, avg_response_time_ms, avg_rating, total_ratings
            FROM ai_coach_metrics
            WHERE user_id = :user_id AND conversation_id = :conversation_id
            """),
            {"user_id": user_id, "conversation_id": conversation_id},
        )
        metrics = result.first()

        if metrics:
            # Update existing metrics
            update_dict = {"updated_at": func.now()}

            if event_type in {EventType.AI_MESSAGE_SENT, EventType.AI_MESSAGE_RECEIVED}:
                update_dict["message_count"] = metrics.message_count + 1

            if response_time_ms and event_type == EventType.AI_MESSAGE_RECEIVED:
                if metrics.avg_response_time_ms:
                    # Calculate new average
                    total_time = metrics.avg_response_time_ms * metrics.message_count
                    new_avg = (total_time + response_time_ms) / (metrics.message_count + 1)
                    update_dict["avg_response_time_ms"] = int(new_avg)
                else:
                    update_dict["avg_response_time_ms"] = response_time_ms

            if rating and event_type == EventType.AI_FEEDBACK_RATED:
                if metrics.avg_rating:
                    # Calculate new average rating
                    total_rating = metrics.avg_rating * metrics.total_ratings
                    new_avg = (total_rating + rating) / (metrics.total_ratings + 1)
                    update_dict["avg_rating"] = new_avg
                else:
                    update_dict["avg_rating"] = float(rating)
                update_dict["total_ratings"] = metrics.total_ratings + 1

            await self.db.execute(
                update("ai_coach_metrics")
                .where(
                    and_(
                        self.db.get_bind().dialect.ai_coach_metrics.c.id == metrics.id
                    )
                )
                .values(**update_dict)
            )
        else:
            # Insert new metrics
            await self.db.execute(
                text("""
                INSERT INTO ai_coach_metrics
                (id, user_id, conversation_id, message_count, avg_response_time_ms, avg_rating, total_ratings)
                VALUES (:id, :user_id, :conversation_id, :message_count, :avg_response_time_ms, :avg_rating, :total_ratings)
                """),
                {
                    "id": uuid4(),
                    "user_id": user_id,
                    "conversation_id": conversation_id,
                    "message_count": 1 if event_type in {EventType.AI_MESSAGE_SENT, EventType.AI_MESSAGE_RECEIVED} else 0,
                    "avg_response_time_ms": response_time_ms if response_time_ms else None,
                    "avg_rating": float(rating) if rating else None,
                    "total_ratings": 1 if rating else 0,
                },
            )


# Import json for achievement storage
import json