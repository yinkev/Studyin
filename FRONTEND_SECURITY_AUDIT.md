# Frontend Security Audit - StudyIn Dashboard
**Audit Date**: 2025-10-11
**Context**: Personal medical learning app (single-user, local environment)
**Focus**: Data safety, XSS prevention, and security hygiene

---

## Executive Summary

The StudyIn dashboard is reasonably secure for personal use, with no critical vulnerabilities that could cause data loss. However, there are several important security improvements recommended for better protection and following best practices.

### Security Score: 7/10 (Good for personal use)
- **Critical Issues**: 0
- **Important Issues**: 3
- **Nice-to-Have**: 5

---

## 1. Critical Issues (Could break or lose data)
**✅ None Found**

The application has no critical vulnerabilities that could result in:
- Data loss or corruption
- Complete application failure
- Unauthorized system access

---

## 2. Important Issues (Security hygiene for personal use)

### 2.1 XSS Risk - Filename Display Without Sanitization
**Location**: `/frontend/src/pages/Dashboard.tsx` (line 118)

**Issue**: User-uploaded filenames are displayed directly without HTML sanitization:
```tsx
<h3 className="material-title">{material.filename}</h3>
```

**Risk**: If you upload a file with a malicious filename containing HTML/JavaScript, it could execute in your browser.

**Fix Required**:
```tsx
// Option 1: Use textContent approach (safest)
<h3 className="material-title" ref={(el) => {
  if (el) el.textContent = material.filename;
}} />

// Option 2: Install and use DOMPurify (already in dependencies)
import DOMPurify from 'dompurify';
<h3 className="material-title">{DOMPurify.sanitize(material.filename)}</h3>
```

### 2.2 WebSocket Connection - No TLS in Production
**Location**: `/frontend/.env.local` and `/frontend/src/hooks/useChatSession.ts`

**Issue**: WebSocket uses unencrypted `ws://` protocol:
```typescript
const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';
```

**Risk**: If you ever access this from a non-localhost network, messages could be intercepted.

**Fix Required**:
```typescript
// Detect environment and use appropriate protocol
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const DEFAULT_WS_URL = `${protocol}//localhost:8000/api/chat/ws`;
```

### 2.3 Vite Development Server Binding to All Interfaces
**Location**: `/frontend/vite.config.ts` (line 14)

**Issue**: Development server binds to `0.0.0.0`:
```typescript
host: '0.0.0.0',
```

**Risk**: Exposes your development server to all network interfaces, potentially allowing external access to your personal data.

**Fix Required**:
```typescript
server: {
  port: 5173,
  host: 'localhost', // Changed from '0.0.0.0'
  // Or conditionally: host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
}
```

---

## 3. Nice-to-Have Improvements (Best practices)

### 3.1 Missing Content Security Policy (CSP)
**Location**: `/frontend/index.html`

**Recommendation**: Add CSP meta tag for defense in depth:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               connect-src 'self' ws://localhost:8000 http://localhost:8000;">
```

### 3.2 Input Validation on Chat Messages
**Location**: `/frontend/src/hooks/useChatSession.ts` (line 386-390)

**Current**: Basic trim validation only
```typescript
const trimmed = content.trim();
if (!trimmed) return;
```

**Enhancement**: Add length limits and basic sanitization:
```typescript
const MAX_MESSAGE_LENGTH = 10000; // Reasonable limit for medical questions
const trimmed = content.trim().slice(0, MAX_MESSAGE_LENGTH);
if (!trimmed || trimmed.length < 2) return;
```

### 3.3 Error Message Information Disclosure
**Location**: `/frontend/src/hooks/useChatSession.ts` (multiple locations)

**Current**: Raw error messages exposed to UI
```typescript
toast.error(message);
```

**Enhancement**: Sanitize error messages for user display:
```typescript
const userFriendlyError = DOMPurify.sanitize(message, { ALLOWED_TAGS: [] });
toast.error(userFriendlyError);
```

### 3.4 Missing Rate Limiting on Frontend
**Location**: `/frontend/src/hooks/useChatSession.ts`

**Enhancement**: Add client-side rate limiting to prevent accidental spam:
```typescript
// Add to useChatSession hook
const lastMessageTime = useRef(0);
const MESSAGE_COOLDOWN = 500; // ms

const sendMessage = useCallback((content: string) => {
  const now = Date.now();
  if (now - lastMessageTime.current < MESSAGE_COOLDOWN) {
    toast.warning('Please wait a moment before sending another message');
    return;
  }
  lastMessageTime.current = now;
  // ... existing logic
}, []);
```

### 3.5 Secure Cookie Handling
**Location**: `/frontend/src/lib/api/client.ts` (line 12)

