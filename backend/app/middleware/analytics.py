"""Analytics middleware for automatic request tracking.

Tracks API requests, response times, and errors for system monitoring.
"""

from __future__ import annotations

import logging
import time
from typing import Callable
from uuid import UUID, uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.models.analytics import EventType, SystemMetricEvent
from app.services.analytics import publish_event

logger = logging.getLogger(__name__)


class AnalyticsMiddleware(BaseHTTPMiddleware):
    """Middleware for tracking API analytics."""

    # Endpoints to exclude from tracking
    EXCLUDED_PATHS = {
        "/health",
        "/metrics",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    }

    # Paths that should not log user IDs for privacy
    ANONYMOUS_PATHS = {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/logout",
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and track metrics.

        Args:
            request: The incoming request
            call_next: The next middleware/endpoint handler

        Returns:
            The response from the application
        """
        # Skip excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Skip OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Record start time
        start_time = time.time()

        # Initialize tracking variables
        status_code = 500  # Default to error if exception occurs
        error_type = None
        user_id = None

        try:
            # Get user ID if authenticated and not an anonymous path
            if request.url.path not in self.ANONYMOUS_PATHS:
                # Try to extract user ID from request state (set by auth middleware)
                if hasattr(request.state, "user_id"):
                    user_id = request.state.user_id

            # Process the request
            response = await call_next(request)
            status_code = response.status_code

            # Determine if this is an error
            if status_code >= 400:
                if status_code < 500:
                    error_type = "client_error"
                else:
                    error_type = "server_error"

            return response

        except Exception as e:
            # Log the exception
            logger.error(f"Request failed: {e}")
            error_type = type(e).__name__
            raise

        finally:
            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)

            # Skip tracking for very fast health checks
            if request.url.path == "/health" and response_time_ms < 10:
                return

            try:
                # Create system metric event
                event = SystemMetricEvent(
                    event_id=uuid4(),
                    event_type=EventType.API_ERROR if error_type else EventType.API_REQUEST,
                    user_id=UUID(user_id) if user_id else None,
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    error_type=error_type,
                )

                # Publish event asynchronously (fire and forget)
                await publish_event(event)

                # Log slow requests
                if response_time_ms > 1000:  # Log requests slower than 1 second
                    logger.warning(
                        f"Slow request: {request.method} {request.url.path} "
                        f"took {response_time_ms}ms (status: {status_code})"
                    )

            except Exception as tracking_error:
                # Don't let tracking errors affect the response
                logger.error(f"Failed to track request analytics: {tracking_error}")