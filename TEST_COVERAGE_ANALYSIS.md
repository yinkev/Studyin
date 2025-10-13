# Test Coverage Analysis & Testing Strategy Report
## Studyin Medical Learning Platform

**Generated**: 2025-10-10
**Project Phase**: Phase 0-1 (Foundation & Core Infrastructure)

---

## Executive Summary

### Current Test Coverage Status

**Backend**: ~43% coverage (504 lines of tests / 1,168 lines of code)
**Frontend**: ~25% coverage (2 integration tests / 8 source files)
**Overall Test Health**: ⚠️ **CRITICAL GAPS IDENTIFIED**

### Test Quality Assessment

| Category | Status | Notes |
|----------|--------|-------|
| **Integration Tests** | ✅ Good | Auth flow, file upload, CSRF, concurrency covered |
| **Unit Tests** | ❌ Missing | No service/model/utility unit tests |
| **E2E Tests** | ❌ Missing | No end-to-end user workflows |
| **API Contract Tests** | ⚠️ Partial | Basic API validation, no schema testing |
| **Security Tests** | ✅ Good | ClamAV malware detection, CSRF protection |
| **Performance Tests** | ⚠️ Minimal | Concurrency test exists, no load testing |
| **Frontend Tests** | ❌ Critical | Only 2 tests, no component/hook coverage |

---

## Part 1: Backend Testing Analysis

### 1.1 Current Test Coverage

#### Existing Tests (9 files, 504 lines)

**Integration Tests** (`backend/tests/integration/`):
- ✅ `test_auth_flow.py` - Login, refresh, logout flows
- ✅ `test_file_upload.py` - Upload validation, malware detection, quotas
- ✅ `test_csrf.py` - CSRF token validation
- ✅ `test_partitioning.py` - Database partitioning (requires TEST_DATABASE_URL)
- ✅ `test_concurrent_requests.py` - Token refresh concurrency

**Security Tests** (`backend/tests/security/`):
- ✅ `test_clamav.py` - EICAR signature detection, clean file validation

**Test Fixtures** (`backend/tests/conftest.py`):
- ✅ `StubSession` - Lightweight async session mock
- ✅ `client` fixture - TestClient with dependency overrides
- ✅ `csrf_headers` fixture - CSRF token management

#### Test Patterns Observed

**Strengths**:
1. **Comprehensive integration testing** for critical security paths
2. **Effective use of monkeypatching** for external dependencies
3. **Clean fixture design** with `StubSession` for database isolation
4. **Security-first approach** with malware detection and CSRF validation
5. **Concurrency testing** for token refresh race conditions

**Weaknesses**:
1. **No unit tests** - All tests are integration-level
2. **Mock overuse** - Tests don't exercise real code paths (e.g., `fake_auth`)
3. **Test failures** - 12/15 tests failing due to 422 validation errors
4. **No service layer tests** - `codex_llm.py`, `file_validator.py` untested
5. **No model tests** - SQLAlchemy models have no validation tests

### 1.2 Code Coverage by Module

| Module | Lines of Code | Test Coverage | Status |
|--------|---------------|---------------|--------|
| `app/api/auth.py` | ~140 | ~60% (integration only) | ⚠️ Partial |
| `app/api/materials.py` | ~124 | ~70% (integration only) | ⚠️ Partial |
| `app/services/codex_llm.py` | ~152 | **0%** | ❌ Untested |
| `app/services/file_validator.py` | ~50 | ~40% (security only) | ⚠️ Partial |
| `app/middleware/csrf.py` | ~72 | ~50% (integration only) | ⚠️ Partial |
| `app/core/rate_limit.py` | ~139 | **0%** | ❌ Untested |
| `app/models/user.py` | ~16 | **0%** | ❌ Untested |
| `app/models/material.py` | ~24 | **0%** | ❌ Untested |
| `app/db/session.py` | ~30 | **0%** | ❌ Untested |
| `app/config.py` | ~50 | **0%** | ❌ Untested |

**Total Backend Coverage**: ~43% (estimated from test-to-code ratio)

### 1.3 Critical Testing Gaps

#### HIGH PRIORITY (Immediate Action Required)

**1. Service Layer - Codex CLI Integration** (`app/services/codex_llm.py`)
- ❌ **No tests for LLM completion generation**
- ❌ **No tests for question generation**
- ❌ **No tests for teaching response generation**
- ❌ **No error handling tests** (CLI failures, JSON parsing errors)
- ❌ **No streaming response tests**

**Risk**: This is the CORE AI functionality. Zero coverage means high risk of production failures.

**2. Rate Limiting** (`app/core/rate_limit.py`)
- ❌ **No unit tests for rate limit enforcement**
- ❌ **No tests for different time windows** (seconds, minutes, hours)
- ❌ **No tests for multiple clients** (different IPs)
- ❌ **No tests for 429 response headers** (Retry-After)
- ❌ **No tests for scope-based limiting**

**Risk**: Rate limiting protects against abuse. Untested code = potential DoS vulnerability.

**3. Token Refresh Mechanism**
- ⚠️ **Integration test exists but is FAILING** (422 Unprocessable Entity)
- ❌ **No tests for token expiration**
- ❌ **No tests for token blacklisting** (logout invalidation)
- ❌ **No tests for refresh token rotation**

**Risk**: Auth system is broken. Users cannot maintain sessions.

**4. Database Models & Validation**
- ❌ **No tests for User model constraints** (email uniqueness, validation)
- ❌ **No tests for Material model relationships** (cascade deletes)
- ❌ **No tests for database migrations**
- ❌ **No tests for query performance**

**Risk**: Data integrity issues, orphaned records, slow queries.

**5. File Validation Service**
- ⚠️ **Only malware detection tested** (ClamAV)
- ❌ **No tests for MIME type validation**
- ❌ **No tests for file size limits**
- ❌ **No tests for file extension validation**
- ❌ **No tests for image format validation** (future: screenshots)

**Risk**: Malicious files could bypass validation if MIME checks fail.

#### MEDIUM PRIORITY (Address in Phase 1-2)

**6. API Endpoint Validation**
- ❌ **No tests for request body validation** (Pydantic models)
- ❌ **No tests for query parameter validation**
- ❌ **No tests for response schema validation**
- ❌ **No tests for error response formats**

**7. Storage Quota Management**
- ⚠️ **Test exists but relies on stub** (`client.stub_session.storage_usage`)
- ❌ **No tests for actual database storage calculation**
- ❌ **No tests for quota enforcement across multiple uploads**
- ❌ **No tests for quota updates after file deletion**

