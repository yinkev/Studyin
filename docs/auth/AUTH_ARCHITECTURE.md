# JWT Authentication Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client (Browser/Mobile)"
        A[Login Page] --> B[API Client]
        B --> C[Access Token<br/>in Memory]
        B --> D[Refresh Token<br/>httpOnly Cookie]
    end

    subgraph "Backend API"
        E[/api/auth/register] --> F[Password Hash]
        G[/api/auth/login] --> H[Verify Password]
        H --> I[Create JWT Tokens]
        I --> J[Set Cookies]

        K[/api/auth/refresh] --> L[Verify Refresh Token]
        L --> M[Issue New Access Token]

        N[Protected Endpoints] --> O[get_current_user]
        O --> P[Verify Access Token]
        P --> Q[Get User from DB]
    end

    subgraph "Database"
        R[(PostgreSQL)]
        S[users table]
        T[materials table]
        U[Other tables]
    end

    B --> E
    B --> G
    B --> K
    B --> N

    F --> R
    H --> R
    Q --> R
    R --> S
    R --> T
    R --> U

    style C fill:#90EE90
    style D fill:#FFB6C6
    style I fill:#87CEEB
    style P fill:#87CEEB
```

---

## Token Flow

### Registration & Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant DB as Database

    Note over U,DB: Registration Flow
    U->>F: Enter email + password
    F->>A: POST /api/auth/register
    A->>A: Validate email format
    A->>A: Check password length (≥8)
    A->>DB: Check email uniqueness
    DB-->>A: Email available
    A->>A: Hash password (bcrypt)
    A->>DB: INSERT new user
    DB-->>A: User created
    A-->>F: {message, user}
    F-->>U: Registration success

    Note over U,DB: Login Flow
    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>DB: SELECT user by email
    DB-->>A: User record
    A->>A: Verify password (bcrypt)
    A->>A: Generate access token (JWT)
    A->>A: Generate refresh token (JWT)
    A->>A: Set httpOnly cookie (refresh)
    A-->>F: {access_token, user}
    F->>F: Store access token in memory
    F-->>U: Redirect to dashboard
```

### Protected Endpoint Access

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as Protected API
    participant Deps as get_current_user
    participant DB as Database

    F->>API: GET /api/materials<br/>Authorization: Bearer <token>
    API->>Deps: Extract user from token
    Deps->>Deps: Parse Authorization header
    Deps->>Deps: Verify JWT signature
    Deps->>Deps: Check token expiry
    Deps->>Deps: Extract user_id from token
    Deps->>DB: SELECT user WHERE id=user_id
    DB-->>Deps: User record
    Deps-->>API: User object
    API->>DB: SELECT materials WHERE user_id=user.id
    DB-->>API: User's materials
    API-->>F: Materials list

    Note over F,DB: User isolation: All data<br/>automatically filtered by user_id
```

### Token Refresh

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as API Endpoint
    participant Refresh as /auth/refresh
    participant DB as Database

    Note over F,Refresh: Access token expires after 15 min

    F->>API: GET /api/materials<br/>Authorization: Bearer <expired_token>
    API-->>F: 401 Unauthorized

    F->>F: Intercept 401 error
    F->>Refresh: POST /api/auth/refresh<br/>(refresh cookie automatic)
    Refresh->>Refresh: Extract refresh token from cookie
    Refresh->>Refresh: Verify JWT signature
    Refresh->>Refresh: Extract user_id
    Refresh->>DB: SELECT user WHERE id=user_id
    DB-->>Refresh: User record
    Refresh->>Refresh: Generate new access token
    Refresh->>Refresh: Generate new refresh token (rotation)
    Refresh->>Refresh: Set new refresh cookie
    Refresh-->>F: {access_token}

    F->>F: Update access token in memory
    F->>API: Retry GET /api/materials<br/>Authorization: Bearer <new_token>
    API-->>F: 200 OK + Materials
```

---

## Security Model

### Token Structure

**Access Token**:
```json
{
  "sub": "user-uuid-here",
  "type": "access",
  "exp": 1699999999,
  "iat": 1699999000
}
```
- **Secret**: `JWT_ACCESS_SECRET`
- **Algorithm**: HS256
- **Expiry**: 15 minutes
- **Storage**: In-memory (JavaScript variable)
- **Transmission**: Authorization header (`Bearer <token>`)

**Refresh Token**:
```json
{
  "sub": "user-uuid-here",
  "type": "refresh",
  "exp": 1700604800,
  "iat": 1699999000
}
```
- **Secret**: `JWT_REFRESH_SECRET` (different!)
- **Algorithm**: HS256
- **Expiry**: 7 days
- **Storage**: httpOnly cookie
- **Transmission**: Automatic with requests to `/api/auth/refresh`

### Password Security

```mermaid
graph LR
    A[Plain Password] --> B[bcrypt.gensalt]
    B --> C[Generate Salt]
    C --> D[bcrypt.hashpw]
    D --> E[Hashed Password]
    E --> F[Store in DB]

    G[Login Attempt] --> H[Get Hashed from DB]
    H --> I[bcrypt.checkpw]
    I --> J{Match?}
    J -->|Yes| K[Issue Tokens]
    J -->|No| L[401 Unauthorized]

    style E fill:#90EE90
    style K fill:#90EE90
    style L fill:#FFB6C6
```

