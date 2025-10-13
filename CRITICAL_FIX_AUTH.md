# CRITICAL FIX: Authentication Endpoints

**Status**: 🔴 BLOCKING ALL FEATURES
**Time to Fix**: 5 minutes
**Impact**: Unblocks registration, login, file upload, AI coach

---

## The Problem

FastAPI is treating Pydantic model parameters as **query parameters** instead of **request body**, causing all auth endpoints to return 422 errors.

**Error**:
```json
{
  "detail": [{
    "type": "missing",
    "loc": ["query", "data"],
    "msg": "Field required"
  }]
}
```

---

## The Fix

Add explicit `Body()` annotations to Pydantic models in endpoint signatures.

### File: `/backend/app/api/auth.py`

#### Change 1: Import Body
```python
# At top of file (around line 6)
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Body
#                                                                              ^^^^^ ADD THIS
```

#### Change 2: Fix register endpoint (line 53-57)
**Before**:
```python
async def register(
    data: RegisterRequest,  # ← FastAPI treats as Query
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
```

**After**:
```python
async def register(
    data: RegisterRequest = Body(...),  # ← Explicit Body annotation
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
```

#### Change 3: Fix login endpoint (line 109-113)
**Before**:
```python
async def login(
    credentials: LoginRequest,  # ← FastAPI treats as Query
    response: Response,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
```

**After**:
```python
async def login(
    credentials: LoginRequest = Body(...),  # ← Explicit Body annotation
    response: Response,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
```

---

## Complete Fixed Code

```python
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Body

# ... rest of imports ...

@router.post("/register")
@limiter.limit("5/hour", scope="auth:register")
async def register(
    data: RegisterRequest = Body(...),
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Register a new user."""
    # ... rest of function stays the same ...


@router.post("/login")
@limiter.limit("10/minute", scope="auth:login")
async def login(
    credentials: LoginRequest = Body(...),
    response: Response,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Login user and return access token."""
    # ... rest of function stays the same ...
```

---

## Test After Fix

```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Expected: 200 OK with user data

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Expected: 200 OK with access_token
```

---

## Why This Happened

FastAPI 0.118.3 + Pydantic 2.10.3 changed type inference behavior:
- Pydantic models without explicit location annotation are ambiguous
- FastAPI defaults to Query for safety
- Explicit `Body()` removes ambiguity

---

## Verification Checklist

After applying the fix:

- [ ] Backend server restarts without errors
- [ ] `/api/auth/register` returns 200 for valid registration
- [ ] `/api/auth/login` returns 200 for valid login
- [ ] `/docs` endpoint loads without Pydantic errors
- [ ] OpenAPI JSON generates successfully
- [ ] Integration tests pass

---

## Apply the Fix

```bash
# 1. Edit the file
vim /Users/kyin/Projects/Studyin/backend/app/api/auth.py

# 2. Make the changes above (3 lines changed)

# 3. Save and the backend will auto-reload (uvicorn --reload)

# 4. Test immediately
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"fixtest@example.com","password":"TestPass123!"}'
```

---

## Related Issues

Once this is fixed, you'll likely need to:
1. Update integration tests (they have outdated mocks)
2. Check WebSocket routing (currently 404)
3. Re-enable CSRF protection (currently disabled)

But **this is the blocker** - fix this first.
