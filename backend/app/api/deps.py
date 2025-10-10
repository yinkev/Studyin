from __future__ import annotations

from fastapi import Depends

from app.models.user import User


async def get_current_user() -> User:
    raise RuntimeError("Authentication dependency not implemented in this stubbed environment")
