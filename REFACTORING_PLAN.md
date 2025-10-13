# StudyIn Codebase Refactoring Plan

**Status**: In Progress
**Date**: 2025-10-11
**Goal**: Improve maintainability, reduce duplication, and establish better code organization

---

## Executive Summary

This refactoring focuses on **incremental improvements** without breaking existing functionality. The codebase is relatively well-structured, but we can improve:

1. **Magic strings/numbers** → Centralized constants
2. **Duplicate validation logic** → Shared utilities
3. **Import complexity** → Barrel exports
4. **Type definitions** → Shared type contracts
5. **Code organization** → Clear module boundaries

---

## Current State Analysis

### Backend (Python/FastAPI)
- **Total Files**: 36 Python files
- **Key Issues**:
  - Magic strings scattered across files (e.g., cookie names, rate limit scopes)
  - Duplicate validation patterns (session validation, model name validation)
  - Security constants in single file (could be centralized)
  - No barrel exports - requires long import paths
  - Response schemas duplicated across endpoints

### Frontend (TypeScript/React)
- **Total Files**: 34 TypeScript files
- **Key Issues**:
  - WebSocket URL construction duplicated
  - Chat message types defined in hook (should be shared)
  - Token generation logic repeated
  - No barrel exports for component groups
  - Environment variable access scattered

---

## Refactoring Strategy

### Phase 1: Backend Refactoring

#### 1.1 Create Constants Module
**File**: `/Users/kyin/Projects/Studyin/backend/app/constants.py`

```python
# HTTP & Security
HTTP_METHODS_WITH_CSRF = {"POST", "PUT", "PATCH", "DELETE"}

# Authentication
ACCESS_TOKEN_TYPE = "bearer"
REFRESH_COOKIE_NAME = "refresh_token"
CSRF_COOKIE_NAME = "csrf_token"
REFRESH_TOKEN_PATH = "/api/auth/refresh"

# Rate Limiting Scopes
RATE_LIMIT_AUTH_REGISTER = "auth:register"
RATE_LIMIT_AUTH_LOGIN = "auth:login"
RATE_LIMIT_AUTH_REFRESH = "auth:refresh"
RATE_LIMIT_AUTH_LOGOUT = "auth:logout"

# Demo User (MVP)
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_EMAIL = "demo@studyin.app"
DEMO_USER_PASSWORD = "demo-password-not-for-production"

# WebSocket
WS_PATH_PREFIX = "/ws"
WS_CLOSE_CODE_AUTH_ERROR = 4001
WS_CLOSE_CODE_UNAUTHORIZED = 4401
WS_CLOSE_CODE_POLICY_VIOLATION = 1008

# Validation Limits
MIN_PASSWORD_LENGTH = 8
MAX_MODEL_NAME_LENGTH = 100
```

#### 1.2 Create Security Utilities Module
**File**: `/Users/kyin/Projects/Studyin/backend/app/core/security_utils.py`

Consolidate:
- `_sanitize_prompt()` from `codex_llm.py`
- `_validate_model_name()` from `codex_llm.py`
- `_validate_cli_path()` from `codex_llm.py`
- Password validation from `auth.py`

#### 1.3 Create Common Schemas Module
**File**: `/Users/kyin/Projects/Studyin/backend/app/schemas/__init__.py`

```python
from pydantic import BaseModel, EmailStr

class UserPublic(BaseModel):
    id: str
    email: EmailStr

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str
```

#### 1.4 Add Barrel Exports
**Files**:
- `/Users/kyin/Projects/Studyin/backend/app/core/__init__.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/__init__.py`
- `/Users/kyin/Projects/Studyin/backend/app/models/__init__.py`

---

### Phase 2: Frontend Refactoring

#### 2.1 Create Constants Module
**File**: `/Users/kyin/Projects/Studyin/frontend/src/constants/index.ts`

```typescript
// API Configuration
export const DEFAULT_API_TIMEOUT = 30000;
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

// WebSocket Configuration
export const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';
export const MAX_TOKEN_BUFFER = 8000;
export const MAX_RECONNECT_ATTEMPTS = 5;

// Chat Configuration
export const PROFILES = {
  FAST: 'studyin_fast',
  STUDY: 'studyin_study',
  DEEP: 'studyin_deep',
} as const;

// User Levels
export const USER_LEVELS = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
} as const;

// Cookie Names
export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
} as const;

// HTTP Methods requiring CSRF
export const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;
```

