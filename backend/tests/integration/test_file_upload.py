from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException

from app.config import settings
from app.services import file_validator


def _pdf_bytes() -> bytes:
    return b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"


@pytest.mark.integration
def test_valid_pdf_upload_persists_material(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)
    client.stub_session.storage_usage = 0

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("notes.pdf", _pdf_bytes(), "application/pdf")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["filename"] == "notes.pdf"
    assert payload["status"] == "pending"

    saved_material = client.stub_session.added[-1]
    upload_path = Path(saved_material.file_path)
    assert upload_path.exists()
    assert upload_path.parent.name == str(client.test_user.id)


@pytest.mark.integration
def test_malware_detection_blocks_upload(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        raise HTTPException(400, "File failed security scan. Please contact support if this persists.")

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("infected.pdf", _pdf_bytes(), "application/pdf")},
    )

    assert response.status_code == 400
    assert "security" in response.json()["detail"].lower()


@pytest.mark.integration
def test_disallowed_mime_rejected(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        raise HTTPException(400, "File type not allowed")

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("notes.exe", b"MZ", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"].lower()


@pytest.mark.integration
def test_quota_exceeded_returns_413(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)
    client.stub_session.storage_usage = settings.USER_STORAGE_QUOTA - 10

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("big.pdf", b"0" * 32, "application/pdf")},
    )

    assert response.status_code == 413
    assert "quota" in response.json()["detail"].lower()


@pytest.mark.integration
def test_path_traversal_filename_normalized(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("../../../evil.pdf", _pdf_bytes(), "application/pdf")},
    )

    assert response.status_code == 200

    saved_material = client.stub_session.added[-1]
    path = Path(saved_material.file_path)
    assert str(path).startswith(settings.UPLOAD_DIR)
    assert ".." not in path.parts


@pytest.mark.integration
def test_oversized_file_rejected(client, csrf_headers, monkeypatch):
    async def fake_validate(content, filename):
        if len(content) > 1024:
            raise HTTPException(413, "File too large")
        return "application/pdf", ".pdf"

    monkeypatch.setattr(file_validator, "validate_file", fake_validate)

    response = client.post(
        "/api/materials/",
        headers=csrf_headers,
        files={"file": ("huge.pdf", b"0" * 2048, "application/pdf")},
    )

    assert response.status_code == 413
