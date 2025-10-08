# 🔐 Environment Variable Security Guidelines

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🛡️ SECRET HYGIENE & SECURITY PROTOCOL 🛡️                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Purpose:  Prevent credential leaks, establish rotation protocol            ║
║  Scope:    All environment variables in .env.local, .env.production         ║
║  Audience: All contributors, CI/CD pipeline maintainers                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 📋 Pre-Commit/Pre-Push Checklist

Before committing or pushing code, **ALWAYS** verify:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [✓✓✓] MANDATORY SECURITY CHECKLIST                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ □ No .env.local or .env.production files staged for commit                  │
│ □ No API keys, tokens, or secrets in source code                            │
│ □ All secrets use environment variables via process.env                     │
│ □ NEXT_PUBLIC_* prefix only for truly public values                         │
│ □ No hardcoded URLs containing credentials                                  │
│ □ .env.example updated with new variable names (values as placeholders)     │
│                                                                              │
│ [✗✗✗] If ANY item unchecked: STOP and fix before committing                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚨 Critical Security Principles

### 1. Server-Only Secrets (Never NEXT_PUBLIC_)

```
┌────────────────────────┬────────────────────────────────────────────────────┐
│ [✓✓✓] SAFE             │ [✗✗✗] DANGEROUS                                    │
├────────────────────────┼────────────────────────────────────────────────────┤
│ SUPABASE_SERVICE_ROLE  │ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE                  │
│ INGEST_TOKEN           │ NEXT_PUBLIC_INGEST_TOKEN                           │
│ ANALYTICS_REFRESH_TOKEN│ NEXT_PUBLIC_ANALYTICS_REFRESH_TOKEN                │
│ GEMINI_API_KEY         │ NEXT_PUBLIC_GEMINI_API_KEY                         │
│ VAPID_PRIVATE_KEY      │ NEXT_PUBLIC_VAPID_PRIVATE_KEY                      │
└────────────────────────┴────────────────────────────────────────────────────┘

⚠️  CRITICAL: NEXT_PUBLIC_* variables are inlined into client bundles at build
             time and exposed to all users. Only use for truly public values!
```

**Next.js Security Model:**
- **Server-only**: `process.env.SECRET_KEY` → Only accessible in API routes, Server Components, getServerSideProps
- **Client-exposed**: `process.env.NEXT_PUBLIC_KEY` → Embedded in browser bundle, visible to all users

### 2. Environment File Hierarchy

```
Priority (highest → lowest):
    .env.production.local  ← Production secrets (NEVER commit)
    .env.local             ← Local dev secrets (NEVER commit)
    .env.development       ← Dev defaults (NEVER commit secrets here)
    .env.production        ← Production defaults (NEVER commit secrets here)
    .env.example           ← Template with placeholders (SAFE to commit)
```

**Git Configuration:**
```bash
# .gitignore should contain:
.env*.local
.env.development
.env.production

# Only .env.example should be committed
```

### 3. Secret Rotation Protocol

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔄 ROTATION SCHEDULE (Medical Education Platform Requirements)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ API Keys (Gemini, OpenAI, etc.)         Every 90 days or on suspicion       │
│ Service Role Keys (Supabase)            Every 180 days or on breach         │
│ Ingest Tokens                           Every 30 days                       │
│ Analytics Refresh Tokens                Every 60 days                       │
│ VAPID Keys (Push Notifications)         Every 365 days                      │
│ Session Secrets                         Every deployment (ephemeral)        │
└─────────────────────────────────────────────────────────────────────────────┘

