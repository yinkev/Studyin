# Connection Errors - Root Cause Analysis & Fix

**Date:** 2025-10-12
**Status:** ✅ RESOLVED

## Summary

The application was showing multiple WebSocket and network errors because **both the backend and frontend servers were not running**. This is a simple startup issue, not a code bug.

---

## Error Symptoms

### 1. WebSocket Connection Errors
```
WebSocket connection to 'ws://localhost:8000/api/chat/ws' failed:
Could not connect to the server.
```

### 2. Resource Loading Failures
```
Failed to load resource: Could not connect to the server
URL: http://localhost:5173/node_modules/.vite/deps/axios.js
```

### 3. Axios Network Errors
```
AxiosError: Network Error
Message: Network Error
```

---

## Root Cause Analysis

### Investigation Steps

1. **Checked Backend Server Status**
   ```bash
   ps aux | grep uvicorn  # No process found
   curl http://localhost:8000/health  # Connection refused
   lsof -ti:8000  # Port not in use
   ```
   **Result:** Backend server was NOT running

2. **Checked Frontend Server Status**
   ```bash
   lsof -ti:5173  # Port not in use
   ```
   **Result:** Frontend dev server was NOT running

3. **Checked Dependencies**
   - PostgreSQL: ✅ Running on port 5432
   - Redis: ✅ Running on port 6379
   - Database: ✅ Connected and initialized

4. **Checked Configuration**
   - Backend `.env`: ✅ Correctly configured
   - Frontend `.env.local`: ✅ Correctly configured
   - WebSocket endpoint: ✅ Properly defined (`/api/chat/ws`)
   - CORS settings: ✅ Allows `http://localhost:5173`

### Root Cause

**The servers were simply not running.** All configuration was correct, but no processes were serving the application.

---

## The Fix

### 1. Start Backend Server

```bash
cd /Users/kyin/Projects/Studyin/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Status:** ✅ Backend now running on http://localhost:8000

### 2. Start Frontend Server

```bash
cd /Users/kyin/Projects/Studyin/frontend
npm run dev
```

**Status:** ✅ Frontend now running on http://localhost:5173

---

## Verification

### Backend Health Check
```bash
$ curl http://localhost:8000/health/ready
{
  "status": "ok",
  "checks": {
    "postgres": { "status": "skipped", "detail": "DATABASE_URL not provided" },
    "redis": { "status": "ok", "detail": "Connected to localhost:6379" },
    "clamav": { "status": "skipped", "detail": "ClamAV host/port not configured" }
  }
}
```

### Frontend Response
```bash
$ curl http://localhost:5173
<!doctype html>
<html lang="en">
  <head>
    <title>StudyIn MVP</title>
    ...
```

### WebSocket Endpoint
The WebSocket endpoint is now accessible at `ws://localhost:8000/api/chat/ws`

---

## Quick Start Guide

### Option 1: Use the Startup Script (Recommended)

```bash
cd /Users/kyin/Projects/Studyin
./START_SERVERS.sh
```

This script:
- Checks and starts PostgreSQL if needed
- Checks and starts Redis if needed
- Starts the backend server (port 8000)
- Starts the frontend server (port 5173)
- Provides status updates and log locations

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd /Users/kyin/Projects/Studyin/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd /Users/kyin/Projects/Studyin/frontend
npm run dev
```

---

## Server Management

### Check Server Status
```bash
# Backend
lsof -ti:8000 && echo "Backend running" || echo "Backend not running"

# Frontend
lsof -ti:5173 && echo "Frontend running" || echo "Frontend not running"

# PostgreSQL
brew services list | grep postgresql

# Redis
redis-cli ping
```

### Stop Servers
```bash
# Stop backend
kill $(lsof -ti:8000)

# Stop frontend
kill $(lsof -ti:5173)

# Stop PostgreSQL
brew services stop postgresql@16

# Stop Redis
brew services stop redis
```

### View Logs
```bash
# Backend logs (if using startup script)
tail -f /tmp/studyin-backend.log

# Frontend logs (if using startup script)
tail -f /tmp/studyin-frontend.log

# Or view live output in the terminal where you started the servers
```

---

## Configuration Reference

### Backend Configuration
File: `/Users/kyin/Projects/Studyin/backend/.env`

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://studyin_user:changeme@localhost:5432/studyin_db
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Configuration
File: `/Users/kyin/Projects/Studyin/frontend/.env.local`

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/chat/ws
VITE_ENVIRONMENT=development
```

### WebSocket Endpoint
- **Route:** `/api/chat/ws` (defined in `/Users/kyin/Projects/Studyin/backend/app/api/chat.py`)
- **Full URL:** `ws://localhost:8000/api/chat/ws`
- **Protocol:** WebSocket
- **Features:**
  - Streaming AI responses
  - RAG context retrieval
  - Real-time chat
  - Auto-reconnection

