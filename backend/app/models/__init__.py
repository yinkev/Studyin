"""Database models.

This package contains SQLAlchemy ORM models for the application:
- User: User accounts and authentication
- Material: Study materials uploaded by users
- Chunk: Document chunks for RAG
- Analytics: User activity and engagement tracking

Barrel exports for clean imports:
    from app.models import User, Material, Chunk
"""

from __future__ import annotations

from app.models.base import Base
from app.models.chunk import MaterialChunk as Chunk
from app.models.material import Material
from app.models.user import User

# Analytics models (optional import)
try:
    from app.models.analytics import AnalyticsEvent, UserProfile

    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
        "AnalyticsEvent",
        "UserProfile",
    ]
except ImportError:
    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
    ]
