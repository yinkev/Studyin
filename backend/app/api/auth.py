import logging
from datetime import timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, field_validator

from app.core.jwt import create_access_token, create_refresh_token, verify_refresh_token
from app.core.password import hash_password, verify_password
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.middleware.csrf import CSRF_COOKIE_NAME, ensure_csrf_cookie
from app.models.user import User

try:  # pragma: no cover - optional dependency guard
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore
    select = None  # type: ignore

router = APIRouter(prefix="/api/auth", tags=["auth"])

security_logger = logging.getLogger("security")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _require_session(session: AsyncSession) -> AsyncSession:
    if isinstance(session, object) and session.__class__ is object:  # pragma: no cover
        raise RuntimeError("AsyncSession dependency missing. Install SQLAlchemy for full functionality.")
    return session


@router.post("/register")
@limiter.limit("5/hour", scope="auth:register")
async def register(
    data: RegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Register a new user."""
    session = _require_session(session)

    if select is None:  # pragma: no cover
        raise RuntimeError("SQLAlchemy must be installed for user registration")

    # Check if user already exists
    result = await session.execute(select(User).where(User.email == data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        security_logger.warning(
            "registration_duplicate_email",
            extra={
                "email": data.email,
                "ip": request.client.host if request.client else "unknown",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = hash_password(data.password)
    user = User(email=data.email, password_hash=hashed_password)

    session.add(user)
    await session.commit()
    await session.refresh(user)

    security_logger.info(
        "user_registered",
        extra={
            "email": user.email,
            "user_id": str(user.id),
            "ip": request.client.host if request.client else "unknown",
        },
    )

    return {
        "message": "User registered successfully",
        "user": {
            "id": str(user.id),
            "email": user.email,
        },
    }


@router.post("/login")
@limiter.limit("10/minute", scope="auth:login")
async def login(
    credentials: LoginRequest,
    response: Response,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Login user and return access token."""
    session = _require_session(session)

    if select is None:  # pragma: no cover
        raise RuntimeError("SQLAlchemy must be installed for user login")

    # Find user by email
    result = await session.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password_hash):
        security_logger.warning(
            "login_failed",
            extra={
                "email": credentials.email,
                "ip": request.client.host if request.client else "unknown",
                "reason": "invalid_credentials",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    security_logger.info(
        "user_login_success",
        extra={
            "email": user.email,
            "user_id": str(user.id),
            "ip": request.client.host if request.client else "unknown",
        },
    )

    # Set CSRF cookie
    ensure_csrf_cookie(response, existing_token=None)

    # Set refresh token in httpOnly cookie
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
            "id": str(user.id),
            "email": user.email,
        },
    }


@router.post("/refresh")
@limiter.limit("20/minute", scope="auth:refresh")
async def refresh_token(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh access token using refresh token from cookie."""
    # Get refresh token from cookie
    refresh_cookie = request.cookies.get("refresh_token")
    if not refresh_cookie:
        security_logger.warning(
            "refresh_without_cookie",
            extra={
                "path": str(request.url.path),
                "ip": request.client.host if request.client else "unknown",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    # Verify refresh token and get user ID
    user_id = verify_refresh_token(refresh_cookie)

    session = _require_session(session)

    if select is None:  # pragma: no cover
        raise RuntimeError("SQLAlchemy must be installed for token refresh")

    # Verify user still exists
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        security_logger.warning(
            "refresh_user_not_found",
            extra={
                "user_id": str(user_id),
                "ip": request.client.host if request.client else "unknown",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Create new access token
    access_token = create_access_token(user.id)

    security_logger.info(
        "token_refreshed",
        extra={
            "user_id": str(user.id),
            "ip": request.client.host if request.client else "unknown",
        },
    )

    # Refresh CSRF token
    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    ensure_csrf_cookie(response, existing_token=csrf_cookie)

    # Issue new refresh token (rotate refresh tokens for better security)
    new_refresh_token = create_refresh_token(user.id)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
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
