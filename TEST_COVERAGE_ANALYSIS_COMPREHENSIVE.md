# Comprehensive Test Coverage Analysis & Strategy

**Project:** StudyIn Medical Education Platform
**Date:** 2025-10-12
**Analyzed By:** Test Automation Engineer Agent
**Coverage Scope:** Backend (Python/FastAPI) + Frontend (React/TypeScript)

---

## Executive Summary

### Current State
- **Backend Test Lines:** ~1,312 lines
- **Backend App Lines:** ~7,619 lines
- **Estimated Coverage:** ~17% based on line count (actual coverage likely lower)
- **Test Types Present:** Integration (6), Security (2), Performance (1)
- **Test Types Missing:** Unit tests, E2E tests, API contract tests, load tests

### Critical Gaps Identified
1. **No unit tests** for core services (RAG, embeddings, document processing)
2. **No WebSocket E2E tests** for real-time chat functionality
3. **No RAG pipeline tests** (retrieval accuracy, context building, chunking)
4. **No analytics tracking tests** (event capture, aggregation, privacy)
5. **Minimal frontend tests** (only 2 integration tests found)
6. **No database migration tests** or rollback validation
7. **No CI/CD test pipeline** configuration

### Recommended Immediate Actions
1. Implement WebSocket E2E tests (critical for MVP)
2. Add RAG service unit + integration tests
3. Create analytics event tracking tests
4. Set up test coverage reporting (pytest-cov, Vitest)
5. Establish CI/CD test gates (80% coverage minimum)

---

## Current Test Coverage Breakdown

### Backend Tests (Python/FastAPI)

#### ✅ What's Tested (Integration Layer)

**Authentication Flow** (`test_auth_flow.py`)
- ✅ Login with JWT token generation
- ✅ Token refresh with CSRF validation
- ✅ Logout with token cleanup
- **Coverage:** Basic auth flows
- **Gaps:** Password reset, email verification, token expiration, concurrent sessions

**File Upload** (`test_file_upload.py`)
- ✅ Valid PDF upload with validation
- ✅ Malware detection (ClamAV stub)
- ✅ MIME type validation
- ✅ Storage quota enforcement
- ✅ Path traversal prevention
- ✅ File size limits
- **Coverage:** Upload security & validation
- **Gaps:** Document processing post-upload, chunking, embedding generation, duplicate file handling

**CSRF Protection** (`test_csrf.py`)
- ✅ CSRF token validation on state-changing operations
- **Coverage:** Basic CSRF protection
- **Gaps:** Token rotation, double-submit cookie validation, SameSite cookie testing

**Security (Codex CLI)** (`test_codex_security.py`)
- ✅ CLI path whitelist validation
- ✅ Prompt sanitization (injection prevention)
- ✅ Model name validation
- ✅ Safe command building (no shell=True)
- ✅ Shell metacharacter blocking
- ✅ Null byte detection
- ✅ Length limits enforcement
- **Coverage:** Comprehensive command injection prevention
- **Gaps:** Rate limiting, token budget enforcement, streaming timeout edge cases

**Performance** (`test_performance.py`)
- ✅ Concurrent request handling
- ✅ Database connection pooling
- **Coverage:** Basic load testing
- **Gaps:** WebSocket connection limits, RAG query performance, embedding generation latency

**Database Partitioning** (`test_partitioning.py`)
- ✅ User-based partitioning for user_login_attempts
- **Coverage:** Partition creation
- **Gaps:** Partition pruning, query performance validation, cross-partition queries

#### ❌ What's NOT Tested (Critical Gaps)

**RAG Service** (0% coverage)
- ❌ Vector search accuracy
- ❌ Context retrieval relevance
- ❌ Chunk ranking algorithms
- ❌ User ownership validation in retrieval
- ❌ ChromaDB integration errors
- ❌ Empty result handling
- ❌ Concurrent query handling
- ❌ Context summary rendering

**Document Processing** (0% coverage)
- ❌ PDF text extraction accuracy
- ❌ Text chunking algorithm validation
- ❌ Chunk size optimization
- ❌ Chunk overlap handling
- ❌ Special character handling
- ❌ Multi-page document processing
- ❌ Corrupted PDF handling
- ❌ DOCX extraction (if implemented)

**Embedding Service** (0% coverage)
- ❌ Embedding generation correctness
- ❌ Vector dimension validation
- ❌ Batch embedding performance
- ❌ Embedding model switching
- ❌ Cache hit/miss behavior
- ❌ Retry logic on failures
- ❌ Vector normalization

**WebSocket Chat** (0% coverage)
- ❌ Connection lifecycle (connect, disconnect, reconnect)
- ❌ Message streaming validation
- ❌ Token streaming performance
- ❌ Error message handling
- ❌ Context retrieval integration
- ❌ History management (6-message limit)
- ❌ User level adaptation
- ❌ Profile switching (fast/study/deep)
- ❌ Concurrent user handling
- ❌ Origin validation edge cases

**Analytics System** (0% coverage)
- ❌ Event capture accuracy
- ❌ Privacy-first anonymization
- ❌ Daily aggregation jobs
- ❌ Gamification XP calculation
- ❌ Streak tracking logic
- ❌ Achievement unlocking
- ❌ Heatmap data generation
- ❌ API endpoint query performance
- ❌ User ID anonymization correctness

