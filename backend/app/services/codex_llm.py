"""Codex CLI integration for LLM operations.

This service uses Codex CLI (with OAuth) instead of direct API keys.
Codex CLI manages authentication and provides access to multiple models.

Security:
- CLI path whitelist validation
- Prompt sanitization and length limits
- Shell metacharacter filtering
- Safe subprocess argument passing with shlex.quote
- Comprehensive security event logging
"""

import asyncio
import json
import logging
import os
import re
import shlex
from pathlib import Path
from time import perf_counter
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Security constants - CLI path whitelist
ALLOWED_CLI_PATHS = frozenset({
    "/opt/homebrew/bin/codex",
    "/usr/local/bin/codex",
    "/usr/bin/codex",
    str(Path.home() / ".local" / "bin" / "codex"),
})

# Shell metacharacters that could be used for injection
# Note: We use shlex.quote() + subprocess.exec (no shell=True) which makes many characters safe
# Safe characters: () [] {} ; (cannot be used for injection without shell interpretation)
# Blocked characters: & | ` $ < > \ (could potentially be dangerous even with our protections)
DANGEROUS_SHELL_CHARS = re.compile(r'[&|`$<>\\]')

# Allowed model name pattern (alphanumeric, dots, hyphens, underscores only)
ALLOWED_MODEL_PATTERN = re.compile(r'^[a-zA-Z0-9._-]+$')


def _estimate_token_count(text: str, usage: Optional[Dict[str, Any]] = None) -> int:
    """Estimate tokens generated, preferring explicit usage stats when available."""
    if usage:
        for key in ("completion_tokens", "total_tokens"):
            value = usage.get(key)
            if isinstance(value, (int, float)):
                return int(value)
    if not text:
        return 0
    # Fall back to heuristic: assume ~4 characters per token, minimum 1 token
    approx = max(1, int(len(text) / 4))
    return approx


def _validate_cli_path(cli_path: str) -> str:
    """
    Validate CLI path against whitelist to prevent arbitrary command execution.

    Security: Only allow specific, trusted CLI paths to prevent command injection.
    Supports both direct paths and symlinks that point to allowed locations.

    Args:
        cli_path: Path to the Codex CLI executable

    Returns:
        Validated CLI path (original, not resolved, to preserve symlinks)

    Raises:
        ValueError: If CLI path is not in the whitelist or doesn't exist
    """
    # Get both the original and resolved paths
    original_path = str(Path(cli_path).absolute())
    resolved_path = str(Path(cli_path).resolve())

    # Check if either the original path or resolved path is in whitelist
    # This allows symlinks (e.g., /opt/homebrew/bin/codex) to work
    if original_path not in ALLOWED_CLI_PATHS and resolved_path not in ALLOWED_CLI_PATHS:
        logger.error(
            "security_cli_path_blocked",
            extra={
                "attempted_path": cli_path,
                "original_path": original_path,
                "resolved_path": resolved_path,
                "allowed_paths": list(ALLOWED_CLI_PATHS),
            }
        )
        raise ValueError(
            f"CLI path not in whitelist: {cli_path}. "
            f"Allowed paths: {', '.join(ALLOWED_CLI_PATHS)}"
        )

    # Verify file exists and is executable (check original path)
    if not os.path.exists(original_path):
        logger.error(
            "security_cli_path_not_found",
            extra={"original_path": original_path}
        )
        raise ValueError(f"CLI path does not exist: {original_path}")

    if not os.access(original_path, os.X_OK):
        logger.error(
            "security_cli_path_not_executable",
            extra={"original_path": original_path}
        )
        raise ValueError(f"CLI path is not executable: {original_path}")

    # Return the original path (preserves symlinks for better compatibility)
    return original_path


