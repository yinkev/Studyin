# Security Quick Fixes - StudyIn Authentication

**For**: Development Team
**Updated**: 2025-10-09
**Priority**: CRITICAL - Must implement before Phase 1

---

## 🚨 3 Critical Fixes Required

These issues MUST be fixed before writing any implementation code. Each fix includes working code examples you can use directly.

---

## Fix #1: Refresh Token Storage (HttpOnly Cookies)

### ❌ Current (INSECURE)

```typescript
// Frontend - stores token in localStorage (XSS vulnerable)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }), // ⚠️ INSECURE
    }
  )
);
```

### ✅ Fixed (SECURE)

**Backend** (`app/api/auth.py`):
```python
from fastapi import Response
from datetime import timedelta

@app.post("/api/auth/login")
async def login(credentials: LoginRequest, response: Response):
    user = await authenticate(credentials)

    access_token = create_access_token(user, expires_delta=timedelta(minutes=15))
    refresh_token = create_refresh_token(user, expires_delta=timedelta(days=7))

    # Store refresh token in database
    await store_refresh_token(user.id, refresh_token)

    # ✅ SECURE: Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,      # JavaScript cannot access
        secure=True,        # HTTPS only
        samesite="strict",  # CSRF protection
        max_age=604800,     # 7 days in seconds
        path="/api/auth/refresh"  # Only sent to refresh endpoint
    )

    # Return access token (short-lived, can be in memory)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "level": user.level,
            "xp": user.xp
        }
    }
```

**Frontend** (`src/stores/authStore.ts`):
```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;  // ✅ In memory only
  user: User | null;
  isAuthenticated: boolean;

  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

// ✅ NO PERSISTENCE - access token in memory only
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));

// Refresh token is in HttpOnly cookie - frontend never sees it
```

**Refresh Endpoint** (`app/api/auth.py`):
```python
from fastapi import Cookie, HTTPException

@app.post("/api/auth/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None)  # ✅ Automatically read from cookie
):
    if not refresh_token:
        raise HTTPException(401, "No refresh token provided")

    # Validate refresh token
    try:
        payload = jwt.decode(refresh_token, settings.REFRESH_TOKEN_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

    # Check if token exists in database (not revoked)
    if not await is_refresh_token_valid(user_id, refresh_token):
        raise HTTPException(401, "Refresh token revoked")

    user = await get_user_by_id(user_id)

    # Generate new tokens
    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)

    # Update refresh token in database
    await update_refresh_token(user.id, old_token=refresh_token, new_token=new_refresh_token)

    # ✅ Set new refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=604800,
        path="/api/auth/refresh"
    )

    return {"access_token": new_access_token, "token_type": "bearer"}
```

---

## Fix #2: Token Rotation with Family Tracking

### ❌ Current (INSECURE)

```python
# Returns SAME refresh token (vulnerable to theft)
return {"access_token": new_access, "refresh_token": old_refresh}
```

### ✅ Fixed (SECURE)

**Database Schema** (`app/models/refresh_token.py`):
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, unique=True, nullable=False)  # Hashed token
    family_id = Column(UUID(as_uuid=True), nullable=False)  # Track token lineage
    replaces = Column(UUID(as_uuid=True), nullable=True)  # Previous token ID
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
```

**Token Rotation Logic** (`app/services/auth.py`):
```python
import hashlib

async def refresh_token_with_rotation(old_refresh_token: str):
    # 1. Validate old token
    try:
        payload = jwt.decode(old_refresh_token, settings.REFRESH_TOKEN_SECRET)
        user_id = payload['user_id']
        family_id = payload.get('family_id', str(uuid.uuid4()))
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

    # 2. Hash token for database lookup (never store plain tokens)
    token_hash = hashlib.sha256(old_refresh_token.encode()).hexdigest()

    # 3. Get token record from database
    token_record = await session.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False
        )
    )
    token_record = token_record.scalar_one_or_none()

    if not token_record:
        # TOKEN REUSE DETECTED! Possible breach
        await revoke_token_family(family_id)
        await log_security_event("token_reuse_detected", user_id=user_id, family_id=family_id)
        await alert_security_team("Potential token theft detected", user_id=user_id)
        raise HTTPException(401, "Refresh token has been revoked due to security concerns")

    # 4. Check expiration
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(401, "Refresh token expired")

    user = await get_user_by_id(user_id)

    # 5. Generate NEW tokens
    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user, family_id=family_id)
    new_token_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()

    # 6. Store new token with family tracking
    new_token_record = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        family_id=family_id,
        replaces=token_record.id,  # Link to previous token
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    session.add(new_token_record)

    # 7. Revoke old token
    token_record.is_revoked = True
    await session.commit()

    await log_audit_event("token_rotation", user_id=user.id, family_id=family_id)

    return new_access_token, new_refresh_token

