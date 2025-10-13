from __future__ import annotations

import logging
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth as auth_routes
from app.api import chat as chat_routes
from app.api import materials as materials_routes
from app.api import analytics as analytics_routes
from app.core.logging_config import setup_logging
from app.core.startup import lifespan
from app.middleware.csrf import validate_csrf_token
from app.middleware.analytics import AnalyticsMiddleware
from app.config import settings
from monitoring.health import router as health_router

setup_logging()

performance_logger = logging.getLogger("performance")
security_logger = logging.getLogger("security")

app = FastAPI(title="StudyIn API", lifespan=lifespan)

if "*" in settings.CORS_ALLOW_ORIGINS and settings.ENVIRONMENT != "development":
    security_logger.warning("Wildcard CORS origin detected outside development environment.")

cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": settings.get_cors_methods_list(),
    "allow_headers": settings.get_cors_headers_list(),
}

if settings.CORS_ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ALLOW_ORIGIN_REGEX
else:
    cors_kwargs["allow_origins"] = settings.get_cors_origins_list()

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs,
)

# Add analytics middleware for request tracking
app.add_middleware(AnalyticsMiddleware)


@app.middleware("http")
async def request_metrics_middleware(request: Request, call_next):
    # Skip middleware for WebSocket connections
    if request.url.path.startswith("/ws") or request.url.path.endswith("/ws"):
        return await call_next(request)

    start = perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = (perf_counter() - start) * 1000
        security_logger.error(
            "request_failed",
            extra={
                "path": request.url.path,
                "method": request.method,
                "duration_ms": round(duration_ms, 2),
                "error": str(exc),
            },
        )
        raise

    duration_ms = (perf_counter() - start) * 1000
    performance_logger.info(
        "request_completed",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        },
    )
    return response


@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Skip middleware for WebSocket connections
    if request.url.path.startswith("/ws") or request.url.path.endswith("/ws"):
        return await call_next(request)

    # await validate_csrf_token(request)  # Disabled for MVP testing
    response = await call_next(request)
    return response


app.include_router(auth_routes.router)
app.include_router(materials_routes.router, prefix="/api/materials", tags=["materials"])
app.include_router(chat_routes.router)
app.include_router(analytics_routes.router)
app.include_router(health_router, prefix="/health", tags=["health"])