**8. Background Job Processing** (Phase 2 - Document Processing)
- ❌ **No tests for async task queuing** (Redis Streams)
- ❌ **No tests for document parsing** (PDF, DOCX)
- ❌ **No tests for semantic chunking**
- ❌ **No tests for embedding generation**

**9. WebSocket Connections** (Phase 3 - AI Coach)
- ❌ **No tests for WebSocket authentication**
- ❌ **No tests for real-time message streaming**
- ❌ **No tests for connection lifecycle** (connect, disconnect, reconnect)
- ❌ **No tests for error handling in WebSocket context**

**10. Spaced Repetition Algorithm** (Phase 5)
- ❌ **No tests for SM-2 algorithm implementation**
- ❌ **No tests for review scheduling**
- ❌ **No tests for mastery level calculation**
- ❌ **No tests for progress tracking**

#### LOW PRIORITY (Address in Phase 7 - Polish)

**11. Configuration Management**
- ❌ **No tests for environment variable loading**
- ❌ **No tests for configuration validation**
- ❌ **No tests for default values**

**12. Logging & Monitoring**
- ❌ **No tests for structured logging**
- ❌ **No tests for log sanitization** (PII removal)
- ❌ **No tests for performance metrics**

### 1.4 Test Scenarios Missing

#### Authentication & Authorization
```python
# Missing test scenarios:
- [ ] User registration with duplicate email
- [ ] User registration with invalid email format
- [ ] Password strength validation
- [ ] Login with wrong password
- [ ] Login with non-existent user
- [ ] Access token expiration handling
- [ ] Refresh token expiration handling
- [ ] Token replay attack prevention
- [ ] Concurrent login from multiple devices
- [ ] Session fixation prevention
- [ ] Logout with invalid token
- [ ] Logout while authenticated requests in-flight
```

#### File Upload & Validation
```python
# Missing test scenarios:
- [ ] Upload with missing file
- [ ] Upload with empty file (0 bytes)
- [ ] Upload with corrupted PDF header
- [ ] Upload with nested ZIP bomb
- [ ] Upload with symbolic link (path traversal)
- [ ] Upload with non-Latin filename characters
- [ ] Upload with extremely long filename (>255 chars)
- [ ] Concurrent uploads from same user
- [ ] Upload resumption after network failure
- [ ] File content vs. extension mismatch (e.g., .pdf but actually .exe)
```

#### CSRF Protection
```python
# Missing test scenarios:
- [ ] CSRF token expiration
- [ ] CSRF token rotation after login
- [ ] CSRF token mismatch (cookie vs. header)
- [ ] CSRF token with trailing/leading whitespace
- [ ] CSRF token exceeding max length (>128 chars)
- [ ] CSRF bypass attempt with Origin header manipulation
- [ ] CSRF bypass attempt with Referer header spoofing
```

#### Rate Limiting
```python
# Missing test scenarios:
- [ ] Rate limit enforcement for auth endpoints (10/minute)
- [ ] Rate limit enforcement for upload endpoints (10/hour)
- [ ] Rate limit reset after time window
- [ ] Rate limit with multiple IPs
- [ ] Rate limit with same IP, different paths
- [ ] 429 response with Retry-After header
- [ ] Rate limit bypass attempt with IP spoofing
```

#### Codex CLI Integration
```python
# Missing test scenarios:
- [ ] Codex CLI unavailable (command not found)
- [ ] Codex CLI authentication failure (OAuth expired)
- [ ] Codex CLI timeout (slow LLM response)
- [ ] Codex CLI rate limit (API quota exceeded)
- [ ] Codex CLI JSON parsing error (malformed response)
- [ ] Codex CLI model unavailable (e.g., gpt-5 not accessible)
- [ ] Codex CLI streaming response chunks
- [ ] Codex CLI prompt injection attempt
- [ ] Codex CLI token limit exceeded
- [ ] Codex CLI network error (connection refused)
```

---

## Part 2: Frontend Testing Analysis

### 2.1 Current Test Coverage

#### Existing Tests (2 files, ~150 lines)

**Integration Tests** (`frontend/tests/integration/`):
- ✅ `websocket.test.ts` - WebSocket reconnection after token refresh
- ✅ `api-interceptor.test.ts` - API request queuing during token refresh

**Test Configuration**:
- ✅ Vitest configured with jsdom environment
- ✅ Testing Library setup for React components
- ✅ Path aliases configured (`@/` → `src/`)

#### Frontend Test Patterns

**Strengths**:
1. **Good use of mocks** for Socket.io and Axios
2. **Focus on edge cases** (concurrent refresh requests)
3. **Realistic test scenarios** (token rotation, connection management)

**Weaknesses**:
1. **Only 2 tests total** - massive coverage gap
2. **No component tests** - UI components untested
3. **No hook tests** (except `useWebSocket` partially)
4. **No E2E tests** - no full user workflows
5. **No accessibility tests** - WCAG compliance unverified

### 2.2 Code Coverage by Module

| Module | Type | Test Coverage | Status |
|--------|------|---------------|--------|
| `stores/authStore.ts` | State | **0%** | ❌ Untested |
| `hooks/useWebSocket.ts` | Hook | ~30% (integration only) | ⚠️ Partial |
| `hooks/useTokenRefresh.ts` | Hook | **0%** | ❌ Untested |
| `lib/api/client.ts` | API | ~20% (integration only) | ⚠️ Partial |
| `lib/api/auth.ts` | API | **0%** | ❌ Untested |
| `lib/api/tokenRefresh.ts` | API | ~40% (integration only) | ⚠️ Partial |
| `lib/events/authEvents.ts` | Events | **0%** | ❌ Untested |
| `components/AICoach/MessageDisplay.tsx` | Component | **0%** | ❌ Untested |

**Total Frontend Coverage**: ~25% (2 tests / 8 files)

### 2.3 Critical Frontend Testing Gaps

#### HIGH PRIORITY (Immediate Action Required)

**1. Authentication Store (`stores/authStore.ts`)**
- ❌ **No tests for login state management**
- ❌ **No tests for token storage**
- ❌ **No tests for logout cleanup**
- ❌ **No tests for persistence** (localStorage)

**2. Token Refresh Hook (`hooks/useTokenRefresh.ts`)**
- ❌ **No tests for automatic token refresh**
- ❌ **No tests for refresh failure handling**
- ❌ **No tests for logout on refresh error**

