from __future__ import annotations

import asyncio
import inspect
import time
from collections import defaultdict, deque
from functools import wraps
from typing import Callable, Deque, Dict, Optional, TypeVar

from fastapi import HTTPException, Request

CallableType = TypeVar("CallableType", bound=Callable[..., object])

_UNIT_SECONDS = {
    "s": 1,
    "sec": 1,
    "second": 1,
    "seconds": 1,
    "m": 60,
    "min": 60,
    "minute": 60,
    "minutes": 60,
    "h": 3600,
    "hr": 3600,
    "hour": 3600,
    "hours": 3600,
}


class RateLimiter:
    """Lightweight in-memory rate limiter for FastAPI routes.

    The limiter uses a sliding window counter stored in-process. It is intended
    for small deployments and protects sensitive endpoints (auth, uploads)
    without introducing additional infrastructure dependencies.
    """

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)

    @staticmethod
    def _parse_rule(rule: str) -> tuple[int, float]:
        """Parse a rule string like '10/minute' into (limit, window_seconds)."""
        try:
            limit_str, window_str = rule.split("/", 1)
            limit = int(limit_str)
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid rate limit rule '{rule}'. Expected format 'N/period'.")

        window = _UNIT_SECONDS.get(window_str.strip().lower())
        if window is None:
            raise ValueError(
                f"Unsupported period '{window_str}'. "
                f"Use seconds, minutes, or hours."
            )
        return limit, float(window)

    @staticmethod
    def _find_request(args: tuple[object, ...], kwargs: dict[str, object]) -> Optional[Request]:
        for value in kwargs.values():
            if isinstance(value, Request):
                return value
        for value in reversed(args):
            if isinstance(value, Request):
                return value
        return None

    def _build_key(self, request: Optional[Request], scope: Optional[str]) -> str:
        base_scope = scope or "global"
        if request is None:
            return base_scope

        client_host = request.client.host if request.client else "unknown"
        path = request.url.path
        return f"{base_scope}:{client_host}:{path}"

    async def _throttle(self, key: str, limit: int, window: float) -> None:
        now = time.monotonic()
        async with self._lock:
            history = self._requests[key]

            cutoff = now - window
            while history and history[0] <= cutoff:
                history.popleft()

            if len(history) >= limit:
                retry_after = max(0, window - (now - history[0]))
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please retry later.",
                    headers={"Retry-After": f"{int(retry_after) + 1}"},
                )

            history.append(now)

    def limit(
        self,
        rule: str,
        *,
        scope: Optional[str] = None,
    ) -> Callable[[CallableType], CallableType]:
        """Decorate a FastAPI endpoint with a rate limit."""

        limit, window = self._parse_rule(rule)

        def decorator(func: CallableType) -> CallableType:
            if inspect.iscoroutinefunction(func):

                @wraps(func)
                async def async_wrapper(*args, **kwargs):
                    request = self._find_request(args, kwargs)
                    key = self._build_key(request, scope)
                    await self._throttle(key, limit, window)
                    return await func(*args, **kwargs)

                return async_wrapper  # type: ignore[return-value]

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                request = self._find_request(args, kwargs)
                key = self._build_key(request, scope)
                # Run the async throttling coroutine in the current loop.
                coroutine = self._throttle(key, limit, window)
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    asyncio.run(coroutine)
                else:
                    loop.run_until_complete(coroutine)
                return func(*args, **kwargs)

            return sync_wrapper  # type: ignore[return-value]

        return decorator


limiter = RateLimiter()
