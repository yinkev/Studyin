from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor


def test_refresh_endpoint_handles_concurrent_requests(client):
    login_response = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Password123!"},
    )
    assert login_response.status_code == 200

    csrf_token = client.cookies.get("csrf_token")
    assert csrf_token is not None

    def make_request():
        response = client.post(
            "/api/auth/refresh",
            headers={"X-CSRF-Token": csrf_token},
        )
        assert response.status_code == 200
        return response.json()["access_token"]

    with ThreadPoolExecutor(max_workers=10) as executor:
        tokens = list(executor.map(lambda _: make_request(), range(10)))

    assert len(tokens) == 10
    assert len(set(tokens)) == 10
