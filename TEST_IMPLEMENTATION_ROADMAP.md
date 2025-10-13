# Test Implementation Roadmap

**Quick Start Guide for Immediate Test Coverage Improvements**

---

## Current State Summary

| Metric | Value | Target | Gap |
|--------|-------|--------|-----|
| **Backend Test Coverage** | ~17% | 80% | -63% |
| **Frontend Test Coverage** | ~5% | 80% | -75% |
| **Unit Tests** | 0 files | 15+ files | Missing |
| **Integration Tests** | 6 files | 15+ files | 9 needed |
| **E2E Tests** | 0 files | 8+ files | Missing |
| **CI/CD Pipeline** | None | Full automation | Missing |

---

## Week 1: Foundation (Critical MVP Tests)

### Day 1-2: WebSocket Chat Tests (HIGHEST PRIORITY)
**Why:** Core feature for MVP, no coverage currently

**File to create:** `/Users/kyin/Projects/Studyin/backend/tests/integration/test_websocket_chat.py`

```python
"""
WebSocket chat integration tests
Priority: CRITICAL
Estimated time: 8 hours
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestWebSocketChat:
    def test_websocket_connection_lifecycle(self, client):
        """Test connect, message, disconnect flow."""
        with client.websocket_connect("/api/chat/ws") as websocket:
            welcome = websocket.receive_json()
            assert welcome["type"] == "info"
            assert "Connected" in welcome["message"]

    def test_websocket_streaming_response(self, client, mock_rag, mock_codex):
        """Test message streaming with RAG context."""
        with client.websocket_connect("/api/chat/ws") as websocket:
            websocket.receive_json()  # welcome

            # Send message
            websocket.send_json({
                "type": "user_message",
                "content": "Explain cardiac cycle",
                "user_level": 3,
                "profile": "studyin_study"
            })

            # Verify context sent
            context = websocket.receive_json()
            assert context["type"] == "context"
            assert len(context["chunks"]) > 0

            # Verify streaming
            tokens = []
            while True:
                msg = websocket.receive_json()
                if msg["type"] == "token":
                    tokens.append(msg["value"])
                elif msg["type"] == "complete":
                    break

            assert len(tokens) > 0

    def test_websocket_error_handling(self, client):
        """Test error messages sent to client."""
        with client.websocket_connect("/api/chat/ws") as websocket:
            websocket.receive_json()  # welcome

            # Send empty message
            websocket.send_json({
                "type": "user_message",
                "content": "",
                "user_level": 3
            })

            error = websocket.receive_json()
            assert error["type"] == "error"
            assert "empty" in error["message"].lower()

    def test_websocket_origin_validation(self, client):
        """Test CORS origin validation."""
        with pytest.raises(Exception):
            client.websocket_connect(
                "/api/chat/ws",
                headers={"origin": "https://evil.com"}
            )

    def test_websocket_concurrent_connections(self, client):
        """Test multiple simultaneous users."""
        connections = []
        try:
            for i in range(5):
                ws = client.websocket_connect("/api/chat/ws")
                connections.append(ws)
                ws.receive_json()  # welcome

            # All should work independently
            for ws in connections:
                ws.send_json({
                    "type": "user_message",
                    "content": "Test",
                    "user_level": 2
                })

        finally:
            for ws in connections:
                ws.close()
```

**Run with:**
```bash
cd /Users/kyin/Projects/Studyin/backend
pytest tests/integration/test_websocket_chat.py -v
```

---

### Day 3-4: RAG Service Tests (HIGH PRIORITY)
**Why:** Core retrieval logic, 0% coverage

**File to create:** `/Users/kyin/Projects/Studyin/backend/tests/unit/test_rag_service.py`

```python
"""
RAG service unit tests
Priority: HIGH
Estimated time: 6 hours
"""
import pytest
import uuid
from unittest.mock import AsyncMock, Mock, patch
from app.services.rag_service import RagService, RagContextChunk


@pytest.fixture
def mock_embedding_service():
    mock = Mock()
    mock.search_similar = Mock(return_value=[
        {
            "id": str(uuid.uuid4()),
            "score": 0.95,
            "distance": 0.05,
            "metadata": {"filename": "test.pdf"}
        }
    ])
    return mock


@pytest.mark.asyncio
class TestRagService:
    async def test_retrieve_context_success(self, mock_embedding_service, mock_db_session):
        """Test successful context retrieval."""
        with patch('app.services.rag_service.get_embedding_service', return_value=mock_embedding_service):
            rag = RagService()
            chunks = await rag.retrieve_context(
                session=mock_db_session,
                user_id=uuid.uuid4(),
                query="Test query",
                top_k=4
            )
            assert isinstance(chunks, list)

    async def test_retrieve_context_no_results(self, mock_db_session):
        """Test handling of no matching chunks."""
        mock_service = Mock()
        mock_service.search_similar = Mock(return_value=[])

        with patch('app.services.rag_service.get_embedding_service', return_value=mock_service):
            rag = RagService()
            chunks = await rag.retrieve_context(
                session=mock_db_session,
                user_id=uuid.uuid4(),
                query="Unknown topic",
                top_k=4
            )
            assert len(chunks) == 0

    def test_render_context_summary(self):
        """Test context formatting."""
        chunks = [
            RagContextChunk(
                chunk_id="1",
                content="Test content about cardiac cycle",
                filename="cardio.pdf",
                chunk_index=0,
                distance=0.1,
                metadata={}
            )
        ]

        summary = RagService.render_context_summary(chunks)
        assert "[Source 1]" in summary
        assert "cardio.pdf" in summary
        assert "Test content" in summary

    def test_render_context_summary_empty(self):
        """Test empty context handling."""
        summary = RagService.render_context_summary([])
        assert "No relevant study materials" in summary
```