**API Layer (Unit Tests)** (0% coverage)
- ❌ Individual endpoint business logic
- ❌ Request validation schemas
- ❌ Response serialization
- ❌ Error handling per endpoint
- ❌ Dependency injection mocking
- ❌ Database session management

**Database Migrations** (0% coverage)
- ❌ Migration application success
- ❌ Rollback functionality
- ❌ Data integrity during migration
- ❌ Index creation performance
- ❌ Foreign key constraint validation
- ❌ Partition creation automation

### Frontend Tests (React/TypeScript)

#### ✅ What's Tested

**WebSocket Hook** (`websocket.test.ts`)
- ✅ Message streaming and completion
- ✅ Message queueing before connection
- ✅ Connection lifecycle
- **Coverage:** Basic WebSocket hook behavior
- **Gaps:** Reconnection logic, error handling, timeout behavior

**API Interceptor** (`api-interceptor.test.ts`)
- ✅ Token refresh on 401
- ✅ Request retry logic
- **Coverage:** Basic API error handling
- **Gaps:** Network errors, CSRF handling, concurrent request failures

#### ❌ What's NOT Tested (Critical Gaps)

**AI Coach Component** (0% coverage)
- ❌ Message rendering (markdown, code blocks)
- ❌ Streaming UI updates
- ❌ Context sources display
- ❌ Error message handling
- ❌ Loading states
- ❌ User input validation
- ❌ Profile selection UI

**File Upload Component** (0% coverage)
- ❌ Drag-and-drop functionality
- ❌ Progress tracking display
- ❌ File type validation UI
- ❌ Error message display
- ❌ Upload cancellation
- ❌ Multiple file handling

**Analytics Dashboard** (0% coverage)
- ❌ Chart rendering (heatmap, XP trends)
- ❌ Data fetching and loading states
- ❌ Date range filtering
- ❌ Empty state handling
- ❌ Error boundary behavior

**Navigation & Routing** (0% coverage)
- ❌ Protected route redirection
- ❌ Auth state persistence
- ❌ Route parameter validation
- ❌ 404 handling

**UI Components** (0% coverage)
- ❌ Button interactions
- ❌ Form validation
- ❌ Modal dialogs
- ❌ Accessibility compliance
- ❌ Responsive behavior

---

## Critical User Journeys Requiring E2E Tests

### Journey 1: First-Time User Onboarding
**Priority:** HIGH
**Impact:** MVP success depends on this

**Steps:**
1. User visits landing page
2. Signs up with email/password
3. Email verification (if implemented)
4. Logs in successfully
5. Sees empty dashboard with upload prompt
6. Uploads first PDF study material
7. Waits for processing (progress indicator)
8. Material appears in library
9. Opens AI Coach chat
10. Asks first question about uploaded material
11. Receives streaming response with context citations

**Current Coverage:** 0%
**Test Frameworks Needed:** Playwright (MCP available), Cypress alternative
**Estimated Test Time:** 2-3 hours to implement

---

### Journey 2: Active Learning Session
**Priority:** HIGH
**Impact:** Core product value

**Steps:**
1. User logs in
2. Navigates to library
3. Selects study material to review
4. Opens AI Coach with material context
5. Asks series of questions (conversational flow)
6. Receives Socratic teaching responses
7. Switches between fast/study/deep profiles
8. Views context sources cited in responses
9. Rates helpful responses
10. Session tracked in analytics
11. XP awarded, streak updated
12. Logout preserves session state

**Current Coverage:** ~10% (WebSocket hook only)
**Test Frameworks Needed:** Playwright + API mocking
**Estimated Test Time:** 3-4 hours to implement

---

### Journey 3: Document Processing Pipeline
**Priority:** CRITICAL
**Impact:** Foundation of RAG functionality

**Steps:**
1. User uploads PDF (valid medical content)
2. Backend validates file (size, type, malware)
3. File saved to user-specific directory
4. Document processor extracts text
5. Text chunked into semantic units
6. Embeddings generated for each chunk
7. Chunks stored in ChromaDB with metadata
8. Material status updated to "ready"
9. User receives completion notification
10. Material appears in searchable library

**Current Coverage:** ~30% (upload validation only)
**Test Frameworks Needed:** pytest-asyncio, mocking ChromaDB
**Estimated Test Time:** 4-5 hours to implement

---

### Journey 4: RAG Retrieval & Context Building
**Priority:** CRITICAL
**Impact:** Quality of AI responses

**Steps:**
1. User asks question in AI Coach
2. Question embedded using same model
3. Vector search in ChromaDB (similarity)
4. Top K chunks retrieved (default K=4)
5. Chunks filtered by user ownership
6. Chunks ranked by relevance score
7. Context summary built from chunks
8. Context injected into prompt
9. LLM generates response using context
10. Context sources sent to frontend

**Current Coverage:** 0%
**Test Frameworks Needed:** pytest, ChromaDB test fixtures
**Estimated Test Time:** 5-6 hours to implement

---

### Journey 5: Analytics & Gamification
**Priority:** MEDIUM
**Impact:** User engagement & retention

**Steps:**
1. User completes learning session
2. Session duration calculated
3. XP awarded based on activity
4. Streak updated (daily active check)
5. Achievement unlocked (e.g., "7-day streak")
6. User views analytics dashboard
7. Heatmap shows activity trends
8. XP progress bar displays level advancement
9. Recent achievements listed
10. Privacy-first data (anonymized IDs)

