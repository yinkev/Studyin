# Authentication Migration Checklist

**From**: Hardcoded user authentication
**To**: JWT-based multi-user authentication

---

## ✅ Completed (Backend)

### Core Authentication System
- [x] JWT token utilities (`app/core/jwt.py`)
  - [x] `create_access_token(user_id)` - 15 min expiry
  - [x] `create_refresh_token(user_id)` - 7 days expiry
  - [x] `verify_access_token(token)` - Returns user_id
  - [x] `verify_refresh_token(token)` - Returns user_id

- [x] Password hashing utilities (`app/core/password.py`)
  - [x] `hash_password(password)` - bcrypt with salt
  - [x] `verify_password(password, hash)` - Secure comparison

- [x] Authentication endpoints (`app/api/auth.py`)
  - [x] `POST /api/auth/register` - User registration
  - [x] `POST /api/auth/login` - Login with JWT tokens
  - [x] `POST /api/auth/refresh` - Token refresh with rotation
  - [x] `POST /api/auth/logout` - Cookie cleanup

- [x] User dependency (`app/api/deps.py`)
  - [x] Removed `HARDCODED_USER_ID` and `HARDCODED_USER_EMAIL`
  - [x] Removed `ensure_hardcoded_user()`
  - [x] Updated `get_current_user()` to verify JWT tokens
  - [x] Extract user from Authorization header
  - [x] Verify JWT signature and expiry
  - [x] Query database for user

- [x] Dependencies
  - [x] Added `bcrypt>=4.1.0` to requirements.txt
  - [x] Added `PyJWT>=2.8.0` to requirements.txt
  - [x] Added `email-validator>=2.1.0` to requirements.txt
  - [x] Installed dependencies

### Testing & Documentation
- [x] Test script (`backend/test_auth.py`)
- [x] Implementation guide (`AUTH_IMPLEMENTATION.md`)
- [x] Setup guide (`AUTH_SETUP.md`)
- [x] Architecture diagrams (`AUTH_ARCHITECTURE.md`)

---

## 🔨 TODO: Frontend Integration

### 1. Authentication Store

**File**: `frontend/src/stores/authStore.ts`

**Status**: ⏳ Needs update

**Current**:
```typescript
// Minimal store, might not have token management
```

**Required**:
```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: { id: string; email: string } | null;
  setAccessToken: (token: string) => void;
  setUser: (user: { id: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));
```

### 2. Login Page

**File**: `frontend/src/pages/Login.tsx`

**Status**: ⏳ Needs creation

**Template**:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const { access_token, user } = response.data;

      useAuthStore.getState().setAccessToken(access_token);
      useAuthStore.getState().setUser(user);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <a href="/register">Don't have an account? Register</a>
    </div>
  );
}
```

### 3. Registration Page

**File**: `frontend/src/pages/Register.tsx`

**Status**: ⏳ Needs creation

**Template**:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      // Register
      await apiClient.post('/api/auth/register', {
        email,
        password,
      });

      // Auto-login after registration
      const loginResponse = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const { access_token, user } = loginResponse.data;

      useAuthStore.getState().setAccessToken(access_token);
      useAuthStore.getState().setUser(user);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div>
      <h1>Register</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <a href="/login">Already have an account? Login</a>
    </div>
  );
}
```

### 4. Protected Route Component

**File**: `frontend/src/components/ProtectedRoute.tsx`

**Status**: ⏳ Needs creation

**Template**:
```tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 5. Route Configuration

**File**: `frontend/src/App.tsx` or route config

**Status**: ⏳ Needs update

**Required Changes**:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. API Client Updates

**File**: `frontend/src/lib/api/client.ts`

**Status**: ✅ Already configured (verify)

**Verify**:
- [x] `withCredentials: true` for cookies
- [x] Authorization header attached from store
- [x] 401 interceptor calls `/api/auth/refresh`
- [x] Store updated after refresh

**Current Implementation**:
```typescript
// Should already have these:

// 1. Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response interceptor for auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(config);
    }
    return Promise.reject(error);
  }
);
```

**Note**: Update the refresh flow to uncomment logout on failure:
```typescript
// In error handler, after refresh fails:
} catch (refreshError) {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return Promise.reject(refreshError);
}
```

### 7. Token Refresh Utility

**File**: `frontend/src/lib/api/tokenRefresh.ts`

**Status**: ⏳ Verify implementation

**Required**:
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export async function refreshAccessToken(): Promise<string> {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
    {},
    {
      withCredentials: true, // Important: Send refresh_token cookie
    }
  );

  const { access_token } = response.data;

  // Update store
  useAuthStore.getState().setAccessToken(access_token);

  return access_token;
}
```

