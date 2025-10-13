"""Test script for analytics system.

Run this script to verify the analytics infrastructure is working correctly.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.analytics import (
    EventType,
    LearningSessionEvent,
    MaterialInteractionEvent,
    GamificationEvent,
    AICoachEvent,
    SystemMetricEvent,
)
from app.services.analytics import EventBus, get_event_bus


async def test_event_bus():
    """Test the Redis event bus functionality."""
    print("Testing Analytics Event Bus")
    print("=" * 50)

    # Initialize event bus
    bus = get_event_bus()

    try:
        # Connect to Redis
        print("1. Connecting to Redis...")
        await bus.connect()
        print("   ✓ Connected successfully")

        # Test user ID for all events
        test_user_id = uuid4()
        test_session_id = uuid4()

        # Test 1: Learning Session Events
        print("\n2. Testing Learning Session Events...")
        session_start = LearningSessionEvent(
            event_id=uuid4(),
            event_type=EventType.SESSION_START,
            user_id=test_user_id,
            session_id=test_session_id,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(session_start)
        print(f"   ✓ Session start event published: {success}")

        session_end = LearningSessionEvent(
            event_id=uuid4(),
            event_type=EventType.SESSION_END,
            user_id=test_user_id,
            session_id=test_session_id,
            duration_seconds=1800,
            xp_earned=50,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(session_end)
        print(f"   ✓ Session end event published: {success}")

        # Test 2: Material Interaction Events
        print("\n3. Testing Material Interaction Events...")
        material_view = MaterialInteractionEvent(
            event_id=uuid4(),
            event_type=EventType.MATERIAL_VIEW,
            user_id=test_user_id,
            session_id=test_session_id,
            material_id=uuid4(),
            material_type="pdf",
            interaction_type="view",
            progress_percentage=25.0,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(material_view)
        print(f"   ✓ Material view event published: {success}")

        # Test 3: Gamification Events
        print("\n4. Testing Gamification Events...")
        xp_event = GamificationEvent(
            event_id=uuid4(),
            event_type=EventType.XP_EARNED,
            user_id=test_user_id,
            session_id=test_session_id,
            xp_amount=100,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(xp_event)
        print(f"   ✓ XP earned event published: {success}")

        level_up = GamificationEvent(
            event_id=uuid4(),
            event_type=EventType.LEVEL_UP,
            user_id=test_user_id,
            new_level=5,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(level_up)
        print(f"   ✓ Level up event published: {success}")

        # Test 4: AI Coach Events
        print("\n5. Testing AI Coach Events...")
        ai_message = AICoachEvent(
            event_id=uuid4(),
            event_type=EventType.AI_MESSAGE_SENT,
            user_id=test_user_id,
            conversation_id=uuid4(),
            message_id=uuid4(),
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(ai_message)
        print(f"   ✓ AI message event published: {success}")

        ai_feedback = AICoachEvent(
            event_id=uuid4(),
            event_type=EventType.AI_FEEDBACK_RATED,
            user_id=test_user_id,
            conversation_id=uuid4(),
            rating=5,
            feedback_type="helpful",
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(ai_feedback)
        print(f"   ✓ AI feedback event published: {success}")

        # Test 5: System Metrics
        print("\n6. Testing System Metric Events...")
        api_request = SystemMetricEvent(
            event_id=uuid4(),
            event_type=EventType.API_REQUEST,
            user_id=test_user_id,  # System metrics can optionally track user
            endpoint="/api/materials",
            method="GET",
            status_code=200,
            response_time_ms=45,
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(api_request)
        print(f"   ✓ API request event published: {success}")

        api_error = SystemMetricEvent(
            event_id=uuid4(),
            event_type=EventType.API_ERROR,
            user_id=None,  # This can be None for unauthenticated requests
            endpoint="/api/auth/login",
            method="POST",
            status_code=401,
            response_time_ms=120,
            error_type="AuthenticationError",
            timestamp=datetime.utcnow(),
        )
        success = await bus.publish(api_error)
        print(f"   ✓ API error event published: {success}")

        # Test 6: Get recent events
        print("\n7. Testing Event Retrieval...")
        recent_events = await bus.get_recent_events(limit=5)
        print(f"   ✓ Retrieved {len(recent_events)} recent events")

        # Test 7: Get event statistics
        print("\n8. Testing Event Statistics...")
        stats = await bus.get_event_stats()
        print("   ✓ Event statistics:")
        for event_type, count in stats.items():
            if count > 0:
                print(f"     - {event_type}: {count}")

        print("\n" + "=" * 50)
        print("✅ All analytics tests passed successfully!")

    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # Disconnect from Redis
        await bus.disconnect()
        print("\nDisconnected from Redis")


async def test_subscriber():
    """Test event subscription functionality."""
    print("\nTesting Event Subscription")
    print("=" * 50)

    bus = EventBus()  # Create a separate bus instance for subscriber
    await bus.connect()

    # Define callback function
    events_received = []

    async def handle_event(event):
        events_received.append(event)
        print(f"   📨 Received event: {event.event_type.value} (ID: {event.event_id})")

    # Subscribe to all learning events
    await bus.subscribe(
        [EventType.SESSION_START, EventType.SESSION_END, EventType.XP_EARNED],
        handle_event,
    )

    print("Subscribed to learning events. Publishing test events...")

    # Create another bus for publishing
    publisher = EventBus()
    await publisher.connect()

    # Publish some events
    for i in range(3):
        event = LearningSessionEvent(
            event_id=uuid4(),
            event_type=EventType.SESSION_START,
            user_id=uuid4(),
            session_id=uuid4(),
            timestamp=datetime.utcnow(),
        )
        await publisher.publish(event)
        await asyncio.sleep(0.1)  # Small delay to ensure processing

    # Start listening in background for a short time
    listen_task = asyncio.create_task(bus.start_listening())
    await asyncio.sleep(1)  # Listen for 1 second
    bus._running = False  # Stop listening

    try:
        await asyncio.wait_for(listen_task, timeout=1)
    except asyncio.TimeoutError:
        pass

    print(f"\n✅ Received {len(events_received)} events via subscription")

    await bus.disconnect()
    await publisher.disconnect()


async def main():
    """Run all analytics tests."""
    print("\n🚀 StudyIn Analytics System Test Suite")
    print("=" * 50 + "\n")

    # Test event bus basic functionality
    await test_event_bus()

    # Test subscription functionality
    await test_subscriber()

    print("\n" + "=" * 50)
    print("🎉 All analytics tests completed!")


if __name__ == "__main__":
    asyncio.run(main())