**Current Coverage:** 0%
**Test Frameworks Needed:** pytest, time mocking
**Estimated Test Time:** 3-4 hours to implement

---

## Recommended Test Framework Setup

### Backend (Python/FastAPI)

#### Testing Stack
```python
# requirements-dev.txt
pytest==8.0.0
pytest-asyncio==0.23.0
pytest-cov==4.1.0
pytest-mock==3.12.0
httpx==0.26.0  # For TestClient
faker==22.0.0  # Test data generation
freezegun==1.4.0  # Time mocking
```

#### Configuration
```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    unit: Unit tests (fast, isolated)
    integration: Integration tests (database, external services)
    e2e: End-to-end tests (full user journeys)
    security: Security-focused tests
    performance: Performance and load tests
    slow: Tests that take >1 second

# Coverage settings
[coverage:run]
source = app
omit =
    */tests/*
    */migrations/*
    */__pycache__/*

[coverage:report]
precision = 2
show_missing = True
skip_covered = False
fail_under = 80
```

#### Directory Structure
```
backend/tests/
├── conftest.py                 # Shared fixtures
├── unit/                       # Fast, isolated tests
│   ├── test_document_processor.py
│   ├── test_embedding_service.py
│   ├── test_rag_service.py
│   ├── test_analytics_tracker.py
│   ├── test_codex_llm.py
│   └── test_utils/
├── integration/                # Tests with dependencies
│   ├── test_auth_flow.py      # ✅ Exists
│   ├── test_file_upload.py    # ✅ Exists
│   ├── test_csrf.py            # ✅ Exists
│   ├── test_websocket_chat.py # ❌ Missing
│   ├── test_rag_pipeline.py   # ❌ Missing
│   ├── test_analytics_api.py  # ❌ Missing
│   └── test_materials_api.py  # ❌ Missing
├── e2e/                        # Full user journeys
│   ├── test_onboarding.py     # ❌ Missing
│   ├── test_learning_session.py # ❌ Missing
│   ├── test_document_upload_to_rag.py # ❌ Missing
│   └── test_analytics_flow.py # ❌ Missing
├── security/                   # Security tests
│   ├── test_codex_security.py # ✅ Exists
│   ├── test_clamav.py          # ✅ Exists
│   ├── test_auth_security.py  # ❌ Missing
│   └── test_api_security.py   # ❌ Missing
├── performance/                # Load & stress tests
│   ├── test_performance.py    # ✅ Exists
│   ├── test_websocket_load.py # ❌ Missing
│   ├── test_rag_performance.py # ❌ Missing
│   └── test_api_load.py       # ❌ Missing
└── fixtures/                   # Test data
    ├── sample_pdfs/
    ├── embeddings/
    └── mock_responses/
```

### Frontend (React/TypeScript)

#### Testing Stack
```json
// package.json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.1.0",
    "vitest": "^1.1.0",
    "jsdom": "^23.0.1",
    "msw": "^2.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

#### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
        '**/mockData',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

#### Directory Structure
```
frontend/tests/
├── setupTests.ts               # Global test setup
├── unit/                       # Component unit tests
│   ├── AICoach.test.tsx       # ❌ Missing
│   ├── FileUpload.test.tsx    # ❌ Missing
│   ├── AnalyticsDashboard.test.tsx # ❌ Missing
│   ├── NavBar.test.tsx        # ❌ Missing
│   └── ui/                    # UI component tests
├── integration/                # Integration tests
│   ├── websocket.test.ts      # ✅ Exists
│   ├── api-interceptor.test.ts # ✅ Exists
│   ├── chat-session.test.ts   # ❌ Missing
│   └── analytics-tracking.test.ts # ❌ Missing
├── e2e/                        # Playwright E2E tests
│   ├── onboarding.spec.ts     # ❌ Missing
│   ├── learning-session.spec.ts # ❌ Missing
│   ├── file-upload.spec.ts    # ❌ Missing
│   └── analytics-dashboard.spec.ts # ❌ Missing
├── mocks/                      # MSW mock handlers
│   ├── handlers.ts
│   └── server.ts
└── fixtures/                   # Test data
    ├── mockMessages.ts
    ├── mockMaterials.ts
    └── mockAnalytics.ts
