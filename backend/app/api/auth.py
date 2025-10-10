from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from app.core.rate_limit import limiter
from app.middleware.csrf import CSRF_COOKIE_NAME, ensure_csrf_cookie

router = APIRouter(prefix="/api/auth", tags=["auth"])

security_logger = logging.getLogger("security")


class LoginRequest(BaseModel):
    email: str
    password: str


async def authenticate(credentials: LoginRequest):  # pragma: no cover - stub
    if credentials.email and credentials.password:
        return {"id": uuid.uuid4(), "email": credentials.email}

    security_logger.warning(
        "invalid_login_attempt",
        extra={
            "email": credentials.email,
        },
    )
    raise HTTPException(401, "Invalid credentials")


def _create_access_token(user_id: uuid.UUID) -> str:
    return f"access-{user_id}-{datetime.utcnow().timestamp()}"


def _create_refresh_token(user_id: uuid.UUID) -> str:
    return f"refresh-{user_id}-{datetime.utcnow().timestamp()}"


@router.post("/login")
@limiter.limit("10/minute", scope="auth:login")
async def login(credentials: LoginRequest, response: Response, request: Request) -> dict:
    user = await authenticate(credentials)

    access_token = _create_access_token(user["id"])
    refresh_token = _create_refresh_token(user["id"])

    security_logger.info(
        "user_login_success",
        extra={
            "email": credentials.email,
            "ip": request.client.host if request.client else "unknown",
        },
    )

    ensure_csrf_cookie(response, existing_token=None)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=int(timedelta(days=7).total_seconds()),
        path="/api/auth/refresh",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
        },
    }


@router.post("/refresh")
@limiter.limit("20/minute", scope="auth:refresh")
async def refresh_token(request: Request, response: Response) -> dict:
    refresh_cookie = request.cookies.get("refresh_token")
    if not refresh_cookie:
        security_logger.warning(
            "refresh_without_cookie",
            extra={
                "path": str(request.url.path),
                "ip": request.client.host if request.client else "unknown",
            },
        )
        raise HTTPException(401, "Refresh token missing.")

    fake_user_id = uuid.uuid4()
    access_token = _create_access_token(fake_user_id)

    security_logger.info(
        "token_refreshed",
        extra={
            "ip": request.client.host if request.client else "unknown",
        },
    )

    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    ensure_csrf_cookie(response, existing_token=csrf_cookie)

    response.set_cookie(
        key="refresh_token",
        value=_create_refresh_token(fake_user_id),
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=int(timedelta(days=7).total_seconds()),
        path="/api/auth/refresh",
    )

    return {"access_token": access_token}


@router.post("/logout")
@limiter.limit("10/minute", scope="auth:logout")
async def logout(response: Response, request: Request) -> dict:
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth/refresh",
    )
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path="/",
    )

    security_logger.info(
        "user_logged_out",
        extra={"ip": request.client.host if request.client else "unknown"},
    )

    return {"detail": "Logged out"}