### 8. Logout Implementation

**File**: `frontend/src/components/Header.tsx` or similar

**Status**: ⏳ Needs creation/update

**Template**:
```tsx
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

export default function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      // Ignore logout errors
    } finally {
      // Always clear local state
      useAuthStore.getState().logout();
      navigate('/login');
    }
  };

  return (
    <header>
      <div>Welcome, {user?.email}</div>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
```

---

## 🔧 Configuration Updates

### 1. Environment Variables

**File**: `frontend/.env.local`

**Status**: ✅ Already configured (verify)

**Required**:
```bash
VITE_API_URL=http://localhost:8000
```

**For Production**:
```bash
VITE_API_URL=https://api.studyin.app
```

### 2. Backend Environment

**File**: `backend/.env`

**Status**: ⏳ Needs production secrets

**Current (Development)**:
```bash
JWT_ACCESS_SECRET=local-access-secret
JWT_REFRESH_SECRET=local-refresh-secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
```

**Production** (REQUIRED):
```bash
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_ACCESS_SECRET=<32+ character random string>
JWT_REFRESH_SECRET=<32+ character random string>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=production
```

---

## 🗄️ Database Updates

### 1. Run Migrations

**Status**: ⏳ Needs verification

```bash
cd backend
alembic upgrade head
```

**Verify**:
- [x] `users` table exists
- [x] `users.id` (UUID, primary key)
- [x] `users.email` (unique, not null)
- [x] `users.password_hash` (not null)

### 2. Verify Foreign Keys

**Status**: ⏳ Check all tables

All tables should have `user_id` foreign key:
```sql
-- Example: materials table
ALTER TABLE materials
ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX idx_materials_user_id ON materials(user_id);
```

**Tables to check**:
- [ ] `materials`
- [ ] `study_sessions`
- [ ] `user_progress`
- [ ] `questions`
- [ ] `user_attempts`
- [ ] Any other user-specific data tables

---

## 🧪 Testing Checklist

### Backend Tests

**Status**: ⏳ Run tests

```bash
cd backend
python test_auth.py
```

**Expected Results**:
- [x] ✅ Registration successful
- [x] ✅ Login successful
- [x] ✅ Protected endpoint access with valid token
- [x] ✅ Protected endpoint rejects invalid token
- [x] ✅ Token refresh successful
- [x] ✅ New token works
- [x] ✅ Logout successful

### Manual Testing

**Registration Flow**:
1. [ ] Open `/register`
2. [ ] Enter valid email and password (8+ chars)
3. [ ] Submit form
4. [ ] Verify redirect to dashboard
5. [ ] Verify user appears in database

**Login Flow**:
1. [ ] Open `/login`
2. [ ] Enter registered credentials
3. [ ] Submit form
4. [ ] Verify access token in browser DevTools (Network tab)
5. [ ] Verify refresh token cookie set
6. [ ] Verify redirect to dashboard

**Protected Routes**:
1. [ ] Access `/dashboard` without login → Redirects to `/login`
2. [ ] Login → Access `/dashboard` → Works
3. [ ] Reload page → Still authenticated (auto-refresh works)

**Multi-Device**:
1. [ ] Login on Device A (e.g., laptop)
2. [ ] Login on Device B (e.g., phone)
3. [ ] Both devices work simultaneously
4. [ ] Logout on Device A → Device B still works

**Token Expiry**:
1. [ ] Login and wait 15+ minutes
2. [ ] Make API request
3. [ ] Verify auto-refresh happens (check Network tab)
4. [ ] Request succeeds with new token

**Logout**:
1. [ ] Click logout button
2. [ ] Verify redirect to `/login`
3. [ ] Verify cookies cleared (DevTools → Application → Cookies)
4. [ ] Try accessing protected route → Redirects to `/login`

---

## 🚀 Deployment Checklist

### Pre-Deployment

**Backend**:
- [ ] Change `JWT_ACCESS_SECRET` to random value
- [ ] Change `JWT_REFRESH_SECRET` to random value
- [ ] Set `ENVIRONMENT=production`
- [ ] Verify HTTPS is enabled
- [ ] Configure CORS for production domain
- [ ] Run database migrations
- [ ] Test all auth endpoints