```

---

## Priority Test Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Establish testing infrastructure & critical path coverage

#### Backend Tests (Priority: CRITICAL)
1. **WebSocket Chat Integration Test** (8 hours)
   - File: `backend/tests/integration/test_websocket_chat.py`
   - Coverage:
     - Connection lifecycle
     - Message streaming validation
     - RAG context integration
     - Error handling
     - Profile switching
   - Dependencies: Mock ChromaDB, mock Codex CLI

2. **RAG Service Unit Tests** (6 hours)
   - File: `backend/tests/unit/test_rag_service.py`
   - Coverage:
     - `retrieve_context()` with mocked ChromaDB
     - User ownership validation
     - Context ranking
     - `render_context_summary()` formatting
     - Empty result handling
   - Dependencies: pytest fixtures for chunks

3. **Document Processing Unit Tests** (4 hours)
   - File: `backend/tests/unit/test_document_processor.py`
   - Coverage:
     - PDF text extraction
     - Chunking algorithm (500-word chunks)
     - Edge cases (empty pages, special characters)
     - Error handling (corrupted PDFs)
   - Dependencies: Sample PDF fixtures

4. **Embedding Service Unit Tests** (4 hours)
   - File: `backend/tests/unit/test_embedding_service.py`
   - Coverage:
     - Vector generation
     - Batch processing
     - Cache behavior
     - ChromaDB storage/retrieval
   - Dependencies: Mock ChromaDB

#### Frontend Tests (Priority: HIGH)
5. **AI Coach Component Tests** (6 hours)
   - File: `frontend/tests/unit/AICoach.test.tsx`
   - Coverage:
     - Message rendering (markdown)
     - Streaming updates
     - Context sources display
     - Error states
     - User input validation
   - Dependencies: MSW for API mocking

6. **File Upload Component Tests** (4 hours)
   - File: `frontend/tests/unit/FileUpload.test.tsx`
   - Coverage:
     - Drag-and-drop
     - Progress tracking
     - File validation
     - Error messages
   - Dependencies: MSW for upload API

**Total Estimated Time:** 32 hours (4 working days)

---

### Phase 2: Integration & E2E (Week 2)
**Goal:** Validate critical user journeys end-to-end

#### Backend Integration Tests
7. **RAG Pipeline Integration Test** (6 hours)
   - File: `backend/tests/integration/test_rag_pipeline.py`
   - Coverage:
     - Upload → Extract → Chunk → Embed → Store
     - Query → Retrieve → Rank → Respond
     - Multi-user isolation
   - Dependencies: Real ChromaDB instance (test mode)

8. **Analytics API Integration Tests** (5 hours)
   - File: `backend/tests/integration/test_analytics_api.py`
   - Coverage:
     - Event tracking endpoints
     - Dashboard data endpoints
     - Privacy validation (anonymization)
     - Aggregation accuracy
   - Dependencies: Database with test data

#### Frontend E2E Tests (Playwright)
9. **Onboarding E2E Test** (8 hours)
   - File: `frontend/tests/e2e/onboarding.spec.ts`
   - Coverage: Full Journey 1 (see above)
   - Dependencies: Playwright, test database

10. **Learning Session E2E Test** (8 hours)
    - File: `frontend/tests/e2e/learning-session.spec.ts`
    - Coverage: Full Journey 2 (see above)
    - Dependencies: Playwright, mock Codex responses

**Total Estimated Time:** 27 hours (3.4 working days)

---

### Phase 3: Coverage & Quality (Week 3)
**Goal:** Achieve 80% coverage & establish quality gates

#### Backend Tests
11. **Analytics Tracker Unit Tests** (4 hours)
    - File: `backend/tests/unit/test_analytics_tracker.py`
    - Coverage:
      - Event capture
      - XP calculation
      - Streak logic
      - Achievement unlocking
      - Anonymization

12. **API Security Tests** (6 hours)
    - File: `backend/tests/security/test_api_security.py`
    - Coverage:
      - Rate limiting
      - CORS validation
      - SQL injection prevention
      - XSS prevention
      - CSRF comprehensive testing

#### Frontend Tests
13. **Analytics Dashboard Tests** (6 hours)
    - File: `frontend/tests/unit/AnalyticsDashboard.test.tsx`
    - Coverage:
      - Heatmap rendering
      - XP trends
      - Data filtering
      - Empty states

14. **E2E: Document Processing Journey** (8 hours)
    - File: `frontend/tests/e2e/document-processing.spec.ts`
    - Coverage: Full Journey 3 (see above)

**Total Estimated Time:** 24 hours (3 working days)

---

### Phase 4: Performance & Load (Week 4)
**Goal:** Ensure system handles production load

15. **WebSocket Load Tests** (6 hours)
    - File: `backend/tests/performance/test_websocket_load.py`
    - Coverage:
      - 100 concurrent users
      - Message throughput
      - Connection stability
      - Memory usage

16. **RAG Query Performance Tests** (4 hours)
    - File: `backend/tests/performance/test_rag_performance.py`
    - Coverage:
      - Query latency (< 500ms target)
      - Concurrent queries
      - Cache effectiveness
      - Index performance

17. **API Load Tests** (4 hours)
    - File: `backend/tests/performance/test_api_load.py`
    - Coverage:
      - Authentication endpoints
      - File upload under load
      - Analytics queries
      - Rate limit enforcement

**Total Estimated Time:** 14 hours (1.75 working days)

---

## CI/CD Test Pipeline Configuration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
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
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: studyin_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.13
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run unit tests
        run: |
          cd backend
          pytest tests/unit -v --cov=app --cov-report=xml --cov-report=term

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/studyin_test
        run: |
          cd backend
          pytest tests/integration -v --cov=app --cov-append --cov-report=xml

      - name: Run security tests
        run: |
          cd backend
          pytest tests/security -v --cov=app --cov-append --cov-report=xml

      - name: Check coverage threshold
        run: |
          cd backend
          pytest --cov=app --cov-report=term --cov-fail-under=80

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run unit tests
        run: |
          cd frontend
          npm run test:unit -- --coverage

      - name: Run integration tests
        run: |
          cd frontend
          npm run test:integration -- --coverage

      - name: Check coverage threshold
        run: |
          cd frontend
          npm run test:coverage -- --fail-under=80

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/coverage-final.json
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: studyin_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.13
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: Start backend server
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/studyin_test
        run: |
          cd backend
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5

      - name: Start frontend dev server
        run: |
          cd frontend
          npm run dev &
          sleep 10

      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.13
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run performance tests
        run: |
          cd backend
          pytest tests/performance -v --benchmark-only

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: backend/performance-report.html
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: backend-unit-tests
        name: Backend Unit Tests
        entry: bash -c 'cd backend && pytest tests/unit -x'
        language: system
        pass_filenames: false
        always_run: true

      - id: frontend-unit-tests
        name: Frontend Unit Tests
        entry: bash -c 'cd frontend && npm run test:unit -- --run'
        language: system
        pass_filenames: false
        always_run: true

      - id: pytest-coverage
        name: Check Backend Coverage
        entry: bash -c 'cd backend && pytest --cov=app --cov-fail-under=80 --cov-report=term-missing'
        language: system
        pass_filenames: false
        stages: [push]
```

