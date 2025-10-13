import logging
import re
import uuid
from pathlib import Path
from time import perf_counter
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_user_or_demo
from app.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.chunk import MaterialChunk
from app.models.material import Material
from app.models.user import User
from app.services.document_processor import chunk_text, extract_text_from_pdf
from app.services.embedding_service import get_embedding_service
from app.services.file_validator import file_validator

logger = logging.getLogger(__name__)

try:  # pragma: no cover - optional dependency guard
    from sqlalchemy import func, select, update
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore
    func = select = update = None  # type: ignore

router = APIRouter()

_FILENAME_SAFE_PATTERN = re.compile(r"[^A-Za-z0-9._-]")


class MaterialUploadResponse(BaseModel):
    id: str
    filename: str
    url: str
    size: int
    type: str
    status: str
    chunk_count: int


class MaterialSummary(BaseModel):
    id: str
    filename: str
    size: int
    type: str
    status: str
    chunk_count: int
    uploaded_at: Optional[str] = None


def _require_session(session: AsyncSession) -> AsyncSession:
    if isinstance(session, object) and session.__class__ is object:  # pragma: no cover
        raise RuntimeError("AsyncSession dependency missing. Install SQLAlchemy for full functionality.")
    return session


async def get_user_storage_usage(user_id: uuid.UUID, session: AsyncSession) -> int:
    if func is None or select is None:
        raise RuntimeError("SQLAlchemy is required to compute storage usage")

    result = await session.execute(select(func.sum(Material.file_size)).where(Material.user_id == user_id))
    value = result.scalar()
    return value or 0


