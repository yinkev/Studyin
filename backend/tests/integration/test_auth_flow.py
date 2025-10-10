from __future__ import annotations

import uuid

import pytest

from app.api import auth as auth_module


@pytest.mark.integration
def test_login_sets_tokens_and_csrf(client, monkeypatch):
    async def fake_auth(credentials):
        return {"id": uuid.uuid4(), "email": credentials.email}

    monkeypatch.setattr(auth_module, "authenticate", fake_auth)

    response = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"].startswith("access-")
    assert data["user"]["email"] == "student@example.com"
    assert client.cookies.get("refresh_token") is not None
    assert client.cookies.get("csrf_token") is not None


@pytest.mark.integration
def test_refresh_returns_new_access_token(client):
    # Seed cookies via login to mimic real refresh workflow
    login_response = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Password123!"},
    )
    assert login_response.status_code == 200

    # The CSRF token is set as part of login; apply header for refresh
    csrf_token = client.cookies.get("csrf_token")
    assert csrf_token is not None
    headers = {"X-CSRF-Token": csrf_token}

    response = client.post("/api/auth/refresh", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"].startswith("access-")


@pytest.mark.integration
def test_logout_clears_tokens(client, monkeypatch):
    async def fake_auth(credentials):
        return {"id": uuid.uuid4(), "email": credentials.email}

    monkeypatch.setattr(auth_module, "authenticate", fake_auth)

    login_response = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Password123!"},
    )
    assert login_response.status_code == 200

    csrf_token = client.cookies.get("csrf_token")
    assert csrf_token is not None

    response = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": csrf_token},
    )

    assert response.status_code == 200
    assert client.cookies.get("refresh_token") is None