---

## Specific Test Cases to Implement First

### 1. WebSocket Chat Integration Test

**File:** `backend/tests/integration/test_websocket_chat.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.mark.integration
def test_websocket_chat_full_conversation(client, mock_rag_service, mock_codex_llm):
    """Test full WebSocket conversation flow with RAG and LLM integration."""
    with client.websocket_connect("/api/chat/ws") as websocket:
        # 1. Receive welcome message
        welcome = websocket.receive_json()
        assert welcome["type"] == "info"
        assert "Connected" in welcome["message"]

        # 2. Send user message
        websocket.send_json({
            "type": "user_message",
            "content": "Explain the cardiac cycle",
            "user_level": 3,
            "profile": "studyin_study"
        })

        # 3. Verify RAG context sent
        context_msg = websocket.receive_json()
        assert context_msg["type"] == "context"
        assert len(context_msg["chunks"]) > 0

        # 4. Verify streaming tokens
        tokens = []
        while True:
            msg = websocket.receive_json()
            if msg["type"] == "token":
                tokens.append(msg["value"])
            elif msg["type"] == "complete":
                final_response = msg["message"]
                break

        # 5. Assertions
        assert len(tokens) > 0
        assert final_response
        assert "".join(tokens) == final_response


@pytest.mark.integration
def test_websocket_reconnection_handling(client):
    """Test WebSocket graceful disconnect and reconnection."""
    # First connection
    with client.websocket_connect("/api/chat/ws") as websocket:
        websocket.receive_json()  # welcome
        websocket.send_json({
            "type": "user_message",
            "content": "Test question",
            "user_level": 2
        })
        # Close connection mid-conversation
        websocket.close()

    # Reconnect
    with client.websocket_connect("/api/chat/ws") as websocket:
        welcome = websocket.receive_json()
        assert welcome["type"] == "info"
        # Should handle new session gracefully


@pytest.mark.integration
def test_websocket_invalid_origin_rejected(client):
    """Test WebSocket origin validation."""
    with pytest.raises(Exception):  # Connection should be rejected
        client.websocket_connect(
            "/api/chat/ws",
            headers={"origin": "https://evil.com"}
        )


@pytest.mark.integration
def test_websocket_concurrent_users(client):
    """Test multiple concurrent WebSocket connections."""
    connections = []
    try:
        # Create 5 concurrent connections
        for i in range(5):
            ws = client.websocket_connect("/api/chat/ws")
            connections.append(ws)
            ws.receive_json()  # welcome message

        # Send messages from all connections
        for i, ws in enumerate(connections):
            ws.send_json({
                "type": "user_message",
                "content": f"Question {i}",
                "user_level": 3
            })

        # All should receive responses
        for ws in connections:
            response = ws.receive_json()
            assert response["type"] in ["context", "token", "complete"]

    finally:
        for ws in connections:
            ws.close()
```

---

### 2. RAG Service Unit Tests

**File:** `backend/tests/unit/test_rag_service.py`