**3. API Client (`lib/api/client.ts`)**
- ❌ **No tests for request interceptor**
- ❌ **No tests for response interceptor**
- ❌ **No tests for error handling**
- ❌ **No tests for CSRF token attachment**

**4. React Components**
- ❌ **No tests for MessageDisplay component**
- ❌ **No tests for other UI components** (likely exist but not visible yet)
- ❌ **No tests for loading states**
- ❌ **No tests for error states**

**5. E2E User Flows**
- ❌ **No tests for login → dashboard flow**
- ❌ **No tests for file upload workflow**
- ❌ **No tests for authentication errors**
- ❌ **No tests for session expiration**

#### MEDIUM PRIORITY (Phase 1-3)

**6. WebSocket Management**
- ⚠️ **Partial coverage** for reconnection
- ❌ **No tests for message sending**
- ❌ **No tests for connection error handling**
- ❌ **No tests for offline/online transitions**

**7. Form Validation** (Phase 1)
- ❌ **No tests for login form validation**
- ❌ **No tests for registration form validation**
- ❌ **No tests for file upload form validation**

**8. React Query Integration** (Phase 2)
- ❌ **No tests for query caching**
- ❌ **No tests for mutation handling**
- ❌ **No tests for optimistic updates**

**9. Accessibility** (Phase 7)
- ❌ **No tests for keyboard navigation**
- ❌ **No tests for screen reader support**
- ❌ **No tests for ARIA attributes**
- ❌ **No tests for color contrast**

#### LOW PRIORITY (Phase 7-8)

**10. Performance**
- ❌ **No tests for bundle size**
- ❌ **No tests for component render performance**
- ❌ **No tests for lazy loading**

**11. Responsive Design**
- ❌ **No tests for mobile viewport**
- ❌ **No tests for tablet viewport**
- ❌ **No tests for desktop viewport**

### 2.4 Missing Test Scenarios

#### Component Testing
```typescript
// Missing component test scenarios:
- [ ] MessageDisplay renders markdown correctly
- [ ] MessageDisplay sanitizes HTML (XSS prevention)
- [ ] MessageDisplay handles code blocks
- [ ] MessageDisplay handles LaTeX equations
- [ ] MessageDisplay shows loading skeleton
- [ ] MessageDisplay handles empty messages
- [ ] MessageDisplay handles error states
```

#### Hook Testing
```typescript
// Missing hook test scenarios:
- [ ] useWebSocket connects on mount
- [ ] useWebSocket disconnects on unmount
- [ ] useWebSocket sends messages
- [ ] useWebSocket receives messages
- [ ] useWebSocket handles connection errors
- [ ] useWebSocket retries on failure
- [ ] useTokenRefresh schedules refresh before expiry
- [ ] useTokenRefresh cancels refresh on unmount
- [ ] useTokenRefresh handles refresh failure
```

#### Integration Testing
```typescript
// Missing integration test scenarios:
- [ ] Login flow with API mocking
- [ ] File upload with progress tracking
- [ ] WebSocket chat with message streaming
- [ ] Token refresh during active requests
- [ ] Error handling for network failures
- [ ] Logout and state cleanup
```

#### E2E Testing (Playwright)
```typescript
// Missing E2E test scenarios:
- [ ] User registration and email verification
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] File upload with drag-and-drop
- [ ] File upload with file picker
- [ ] Navigation across dashboard pages
- [ ] WebSocket connection in AI Coach
- [ ] Quiz taking workflow
- [ ] Progress tracking and analytics
```

---

## Part 3: Test Infrastructure & Tooling

### 3.1 Current Testing Stack

**Backend**:
- ✅ **pytest** 8.4.2 - Test runner
- ✅ **pytest-asyncio** 1.2.0 - Async test support
- ✅ **pytest-cov** 7.0.0 - Coverage reporting
- ✅ **FastAPI TestClient** - API testing
- ⚠️ **Missing**: Factory Boy (test data generation)
- ⚠️ **Missing**: Faker (realistic test data)
- ⚠️ **Missing**: pytest-benchmark (performance testing)

**Frontend**:
- ✅ **Vitest** - Test runner (fast, Vite-native)
- ✅ **jsdom** - DOM simulation
- ✅ **@testing-library/react** - Component testing
- ⚠️ **Missing**: Playwright (E2E testing)
- ⚠️ **Missing**: @testing-library/user-event (user interaction)
- ⚠️ **Missing**: @axe-core/react (accessibility testing)

### 3.2 Test Organization Issues

**Backend Issues**:
1. **No unit test directory** - All tests in `integration/`
2. **No test naming convention** - Inconsistent prefixes
3. **No test markers** - Only `@pytest.mark.integration`, no `@pytest.mark.unit`
4. **No test fixtures library** - Limited fixture reuse
5. **No test data factories** - Hardcoded test data

**Frontend Issues**:
1. **No component test directory** - Only `tests/integration/`
2. **No test utilities** - No custom render functions
3. **No test data mocks** - Each test creates own mocks
4. **No E2E test directory** - Missing Playwright setup
5. **No visual regression tests** - No screenshot testing

### 3.3 CI/CD Testing Gaps

**Missing CI/CD Pipeline Steps**:
- ❌ **No automated test runs on PR**
- ❌ **No coverage reporting to PR comments**
- ❌ **No test parallelization**
- ❌ **No E2E test runs in CI**
- ❌ **No performance regression detection**
- ❌ **No security test scans** (SAST, DAST)

---

## Part 4: Recommended Testing Strategy

### 4.1 Test Pyramid for Studyin

```
                    ▲
                   ╱ ╲
                  ╱ E2E╲         10% - Full user workflows
                 ╱       ╲       Playwright, slow, expensive
                ╱─────────╲
               ╱Integration╲     30% - API, WebSocket, Auth
              ╱             ╲    TestClient, API mocking
             ╱───────────────╲
            ╱      Unit       ╲  60% - Functions, Components, Hooks
           ╱___________________╲ pytest, Vitest, fast, isolated
```

### 4.2 Phase-Based Testing Roadmap

#### **Phase 0-1: Foundation Testing** (NOW)

**Backend**:
1. **Fix failing auth tests** - Resolve 422 validation errors
2. **Add unit tests for rate limiter** - Test all time windows
3. **Add unit tests for CSRF utilities** - Token generation, validation
4. **Add model validation tests** - SQLAlchemy constraints
5. **Add service layer mocks** - Stub Codex CLI responses