**Current**: CSRF token extraction from cookies
```typescript
const match = document.cookie.match(/csrf_token=([^;]+)/);
```

**Enhancement**: Use more robust cookie parsing:
```typescript
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';')
      .map(c => c.trim())
      .filter(c => c.startsWith('csrf_token='));

    if (cookies.length > 0) {
      return decodeURIComponent(cookies[0].substring(11));
    }
  } catch (e) {
    console.error('Failed to parse CSRF token', e);
  }
  return null;
}
```

---

## 4. Dependency Audit Results

### Vulnerabilities Found (npm audit)
- **4 Moderate severity** issues in development dependencies
- **0 Critical or High severity** issues
- All issues are in build tools (vite, vitest), not runtime code

### Action Required:
The vulnerabilities are in the Vite development server (esbuild CORS issue). Since this is for personal use:

1. **For now**: Safe to continue using, as these only affect development mode
2. **When convenient**: Update Vite to v7+ when your codebase is ready for the major version upgrade

```bash
# Future update (requires testing):
npm update vite@latest vitest@latest
```

### Key Security Dependencies Status:
- ✅ **DOMPurify 3.1.6**: Latest version, no vulnerabilities
- ✅ **axios 1.7.7**: Latest version, no vulnerabilities
- ⚠️ **React 19.0.0-rc**: Release candidate (consider stable version for production)

---

## 5. Immediate Action Items

### Priority 1 - Do Now (5 minutes):
1. **Fix XSS vulnerability** in Dashboard.tsx:
   ```bash
   # Apply the textContent fix or DOMPurify sanitization
   ```

2. **Change Vite host binding**:
   ```bash
   # Update vite.config.ts to use 'localhost' instead of '0.0.0.0'
   ```

### Priority 2 - Do Soon (15 minutes):
1. **Add WebSocket protocol detection** for future-proofing
2. **Implement message length limits** in chat
3. **Add CSP meta tag** to index.html

### Priority 3 - Nice to Have (when time permits):
1. Consider updating to React stable version
2. Plan Vite major version upgrade
3. Add client-side rate limiting

---

## 6. Security Recommendations for Personal Use

### Data Backup Strategy
Since this is for personal medical learning:
1. **Regular backups**: Export your study materials periodically
2. **Version control**: Keep your uploaded documents in a separate backup folder
3. **Database backups**: Periodically backup the database with your learning progress

### Local Security Hygiene
1. **Keep browser updated**: Ensures latest security patches
2. **Use localhost only**: Never expose the app to public networks
3. **Review uploads**: Be cautious with files from untrusted sources
4. **Monitor disk space**: Ensure adequate space for your study materials

### Future Considerations
If you ever plan to:
- **Deploy online**: Implement proper authentication, HTTPS, and rate limiting
- **Share with others**: Add multi-user support and proper access controls
- **Use on mobile**: Implement secure API authentication

---

## 7. Code Examples for Fixes

### Complete XSS Fix for Dashboard.tsx
```tsx
// At the top of Dashboard.tsx
import DOMPurify from 'dompurify';

// Configure DOMPurify for filename sanitization
const sanitizeFilename = (filename: string): string => {
  return DOMPurify.sanitize(filename, {
    ALLOWED_TAGS: [],  // No HTML tags allowed
    KEEP_CONTENT: true // Keep text content
  });
};

// In the render method (line 118)
<h3 className="material-title">{sanitizeFilename(material.filename)}</h3>
```

### WebSocket Security Enhancement
```typescript
// In useChatSession.ts
function buildWebSocketUrl(baseUrl: string): string {
  // Auto-detect protocol based on page protocol
  if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
    // If production and not secure, warn user
    if (window.location.protocol === 'https:' && baseUrl.startsWith('ws://')) {
      console.warn('Insecure WebSocket connection on HTTPS page');
    }
    return baseUrl;
  }

  // Auto-upgrade to WSS if page is HTTPS
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return baseUrl.replace(/^(ws|wss):/, protocol);
}
```

---

## Conclusion

Your StudyIn dashboard is **safe for personal use** with no critical security issues that could cause data loss. The identified issues are primarily about following security best practices and protecting against edge cases.

**Recommended approach**:
1. Fix the XSS vulnerability immediately (5 minutes)
2. Update the Vite host binding (2 minutes)
3. Implement other improvements as time permits

The application demonstrates good security awareness with CSRF protection, token management, and error handling already in place. The suggested improvements will make it even more robust for your personal medical learning needs.

---

**Audit performed by**: Frontend Security Expert
**Next review recommended**: After implementing Priority 1 fixes or before any deployment