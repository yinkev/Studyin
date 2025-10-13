#!/usr/bin/env python3
"""Simple authentication flow test script."""
import asyncio
import sys

import httpx

BASE_URL = "http://localhost:8000"


async def test_auth_flow():
    """Test the complete authentication flow."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        print("Testing Authentication Flow")
        print("=" * 50)

        # Test 1: Register new user
        print("\n1. Testing Registration...")
        register_data = {"email": "test@example.com", "password": "test1234"}

        register_response = await client.post(f"{BASE_URL}/api/auth/register", json=register_data)

        print(f"   Status: {register_response.status_code}")
        if register_response.status_code == 200:
            print(f"   Response: {register_response.json()}")
            print("   ✅ Registration successful")
        elif register_response.status_code == 409:
            print(f"   Response: {register_response.json()}")
            print("   ℹ️  User already exists, proceeding to login...")
        else:
            print(f"   ❌ Registration failed: {register_response.text}")
            return False

        # Test 2: Login
        print("\n2. Testing Login...")
        login_data = {"email": "test@example.com", "password": "test1234"}

        login_response = await client.post(f"{BASE_URL}/api/auth/login", json=login_data)

        print(f"   Status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.text}")
            return False

        login_result = login_response.json()
        access_token = login_result["access_token"]
        user = login_result["user"]

        print(f"   User ID: {user['id']}")
        print(f"   Email: {user['email']}")
        print(f"   Access Token: {access_token[:30]}...")
        print(f"   Refresh Token Cookie: {login_response.cookies.get('refresh_token', 'Not set')[:30] if login_response.cookies.get('refresh_token') else 'Not set'}...")
        print("   ✅ Login successful")

        # Test 3: Access protected endpoint
        print("\n3. Testing Protected Endpoint Access...")
        headers = {"Authorization": f"Bearer {access_token}"}

        # Test with materials endpoint (should work if auth is correct)
        materials_response = await client.get(f"{BASE_URL}/api/materials", headers=headers)

        print(f"   Status: {materials_response.status_code}")
        if materials_response.status_code == 200:
            print("   ✅ Successfully accessed protected endpoint")
        else:
            print(f"   ❌ Failed to access protected endpoint: {materials_response.text}")
            return False

        # Test 4: Invalid token
        print("\n4. Testing Invalid Token...")
        bad_headers = {"Authorization": "Bearer invalid_token_here"}

        bad_response = await client.get(f"{BASE_URL}/api/materials", headers=bad_headers)

        print(f"   Status: {bad_response.status_code}")
        if bad_response.status_code == 401:
            print("   ✅ Correctly rejected invalid token")
        else:
            print(f"   ❌ Should have rejected invalid token: {bad_response.text}")
            return False

        # Test 5: Refresh token
        print("\n5. Testing Token Refresh...")
        # Need to pass the refresh token cookie
        cookies = {"refresh_token": login_response.cookies.get("refresh_token")}

        refresh_response = await client.post(
            f"{BASE_URL}/api/auth/refresh",
            cookies=cookies,
        )

        print(f"   Status: {refresh_response.status_code}")
        if refresh_response.status_code != 200:
            print(f"   ❌ Token refresh failed: {refresh_response.text}")
            return False

        refresh_result = refresh_response.json()
        new_access_token = refresh_result["access_token"]

        print(f"   New Access Token: {new_access_token[:30]}...")
        print("   ✅ Token refresh successful")

        # Test 6: Use new token
        print("\n6. Testing New Access Token...")
        new_headers = {"Authorization": f"Bearer {new_access_token}"}

        new_materials_response = await client.get(f"{BASE_URL}/api/materials", headers=new_headers)

        print(f"   Status: {new_materials_response.status_code}")
        if new_materials_response.status_code == 200:
            print("   ✅ New token works correctly")
        else:
            print(f"   ❌ New token failed: {new_materials_response.text}")
            return False

        # Test 7: Logout
        print("\n7. Testing Logout...")
        logout_response = await client.post(
            f"{BASE_URL}/api/auth/logout",
            cookies=cookies,
        )

        print(f"   Status: {logout_response.status_code}")
        if logout_response.status_code == 200:
            print(f"   Response: {logout_response.json()}")
            print("   ✅ Logout successful")
        else:
            print(f"   ❌ Logout failed: {logout_response.text}")
            return False

        print("\n" + "=" * 50)
        print("✅ All authentication tests passed!")
        return True


async def main():
    """Main entry point."""
    try:
        success = await test_auth_flow()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
