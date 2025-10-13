"""Application-wide constants and configuration values.

This module centralizes all magic strings, numbers, and configuration values
used throughout the application. This improves maintainability by providing
a single source of truth for these values.

Usage:
    from app.constants import CSRF_COOKIE_NAME, RATE_LIMIT_AUTH_LOGIN

Organization:
    - HTTP & Security
    - Authentication & Authorization
    - Rate Limiting
    - WebSocket
    - Validation Limits
    - File Upload
    - Demo/MVP Configuration
"""

from __future__ import annotations

import uuid

# =============================================================================
# HTTP & Security
# =============================================================================

HTTP_METHODS_WITH_CSRF = frozenset({"POST", "PUT", "PATCH", "DELETE"})
"""HTTP methods that require CSRF token validation."""

# =============================================================================
# Authentication & Authorization
# =============================================================================

ACCESS_TOKEN_TYPE = "bearer"
"""Token type returned in authentication responses."""

REFRESH_COOKIE_NAME = "refresh_token"
"""Name of the HTTP-only cookie storing the refresh token."""

CSRF_COOKIE_NAME = "csrf_token"
"""Name of the cookie storing the CSRF token."""

REFRESH_TOKEN_PATH = "/api/auth/refresh"
"""API path for refresh token endpoint (used for cookie path restriction)."""

JWT_ALGORITHM = "HS256"
"""Algorithm used for JWT token signing."""

# =============================================================================
# Rate Limiting Scopes
# =============================================================================

RATE_LIMIT_AUTH_REGISTER = "auth:register"
"""Rate limit scope for user registration."""

RATE_LIMIT_AUTH_LOGIN = "auth:login"
"""Rate limit scope for user login."""

RATE_LIMIT_AUTH_REFRESH = "auth:refresh"
"""Rate limit scope for token refresh."""

RATE_LIMIT_AUTH_LOGOUT = "auth:logout"
"""Rate limit scope for user logout."""

# =============================================================================
# WebSocket
# =============================================================================

WS_PATH_PREFIX = "/ws"
"""URL path prefix for WebSocket endpoints."""

WS_CLOSE_CODE_AUTH_ERROR = 4001
"""WebSocket close code for authentication errors."""

WS_CLOSE_CODE_UNAUTHORIZED = 4401
"""WebSocket close code for unauthorized access."""

WS_CLOSE_CODE_POLICY_VIOLATION = 1008
"""WebSocket close code for policy violations."""

WS_MESSAGE_TYPE_INFO = "info"
"""WebSocket message type for informational messages."""

WS_MESSAGE_TYPE_CONTEXT = "context"
"""WebSocket message type for context/RAG chunks."""

WS_MESSAGE_TYPE_TOKEN = "token"
"""WebSocket message type for streaming tokens."""

WS_MESSAGE_TYPE_COMPLETE = "complete"
"""WebSocket message type for completion signal."""

WS_MESSAGE_TYPE_ERROR = "error"
"""WebSocket message type for error messages."""

WS_MESSAGE_TYPE_USER_MESSAGE = "user_message"
"""WebSocket message type for user messages (client → server)."""

# =============================================================================
# Validation Limits
# =============================================================================

MIN_PASSWORD_LENGTH = 8
"""Minimum length for user passwords."""

MAX_MODEL_NAME_LENGTH = 100
"""Maximum length for AI model names."""

MAX_EMAIL_LENGTH = 255
"""Maximum length for email addresses."""

# =============================================================================
# File Upload
# =============================================================================

ALLOWED_UPLOAD_EXTENSIONS = frozenset({
    ".pdf",
    ".docx",
    ".doc",
    ".txt",
    ".md",
})
"""File extensions allowed for upload."""

ALLOWED_MIME_TYPES = frozenset({
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "text/markdown",
})
"""MIME types allowed for upload."""

# =============================================================================
# Codex CLI & LLM
# =============================================================================

CODEX_ALLOWED_CLI_PATHS = frozenset({
    "/opt/homebrew/bin/codex",
    "/usr/local/bin/codex",
    "/usr/bin/codex",
})
"""Whitelisted paths for Codex CLI executable (security)."""

CODEX_PROFILE_FAST = "studyin_fast"
"""Codex profile for fast responses (lower quality, faster)."""

CODEX_PROFILE_STUDY = "studyin_study"
"""Codex profile for balanced responses (default)."""

CODEX_PROFILE_DEEP = "studyin_deep"
"""Codex profile for deep thinking (higher quality, slower)."""

CODEX_ALLOWED_PROFILES = frozenset({
    CODEX_PROFILE_FAST,
    CODEX_PROFILE_STUDY,
    CODEX_PROFILE_DEEP,
})
"""Valid Codex profile names."""

# =============================================================================
# Demo/MVP Configuration (Remove in Production!)
# =============================================================================

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
"""Hardcoded user ID for MVP/demo mode (REMOVE IN PRODUCTION!)."""

DEMO_USER_EMAIL = "demo@studyin.app"
"""Hardcoded user email for MVP/demo mode (REMOVE IN PRODUCTION!)."""

DEMO_USER_PASSWORD = "demo-password-not-for-production"
"""Hardcoded user password for MVP/demo mode (REMOVE IN PRODUCTION!)."""

# =============================================================================
# Logging & Monitoring
# =============================================================================

LOG_EVENT_REQUEST_COMPLETED = "request_completed"
"""Log event name for completed HTTP requests."""

LOG_EVENT_REQUEST_FAILED = "request_failed"
"""Log event name for failed HTTP requests."""

LOG_EVENT_USER_REGISTERED = "user_registered"
"""Log event name for user registration."""

LOG_EVENT_USER_LOGIN_SUCCESS = "user_login_success"
"""Log event name for successful login."""

LOG_EVENT_LOGIN_FAILED = "login_failed"
"""Log event name for failed login attempts."""

LOG_EVENT_TOKEN_REFRESHED = "token_refreshed"
"""Log event name for token refresh."""

LOG_EVENT_USER_LOGGED_OUT = "user_logged_out"
"""Log event name for user logout."""

# =============================================================================
# User Levels (for AI personalization)
# =============================================================================

USER_LEVEL_MIN = 1
"""Minimum user knowledge level."""

USER_LEVEL_MAX = 5
"""Maximum user knowledge level."""

USER_LEVEL_DEFAULT = 3
"""Default user knowledge level (intermediate)."""

# =============================================================================
# Analytics & Gamification
# =============================================================================

ANALYTICS_EVENT_SESSION_START = "session_start"
"""Analytics event for session start."""

ANALYTICS_EVENT_SESSION_END = "session_end"
"""Analytics event for session end."""

ANALYTICS_EVENT_CHAT_MESSAGE = "chat_message"
"""Analytics event for chat message sent."""

ANALYTICS_EVENT_MATERIAL_UPLOAD = "material_upload"
"""Analytics event for material upload."""

ANALYTICS_EVENT_QUESTION_ANSWERED = "question_answered"
"""Analytics event for question answered."""

# =============================================================================
# Environment Values
# =============================================================================

ENV_DEVELOPMENT = "development"
"""Development environment identifier."""

ENV_STAGING = "staging"
"""Staging environment identifier."""

ENV_PRODUCTION = "production"
"""Production environment identifier."""

VALID_ENVIRONMENTS = frozenset({
    ENV_DEVELOPMENT,
    ENV_STAGING,
    ENV_PRODUCTION,
})
"""Valid environment names."""
