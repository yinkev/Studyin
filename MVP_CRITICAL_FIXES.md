# MVP Critical Fixes - Implementation Guide

**Created**: 2025-10-09
**Status**: Ready for Implementation
**Total Time**: 12 hours (1.5 developer days)
**Priority**: MUST complete before MVP launch

---

## Table of Contents

1. [🔴 CRITICAL Fix #1: API Interceptor Race Condition](#critical-fix-1-api-interceptor-race-condition) (30 min)
2. [🔴 CRITICAL Fix #2: Database Partitioning](#critical-fix-2-database-partitioning) (2 hrs)
3. [🔴 CRITICAL Fix #3: Backend File Upload Security](#critical-fix-3-backend-file-upload-security) (3 hrs)
4. [⚠️ SHOULD Fix #4: WebSocket Token Refresh](#should-fix-4-websocket-token-refresh) (2 hrs)
5. [⚠️ SHOULD Fix #5: CSRF Token Support](#should-fix-5-csrf-token-support) (1 hr)
6. [⚠️ SHOULD Fix #6: Token Refresh Notifications](#should-fix-6-token-refresh-notifications) (30 min)
7. [⚠️ SHOULD Fix #7: Partition Automation](#should-fix-7-partition-automation) (1 hr)
8. [⚠️ SHOULD Fix #8: XSS Sanitization](#should-fix-8-xss-sanitization) (2 hrs)
9. [✅ Integration Testing](#integration-testing) (1.5 hrs)

---

## 🔴 CRITICAL Fix #1: API Interceptor Race Condition

**File**: `frontend/src/lib/api/client.ts`
**Time**: 30 minutes
**Priority**: CRITICAL - App breaks without this

### Problem
When multiple API calls get 401 simultaneously (e.g., multiple tabs, rapid requests), they all try to refresh the token at once. This breaks token rotation.

### Solution: Add Mutex Pattern

**Location**: FRONTEND_ARCHITECTURE.md line 975

```typescript
// frontend/src/lib/api/client.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// ✅ ADD: Mutex to prevent concurrent refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  withCredentials: true, // ✅ Send HttpOnly cookies
});

// Request interceptor: Add access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 with mutex
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ✅ NEW: Check if already refreshing
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      // ✅ NEW: Set refreshing flag
      isRefreshing = true;

      try {
        // Refresh token (HttpOnly cookie sent automatically)
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;
        useAuthStore.getState().setAccessToken(access_token);

        // ✅ NEW: Notify all queued requests
        isRefreshing = false;
        onRefreshed(access_token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // ✅ NEW: Clear queue on failure
        isRefreshing = false;
        refreshSubscribers = [];

        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Testing

**Test Case 1**: Multiple concurrent requests
```typescript
// Test: Trigger 10 API calls simultaneously
const promises = Array.from({ length: 10 }, (_, i) =>
  apiClient.get('/api/materials')
);

await Promise.all(promises);
// Expected: Only 1 refresh token request, all 10 succeed
```

**Test Case 2**: Multiple tabs
```
1. Open app in 2 browser tabs
2. Wait for token to expire (15 min)
3. Make API call in both tabs simultaneously
4. Expected: Only 1 refresh, both tabs stay logged in
```

### Checklist
- [ ] Add mutex variables (`isRefreshing`, `refreshSubscribers`)
- [ ] Update 401 interceptor with queue logic
- [ ] Add `onRefreshed()` to notify queued requests
- [ ] Test with 10 concurrent API calls
- [ ] Test with multiple browser tabs
- [ ] Verify only 1 refresh token request in Network tab

---

## 🔴 CRITICAL Fix #2: Database Partitioning

**File**: `backend/alembic/versions/002_partition_user_attempts.py`
**Time**: 2 hours
**Priority**: CRITICAL - Future pain if skipped

### Problem
`user_question_attempts` table will grow to millions of rows (every question answered = 1 row). Without partitioning, queries become slow and eventually unusable.

### Solution: Time-Based Partitioning

**Location**: DATABASE_ARCHITECTURE.md line 1467

**Step 1**: Create Migration (30 min)

```bash
# In backend directory
alembic revision -m "Add partitioning to user_question_attempts"
```

**Step 2**: Write Migration (1 hr)

```python
# backend/alembic/versions/002_partition_user_attempts.py

"""Add partitioning to user_question_attempts

Revision ID: 002
Revises: 001
Create Date: 2025-10-09 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create new partitioned table
    op.execute("""
        CREATE TABLE user_question_attempts_new (
            id UUID NOT NULL,
            user_id UUID NOT NULL,
            question_id UUID NOT NULL,
            selected_index INTEGER NOT NULL,
            is_correct BOOLEAN NOT NULL,
            confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 5),
            time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds >= 0),
            attempt_type VARCHAR(50) NOT NULL,
            session_id UUID,
            answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

            PRIMARY KEY (id, answered_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) PARTITION BY RANGE (answered_at);
    """)

    # 2. Create partitions for next 12 months
    partitions = [
        ('2025_10', '2025-10-01', '2025-11-01'),
        ('2025_11', '2025-11-01', '2025-12-01'),
        ('2025_12', '2025-12-01', '2026-01-01'),
        ('2026_01', '2026-01-01', '2026-02-01'),
        ('2026_02', '2026-02-01', '2026-03-01'),
        ('2026_03', '2026-03-01', '2026-04-01'),
        ('2026_04', '2026-04-01', '2026-05-01'),
        ('2026_05', '2026-05-01', '2026-06-01'),
        ('2026_06', '2026-06-01', '2026-07-01'),
        ('2026_07', '2026-07-01', '2026-08-01'),
        ('2026_08', '2026-08-01', '2026-09-01'),
        ('2026_09', '2026-09-01', '2026-10-01'),
    ]

    for suffix, start_date, end_date in partitions:
        op.execute(f"""
            CREATE TABLE user_question_attempts_{suffix}
            PARTITION OF user_question_attempts_new
            FOR VALUES FROM ('{start_date}') TO ('{end_date}');
        """)

        # Create indexes on each partition
        op.execute(f"""
            CREATE INDEX idx_attempts_{suffix}_user_id
            ON user_question_attempts_{suffix}(user_id, answered_at);
        """)

        op.execute(f"""
            CREATE INDEX idx_attempts_{suffix}_question_id
            ON user_question_attempts_{suffix}(question_id);
        """)

        op.execute(f"""
            CREATE INDEX idx_attempts_{suffix}_session_id
            ON user_question_attempts_{suffix}(session_id)
            WHERE session_id IS NOT NULL;
        """)

    # 3. If old table exists with data, migrate it
    # (Skip for fresh installation)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_name = 'user_question_attempts') THEN
                INSERT INTO user_question_attempts_new
                SELECT * FROM user_question_attempts;

                DROP TABLE user_question_attempts;
            END IF;
        END $$;
    """)

    # 4. Rename new table to correct name
    op.execute("""
        ALTER TABLE user_question_attempts_new
        RENAME TO user_question_attempts;
    """)

def downgrade() -> None:
    # Convert back to non-partitioned table
    op.execute("""
        CREATE TABLE user_question_attempts_backup AS
        SELECT * FROM user_question_attempts;
    """)

    op.execute("DROP TABLE user_question_attempts;")

    op.execute("""
        ALTER TABLE user_question_attempts_backup
        RENAME TO user_question_attempts;
    """)
```

**Step 3**: Test Migration (30 min)

```bash
# Run migration
alembic upgrade head

# Test insert
psql studyin_db -c "
INSERT INTO user_question_attempts (id, user_id, question_id, selected_index, is_correct, time_taken_seconds, attempt_type, answered_at)
VALUES (uuid_generate_v4(), 'user-uuid', 'question-uuid', 0, true, 45, 'practice', NOW());
"

# Verify partition
psql studyin_db -c "
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename LIKE 'user_question_attempts%';
"

# Check query performance
psql studyin_db -c "EXPLAIN ANALYZE
SELECT * FROM user_question_attempts
WHERE user_id = 'user-uuid'
AND answered_at >= NOW() - interval '7 days';
"
# Expected: "Partition Pruning" in EXPLAIN output
```

### Checklist
- [ ] Create Alembic migration file
- [ ] Implement partitioned table creation
- [ ] Create 12 monthly partitions
- [ ] Add indexes to each partition
- [ ] Test migration with `alembic upgrade head`
- [ ] Verify partitions exist with `\d+ user_question_attempts`
- [ ] Test insert into partitioned table
- [ ] Verify query uses partition pruning with EXPLAIN ANALYZE

---

## 🔴 CRITICAL Fix #3: Backend File Upload Security

**Files**:
- `backend/app/api/materials.py`
- `backend/app/services/file_validator.py`
- `backend/docker-compose.yml`

**Time**: 3 hours
**Priority**: CRITICAL - Security vulnerability

### Problem
Current implementation only validates file extensions (client-side). Attackers can upload malware disguised as PDFs.

### Solution: Multi-Layer Validation

**Reference**: SECURITY_QUICK_FIXES.md lines 276-459

**Step 1**: Install Dependencies (15 min)

```bash
# backend/requirements.txt
python-magic==0.4.27
python-magic-bin==0.4.14  # For Windows compatibility
clamd==1.0.2
aiofiles==23.2.1

# Install
pip install -r requirements.txt
```

**Step 2**: Add ClamAV to Docker (15 min)

```yaml
# backend/docker-compose.yml

services:
  # ... existing services ...

  clamav:
    image: clamav/clamav:latest
    container_name: studyin_clamav
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav
    healthcheck:
      test: ["CMD", "clamdscan", "--ping", "1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  # ... existing volumes ...
  clamav-data:
```

**Step 3**: Create File Validator Service (1 hr)

```python
# backend/app/services/file_validator.py

import magic
import clamd
from pathlib import Path
from fastapi import HTTPException
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class FileValidator:
    """
    Multi-layer file validation:
    1. Size check
    2. Magic number validation (actual file type)
    3. Malware scanning with ClamAV
    """

    ALLOWED_MIMES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/png",
        "image/jpeg"
    }

    EXTENSION_MAP = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/plain": ".txt",
        "image/png": ".png",
        "image/jpeg": ".jpg"
    }

    def __init__(self):
        self.mime_detector = magic.Magic(mime=True)
        try:
            self.clamav = clamd.ClamdUnixSocket()
            self.clamav.ping()
            self.clamav_available = True
            logger.info("ClamAV connection established")
        except (clamd.ConnectionError, AttributeError) as e:
            self.clamav_available = False
            logger.warning(f"ClamAV not available: {e}. File uploads will proceed without malware scanning.")

    async def validate_file(self, file_content: bytes, original_filename: str) -> tuple[str, str]:
        """
        Validate uploaded file.

        Returns:
            tuple[mime_type, extension]: Validated MIME type and safe extension

        Raises:
            HTTPException: If validation fails
        """
        # 1. Size check
        file_size = len(file_content)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                413,
                f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024:.0f}MB, "
                f"Uploaded: {file_size / 1024 / 1024:.1f}MB"
            )

        if file_size == 0:
            raise HTTPException(400, "Empty file uploaded")

        # 2. Magic number validation (check actual file type)
        try:
            actual_mime = self.mime_detector.from_buffer(file_content[:2048])
        except Exception as e:
            logger.error(f"Magic number detection failed: {e}")
            raise HTTPException(400, "Unable to determine file type")

        if actual_mime not in self.ALLOWED_MIMES:
            raise HTTPException(
                400,
                f"File type not allowed. Detected: {actual_mime}. "
                f"Allowed: PDF, DOCX, TXT, PNG, JPEG"
            )

        # 3. Malware scanning with ClamAV
        if self.clamav_available:
            try:
                scan_result = self.clamav.instream(file_content)

                if scan_result and scan_result.get('stream'):
                    status, virus_name = scan_result['stream']

                    if status == 'FOUND':
                        logger.warning(
                            f"Malware detected: {virus_name} in file: {original_filename}"
                        )
                        raise HTTPException(
                            400,
                            "File failed security scan. Please contact support if you believe this is an error."
                        )
            except clamd.ConnectionError as e:
                logger.error(f"ClamAV connection error: {e}")
                # Don't block upload if ClamAV is temporarily unavailable
                # But log for monitoring

        # 4. Get safe extension
        extension = self.EXTENSION_MAP.get(actual_mime, ".bin")

        return actual_mime, extension

# Singleton instance
file_validator = FileValidator()
```

**Step 4**: Update Upload Endpoint (1 hr)

```python
# backend/app/api/materials.py

from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
import uuid
import aiofiles

from app.db.session import get_db
from app.models.user import User
from app.models.material import Material
from app.api.deps import get_current_user
from app.services.file_validator import file_validator
from app.config import settings
from app.core.rate_limit import limiter

router = APIRouter()

async def get_user_storage_usage(user_id: uuid.UUID, session: AsyncSession) -> int:
    """Calculate total storage used by user"""
    from sqlalchemy import select, func

    result = await session.execute(
        select(func.sum(Material.file_size))
        .where(Material.user_id == user_id)
    )
    return result.scalar() or 0

@router.post("/")
@limiter.limit("10/hour")  # ✅ Rate limit uploads
async def upload_material(
    file: UploadFile,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload study material with security validation.

    Security measures:
    - File size limit (50MB)
    - Magic number validation
    - Malware scanning (ClamAV)
    - UUID filenames (prevent path traversal)
    - Storage quota per user (5GB)
    - Rate limiting (10/hour)
    """

    # 1. Read file content
    file_content = await file.read()

    # 2. Validate file (size, type, malware)
    actual_mime, extension = await file_validator.validate_file(
        file_content,
        file.filename
    )

    # 3. Check user storage quota
    user_storage = await get_user_storage_usage(current_user.id, session)
    if user_storage + len(file_content) > settings.USER_STORAGE_QUOTA:
        raise HTTPException(
            413,
            f"Storage quota exceeded. "
            f"Used: {user_storage / 1024 / 1024:.1f}MB / "
            f"{settings.USER_STORAGE_QUOTA / 1024 / 1024:.0f}MB"
        )

    # 4. Generate safe filename (UUID)
    safe_filename = f"{uuid.uuid4()}{extension}"

    # 5. Create user directory with absolute path
    upload_root = Path(settings.UPLOAD_DIR).resolve()
    user_directory = upload_root / str(current_user.id)
    user_directory.mkdir(parents=True, exist_ok=True)

    file_path = user_directory / safe_filename

    # 6. Save file with restricted permissions
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)

    file_path.chmod(0o644)  # Read-only: -rw-r--r--

    # 7. Create material record
    material = Material(
        user_id=current_user.id,
        filename=file.filename,  # Original filename (for display)
        file_path=str(file_path),  # Secure UUID path
        file_size=len(file_content),
        file_type=actual_mime,
        processing_status="pending"
    )
    session.add(material)
    await session.commit()
    await session.refresh(material)

    # 8. Return CDN URL (not direct file path)
    cdn_url = f"https://{settings.CDN_DOMAIN}/{current_user.id}/{safe_filename}"

    return {
        "id": str(material.id),
        "filename": file.filename,
        "url": cdn_url,
        "size": len(file_content),
        "type": actual_mime,
        "status": "pending"
    }
```

**Step 5**: Update Config (15 min)

```python
# backend/app/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... existing settings ...

    # File upload security
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    USER_STORAGE_QUOTA: int = 5 * 1024 * 1024 * 1024  # 5GB per user
    UPLOAD_DIR: str = "/var/www/studyin/uploads"  # ✅ Absolute path
    CDN_DOMAIN: str = "cdn.studyin.app"

    class Config:
        env_file = ".env"

settings = Settings()
```

**Step 6**: Testing (30 min)

```bash
# Start ClamAV
docker-compose up -d clamav

# Wait for virus definitions to download (2-3 min)
docker logs studyin_clamav --follow

# Test 1: Upload valid PDF
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@test.pdf"
# Expected: Success

# Test 2: Upload executable disguised as PDF
cp /bin/ls fake.pdf
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@fake.pdf"
# Expected: 400 "File type not allowed. Detected: application/x-executable"

# Test 3: Upload EICAR test virus
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@eicar.txt"
# Expected: 400 "File failed security scan"

# Test 4: Path traversal attempt
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@../../etc/passwd"
# Expected: File saved with UUID name, not original path

# Test 5: Rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/materials \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
    -F "file=@test.pdf"
done
# Expected: First 10 succeed, then 429 "Rate limit exceeded"
```

### Checklist
- [ ] Install python-magic and clamd dependencies
- [ ] Add ClamAV to docker-compose.yml
- [ ] Create FileValidator service with magic number check
- [ ] Implement malware scanning with ClamAV
- [ ] Update upload endpoint with validation
- [ ] Implement UUID filename generation
- [ ] Add storage quota enforcement
- [ ] Add rate limiting (10/hour)
- [ ] Test valid file upload
- [ ] Test fake PDF (executable disguised)
- [ ] Test EICAR virus detection
- [ ] Test path traversal prevention
- [ ] Test rate limiting
- [ ] Test storage quota enforcement

---

## ⚠️ SHOULD Fix #4: WebSocket Token Refresh

**File**: `frontend/src/hooks/useWebSocket.ts`
**Time**: 2 hours
**Priority**: High - Bad UX without this

### Problem
When `accessToken` changes (after refresh), WebSocket connection still uses old token. After token expires, user gets disconnected from AI Coach mid-conversation.

### Solution: Reconnect on Token Change

**Location**: FRONTEND_ARCHITECTURE.md line 1512

```typescript
// frontend/src/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  // ✅ NEW: Connection timeout
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken) {
      // No token, disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // ✅ NEW: Disconnect old socket before creating new one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket with current token
    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // ✅ NEW: Connection timeout (30 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (!socket.connected) {
        console.error('WebSocket connection timeout');
        socket.disconnect();
        options.onError?.(new Error('Connection timeout'));
      }
    }, 30000);

    socket.on('connect', () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      setIsConnected(true);
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      options.onError?.(error);
    });

    // ✅ NEW: Heartbeat/ping every 25 seconds
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000);

    // Cleanup
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [accessToken]); // ✅ NEW: Reconnect when token changes

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  const unsubscribe = (event: string, callback?: (data: any) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}
```

### Testing

```typescript
// Test: Token refresh during active WebSocket connection
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/authStore';

function TestComponent() {
  const { isConnected, sendMessage } = useWebSocket({
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
  });

  // Simulate token refresh after 5 seconds
  useEffect(() => {
    setTimeout(() => {
      console.log('Simulating token refresh...');
      useAuthStore.getState().setAccessToken('new-access-token');
      // Expected: WebSocket disconnects and reconnects with new token
    }, 5000);
  }, []);

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Checklist
- [ ] Add `accessToken` to useEffect dependencies
- [ ] Disconnect old socket before creating new one
- [ ] Add connection timeout (30 seconds)
- [ ] Add heartbeat/ping every 25 seconds
- [ ] Test WebSocket reconnects when token refreshes
- [ ] Test connection timeout works
- [ ] Test heartbeat keeps connection alive
- [ ] Verify no duplicate connections

---

## ⚠️ SHOULD Fix #5: CSRF Token Support

**Files**:
- `backend/app/api/auth.py`
- `backend/app/middleware/csrf.py`
- `frontend/src/lib/api/client.ts`

**Time**: 1 hour
**Priority**: Medium - Security gap

### Problem
No CSRF protection. SameSite=Strict cookies provide some protection, but adding CSRF tokens is defense-in-depth.

### Solution: CSRF Token Middleware

**Step 1**: Backend Middleware (30 min)

```python
# backend/app/middleware/csrf.py

import secrets
from fastapi import Request, HTTPException
from fastapi.responses import Response

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"

def generate_csrf_token() -> str:
    """Generate secure random CSRF token"""
    return secrets.token_urlsafe(32)

def set_csrf_cookie(response: Response, token: str):
    """Set CSRF token as cookie"""
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,  # Must be readable by JavaScript
        secure=True,     # HTTPS only
        samesite="strict",
        max_age=86400,   # 24 hours
        path="/"
    )

async def validate_csrf_token(request: Request):
    """Validate CSRF token for state-changing requests"""
    # Skip CSRF for safe methods
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return

    # Skip CSRF for /api/auth/login and /api/auth/register
    # (CSRF token not yet issued)
    if request.url.path in ["/api/auth/login", "/api/auth/register"]:
        return

    # Get token from header
    token_header = request.headers.get(CSRF_HEADER_NAME)

    # Get token from cookie
    token_cookie = request.cookies.get(CSRF_COOKIE_NAME)

    if not token_header or not token_cookie:
        raise HTTPException(403, "CSRF token missing")

    if token_header != token_cookie:
        raise HTTPException(403, "CSRF token invalid")
```

```python
# backend/app/api/auth.py

from fastapi import APIRouter, Response
from app.middleware.csrf import generate_csrf_token, set_csrf_cookie

router = APIRouter()

@app.post("/api/auth/login")
async def login(credentials: LoginRequest, response: Response):
    user = await authenticate(credentials)

    # ... existing token generation ...

    # ✅ NEW: Generate and set CSRF token
    csrf_token = generate_csrf_token()
    set_csrf_cookie(response, csrf_token)

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=604800,
        path="/api/auth/refresh"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": { ... }
    }
```

```python
# backend/app/main.py

from fastapi import FastAPI, Request
from app.middleware.csrf import validate_csrf_token

app = FastAPI()

# ✅ NEW: Add CSRF validation middleware
@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    await validate_csrf_token(request)
    response = await call_next(request)
    return response
```

**Step 2**: Frontend Integration (30 min)

```typescript
// frontend/src/lib/api/client.ts

// ✅ NEW: Get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// Add to request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ NEW: Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
```

### Testing

```bash
# Test 1: CSRF token issued on login
curl -i -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
# Expected: Set-Cookie header with csrf_token

# Test 2: POST without CSRF token fails
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
# Expected: 403 "CSRF token missing"

# Test 3: POST with valid CSRF token succeeds
curl -X POST http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -F "file=@test.pdf"
# Expected: Success
```

### Checklist
- [ ] Create CSRF middleware
- [ ] Generate CSRF token on login
- [ ] Set CSRF token as cookie (HttpOnly=false)
- [ ] Validate CSRF token in middleware
- [ ] Add X-CSRF-Token header to API client
- [ ] Test CSRF token issued on login
- [ ] Test POST without CSRF token fails
- [ ] Test POST with valid CSRF token succeeds

---

## ⚠️ SHOULD Fix #6: Token Refresh Notifications

**File**: `frontend/src/hooks/useTokenRefresh.ts`
**Time**: 30 minutes
**Priority**: Low - UX improvement

### Solution

```typescript
// frontend/src/hooks/useTokenRefresh.ts

import { useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner'; // ✅ NEW: Toast notifications

export function useTokenRefresh() {
  const { accessToken, setAccessToken, logout } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    try {
      const decoded = jwtDecode<{ exp: number }>(accessToken);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();

      const refreshAt = expiresAt - (2 * 60 * 1000);
      const timeUntilRefresh = refreshAt - now;

      if (timeUntilRefresh > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            const response = await authApi.refresh();
            setAccessToken(response.access_token);
            // ✅ NEW: Silent success (no toast)
          } catch (error) {
            // ✅ NEW: Show error notification
            toast.error('Your session has expired. Please log in again.', {
              duration: 5000,
              action: {
                label: 'Log In',
                onClick: () => window.location.href = '/login',
              },
            });
            logout();
            window.location.href = '/login';
          }
        }, timeUntilRefresh);
      }
    } catch (error) {
      // ✅ NEW: Show error for invalid token
      toast.error('Session error. Please log in again.');
      logout();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [accessToken, setAccessToken, logout]);
}
```

### Checklist
- [ ] Install `sonner` toast library
- [ ] Add error toast when refresh fails
- [ ] Add "Log In" action button to toast
- [ ] Redirect to login after failed refresh
- [ ] Test notification appears on refresh failure

---

## ⚠️ SHOULD Fix #7: Partition Automation

**File**: `backend/scripts/create_partitions.sh`
**Time**: 1 hour
**Priority**: Medium - Operational burden

### Solution: Cron Job

```bash
# backend/scripts/create_partitions.sh

#!/bin/bash

# Create monthly partitions for next 12 months
# Run this script monthly via cron

DB_NAME="studyin"
DB_USER="studyin_user"

# Generate partition dates
CURRENT_DATE=$(date +%Y-%m-01)
for i in {0..11}; do
    START_DATE=$(date -d "$CURRENT_DATE +$i month" +%Y-%m-01)
    END_DATE=$(date -d "$CURRENT_DATE +$((i+1)) month" +%Y-%m-01)
    PARTITION_NAME="user_question_attempts_$(date -d "$START_DATE" +%Y_%m)"

    # Check if partition exists
    EXISTS=$(psql -U $DB_USER -d $DB_NAME -tAc "
        SELECT COUNT(*)
        FROM pg_tables
        WHERE tablename = '$PARTITION_NAME';
    ")

    if [ "$EXISTS" -eq "0" ]; then
        echo "Creating partition: $PARTITION_NAME ($START_DATE to $END_DATE)"

        psql -U $DB_USER -d $DB_NAME <<EOF
            CREATE TABLE $PARTITION_NAME
            PARTITION OF user_question_attempts
            FOR VALUES FROM ('$START_DATE') TO ('$END_DATE');

            CREATE INDEX idx_attempts_${PARTITION_NAME}_user_id
            ON $PARTITION_NAME(user_id, answered_at);

            CREATE INDEX idx_attempts_${PARTITION_NAME}_question_id
            ON $PARTITION_NAME(question_id);
EOF
        echo "✅ Created partition: $PARTITION_NAME"
    else
        echo "⏭️  Partition already exists: $PARTITION_NAME"
    fi
done

echo "✅ Partition maintenance complete"
```

**Add to Crontab**:

```bash
# Run on 1st of every month at 2 AM
0 2 1 * * /path/to/backend/scripts/create_partitions.sh >> /var/log/partitions.log 2>&1
```

### Checklist
- [ ] Create `create_partitions.sh` script
- [ ] Make script executable (`chmod +x`)
- [ ] Test script manually
- [ ] Add to crontab (monthly execution)
- [ ] Verify partitions created in next run

---

## ⚠️ SHOULD Fix #8: XSS Sanitization

**File**: `frontend/src/components/AICoach/MessageDisplay.tsx`
**Time**: 2 hours
**Priority**: Medium - Security gap

### Problem
AI Coach responses may contain markdown that's rendered as HTML. If AI generates malicious HTML (unlikely but possible), it could cause XSS.

### Solution: DOMPurify Sanitization

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```typescript
// frontend/src/components/AICoach/MessageDisplay.tsx

import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageDisplayProps {
  content: string;
  role: 'user' | 'assistant';
}

export function MessageDisplay({ content, role }: MessageDisplayProps) {
  // ✅ NEW: Sanitize HTML before rendering
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div className={role === 'user' ? 'message-user' : 'message-assistant'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ✅ NEW: Custom link component with safe attributes
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            />
          ),
          // ✅ NEW: Code blocks with syntax highlighting (safe)
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="bg-gray-100 px-1 rounded" {...props} />
            ) : (
              <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto">
                <code {...props} />
              </pre>
            )
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
```

### Testing

```typescript
// Test malicious input
const maliciousContent = `
# Innocent Title

Click here: <a href="javascript:alert('XSS')">Link</a>

<script>alert('XSS')</script>

<img src="x" onerror="alert('XSS')" />

Normal content is fine.
`;

// Expected: Script tags removed, javascript: URLs removed, onerror removed
```

### Checklist
- [ ] Install DOMPurify
- [ ] Sanitize all markdown content before rendering
- [ ] Configure allowed tags and attributes
- [ ] Test with malicious script tags
- [ ] Test with javascript: URLs
- [ ] Test with onerror attributes
- [ ] Verify normal markdown still works

---

## ✅ Integration Testing

**Time**: 1.5 hours
**Goal**: Verify all fixes work together

### Test Suite

```bash
# Test 1: Complete Auth Flow (20 min)
# - Login with email/password
# - Receive access token + refresh token cookie + CSRF token
# - Make API calls with access token
# - Wait for token to expire
# - Verify automatic refresh (mutex prevents race condition)
# - Verify CSRF token validated
# - Logout and verify tokens cleared

# Test 2: File Upload Flow (30 min)
# - Upload valid PDF
# - Verify UUID filename generated
# - Verify file type validated (magic numbers)
# - Verify malware scanning (if ClamAV available)
# - Verify storage quota enforced
# - Verify rate limiting (10/hour)
# - Attempt malicious uploads (fake PDF, path traversal)

# Test 3: AI Coach WebSocket (20 min)
# - Connect to AI Coach
# - Send messages
# - Wait for token refresh (2 min before expiry)
# - Verify WebSocket reconnects with new token
# - Verify no message loss during reconnect
# - Verify heartbeat keeps connection alive

# Test 4: Database Partitions (10 min)
# - Insert 100 question attempts with various dates
# - Query recent attempts (last 7 days)
# - Verify EXPLAIN shows partition pruning
# - Verify all partitions have indexes
# - Verify old partitions can be detached

# Test 5: Security (10 min)
# - Verify CSRF tokens required for POST/PUT/DELETE
# - Verify access tokens in-memory only (no localStorage)
# - Verify refresh tokens in HttpOnly cookies
# - Verify file uploads use UUID names
# - Verify no XSS in AI Coach responses
```

### Checklist
- [ ] Test complete auth flow with token refresh
- [ ] Test file upload with all validations
- [ ] Test WebSocket reconnects on token change
- [ ] Test database partitioning performance
- [ ] Test CSRF protection works
- [ ] Test XSS sanitization works
- [ ] Document any issues found
- [ ] Update this checklist with completion notes

---

## 📋 Final Checklist

Before deploying to production:

### Critical Fixes (MUST DO)
- [ ] ✅ Fix #1: API Interceptor Race Condition (30 min)
- [ ] ✅ Fix #2: Database Partitioning (2 hrs)
- [ ] ✅ Fix #3: Backend File Upload Security (3 hrs)

### Should Fixes (HIGHLY RECOMMENDED)
- [ ] ✅ Fix #4: WebSocket Token Refresh (2 hrs)
- [ ] ✅ Fix #5: CSRF Token Support (1 hr)
- [ ] ✅ Fix #6: Token Refresh Notifications (30 min)
- [ ] ✅ Fix #7: Partition Automation (1 hr)
- [ ] ✅ Fix #8: XSS Sanitization (2 hrs)

### Testing
- [ ] ✅ Integration Testing (1.5 hrs)
- [ ] ✅ Security Testing
- [ ] ✅ Performance Testing
- [ ] ✅ User Acceptance Testing

### Documentation
- [ ] ✅ Update TECH_SPEC.md with implementations
- [ ] ✅ Update FRONTEND_ARCHITECTURE.md
- [ ] ✅ Update DATABASE_ARCHITECTURE.md
- [ ] ✅ Create deployment runbook
- [ ] ✅ Document monitoring setup

---

**Total Estimated Time**: 12 hours (1.5 developer days)

**Last Updated**: 2025-10-09
**Status**: Ready for Implementation
**Next Step**: Start with Fix #1 (API Interceptor Race Condition)
