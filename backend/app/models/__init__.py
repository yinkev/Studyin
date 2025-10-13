"""Database models.

This package contains SQLAlchemy ORM models for the application:
- User: User accounts and authentication
- Material: Study materials uploaded by users
- Chunk: Document chunks for RAG
- Analytics: User activity and engagement tracking
- FSRS: Spaced repetition scheduling (FSRSCard, FSRSReviewLog, FSRSParameters)
- Topics: Topic taxonomy and mastery tracking

Barrel exports for clean imports:
    from app.models import User, Material, Chunk, FSRSCard
"""

from __future__ import annotations

from app.models.base import Base
from app.models.chunk import MaterialChunk as Chunk
from app.models.material import Material
from app.models.user import User
from app.models.fsrs import FSRSCard, FSRSReviewLog, FSRSParameters
from app.models.insight import Insight
from app.models.questions import Question, QuestionAttempt
from app.models.topics import Topic, TopicMastery, TopicRelationship

# Analytics models (optional import)
try:
    from app.models.analytics import AnalyticsEvent, UserProfile

    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
        "FSRSCard",
        "FSRSReviewLog",
        "FSRSParameters",
        "Topic",
        "TopicMastery",
        "TopicRelationship",
        "Insight",
        "Question",
        "QuestionAttempt",
        "AnalyticsEvent",
        "UserProfile",
    ]
except ImportError:
    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
        "FSRSCard",
        "FSRSReviewLog",
        "FSRSParameters",
        "Topic",
        "TopicMastery",
        "TopicRelationship",
        "Insight",
        "Question",
        "QuestionAttempt",
    ]