#### 2.2 Create Shared Types Module
**File**: `/Users/kyin/Projects/Studyin/frontend/src/types/index.ts`

Extract common types:
- `ChatMessage`, `ChatRole`, `ConnectionStatus` from `useChatSession.ts`
- `ContextChunk` (shared with backend)
- API response types
- Error types

#### 2.3 Create Utilities Module
**File**: `/Users/kyin/Projects/Studyin/frontend/src/lib/utils/index.ts`

Consolidate:
- `generateId()` from `useChatSession.ts`
- `buildWebSocketUrl()` from `useChatSession.ts`
- `getCsrfToken()` from `client.ts`
- Common validation functions

#### 2.4 Add Barrel Exports
**Files**:
- `/Users/kyin/Projects/Studyin/frontend/src/components/chat/index.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/components/analytics/index.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/components/gamification/index.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/lib/api/index.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/hooks/index.ts`

---

### Phase 3: Shared Type Contract

#### 3.1 Create API Contract Types
**Backend**: `/Users/kyin/Projects/Studyin/backend/app/schemas/api_contract.py`
**Frontend**: `/Users/kyin/Projects/Studyin/frontend/src/types/api-contract.ts`

Shared types:
- `ContextChunk` structure
- WebSocket message formats
- Authentication response shapes
- Error response format

**Benefit**: Type safety across the stack, easier to maintain API changes

---

## Migration Strategy

### Safety First Approach
1. ✅ **Add new files** without changing existing code
2. ✅ **Add deprecation comments** to old locations
3. ✅ **Update one module at a time**
4. ✅ **Test after each change**
5. ✅ **Remove deprecated code** only after full migration

### Example Migration Path

**Before**:
```python
# In app/api/auth.py
CSRF_COOKIE_NAME = "csrf_token"  # Scattered definition
```

**Step 1** - Add to constants:
```python
# In app/constants.py
CSRF_COOKIE_NAME = "csrf_token"
```

**Step 2** - Import in original file:
```python
# In app/api/auth.py
from app.constants import CSRF_COOKIE_NAME  # Deprecated: use app.constants

# Old definition kept temporarily
# CSRF_COOKIE_NAME = "csrf_token"  # TODO: Remove after migration
```

**Step 3** - Update all imports:
```python
# In other files
from app.constants import CSRF_COOKIE_NAME  # ✅ New way
```

**Step 4** - Remove old definition after verification

---

## File Structure Changes

### Backend New Structure

```
backend/app/
├── constants.py                    # ✨ NEW: All magic strings/numbers
├── schemas/                        # ✨ NEW: Shared Pydantic models
│   ├── __init__.py                # Barrel exports
│   ├── api_contract.py            # API type contract
│   ├── auth.py                    # Auth request/response schemas
│   └── common.py                  # Common response schemas
├── core/
│   ├── __init__.py                # ✨ ENHANCED: Barrel exports
│   ├── security_utils.py          # ✨ NEW: Consolidated security
│   ├── jwt.py
│   ├── password.py
│   └── rate_limit.py
├── api/
│   ├── __init__.py                # ✨ ENHANCED: Barrel exports
│   ├── auth.py                    # ✅ Updated imports
│   ├── chat.py
│   └── materials.py
└── models/
    ├── __init__.py                # ✨ ENHANCED: Barrel exports
    └── ...
```

### Frontend New Structure

```
frontend/src/
├── constants/
│   ├── index.ts                   # ✨ NEW: All constants
│   ├── api.ts                     # API configuration
│   ├── websocket.ts               # WebSocket configuration
│   └── validation.ts              # Validation constants
├── types/
│   ├── index.ts                   # ✨ NEW: Barrel exports
│   ├── api-contract.ts            # API type contract
│   ├── chat.ts                    # Chat-related types
│   └── common.ts                  # Common types
├── lib/
│   ├── api/
│   │   ├── index.ts               # ✨ ENHANCED: Barrel exports
│   │   ├── client.ts
│   │   └── auth.ts
│   └── utils/
│       ├── index.ts               # ✨ NEW: Barrel exports
│       ├── id-generator.ts        # ✨ NEW: ID generation
│       ├── websocket.ts           # ✨ NEW: WebSocket utils
│       └── validation.ts          # ✨ NEW: Validation helpers
├── hooks/
│   ├── index.ts                   # ✨ ENHANCED: Barrel exports
│   └── ...
└── components/
    ├── chat/
    │   ├── index.ts               # ✨ NEW: Barrel exports
    │   ├── ChatPanel.tsx
    │   └── ContextSidebar.tsx
    ├── analytics/
    │   ├── index.ts               # ✨ NEW: Barrel exports
    │   └── ...
    └── gamification/
        ├── index.ts               # ✨ NEW: Barrel exports
        └── ...
```

