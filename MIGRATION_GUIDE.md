# Migration Guide: New Module Structure

**Date**: 2025-10-11
**Status**: Ready for Implementation

This guide explains how to migrate from old import patterns to the new refactored module structure.

---

## Quick Reference

### Backend Imports

```python
# ❌ OLD (Before Refactoring)
from app.middleware.csrf import CSRF_COOKIE_NAME
from app.api.deps import HARDCODED_USER_ID
from app.core.jwt import create_access_token
from app.services.codex_llm import _sanitize_prompt, _validate_model_name

# ✅ NEW (After Refactoring)
from app.constants import CSRF_COOKIE_NAME, DEMO_USER_ID
from app.core import create_access_token, sanitize_prompt, validate_model_name
from app.schemas import UserPublic, MessageResponse
```

### Frontend Imports

```typescript
// ❌ OLD (Before Refactoring)
import { useChatSession, ChatMessage } from '@/hooks/useChatSession';
import { apiClient } from '@/lib/api/client';
import { refreshAccessToken } from '@/lib/api/tokenRefresh';

// ✅ NEW (After Refactoring)
import { useChatSession } from '@/hooks';
import { ChatMessage, ConnectionStatus } from '@/types';
import { apiClient, refreshAccessToken } from '@/lib/api';
import { DEFAULT_WS_URL, PROFILES } from '@/constants';
import { generateId, getCsrfToken } from '@/lib/utils';
```

---

## Backend Migration

### 1. Constants

#### Before:
```python
# Scattered across files
CSRF_COOKIE_NAME = "csrf_token"  # In middleware/csrf.py
REFRESH_COOKIE_NAME = "refresh_token"  # In api/auth.py
MIN_PASSWORD_LENGTH = 8  # In api/auth.py
```

#### After:
```python
from app.constants import (
    CSRF_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    MIN_PASSWORD_LENGTH,
    DEMO_USER_ID,
    DEMO_USER_EMAIL,
    RATE_LIMIT_AUTH_LOGIN,
    WS_MESSAGE_TYPE_TOKEN,
)
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/backend/app/api/auth.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/deps.py`
- `/Users/kyin/Projects/Studyin/backend/app/middleware/csrf.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/chat.py`

### 2. Security Utilities

#### Before:
```python
# In services/codex_llm.py
from app.services.codex_llm import _sanitize_prompt, _validate_model_name, _validate_cli_path
```

#### After:
```python
from app.core import sanitize_prompt, validate_model_name, validate_cli_path
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/backend/app/services/codex_llm.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/auth.py` (password validation)

### 3. Response Schemas

#### Before:
```python
# Inline dict responses
return {
    "message": "User registered successfully",
    "user": {
        "id": str(user.id),
        "email": user.email,
    },
}
```

#### After:
```python
from app.schemas import RegistrationResponse, UserPublic

return RegistrationResponse(
    message="User registered successfully",
    user=UserPublic(id=str(user.id), email=user.email)
)
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/backend/app/api/auth.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/materials.py`
- `/Users/kyin/Projects/Studyin/backend/app/api/analytics.py`

### 4. Barrel Exports

#### Before:
```python
from app.core.jwt import create_access_token
from app.core.password import hash_password
from app.core.rate_limit import limiter
```

#### After:
```python
from app.core import create_access_token, hash_password, limiter
```

**Files to Update**: All files importing from `app.core.*`, `app.models.*`

---

## Frontend Migration

### 1. Constants

#### Before:
```typescript
// Scattered magic values
const MAX_TOKEN_BUFFER = 8000;
const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';
const CSRF_COOKIE_NAME = 'csrf_token';
```

#### After:
```typescript
import {
  MAX_TOKEN_BUFFER,
  DEFAULT_WS_URL,
  COOKIE_NAMES,
  PROFILES,
  USER_LEVELS,
} from '@/constants';

// Usage
const csrfCookie = COOKIE_NAMES.CSRF_TOKEN;
const fastProfile = PROFILES.FAST;
const minLevel = USER_LEVELS.MIN;
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/frontend/src/hooks/useChatSession.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/lib/api/client.ts`
- `/Users/kyin/Projects/Studyin/frontend/src/components/AICoach/MessageDisplay.tsx`