async def revoke_token_family(family_id: str):
    """Revoke all tokens in a family (used when breach detected)"""
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id)
        .values(is_revoked=True)
    )
    await session.commit()
```

**Token Creation** (`app/core/security.py`):
```python
import jwt
from datetime import datetime, timedelta

def create_refresh_token(user: User, family_id: str = None) -> str:
    if family_id is None:
        family_id = str(uuid.uuid4())

    payload = {
        "user_id": str(user.id),
        "family_id": family_id,  # Track token lineage
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())  # Unique token ID
    }

    return jwt.encode(payload, settings.REFRESH_TOKEN_SECRET, algorithm="HS256")
```

---

## Fix #3: File Upload Security

### ❌ Current (INSECURE)

```python
# Only checks file extension (easily spoofed)
MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt"]
UPLOAD_DIR: str = "./uploads"  # ⚠️ Relative path, path traversal risk
```

### ✅ Fixed (SECURE)

**Requirements** (`requirements.txt`):
```
python-magic==0.4.27
clamd==1.0.2
aiofiles==23.2.1
```

**Configuration** (`app/config.py`):
```python
class Settings(BaseSettings):
    # File upload security
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    USER_STORAGE_QUOTA: int = 5 * 1024 * 1024 * 1024  # 5GB per user
    UPLOAD_DIR: str = "/var/www/studyin/uploads"  # ✅ Absolute path
    ALLOWED_MIMES: set[str] = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/png",
        "image/jpeg"
    }
    CDN_DOMAIN: str = "cdn.studyin.app"  # Separate domain for uploads
```

**Secure Upload Endpoint** (`app/api/documents.py`):
```python
from fastapi import UploadFile, HTTPException
from pathlib import Path
from magic import Magic
import uuid
import aiofiles
import clamd

@app.post("/api/materials")
@limiter.limit("10/hour")  # ✅ Rate limit uploads
async def upload_material(
    file: UploadFile,
    current_user: User = Depends(get_current_user)
):
    # 1. Validate file size
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    temp_content = bytearray()

    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        temp_content.extend(chunk)

        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(413, "File too large (max 50MB)")

    await file.seek(0)  # Reset for next read

    # 2. Magic number validation (check actual file type)
    mime = Magic(mime=True)
    actual_mime_type = mime.from_buffer(temp_content[:1024])

    if actual_mime_type not in settings.ALLOWED_MIMES:
        raise HTTPException(
            400,
            f"File type not allowed. Detected: {actual_mime_type}. "
            f"Allowed: PDF, DOCX, TXT, PNG, JPEG"
        )

    # 3. Malware scanning with ClamAV
    try:
        cd = clamd.ClamdUnixSocket()
        scan_result = cd.scan_stream(temp_content)

        if scan_result and any('FOUND' in str(result) for result in scan_result.values()):
            await log_security_event(
                "malware_upload_attempt",
                user_id=current_user.id,
                filename=file.filename,
                mime_type=actual_mime_type
            )
            raise HTTPException(400, "File failed security scan")

    except clamd.ConnectionError:
        # ClamAV not running - log error but don't block (for dev)
        logger.error("ClamAV not available - file upload proceeding without scan")

    # 4. Generate safe filename (UUID)
    extension_map = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/plain": ".txt",
        "image/png": ".png",
        "image/jpeg": ".jpg"
    }
    extension = extension_map.get(actual_mime_type, ".bin")
    safe_filename = f"{uuid.uuid4()}{extension}"

    # 5. Use absolute path with user isolation
    upload_root = Path(settings.UPLOAD_DIR).resolve()  # ✅ Absolute path
    user_directory = upload_root / str(current_user.id)
    user_directory.mkdir(parents=True, exist_ok=True)

    file_path = user_directory / safe_filename

    # 6. Check user storage quota
    user_storage = await get_user_storage_usage(current_user.id)
    if user_storage + file_size > settings.USER_STORAGE_QUOTA:
        raise HTTPException(
            413,
            f"Storage quota exceeded. Used: {user_storage / 1024 / 1024:.1f}MB / "
            f"{settings.USER_STORAGE_QUOTA / 1024 / 1024:.0f}MB"
        )

    # 7. Save file with restricted permissions
    async with aiofiles.open(file_path, 'wb') as f:
        await file.seek(0)
        await f.write(await file.read())

    file_path.chmod(0o644)  # Read-only: -rw-r--r--

    # 8. Create material record
    material = Material(
        user_id=current_user.id,
        filename=file.filename,  # Original filename (for display)
        file_path=str(file_path),  # Secure path
        file_size=file_size,
        file_type=actual_mime_type,
        processing_status="pending"
    )
    session.add(material)
    await session.commit()

    # 9. Return CDN URL (not direct file path)
    cdn_url = f"https://{settings.CDN_DOMAIN}/{current_user.id}/{safe_filename}"

    await log_audit_event("file_upload", user_id=current_user.id, material_id=material.id)

    return {
        "id": material.id,
        "filename": file.filename,
        "url": cdn_url,
        "size": file_size,
        "type": actual_mime_type,
        "status": "pending"
    }
