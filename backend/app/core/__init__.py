"""Core application utilities and services.

This package contains core functionality used across the application:
- JWT token management (jwt.py)
- Password hashing and verification (password.py)
- Rate limiting (rate_limit.py)
- Security validation utilities (security_utils.py)
- Application startup/shutdown (startup.py)
- Logging configuration (logging_config.py)

Barrel exports for clean imports:
    from app.core import create_access_token, hash_password, validate_model_name
"""

from __future__ import annotations

# JWT operations
from app.core.jwt import create_access_token, create_refresh_token, verify_access_token, verify_refresh_token

# Password operations
from app.core.password import hash_password, verify_password

# Security validations
from app.core.security_utils import (
    normalize_email,
    sanitize_prompt,
    validate_cli_path,
    validate_model_name,
    validate_password_strength,
)

# Rate limiting
from app.core.rate_limit import limiter

__all__ = [
    # JWT
    "create_access_token",
    "create_refresh_token",
    "verify_access_token",
    "verify_refresh_token",
    # Password
    "hash_password",
    "verify_password",
    # Security
    "normalize_email",
    "sanitize_prompt",
    "validate_cli_path",
    "validate_model_name",
    "validate_password_strength",
    # Rate limiting
    "limiter",
]
