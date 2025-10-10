"""Health and readiness endpoints."""

from __future__ import annotations

import asyncio
import os
from typing import Any, Dict, Tuple

import asyncpg
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy.engine import make_url

router = APIRouter()


@router.get("/live", summary="Liveness probe")
async def live() -> Dict[str, str]:
    """Return basic heartbeat for orchestrators."""
    return {"status": "alive"}


async def _check_postgres() -> Tuple[str, Dict[str, Any]]:
    url = os.getenv("DATABASE_URL")
    if not url:
        return "skipped", {"detail": "DATABASE_URL not provided"}

    try:
        db_url = make_url(url)
        driverless_url = db_url.set(drivername="postgresql+asyncpg")
        asyncpg_dsn = driverless_url.render_as_string(hide_password=False).replace(
            "postgresql+asyncpg", "postgresql"
        )
        conn = await asyncpg.connect(asyncpg_dsn, timeout=3)
        await conn.close()
        return "ok", {"detail": "Connection successful"}
    except Exception as exc:  # pragma: no cover - network dependent
        return "error", {"detail": str(exc)}


async def _check_redis() -> Tuple[str, Dict[str, Any]]:
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", "6379"))
    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=2)
    except Exception as exc:  # pragma: no cover - network dependent
        return "error", {"detail": str(exc)}
    else:
        writer.close()
        await writer.wait_closed()
        return "ok", {"detail": f"Connected to {host}:{port}"}


async def _check_clamav() -> Tuple[str, Dict[str, Any]]:
    host = os.getenv("CLAMAV_HOST")
    port = os.getenv("CLAMAV_PORT")
    socket_path = os.getenv("CLAMAV_SOCKET")

    if socket_path and os.path.exists(socket_path):  # pragma: no cover - environment dependent
        return "ok", {"detail": f"Socket available at {socket_path}"}

    if not host or not port:
        return "skipped", {"detail": "ClamAV host/port not configured"}

    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(host, int(port)), timeout=2)
    except Exception as exc:  # pragma: no cover - network dependent
        return "error", {"detail": str(exc)}
    else:
        writer.close()
        await writer.wait_closed()
        return "ok", {"detail": f"Connected to {host}:{port}"}


@router.get("/ready", summary="Readiness probe")
async def ready():
    """Aggregate readiness across dependencies."""

    postgres_status, postgres_detail = await _check_postgres()
    redis_status, redis_detail = await _check_redis()
    clamav_status, clamav_detail = await _check_clamav()

    checks = {
        "postgres": {"status": postgres_status, **postgres_detail},
        "redis": {"status": redis_status, **redis_detail},
        "clamav": {"status": clamav_status, **clamav_detail},
    }

    overall_ok = all(check["status"] == "ok" for check in checks.values() if check["status"] != "skipped")

    status_code = 200 if overall_ok else 503
    overall_status = "ok" if overall_ok else "degraded"

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "checks": checks,
        },
    )
