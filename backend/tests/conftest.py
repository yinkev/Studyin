from __future__ import annotations

import uuid
from pathlib import Path
from types import SimpleNamespace
from typing import AsyncGenerator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.config import settings
from app.db.session import get_db
from app.main import app


class StubSession:
    """Lightweight async session stub for integration tests."""

    def __init__(self) -> None:
        self.storage_usage: int = 0
        self.added = []

    async def execute(self, _query) -> "StubResult":
        return StubResult(self.storage_usage)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):  # pragma: no cover - simple stub
        return None

    async def refresh(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()


class StubResult:
    def __init__(self, value: int) -> None:
        self._value = value

    def scalar(self):
        return self._value


@pytest.fixture
def stub_session() -> StubSession:
    return StubSession()


@pytest.fixture
def client(monkeypatch, tmp_path, stub_session: StubSession) -> TestClient:
    upload_dir = Path(tmp_path) / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    test_user = SimpleNamespace(id=uuid.uuid4(), email="user@example.com")

    async def override_user():
        return test_user

    async def override_db() -> AsyncGenerator[StubSession, None]:
        yield stub_session

    original_upload_dir = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = str(upload_dir)

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db

    api_client = TestClient(app)
    api_client.stub_session = stub_session  # type: ignore[attr-defined]
    api_client.test_user = test_user  # type: ignore[attr-defined]

    yield api_client

    app.dependency_overrides.clear()
    settings.UPLOAD_DIR = original_upload_dir


@pytest.fixture
def csrf_headers(client: TestClient) -> dict[str, str]:
    token = "test-csrf-token"
    client.cookies.set("csrf_token", token)
    return {"X-CSRF-Token": token}
