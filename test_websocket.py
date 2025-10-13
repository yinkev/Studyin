#!/usr/bin/env python3
"""
Quick WebSocket connection test script.
Tests if the WebSocket endpoint is accessible and responds correctly.
"""

import asyncio
import json
import sys

try:
    import websockets
except ImportError:
    print("❌ websockets library not installed")
    print("Install with: pip install websockets")
    sys.exit(1)


async def test_websocket():
    """Test WebSocket connection to backend."""
    uri = "ws://localhost:8000/api/chat/ws"

    print(f"🔌 Connecting to {uri}...")

    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5173",  # Simulate frontend origin
            extra_headers={
                "User-Agent": "WebSocket-Test-Script/1.0",
            }
        ) as websocket:
            print("✅ WebSocket connection established!")

            # Wait for welcome message
            try:
                welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(welcome_msg)
                print(f"📨 Received welcome: {data}")

                if data.get("type") == "info":
                    print(f"✅ Server says: {data.get('message')}")
                    print(f"✅ User ID: {data.get('user_id')}")
                else:
                    print(f"⚠️  Unexpected message type: {data.get('type')}")

            except asyncio.TimeoutError:
                print("⚠️  No welcome message received within 5 seconds")

            # Send test message
            test_message = {
                "type": "user_message",
                "content": "What is the cardiac cycle?",
                "user_level": 3
            }

            print(f"\n📤 Sending test message: {test_message['content']}")
            await websocket.send(json.dumps(test_message))

            # Receive responses
            response_count = 0
            context_received = False
            tokens_received = 0

            print("📥 Receiving responses...")

            try:
                while True:
                    msg = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    data = json.loads(msg)
                    response_count += 1

                    msg_type = data.get("type")

                    if msg_type == "context":
                        chunks = data.get("chunks", [])
                        print(f"✅ Received context: {len(chunks)} chunks")
                        context_received = True

                    elif msg_type == "token":
                        tokens_received += 1
                        if tokens_received == 1:
                            print(f"✅ Streaming started (token: '{data.get('value', '')[:20]}...')")
                        elif tokens_received % 10 == 0:
                            print(f"   ... {tokens_received} tokens received")

                    elif msg_type == "complete":
                        print(f"✅ Response complete! Total tokens: {tokens_received}")
                        message = data.get("message", "")
                        print(f"📝 Final message preview: {message[:100]}...")
                        break

                    elif msg_type == "error":
                        print(f"❌ Error received: {data.get('message')}")
                        break

                    else:
                        print(f"⚠️  Unknown message type: {msg_type}")

            except asyncio.TimeoutError:
                print("⚠️  Response timeout after 30 seconds")

            print(f"\n📊 Summary:")
            print(f"   - Total messages: {response_count}")
            print(f"   - Context received: {'✅' if context_received else '❌'}")
            print(f"   - Tokens streamed: {tokens_received}")

            # Close gracefully
            await websocket.close()
            print("\n✅ WebSocket closed successfully")

    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Connection rejected with HTTP {e.status_code}")
        print(f"   This usually means:")
        if e.status_code == 403:
            print("   - CORS origin not allowed")
            print("   - Check CORS_ALLOW_ORIGINS in backend/.env")
        elif e.status_code == 401:
            print("   - Authentication required")
            print("   - Token validation failing")
        else:
            print(f"   - Unexpected status code: {e.status_code}")

    except ConnectionRefusedError:
        print("❌ Connection refused")
        print("   - Is the backend running on port 8000?")
        print("   - Start with: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")

    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🧪 WebSocket Connection Test")
    print("=" * 50)
    print()

    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")

    print("\n" + "=" * 50)
    print("Test complete!")