def _sanitize_prompt(prompt: str, user_id: Optional[str] = None) -> str:
    """
    Sanitize prompt to prevent command injection attacks.

    Security measures:
    - Length validation (max 50KB)
    - Shell metacharacter detection and blocking
    - Null byte filtering
    - Control character removal

    Args:
        prompt: Raw prompt from user input
        user_id: Optional user ID for logging

    Returns:
        Sanitized prompt

    Raises:
        ValueError: If prompt contains dangerous characters or exceeds length limit
    """
    if not prompt:
        raise ValueError("Prompt cannot be empty")

    # Check length limit
    prompt_length = len(prompt.encode('utf-8'))
    max_length = settings.CODEX_MAX_PROMPT_LENGTH
    if prompt_length > max_length:
        logger.error(
            "security_prompt_too_long",
            extra={
                "user_id": user_id,
                "prompt_length": prompt_length,
                "max_length": max_length,
            }
        )
        raise ValueError(
            f"Prompt exceeds maximum length: {prompt_length} bytes > {max_length} bytes"
        )

    # Check for null bytes (common injection technique)
    if '\x00' in prompt:
        logger.error(
            "security_null_byte_detected",
            extra={
                "user_id": user_id,
                "prompt_preview": prompt[:100],
            }
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
            }
        )
        raise ValueError(
            f"Prompt contains dangerous shell metacharacters: {dangerous_chars}. "
            "These characters are blocked to prevent command injection."
        )

    # Remove control characters (except tab, newline, carriage return)
    # Allow common whitespace but block other control chars
    sanitized = ''.join(
        char for char in prompt
        if char.isprintable() or char in {'\t', '\n', '\r', ' '}
    )

    if len(sanitized) != len(prompt):
        logger.warning(
            "security_control_chars_removed",
            extra={
                "user_id": user_id,
                "original_length": len(prompt),
                "sanitized_length": len(sanitized),
            }
        )

    return sanitized


def _validate_model_name(model: Optional[str], user_id: Optional[str] = None) -> Optional[str]:
    """
    Validate model name to prevent command injection through model parameter.

    Security: Only allow alphanumeric characters, dots, hyphens, and underscores.

    Args:
        model: Model name to validate
        user_id: Optional user ID for logging

    Returns:
        Validated model name or None

    Raises:
        ValueError: If model name contains invalid characters
    """
    if model is None:
        return None

    if not ALLOWED_MODEL_PATTERN.match(model):
        logger.error(
            "security_invalid_model_name",
            extra={
                "user_id": user_id,
                "model": model,
            }
        )
        raise ValueError(
            f"Invalid model name: {model}. "
            "Model names can only contain letters, numbers, dots, hyphens, and underscores."
        )

    # Additional length check
    if len(model) > 100:
        logger.error(
            "security_model_name_too_long",
            extra={
                "user_id": user_id,
                "model": model,
                "length": len(model),
            }
        )
        raise ValueError("Model name exceeds maximum length (100 characters)")

    return model


def _build_safe_command(
    cli_path: str,
    prompt: str,
    model: Optional[str] = None,
    json_mode: bool = False,
    profile: Optional[str] = None,
) -> List[str]:
    """
    Build command arguments with proper shell escaping.

    Security: Use list-based subprocess.exec to avoid shell interpretation.
    Each argument is properly escaped with shlex.quote for defense in depth.

    Args:
        cli_path: Validated CLI path
        prompt: Sanitized prompt
        model: Validated model name (usually not needed with profiles)
        json_mode: Whether to use --json flag for structured output
        profile: Codex profile name (e.g., "studyin_fast", "studyin_study", "studyin_deep")

    Returns:
        List of command arguments (safe for subprocess.exec)
    """
    # Build command as list (no shell interpretation)
    cmd = [
        cli_path,  # Already validated against whitelist
        "exec",
    ]

    # Use profile if specified (preferred over individual config)
    if profile:
        cmd.extend(["--profile", profile])

    # JSON mode for clean structured output (no parsing needed)
    if json_mode:
        cmd.append("--json")

    # Model override (usually not needed with profiles)
    if model:
        cmd.extend(["--model", model])

    # Add prompt with proper escaping (defense in depth)
    # Using shlex.quote even though we're using exec to prevent any
    # potential issues if the CLI itself uses shell commands internally
    cmd.append(shlex.quote(prompt))

    return cmd