**Run with:**
```bash
cd /Users/kyin/Projects/Studyin/backend
pytest tests/unit/test_rag_service.py -v
```

---

### Day 5: Setup Test Infrastructure
**Why:** Enable coverage tracking and CI/CD

**1. Install test dependencies:**
```bash
cd /Users/kyin/Projects/Studyin/backend
pip install pytest-cov pytest-asyncio pytest-mock faker freezegun
```

**2. Create pytest.ini:**
```ini
# /Users/kyin/Projects/Studyin/backend/pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow tests (>1s)

[coverage:run]
source = app
omit =
    */tests/*
    */migrations/*
    */__pycache__/*

[coverage:report]
precision = 2
show_missing = True
fail_under = 50  # Start at 50%, increase to 80%
```

**3. Create requirements-dev.txt:**
```txt
# /Users/kyin/Projects/Studyin/backend/requirements-dev.txt
pytest==8.0.0
pytest-asyncio==0.23.0
pytest-cov==4.1.0
pytest-mock==3.12.0
httpx==0.26.0
faker==22.0.0
freezegun==1.4.0
```

**4. Frontend test setup:**
```bash
cd /Users/kyin/Projects/Studyin/frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui vitest jsdom msw
```

**5. Create vitest.config.ts:**
```typescript
// /Users/kyin/Projects/Studyin/frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 50,  // Start at 50%, increase to 80%
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Week 2: Core Coverage

### Day 6-7: Document Processing Tests
**File:** `/Users/kyin/Projects/Studyin/backend/tests/unit/test_document_processor.py`

```python
"""Test PDF extraction and chunking."""
import pytest
from app.services.document_processor import extract_text_from_pdf, chunk_text


class TestDocumentProcessor:
    def test_extract_text_from_valid_pdf(self, sample_pdf_fixture):
        """Test PDF text extraction."""
        text = extract_text_from_pdf(sample_pdf_fixture)
        assert len(text) > 0
        assert isinstance(text, str)

    def test_extract_text_from_missing_file(self):
        """Test error handling for missing PDF."""
        with pytest.raises(FileNotFoundError):
            extract_text_from_pdf("/nonexistent/file.pdf")

    def test_chunk_text_default_size(self):
        """Test text chunking with default size."""
        text = "word " * 1000  # 1000 words
        chunks = chunk_text(text, chunk_size=500)
        assert len(chunks) == 2
        assert all(len(c.split()) <= 500 for c in chunks)

    def test_chunk_text_empty_input(self):
        """Test chunking empty text."""
        chunks = chunk_text("")
        assert len(chunks) == 0

    def test_chunk_text_invalid_size(self):
        """Test invalid chunk size."""
        with pytest.raises(ValueError):
            chunk_text("test", chunk_size=0)
```

---

### Day 8-9: Frontend AI Coach Tests
**File:** `/Users/kyin/Projects/Studyin/frontend/tests/unit/AICoach.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AICoach } from '@/components/AICoach/MessageDisplay';

