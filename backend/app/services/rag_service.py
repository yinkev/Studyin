from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from time import perf_counter
from typing import Any, Dict, List, Sequence

from fastapi.concurrency import run_in_threadpool

from app.models.chunk import MaterialChunk
from app.models.material import Material
from app.services.embedding_service import get_embedding_service

try:  # pragma: no cover - optional dependency guard
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import joinedload
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore
    select = None  # type: ignore
    joinedload = None  # type: ignore

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class RagContextChunk:
    """Represents a single chunk returned from the vector store."""

    chunk_id: str
    content: str
    filename: str
    chunk_index: int
    distance: float | None
    metadata: Dict[str, Any]

    def as_display_dict(self) -> Dict[str, Any]:
        """Return a sanitized representation suitable for clients."""
        snippet = self.content.strip()
        if len(snippet) > 1200:
            snippet = f"{snippet[:1200].rstrip()}..."

        return {
            "id": self.chunk_id,
            "filename": self.filename,
            "chunk_index": self.chunk_index,
            "distance": self.distance,
            "metadata": self.metadata,
            "content": snippet,
        }


class RagService:
    """Service coordinating retrieval-augmented generation lookups."""

    def __init__(self) -> None:
        self._embedding_service = get_embedding_service()

    async def retrieve_context(
        self,
        *,
        session: AsyncSession,
        user_id: uuid.UUID,
        query: str,
        top_k: int = 4,
    ) -> List[RagContextChunk]:
        """
        Retrieve the most relevant chunks for the given query and user.

        The vector search runs in a worker thread because the ChromaDB client is synchronous.
        """
        if select is None:
            raise RuntimeError("SQLAlchemy is required to retrieve RAG context.")

        if top_k <= 0:
            raise ValueError("top_k must be greater than zero.")

        query_preview = query[:100]
        if len(query) > 100:
            query_preview = f"{query_preview.rstrip()}..."

        logger.info(
            "rag_retrieval_started",
            extra={
                "user_id": str(user_id),
                "query_preview": query_preview,
                "top_k": top_k,
            },
        )

        retrieval_start = perf_counter()
        chroma_duration_ms = None
        relevance_scores: List[float] = []

        try:
            search_results = await run_in_threadpool(
                self._embedding_service.search_similar,
                query,
                max(top_k * 3, top_k),
            )
            chroma_duration_ms = round((perf_counter() - retrieval_start) * 1000, 2)

            logger.info(
                "rag_vector_query_complete",
                extra={
                    "user_id": str(user_id),
                    "duration_ms": chroma_duration_ms,
                    "raw_results": len(search_results or []),
                },
            )

            if not search_results:
                total_duration_ms = round((perf_counter() - retrieval_start) * 1000, 2)
                logger.info(
                    "rag_context_quality",
                    extra={
                        "user_id": str(user_id),
                        "query_preview": query_preview,
                        "chunks_retrieved": 0,
                        "materials_used": [],
                        "chunk_ids": [],
                    },
                )
                logger.info(
                    "rag_retrieval_complete",
                    extra={
                        "user_id": str(user_id),
                        "query_preview": query_preview,
                        "duration_ms": total_duration_ms,
                        "chunks_found": 0,
                        "materials_used": [],
                        "chromadb_duration_ms": chroma_duration_ms,
                        "relevance_scores": [],
                    },
                )
                return []

            candidate_ids: List[uuid.UUID] = []
            for result in search_results:
                score_value = result.get("score")
                if score_value is None and result.get("distance") is not None:
                    score_value = result.get("distance")
                if score_value is not None:
                    try:
                        relevance_scores.append(float(score_value))
                    except (TypeError, ValueError):
                        pass

                chunk_id = result.get("id")
                if not chunk_id:
                    continue
                try:
                    candidate_ids.append(uuid.UUID(str(chunk_id)))
                except ValueError:
                    logger.warning("Invalid chunk UUID returned from vector store", extra={"chunk_id": chunk_id})

            if not candidate_ids:
                total_duration_ms = round((perf_counter() - retrieval_start) * 1000, 2)
                logger.info(
                    "rag_context_quality",
                    extra={
                        "user_id": str(user_id),
                        "query_preview": query_preview,
                        "chunks_retrieved": 0,
                        "materials_used": [],
                        "chunk_ids": [],
                    },
                )
                logger.info(
                    "rag_retrieval_complete",
                    extra={
                        "user_id": str(user_id),
                        "query_preview": query_preview,
                        "duration_ms": total_duration_ms,
                        "chunks_found": 0,
                        "materials_used": [],
                        "chromadb_duration_ms": chroma_duration_ms,
                        "relevance_scores": relevance_scores[:top_k],
                    },
                )
                return []

            stmt = (
                select(MaterialChunk, Material)
                .join(Material, Material.id == MaterialChunk.material_id)
                .where(MaterialChunk.id.in_(candidate_ids))
                .where(Material.user_id == user_id)
            )

            if joinedload is not None:
                stmt = stmt.options(joinedload(MaterialChunk.material))

            result = await session.execute(stmt)
            rows: Sequence[tuple[MaterialChunk, Material]] = result.all()
            chunk_lookup: Dict[str, tuple[MaterialChunk, Material]] = {
                str(chunk.id): (chunk, material) for chunk, material in rows
            }

            context_chunks: List[RagContextChunk] = []
            for entry in search_results:
                chunk_id = str(entry.get("id", ""))
                match = chunk_lookup.get(chunk_id)
                if not match:
                    continue

                chunk, material = match
                metadata = entry.get("metadata") or {}

                # Ensure user ownership in metadata for downstream consumers
                metadata.setdefault("material_id", str(material.id))
                metadata.setdefault("filename", material.filename)

                context_chunks.append(
                    RagContextChunk(
                        chunk_id=chunk_id,
                        content=chunk.content,
                        filename=material.filename,
                        chunk_index=chunk.chunk_index,
                        distance=float(entry.get("distance")) if entry.get("distance") is not None else None,
                        metadata=metadata,
                    )
                )

                if len(context_chunks) >= top_k:
                    break

            total_duration_ms = round((perf_counter() - retrieval_start) * 1000, 2)
            materials_used = sorted({chunk.filename for chunk in context_chunks})

            logger.info(
                "rag_context_quality",
                extra={
                    "user_id": str(user_id),
                    "query_preview": query_preview,
                    "chunks_retrieved": len(context_chunks),
                    "materials_used": materials_used,
                    "chunk_ids": [chunk.chunk_id for chunk in context_chunks],
                },
            )

            logger.info(
                "rag_retrieval_complete",
                extra={
                    "user_id": str(user_id),
                    "query_preview": query_preview,
                    "duration_ms": total_duration_ms,
                    "chunks_found": len(context_chunks),
                    "materials_used": materials_used,
                    "chromadb_duration_ms": chroma_duration_ms,
                    "relevance_scores": relevance_scores[:top_k],
                },
            )

            return context_chunks
        except Exception as exc:
            failure_duration_ms = round((perf_counter() - retrieval_start) * 1000, 2)
            logger.exception(
                "rag_retrieval_failed",
                extra={
                    "user_id": str(user_id),
                    "query_preview": query_preview,
                    "top_k": top_k,
                    "chromadb_duration_ms": chroma_duration_ms,
                    "duration_ms": failure_duration_ms,
                    "error": str(exc),
                },
            )
            raise

    @staticmethod
    def render_context_summary(chunks: Sequence[RagContextChunk]) -> str:
        """Create a formatted context block for feeding into the LLM."""
        if not chunks:
            return "No relevant study materials were found for this query."

        parts: List[str] = []
        for index, chunk in enumerate(chunks, start=1):
            header = f"[Source {index}] {chunk.filename} (Section {chunk.chunk_index + 1})"
            snippet = chunk.content.strip()
            if len(snippet) > 1800:
                snippet = f"{snippet[:1800].rstrip()}..."
            parts.append(f"{header}\n{snippet}")

        return "\n\n".join(parts)


def get_rag_service() -> RagService:
    return RagService()
