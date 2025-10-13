"""Application startup and shutdown event handlers.

Manages lifecycle of connections and background tasks.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.services.analytics import get_event_bus

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application lifecycle.

    Handles startup and shutdown events for the application.
    """
    # Startup
    logger.info("Starting up StudyIn backend...")

    # Initialize event bus connection
    try:
        event_bus = get_event_bus()
        await event_bus.connect()
        logger.info("Connected to Redis event bus")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis event bus: {e}")
        # Continue without event bus - the app can still function

    # Store event bus in app state for access in endpoints
    app.state.event_bus = event_bus if 'event_bus' in locals() else None

    logger.info("StudyIn backend started successfully")

    yield

    # Shutdown
    logger.info("Shutting down StudyIn backend...")

    # Disconnect from event bus
    if hasattr(app.state, "event_bus") and app.state.event_bus:
        try:
            await app.state.event_bus.disconnect()
            logger.info("Disconnected from Redis event bus")
        except Exception as e:
            logger.error(f"Error disconnecting from event bus: {e}")

    logger.info("StudyIn backend shutdown complete")