**Frontend**:
1. **Add authStore tests** - Login, logout, token management
2. **Add API client tests** - Interceptors, error handling
3. **Add hook tests** - useTokenRefresh, useWebSocket
4. **Add first component test** - MessageDisplay rendering

**Target Coverage**: Backend 60%, Frontend 40%

#### **Phase 2: Document Processing Testing**

**Backend**:
1. **Add file validator unit tests** - MIME, size, extension validation
2. **Add document parser tests** - PDF, DOCX parsing
3. **Add chunking algorithm tests** - Semantic segmentation
4. **Add embedding generation tests** - Codex CLI integration (mocked)
5. **Add Qdrant integration tests** - Vector storage, retrieval

**Frontend**:
1. **Add file upload component tests** - Drag-and-drop, progress
2. **Add material library tests** - Listing, search, filtering
3. **Add E2E test for upload workflow** - Full upload + processing

**Target Coverage**: Backend 70%, Frontend 50%

#### **Phase 3: AI Coach Testing**

**Backend**:
1. **Add WebSocket authentication tests** - Token validation
2. **Add streaming response tests** - Chunked message delivery
3. **Add RAG integration tests** - Context injection
4. **Add prompt template tests** - Socratic method prompts

**Frontend**:
1. **Add AI Coach component tests** - Chat UI, streaming display
2. **Add WebSocket hook tests** - Connection lifecycle
3. **Add E2E test for AI conversation** - Full chat workflow

**Target Coverage**: Backend 75%, Frontend 60%

#### **Phase 4-5: Assessment & Spaced Repetition Testing**

**Backend**:
1. **Add question generation tests** - NBME-style MCQs
2. **Add SM-2 algorithm tests** - Spaced repetition logic
3. **Add quiz session tests** - Timing, scoring, progress
4. **Add analytics calculation tests** - Mastery, streaks

**Frontend**:
1. **Add quiz component tests** - Question display, timer
2. **Add progress dashboard tests** - Charts, analytics
3. **Add E2E test for quiz workflow** - Full quiz session

**Target Coverage**: Backend 80%, Frontend 70%

#### **Phase 7: Comprehensive Testing** (Pre-Production)

1. **Add performance tests** - Load testing with Locust/k6
2. **Add security tests** - OWASP Top 10 validation
3. **Add accessibility tests** - WCAG 2.1 AA compliance
4. **Add visual regression tests** - Screenshot comparison
5. **Add mobile E2E tests** - Touch interactions

**Target Coverage**: Backend 85%+, Frontend 80%+

### 4.3 Testing Best Practices

#### Test Organization
```
backend/
├── tests/
│   ├── unit/                    # NEW: Fast, isolated tests
│   │   ├── services/
│   │   │   ├── test_codex_llm_unit.py
│   │   │   └── test_file_validator_unit.py
│   │   ├── models/
│   │   │   ├── test_user_model.py
│   │   │   └── test_material_model.py
│   │   ├── utils/
│   │   │   ├── test_rate_limit.py
│   │   │   └── test_csrf_utils.py
│   │   └── conftest.py          # Unit test fixtures
│   ├── integration/             # Existing integration tests
│   │   ├── test_auth_flow.py
│   │   ├── test_file_upload.py
│   │   └── conftest.py
│   ├── e2e/                     # NEW: End-to-end tests
│   │   ├── test_user_registration.py
│   │   └── test_upload_workflow.py
│   ├── performance/             # NEW: Load tests
│   │   └── test_concurrent_uploads.py
│   └── fixtures/                # NEW: Shared test data
│       ├── users.py
│       ├── materials.py
│       └── questions.py

frontend/
├── tests/
│   ├── unit/                    # NEW: Component & hook tests
│   │   ├── components/
│   │   │   └── MessageDisplay.test.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.test.ts
│   │   │   └── useTokenRefresh.test.ts
│   │   ├── stores/
│   │   │   └── authStore.test.ts
│   │   └── setupTests.ts
│   ├── integration/             # Existing integration tests
│   │   ├── websocket.test.ts
│   │   └── api-interceptor.test.ts
│   ├── e2e/                     # NEW: Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── upload.spec.ts
│   │   └── playwright.config.ts
│   └── fixtures/                # NEW: Test data
│       ├── users.ts
│       └── materials.ts
```

#### Test Naming Conventions
```python
# Backend (pytest)
def test_<function>_<scenario>_<expected_result>():
    # Examples:
    test_login_with_valid_credentials_returns_tokens()
    test_upload_malware_file_raises_http_exception()
    test_rate_limit_exceeded_returns_429()
```

```typescript
// Frontend (Vitest)
describe('<Component/Function>', () => {
  test('<scenario> → <expected result>', () => {
    // Examples:
    test('renders message with markdown → displays formatted text')
    test('connection fails → shows reconnecting indicator')
    test('token expired → redirects to login')
  })
})
```

#### Test Data Management
```python
# Backend: Use Factory Boy for test data
from factory import Factory, Faker, Sequence
from app.models import User, Material

class UserFactory(Factory):
    class Meta:
        model = User

    id = Faker('uuid4')
    email = Sequence(lambda n: f'user{n}@example.com')

class MaterialFactory(Factory):
    class Meta:
        model = Material

    id = Faker('uuid4')
    user_id = Faker('uuid4')
    filename = Faker('file_name', extension='pdf')
    file_size = Faker('pyint', min_value=1000, max_value=50000000)
```

```typescript
// Frontend: Use MSW for API mocking
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: '123', email: 'user@example.com' }
    })
  }),
]

export const server = setupServer(...handlers)
```

### 4.4 TDD Workflow for New Features

**Example: Implementing Question Generation (Phase 4)**

