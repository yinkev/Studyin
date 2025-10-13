# WebSocket Connection Fix

**Date:** 2025-10-12
**Status:** ✅ Fixed

---

## Problem

WebSocket connections were failing because the frontend was trying to connect to the wrong port:

```
❌ Attempted: ws://localhost:5173/api/chat/ws (Vite dev server)
✅ Correct:   ws://localhost:8000/api/chat/ws (FastAPI backend)
```

**Browser Console Error:**
```
WebSocket connection to 'ws://localhost:5173/api/chat/ws' failed:
The network connection was lost.
```

---

## Root Cause

### The Issue
The `.env.local` file set `VITE_WS_URL=/api/chat/ws` (a relative path), which caused the browser to construct the WebSocket URL relative to the current page's origin (`http://localhost:5173`).

### Why This Happened
**WebSockets bypass HTTP proxies!**

While Vite's proxy configuration (`vite.config.ts`) successfully forwards regular HTTP requests from `/api/*` to the backend at `http://127.0.0.1:8000`, WebSocket connections are established directly by the browser and **cannot use HTTP-level proxies**.

```typescript
// vite.config.ts - This proxy works for HTTP, NOT WebSockets!
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: false,
    ws: true,  // ⚠️ This doesn't work as expected for WebSocket URLs
  },
}
```

When you create `new WebSocket('ws://localhost:5173/api/chat/ws')`, the browser establishes a WebSocket connection to port 5173 (Vite), not port 8000 (backend).

---

## Solution

### Changes Made

#### 1. Updated `/Users/kyin/Projects/Studyin/frontend/.env.local`

**Before:**
```env
VITE_API_URL=
# Use relative WS path so Vite proxy handles it (works with ws:// and wss://)
VITE_WS_URL=/api/chat/ws
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=
```

**After:**
```env
VITE_API_URL=http://localhost:8000
# WebSocket URL must be absolute - WebSockets bypass Vite's HTTP proxy
VITE_WS_URL=ws://localhost:8000/api/chat/ws
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=
```

**Key Changes:**
- ✅ Set `VITE_API_URL=http://localhost:8000` (for consistency with regular API calls)
- ✅ Changed `VITE_WS_URL` from relative `/api/chat/ws` to absolute `ws://localhost:8000/api/chat/ws`
- ✅ Updated comment to explain why absolute URL is required

#### 2. Updated `/Users/kyin/Projects/Studyin/frontend/.env.local.example`

**Before:**
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws  # ❌ Wrong path
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=
```

**After:**
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/chat/ws  # ✅ Correct path
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=
```

---

## How It Works Now

### Connection Flow

1. **Frontend loads** at `http://localhost:5173`
2. **useChatSession.ts** reads WebSocket URL:
   ```typescript
   // Line 126
   const wsUrl = useMemo(() =>
     options.url ?? import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL,
     [options.url]
   );
   ```
3. **Environment variable is used**: `ws://localhost:8000/api/chat/ws`
4. **Browser creates WebSocket** directly to backend at port 8000
5. **Backend accepts** at `/api/chat/ws` (defined in `backend/app/api/chat.py:76`)

### URL Precedence
```typescript
// Priority order (first defined wins):
1. options.url                      // Explicit override
2. import.meta.env.VITE_WS_URL      // Environment variable ✅ Now correct
3. DEFAULT_WS_URL                   // Fallback: 'ws://localhost:8000/api/chat/ws'
```

---

## Backend Validation

Confirmed the backend WebSocket endpoint matches our configuration:

```python
# backend/app/api/chat.py

router = APIRouter(prefix="/api/chat", tags=["chat"])  # Line 24

@router.websocket("/ws")  # Line 76
async def chat_websocket(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_db),
) -> None:
    """WebSocket endpoint for the AI coaching chat interface."""
    # ... implementation
```

**Full path:** `/api/chat` + `/ws` = `/api/chat/ws` ✅

---

## Testing

### Before the Fix
```bash
# Console shows:
WebSocket connection to 'ws://localhost:5173/api/chat/ws' failed
```

### After the Fix
```bash
# Expected console logs:
[WS] Creating new WebSocket connection { wsUrl: 'ws://localhost:8000/api/chat/ws', nextStatus: 'connecting' }
[WS] onopen fired { reconnecting: false }
Connected to the AI coach. ✅
```

### Manual Testing Steps

