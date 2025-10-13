#!/usr/bin/env python3
"""Quick auth test script"""
import requests
import json

API_BASE = "http://localhost:8000"

def test_register():
    """Test user registration"""
    url = f"{API_BASE}/api/auth/register"
    data = {
        "email": "testuser2@example.com",
        "password": "TestPass123!"
    }

    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response text: {response.text}")
        try:
            print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        except:
            pass
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing registration...")
    success = test_register()
    print(f"\n{'✓' if success else '✗'} Registration test {'passed' if success else 'failed'}")