```

**Storage Helper** (`app/services/storage.py`):
```python
async def get_user_storage_usage(user_id: str) -> int:
    """Calculate total storage used by user"""
    result = await session.execute(
        select(func.sum(Material.file_size))
        .where(Material.user_id == user_id)
    )
    return result.scalar() or 0
```

**ClamAV Setup** (Docker Compose):
```yaml
# docker-compose.yml
services:
  clamav:
    image: clamav/clamav:latest
    container_name: studyin_clamav
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav

volumes:
  clamav-data:
```

---

## Bonus: Rate Limiting Configuration

### ❌ Current (INSECURE)

```python
RATE_LIMIT_PER_MINUTE: int = 100  # Too high!
```

### ✅ Fixed (SECURE)

**Install**:
```bash
pip install slowapi
```

**Configuration** (`app/main.py`):
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Apply to Endpoints**:
```python
from slowapi import Limiter

# Authentication - strict limits
@app.post("/api/auth/login")
@limiter.limit("5/minute")   # Only 5 attempts per minute
@limiter.limit("20/hour")    # Max 20 per hour
async def login():
    pass

@app.post("/api/auth/register")
@limiter.limit("3/hour")  # Prevent spam registrations
async def register():
    pass

@app.post("/api/auth/password-reset")
@limiter.limit("3/hour")  # Prevent email spam
async def password_reset():
    pass

# File uploads - moderate limits
@app.post("/api/materials")
@limiter.limit("10/hour")   # Max 10 uploads per hour
@limiter.limit("50/day")    # Max 50 per day
async def upload_material():
    pass

# Question generation - cost control
@app.post("/api/questions/generate")
@limiter.limit("20/hour")  # LLM cost control
async def generate_questions():
    pass

# General API - generous limits
@app.get("/api/materials")
@limiter.limit("100/minute")  # Read operations
async def get_materials():
    pass
```

---

## Testing Your Fixes

### Test 1: HttpOnly Cookie

```bash
# Login and check for HttpOnly cookie
curl -i -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456789"}'

# Should see:
# Set-Cookie: refresh_token=xxx; HttpOnly; Secure; SameSite=Strict
```

### Test 2: Token Rotation

```bash
# Refresh token twice
curl -X POST http://localhost:8000/api/auth/refresh \
  --cookie "refresh_token=OLD_TOKEN"

# Try using old token again (should fail with "token revoked")
curl -X POST http://localhost:8000/api/auth/refresh \
  --cookie "refresh_token=OLD_TOKEN"

# Expected: 401 error "Refresh token has been revoked"
```

### Test 3: File Upload Security

```bash
# Try uploading executable disguised as PDF
cp malware.exe fake.pdf
curl -F "file=@fake.pdf" http://localhost:8000/api/materials

# Expected: 400 error "File type not allowed. Detected: application/x-executable"

# Try path traversal
curl -F "file=@../../etc/passwd" http://localhost:8000/api/materials

# Expected: File saved with UUID name, not original path
```

### Test 4: Rate Limiting

```bash
# Try 10 login attempts rapidly
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Expected: First 5 succeed, then 429 error "Rate limit exceeded"
```

---

## Checklist

Before proceeding with implementation:

- [ ] **Fix #1**: Refresh tokens in HttpOnly cookies (not localStorage)
- [ ] **Fix #2**: Token rotation with family tracking implemented
- [ ] **Fix #3**: File upload security (magic number, malware scan, UUID names)
- [ ] **Bonus**: Tiered rate limiting configured
- [ ] **Tested**: All fixes validated with test commands above
- [ ] **Updated**: TECH_SPEC.md reflects new security architecture
- [ ] **Reviewed**: Security changes approved by team

---

## Questions?

- 📄 **Full Audit Report**: `/Users/kyin/Projects/Studyin/SECURITY_AUDIT_REPORT.md`
- 📋 **OWASP Checklist**: `/Users/kyin/Projects/Studyin/OWASP_COMPLIANCE_CHECKLIST.md`
- 📊 **Executive Summary**: `/Users/kyin/Projects/Studyin/SECURITY_AUDIT_EXECUTIVE_SUMMARY.md`

**Remember**: These fixes MUST be implemented before writing any feature code. Security is the foundation, not an afterthought.