1. **Start backend:**
   ```bash
   cd /Users/kyin/Projects/Studyin/backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Start frontend (in new terminal):**
   ```bash
   cd /Users/kyin/Projects/Studyin/frontend
   npm run dev
   ```

3. **Open browser:**
   - Navigate to `http://localhost:5173`
   - Open DevTools (F12) → Console tab
   - Look for WebSocket connection logs

4. **Expected behavior:**
   - ✅ No WebSocket errors
   - ✅ "Connected to the AI coach" toast notification
   - ✅ Status indicator shows "Connected"
   - ✅ Can send messages and receive responses

---

## Production Considerations

### Environment Variables by Environment

#### Development (`.env.local`)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/chat/ws
```

#### Production (e.g., `.env.production`)
```env
VITE_API_URL=https://api.studyin.com
VITE_WS_URL=wss://api.studyin.com/api/chat/ws  # Note: wss:// for secure WebSocket
```

### Key Points for Production

1. **Use `wss://`** (secure WebSocket) in production, not `ws://`
2. **Same domain recommended** for API and WebSocket to avoid CORS issues
3. **Configure CORS origins** in backend to allow your production domain:
   ```python
   # backend/app/config.py
   CORS_ORIGINS: str = "https://studyin.com,https://www.studyin.com"
   ```
4. **WebSocket security** is already implemented in backend (line 88-97 of `chat.py`)

---

## Technical Details

### Why Vite Proxy Doesn't Work for WebSockets

**HTTP Proxy Behavior:**
```
Browser → Vite (5173) → Backend (8000)
          ↑ HTTP proxy intercepts and forwards
```

**WebSocket Behavior:**
```
Browser → Backend (8000)
          ↑ Direct connection, no proxy interception
```

The `ws: true` option in Vite's proxy config only applies to **Vite's own HMR WebSocket**, not to application-level WebSocket connections created with `new WebSocket()`.

### Alternative Approaches Considered

#### ❌ Option 1: Configure Vite WebSocket proxy
**Why not:** Vite's proxy is for HTTP requests, not custom WebSocket connections

#### ❌ Option 2: Use relative path with special handling
**Why not:** Adds unnecessary complexity and doesn't solve the fundamental issue

#### ✅ Option 3: Use absolute WebSocket URL (chosen)
**Why yes:**
- Simple and clear
- Works reliably in all scenarios
- Easy to configure for different environments
- Follows WebSocket best practices

---

## Files Modified

1. **`/Users/kyin/Projects/Studyin/frontend/.env.local`**
   - Changed `VITE_WS_URL` from `/api/chat/ws` to `ws://localhost:8000/api/chat/ws`
   - Added `VITE_API_URL=http://localhost:8000`
   - Updated comment to explain absolute URL requirement

2. **`/Users/kyin/Projects/Studyin/frontend/.env.local.example`**
   - Fixed `VITE_WS_URL` path from `/ws` to `/api/chat/ws`
   - Ensures new developers have correct configuration

---

## Related Files (Reference Only)

- **`frontend/src/hooks/useChatSession.ts`** (line 126) - Reads `VITE_WS_URL`
- **`frontend/vite.config.ts`** (lines 28-32) - HTTP proxy config (not used for WebSockets)
- **`backend/app/api/chat.py`** (line 76) - WebSocket endpoint definition

---

## Lessons Learned

### For Future Development

1. **WebSockets require absolute URLs** in development when frontend and backend are on different ports
2. **Vite's HTTP proxy doesn't apply** to WebSocket connections created with `new WebSocket()`
3. **Always use environment variables** for URLs to support different environments
4. **Document why** certain configurations exist (comments in `.env` files)
5. **Keep `.env.local.example` in sync** with actual `.env.local` structure

---

## Verification Checklist

- [x] Backend WebSocket endpoint is at `/api/chat/ws`
- [x] Frontend WebSocket URL points to backend port (8000)
- [x] Environment variable uses absolute URL
- [x] Example env file updated with correct path
- [x] Comments explain why absolute URL is needed
- [x] Fallback `DEFAULT_WS_URL` is correct
- [x] Production considerations documented

---

## Next Steps

### For Immediate Testing
1. Restart Vite dev server (frontend) to load new `.env.local`
2. Verify WebSocket connection in browser DevTools
3. Test sending/receiving messages in AI Coach

### For Production Deployment
1. Create `.env.production` with `wss://` WebSocket URL
2. Configure backend CORS for production domain
3. Test WebSocket connection in production environment
4. Monitor WebSocket connection metrics

---

**Status:** Ready for testing ✅
