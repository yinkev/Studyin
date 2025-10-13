"""
Cached RAG service - drop-in replacement for rag_service.py with Redis caching.

This is a solo-dev optimization: 500ms -> 25ms for repeated queries.
Use this during development for faster feedback loops when testing AI coach.

To enable: Update your dependencies to import from this file instead of rag_service.py
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional, Sequence

from app.services.rag_service import RagContextChunk, RagService
from app.services.cache_rag import RagCacheService

try:
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:
    AsyncSession = object  # type: ignore

logger = logging.getLogger(__name__)


class CachedRagService(RagService):
    """RAG service with Redis caching for 20x faster repeated queries."""

    def __init__(self, cache_service: Optional[RagCacheService] = None) -> None:
        """
        Initialize cached RAG service.

        Args:
            cache_service: Optional RagCacheService instance. If None, falls back to non-cached behavior.
        """
        super().__init__()
        self.cache = cache_service

    async def retrieve_context(
        self,
        *,
        session: AsyncSession,
        user_id: uuid.UUID,
        query: str,
        top_k: int = 4,
        bypass_cache: bool = False,
    ) -> List[RagContextChunk]:
        """
        Retrieve context with caching support.

        Args:
            session: Database session
            user_id: User UUID
            query: Search query
            top_k: Number of chunks to return
            bypass_cache: Force fresh lookup (useful for debugging)

        Returns:
            List of RagContextChunk objects
        """
        # Try cache first (if enabled and not bypassed)
        if self.cache and not bypass_cache:
            cached_dicts = await self.cache.get_cached_chunks(user_id, query, top_k)
            if cached_dicts is not None:
                # Reconstruct RagContextChunk objects from dicts
                return [
                    RagContextChunk(
                        chunk_id=d["chunk_id"],
                        content=d["content"],
                        filename=d["filename"],
                        chunk_index=d["chunk_index"],
                        distance=d.get("distance"),
                        metadata=d.get("metadata", {}),
                    )
                    for d in cached_dicts
                ]

        # Cache miss or bypassed - do normal retrieval
        chunks = await super().retrieve_context(
            session=session,
            user_id=user_id,
            query=query,
            top_k=top_k,
        )

        # Store in cache for next time
        if self.cache and chunks:
            chunk_dicts = [
                {
                    "chunk_id": chunk.chunk_id,
                    "content": chunk.content,
                    "filename": chunk.filename,
                    "chunk_index": chunk.chunk_index,
                    "distance": chunk.distance,
                    "metadata": chunk.metadata,
                }
                for chunk in chunks
            ]
            await self.cache.set_cached_chunks(user_id, query, top_k, chunk_dicts)

        return chunks

    async def invalidate_cache(self, user_id: uuid.UUID) -> int:
        """
        Invalidate all cached queries for a user.

        Call this when user uploads new materials to ensure fresh results.

        Returns:
            Number of cache keys deleted
        """
        if not self.cache:
            return 0

        return await self.cache.invalidate_user_cache(user_id)

    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics."""
        if not self.cache:
            return {"enabled": False}

        return await self.cache.get_cache_stats()


def get_cached_rag_service(
    cache_service: Optional[RagCacheService] = None,
) -> CachedRagService:
    """
    Factory function to create cached RAG service.

    Args:
        cache_service: Optional RagCacheService instance

    Returns:
        CachedRagService instance
    """
    return CachedRagService(cache_service=cache_service)