describe('AICoach Component', () => {
  test('renders chat interface', () => {
    render(<AICoach />);
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('sends message and displays response', async () => {
    const user = userEvent.setup();
    const mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    global.WebSocket = vi.fn(() => mockWebSocket as any);

    render(<AICoach />);

    const input = screen.getByPlaceholderText(/ask a question/i);
    await user.type(input, 'Test question');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockWebSocket.send).toHaveBeenCalled();
  });

  test('displays error messages', async () => {
    render(<AICoach />);

    // Simulate WebSocket error
    // ... test error handling
  });
});
```

---

### Day 10: Analytics Tests
**File:** `/Users/kyin/Projects/Studyin/backend/tests/unit/test_analytics_tracker.py`

```python
"""Test analytics event tracking."""
import pytest
from app.services.analytics.tracker import AnalyticsTracker


@pytest.mark.asyncio
class TestAnalyticsTracker:
    async def test_start_learning_session(self, mock_db_session):
        """Test session start tracking."""
        tracker = AnalyticsTracker(mock_db_session)
        user_id = uuid.uuid4()

        session_id = await tracker.start_learning_session(user_id, None)
        assert session_id is not None

    async def test_track_xp_award(self, mock_db_session):
        """Test XP tracking."""
        tracker = AnalyticsTracker(mock_db_session)
        user_id = uuid.uuid4()

        await tracker.award_xp(user_id, 100, "quiz_completion")
        # Verify XP recorded
```

---

## Week 3: E2E Tests (Playwright)

### Setup Playwright
```bash
cd /Users/kyin/Projects/Studyin/frontend
npm install --save-dev @playwright/test
npx playwright install
```

### Create E2E Test: Onboarding
**File:** `/Users/kyin/Projects/Studyin/frontend/tests/e2e/onboarding.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Onboarding', () => {
  test('complete onboarding flow', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('http://localhost:5173');

    // 2. Sign up
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 3. Upload first material
    await expect(page.locator('text=Upload Study Material')).toBeVisible();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/sample.pdf');

    // 4. Wait for processing
    await expect(page.locator('text=Processing...')).toBeVisible();
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 30000 });

    // 5. Open AI Coach
    await page.click('text=AI Coach');

    // 6. Send first message
    await page.fill('textarea', 'What is the cardiac cycle?');
    await page.click('button:has-text("Send")');

    // 7. Verify streaming response
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 });
  });
});
```

---

## Week 4: CI/CD Pipeline

### Create GitHub Actions Workflow
**File:** `/Users/kyin/Projects/Studyin/.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: studyin_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/coverage-final.json
```

---

## Quick Commands Reference

### Backend
```bash
# Run all tests
cd /Users/kyin/Projects/Studyin/backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/integration/test_websocket_chat.py::test_websocket_connection -v

# Run only unit tests
pytest tests/unit -v

# Run only integration tests
pytest tests/integration -v

# Generate coverage report
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Frontend
```bash
# Run all tests
cd /Users/kyin/Projects/Studyin/frontend
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run in watch mode
npm run test:watch
```

---

## Success Criteria

### Week 1 Complete
- ✅ WebSocket tests passing (5+ test cases)
- ✅ RAG service tests passing (5+ test cases)
- ✅ Coverage reporting setup
- ✅ Backend coverage > 30%

### Week 2 Complete
- ✅ Document processing tests passing
- ✅ Frontend AI Coach tests passing
- ✅ Analytics tests passing
- ✅ Backend coverage > 50%
- ✅ Frontend coverage > 30%

### Week 3 Complete
- ✅ E2E onboarding test passing
- ✅ E2E learning session test passing
- ✅ Backend coverage > 70%
- ✅ Frontend coverage > 50%

### Week 4 Complete
- ✅ CI/CD pipeline running
- ✅ Pre-commit hooks active
- ✅ Backend coverage > 80%
- ✅ Frontend coverage > 70%
- ✅ All critical paths tested

---

## Immediate Next Steps (Today)

1. **Create test directories** (if missing):
```bash
cd /Users/kyin/Projects/Studyin/backend
mkdir -p tests/unit
mkdir -p tests/e2e

cd /Users/kyin/Projects/Studyin/frontend
mkdir -p tests/unit
mkdir -p tests/e2e
```

2. **Install test dependencies**:
```bash
# Backend
cd /Users/kyin/Projects/Studyin/backend
pip install pytest-cov pytest-asyncio pytest-mock

# Frontend
cd /Users/kyin/Projects/Studyin/frontend
npm install --save-dev @testing-library/react @vitest/ui vitest jsdom
```

3. **Run existing tests** to establish baseline:
```bash
# Backend
cd /Users/kyin/Projects/Studyin/backend
pytest --cov=app --cov-report=term

# Frontend
cd /Users/kyin/Projects/Studyin/frontend
npm test
```

4. **Create first new test** (WebSocket):
- Copy WebSocket test code from Day 1-2 section above
- Save to `/Users/kyin/Projects/Studyin/backend/tests/integration/test_websocket_chat.py`
- Run: `pytest tests/integration/test_websocket_chat.py -v`

---

## Tracking Progress

Create a simple checklist in your project:

```markdown
# Test Implementation Checklist

## Week 1: Foundation
- [ ] WebSocket chat tests (8h)
- [ ] RAG service tests (6h)
- [ ] Test infrastructure setup (4h)
- [ ] Document processing tests (4h)

## Week 2: Core Coverage
- [ ] Frontend AI Coach tests (6h)
- [ ] Analytics tracker tests (4h)
- [ ] Embedding service tests (4h)
- [ ] API integration tests (6h)

## Week 3: E2E Tests
- [ ] Onboarding E2E test (8h)
- [ ] Learning session E2E test (8h)
- [ ] Document processing E2E test (6h)

## Week 4: CI/CD
- [ ] GitHub Actions workflow (4h)
- [ ] Pre-commit hooks (2h)
- [ ] Coverage badges (1h)
- [ ] Documentation update (2h)

## Coverage Milestones
- [ ] 30% coverage (baseline)
- [ ] 50% coverage (mid-point)
- [ ] 70% coverage (good)
- [ ] 80% coverage (target)
```

---

**Start with:** WebSocket tests (highest priority, critical MVP feature)
**Timeline:** 4 weeks to 80% coverage
**Total Effort:** ~97 hours (12 working days)