### 2. Types

#### Before:
```typescript
// In hooks/useChatSession.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'queued' | 'sending' | 'sent';
}

export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | ...;
```

#### After:
```typescript
import { ChatMessage, ConnectionStatus, ContextChunk } from '@/types';

// No need to redefine - use shared types!
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/frontend/src/hooks/useChatSession.ts` (remove type definitions)
- `/Users/kyin/Projects/Studyin/frontend/src/components/chat/ChatPanel.tsx`
- `/Users/kyin/Projects/Studyin/frontend/src/components/chat/ContextSidebar.tsx`

### 3. Utilities

#### Before:
```typescript
// In useChatSession.ts
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

// In client.ts
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
```

#### After:
```typescript
import { generateId, getCsrfToken, buildWebSocketUrl } from '@/lib/utils';

// Use shared utilities!
const id = generateId();
const csrf = getCsrfToken();
const wsUrl = buildWebSocketUrl(baseUrl, token);
```

**Files to Update**:
- `/Users/kyin/Projects/Studyin/frontend/src/hooks/useChatSession.ts` (remove utility functions)
- `/Users/kyin/Projects/Studyin/frontend/src/lib/api/client.ts` (remove `getCsrfToken`)

### 4. Barrel Exports

#### Before:
```typescript
import { useChatSession } from '@/hooks/useChatSession';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { XPBar } from '@/components/gamification/XPBar';
import { apiClient } from '@/lib/api/client';
```

#### After:
```typescript
import { useChatSession } from '@/hooks';
import { ChatPanel } from '@/components/chat';
import { XPBar } from '@/components/gamification';
import { apiClient } from '@/lib/api';
```

**Files to Update**: All files importing components, hooks, or API functions

---

## Step-by-Step Migration

### Phase 1: Add New Imports (No Breaking Changes)

1. **Keep old code** but add new imports alongside
2. **Verify** new imports work
3. **Test** functionality

Example:
```python
# In api/auth.py
from app.constants import CSRF_COOKIE_NAME  # ✅ New
# from app.middleware.csrf import CSRF_COOKIE_NAME  # ⚠️ Keep temporarily

# Both work - no breaking change yet
```

### Phase 2: Update Usage

1. **Replace old usages** with new imports
2. **Remove old imports** one at a time
3. **Test after each change**

Example:
```python
# In api/auth.py
from app.constants import CSRF_COOKIE_NAME  # ✅ New only
# from app.middleware.csrf import CSRF_COOKIE_NAME  # ❌ Removed

response.set_cookie(key=CSRF_COOKIE_NAME, ...)  # Works with new import
```

### Phase 3: Clean Up

1. **Remove old definitions** (if they were inline)
2. **Add deprecation comments** (if still used elsewhere)
3. **Update documentation**

---

## File-by-File Migration Checklist

### Backend Priority Files

- [ ] `/Users/kyin/Projects/Studyin/backend/app/api/auth.py`
  - [ ] Import constants from `app.constants`
  - [ ] Use schemas from `app.schemas`
  - [ ] Use security utils from `app.core`

- [ ] `/Users/kyin/Projects/Studyin/backend/app/api/chat.py`
  - [ ] Import WS constants from `app.constants`
  - [ ] Use WebSocket schemas from `app.schemas.api_contract`

- [ ] `/Users/kyin/Projects/Studyin/backend/app/services/codex_llm.py`
  - [ ] Move validation functions to `app.core.security_utils`
  - [ ] Import constants from `app.constants`
  - [ ] Update internal function calls

- [ ] `/Users/kyin/Projects/Studyin/backend/app/middleware/csrf.py`
  - [ ] Import `CSRF_COOKIE_NAME` from `app.constants`

### Frontend Priority Files

- [ ] `/Users/kyin/Projects/Studyin/frontend/src/hooks/useChatSession.ts`
  - [ ] Import constants from `@/constants`
  - [ ] Import types from `@/types`
  - [ ] Import utilities from `@/lib/utils`
  - [ ] Remove inline type definitions
  - [ ] Remove inline utility functions

