# Optional Supabase Ingestion (Dev Stub)

This workflow keeps runtime deterministic while allowing you to push telemetry and evidence into Supabase for inspection. It is **disabled by default**—enable it only for trusted environments.

## 1. Prerequisites
- Supabase project (PostgreSQL 15+) with Row Level Security enabled.
- Access to the SQL editor or psql client.
- Service role key (used server-side only).

## 2. Database Schema
Run each section from the repository root:

```sql
-- supabase/schema.sql
```

The script creates four tables (`attempts`, `sessions`, `analytics_snapshots`, `evidence_chunks`) and enables `pgcrypto` + `pgvector`.

## 3. Row Level Security
Apply the policies (public read, insert-only ingestion) and enable RLS:

```sql
-- supabase/policies.sql
```

You can tighten policies later (e.g., per-user access) once you introduce authentication.

## 4. Environment Variables
Add the following to `.env.local` or your deployment environment:

```
USE_SUPABASE_INGEST=1
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

- `USE_SUPABASE_INGEST` gates the optional ingestion path. When unset, the app continues to log to NDJSON only.
- The service role key must remain server-only. Never expose it to client bundles.

## 5. Ingestion Path (optional)
When the flag is enabled, helper functions in `lib/server/supabase.ts` and `scripts/lib/supabase-ingest.mjs` can:
- Insert attempt/session telemetry (`insertAttemptRow`, `insertSessionRow`).
- Fetch telemetry snapshots and evidence chunks (`fetchAttempts`, `fetchEvidenceChunks`).
- Push analytics snapshots via `pushAnalyticsSnapshot` (used by `scripts/analyze.mjs`).

Hook these into offline jobs or CLI scripts (e.g., `scripts/analyze.mjs`, `scripts/rag/build-index.mjs`) to mirror data into Supabase.

## 6. Validation Checklist
- Verify `attempts` rows appear after running your ingestion script.
- Confirm RLS prevents updates/deletes unless you configure additional policies.
- Keep `USE_SUPABASE_INGEST` disabled in production until security review is complete.
 - When using the GitHub Action (`.github/workflows/analytics-sync.yml`), confirm secrets are injected and snapshots appear under `analytics_snapshots`.

## 7. Next Steps
- Add Supabase credentials to CI secrets if you plan to run ingestion in pipelines.
- Extend policies with authenticated roles before exposing APIs.
- Monitor long-term metrics by consuming the Supabase analytics snapshots (mirrored nightly by the workflow above).