### Multi-Device Support

```mermaid
graph TB
    subgraph "User"
        A[Laptop]
        B[Phone]
        C[Tablet]
    end

    subgraph "Authentication State"
        D[Laptop: refresh_token_1]
        E[Phone: refresh_token_2]
        F[Tablet: refresh_token_3]
    end

    subgraph "Backend (Stateless)"
        G[Verify JWT Signature]
        H[Check Expiry]
        I[No Session Storage]
    end

    A --> D
    B --> E
    C --> F

    D --> G
    E --> G
    F --> G

    G --> H
    H --> I

    style G fill:#87CEEB
    style H fill:#87CEEB
    style I fill:#90EE90

    Note1[Each device has its own<br/>refresh token cookie]
    Note2[All tokens are valid<br/>as long as not expired]
    Note3[No server-side session<br/>tracking needed]
```

**How it works**:
1. Each device gets its own refresh token on login
2. Tokens are stored in device-specific cookies
3. Backend verifies JWT signature (no DB lookup needed)
4. All devices can be logged in simultaneously
5. Logout only affects current device (clears cookie)

---

## Data Isolation

### User Separation

```mermaid
graph TB
    subgraph "User A (uuid: aaa...)"
        A1[Materials]
        A2[Study Sessions]
        A3[Progress]
    end

    subgraph "User B (uuid: bbb...)"
        B1[Materials]
        B2[Study Sessions]
        B3[Progress]
    end

    subgraph "Database Queries"
        Q1[SELECT * FROM materials<br/>WHERE user_id = 'aaa...']
        Q2[SELECT * FROM materials<br/>WHERE user_id = 'bbb...']
    end

    subgraph "get_current_user Dependency"
        D[Extract user_id from JWT]
    end

    D --> Q1
    D --> Q2

    Q1 --> A1
    Q2 --> B1

    style D fill:#87CEEB
    style Q1 fill:#90EE90
    style Q2 fill:#90EE90
```

**Every Endpoint Automatically Filters**:
```python
@router.get("/api/materials")
async def get_materials(
    user: User = Depends(get_current_user),  # ← JWT verification
    session: AsyncSession = Depends(get_db)
):
    # user.id is from verified JWT token
    result = await session.execute(
        select(Material).where(Material.user_id == user.id)  # ← Automatic isolation
    )
    return result.scalars().all()
```

---

## Migration Path

### Before: Hardcoded User

```python
# deps.py
HARDCODED_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

async def get_current_user(session: AsyncSession) -> User:
    # Always return same user, no authentication
    return await ensure_hardcoded_user(session)
```

```python
# auth.py
@router.post("/login")
async def login():
    user = await ensure_hardcoded_user()
    # Return fake tokens (not JWT)
    return {
        "access_token": f"access-{user.id}-{timestamp}",
        "user": user
    }
```

### After: JWT Authentication

```python
# deps.py
async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_db)
) -> User:
    # Extract Bearer token
    token = extract_token(authorization)

    # Verify JWT and get user_id
    user_id = verify_access_token(token)

    # Get actual user from database
    user = await get_user_by_id(session, user_id)
    return user
```

```python
# auth.py
@router.post("/login")
async def login(credentials: LoginRequest):
    # Find user by email
    user = await get_user_by_email(session, credentials.email)

    # Verify password with bcrypt
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    # Create real JWT tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {"access_token": access_token, "user": user}
```

---

## Request Flow Examples

### Example 1: First-Time User

```
1. User visits app → No tokens → Redirect to /login

2. User registers:
   POST /api/auth/register
   {"email": "alice@example.com", "password": "secure123"}
   → User created in DB

3. User logs in:
   POST /api/auth/login
   {"email": "alice@example.com", "password": "secure123"}
   → Returns access_token + sets refresh_token cookie

4. Frontend stores access_token in memory

5. User accesses dashboard:
   GET /api/materials
   Authorization: Bearer <access_token>
   → Backend verifies JWT → Returns alice's materials (empty)

6. User uploads material:
   POST /api/materials/upload
   Authorization: Bearer <access_token>
   → Material saved with user_id = alice's UUID
```

### Example 2: Returning User

```
1. User opens app → refresh_token cookie exists

2. Frontend checks for access_token in memory → Not found (page reload)

3. Frontend calls:
   POST /api/auth/refresh
   (refresh_token cookie sent automatically)
   → Returns new access_token

4. Frontend stores access_token in memory

5. User browses app normally with valid access_token
```

### Example 3: Multi-Device

```
Device A (Laptop):
1. Login → refresh_token_A in cookie
2. Access token stored in memory
3. Can access all APIs

Device B (Phone):
1. Login → refresh_token_B in cookie
2. Different access token in memory
3. Can access all APIs

Both devices work simultaneously!
No conflict because:
- Tokens are stateless (JWT)
- Each device has its own cookie
- Backend doesn't track sessions
```

