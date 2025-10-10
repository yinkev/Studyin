from __future__ import annotations

import pytest

from app.services import file_validator


@pytest.mark.integration
def test_post_without_csrf_denied(client, monkeypatch):
    async def fake_validate(content, filename):
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        files={"file": ("notes.pdf", b"data", "application/pdf")},
    )

    assert response.status_code == 403
    assert "csrf" in response.json()["detail"].lower()


@pytest.mark.integration
def test_post_with_valid_csrf_allowed(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("notes.pdf", b"data", "application/pdf")},
    )

    assert response.status_code == 200