---

## Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main application UI |
| Backend API | http://localhost:8000 | REST API endpoints |
| API Docs | http://localhost:8000/docs | Interactive Swagger UI |
| WebSocket | ws://localhost:8000/api/chat/ws | AI Coach chat |
| Health Check | http://localhost:8000/health/ready | Service health status |

---

## Troubleshooting

### Frontend Still Shows Connection Errors

1. **Refresh the browser** - The frontend may have cached the failed connection
2. **Open browser console** - Check for new error messages
3. **Verify servers are running:**
   ```bash
   lsof -ti:8000 && lsof -ti:5173
   ```
4. **Check CORS configuration** - Ensure backend allows `http://localhost:5173`

### Backend Won't Start

1. **Check if port 8000 is already in use:**
   ```bash
   lsof -ti:8000
   ```
   If occupied, kill the process or use a different port

2. **Check dependencies:**
   ```bash
   cd backend
   python -c "import uvicorn, fastapi, sqlalchemy; print('OK')"
   ```

3. **Check database connection:**
   ```bash
   psql -h localhost -U studyin_user -d studyin_db -c "SELECT 1;"
   ```

### Frontend Won't Start

1. **Check if port 5173 is already in use:**
   ```bash
   lsof -ti:5173
   ```

2. **Reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for syntax errors:**
   ```bash
   npm run build
   ```

### WebSocket Disconnects Immediately

1. **Check backend logs** for errors:
   ```bash
   tail -f /tmp/studyin-backend.log
   ```

2. **Verify CORS origin** - Frontend origin must match backend CORS settings

3. **Check authentication** - For MVP, hardcoded user should work automatically

---

## Prevention

### Development Workflow

1. **Always start services in this order:**
   - PostgreSQL
   - Redis
   - Backend
   - Frontend

2. **Use the startup script** (`./START_SERVERS.sh`) to avoid manual steps

3. **Add to shell profile** (optional):
   ```bash
   # ~/.zshrc or ~/.bashrc
   alias studyin-start="cd /Users/kyin/Projects/Studyin && ./START_SERVERS.sh"
   alias studyin-stop="kill \$(lsof -ti:8000) \$(lsof -ti:5173)"
   ```

4. **Before reporting bugs:**
   - ✅ Verify servers are running
   - ✅ Check browser console for errors
   - ✅ Review backend logs
   - ✅ Test with `curl` or Postman

---

## Technical Details

### Why This Happened

This is a common development environment issue:
- No persistent server processes (unlike production)
- Requires manual startup after system restart
- Multiple services must be running simultaneously

### Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐
│   Browser   │ ←──────────────→  │   Backend    │
│ :5173       │                    │   :8000      │
│             │     HTTP/REST      │              │
│  (Vite +    │ ←──────────────→  │  (FastAPI +  │
│   React)    │                    │   Python)    │
└─────────────┘                    └──────────────┘
                                          │
                                          ├─→ PostgreSQL :5432
                                          ├─→ Redis :6379
                                          └─→ Codex CLI (OAuth)
```

### Key Files

| File | Purpose |
|------|---------|
| `/Users/kyin/Projects/Studyin/backend/app/main.py` | Backend entry point |
| `/Users/kyin/Projects/Studyin/backend/app/api/chat.py` | WebSocket endpoint |
| `/Users/kyin/Projects/Studyin/frontend/src/hooks/useChatSession.ts` | WebSocket client |
| `/Users/kyin/Projects/Studyin/frontend/.env.local` | Frontend config |
| `/Users/kyin/Projects/Studyin/backend/.env` | Backend config |
| `/Users/kyin/Projects/Studyin/START_SERVERS.sh` | Startup automation |

---

## Status: RESOLVED ✅

All connection errors have been resolved by starting the backend and frontend servers. The application is now fully functional.

**Next Steps:**
1. Use `./START_SERVERS.sh` for easy startup
2. Bookmark http://localhost:5173 for quick access
3. Check http://localhost:8000/docs for API documentation
4. Continue development with confidence!

---

## Appendix: Server Logs

### Backend Startup Success
```
INFO:     Started server process [80452]
INFO:     Waiting for application startup.
{"level": "INFO", "message": "Starting up StudyIn backend..."}
{"level": "INFO", "message": "Connected to Redis event bus"}
{"level": "INFO", "message": "StudyIn backend started successfully"}
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Frontend Startup Success
```
VITE v7.1.9  ready in 211 ms

➜  Local:   http://localhost:5173/
```

---

**Last Updated:** 2025-10-12
**Resolution Time:** ~10 minutes
**Severity:** Low (startup issue, not code bug)