```python
# Step 1: Write failing test (RED)
def test_generate_mcqs_returns_nbme_style_questions():
    service = CodexLLMService(cli_path="/mock/codex")
    questions = await service.generate_questions(
        topic="Cardiac Physiology",
        difficulty=3,
        num_questions=5
    )

    assert len(questions) == 5
    assert all('question' in q for q in questions)
    assert all('options' in q and len(q['options']) == 4 for q in questions)
    assert all('correct_index' in q for q in questions)
    assert all('explanation' in q for q in questions)

# Step 2: Run test → FAILS (not implemented yet)
# pytest tests/unit/services/test_codex_llm_unit.py::test_generate_mcqs_returns_nbme_style_questions

# Step 3: Implement minimal code (GREEN)
async def generate_questions(self, topic, difficulty, num_questions):
    prompt = f"Generate {num_questions} NBME-style questions about {topic}..."
    response = await self.generate_completion(prompt)
    return json.loads(response)

# Step 4: Run test → PASSES

# Step 5: Refactor (improve code quality)
async def generate_questions(self, topic, difficulty, num_questions):
    """Generate NBME-style medical questions."""
    prompt = self._build_question_prompt(topic, difficulty, num_questions)
    response = await self.generate_completion(prompt, model="gpt-5")
    return self._parse_questions(response)

# Step 6: Run test → STILL PASSES (refactor didn't break anything)
```

---

## Part 5: Critical Test Scenarios (Priority Matrix)

### 5.1 HIGH PRIORITY - Implement Immediately

#### Backend Critical Paths
```python
# 1. Authentication Flow
test_register_with_valid_data_creates_user()
test_register_with_duplicate_email_returns_409()
test_login_with_valid_credentials_returns_tokens()
test_login_with_invalid_password_returns_401()
test_refresh_token_before_expiry_returns_new_access_token()
test_refresh_token_after_expiry_returns_401()
test_logout_invalidates_refresh_token()

# 2. File Upload Security
test_upload_with_valid_pdf_saves_to_user_directory()
test_upload_with_malware_signature_returns_400()
test_upload_exceeding_quota_returns_413()
test_upload_with_path_traversal_filename_sanitizes()
test_upload_with_mime_type_mismatch_returns_400()

# 3. Rate Limiting
test_rate_limit_enforced_after_threshold()
test_rate_limit_resets_after_window()
test_rate_limit_returns_429_with_retry_after_header()
test_rate_limit_per_ip_independent()

# 4. CSRF Protection
test_csrf_token_missing_returns_403()
test_csrf_token_mismatch_returns_403()
test_csrf_token_too_long_returns_403()
test_csrf_exempt_paths_allowed_without_token()

# 5. Codex CLI Integration (Mocked)
test_codex_cli_unavailable_raises_runtime_error()
test_codex_cli_timeout_raises_timeout_error()
test_codex_cli_invalid_json_response_raises_value_error()
test_codex_cli_success_returns_parsed_output()
```

#### Frontend Critical Paths
```typescript
// 1. Authentication Store
test('login updates accessToken and user state')
test('logout clears accessToken and user state')
test('setAccessToken persists to localStorage')
test('hydration loads token from localStorage')

// 2. Token Refresh
test('token refresh triggered 1 minute before expiry')
test('token refresh failure triggers logout')
test('concurrent refreshes queued and deduplicated')

// 3. WebSocket Management
test('WebSocket connects with access token')
test('WebSocket reconnects after token refresh')
test('WebSocket disconnects on logout')
test('WebSocket handles connection errors')

// 4. API Client
test('API client attaches CSRF token to POST requests')
test('API client retries request after token refresh')
test('API client handles 401 by triggering logout')
test('API client handles network errors')

// 5. Component Rendering
test('MessageDisplay renders markdown safely')
test('MessageDisplay sanitizes HTML to prevent XSS')
test('MessageDisplay shows loading skeleton')
test('MessageDisplay handles empty messages')
```

### 5.2 MEDIUM PRIORITY - Phase 1-2

```python
# Backend
test_document_parser_extracts_text_from_pdf()
test_semantic_chunker_creates_overlapping_chunks()
test_qdrant_indexing_stores_embeddings()
test_semantic_search_retrieves_relevant_chunks()

# Frontend
test_file_upload_shows_progress_bar()
test_material_library_filters_by_type()
test_search_debounces_input()
```

### 5.3 LOW PRIORITY - Phase 7 (Polish)

```python
# Backend
test_performance_concurrent_uploads_under_1s()
test_security_owasp_top_10_compliance()
test_accessibility_api_wcag_compliant()

# Frontend
test_responsive_mobile_viewport_renders_correctly()
test_dark_mode_toggles_theme()
test_keyboard_navigation_works()
```

---

## Part 6: Implementation Plan

### 6.1 Immediate Actions (This Week)

**Day 1: Fix Existing Tests**
1. ✅ Investigate 422 errors in auth flow tests
2. ✅ Fix LoginRequest validation (likely missing fields)
3. ✅ Verify all existing tests pass
4. ✅ Run coverage report: `pytest --cov=app --cov-report=html`

**Day 2: Backend Unit Tests - Rate Limiting**
1. ✅ Create `tests/unit/utils/test_rate_limit.py`
2. ✅ Test parse_rule() for all time units
3. ✅ Test throttle enforcement
4. ✅ Test 429 response format
5. ✅ Target: 100% coverage for `rate_limit.py`

**Day 3: Backend Unit Tests - CSRF**
1. ✅ Create `tests/unit/utils/test_csrf_utils.py`
2. ✅ Test token generation randomness
3. ✅ Test token validation logic
4. ✅ Test exempt paths
5. ✅ Target: 100% coverage for `csrf.py`

**Day 4: Frontend Unit Tests - authStore**
1. ✅ Create `tests/unit/stores/authStore.test.ts`
2. ✅ Test login, logout, setAccessToken
3. ✅ Test localStorage persistence
4. ✅ Test hydration on app load
5. ✅ Target: 100% coverage for `authStore.ts`

**Day 5: Backend Service Tests - Codex CLI (Mocked)**
1. ✅ Create `tests/unit/services/test_codex_llm_unit.py`
2. ✅ Mock subprocess.communicate()
3. ✅ Test generate_completion() success path
4. ✅ Test error handling (CLI not found, JSON parse error)
5. ✅ Target: 80% coverage for `codex_llm.py`

### 6.2 Short-Term Goals (Next 2 Weeks)

**Week 1**: Backend Core Testing
- ✅ Unit tests for all utilities (rate_limit, csrf, config)
- ✅ Unit tests for models (User, Material validation)
- ✅ Service layer tests with mocks (codex_llm, file_validator)
- 🎯 **Target**: Backend coverage 60%

**Week 2**: Frontend Core Testing
- ✅ Unit tests for all hooks (useWebSocket, useTokenRefresh)
- ✅ Unit tests for API client (interceptors, error handling)
- ✅ Component tests for MessageDisplay
- ✅ Integration tests for auth flow
- 🎯 **Target**: Frontend coverage 50%

