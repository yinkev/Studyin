# Backend Services Implementation Plan

## Overview
This plan translates the backend roadmap for Studyin into executable work. The goal is to unlock deterministic telemetry, blueprint-compliant exam delivery, and trustworthy analytics while preserving our local-first workflow so we can graduate to Supabase later without rework. All services must remain deterministic (no runtime LLM calls) and respect acceptance gates in `AGENTS.md`.

## High-ROI Priorities (v2)
1. **Telemetry & Snapshots** — Keep ingestion deterministic; store attempts/sessions in Supabase, insert analytics snapshots, expose `/api/snapshots/latest`, and schedule hourly refresh.
2. **Reliability Metrics** — Extend analyzer to compute point-biserial per item and KR‑20/α per exam form; surface drift and velocity metrics.
3. **Temporal RAG** — Build pgvector-backed evidence index with time-aware ranking; deliver `/api/search` and offline indexer scripts.
4. **React Flow Analytics** — Visualize confusion edges, blueprint gaps, and session traces via React Flow with full accessibility support.
5. **Governance & Safeguards** — Harden env management, Supabase RLS, privacy scrubbing, and maintain deterministic outputs for audits.

## Architecture & Files
- **Telemetry ingestion**
  - `app/api/attempts/route.ts`: node runtime, validates request body via shared helper, strips unknown fields, appends to `data/events.ndjson`.
  - `app/api/sessions/route.ts`: mirrors attempts route for session events.
  - `lib/server/events.ts`: shared helpers (`assertAttempt`, `assertSession`, `appendNdjsonLine`, token guard, basic rate limiter).
- **Blueprint forms**
  - `app/api/forms/route.ts`: fetches items via `lib/getItems.ts:63`, filters by status when `publishedOnly=1`, seeds RNG, builds deterministic form.
  - `lib/server/forms.ts`: wraps blueprint derivation and item filtering for reuse (exam UI, future drills, Supabase adapters).
- **Analytics refresh**
  - `scripts/lib/analyzer-core.mjs`: exports `loadEvents(path)` and `summarizeAttempts(attempts)` currently inline in `scripts/analyze.mjs`.
  - `app/api/analytics/refresh/route.ts`: admin/token-guarded endpoint that loads attempts, runs analyzer core, writes `public/analytics/latest.json`.
  - `scripts/analyze.mjs`: refactored to reuse analyzer core to avoid double maintenance.
