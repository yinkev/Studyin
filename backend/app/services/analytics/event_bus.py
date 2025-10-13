"""Redis-based event bus for analytics event processing.

Provides pub/sub capabilities for real-time event processing and
aggregation with resilience and error handling.
"""

from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, AsyncIterator, Callable, Optional
from uuid import UUID

import redis.asyncio as redis
from pydantic import ValidationError

from app.config import settings
from app.models.analytics import BaseEvent, EventType

logger = logging.getLogger(__name__)


class EventBus:
    """Redis-based event bus for analytics."""

    def __init__(
        self,
        redis_url: Optional[str] = None,
        channel_prefix: str = "analytics",
        max_retries: int = 3,
    ):
        """Initialize the event bus.

        Args:
            redis_url: Redis connection URL
            channel_prefix: Prefix for all channels
            max_retries: Maximum retry attempts for operations
        """
        self.redis_url = redis_url or self._build_redis_url()
        self.channel_prefix = channel_prefix
        self.max_retries = max_retries
        self._redis_client: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None
        self._listeners: dict[str, list[Callable]] = {}
        self._running = False

    def _build_redis_url(self) -> str:
        """Build Redis URL from settings."""
        password_part = f":{settings.REDIS_PASSWORD}@" if settings.REDIS_PASSWORD else ""
        return f"redis://{password_part}{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

    async def connect(self) -> None:
        """Connect to Redis."""
        try:
            self._redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=10,
            )
            await self._redis_client.ping()
            logger.info("Connected to Redis event bus")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        self._running = False
        if self._pubsub:
            await self._pubsub.close()
            self._pubsub = None
        if self._redis_client:
            await self._redis_client.close()
            self._redis_client = None
        logger.info("Disconnected from Redis event bus")

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[EventBus]:
        """Context manager for event bus connection."""
        await self.connect()
        try:
            yield self
        finally:
            await self.disconnect()

    def _get_channel_name(self, event_type: EventType) -> str:
        """Get full channel name for an event type."""
        return f"{self.channel_prefix}:{event_type.value}"

    def _serialize_event(self, event: BaseEvent) -> str:
        """Serialize event to JSON string."""
        return json.dumps(event.dict(), default=str)

    def _deserialize_event(self, data: str) -> Optional[BaseEvent]:
        """Deserialize JSON string to event."""
        try:
            event_data = json.loads(data)
            return BaseEvent(**event_data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Failed to deserialize event: {e}")
            return None

    async def publish(self, event: BaseEvent) -> bool:
        """Publish an event to the event bus.

        Args:
            event: The event to publish

        Returns:
            True if published successfully, False otherwise
        """
        if not self._redis_client:
            logger.error("Event bus not connected")
            return False

        channel = self._get_channel_name(event.event_type)
        serialized = self._serialize_event(event)

        for attempt in range(self.max_retries):
            try:
                # Publish to channel
                subscribers = await self._redis_client.publish(channel, serialized)

                # Also store in a list for persistence (last 1000 events per type)
                list_key = f"{self.channel_prefix}:history:{event.event_type.value}"
                await self._redis_client.lpush(list_key, serialized)
                await self._redis_client.ltrim(list_key, 0, 999)  # Keep last 1000

                # Store in time-series sorted set for time-based queries
                ts_key = f"{self.channel_prefix}:timeline"
                score = event.timestamp.timestamp()
                await self._redis_client.zadd(ts_key, {serialized: score})

                # Cleanup old entries (older than 7 days)
                seven_days_ago = datetime.utcnow().timestamp() - (7 * 24 * 3600)
                await self._redis_client.zremrangebyscore(ts_key, 0, seven_days_ago)

                logger.debug(
                    f"Published event {event.event_id} to {subscribers} subscribers"
                )
                return True

            except redis.RedisError as e:
                logger.warning(
                    f"Failed to publish event (attempt {attempt + 1}/{self.max_retries}): {e}"
                )
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2**attempt)  # Exponential backoff
                else:
                    logger.error(f"Failed to publish event after {self.max_retries} attempts")
                    return False

        return False

    async def subscribe(
        self,
        event_types: list[EventType],
        callback: Callable[[BaseEvent], None],
    ) -> None:
        """Subscribe to event types with a callback.

        Args:
            event_types: List of event types to subscribe to
            callback: Async callback function to handle events
        """
        if not self._redis_client:
            await self.connect()

        if not self._pubsub:
            self._pubsub = self._redis_client.pubsub()

        # Subscribe to channels
        channels = [self._get_channel_name(et) for et in event_types]
        await self._pubsub.subscribe(*channels)

        # Store callback
        for channel in channels:
            if channel not in self._listeners:
                self._listeners[channel] = []
            self._listeners[channel].append(callback)

        logger.info(f"Subscribed to {len(channels)} channels")

    async def start_listening(self) -> None:
        """Start listening for events (blocking)."""
        if not self._pubsub:
            logger.error("No subscriptions active")
            return

        self._running = True
        logger.info("Started listening for events")

        try:
            async for message in self._pubsub.listen():
                if not self._running:
                    break

                if message["type"] == "message":
                    channel = message["channel"]
                    event = self._deserialize_event(message["data"])

                    if event and channel in self._listeners:
                        # Call all registered callbacks for this channel
                        for callback in self._listeners[channel]:
                            try:
                                if asyncio.iscoroutinefunction(callback):
                                    await callback(event)
                                else:
                                    callback(event)
                            except Exception as e:
                                logger.error(f"Error in event callback: {e}")

        except Exception as e:
            logger.error(f"Error in event listener: {e}")
        finally:
            self._running = False
            logger.info("Stopped listening for events")

    async def get_recent_events(
        self,
        event_type: Optional[EventType] = None,
        limit: int = 100,
    ) -> list[BaseEvent]:
        """Get recent events from history.

        Args:
            event_type: Optional event type filter
            limit: Maximum number of events to return

        Returns:
            List of recent events
        """
        if not self._redis_client:
            return []

        events = []

        if event_type:
            # Get from specific event type history
            list_key = f"{self.channel_prefix}:history:{event_type.value}"
            raw_events = await self._redis_client.lrange(list_key, 0, limit - 1)
        else:
            # Get from timeline (all events)
            ts_key = f"{self.channel_prefix}:timeline"
            raw_events = await self._redis_client.zrevrange(ts_key, 0, limit - 1)

        for raw_event in raw_events:
            event = self._deserialize_event(raw_event)
            if event:
                events.append(event)

        return events

    async def get_event_stats(self) -> dict[str, Any]:
        """Get event statistics from Redis.

        Returns:
            Dictionary with event statistics
        """
        if not self._redis_client:
            return {}

        stats = {}

        # Get counts for each event type
        for event_type in EventType:
            list_key = f"{self.channel_prefix}:history:{event_type.value}"
            count = await self._redis_client.llen(list_key)
            stats[event_type.value] = count

        # Get total events in timeline
        ts_key = f"{self.channel_prefix}:timeline"
        total = await self._redis_client.zcard(ts_key)
        stats["total_events"] = total

        # Get events from last hour
        now = datetime.utcnow().timestamp()
        hour_ago = now - 3600
        recent_count = await self._redis_client.zcount(ts_key, hour_ago, now)
        stats["events_last_hour"] = recent_count

        return stats

    async def clear_history(self, event_type: Optional[EventType] = None) -> bool:
        """Clear event history.

        Args:
            event_type: Optional event type to clear (clears all if None)

        Returns:
            True if cleared successfully
        """
        if not self._redis_client:
            return False

        try:
            if event_type:
                # Clear specific event type
                list_key = f"{self.channel_prefix}:history:{event_type.value}"
                await self._redis_client.delete(list_key)
            else:
                # Clear all history
                pattern = f"{self.channel_prefix}:history:*"
                cursor = 0
                while True:
                    cursor, keys = await self._redis_client.scan(
                        cursor, match=pattern, count=100
                    )
                    if keys:
                        await self._redis_client.delete(*keys)
                    if cursor == 0:
                        break

                # Clear timeline
                ts_key = f"{self.channel_prefix}:timeline"
                await self._redis_client.delete(ts_key)

            logger.info(f"Cleared event history for {event_type or 'all types'}")
            return True

        except Exception as e:
            logger.error(f"Failed to clear history: {e}")
            return False


# Singleton instance
_event_bus: Optional[EventBus] = None


def get_event_bus() -> EventBus:
    """Get the singleton event bus instance."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus


async def publish_event(event: BaseEvent) -> bool:
    """Convenience function to publish an event.

    Args:
        event: The event to publish

    Returns:
        True if published successfully
    """
    bus = get_event_bus()
    if not bus._redis_client:
        await bus.connect()
    return await bus.publish(event)