📝 ROTATION PROCEDURE:
1. Generate new secret using provider's dashboard or crypto.randomBytes(32)
2. Update .env.local and .env.production.local
3. Deploy with zero-downtime strategy (dual-key support if possible)
4. Revoke old secret after 24-hour grace period
5. Document rotation in CHANGELOG.md
```

### 4. Current Audit Findings

**✅ COMPLIANT:**
- `SUPABASE_SERVICE_ROLE_KEY` correctly server-only (line 21 in .env.example)
- `INGEST_TOKEN` correctly server-only (line 3)
- `ANALYTICS_REFRESH_TOKEN` correctly server-only (line 13)

**⚠️ REVIEW NEEDED:**
- `NEXT_PUBLIC_DEV_UPLOAD` currently set to `0` (lines 32, 20 in playwright.config.js)
  - ✓ Correctly disabled in production/CI
  - ✓ Playwright enforces `NEXT_PUBLIC_DEV_UPLOAD=0` for E2E tests
  - ✅ No security risk

**🔒 BEST PRACTICES APPLIED:**
- Dev toggles correctly use `NEXT_PUBLIC_` prefix (safe, intentionally client-exposed)
- Secrets never use `NEXT_PUBLIC_` prefix (secure, server-only)
- `.env.example` contains only placeholders like `change-me` (lines 3, 13)

## 🛠️ Implementation Patterns

### Server-Side Secret Access (Secure)

```typescript
// ✅ API Route (Server Component)
// app/api/analytics/route.ts
export async function POST(request: Request) {
  const token = request.headers.get('authorization');

  // Server-only env var (never exposed to client)
  if (token !== process.env.ANALYTICS_REFRESH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process analytics...
}
```

### Client-Side Public Values (Intentional Exposure)

```typescript
// ✅ Client Component (values MUST be truly public)
// components/upload/UploadButton.tsx
'use client';

export function UploadButton() {
  // These are intentionally public feature flags
  const devUploadEnabled = process.env.NEXT_PUBLIC_DEV_UPLOAD === '1';
  const devToolsEnabled = process.env.NEXT_PUBLIC_DEV_TOOLS === '1';

  return (
    <button disabled={!devUploadEnabled}>
      Upload {devToolsEnabled && '(Dev Tools Active)'}
    </button>
  );
}
```

### Dynamic Environment Variables (Runtime Evaluation)

```typescript
// ✅ Server Component with runtime evaluation
// app/dashboard/page.tsx
import { connection } from 'next/server';

export default async function DashboardPage() {
  await connection(); // Opts into dynamic rendering

  // Evaluated at runtime, not build time (supports multi-env Docker images)
  const analyticsPath = process.env.ANALYTICS_OUT_PATH;
  const data = await readFile(analyticsPath);

  return <Dashboard data={data} />;
}
```

## 🔍 Verification Tools

### Pre-Commit Hook (Recommended)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing secrets

# Check for staged .env files
if git diff --cached --name-only | grep -E '\.env\.(local|development|production)$'; then
  echo "❌ ERROR: Attempting to commit .env.local or similar files"
  echo "   These files contain secrets and should NEVER be committed"
  exit 1
fi

# Check for hardcoded API keys in staged files
if git diff --cached -U0 | grep -E 'sk-[a-zA-Z0-9]{48}|AIza[a-zA-Z0-9_-]{35}'; then
  echo "❌ ERROR: Potential API key detected in staged changes"
  echo "   Use environment variables instead: process.env.YOUR_KEY"
  exit 1
fi

# Check for NEXT_PUBLIC_ usage with sensitive terms
if git diff --cached -U0 | grep -E 'NEXT_PUBLIC_(SECRET|KEY|TOKEN|PASSWORD)'; then
  echo "⚠️  WARNING: NEXT_PUBLIC_ prefix detected with sensitive term"
  echo "   NEXT_PUBLIC_ variables are exposed to client browsers!"
  echo "   Only use for truly public values (feature flags, public IDs)"
  read -p "   Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ Security pre-commit checks passed"
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Manual Audit Command

```bash
# Check for potential secrets in codebase
grep -r -E 'sk-[a-zA-Z0-9]{48}|AIza[a-zA-Z0-9_-]{35}' \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude='*.md' .

# Check for NEXT_PUBLIC_ misuse
grep -r 'NEXT_PUBLIC_.*\(SECRET\|KEY\|TOKEN\|PASSWORD\)' \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  .env.example

# Verify .gitignore coverage
git ls-files --others --ignored --exclude-standard | grep '.env'
```

## 📚 Reference Documentation

### Next.js Environment Variables
- **Official Docs**: https://nextjs.org/docs/app/guides/environment-variables
- **Security Best Practices**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
- **NEXT_PUBLIC_ Behavior**: Variables are inlined at build time, not runtime

### Key Patterns from Next.js Docs
1. **Server-only access**: Use `process.env` in API routes, Server Components, getServerSideProps
2. **Client exposure**: Only use `NEXT_PUBLIC_` prefix for values safe to expose
3. **Dynamic lookups**: `process.env[varName]` prevents inlining (use sparingly)
4. **Multiline secrets**: Use `\n` or actual newlines for private keys (see .env.example line 27 comment)

## 🎯 Studyin-Specific Guidelines

### Medical Education Platform Constraints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏥 HIGH-STAKES ENVIRONMENT (Student Learning Outcomes at Risk)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • API keys control LLM-generated MCQs → educational quality                 │
│ • Leaked ingest tokens → corrupted telemetry → broken adaptive algorithms   │
│ • Exposed service keys → unauthorized data access → FERPA/GDPR violations   │
│                                                                              │
│ ⚡ ZERO-TOLERANCE POLICY: Any secret leak requires immediate rotation        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Environment Variables (from .env.example)

```
SERVER-ONLY (Never NEXT_PUBLIC_):
  • INGEST_TOKEN              - Telemetry ingestion auth (line 3)
  • ANALYTICS_REFRESH_TOKEN   - Analytics endpoint auth (line 13)
  • SUPABASE_SERVICE_ROLE_KEY - Database admin access (line 21)
  • STUDY_NO_CAPS             - Dev override for exposure caps (line 28)
  • CONTEXT7_API_KEY          - Documentation lookup (line 36)

CLIENT-EXPOSED (Intentionally NEXT_PUBLIC_):
  • NEXT_PUBLIC_DEV_UPLOAD    - Feature flag for upload route (line 32)
  • NEXT_PUBLIC_DEV_TOOLS     - Feature flag for dev tools (line 33)
  • NEXT_PUBLIC_STUDY_NO_CAPS - Client-side exposure cap override (line 27)

PUBLIC CONFIGURATION (Safe to commit):
  • WRITE_TELEMETRY           - Boolean flag (line 2)
  • EVENTS_PATH               - File path (line 4)
  • INGEST_MAX_BYTES          - Numeric limit (line 5)
```

## 🏆 Achievement Unlocks

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎖️ SECURITY ACHIEVEMENTS                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ [    ] Secret Keeper       - 30 days with zero committed secrets            │
│ [    ] Rotation Champion   - Complete one full rotation cycle               │
│ [    ] Audit Master        - Run manual audit before every PR               │
│ [    ] Hook Guardian       - Install pre-commit hook on all dev machines    │
│ [    ] Zero Trust Pro      - Enforce least-privilege on all API keys        │
└─────────────────────────────────────────────────────────────────────────────┘

💎 +25 XP: Read this document
💎 +50 XP: Install pre-commit hook
💎 +100 XP: Complete first secret rotation
💎 +200 XP: Achieve "Secret Keeper" badge (30-day streak)
```

---

**Last Updated**: 2025-10-08
**Next Rotation Due**: Check individual secret rotation schedule above
**Audit Status**: ✅ Compliant (all secrets server-only, dev flags correctly public)