---

## Error Handling

### Authentication Errors

```mermaid
graph TD
    A[Request to Protected Endpoint] --> B{Has Authorization Header?}
    B -->|No| C[401: Authorization header missing]
    B -->|Yes| D{Valid Bearer Format?}
    D -->|No| E[401: Invalid header format]
    D -->|Yes| F{Valid JWT Signature?}
    F -->|No| G[401: Invalid token]
    F -->|Yes| H{Token Expired?}
    H -->|Yes| I[401: Token expired]
    H -->|No| J{User Exists in DB?}
    J -->|No| K[401: User not found]
    J -->|Yes| L[✅ Allow Access]

    style C fill:#FFB6C6
    style E fill:#FFB6C6
    style G fill:#FFB6C6
    style I fill:#FFB6C6
    style K fill:#FFB6C6
    style L fill:#90EE90
```

### Frontend Error Recovery

```mermaid
graph TD
    A[API Request] --> B{Response Status}
    B -->|200| C[Success]
    B -->|401| D{First 401?}
    D -->|Yes| E[Call /auth/refresh]
    E --> F{Refresh Success?}
    F -->|Yes| G[Update Access Token]
    G --> H[Retry Original Request]
    H --> I{Success?}
    I -->|Yes| C
    I -->|No| J[Show Error]

    F -->|No| K[Redirect to Login]
    D -->|No| K

    style C fill:#90EE90
    style K fill:#FFB6C6
```

---

## Rate Limiting

```mermaid
graph LR
    subgraph "Rate Limits"
        A[Register: 5/hour] --> B[Prevent Spam]
        C[Login: 10/minute] --> D[Prevent Brute Force]
        E[Refresh: 20/minute] --> F[Normal Usage]
        G[Logout: 10/minute] --> H[Prevent Abuse]
    end

    style A fill:#FFB6C6
    style C fill:#FFE4B5
    style E fill:#90EE90
    style G fill:#87CEEB
```

---

## Security Checklist

### ✅ Implemented

- **Password Security**:
  - ✅ bcrypt hashing with auto salt
  - ✅ Min password length (8 chars)
  - ✅ No plaintext storage

- **Token Security**:
  - ✅ Short-lived access tokens (15 min)
  - ✅ Long-lived refresh tokens (7 days)
  - ✅ httpOnly cookies for refresh tokens
  - ✅ Secure flag (HTTPS only)
  - ✅ SameSite=strict (CSRF protection)
  - ✅ Token rotation on refresh
  - ✅ Separate secrets for access/refresh

- **API Security**:
  - ✅ Rate limiting on all auth endpoints
  - ✅ Email validation
  - ✅ SQL injection prevention (SQLAlchemy ORM)
  - ✅ CORS configuration
  - ✅ Security event logging

- **Data Isolation**:
  - ✅ All queries filter by user_id
  - ✅ JWT-based user identification
  - ✅ Database foreign key constraints

### 🔧 Optional Enhancements

- **Future Additions**:
  - ⏳ Email verification
  - ⏳ Password reset flow
  - ⏳ 2FA/MFA
  - ⏳ OAuth providers (Google, GitHub)
  - ⏳ Token blacklist (revocation)
  - ⏳ Session management dashboard
  - ⏳ Account lockout after N failed attempts
  - ⏳ Password complexity rules
  - ⏳ Remember me (longer refresh token)

---

## Performance Characteristics

### Token Verification (O(1))

```python
# No database lookup needed for token verification!

def verify_access_token(token: str) -> UUID:
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    # ✅ Instant verification
    # ✅ No DB query
    # ✅ Scales infinitely
    return UUID(payload["sub"])
```

### Database Queries Per Request

**Protected Endpoint**:
```
1. Verify JWT → No DB (O(1))
2. Get user by ID → 1 DB query (indexed)
3. Get user's data → 1 DB query (indexed on user_id)

Total: 2 DB queries (constant, not N+1)
```

**Token Refresh**:
```
1. Verify refresh token → No DB (O(1))
2. Get user by ID → 1 DB query (indexed)

Total: 1 DB query
```

### Scalability

```
✅ Stateless tokens → No session storage
✅ No Redis needed (for MVP)
✅ Horizontal scaling friendly
✅ CDN-friendly (no server-side state)
✅ Multi-region deployable
```

---

## Summary

**Authentication System**:
- ✅ JWT-based (stateless, scalable)
- ✅ bcrypt password hashing (secure)
- ✅ Multi-device support (separate tokens)
- ✅ Automatic token refresh (seamless UX)
- ✅ User data isolation (secure by default)
- ✅ Rate limiting (prevent abuse)
- ✅ Security logging (audit trail)

**Migration Complete**:
- ❌ Hardcoded user removed
- ✅ Real authentication implemented
- ✅ Multi-user ready
- ✅ Production-grade security

**Next Steps**:
1. Frontend login/register UI
2. Protected route guards
3. Token storage in authStore
4. Production deployment