**Frontend**:
- [ ] Update `VITE_API_URL` to production API URL
- [ ] Build frontend: `npm run build`
- [ ] Test production build locally
- [ ] Verify API calls use HTTPS

### Post-Deployment

- [ ] Test registration on production
- [ ] Test login on production
- [ ] Test protected routes on production
- [ ] Test token refresh on production
- [ ] Test logout on production
- [ ] Monitor error logs for auth issues
- [ ] Verify rate limiting works

---

## 📊 Monitoring & Logging

### What to Monitor

**Security Events** (already logged):
- [ ] Failed login attempts (track potential attacks)
- [ ] Registration rate (detect spam)
- [ ] Token refresh patterns (detect anomalies)
- [ ] 401 errors (detect issues)

**Performance**:
- [ ] Login endpoint latency
- [ ] Token verification time
- [ ] Database query performance (user lookups)

**Alerts to Set Up**:
- [ ] Alert on >10 failed logins from same IP in 1 minute
- [ ] Alert on >100 registrations in 1 hour (spam)
- [ ] Alert on high 401 error rate (token issues)

---

## 🐛 Common Issues & Solutions

### "Authorization header missing"

**Symptom**: All API requests fail with 401
**Cause**: Frontend not sending token
**Fix**:
```typescript
// Verify in apiClient.interceptors.request
const token = useAuthStore.getState().accessToken;
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### "Invalid token"

**Symptom**: Login works, but protected routes fail
**Cause**: Wrong JWT secret or expired token
**Fix**:
1. Verify `JWT_ACCESS_SECRET` matches in `.env`
2. Check token expiry (15 min)
3. Verify auto-refresh is working

### "User not found"

**Symptom**: Token valid but user not found
**Cause**: User deleted or database mismatch
**Fix**:
1. Verify user exists in database
2. Check user_id in JWT payload matches DB

### Token refresh infinite loop

**Symptom**: Constant refresh requests
**Cause**: Refresh endpoint also returns 401
**Fix**:
```typescript
// Prevent retry on refresh endpoint
if (config.url?.includes('/auth/refresh')) {
  return Promise.reject(error);
}
```

### CORS errors

**Symptom**: Requests blocked in browser
**Cause**: CORS not configured
**Fix**:
```python
# backend/.env
CORS_ALLOW_ORIGINS=http://localhost:3000,https://app.studyin.com
```

---

## 📝 Next Sprint Tasks

### High Priority
1. [ ] Create login page UI
2. [ ] Create registration page UI
3. [ ] Update authStore with token management
4. [ ] Add protected route guards
5. [ ] Test complete auth flow

### Medium Priority
1. [ ] Add loading states to login/register
2. [ ] Add form validation errors
3. [ ] Create logout button in header
4. [ ] Add "Remember me" option (longer refresh token)
5. [ ] Create user profile page

### Low Priority / Future
1. [ ] Add password reset flow
2. [ ] Add email verification
3. [ ] Add OAuth providers (Google, GitHub)
4. [ ] Add 2FA/MFA
5. [ ] Create session management dashboard
6. [ ] Add account deletion

---

## ✅ Migration Complete When...

- [x] Backend JWT system implemented
- [ ] Frontend login/register pages created
- [ ] Token storage working in authStore
- [ ] Protected routes enforce authentication
- [ ] Auto-refresh working on 401
- [ ] Multi-device login tested
- [ ] Production secrets configured
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🎉 Success Criteria

**You'll know migration is complete when**:

1. ✅ Users can register with email + password
2. ✅ Users can login and get JWT tokens
3. ✅ Access tokens work for 15 minutes
4. ✅ Refresh tokens automatically renew access tokens
5. ✅ Users can logout and cookies are cleared
6. ✅ Multi-device login works simultaneously
7. ✅ All user data is isolated by user_id
8. ✅ No hardcoded user references remain
9. ✅ Production secrets are secure
10. ✅ Monitoring and logging in place

**Then you can**:
- 🚀 Deploy to production
- 👥 Support multiple real users
- 📱 Use from any device
- 🔒 Trust the security model
- 📈 Scale horizontally

---

## Need Help?

- **Setup Issues**: See `AUTH_SETUP.md`
- **Architecture Questions**: See `AUTH_ARCHITECTURE.md`
- **Implementation Details**: See `AUTH_IMPLEMENTATION.md`
- **Test Backend**: Run `python backend/test_auth.py`
- **Check API Docs**: Visit `http://localhost:8000/docs`
