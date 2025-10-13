"""Redis caching service for API response optimization.

Provides intelligent caching with automatic invalidation, compression,
and performance tracking.
"""

from __future__ import annotations

import hashlib
import json
import logging
import pickle
import zlib
from datetime import timedelta
from typing import Any, Callable, Optional, TypeVar, Union

import redis.asyncio as redis
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheMetrics(BaseModel):
    """Cache performance metrics."""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    avg_hit_time_ms: float = 0
    avg_miss_time_ms: float = 0
    memory_used_mb: float = 0


class CacheService:
    """High-performance caching service with compression and TTL management."""

    def __init__(
        self,
        host: str = settings.REDIS_HOST,
        port: int = settings.REDIS_PORT,
        db: int = settings.REDIS_DB,
        password: Optional[str] = settings.REDIS_PASSWORD,
        max_connections: int = 50,
        decode_responses: bool = False,
    ):
        """Initialize cache service with connection pooling.

        Args:
            host: Redis host
            port: Redis port
            db: Redis database number
            password: Redis password if required
            max_connections: Maximum connections in pool
            decode_responses: Whether to decode responses
        """
        self.pool = redis.ConnectionPool(
            host=host,
            port=port,
            db=db,
            password=password,
            max_connections=max_connections,
            decode_responses=decode_responses,
        )
        self.client: Optional[redis.Redis] = None
        self._metrics = CacheMetrics()

    async def connect(self) -> None:
        """Establish Redis connection."""
        if not self.client:
            self.client = redis.Redis(connection_pool=self.pool)
            try:
                await self.client.ping()
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self.client = None
                raise

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            await self.pool.disconnect()
            self.client = None
            logger.info("Redis cache disconnected")

    def _generate_key(self, namespace: str, *args, **kwargs) -> str:
        """Generate cache key from namespace and parameters.

        Args:
            namespace: Cache namespace (e.g., 'api:materials')
            *args: Positional arguments to include in key
            **kwargs: Keyword arguments to include in key

        Returns:
            Unique cache key
        """
        # Create a stable hash from arguments
        key_data = {
            "namespace": namespace,
            "args": args,
            "kwargs": sorted(kwargs.items()),
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.sha256(key_str.encode()).hexdigest()[:16]
        return f"{namespace}:{key_hash}"

    async def get(
        self,
        key: str,
        decompress: bool = True,
    ) -> Optional[Any]:
        """Get value from cache with automatic decompression.

        Args:
            key: Cache key
            decompress: Whether to decompress value

        Returns:
            Cached value or None if not found
        """
        if not self.client:
            return None

        try:
            value = await self.client.get(key)
            if value is None:
                self._metrics.misses += 1
                return None

            self._metrics.hits += 1

            # Decompress if needed
            if decompress and isinstance(value, bytes):
                try:
                    value = zlib.decompress(value)
                except zlib.error:
                    # Value wasn't compressed
                    pass

            # Deserialize
            return pickle.loads(value) if isinstance(value, bytes) else value

        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        compress: bool = True,
        compress_threshold: int = 1024,
    ) -> bool:
        """Set value in cache with optional compression.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            compress: Whether to compress value
            compress_threshold: Minimum size in bytes to trigger compression

        Returns:
            Success status
        """
        if not self.client:
            return False

        try:
            # Serialize
            serialized = pickle.dumps(value)

            # Compress if over threshold
            if compress and len(serialized) > compress_threshold:
                serialized = zlib.compress(serialized, level=6)

            # Set with optional TTL
            if ttl:
                await self.client.setex(key, ttl, serialized)
            else:
                await self.client.set(key, serialized)

            return True

        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys from cache.

        Args:
            *keys: Cache keys to delete

        Returns:
            Number of keys deleted
        """
        if not self.client or not keys:
            return 0

        try:
            return await self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            Whether key exists
        """
        if not self.client:
            return False

        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration time for a key.

        Args:
            key: Cache key
            ttl: Time to live in seconds

        Returns:
            Success status
        """
        if not self.client:
            return False

        try:
            return await self.client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Cache expire error for key {key}: {e}")
            return False

    async def clear_namespace(self, namespace: str) -> int:
        """Clear all keys in a namespace.

        Args:
            namespace: Cache namespace to clear

        Returns:
            Number of keys deleted
        """
        if not self.client:
            return 0

        try:
            pattern = f"{namespace}:*"
            keys = []
            async for key in self.client.scan_iter(pattern):
                keys.append(key)

            if keys:
                return await self.client.delete(*keys)
            return 0

        except Exception as e:
            logger.error(f"Cache clear namespace error for {namespace}: {e}")
            return 0

    async def get_metrics(self) -> CacheMetrics:
        """Get cache performance metrics.

        Returns:
            Current cache metrics
        """
        if self.client:
            try:
                info = await self.client.info("memory")
                self._metrics.memory_used_mb = info.get("used_memory", 0) / (1024 * 1024)
            except Exception:
                pass

        return self._metrics

    # Decorator for automatic caching
    def cached(
        self,
        namespace: str,
        ttl: int = 3600,
        key_builder: Optional[Callable] = None,
        condition: Optional[Callable] = None,
    ):
        """Decorator for automatic function result caching.

        Args:
            namespace: Cache namespace
            ttl: Time to live in seconds
            key_builder: Custom key builder function
            condition: Function to determine if result should be cached

        Returns:
            Decorated function
        """

        def decorator(func: Callable) -> Callable:
            async def wrapper(*args, **kwargs):
                # Build cache key
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                else:
                    # Skip 'self' for methods
                    cache_args = args[1:] if args and hasattr(args[0], "__class__") else args
                    cache_key = self._generate_key(namespace, *cache_args, **kwargs)

                # Try to get from cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_value

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result if condition met
                if condition is None or condition(result):
                    await self.set(cache_key, result, ttl=ttl)
                    logger.debug(f"Cached result for {cache_key}")

                return result

            return wrapper

        return decorator


# Global cache instance
cache_service = CacheService()


# Specific cache namespaces with optimized TTLs
class CacheNamespaces:
    """Predefined cache namespaces with optimal TTLs."""

    # API responses
    MATERIALS_LIST = ("api:materials:list", 300)  # 5 minutes
    MATERIAL_DETAIL = ("api:materials:detail", 600)  # 10 minutes
    USER_PROFILE = ("api:users:profile", 120)  # 2 minutes
    ANALYTICS_SUMMARY = ("api:analytics:summary", 60)  # 1 minute
    ANALYTICS_DAILY = ("api:analytics:daily", 300)  # 5 minutes

    # Computed values
    EMBEDDINGS = ("compute:embeddings", 86400)  # 24 hours
    CHUNKS = ("compute:chunks", 3600)  # 1 hour
    SEARCH_RESULTS = ("compute:search", 600)  # 10 minutes

    # Session data
    LEARNING_SESSION = ("session:learning", 1800)  # 30 minutes
    CHAT_CONTEXT = ("session:chat", 900)  # 15 minutes


async def invalidate_user_cache(user_id: str) -> None:
    """Invalidate all cache entries for a specific user.

    Args:
        user_id: User ID to invalidate cache for
    """
    patterns = [
        f"api:materials:list:{user_id}:*",
        f"api:materials:detail:{user_id}:*",
        f"api:users:profile:{user_id}",
        f"api:analytics:*:{user_id}:*",
        f"session:*:{user_id}:*",
    ]

    for pattern in patterns:
        await cache_service.clear_namespace(pattern.replace(":*", ""))


async def warmup_cache(user_id: str) -> None:
    """Pre-warm cache for better user experience.

    Args:
        user_id: User ID to warm cache for
    """
    # This would typically call your service methods to pre-populate cache
    logger.info(f"Warming up cache for user {user_id}")
    # Implementation depends on your specific services