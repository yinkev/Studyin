#!/usr/bin/env python3
"""Quick test to verify async generator fix works"""

import asyncio
import sys
from typing import AsyncGenerator


# Simulate the OLD broken pattern
def broken_generate_completion() -> AsyncGenerator[str, None]:
    """This was the bug - non-async function returning async generator call"""
    return _stream_completion()  # Returns coroutine, NOT async generator!


async def _stream_completion() -> AsyncGenerator[str, None]:
    """Async generator that yields tokens"""
    for i in range(3):
        await asyncio.sleep(0.01)
        yield f"token_{i}"


# Simulate the NEW fixed pattern
async def fixed_generate_completion() -> AsyncGenerator[str, None]:
    """This is the fix - async function that yields from async generator"""
    async for chunk in _stream_completion():
        yield chunk


async def test_broken():
    """Test the broken pattern - should fail"""
    print("Testing BROKEN pattern (should fail)...")
    try:
        stream = broken_generate_completion()
        async for token in stream:  # This will fail!
            print(f"  Received: {token}")
        print("  ERROR: Should have failed but didn't!")
        return False
    except TypeError as e:
        print(f"  ✓ Failed as expected: {e}")
        return True


async def test_fixed():
    """Test the fixed pattern - should succeed"""
    print("\nTesting FIXED pattern (should succeed)...")
    try:
        stream = fixed_generate_completion()
        tokens = []
        async for token in stream:
            print(f"  Received: {token}")
            tokens.append(token)

        if len(tokens) == 3:
            print("  ✓ Success! Received all tokens")
            return True
        else:
            print(f"  ERROR: Expected 3 tokens, got {len(tokens)}")
            return False
    except Exception as e:
        print(f"  ERROR: Unexpected failure: {e}")
        return False


async def main():
    """Run tests"""
    print("=" * 60)
    print("Async Generator Fix Verification")
    print("=" * 60)

    broken_ok = await test_broken()
    fixed_ok = await test_fixed()

    print("\n" + "=" * 60)
    if broken_ok and fixed_ok:
        print("✓ ALL TESTS PASSED - Fix verified!")
        print("=" * 60)
        return 0
    else:
        print("✗ TESTS FAILED")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