```python
import pytest
import uuid
from unittest.mock import AsyncMock, Mock, patch
from app.services.rag_service import RagService, RagContextChunk


@pytest.fixture
def mock_embedding_service():
    """Mock embedding service with predefined search results."""
    mock_service = Mock()
    mock_service.search_similar = Mock(return_value=[
        {
            "id": "chunk-1",
            "score": 0.95,
            "distance": 0.05,
            "metadata": {"filename": "cardiac_physiology.pdf"}
        },
        {
            "id": "chunk-2",
            "score": 0.88,
            "distance": 0.12,
            "metadata": {"filename": "cardiac_physiology.pdf"}
        }
    ])
    return mock_service


@pytest.fixture
def mock_db_session():
    """Mock database session with sample chunks."""
    session = AsyncMock()

    # Mock database query results
    mock_chunk_1 = Mock()
    mock_chunk_1.id = uuid.uuid4()
    mock_chunk_1.content = "The cardiac cycle consists of systole and diastole..."
    mock_chunk_1.chunk_index = 0

    mock_material_1 = Mock()
    mock_material_1.id = uuid.uuid4()
    mock_material_1.filename = "cardiac_physiology.pdf"
    mock_material_1.user_id = uuid.uuid4()

    mock_chunk_1.material = mock_material_1

    session.execute = AsyncMock(return_value=Mock(all=Mock(return_value=[
        (mock_chunk_1, mock_material_1)
    ])))

    return session


@pytest.mark.asyncio
async def test_retrieve_context_success(mock_embedding_service, mock_db_session):
    """Test successful context retrieval with valid query."""
    with patch('app.services.rag_service.get_embedding_service', return_value=mock_embedding_service):
        rag_service = RagService()

        user_id = uuid.uuid4()
        query = "What is the cardiac cycle?"

        chunks = await rag_service.retrieve_context(
            session=mock_db_session,
            user_id=user_id,
            query=query,
            top_k=2
        )

        assert len(chunks) > 0
        assert isinstance(chunks[0], RagContextChunk)
        assert chunks[0].filename == "cardiac_physiology.pdf"
        assert chunks[0].content

        # Verify embedding service was called
        mock_embedding_service.search_similar.assert_called_once_with(query, 6)  # top_k * 3


@pytest.mark.asyncio
async def test_retrieve_context_empty_results(mock_embedding_service, mock_db_session):
    """Test handling of no matching chunks."""
    mock_embedding_service.search_similar = Mock(return_value=[])

    with patch('app.services.rag_service.get_embedding_service', return_value=mock_embedding_service):
        rag_service = RagService()

        chunks = await rag_service.retrieve_context(
            session=mock_db_session,
            user_id=uuid.uuid4(),
            query="Non-existent topic",
            top_k=4
        )

        assert len(chunks) == 0


@pytest.mark.asyncio
async def test_retrieve_context_user_ownership_validation(mock_embedding_service, mock_db_session):
    """Test that only user's own chunks are returned."""
    with patch('app.services.rag_service.get_embedding_service', return_value=mock_embedding_service):
        rag_service = RagService()

        user_id = uuid.uuid4()

        chunks = await rag_service.retrieve_context(
            session=mock_db_session,
            user_id=user_id,
            query="Test query",
            top_k=2
        )

        # Verify database query included user_id filter
        # (Check session.execute call args)
        call_args = mock_db_session.execute.call_args
        # Should contain WHERE clause with user_id


def test_render_context_summary():
    """Test context summary formatting."""
    chunks = [
        RagContextChunk(
            chunk_id="1",
            content="First chunk content with medical information about the heart.",
            filename="cardio.pdf",
            chunk_index=0,
            distance=0.1,
            metadata={}
        ),
        RagContextChunk(
            chunk_id="2",
            content="Second chunk about cardiac cycle phases.",
            filename="cardio.pdf",
            chunk_index=1,
            distance=0.15,
            metadata={}
        )
    ]

    summary = RagService.render_context_summary(chunks)

    assert "[Source 1]" in summary
    assert "[Source 2]" in summary
    assert "cardio.pdf" in summary
    assert "First chunk content" in summary
    assert "Second chunk" in summary


def test_render_context_summary_empty():
    """Test context summary with no chunks."""
    summary = RagService.render_context_summary([])

    assert "No relevant study materials" in summary
```

---

### 3. Frontend AI Coach Component Tests

**File:** `frontend/tests/unit/AICoach.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AICoach } from '@/components/AICoach';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('AICoach Component', () => {
  test('renders chat interface with input', () => {
    render(<AICoach />);

    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('sends message and displays streaming response', async () => {
    const user = userEvent.setup();

    // Mock WebSocket
    const mockWebSocket = new WebSocket('ws://test');
    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    render(<AICoach />);

    const input = screen.getByPlaceholderText(/ask a question/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type message
    await user.type(input, 'Explain the cardiac cycle');
    await user.click(sendButton);

    // Verify user message displayed
    expect(screen.getByText('Explain the cardiac cycle')).toBeInTheDocument();

    // Simulate streaming response
    mockWebSocket.onmessage?.({ data: JSON.stringify({ type: 'token', value: 'The cardiac ' }) } as MessageEvent);
    mockWebSocket.onmessage?.({ data: JSON.stringify({ type: 'token', value: 'cycle consists of ' }) } as MessageEvent);
    mockWebSocket.onmessage?.({ data: JSON.stringify({ type: 'complete', message: 'The cardiac cycle consists of systole and diastole.' }) } as MessageEvent);

    // Verify streaming updates
    await waitFor(() => {
      expect(screen.getByText(/The cardiac cycle consists of systole and diastole/i)).toBeInTheDocument();
    });
  });

  test('displays context sources when provided', async () => {
    const mockWebSocket = new WebSocket('ws://test');
    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    render(<AICoach />);

    // Simulate context message
    mockWebSocket.onmessage?.({
      data: JSON.stringify({
        type: 'context',
        chunks: [
          {
            id: '1',
            filename: 'cardiac_physiology.pdf',
            chunk_index: 0,
            content: 'Sample content about the heart...'
          }
        ]
      })
    } as MessageEvent);

    await waitFor(() => {
      expect(screen.getByText(/cardiac_physiology.pdf/i)).toBeInTheDocument();
    });
  });

  test('handles error messages gracefully', async () => {
    const mockWebSocket = new WebSocket('ws://test');
    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    render(<AICoach />);

    // Simulate error
    mockWebSocket.onmessage?.({
      data: JSON.stringify({
        type: 'error',
        message: 'AI tutor is temporarily unavailable'
      })
    } as MessageEvent);

    await waitFor(() => {
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  test('validates empty messages', async () => {
    const user = userEvent.setup();

    render(<AICoach />);

    const sendButton = screen.getByRole('button', { name: /send/i });

    // Try to send empty message
    await user.click(sendButton);

    // Should show validation error
    expect(screen.getByText(/message cannot be empty/i)).toBeInTheDocument();
  });

  test('switches between profiles', async () => {
    const user = userEvent.setup();

    render(<AICoach />);

    // Find profile selector
    const profileSelect = screen.getByLabelText(/profile/i);

    // Change to "Deep" profile
    await user.selectOptions(profileSelect, 'studyin_deep');

    expect(profileSelect).toHaveValue('studyin_deep');
  });

  test('renders markdown in messages', async () => {
    const mockWebSocket = new WebSocket('ws://test');
    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    render(<AICoach />);

    // Simulate markdown response
    mockWebSocket.onmessage?.({
      data: JSON.stringify({
        type: 'complete',
        message: '## Cardiac Cycle\n\n**Systole**: contraction phase\n**Diastole**: relaxation phase'
      })
    } as MessageEvent);

    await waitFor(() => {
      expect(screen.getByText(/Cardiac Cycle/i)).toBeInTheDocument();
      expect(screen.getByText(/Systole/i)).toBeInTheDocument();
      expect(screen.getByText(/Diastole/i)).toBeInTheDocument();
    });
  });
});
```

