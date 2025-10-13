from __future__ import annotations

import uuid

from fastapi import Depends, Header, HTTPException, status

from app.core.jwt import verify_access_token
from app.core.password import hash_password
from app.db.session import get_db
from app.models.user import User

try:  # pragma: no cover - optional dependency guard
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore
    select = None  # type: ignore

# Hardcoded user for MVP/demo purposes
HARDCODED_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
HARDCODED_USER_EMAIL = "demo@studyin.app"


def _require_session(session: AsyncSession) -> AsyncSession:
    if isinstance(session, object) and session.__class__ is object:  # pragma: no cover
        raise RuntimeError("AsyncSession dependency missing. Install SQLAlchemy for full functionality.")
    return session


async def get_current_user(
    authorization: str | None = Header(None),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token.

    Args:
        authorization: Authorization header with Bearer token
        session: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is missing, invalid, or user not found
    """
    # Check for authorization header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Parse Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # Verify token and get user ID
    user_id = verify_access_token(token)

    session = _require_session(session)

    if select is None:  # pragma: no cover
        raise RuntimeError("SQLAlchemy must be installed to get current user")

    # Get user from database
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_current_user_or_demo(
    authorization: str | None = Header(None),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user, or return hardcoded demo user for MVP.

    This allows the app to work without authentication in MVP/demo mode.
    If an authorization header is provided, it validates the token.
    Otherwise, it returns the hardcoded demo user.

    Args:
        authorization: Optional authorization header with Bearer token
        session: Database session

    Returns:
        User object (either authenticated or demo user)
    """
    # If no auth header, use hardcoded demo user for MVP
    if not authorization:
        return await ensure_hardcoded_user(session)

    # If auth header is provided, validate it
    return await get_current_user(authorization, session)


async def ensure_hardcoded_user(session: AsyncSession) -> User:
    """Ensure the hardcoded demo user exists in the database.

    This is used for MVP/demo purposes to allow testing without authentication.

    Args:
        session: Database session

    Returns:
        The hardcoded demo user

    Raises:
        RuntimeError: If SQLAlchemy is not available
    """
    session = _require_session(session)

    if select is None:  # pragma: no cover
        raise RuntimeError("SQLAlchemy must be installed to ensure hardcoded user")

    # Check if hardcoded user exists
    result = await session.execute(select(User).where(User.id == HARDCODED_USER_ID))
    user = result.scalar_one_or_none()

    if not user:
        # Create hardcoded user if it doesn't exist
        user = User(
            id=HARDCODED_USER_ID,
            email=HARDCODED_USER_EMAIL,
            password_hash=hash_password("demo-password-not-for-production"),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    return user