- [ ] `/Users/kyin/Projects/Studyin/frontend/src/lib/api/client.ts`
  - [ ] Import constants from `@/constants`
  - [ ] Import `getCsrfToken` from `@/lib/utils`
  - [ ] Remove inline `getCsrfToken` function

- [ ] `/Users/kyin/Projects/Studyin/frontend/src/components/chat/ChatPanel.tsx`
  - [ ] Import types from `@/types`
  - [ ] Import constants from `@/constants`

- [ ] `/Users/kyin/Projects/Studyin/frontend/src/pages/Dashboard.tsx`
  - [ ] Update component imports to use barrel exports

---

## Testing Strategy

### Backend Tests

```bash
# Run tests after each migration phase
cd /Users/kyin/Projects/Studyin/backend
pytest -v

# Check type hints
mypy app/

# Check imports
python -m py_compile app/**/*.py
```

### Frontend Tests

```bash
# Run tests after each migration phase
cd /Users/kyin/Projects/Studyin/frontend
npm run test

# Type check
npm run type-check

# Build to verify no import errors
npm run build
```

### Manual Testing

1. **Authentication Flow**
   - Register new user
   - Login
   - Token refresh
   - Logout

2. **Chat/WebSocket**
   - Connect to AI coach
   - Send messages
   - Receive streaming responses
   - Reconnection handling

3. **File Upload**
   - Upload materials
   - View uploaded files

4. **Analytics**
   - View dashboard
   - Check XP/levels
   - Verify streak counter

---

## Rollback Plan

If issues arise during migration:

1. **Git Reset**: Each phase is a separate commit
   ```bash
   git log --oneline
   git revert <commit-hash>
   ```

2. **Keep Old Code**: Old definitions remain until fully migrated
   ```python
   # Still works during migration
   from app.middleware.csrf import CSRF_COOKIE_NAME  # Old way
   from app.constants import CSRF_COOKIE_NAME  # New way
   ```

3. **Feature Flags**: Use constants for gradual rollout
   ```python
   from app.constants import FEATURES

   if FEATURES.get('USE_NEW_STRUCTURE', False):
       # New code path
   else:
       # Old code path (fallback)
   ```

---

## Common Issues & Solutions

### Issue: Import Circular Dependency

**Symptom**: `ImportError: cannot import name 'X' from partially initialized module`

**Solution**: Move shared types to separate module, avoid cross-imports
```python
# ❌ Bad
# models/user.py imports from api/auth.py
# api/auth.py imports from models/user.py

# ✅ Good
# Both import from app.schemas.common
```

### Issue: Type Checking Fails

**Symptom**: `mypy` or TypeScript shows errors after migration

**Solution**: Update type imports, ensure `__all__` in `__init__.py`
```python
# In __init__.py
__all__ = ['UserPublic', 'MessageResponse']  # Explicitly export
```

### Issue: Runtime Import Errors

**Symptom**: Code runs locally but fails in production

**Solution**: Check for missing `__init__.py` files, verify relative imports
```bash
# Ensure all directories have __init__.py
find backend/app -type d -exec touch {}/__init__.py \;
```

---

## Benefits Achieved

After migration, you'll have:

✅ **30%+ shorter imports**
```python
# Before: 45 characters
from app.middleware.csrf import CSRF_COOKIE_NAME

# After: 31 characters
from app.constants import CSRF_COOKIE_NAME
```

✅ **Single source of truth** for constants

✅ **Better IDE autocomplete** with barrel exports

✅ **Consistent type safety** across frontend/backend

✅ **Easier to find** where values are defined

✅ **Reduced duplication** (DRY principle)

---

## Next Steps

1. ✅ **Review this guide**
2. 🔄 **Start with backend constants** (low risk)
3. 🔄 **Migrate frontend constants**
4. 🔄 **Update barrel exports**
5. 🔄 **Test thoroughly**
6. ✅ **Update documentation**

---

**Questions or Issues?** Check `REFACTORING_PLAN.md` for detailed context.
