"""Codex CLI integration for LLM operations.

This service uses Codex CLI (with OAuth) instead of direct API keys.
Codex CLI manages authentication and provides access to multiple models.
"""

import asyncio
import json
import logging
from time import perf_counter
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


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


class CodexLLMService:
    """Service for calling LLM operations via Codex CLI."""

    def __init__(self, cli_path: str | None = None):
        self.cli_path = cli_path or settings.CODEX_CLI_PATH

    async def generate_completion(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        stream: bool = False,
        user_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a completion using Codex CLI.

        Args:
            prompt: The prompt to send to the model
            model: Model name (e.g., "gpt-5", "claude-3.5-sonnet")
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            stream: Whether to stream the response

        Returns:
            Async generator for streaming tokens (always streams in MVP)
        """
        effective_model = model or settings.CODEX_DEFAULT_MODEL
        invocation_start = perf_counter()
        prompt_chars = len(prompt)

        logger.info(
            "codex_invoked",
            extra={
                "user_id": user_id,
                "model": effective_model,
                "stream": stream,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "prompt_chars": prompt_chars,
            },
        )

        # Return the async generator by yielding from it
        async for chunk in self._stream_completion(
            prompt=prompt,
            model=effective_model,
            max_tokens=max_tokens,
            temperature=temperature,
            user_id=user_id,
            invocation_start=invocation_start,
            prompt_chars=prompt_chars,
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
        cmd = [
            self.cli_path,
            "exec",
            "--json",
            prompt,
        ]

        if model:
            cmd.extend(["--model", model])

        # Note: Codex CLI doesn't support --max-tokens or --temperature flags
        # These settings are applied by the CLI based on the model defaults

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
    ) -> AsyncGenerator[str, None]:
        """
        Stream a completion from Codex CLI.

        The CLI output is streamed line-by-line; consumers can decide how to buffer tokens.
        This is an async generator function that yields text chunks as they arrive.
        """
        cmd = [
            self.cli_path,
            "exec",
            prompt,
        ]

        if model:
            cmd.extend(["--model", model])

        # Note: Codex CLI doesn't support --max-tokens or --temperature flags
        # These settings are applied by the CLI based on the model defaults

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        accumulated_parts: List[str] = []
        first_token_logged = False
        try:
            if not process.stdout:
                total_duration_ms = round((perf_counter() - invocation_start) * 1000, 2)
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
                logger.info(
                    "codex_complete",
                    extra={
                        "user_id": user_id,
                        "model": model,
                        "total_duration_ms": total_duration_ms,
                        "tokens_generated": 0,
                        "tokens_per_sec": None,
                        "stream": True,
                        "received_chunks": 0,
                        "prompt_chars": prompt_chars,
                    },
                )
                return

            while True:
                # Add timeout protection to prevent hanging on slow/stalled streams
                try:
                    chunk = await asyncio.wait_for(
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

                if not chunk:
                    break

                text = chunk.decode("utf-8", errors="ignore")
                if not text:
                    continue

                accumulated_parts.append(text)

                # Add response size limit to prevent memory exhaustion
                accumulated_size = sum(len(part.encode("utf-8")) for part in accumulated_parts)
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
                        f"LLM response exceeded size limit ({accumulated_size} > {settings.CODEX_MAX_RESPONSE_SIZE} bytes)"
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
            response_text = "".join(accumulated_parts)
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
                    "received_chunks": len(accumulated_parts),
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


# Singleton instance
codex_llm = CodexLLMService()
