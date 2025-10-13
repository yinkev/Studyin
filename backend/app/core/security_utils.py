"""Security validation utilities.

This module consolidates all security-related validation functions:
- Input sanitization
- Model name validation
- CLI path validation
- Password validation

These functions are used across the application to ensure consistent
security enforcement.

Usage:
    from app.core.security_utils import sanitize_prompt, validate_model_name
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Optional

from app.constants import (
    CODEX_ALLOWED_CLI_PATHS,
    MAX_MODEL_NAME_LENGTH,
    MIN_PASSWORD_LENGTH,
)

logger = logging.getLogger(__name__)

# =============================================================================
# Input Sanitization Patterns
# =============================================================================

# Shell metacharacters that could be used for command injection
# Note: () [] {} ; are safe when not using shell=True
# Blocked: & | ` $ < > \ (potentially dangerous)
DANGEROUS_SHELL_CHARS = re.compile(r'[&|`$<>\\]')

# Allowed model name pattern (alphanumeric, dots, hyphens, underscores only)
ALLOWED_MODEL_PATTERN = re.compile(r'^[a-zA-Z0-9._-]+$')

# =============================================================================
# CLI Path Validation
# =============================================================================


def validate_cli_path(cli_path: str) -> str:
    """Validate CLI path against whitelist to prevent arbitrary command execution.

    Security: Only allow specific, trusted CLI paths to prevent command injection.
    Supports both direct paths and symlinks that point to allowed locations.

    Args:
        cli_path: Path to the Codex CLI executable

    Returns:
        Validated CLI path (original, not resolved, to preserve symlinks)

    Raises:
        ValueError: If CLI path is not in the whitelist or doesn't exist

    Example:
        >>> cli_path = validate_cli_path("/opt/homebrew/bin/codex")
        >>> # Returns: "/opt/homebrew/bin/codex" if valid
    """
    # Get both the original and resolved paths
    original_path = str(Path(cli_path).absolute())
    resolved_path = str(Path(cli_path).resolve())

    # Check if either the original path or resolved path is in whitelist
    # This allows symlinks (e.g., /opt/homebrew/bin/codex) to work
    if original_path not in CODEX_ALLOWED_CLI_PATHS and resolved_path not in CODEX_ALLOWED_CLI_PATHS:
        logger.error(
            "security_cli_path_blocked",
            extra={
                "attempted_path": cli_path,
                "original_path": original_path,
                "resolved_path": resolved_path,
                "allowed_paths": list(CODEX_ALLOWED_CLI_PATHS),
            },
        )
        raise ValueError(
            f"CLI path not in whitelist: {cli_path}. "
            f"Allowed paths: {', '.join(CODEX_ALLOWED_CLI_PATHS)}"
        )

    # Verify file exists and is executable (check original path)
    if not os.path.exists(original_path):
        logger.error("security_cli_path_not_found", extra={"original_path": original_path})
        raise ValueError(f"CLI path does not exist: {original_path}")

    if not os.access(original_path, os.X_OK):
        logger.error("security_cli_path_not_executable", extra={"original_path": original_path})
        raise ValueError(f"CLI path is not executable: {original_path}")

    # Return the original path (preserves symlinks for better compatibility)
    return original_path


# =============================================================================
# Prompt Sanitization
# =============================================================================


def sanitize_prompt(prompt: str, max_length: int = 51200, user_id: Optional[str] = None) -> str:
    """Sanitize prompt to prevent command injection attacks.

    Security measures:
    - Length validation (default max 50KB)
    - Shell metacharacter detection and blocking
    - Null byte filtering
    - Control character removal

    Args:
        prompt: Raw prompt from user input
        max_length: Maximum allowed prompt length in bytes (default: 50KB)
        user_id: Optional user ID for logging

    Returns:
        Sanitized prompt

    Raises:
        ValueError: If prompt contains dangerous characters or exceeds length limit

    Example:
        >>> sanitized = sanitize_prompt("What is the cardiac cycle?")
        >>> # Returns: "What is the cardiac cycle?"
        >>>
        >>> sanitize_prompt("rm -rf / && echo 'pwned'")
        >>> # Raises: ValueError (dangerous shell characters)
    """
    if not prompt:
        raise ValueError("Prompt cannot be empty")

    # Check length limit
    prompt_length = len(prompt.encode("utf-8"))
    if prompt_length > max_length:
        logger.error(
            "security_prompt_too_long",
            extra={
                "user_id": user_id,
                "prompt_length": prompt_length,
                "max_length": max_length,
            },
        )
        raise ValueError(f"Prompt exceeds maximum length: {prompt_length} bytes > {max_length} bytes")

    # Check for null bytes (common injection technique)
    if "\x00" in prompt:
        logger.error(
            "security_null_byte_detected",
            extra={
                "user_id": user_id,
                "prompt_preview": prompt[:100],
            },
        )
        raise ValueError("Prompt contains null bytes")

    # Check for dangerous shell metacharacters
    if DANGEROUS_SHELL_CHARS.search(prompt):
        dangerous_chars = set(DANGEROUS_SHELL_CHARS.findall(prompt))
        logger.error(
            "security_shell_metacharacters_detected",
            extra={
                "user_id": user_id,
                "dangerous_chars": list(dangerous_chars),
                "prompt_preview": prompt[:100],
            },
        )
        raise ValueError(
            f"Prompt contains dangerous shell metacharacters: {dangerous_chars}. "
            "These characters are blocked to prevent command injection."
        )

    # Remove control characters (except tab, newline, carriage return)
    # Allow common whitespace but block other control chars
    sanitized = "".join(char for char in prompt if char.isprintable() or char in {"\t", "\n", "\r", " "})

    if len(sanitized) != len(prompt):
        logger.warning(
            "security_control_chars_removed",
            extra={
                "user_id": user_id,
                "original_length": len(prompt),
                "sanitized_length": len(sanitized),
            },
        )

    return sanitized


# =============================================================================
# Model Name Validation
# =============================================================================


def validate_model_name(model: Optional[str], user_id: Optional[str] = None) -> Optional[str]:
    """Validate model name to prevent command injection through model parameter.

    Security: Only allow alphanumeric characters, dots, hyphens, and underscores.

    Args:
        model: Model name to validate
        user_id: Optional user ID for logging

    Returns:
        Validated model name or None

    Raises:
        ValueError: If model name contains invalid characters

    Example:
        >>> model = validate_model_name("gpt-5")
        >>> # Returns: "gpt-5"
        >>>
        >>> validate_model_name("gpt-5; rm -rf /")
        >>> # Raises: ValueError (invalid characters)
    """
    if model is None:
        return None

    if not ALLOWED_MODEL_PATTERN.match(model):
        logger.error(
            "security_invalid_model_name",
            extra={
                "user_id": user_id,
                "model": model,
            },
        )
        raise ValueError(
            f"Invalid model name: {model}. "
            "Model names can only contain letters, numbers, dots, hyphens, and underscores."
        )

    # Additional length check
    if len(model) > MAX_MODEL_NAME_LENGTH:
        logger.error(
            "security_model_name_too_long",
            extra={
                "user_id": user_id,
                "model": model,
                "length": len(model),
            },
        )
        raise ValueError(f"Model name exceeds maximum length ({MAX_MODEL_NAME_LENGTH} characters)")

    return model


# =============================================================================
# Password Validation
# =============================================================================


def validate_password_strength(password: str) -> str:
    """Validate password meets minimum security requirements.

    Requirements:
    - Minimum length (default: 8 characters)
    - At least one letter (uppercase or lowercase)
    - At least one number

    Args:
        password: Password to validate

    Returns:
        The validated password (unchanged)

    Raises:
        ValueError: If password doesn't meet requirements

    Example:
        >>> validate_password_strength("SecurePass123")
        >>> # Returns: "SecurePass123"
        >>>
        >>> validate_password_strength("weak")
        >>> # Raises: ValueError (too short)
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")

    # Check for at least one letter
    if not re.search(r"[a-zA-Z]", password):
        raise ValueError("Password must contain at least one letter")

    # Check for at least one number
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")

    return password


# =============================================================================
# Email Validation Helper
# =============================================================================


def normalize_email(email: str) -> str:
    """Normalize email address for consistent storage.

    - Converts to lowercase
    - Strips whitespace
    - Validates format (basic check)

    Args:
        email: Email address to normalize

    Returns:
        Normalized email address

    Raises:
        ValueError: If email format is invalid

    Example:
        >>> email = normalize_email("  User@Example.COM  ")
        >>> # Returns: "user@example.com"
    """
    normalized = email.strip().lower()

    # Basic email format check
    if "@" not in normalized or "." not in normalized.split("@")[1]:
        raise ValueError("Invalid email format")

    return normalized