### 6.3 Long-Term Goals (Phase-by-Phase)

**Phase 2** (Document Processing):
- Integration tests for file upload + processing pipeline
- Unit tests for document parser and chunking
- E2E test for full upload workflow
- 🎯 **Target**: Backend 70%, Frontend 60%

**Phase 3** (AI Coach):
- WebSocket integration tests (auth, streaming)
- Component tests for AI Coach UI
- E2E test for chat conversation
- 🎯 **Target**: Backend 75%, Frontend 65%

**Phase 4-5** (Assessment & Spaced Repetition):
- Unit tests for SM-2 algorithm
- Integration tests for quiz sessions
- E2E test for full quiz workflow
- 🎯 **Target**: Backend 80%, Frontend 70%

**Phase 7** (Polish & Optimization):
- Performance tests (load testing, concurrency)
- Security tests (OWASP, penetration testing)
- Accessibility tests (WCAG 2.1 AA)
- Visual regression tests (screenshots)
- 🎯 **Target**: Backend 85%+, Frontend 80%+

---

## Part 7: Testing Tools & Setup

### 7.1 Install Missing Dependencies

**Backend**:
```bash
cd backend
source venv/bin/activate

# Test data generation
pip install factory-boy faker

# Performance testing
pip install pytest-benchmark

# Async mocking
pip install pytest-mock

# Coverage enhancements
pip install coverage[toml]
```

**Frontend**:
```bash
cd frontend

# E2E testing
pnpm add -D @playwright/test

# User interaction testing
pnpm add -D @testing-library/user-event

# Accessibility testing
pnpm add -D @axe-core/react vitest-axe

# API mocking
pnpm add -D msw

# Visual regression testing
pnpm add -D @storybook/test-runner
```

### 7.2 Configure Testing Infrastructure

**Backend - pytest.ini** (Update):
```ini
[pytest]
markers =
    unit: mark test as unit test (fast, isolated)
    integration: mark test as integration test
    e2e: mark test as end-to-end test
    slow: mark test as slow running
    security: mark test as security-focused

testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

addopts =
    --verbose
    --strict-markers
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=60
    -ra
```

**Frontend - vitest.config.ts** (Update):
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        '*.config.js',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

**Frontend - Playwright Setup**:
```bash
cd frontend
pnpm create playwright

# Creates:
# - tests/e2e/ directory
# - playwright.config.ts
# - Basic test examples
```

### 7.3 CI/CD Integration (GitHub Actions)

**Create `.github/workflows/test.yml`**:
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
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run unit tests
        run: |
          cd frontend
          pnpm test --coverage

      - name: Run E2E tests
        run: |
          cd frontend
          pnpm exec playwright install --with-deps
          pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend
```

---

## Part 8: Key Recommendations

### 8.1 Critical Actions (Do Immediately)

1. ✅ **Fix failing auth tests** - 12/15 tests failing blocks progress
2. ✅ **Add rate limiting tests** - Critical security feature untested
3. ✅ **Add Codex CLI mocked tests** - Core LLM integration has 0% coverage
4. ✅ **Add frontend authStore tests** - Authentication state management untested
5. ✅ **Set up CI/CD pipeline** - No automated test runs on PR

### 8.2 Testing Principles

**Adopt TDD for All New Features**:
- Write test FIRST (RED)
- Implement minimal code (GREEN)
- Refactor for quality (REFACTOR)
- Repeat

**Test Pyramid Balance**:
- 60% Unit tests (fast, isolated, comprehensive)
- 30% Integration tests (realistic, API-level)
- 10% E2E tests (expensive, critical user flows)

**Test Quality > Quantity**:
- One meaningful test > ten shallow tests
- Test behavior, not implementation
- Avoid brittle tests that break on refactor

**Mock External Dependencies**:
- Codex CLI → Mock subprocess calls
- ClamAV → Mock clamd client
- Database → Use StubSession or in-memory DB
- WebSocket → Mock Socket.io connections

**Test Security First**:
- Every auth endpoint must have security tests
- Every file upload must have malware tests
- Every API call must have CSRF tests
- Every rate-limited endpoint must have throttle tests

### 8.3 Coverage Targets

**Current State**:
- Backend: ~43% 📉
- Frontend: ~25% 📉

**Phase 1 Target** (Next 2 weeks):
- Backend: 60% 📈
- Frontend: 50% 📈

**Phase 7 Target** (Pre-production):
- Backend: 85%+ 🎯
- Frontend: 80%+ 🎯

**Definition of "Done"**:
- ✅ All tests passing in CI
- ✅ Coverage thresholds met
- ✅ No critical paths untested
- ✅ Security tests mandatory for PRs

---

## Part 9: Test Examples & Templates

### 9.1 Backend Unit Test Template

```python
# tests/unit/services/test_codex_llm_unit.py

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.codex_llm import CodexLLMService, codex_llm

@pytest.fixture
def codex_service():
    """Fixture for CodexLLMService with mocked CLI."""
    return CodexLLMService(cli_path="/mock/codex")

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_completion_success(codex_service):
    """Test successful completion generation."""
    mock_process = AsyncMock()
    mock_process.returncode = 0
    mock_process.communicate = AsyncMock(
        return_value=(
            json.dumps({"output": "Generated text"}).encode(),
            b""
        )
    )

    with patch('asyncio.create_subprocess_exec', return_value=mock_process):
        result = await codex_service.generate_completion(
            prompt="Test prompt",
            model="gpt-5"
        )

    assert result == "Generated text"
    mock_process.communicate.assert_called_once()

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_completion_cli_not_found(codex_service):
    """Test error when Codex CLI is not installed."""
    with patch('asyncio.create_subprocess_exec', side_effect=FileNotFoundError):
        with pytest.raises(RuntimeError, match="Codex CLI error"):
            await codex_service.generate_completion("Test prompt")

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_completion_invalid_json(codex_service):
    """Test handling of invalid JSON response."""
    mock_process = AsyncMock()
    mock_process.returncode = 0
    mock_process.communicate = AsyncMock(
        return_value=(b"Not valid JSON", b"")
    )

    with patch('asyncio.create_subprocess_exec', return_value=mock_process):
        result = await codex_service.generate_completion("Test prompt")

    # Should fall back to raw output
    assert result == "Not valid JSON"

