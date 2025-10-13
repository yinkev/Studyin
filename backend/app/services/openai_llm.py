from __future__ import annotations

"""
OpenAI-compatible LLM service using the official SDK.

Designed to be a drop-in alternative to CodexLLMService.generate_completion
with the same async streaming shape used by the chat WebSocket.

It reads configuration from app.config.Settings (OPENAI_BASE_URL, OPENAI_API_KEY)
and supports per-request model overrides (e.g., "gpt-5-high").
"""

import asyncio
from typing import AsyncGenerator, Dict, Optional

from app.config import settings

try:  # pragma: no cover - import guard for environments without SDK
    from openai import AsyncOpenAI
except Exception:  # pragma: no cover
    AsyncOpenAI = None  # type: ignore


class OpenAILLMService:
    """Async OpenAI-compatible client wrapper producing text token streams."""

    def __init__(self) -> None:
        if AsyncOpenAI is None:
            raise RuntimeError(
                "openai package not installed. Install with `pip install openai`."
            )

        base_url = settings.OPENAI_BASE_URL or "http://127.0.0.1:8801/v1"
        api_key = settings.OPENAI_API_KEY or "x"  # ChatMock accepts any non-empty key
        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key)

    async def generate_completion(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        stream: bool = True,
        user_id: Optional[str] = None,  # unused but kept for interface parity
        profile: Optional[str] = None,  # unused but kept for interface parity
    ) -> AsyncGenerator[str, None]:
        """
        Stream (or return once) the assistant text for a single-turn prompt.

        Returns an async generator of string chunks, matching CodexLLMService.
        """
        effective_model = model or settings.OPENAI_DEFAULT_MODEL or "gpt-5"

        # Convert single string prompt to OpenAI Chat messages
        messages = [
            {"role": "user", "content": prompt},
        ]

        if stream:
            # Stream tokens as they arrive
            stream_resp = await self.client.chat.completions.create(
                model=effective_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            try:
                async for chunk in stream_resp:
                    try:
                        delta = chunk.choices[0].delta
                        text = getattr(delta, "content", None)
                    except Exception:  # robust to SDK object shape
                        text = None
                    if text:
                        yield text
            finally:
                # Best-effort close; AsyncOpenAI stream supports aclose()
                close = getattr(stream_resp, "aclose", None)
                if callable(close):
                    try:
                        await close()
                    except Exception:
                        pass
        else:
            # Non-streaming: yield once
            resp = await self.client.chat.completions.create(
                model=effective_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            try:
                content = resp.choices[0].message.content or ""
            except Exception:
                content = ""
            yield content


_openai_llm_instance: Optional[OpenAILLMService] = None


def get_openai_llm() -> OpenAILLMService:
    global _openai_llm_instance
    if _openai_llm_instance is None:
        _openai_llm_instance = OpenAILLMService()
    return _openai_llm_instance

