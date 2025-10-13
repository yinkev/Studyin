"""Analytics event models with HIPAA-compliant design.

All events use anonymized user IDs and avoid storing any PII.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class EventType(str, Enum):
    """Analytics event types."""

    # Learning events
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    MATERIAL_VIEW = "material_view"
    MATERIAL_COMPLETE = "material_complete"

    # Gamification events
    XP_EARNED = "xp_earned"
    LEVEL_UP = "level_up"
    ACHIEVEMENT_EARNED = "achievement_earned"
    STREAK_UPDATE = "streak_update"

    # AI coach events
    AI_MESSAGE_SENT = "ai_message_sent"
    AI_MESSAGE_RECEIVED = "ai_message_received"
    AI_FEEDBACK_RATED = "ai_feedback_rated"

    # System events
    API_REQUEST = "api_request"
    API_ERROR = "api_error"
    SEARCH_QUERY = "search_query"


class BaseEvent(BaseModel):
    """Base model for all analytics events."""

    event_id: UUID
    event_type: EventType
    user_id: Optional[UUID] = None  # Anonymized user ID (optional for system events)
    session_id: Optional[UUID] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    properties: dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class LearningSessionEvent(BaseEvent):
    """Learning session tracking events."""

    user_id: UUID  # Required for learning events
    event_type: EventType = Field(...)
    material_id: Optional[UUID] = None
    duration_seconds: Optional[int] = None
    materials_viewed: list[UUID] = Field(default_factory=list)
    xp_earned: int = 0

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: EventType) -> EventType:
        if v not in {EventType.SESSION_START, EventType.SESSION_END}:
            raise ValueError("Invalid event type for learning session")
        return v


class MaterialInteractionEvent(BaseEvent):
    """Material interaction tracking."""

    user_id: UUID  # Required for material events
    event_type: EventType = Field(...)
    material_id: UUID
    material_type: str  # 'pdf', 'video', 'quiz', etc.
    interaction_type: str  # 'view', 'complete', 'bookmark', etc.
    progress_percentage: Optional[float] = None
    time_spent_seconds: Optional[int] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: EventType) -> EventType:
        if v not in {EventType.MATERIAL_VIEW, EventType.MATERIAL_COMPLETE}:
            raise ValueError("Invalid event type for material interaction")
        return v


class GamificationEvent(BaseEvent):
    """Gamification event tracking."""

    user_id: UUID  # Required for gamification events
    event_type: EventType = Field(...)
    xp_amount: Optional[int] = None
    new_level: Optional[int] = None
    achievement_id: Optional[str] = None
    streak_days: Optional[int] = None
    previous_value: Optional[int] = None
    new_value: Optional[int] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: EventType) -> EventType:
        valid_types = {
            EventType.XP_EARNED,
            EventType.LEVEL_UP,
            EventType.ACHIEVEMENT_EARNED,
            EventType.STREAK_UPDATE,
        }
        if v not in valid_types:
            raise ValueError("Invalid event type for gamification")
        return v


class AICoachEvent(BaseEvent):
    """AI coach interaction tracking."""

    user_id: UUID  # Required for AI coach events
    event_type: EventType = Field(...)
    conversation_id: UUID
    message_id: Optional[UUID] = None
    response_time_ms: Optional[int] = None
    rating: Optional[int] = None  # 1-5 rating
    feedback_type: Optional[str] = None  # 'helpful', 'not_helpful', etc.

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: EventType) -> EventType:
        valid_types = {
            EventType.AI_MESSAGE_SENT,
            EventType.AI_MESSAGE_RECEIVED,
            EventType.AI_FEEDBACK_RATED,
        }
        if v not in valid_types:
            raise ValueError("Invalid event type for AI coach")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class SystemMetricEvent(BaseEvent):
    """System performance and health metrics."""

    event_type: EventType = Field(...)
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    query_string: Optional[str] = None
    result_count: Optional[int] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: EventType) -> EventType:
        valid_types = {EventType.API_REQUEST, EventType.API_ERROR, EventType.SEARCH_QUERY}
        if v not in valid_types:
            raise ValueError("Invalid event type for system metric")
        return v


# Aggregation models for API responses
class LearningOverview(BaseModel):
    """30-day learning overview metrics."""

    total_sessions: int
    total_duration_hours: float
    avg_session_duration_minutes: float
    materials_viewed: int
    materials_completed: int
    completion_rate: float
    total_xp_earned: int
    current_level: int
    current_streak: int
    longest_streak: int
    achievements_earned: int
    daily_active_days: int


class ActivityHeatmap(BaseModel):
    """Activity heatmap data point."""

    date: str  # ISO date format
    activity_count: int
    duration_minutes: int
    xp_earned: int


class GamificationProgress(BaseModel):
    """Gamification progress metrics."""

    current_xp: int
    current_level: int
    xp_to_next_level: int
    level_progress_percentage: float
    total_achievements: int
    recent_achievements: list[dict[str, Any]]
    xp_history: list[dict[str, Any]]  # Daily XP for charts
    streak_history: list[dict[str, Any]]  # Streak tracking


class AnalyticsFilter(BaseModel):
    """Filter parameters for analytics queries."""

    user_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    event_types: Optional[list[EventType]] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)