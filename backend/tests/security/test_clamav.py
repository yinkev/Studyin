from __future__ import annotations

import asyncio
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.file_validator import file_validator


FIXTURE_DIR = Path(__file__).parent


def _load_eicar() -> bytes:
    return (FIXTURE_DIR / "eicar.txt").read_bytes()


def test_eicar_signature_triggers_block(monkeypatch):
    original_mime_detector = file_validator.mime_detector
    original_clamav_available = file_validator.clamav_available
    original_client = getattr(file_validator, "_clamd_client", None)

    monkeypatch.setattr(
        file_validator,
        "mime_detector",
        SimpleNamespace(from_buffer=lambda _buffer: "text/plain"),
    )

    class DummyClient:
        def instream(self, _content):
            return {"stream": ("FOUND", "Eicar-Test-Signature")}

    file_validator.clamav_available = True
    file_validator._clamd_client = DummyClient()

    with pytest.raises(HTTPException) as excinfo:
        asyncio.run(file_validator.validate_file(_load_eicar(), "eicar.txt"))

    assert "security" in str(excinfo.value.detail).lower()

    file_validator.mime_detector = original_mime_detector
    file_validator.clamav_available = original_clamav_available
    file_validator._clamd_client = original_client


def test_clean_file_passes_when_scanner_ok(monkeypatch):
    original_mime_detector = file_validator.mime_detector
    original_client = getattr(file_validator, "_clamd_client", None)
    original_clamav_available = file_validator.clamav_available

    monkeypatch.setattr(
        file_validator,
        "mime_detector",
        SimpleNamespace(from_buffer=lambda _buffer: "text/plain"),
    )

    class CleanClient:
        def instream(self, _content):
            return {"stream": ("OK", None)}

    file_validator.clamav_available = True
    file_validator._clamd_client = CleanClient()

    result = asyncio.run(file_validator.validate_file(b"safe content", "safe.txt"))
    assert result == ("text/plain", ".txt")

    file_validator.mime_detector = original_mime_detector
    file_validator.clamav_available = original_clamav_available
    file_validator._clamd_client = original_client