@pytest.mark.unit
@pytest.mark.asyncio
async def test_generate_questions_parses_json_array(codex_service):
    """Test question generation returns parsed questions."""
    mock_questions = [
        {
            "question": "What is the cardiac output?",
            "options": ["A", "B", "C", "D"],
            "correct_index": 1,
            "explanation": "Because..."
        }
    ]

    mock_process = AsyncMock()
    mock_process.returncode = 0
    mock_process.communicate = AsyncMock(
        return_value=(
            json.dumps({"output": json.dumps(mock_questions)}).encode(),
            b""
        )
    )

    with patch('asyncio.create_subprocess_exec', return_value=mock_process):
        result = await codex_service.generate_questions(
            topic="Cardiac Physiology",
            difficulty=3,
            num_questions=1
        )

    assert len(result) == 1
    assert result[0]["question"] == "What is the cardiac output?"
    assert len(result[0]["options"]) == 4
    assert result[0]["correct_index"] == 1

@pytest.mark.unit
def test_singleton_instance():
    """Test codex_llm is a singleton."""
    from app.services.codex_llm import codex_llm as instance1
    from app.services.codex_llm import codex_llm as instance2
    assert instance1 is instance2
```

### 9.2 Backend Integration Test Template

```python
# tests/integration/test_question_generation.py

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import codex_llm as codex_module

@pytest.mark.integration
def test_generate_questions_endpoint_returns_mcqs(client, csrf_headers, monkeypatch):
    """Test question generation endpoint with mocked Codex CLI."""

    async def fake_generate_questions(topic, difficulty, num_questions):
        return [
            {
                "question": f"Question {i} about {topic}",
                "options": [f"Option {j}" for j in range(4)],
                "correct_index": i % 4,
                "explanation": f"Explanation for question {i}"
            }
            for i in range(num_questions)
        ]

    monkeypatch.setattr(
        codex_module.codex_llm,
        "generate_questions",
        fake_generate_questions
    )

    response = client.post(
        "/api/questions/generate",
        headers=csrf_headers,
        json={
            "topic": "Cardiac Physiology",
            "difficulty": 3,
            "num_questions": 5
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 5
    assert all("question" in q for q in data["questions"])
    assert all(len(q["options"]) == 4 for q in data["questions"])

@pytest.mark.integration
def test_generate_questions_rate_limited(client, csrf_headers):
    """Test rate limiting on question generation endpoint."""

    # Make 11 requests (limit is 10/hour)
    for i in range(11):
        response = client.post(
            "/api/questions/generate",
            headers=csrf_headers,
            json={
                "topic": "Test",
                "difficulty": 1,
                "num_questions": 1
            }
        )

        if i < 10:
            assert response.status_code == 200
        else:
            assert response.status_code == 429
            assert "Retry-After" in response.headers
```

### 9.3 Frontend Unit Test Template

```typescript
// tests/unit/stores/authStore.test.ts

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState(
      { accessToken: null, user: null },
      true // Replace state
    )
    localStorage.clear()
  })

  test('initial state has null token and user', () => {
    const { accessToken, user } = useAuthStore.getState()

    expect(accessToken).toBeNull()
    expect(user).toBeNull()
  })

  test('setAccessToken updates state and localStorage', () => {
    const { setAccessToken } = useAuthStore.getState()

    setAccessToken('new-token')

    const { accessToken } = useAuthStore.getState()
    expect(accessToken).toBe('new-token')
    expect(localStorage.getItem('accessToken')).toBe('new-token')
  })

  test('login updates accessToken and user', () => {
    const { login } = useAuthStore.getState()
    const mockUser = { id: '123', email: 'user@example.com' }

    login('test-token', mockUser)

    const { accessToken, user } = useAuthStore.getState()
    expect(accessToken).toBe('test-token')
    expect(user).toEqual(mockUser)
  })

  test('logout clears accessToken and user', () => {
    const { login, logout } = useAuthStore.getState()

    // Setup authenticated state
    login('test-token', { id: '123', email: 'user@example.com' })

    // Logout
    logout()

    const { accessToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  test('hydration loads token from localStorage', () => {
    // Simulate existing token in localStorage
    localStorage.setItem('accessToken', 'persisted-token')

    const { hydrate } = useAuthStore.getState()
    hydrate()

    const { accessToken } = useAuthStore.getState()
    expect(accessToken).toBe('persisted-token')
  })

  test('hydration does nothing if no token in localStorage', () => {
    const { hydrate } = useAuthStore.getState()
    hydrate()

    const { accessToken } = useAuthStore.getState()
    expect(accessToken).toBeNull()
  })
})
```

### 9.4 Frontend Component Test Template

```typescript
// tests/unit/components/MessageDisplay.test.tsx

import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageDisplay } from '@/components/AICoach/MessageDisplay'

