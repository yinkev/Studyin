"""Pydantic schemas for request/response validation.

This package contains all Pydantic models used for API request validation
and response serialization. Organized by domain:

- common: Shared schemas used across multiple endpoints
- api_contract: Types shared with frontend (WebSocket, API responses)
- auth: Authentication-specific request/response schemas

Barrel exports for clean imports:
    from app.schemas import MessageResponse, UserPublic, ContextChunk
"""

from __future__ import annotations

# Common schemas
from app.schemas.common import (
    ErrorResponse,
    HealthResponse,
    LoginResponse,
    MessageResponse,
    RegistrationResponse,
    TokenResponse,
    UserPublic,
)

# API contract types (shared with frontend)
from app.schemas.api_contract import (
    ContextChunk,
    MaterialMetadata,
    WebSocketClientMessage,
    WebSocketServerMessage,
    WSCompleteMessage,
    WSContextMessage,
    WSErrorMessage,
    WSInfoMessage,
    WSTokenMessage,
    WSUserMessage,
)
from app.schemas.insight import (
    InsightCreate,
    InsightUpdate,
    InsightResponse,
)
from app.schemas.questions import (
    MCQOption,
    QuestionResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    AnswerQuestionRequest,
    AnswerQuestionResponse,
)

__all__ = [
    # Common
    "ErrorResponse",
    "HealthResponse",
    "LoginResponse",
    "MessageResponse",
    "RegistrationResponse",
    "TokenResponse",
    "UserPublic",
    # API Contract
    "ContextChunk",
    "MaterialMetadata",
    "WebSocketClientMessage",
    "WebSocketServerMessage",
    "WSCompleteMessage",
    "WSContextMessage",
    "WSErrorMessage",
    "WSInfoMessage",
    "WSTokenMessage",
    "WSUserMessage",
    # Insights
    "InsightCreate",
    "InsightUpdate",
    "InsightResponse",
    # Questions
    "MCQOption",
    "QuestionResponse",
    "GenerateQuestionsRequest",
    "GenerateQuestionsResponse",
    "AnswerQuestionRequest",
    "AnswerQuestionResponse",
]