class CodexLLMService:
    """Service for calling LLM operations via Codex CLI with security validations."""

    def __init__(self, cli_path: str | None = None):
        """
        Initialize CodexLLMService with validated CLI path.

        Args:
            cli_path: Optional path to Codex CLI executable

        Raises:
            ValueError: If CLI path is not in whitelist or not executable
        """
        raw_path = cli_path or settings.CODEX_CLI_PATH
        self.cli_path = _validate_cli_path(raw_path)
        logger.info(
            "codex_service_initialized",
            extra={"cli_path": self.cli_path}
        )

    async def generate_completion(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        stream: bool = False,
        user_id: Optional[str] = None,
        profile: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a completion using Codex CLI with security validations.

        Security:
        - Validates and sanitizes prompt (max 50KB, no shell metacharacters)
        - Validates model name (alphanumeric only)
        - Uses safe subprocess execution (no shell interpretation)

        Args:
            prompt: The prompt to send to the model
            model: Model name (usually not needed with profiles)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            stream: Whether to stream the response
            user_id: Optional user ID for logging
            profile: Codex profile (e.g., "studyin_fast", "studyin_study", "studyin_deep")

        Returns:
            Async generator for streaming tokens (always streams in MVP)

        Raises:
            ValueError: If prompt or model name contains dangerous characters
        """
        # Security: Sanitize prompt before processing
        try:
            sanitized_prompt = _sanitize_prompt(prompt, user_id=user_id)
        except ValueError as e:
            logger.error(
                "codex_prompt_validation_failed",
                extra={
                    "user_id": user_id,
                    "error": str(e),
                    "prompt_length": len(prompt),
                }
            )
            raise

        # Security: Validate model name
        effective_model = model or settings.CODEX_DEFAULT_MODEL
        try:
            validated_model = _validate_model_name(effective_model, user_id=user_id)
        except ValueError as e:
            logger.error(
                "codex_model_validation_failed",
                extra={
                    "user_id": user_id,
                    "model": effective_model,
                    "error": str(e),
                }
            )
            raise

        invocation_start = perf_counter()
        prompt_chars = len(sanitized_prompt)

        logger.info(
            "codex_invoked",
            extra={
                "user_id": user_id,
                "model": validated_model,
                "stream": stream,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "prompt_chars": prompt_chars,
            },
        )

        # Return the async generator by yielding from it
        async for chunk in self._stream_completion(
            prompt=sanitized_prompt,
            model=validated_model,
            max_tokens=max_tokens,
            temperature=temperature,
            user_id=user_id,
            invocation_start=invocation_start,
            prompt_chars=prompt_chars,
            profile=profile,
        ):
            yield chunk

    async def _generate_completion(
        self,
        *,
        prompt: str,
        model: Optional[str],
        max_tokens: int,
        temperature: float,
        user_id: Optional[str],
    ) -> tuple[str, Dict[str, Any]]:
        """
        Internal method for non-streaming completions.

        Security: Assumes prompt and model are already validated by public method.
        """
        # Build safe command (assumes inputs already validated)
        cmd = _build_safe_command(
            cli_path=self.cli_path,
            prompt=prompt,
            model=model,
            json_mode=True,
            profile=None,  # Not used for non-streaming
        )

        # Note: Codex CLI doesn't support --max-tokens or --temperature flags
        # These settings are applied by the CLI based on the model defaults

        # Security: Using create_subprocess_exec (not shell=True) to prevent shell injection
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(
                "codex_cli_error",
                extra={
                    "user_id": user_id,
                    "model": model,
                    "return_code": process.returncode,
                    "stderr": error_msg,
                },
            )
            raise RuntimeError(f"Codex CLI error: {error_msg}")

        # Parse JSON output
        try:
            result = json.loads(stdout.decode())
            if isinstance(result, dict):
                text = result.get("output") or result.get("content") or ""
                metadata: Dict[str, Any] = {
                    "usage": result.get("usage"),
                    "model": result.get("model") or model,
                }
                if not text:
                    text = str(result)
                return text, metadata
            # Non-dict JSON, treat as string content
            text_repr = str(result)
            return text_repr, {"usage": None, "model": model}
        except json.JSONDecodeError:
            # If not JSON, return raw output
            return stdout.decode().strip(), {"usage": None, "model": model}

    async def _stream_completion(
        self,
        *,
        prompt: str,
        model: Optional[str],
        max_tokens: int,
        temperature: float,
        user_id: Optional[str],
        invocation_start: float,
        prompt_chars: int,
        profile: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a completion from Codex CLI using JSON mode.

        Security: Assumes prompt and model are already validated by public method.
        Uses --json flag for structured output, parses JSON events.
        This is an async generator function that yields text chunks as they arrive.
        """
        # Build safe command with JSON mode and profile
        cmd = _build_safe_command(
            cli_path=self.cli_path,
            prompt=prompt,
            model=model,
            json_mode=True,  # Always use JSON for clean parsing
            profile=profile,
        )

        # Note: Codex CLI doesn't support --max-tokens or --temperature flags
        # These settings are applied by the CLI based on the model defaults

        # Security: Using create_subprocess_exec (not shell=True) to prevent shell injection
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        accumulated_text: List[str] = []
        first_token_logged = False

        try:
            if not process.stdout:
                return

            while True:
                # Add timeout protection to prevent hanging on slow/stalled streams
                try:
                    line = await asyncio.wait_for(
                        process.stdout.readline(),
                        timeout=settings.CODEX_STREAM_TIMEOUT
                    )
                except asyncio.TimeoutError:
                    logger.error(
                        "codex_stream_timeout",
                        extra={
                            "user_id": user_id,
                            "model": model,
                            "duration_ms": round((perf_counter() - invocation_start) * 1000, 2),
                            "timeout_seconds": settings.CODEX_STREAM_TIMEOUT,
                        }
                    )
                    raise RuntimeError(
                        f"LLM streaming timeout - no response in {settings.CODEX_STREAM_TIMEOUT} seconds"
                    )

                if not line:
                    break

                # Parse JSON line
                try:
                    event = json.loads(line.decode("utf-8", errors="ignore"))
                except json.JSONDecodeError:
                    # Skip non-JSON lines
                    continue

                # Extract agent message text from item.completed events
                if event.get("type") == "item.completed":
                    item = event.get("item", {})
                    if item.get("type") == "agent_message":
                        text = item.get("text", "")
                        if text:
                            accumulated_text.append(text)

                            # Add response size limit
                            accumulated_size = sum(len(t.encode("utf-8")) for t in accumulated_text)
                            if accumulated_size > settings.CODEX_MAX_RESPONSE_SIZE:
                                logger.error(
                                    "codex_response_too_large",
                                    extra={
                                        "user_id": user_id,
                                        "model": model,
                                        "accumulated_bytes": accumulated_size,
                                        "limit_bytes": settings.CODEX_MAX_RESPONSE_SIZE,
                                    }
                                )
                                raise RuntimeError(
                                    f"LLM response exceeded size limit"
                                )

                            if not first_token_logged:
                                first_token_ms = round((perf_counter() - invocation_start) * 1000, 2)
                                logger.info(
                                    "codex_first_token",
                                    extra={
                                        "user_id": user_id,
                                        "model": model,
                                        "duration_ms": first_token_ms,
                                        "stream": True,
                                        "prompt_chars": prompt_chars,
                                        "temperature": temperature,
                                        "max_tokens": max_tokens,
                                    },
                                )
                                first_token_logged = True

                            yield text

            returncode = await process.wait()
            if returncode != 0:
                stderr_bytes = await process.stderr.read() if process.stderr else b""
                error_msg = stderr_bytes.decode() if stderr_bytes else "Unknown Codex CLI error"
                logger.error(
                    "codex_cli_error",
                    extra={
                        "user_id": user_id,
                        "model": model,
                        "return_code": returncode,
                        "stderr": error_msg,
                    },
                )
                raise RuntimeError(f"Codex CLI streaming error: {error_msg}")

            total_duration_ms = round((perf_counter() - invocation_start) * 1000, 2)
            if not first_token_logged:
                logger.info(
                    "codex_first_token",
                    extra={
                        "user_id": user_id,
                        "model": model,
                        "duration_ms": total_duration_ms,
                        "stream": True,
                        "prompt_chars": prompt_chars,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )
            response_text = "".join(accumulated_text)
            tokens_generated = _estimate_token_count(response_text, usage=None)
            tokens_per_sec = (
                round(tokens_generated / (total_duration_ms / 1000), 2)
                if tokens_generated and total_duration_ms
                else None
            )

            logger.info(
                "codex_complete",
                extra={
                    "user_id": user_id,
                    "model": model,
                    "total_duration_ms": total_duration_ms,
                    "tokens_generated": tokens_generated,
                    "tokens_per_sec": tokens_per_sec,
                    "stream": True,
                    "received_chunks": len(accumulated_text),
                    "prompt_chars": prompt_chars,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
        except Exception as error:
            elapsed_ms = round((perf_counter() - invocation_start) * 1000, 2)
            logger.exception(
                "codex_stream_error",
                extra={
                    "user_id": user_id,
                    "model": model,
                    "duration_ms": elapsed_ms,
                    "prompt_chars": prompt_chars,
                    "error": str(error),
                },
            )
            raise
        finally:
            if process.returncode is None:
                process.kill()
                # Add timeout to prevent hanging on cleanup
                try:
                    await asyncio.wait_for(
                        process.wait(),
                        timeout=settings.CODEX_PROCESS_CLEANUP_TIMEOUT
                    )
                except asyncio.TimeoutError:
                    logger.warning(
                        "codex_process_cleanup_timeout",
                        extra={
                            "user_id": user_id,
                            "model": model,
                            "timeout_seconds": settings.CODEX_PROCESS_CLEANUP_TIMEOUT,
                        }
                    )
                    # Process will be garbage collected eventually

    async def generate_questions(
        self,
        topic: str,
        difficulty: int,
        num_questions: int = 5,
    ) -> List[Dict]:
        """
        Generate NBME-style medical questions using Codex.

        Args:
            topic: Medical topic (e.g., "Cardiac Physiology")
            difficulty: Difficulty level (1-5)
            num_questions: Number of questions to generate

        Returns:
            List of question dictionaries
        """
        prompt = f"""Generate {num_questions} NBME-style USMLE Step 1 multiple choice questions about {topic}.
Difficulty level: {difficulty}/5
Format: Return JSON array with objects containing: question, options (array of 4), correct_index, explanation.
"""
        # Collect all chunks from the async generator
        chunks = []
        async for chunk in self.generate_completion(prompt, model="gpt-5"):
            chunks.append(chunk)
        response = "".join(chunks)

        try:
            # Try to parse as JSON
            if isinstance(response, str):
                # Extract JSON from response if wrapped in markdown
                if "```json" in response:
                    json_str = response.split("```json")[1].split("```")[0].strip()
                else:
                    json_str = response
                return json.loads(json_str)
            return response
        except (json.JSONDecodeError, IndexError):
            raise ValueError(f"Failed to parse questions from Codex response: {response}")

    async def generate_teaching_response(
        self,
        context: str,
        question: str,
        user_level: int,
    ) -> str:
        """
        Generate a Socratic teaching response using Codex.

        Args:
            context: Relevant context from RAG
            question: Student's question
            user_level: Student's knowledge level (1-5)

        Returns:
            Teaching response string
        """
        prompt = f"""You are a medical educator using the Socratic method.

Context from medical texts:
{context}

Student question: {question}
Student level: {user_level}/5 (1=beginner, 5=expert)

Provide a teaching response that:
1. Doesn't directly answer, but guides thinking
2. Asks clarifying questions
3. Relates to clinical scenarios
4. Adjusts complexity to student level

Response:"""

        # Collect all chunks from the async generator
        chunks = []
        async for chunk in self.generate_completion(
            prompt,
            model="claude-3.5-sonnet",
            temperature=0.8,
        ):
            chunks.append(chunk)
        return "".join(chunks)


# Singleton instance - lazy initialization to allow tests to mock CLI path validation
_codex_llm_instance: Optional[CodexLLMService] = None


def get_codex_llm() -> CodexLLMService:
    """
    Get or create the singleton LLM service instance.

    If LLM_PROVIDER starts with "openai_", return the OpenAI-backed
    implementation instead of Codex CLI. Lazy import avoids hard deps
    when not using the OpenAI path.
    """
    provider = (settings.LLM_PROVIDER or "codex_cli").lower()
    if provider.startswith("openai_"):
        # Defer import to avoid circular deps and optional SDK install
        from app.services.openai_llm import get_openai_llm  # type: ignore

        return get_openai_llm()
    else:
        global _codex_llm_instance
        if _codex_llm_instance is None:
            _codex_llm_instance = CodexLLMService()
        return _codex_llm_instance


# Backwards compatibility property-style access
class _CodexLLMLazyProxy:
    """Lazy proxy for codex_llm singleton to defer initialization until first use."""

    def __getattr__(self, name):
        return getattr(get_codex_llm(), name)


codex_llm = _CodexLLMLazyProxy()