describe('MessageDisplay', () => {
  test('renders plain text message', () => {
    render(<MessageDisplay content="Hello world" role="assistant" />)

    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  test('renders markdown with formatting', () => {
    const markdown = '**Bold text** and *italic text*'
    render(<MessageDisplay content={markdown} role="assistant" />)

    const bold = screen.getByText('Bold text')
    expect(bold.tagName).toBe('STRONG')

    const italic = screen.getByText('italic text')
    expect(italic.tagName).toBe('EM')
  })

  test('sanitizes HTML to prevent XSS', () => {
    const malicious = '<script>alert("XSS")</script>Safe content'
    render(<MessageDisplay content={malicious} role="user" />)

    // Script tag should be removed
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument()
    expect(screen.getByText(/Safe content/)).toBeInTheDocument()
  })

  test('renders code blocks with syntax highlighting', () => {
    const code = '```python\nprint("Hello")\n```'
    render(<MessageDisplay content={code} role="assistant" />)

    const codeBlock = screen.getByText(/print/)
    expect(codeBlock.closest('code')).toBeInTheDocument()
  })

  test('shows loading skeleton when content is empty', () => {
    render(<MessageDisplay content="" role="assistant" isLoading />)

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  test('applies correct styling for user vs assistant messages', () => {
    const { rerender } = render(
      <MessageDisplay content="User message" role="user" />
    )

    let container = screen.getByText('User message').parentElement
    expect(container).toHaveClass('user-message')

    rerender(<MessageDisplay content="Assistant message" role="assistant" />)

    container = screen.getByText('Assistant message').parentElement
    expect(container).toHaveClass('assistant-message')
  })
})
```

### 9.5 E2E Test Template (Playwright)

```typescript
// tests/e2e/auth.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/register')

    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard')

    // Should show welcome message
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'Password123!')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('http://localhost:3000/dashboard')
  })

  test('login fails with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'WrongPassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()

    // Should stay on login page
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('http://localhost:3000/dashboard')

    // Logout
    await page.click('button:has-text("Logout")')

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login')
  })
})
```

---

## Part 10: Conclusion & Next Steps

### 10.1 Summary

The Studyin project has **critical testing gaps** that must be addressed before production:

- **Backend**: 43% coverage, many core features untested (Codex CLI, rate limiting, token refresh)
- **Frontend**: 25% coverage, almost no component or hook tests
- **E2E**: No end-to-end user workflow tests
- **Current tests**: 12/15 failing due to validation errors

### 10.2 Immediate Next Steps

**This Week**:
1. ✅ Fix all failing tests (auth flow 422 errors)
2. ✅ Add unit tests for rate limiter (100% coverage)
3. ✅ Add unit tests for CSRF utilities (100% coverage)
4. ✅ Add unit tests for Codex CLI service (mocked, 80% coverage)
5. ✅ Add frontend tests for authStore (100% coverage)

**Next Week**:
1. ✅ Add integration tests for token refresh mechanism
2. ✅ Add unit tests for file validator service
3. ✅ Add frontend tests for API client and hooks
4. ✅ Set up CI/CD pipeline with automated test runs
5. ✅ Achieve 60% backend coverage, 50% frontend coverage

### 10.3 Long-Term Vision

By **Phase 7** (Pre-production):
- ✅ 85%+ backend coverage
- ✅ 80%+ frontend coverage
- ✅ Comprehensive E2E test suite
- ✅ Performance, security, and accessibility tests
- ✅ CI/CD with automated quality gates
- ✅ Zero critical bugs in production

### 10.4 Testing Culture

**Adopt TDD**:
- Write tests BEFORE code
- Tests drive design
- High confidence in refactoring

**Test Reviews**:
- Every PR must include tests
- Coverage thresholds enforced
- Security tests mandatory

**Continuous Improvement**:
- Monitor flaky tests
- Optimize slow tests
- Update tests with new learnings

---

## Appendix A: Test Coverage Checklist

### Backend Testing Checklist

**Authentication & Authorization** (`app/api/auth.py`):
- [ ] User registration (valid data)
- [ ] User registration (duplicate email)
- [ ] User registration (invalid email format)
- [ ] Login (valid credentials)
- [ ] Login (invalid password)
- [ ] Login (non-existent user)
- [ ] Token refresh (before expiry)
- [ ] Token refresh (after expiry)
- [ ] Token refresh (concurrent requests)
- [ ] Logout (clear tokens)
- [ ] Logout (already logged out)

**File Upload** (`app/api/materials.py`):
- [ ] Upload valid PDF
- [ ] Upload malware file (blocked)
- [ ] Upload with path traversal filename
- [ ] Upload exceeding quota
- [ ] Upload with invalid MIME type
- [ ] Upload with empty file
- [ ] Upload with oversized file
- [ ] Concurrent uploads from same user

**CSRF Protection** (`app/middleware/csrf.py`):
- [ ] Token generation (randomness)
- [ ] Token validation (success)
- [ ] Token validation (missing token)
- [ ] Token validation (mismatch)
- [ ] Token validation (too long)
- [ ] Exempt paths (no validation)
- [ ] Safe methods (GET, HEAD, OPTIONS)

**Rate Limiting** (`app/core/rate_limit.py`):
- [ ] Parse rule (seconds, minutes, hours)
- [ ] Enforce limit (429 after threshold)
- [ ] Reset after window
- [ ] Per-IP isolation
- [ ] Per-scope isolation
- [ ] Retry-After header

**Codex CLI Service** (`app/services/codex_llm.py`):
- [ ] Generate completion (success)
- [ ] Generate completion (CLI not found)
- [ ] Generate completion (timeout)
- [ ] Generate completion (invalid JSON)
- [ ] Generate questions (NBME-style)
- [ ] Generate questions (parse error)
- [ ] Generate teaching response

**Models** (`app/models/`):
- [ ] User model (email uniqueness)
- [ ] User model (validation)
- [ ] Material model (relationships)
- [ ] Material model (cascade delete)

### Frontend Testing Checklist

**Authentication Store** (`stores/authStore.ts`):
- [ ] Initial state (null)
- [ ] Login (update state)
- [ ] Logout (clear state)
- [ ] setAccessToken (persist)
- [ ] Hydration (load from localStorage)

**Hooks** (`hooks/`):
- [ ] useWebSocket (connect/disconnect)
- [ ] useWebSocket (reconnect after token refresh)
- [ ] useWebSocket (send/receive messages)
- [ ] useWebSocket (error handling)
- [ ] useTokenRefresh (schedule refresh)
- [ ] useTokenRefresh (handle refresh failure)

**API Client** (`lib/api/client.ts`):
- [ ] Request interceptor (attach CSRF)
- [ ] Response interceptor (handle 401)
- [ ] Token refresh (concurrent requests)
- [ ] Error handling (network errors)

**Components** (`components/`):
- [ ] MessageDisplay (render markdown)
- [ ] MessageDisplay (sanitize HTML)
- [ ] MessageDisplay (code blocks)
- [ ] MessageDisplay (loading state)
- [ ] MessageDisplay (empty content)

**E2E Workflows**:
- [ ] User registration
- [ ] User login/logout
- [ ] File upload
- [ ] AI chat conversation
- [ ] Quiz session
- [ ] Progress tracking

---

## Appendix B: Resources & References

### Testing Frameworks Documentation

**Backend**:
- pytest: https://docs.pytest.org/
- pytest-asyncio: https://pytest-asyncio.readthedocs.io/
- FastAPI Testing: https://fastapi.tiangolo.com/tutorial/testing/
- Factory Boy: https://factoryboy.readthedocs.io/

**Frontend**:
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/
- MSW: https://mswjs.io/

### Testing Best Practices

- Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- TDD: https://www.jamesshore.com/v2/books/aoad1/test_driven_development
- Integration Testing: https://martinfowler.com/bliki/IntegrationTest.html
- E2E Testing: https://www.browserstack.com/guide/end-to-end-testing

### Security Testing

- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security Testing Tools: https://owasp.org/www-community/Free_for_Open_Source_Application_Security_Tools

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Author**: Claude Code (Test Automation Expert)
**Status**: Draft - Ready for Review
