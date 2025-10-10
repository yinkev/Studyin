from __future__ import annotations

from typing import AsyncGenerator

from app.config import settings

try:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
except ImportError as exc:  # pragma: no cover - direct feedback when dependency missing
    raise RuntimeError(
        "SQLAlchemy must be installed to use the database session. "
        "Install with `pip install sqlalchemy[asyncio]`."
    ) from exc


engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session with connection pooling."""

    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