---

## Test Data Management Strategy

### Backend Test Fixtures

```python
# backend/tests/fixtures/sample_data.py
import uuid
from datetime import datetime
from pathlib import Path

# Sample PDF fixture
SAMPLE_PDF_PATH = Path(__file__).parent / "sample_pdfs" / "cardiac_physiology.pdf"

# Sample chunks
SAMPLE_CHUNKS = [
    {
        "id": uuid.uuid4(),
        "content": "The cardiac cycle consists of two main phases: systole (contraction) and diastole (relaxation).",
        "chunk_index": 0,
        "embedding": [0.1] * 1536  # Sample 1536-dim vector
    },
    {
        "id": uuid.uuid4(),
        "content": "During systole, the ventricles contract and pump blood into the aorta and pulmonary artery.",
        "chunk_index": 1,
        "embedding": [0.2] * 1536
    }
]

# Sample user
SAMPLE_USER = {
    "id": uuid.uuid4(),
    "email": "student@example.com",
    "hashed_password": "$2b$12$...",  # bcrypt hash
    "created_at": datetime.utcnow()
}

# Sample material
SAMPLE_MATERIAL = {
    "id": uuid.uuid4(),
    "user_id": SAMPLE_USER["id"],
    "filename": "cardiac_physiology.pdf",
    "file_path": "/uploads/{user_id}/cardiac_physiology.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "status": "ready",
    "created_at": datetime.utcnow()
}
```

### Frontend Test Fixtures

```typescript
// frontend/tests/fixtures/mockData.ts
export const mockMessages = [
  {
    id: '1',
    role: 'user',
    content: 'Explain the cardiac cycle',
    timestamp: new Date('2025-10-12T10:00:00Z')
  },
  {
    id: '2',
    role: 'assistant',
    content: 'The cardiac cycle consists of systole and diastole...',
    timestamp: new Date('2025-10-12T10:00:05Z'),
    sources: [
      {
        id: 'chunk-1',
        filename: 'cardiac_physiology.pdf',
        chunk_index: 0
      }
    ]
  }
];

export const mockMaterials = [
  {
    id: '1',
    filename: 'cardiac_physiology.pdf',
    uploadedAt: '2025-10-12T09:00:00Z',
    status: 'ready',
    fileSize: 1024000
  },
  {
    id: '2',
    filename: 'respiratory_system.pdf',
    uploadedAt: '2025-10-12T09:30:00Z',
    status: 'processing',
    fileSize: 2048000
  }
];

export const mockAnalytics = {
  learningOverview: {
    totalSessions: 42,
    totalDurationHours: 28.5,
    avgSessionDurationMinutes: 40.7,
    materialsViewed: 15,
    materialsCompleted: 8,
    completionRate: 53.3,
    totalXpEarned: 4200,
    currentLevel: 7,
    currentStreak: 12,
    longestStreak: 21,
    achievementsEarned: 8,
    dailyActiveDays: 28
  }
};
```

---

## Coverage Reporting & Quality Gates

### Coverage Thresholds
- **Minimum Overall Coverage:** 80%
- **Critical Paths Coverage:** 95% (auth, RAG, WebSocket)
- **Unit Test Coverage:** 85%
- **Integration Test Coverage:** 75%
- **Branch Coverage:** 70%

### Quality Metrics to Track
1. **Code Coverage:** Lines, branches, functions
2. **Test Execution Time:** < 5 minutes for unit tests
3. **Flakiness Rate:** < 2% of tests should fail intermittently
4. **Test Maintenance Burden:** Tests should not require updates for every minor code change

### Reporting Dashboard
- **Tool:** Codecov or SonarQube
- **Display:** Coverage trends, hotspots, regressions
- **Alerts:** Coverage drops below threshold on PRs
- **Integration:** GitHub PR comments with coverage diff

---

## Test Maintenance Best Practices

### 1. Test Independence
- Each test should be runnable in isolation
- No shared state between tests
- Use fixtures for setup/teardown
- Clean up test data after each test

### 2. Test Naming Convention
```python
# Pattern: test_<function>_<scenario>_<expected_result>
def test_retrieve_context_with_valid_query_returns_chunks():
    pass

def test_retrieve_context_with_no_matches_returns_empty_list():
    pass

def test_retrieve_context_with_invalid_user_id_raises_error():
    pass
```

