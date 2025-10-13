# Authentication Setup Guide

**Quick Start**: Get JWT authentication running in 5 minutes

---

## 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `bcrypt` - Password hashing
- `PyJWT` - JWT token handling
- `email-validator` - Email validation

---

## 2. Configure Environment

Edit `backend/.env`:

```bash
# IMPORTANT: Change these secrets in production!
JWT_ACCESS_SECRET=your-super-secret-access-key-change-me-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-me-in-production

# Token expiry (defaults are fine for most cases)
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
```

**For Production**:
```bash
# Generate secure secrets:
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Use output for JWT_ACCESS_SECRET

python -c "import secrets; print(secrets.token_urlsafe(32))"
# Use output for JWT_REFRESH_SECRET

# Set environment
ENVIRONMENT=production
```

---

## 3. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

This ensures the `users` table exists.

---

## 4. Start the Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`

---

## 5. Test Authentication

### Option A: Automated Test Script

```bash
cd backend
python test_auth.py
```

This will:
1. Register a test user
2. Login and get tokens
3. Access protected endpoint
4. Test token refresh
5. Logout

Expected output:
```
Testing Authentication Flow
==================================================

1. Testing Registration...
   ✅ Registration successful

2. Testing Login...
   ✅ Login successful

3. Testing Protected Endpoint Access...
   ✅ Successfully accessed protected endpoint

4. Testing Invalid Token...
   ✅ Correctly rejected invalid token

5. Testing Token Refresh...
   ✅ Token refresh successful

6. Testing New Access Token...
   ✅ New token works correctly

7. Testing Logout...
   ✅ Logout successful

==================================================
✅ All authentication tests passed!
```

### Option B: Manual Testing with cURL

**Register a user:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword123"}' \
  -c cookies.txt
```

Save the `access_token` from response.

**Access protected endpoint:**
```bash
curl -X GET http://localhost:8000/api/materials \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Refresh token:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt
```

---

## 6. API Documentation

Visit: `http://localhost:8000/docs`

Interactive Swagger UI with all endpoints:
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout

---

## Frontend Integration (Next Steps)

### 1. Token Storage Setup

Already configured in `frontend/src/lib/api/client.ts`:
- Access token: In-memory (Zustand store)
- Refresh token: httpOnly cookie (automatic)
- Auto-refresh on 401 errors

### 2. Create Login Page

```tsx
// pages/Login.tsx
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

const LoginPage = () => {
  const setAccessToken = useAuthStore(state => state.setAccessToken);

  const handleLogin = async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });

    // Store access token
    setAccessToken(response.data.access_token);

    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleLogin(
        formData.get('email'),
        formData.get('password')
      );
    }}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Login</button>
    </form>
  );
};
```

### 3. Create Registration Page

```tsx
// pages/Register.tsx
const RegisterPage = () => {
  const handleRegister = async (email: string, password: string) => {
    // Register
    await apiClient.post('/api/auth/register', {
      email,
      password
    });

    // Auto-login
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });

    useAuthStore.getState().setAccessToken(response.data.access_token);
    window.location.href = '/dashboard';
  };

  return (/* Similar form */);
};
```

### 4. Protected Routes

```tsx
// components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore(state => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return children;
};

// App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## Troubleshooting

### Server won't start
**Issue**: Import errors
**Fix**:
```bash
pip install -r requirements.txt
```

### "JWT secrets must be overridden in staging/production"
**Issue**: Using default secrets in production
**Fix**: Update `.env` with new secrets (see step 2)

### Token refresh fails
**Issue**: Cookies not being sent
**Fix**: Ensure `withCredentials: true` in axios config
```ts
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true  // ← Important!
});
```

### "User not found" after login
**Issue**: Database not migrated
**Fix**:
```bash
alembic upgrade head
```

---

## What's Different from Before?

### Before (Hardcoded User)
```python
# deps.py
HARDCODED_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

async def get_current_user():
    return await ensure_hardcoded_user()  # Always same user
```

### Now (JWT Authentication)
```python
# deps.py
async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_db)
):
    # Extract Bearer token
    # Verify JWT
    # Get actual user from DB
    return user
```

**Result**: True multi-user support with proper authentication!

---

## Security Checklist

### Development ✅
- [x] JWT secrets set (defaults OK for dev)
- [x] HTTPS not required (localhost)
- [x] CORS configured for localhost
- [x] Rate limiting enabled

### Production 🚀
- [ ] JWT secrets changed to random values
- [ ] HTTPS enabled (required for secure cookies)
- [ ] CORS configured for production domain
- [ ] ENVIRONMENT=production in .env
- [ ] Database backups configured
- [ ] Security logging monitored

---

## Quick Reference

### Default User (for testing)
If you have existing data for the hardcoded user:
- Email: `demo@studyin.local`
- Password: Create one by registering with this email

### Token Expiry
- Access token: 15 minutes
- Refresh token: 7 days

### Rate Limits
- Register: 5/hour
- Login: 10/minute
- Refresh: 20/minute
- Logout: 10/minute

### Endpoints
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Refresh: `POST /api/auth/refresh`
- Logout: `POST /api/auth/logout`

---

## Next Steps

1. ✅ Backend auth is complete
2. 🔨 Create frontend login/register pages
3. 🔨 Update authStore to manage tokens
4. 🔨 Add protected route guards
5. 🔨 Test multi-device login
6. 🚀 Deploy to production

---

**Need Help?**
- Check `AUTH_IMPLEMENTATION.md` for detailed documentation
- Run `python test_auth.py` to verify setup
- Check FastAPI docs at `http://localhost:8000/docs`
