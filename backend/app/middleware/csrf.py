"""CSRF protection utilities."""

from __future__ import annotations

import secrets
from typing import Final

from fastapi import HTTPException, Request
from fastapi.responses import Response

CSRF_COOKIE_NAME: Final[str] = "csrf_token"
CSRF_HEADER_NAME: Final[str] = "X-CSRF-Token"
CSRF_SAFE_METHODS: Final[set[str]] = {"GET", "HEAD", "OPTIONS"}
CSRF_EXEMPT_PATHS: Final[set[str]] = {
    "/api/auth/login",
    "/api/auth/register",
}


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=True,
        samesite="strict",
        max_age=86400,
        path="/",
    )


def _normalize_token(value: str | None) -> str | None:
    if not value:
        return None
    token = value.strip()
    if len(token) > 128:
        return None
    return token


def _should_skip_validation(request: Request) -> bool:
    if request.method.upper() in CSRF_SAFE_METHODS:
        return True
    path = request.url.path.rstrip("/") or "/"
    return path in CSRF_EXEMPT_PATHS


async def validate_csrf_token(request: Request) -> None:
    if _should_skip_validation(request):
        return

    token_header = _normalize_token(request.headers.get(CSRF_HEADER_NAME))
    token_cookie = _normalize_token(request.cookies.get(CSRF_COOKIE_NAME))

    if not token_header or not token_cookie:
        raise HTTPException(403, "CSRF token missing.")

    if not secrets.compare_digest(token_header, token_cookie):
        raise HTTPException(403, "CSRF token invalid.")


def ensure_csrf_cookie(response: Response, *, existing_token: str | None) -> str:
    """Ensure that the response carries a CSRF cookie and return the active token."""

    token = existing_token or generate_csrf_token()
    set_csrf_cookie(response, token)
    return token
