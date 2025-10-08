# Deployment Guide (Vercel)

Deploy Studyin to production using Vercel. Keep engines deterministic and dev‑only features disabled.

## Prerequisites

- Vercel account with access to target project
- Node.js 20.x runtime (Vercel project setting)

## One‑Time Setup

1. Import the GitHub repository in Vercel.
2. Set Framework Preset: Next.js (App Router).
3. Set Node version to 20.x in Project Settings → Environment.

## Environment Variables

Required for production:
- `NEXT_PUBLIC_DEV_UPLOAD` — must be unset (dev‑only upload route)
- `WRITE_TELEMETRY` — `0` (default) or `1` to write local NDJSON

Optional telemetry cloud stub (off by default):
- `USE_SUPABASE_INGEST` — `0` (default). Enable only in vetted envs.
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server‑only)

Optional analytics:
- `INGEST_TOKEN` — if you run remote ingestion gateways

## Build & Runtime

Vercel builds using `next build` and runs serverless functions as needed.

Local verification:
```
npm test
npm run build
```

## Production Checklist

- Dev‑only route `/upload` disabled (no `NEXT_PUBLIC_DEV_UPLOAD`)
- Determinism: no runtime LLM/API calls in engine paths
- Performance budgets observed (TTI <2s, item render <100 ms, evidence <250 ms)
- `scripts/worker.ts` not running in production; queue is local‑only

## Rollback

- Use Vercel Deployments to revert to a previous successful build.
- Keep content immutable for published items; version evidence updates separately.