- **Governance & safeguards**
  - `.env.example`: document `WRITE_TELEMETRY`, `INGEST_TOKEN`, `EVENTS_PATH`, `ANALYTICS_OUT_PATH`, `USE_SUPABASE_INGEST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `READ_ANALYTICS_FROM_SUPABASE`.
  - `scripts/lib/schema.mjs`: export `stripUnknown<T>(schema, data)` helper for routes.
  - `supabase/schema.sql`: attempts/sessions/analytics_snapshots/evidence_chunks tables with indexes and constraints.
  - `supabase/policies.sql`: RLS rules (attempts/sessions insert-only; analytics snapshots + evidence chunks read-only for anon/auth, insert via service role).
- **Evidence & exam hardening**
  - `components/ExamView.tsx`: switch to consuming `/api/forms`, display blueprint progress, keep evidence locked.
  - `README.md`, `AGENTS.md`: reinforce evidence latency (<250 ms), telemetry token usage, and blueprint expectations.

## Interfaces & Contracts
- `POST /api/attempts` — Request: `AttemptEvent`; token auth; 201 on success; supports Supabase sink.
- `POST /api/sessions` — Request: `SessionEvent`; token auth; 201.
- `GET /api/forms?length=<int>&seed=<int>&publishedOnly=<0|1>` — Deterministic blueprint form; 409 with deficits when infeasible.
- `POST /api/analytics/refresh` — Guarded by `ANALYTICS_REFRESH_TOKEN`; writes latest.json, inserts snapshot; returns `{generated_at, totals}`.
- `GET /api/snapshots/latest` — Returns `{generated_at, schema_version, payload}` of newest snapshot (service role only).
- `GET /api/search?q&lo&since&k` — Temporal RAG retrieval (pgvector) returning citation-rich evidence chunks (deterministic ranking).
- `/api/health` — Reports telemetry flags, Supabase usage, snapshot timestamps.

## Data Model Impacts
- **Local-first**: NDJSON append remains possible; rotation backlog.
- **Supabase**: `attempts`, `sessions`, `analytics_snapshots`, `evidence_chunks` (pgvector). All writes via service role; RLS enforced.
- **Snapshots**: analytics history stored as JSONB; hourly job ensures freshness.
- **RAG**: embeddings stored as vector(768) with `ts` + `version` metadata for temporal decay.

## File-by-File Changes (execution order)
1. `lib/server/events.ts` — optional Supabase sink, rate limiting.
2. `app/api/attempts/route.ts`, `app/api/sessions/route.ts` — ingestion routes.
3. `scripts/lib/analyzer-core.mjs` — TTM/ELG/min, confusion, speed, reliability (point-biserial, KR‑20/α), drift.
4. `app/api/analytics/refresh/route.ts` — refresh, Supabase loader, snapshot insert.
5. `app/api/snapshots/latest/route.ts` — latest snapshot retrieval.
6. `lib/server/forms.ts`, `app/api/forms/route.ts` — blueprint builder reused by Exam.
7. `supabase/schema.sql`, `supabase/policies.sql` — attempts/sessions/snapshots/evidence_chunks and RLS.
8. `scripts/rag/build-index.mjs`, `scripts/rag/verify-index.mjs`, `app/api/search/route.ts` — temporal RAG pipeline + API.
9. `components/graphs/*` — React Flow graphs for confusion, blueprint gaps, session traces.
10. `.env.example`, `README.md`, `AGENTS.md`, `PLAN.md` — documentation + milestones.

## Testing & Validation
- Unit tests (`tests/api/events.test.ts`): ingestion validation + rate limits.
- Unit tests (`tests/api/forms.test.ts`): deterministic form builds + deficit reporting.
- Unit tests (`tests/api/analyzer.test.ts`): analytics summary + reliability metrics.
- Unit tests (`tests/api/search.test.ts`): RAG ranking deterministic against fixture embeddings.
- Integration: ingestion → refresh → snapshot insertion verified; React Flow renders pass axe; RAG recall@k >= target in verify script.
- Unit tests for analyzer core (relocate portions of `tests/engines.test.mjs` or add new `tests/analyzer.test.mjs`) to ensure identical output pre/post refactor.
- Integration smoke: run `npm run analyze` after posting sample attempts to confirm `public/analytics/latest.json` updates `totals` correctly.
- Acceptance: `npm run validate:items`, `npm test`, `npm run analyze`, optionally `npm run pm:pulse` after new endpoints.

## Observability & Telemetry
- Structured logging per route (`console.error({ route, error })`).
- `/api/health` returns telemetry flags, Supabase usage, and `last_generated_at`.
- Future: emit metrics to Supabase (counts) or external sink; maintain deterministic logs for audits.

## Security & Privacy
- Enforce bearer token when `WRITE_TELEMETRY=1`; local dev only may relax.
- Strip unknown fields; reject schema_version mismatches.
- Cap request size 10 KB; respond 413 on overflow.
- Pseudonymous IDs only; evidence chunks scrubbed for PII before indexing.
- Supabase RLS: anon insert-only, service role for admin tasks, read-only for analytics/evidence.

## Rollout & Backout Strategy
- Branch: `feat/backend-ingestion`.
- Milestone order matches ROI list; merge each step behind feature flags (`WRITE_TELEMETRY`, `ANALYTICS_REFRESH_TOKEN`).
- Backout: remove routes and helpers; restore previous `scripts/analyze.mjs` if required (keep git tag before refactor).
- ProjectManager to update `PLAN.md` after each merge; ReleaseManager verifies validator/tests/analytics/axe/LH gates.

## Execution Phases (sequence, no dates)
- Foundation: Docs sweep, ensure validator green, wire `/api/snapshots/latest`, and schedule analytics refresh.
- Reliability: Extend analyzer for point‑biserial and KR‑20/α; add tests and update `latest.json` consumers.
- Retrieval: Build RAG indexer and `/api/search`; create `evidence_chunks` store; add deterministic ranking tests.
- Visualization: Enhance React Flow graphs (confusion, blueprint gaps, sessions) with OKC polish.
- Governance: Automate rubric scoring in PRs, keep PLAN updated post‑merge, and document any perf justifications.

## Risk Register
| Risk | Owner | Status | Mitigation |
| --- | --- | --- | --- |
| NDJSON growth causes slow appends | Implementation Strategist | Open | Plan rotation threshold + optional Supabase migration.
| Token leakage in client bundle | Security/Privacy (DataSteward) | Open | Require server-side ingestion proxy for production; document in README.
| Blueprint infeasible error confuses users | QA-Proctor | Open | Surface deficits clearly in API response; add UI messaging.
| Analytics divergence post-refactor | AnalyticsEngineer | Open | Snapshot old/new outputs during refactor; add regression test.
| Supabase rollout delays | ProjectManager | Open | Keep local-first workflow functional; schedule migration separately.