@router.post("/", response_model=MaterialUploadResponse)
@limiter.limit("10/hour", scope="materials:upload")
async def upload_material(
    request: Request,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
) -> MaterialUploadResponse:
    session = _require_session(session)

    processing_start = perf_counter()
    phase_timings_ms: dict[str, float] = {}

    file_content = await file.read()
    validation_start = perf_counter()
    actual_mime, extension = await file_validator.validate_file(file_content, file.filename)
    phase_timings_ms["file_validation"] = round((perf_counter() - validation_start) * 1000, 2)

    user_storage = await get_user_storage_usage(current_user.id, session)
    if user_storage + len(file_content) > settings.USER_STORAGE_QUOTA:
        raise HTTPException(413, "Storage quota exceeded.")

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
    file_size_bytes = len(file_content)
    file_size_mb = round(file_size_bytes / 1_048_576, 2)

    logger.info(
        "material_upload_started",
        extra={
            "user_id": str(current_user.id),
            "original_filename": sanitized_original,
            "size_bytes": file_size_bytes,
            "size_mb": file_size_mb,
            "content_type": actual_mime,
        },
    )

    material = Material(
        user_id=current_user.id,
        filename=sanitized_original,
        file_path=str(file_path),
        file_size=len(file_content),
        file_type=actual_mime,
        processing_status="processing",
    )

    session.add(material)
    await session.commit()
    await session.refresh(material)

    logger.info(
        "file_validation_complete",
        extra={
            "user_id": str(current_user.id),
            "material_id": str(material.id),
            "duration_ms": phase_timings_ms["file_validation"],
        },
    )

    chunk_models: List[MaterialChunk] = []
    stored_chunk_ids: List[str] = []
    chunk_count = 0
    status = "processing"
    embedding_service = None

    try:
        text_extraction_start = perf_counter()
        text = await run_in_threadpool(extract_text_from_pdf, str(file_path))
        if not text.strip():
            raise ValueError("The uploaded PDF does not contain extractable text.")

        text_extraction_duration = round((perf_counter() - text_extraction_start) * 1000, 2)
        phase_timings_ms["text_extraction"] = text_extraction_duration
        logger.info(
            "text_extraction_complete",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "duration_ms": text_extraction_duration,
                "char_count": len(text),
            },
        )

        chunking_start = perf_counter()
        text_chunks = await run_in_threadpool(chunk_text, text)
        if not text_chunks:
            raise ValueError("Document processing produced no chunks.")

        chunking_duration = round((perf_counter() - chunking_start) * 1000, 2)
        phase_timings_ms["chunking"] = chunking_duration
        logger.info(
            "chunking_complete",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "duration_ms": chunking_duration,
                "chunk_count": len(text_chunks),
            },
        )

        embedding_service = get_embedding_service()

        embedding_start = perf_counter()
        for index, chunk_content in enumerate(text_chunks):
            chunk_model = MaterialChunk(
                material_id=material.id,
                content=chunk_content,
                chunk_index=index,
            )
            session.add(chunk_model)
            chunk_models.append(chunk_model)

        await session.flush()

        for chunk_model in chunk_models:
            metadata = {
                "material_id": str(material.id),
                "user_id": str(current_user.id),
                "chunk_index": chunk_model.chunk_index,
                "filename": material.filename,
            }
            await run_in_threadpool(
                embedding_service.store_chunk_embedding,
                str(chunk_model.id),
                chunk_model.content,
                metadata,
            )
            stored_chunk_ids.append(str(chunk_model.id))

        chunk_count = len(chunk_models)
        embedding_end = perf_counter()
        phase_timings_ms["embedding_generation"] = round((embedding_end - embedding_start) * 1000, 2)

        storage_start = perf_counter()
        await session.execute(
            update(Material).where(Material.id == material.id).values(processing_status="completed")
        )
        await session.commit()
        status = "completed"
        storage_end = perf_counter()
        phase_timings_ms["storage"] = round((storage_end - storage_start) * 1000, 2)

        logger.info(
            "embedding_generation_complete",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "duration_ms": phase_timings_ms["embedding_generation"],
                "chunks": chunk_count,
            },
        )
        logger.info(
            "storage_complete",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "duration_ms": phase_timings_ms["storage"],
            },
        )

        logger.info(
            "material_upload_complete",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "chunk_count": chunk_count,
                "total_duration_ms": round((storage_end - processing_start) * 1000, 2),
                "phase_timings_ms": phase_timings_ms,
            },
        )
    except Exception as exc:
        await session.rollback()
        await session.execute(
            update(Material).where(Material.id == material.id).values(processing_status="failed")
        )
        await session.commit()

        if embedding_service is not None and stored_chunk_ids:
            try:
                embedding_service.delete_chunk_embeddings(stored_chunk_ids)
            except Exception as cleanup_error:  # pragma: no cover - cleanup best effort
                logger.warning(
                    "chunk_embedding_cleanup_failed",
                    extra={
                        "material_id": str(material.id),
                        "chunk_ids": stored_chunk_ids,
                        "error": str(cleanup_error),
                    },
                )

        total_elapsed_ms = round((perf_counter() - processing_start) * 1000, 2)
        logger.exception(
            "material_processing_failed",
            extra={
                "user_id": str(current_user.id),
                "material_id": str(material.id),
                "error": str(exc),
                "phase_timings_ms": phase_timings_ms,
                "total_duration_ms": total_elapsed_ms,
            },
        )
        raise HTTPException(500, "Failed to process uploaded material.") from exc

    cdn_url = f"https://{settings.CDN_DOMAIN}/{current_user.id}/{safe_filename}"

    return MaterialUploadResponse(
        id=str(material.id),
        filename=sanitized_original,
        url=cdn_url,
        size=len(file_content),
        type=actual_mime,
        status=status,
        chunk_count=chunk_count,
    )


@router.get("/", response_model=List[MaterialSummary])
async def list_materials(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo),
) -> List[MaterialSummary]:
    session = _require_session(session)

    if select is None or func is None:
        raise RuntimeError("SQLAlchemy is required to list materials")

    statement = (
        select(Material, func.count(MaterialChunk.id).label("chunk_count"))
        .outerjoin(MaterialChunk, MaterialChunk.material_id == Material.id)
        .where(Material.user_id == current_user.id)
        .group_by(Material.id)
        .order_by(Material.filename)
    )

    result = await session.execute(statement)
    rows = result.all()

    summaries: List[MaterialSummary] = []
    for material, chunk_count in rows:
        uploaded_at = getattr(material, "created_at", None)
        summaries.append(
            MaterialSummary(
                id=str(material.id),
                filename=material.filename,
                size=material.file_size,
                type=material.file_type,
                status=material.processing_status,
                chunk_count=int(chunk_count or 0),
                uploaded_at=uploaded_at.isoformat() if uploaded_at else None,
            )
        )

    return summaries