---

## Import Improvements

### Before Refactoring

```typescript
// Frontend - Long, coupled imports
import { useChatSession, ChatMessage, ConnectionStatus } from '@/hooks/useChatSession';
import { apiClient } from '@/lib/api/client';
import { refreshAccessToken } from '@/lib/api/tokenRefresh';

// Backend - Long paths
from app.middleware.csrf import CSRF_COOKIE_NAME, ensure_csrf_cookie
from app.core.jwt import create_access_token, create_refresh_token
```

### After Refactoring

```typescript
// Frontend - Clean, organized imports
import { useChatSession } from '@/hooks';
import { ChatMessage, ConnectionStatus } from '@/types';
import { apiClient, refreshAccessToken } from '@/lib/api';
import { CSRF_COOKIE_NAME } from '@/constants';

// Backend - Cleaner paths
from app.constants import CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME
from app.core import create_access_token, create_refresh_token, ensure_csrf_cookie
```

---

## Type Safety Improvements

### Shared API Contract

**Before** - Frontend guesses backend structure:
```typescript
// Frontend doesn't know exact backend structure
interface ContextChunk {
  id: string;
  filename: string;
  chunk_index: number;
  content: string;
  distance?: number | null;  // ❓ Is this optional?
  metadata?: Record<string, unknown>;  // ❓ What shape?
}
```

**After** - Generated from backend schema:
```typescript
// types/api-contract.ts (generated from backend)
export interface ContextChunk {
  id: string;
  filename: string;
  chunk_index: number;
  content: string;
  distance: number | null;  // ✅ Known structure
  metadata: Record<string, any>;  // ✅ Known structure
}
```

---

## Benefits Summary

### Maintainability
- ✅ Single source of truth for constants
- ✅ Easier to find and update configuration
- ✅ Clearer module boundaries

### Code Quality
- ✅ Reduced duplication (DRY principle)
- ✅ Better type safety
- ✅ Easier to test (isolated utilities)

### Developer Experience
- ✅ Shorter, cleaner imports
- ✅ Better IDE autocomplete
- ✅ Easier onboarding for new developers

### Security
- ✅ Centralized security validations
- ✅ Easier to audit security patterns
- ✅ Consistent validation rules

---

## Risk Mitigation

### Testing Strategy
1. ✅ Keep existing tests passing
2. ✅ Add tests for new utility functions
3. ✅ Test one module migration at a time
4. ✅ Use TypeScript/mypy for type checking

### Rollback Plan
- All changes are **additive first**
- Git commits are **atomic per phase**
- Can revert individual phases independently
- **No breaking API changes**

---

## Success Criteria

- [ ] All existing tests pass
- [ ] No runtime errors in development
- [ ] Imports are 30%+ shorter on average
- [ ] Magic strings reduced by 80%+
- [ ] Type coverage improved (mypy/TypeScript strict mode)
- [ ] Code review approval from team

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Backend Constants & Utils | 2 hours | 🔄 In Progress |
| Phase 2: Frontend Constants & Types | 2 hours | ⏳ Pending |
| Phase 3: Barrel Exports | 1 hour | ⏳ Pending |
| Phase 4: Migration & Testing | 3 hours | ⏳ Pending |
| **Total** | **8 hours** | - |

---

## Next Steps

1. **Create backend constants module** ✨
2. **Add security utilities** ✨
3. **Create frontend constants** ✨
4. **Add barrel exports** ✨
5. **Migrate imports incrementally** 🔄
6. **Test and validate** ✅

---

**Note**: This is a **living document**. Update as refactoring progresses and new patterns emerge.
