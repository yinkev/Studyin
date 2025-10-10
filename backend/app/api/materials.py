from __future__ import annotations

import uuid
import re
import logging
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile

from app.api.deps import get_current_user
from app.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.material import Material
from app.models.user import User
from app.services.file_validator import file_validator

logger = logging.getLogger(__name__)

try:  # pragma: no cover - optional dependency
    from sqlalchemy import func, select
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore
    func = select = None  # type: ignore


router = APIRouter()

_FILENAME_SAFE_PATTERN = re.compile(r"[^A-Za-z0-9._-]")


def _require_session(session: AsyncSession) -> AsyncSession:
    if isinstance(session, object) and session.__class__ is object:  # pragma: no cover - fallback path
        raise RuntimeError("AsyncSession dependency missing. Install SQLAlchemy for full functionality.")
    return session


async def get_user_storage_usage(user_id: uuid.UUID, session: AsyncSession) -> int:
    if func is None or select is None:
        raise RuntimeError("SQLAlchemy is required to compute storage usage")

    result = await session.execute(
        select(func.sum(Material.file_size)).where(Material.user_id == user_id)
    )
    value = result.scalar()
    return value or 0


@router.post("/")
@limiter.limit("10/hour", scope="materials:upload")
async def upload_material(
    file: UploadFile,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_content = await file.read()

    actual_mime, extension = await file_validator.validate_file(
        file_content,
        file.filename,
    )

    session = _require_session(session)
    user_storage = await get_user_storage_usage(current_user.id, session)
    if user_storage + len(file_content) > settings.USER_STORAGE_QUOTA:
        raise HTTPException(
            413,
            "Storage quota exceeded.",
        )

    safe_filename = f"{uuid.uuid4()}{extension}"

    upload_root = Path(settings.UPLOAD_DIR).resolve()
    user_directory = upload_root / str(current_user.id)
    user_directory.mkdir(parents=True, exist_ok=True)

    file_path = user_directory / safe_filename

    async with aiofiles.open(file_path, "wb") as buffer:
        await buffer.write(file_content)

    file_path.chmod(0o644)

    original_filename = file.filename or "uploaded-file"
    sanitized_original = _FILENAME_SAFE_PATTERN.sub("_", Path(original_filename).name)

    material = Material(
        user_id=current_user.id,
        filename=sanitized_original,
        file_path=str(file_path),
        file_size=len(file_content),
        file_type=actual_mime,
        processing_status="pending",
    )

    session.add(material)
    await session.commit()
    await session.refresh(material)

    cdn_url = f"https://{settings.CDN_DOMAIN}/{current_user.id}/{safe_filename}"

    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        "material_uploaded",
        extra={
            "user_id": str(current_user.id),
            "material_id": str(material.id),
            "ip": client_ip,
            "size": len(file_content),
            "mime": actual_mime,
        },
    )

    return {
        "id": str(material.id),
        "filename": sanitized_original,
        "url": cdn_url,
        "size": len(file_content),
        "type": actual_mime,
        "status": "pending",
    }