### 3. Mock External Dependencies
- Mock Codex CLI responses
- Mock ChromaDB for most tests (use real instance for integration)
- Mock file system operations
- Mock network calls

### 4. Test Data Builders
```python
# Pattern: Use builder pattern for complex test data
class UserBuilder:
    def __init__(self):
        self.user = {
            "id": uuid.uuid4(),
            "email": "test@example.com",
            "created_at": datetime.utcnow()
        }

    def with_email(self, email):
        self.user["email"] = email
        return self

    def with_id(self, user_id):
        self.user["id"] = user_id
        return self

    def build(self):
        return self.user

# Usage
user = UserBuilder().with_email("student@studyin.ai").build()
```

---

## Security Testing Strategy

### Critical Security Tests

1. **Authentication & Authorization**
   - ✅ JWT token validation (exists)
   - ✅ CSRF protection (exists)
   - ❌ Session fixation prevention
   - ❌ Brute force protection
   - ❌ Token expiration handling
   - ❌ Multi-factor authentication (if implemented)

2. **Input Validation**
   - ✅ Command injection (Codex CLI - exists)
   - ✅ File upload validation (exists)
   - ❌ SQL injection prevention
   - ❌ XSS prevention in responses
   - ❌ JSON injection in analytics

3. **Data Protection**
   - ❌ Encryption at rest (if implemented)
   - ❌ Encryption in transit (HTTPS enforcement)
   - ❌ User data isolation (multi-tenancy)
   - ❌ PII anonymization in analytics

4. **Rate Limiting**
   - ❌ API endpoint rate limits
   - ❌ WebSocket connection limits
   - ❌ File upload rate limits
   - ❌ LLM request quotas

---

## Performance Testing Strategy

### Load Test Scenarios

**Scenario 1: Normal Load**
- 50 concurrent users
- 100 requests/second
- 30-minute duration
- Target: < 500ms p95 latency

**Scenario 2: Peak Load**
- 200 concurrent users
- 500 requests/second
- 10-minute duration
- Target: < 1000ms p95 latency

**Scenario 3: Stress Test**
- Gradually increase load until failure
- Identify breaking point
- Measure recovery time
- Target: Graceful degradation

### Performance Benchmarks
- **File Upload:** < 2s for 10MB file
- **RAG Query:** < 500ms end-to-end
- **WebSocket Message:** < 100ms latency
- **Analytics Query:** < 1s for 30-day data
- **Embedding Generation:** < 5s for 500-word chunk

---

## Next Steps & Action Items

### Immediate (This Week)
1. ✅ Review this test strategy document
2. Set up pytest coverage reporting (`pytest-cov`)
3. Set up Vitest coverage reporting
4. Implement WebSocket integration test (8 hours)
5. Implement RAG service unit tests (6 hours)

### Short-term (Next 2 Weeks)
6. Implement document processing unit tests
7. Implement AI Coach component tests
8. Set up CI/CD test pipeline (GitHub Actions)
9. Create E2E onboarding test (Playwright)
10. Achieve 50% coverage baseline

### Mid-term (Next Month)
11. Implement full E2E test suite
12. Add performance test suite
13. Achieve 80% coverage target
14. Set up pre-commit hooks for tests
15. Add test coverage badges to README

### Long-term (Next Quarter)
16. Implement contract testing (Pact)
17. Add visual regression testing (Percy/BackstopJS)
18. Set up continuous performance monitoring
19. Implement mutation testing (Mutmut/Stryker)
20. Achieve 90% coverage for critical paths

---

## Conclusion

This comprehensive test strategy provides a roadmap from **17% coverage to 80%+ coverage** with a focus on:

✅ **Critical user journeys** (onboarding, learning sessions, document processing)
✅ **Core functionality** (RAG, WebSocket, analytics, auth)
✅ **Security hardening** (injection prevention, validation, rate limiting)
✅ **Performance validation** (load tests, benchmarks, monitoring)
✅ **Maintainability** (clear patterns, fixtures, CI/CD automation)

**Estimated Total Effort:** ~97 hours (12 working days) to reach 80% coverage

**ROI:**
- Faster bug detection (shift-left testing)
- Confident refactoring (test safety net)
- Reduced production incidents (quality gates)
- Better developer onboarding (tests as documentation)
- Faster feature development (less regression testing)

---

## Appendix: Test Commands Quick Reference

### Backend
```bash
# Run all tests
pytest

# Run unit tests only
pytest tests/unit -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/integration/test_websocket_chat.py -v

# Run tests matching pattern
pytest -k "test_rag" -v

# Run tests with specific marker
pytest -m integration

# Run failed tests from last run
pytest --lf

# Run tests in parallel (requires pytest-xdist)
pytest -n auto
```

### Frontend
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- AICoach.test.tsx

# Update snapshots
npm test -- -u
```

### CI/CD
```bash
# Run full test suite (local)
./run_all_tests.sh

# Run pre-commit checks
pre-commit run --all-files

# Generate coverage report
./generate_coverage_report.sh

# Run performance benchmarks
pytest tests/performance --benchmark-only
```

---

**Document Status:** Living Document
**Last Updated:** 2025-10-12
**Next Review:** 2025-10-19 (after Phase 1 implementation)
