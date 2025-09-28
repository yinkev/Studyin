# Studyin Plan (V5)

## Milestones

1) Telemetry & Snapshots — IN PROGRESS
- Supabase ingestion (attempts/sessions) + NDJSON fallback — DONE
- Analytics refresh API + snapshots table + hourly automation
- `/api/health` with `last_generated_at`

2) Advanced Analytics — IN PROGRESS
- Reliability metrics (point-biserial, KR‑20/α)
- Drift + velocity tracking (LO mastery, difficulty)
- Snapshot history explorer (React Flow overlays)

3) Temporal RAG — TODO
- pgvector `evidence_chunks` table & indexer scripts
- Deterministic `/api/search` with temporal decay
- QA harness (recall@k checks)

4) Analytics Graphs — TODO
- React Flow confusion graph & blueprint gap explorer
- Session trace view with keyboard navigation
- Axe + performance audits

5) Governance & CI — IN PROGRESS
- CI: validate/test/analyze/axe/Lighthouse
- PLAN/README/AGENTS/IMPLEMENTATION sync — DONE
- Monitor hourly refresh + alerting backlog

## To‑Do (ordered by ROI)

- Docs sweep — README/AGENTS/IMPLEMENTATION/PLAN update (DocScribe) ✅
- Telemetry: snapshots insert + `/api/snapshots/latest`; schedule hourly refresh ✅ (cron scheduling backlog)
- Analytics: add reliability metrics + drift analytics; bump latest.json schema ✅ (drift backlog)
- RAG: scaffold pgvector table, indexer (`scripts/rag/build-index.mjs`), verify script, `/api/search` ✅ (quality tuning backlog)
- React Flow: build confusion + blueprint graphs; ensure accessibility/perf budgets ✅ (session trace iteration ongoing)
- Governance: supersede env docs, Supabase RLS audit, plan alerting on refresh failures
- CI: extend tests for RAG + analytics metrics; keep Lighthouse/axe budgets green
- Evidence: continue crop improvements, publish vetted items, align with RAG chunks

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.
- Weekly: run `npm run score:rubric` and publish the snapshot.
- Release: gates green (validator, a11y, perf, rubric); evidence latency spot‑check; blueprint preflight passes.
