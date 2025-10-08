# Supabase Setup (Optional Cloud Stub)

This optional path mirrors local, deterministic telemetry and analytics snapshots to Supabase for inspection. It is disabled by default and should only be enabled in trusted, vetted environments.

## 1) Prerequisites

- Supabase project (PostgreSQL 15+) with Row Level Security enabled
- Access to SQL editor or `psql`
- Service Role Key (server‑only)

## 2) Create Schema

Run these from the repository root in the Supabase SQL editor:

```
-- Tables + extensions
-- supabase/schema.sql
```

This creates tables: `attempts`, `sessions`, `analytics_snapshots`, `evidence_chunks` and enables `pgcrypto` + `pgvector`.

## 3) Apply RLS Policies

Apply baseline read/insert policies and enable RLS:

```
-- Policies
-- supabase/policies.sql
```

Tighten policies before exposing any authenticated APIs.

## 4) Configure Environment

Add to `.env.local` (development) or Vercel Project Settings (production‑like preview):

```
USE_SUPABASE_INGEST=1
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` server‑only. Never expose to the client.
- Leave `USE_SUPABASE_INGEST` unset in production unless the DataSteward has approved.

## 5) Ingestion Helpers

Utilities:
- lib/server/supabase.ts — lightweight client wrappers
- scripts/lib/supabase-ingest.mjs — push analytics snapshots (`pushAnalyticsSnapshot`), insert attempt/session rows

Recommended usage:
- Mirror analytics after `npm run analyze`
- Batch insert evidence chunks for search/RAG experiments

## 6) Validation & Monitoring

- Verify new rows appear after a study session
- Confirm RLS denies updates/deletes unless explicitly allowed
- Monitor table sizes and set retention for `analytics_snapshots`

## 7) Security Checklist

- Do not enable `USE_SUPABASE_INGEST` outside vetted environments
- Keep Service Role Key out of client bundles and logs
- Scrub any PII before indexing into vector search

