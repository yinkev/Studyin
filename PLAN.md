# Studyin Plan (V7)

## Vision
- Build a local-first, evidence-anchored study engine that ingests structured sources, teaches with interactive lessons, drills with deterministic MCQs/spotters, tracks telemetry, and retrieves via temporal + personal RAG while Codex-CLI remains the automation brain.

## Recent Merge Log
- Latest — OKC-heavy UI, analytics cards, lessons scaffolding landed; GLTFLoader CDN fixed; analytics regenerated.

### 2025-10-02 — Health Check CI PR (#13)
- Finalized GET `/api/health` + test; CI build green; Vercel deploy ok.
- Outcome: added durable CI signal for future PRs.

### 2025-10-02 — “Why this next” Pill UI PR (#14)
- Added deterministic pill component (no runtime LLM); wired into StudyView; tests added.
- Guarded exam form builder to surface deficits when published-only pool is too small.
- Outcome: transparency increase with minimal risk; main remains green via required build check.

## Milestone — 2025-10-02 · Health Check CI PR
- Branch: `feat/health-check-ci` (local). Scope: `app/api/health/route.ts`, `tests/api/health.test.ts`.
- Validator: ✓ 0 errors (30 items). Blueprint tracked; statuses {review: 4, draft: 26}.
- Analyze: ✓ `public/analytics/latest.json` refreshed deterministically (primary delta `generated_at`).
- Tests: ✓ 10 files, 33 tests passed (vitest).
- Integrity: no item edits; `schema_version`/evidence unchanged; clinical text/rationales untouched.

Next agent: ReleaseManager · Model: gpt-5-codex-high · Scope: app/api/** tests/api/**
- Actions: open PR “feat(api): harden health check and add test”; verify CI (validate/analyze/tests) and merge if green.

Next agent: ProjectManager · Model: gpt-5-codex-high · Scope: PLAN.md docs/**
- Actions: track follow-ups — (1) LO extractor kick-off, (2) “Why this next” pill wiring using `public/analytics/latest.json`, (3) schedule analytics refresh.

## Module Inputs
- MODULE: <fill at epic kickoff>
- SYSTEM/SECTION: <optional>
- BLUEPRINT_PATH: `config/blueprint.json` (override via env)
- SCOPE_DIRS: `content/banks/**` (CSV or glob)
- METRICS_SOURCE: `public/analytics/latest.json`

## Non-Negotiables
- Evidence pill everywhere (local file + page/figure/crop or web URL + access date).  
- Deterministic runtime (scoring, blueprint weights, temporal ranking in code—no runtime LLM calls).  
- High-yield layer per LO (pitfalls, exceptions, Step 1 relevance).  
- Deep telemetry (lesson reveals, animation dwell, evidence opens, attempts, retrieval).  
- Local-first today; cloud (Vercel/Supabase) is optional acceleration, never a blocker.

## Temporal + Personal RAG
- Ranking score: `final = α·cosine + λ·recency(doc) + μ·recency(lastWrongOnLO) + ν·underReviewedLO − γ·staleness`.  Defaults α=1.0, λ=0.25, μ=0.35, ν=0.15, γ=0.20, τ≈60d.
- Always expose the score breakdown (“Why this next” pill).  
- Eval harness: 25–50 seeded queries with ground-truth chunks; measure Recall@10/MRR@10 for MiniLM baseline, temporal boost, and any upgrades before adoption.

## Milestones (A–D cadence)

### A — Core Feel (IN PROGRESS)
- Types + `scripts/validate-items.mjs` (hard gate) — DONE.
- Study (evidence-first) + Exam (blueprint) + event logging — IN PROGRESS (keyboard + evidence dialog shipped; continue QA).
- LO extraction pipeline (`config/los.json`) from real PPT/PDF — NEXT STEP.
- LessonSmith cards + animations for 5–10 LOs — TODO.
- Author ≥60 items; keep validator green — BACKLOG (current bank ~30 items).

### B — Retrieval & Insights (IN PROGRESS)
- `scripts/analyze.mjs` → `public/analytics/latest.json` (TTM, ELG/min, confusion, speed-accuracy, reliability) — DONE; drift overlays BACKLOG.
- Deterministic RAG stack (chunker, embeddings, Chroma/LanceDB or pgvector) — IN PROGRESS (indexer stub shipped; needs defaults + recall harness).
- `/api/search` temporal scoring + transparency — TODO.
- Insights view surfaces mastery, TTM, evidence efficacy, “why this next” with numeric backing — IN PROGRESS.

### C — Optional Cloud (BACKLOG)
- Supabase tables + RLS (attempts/sessions/analytics_snapshots/evidence_chunks) — PARTIAL (schema in repo, rollout pending).
- Vercel preview URLs, `/api/ingest/*`, cron for nightly refresh — TODO.
- Ensure runtime retrieval remains local; cloud is additive only.

### D — Authoring Speed (BACKLOG)
- React Flow timeline editor + RAG inspector — PARTIAL (graphs exist; authoring editors pending visual polish).
- n8n local automations (ingest, nightly refresh, evidence backups) — TODO.
- Anki styling (Tailwind-compiled CSS + QSS) — TODO.

### E — Adaptive Engine (NEW)
- Rasch/GPCM online updater with Elo cold‑start bridge; EAP via 41‑point GH; mastery probability and stop rules.
- In‑session selector with utility multipliers (blueprint/exposure/fatigue), randomesque top‑K.
- Cross‑topic Thompson Sampling scheduler optimizing `ΔSE/min` with rails and cooldowns.
- FSRS retention lane with overdue boosts and time budgeting; training↔retention handoff.
- Weekly EM re‑fit job for GPCM thresholds and difficulty shrinkage; reliability checks.

## Module-Agnostic Checklist
- Provide MODULE/SYSTEM/SECTION + `BLUEPRINT_PATH`, `LOS_PATH`, `SCOPE_DIRS`, `METRICS_SOURCE` per epic.  
- Maintain PRD ≥92/100 (★ ≥2.9) then IMPLEMENTATION ≥92/100 before shipping.  
- Update `PLAN.md` post-merge (ProjectManager), keep `README.md`, `AGENTS.md`, `PRD.md`, `IMPLEMENTATION.md` in sync.

## De-Hardcode Initiative (module agnostic)
- `scripts/validate-items.mjs` now reads `SCOPE_DIRS` (CSV or glob under `content/banks/**`); `BLUEPRINT_PATH`/`LOS_PATH` env overrides supported.  
- `scripts/rag/build-index.mjs` accepts `BANK_DIRS`/`SCOPE_DIRS` (defaults to recursive bank scan).  
- UI fallbacks avoid module names (e.g., Study empty state).  
- Follow-up: extend indexer to image embeddings (CLIP) once MiniLM + temporal eval hits target uplift.

## To‑Do (Ordered by ROI)
- Run LO‑Extractor on a real module asset; refresh `config/los.json` (A).  
- Draft 5–10 LessonSmith concept cards + timelines (A).  
- Author 10–15 ItemSmith MCQs with evidence; loop `npm run validate:items` (A).  
- Expose “Why this next” pill using `ttm_per_lo` and `elg_per_min` from `public/analytics/latest.json` (B).  
- Implement RAG recall@k harness and document thresholds; verify `/api/search` ranking (B).  
- Schedule analytics refresh (cron/n8n) and monitor `/api/health` (B/C).  
- React Flow editors + OKC polish (D).  
- Publish evidence latency check (P95 <250 ms) and document expectations in README (governance).  
- Run `npm run score:rubric` and attach `public/analytics/rubric-score.json` to tracker (PM cadence).
- Adaptive Engine Week 1 (in progress): telemetry + learner-state persistence + TS scheduler wired into Study UI ✅; next—integrate FSRS retention lane, analytics dashboards (Priority/Stalled/Overexposed), and weekly EM refit job.

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.  
- Weekly: run `npm run score:rubric`; attach `public/analytics/rubric-score.json` to tracker; flag ★ < 2.8.  
- Weekly: run `npm run jobs:refit`; review `data/refit-summaries/` output with AnalyticsEngineer before rollouts.  
- Weekly GitHub Action (`refit-weekly.yml`) runs `npm run jobs:refit`, uploads the artifact, and serves as the automation path for refit summaries (replace with n8n/cron if operating offline).  
- Release: gates green (validator, perf, rubric). A11y non‑blocking in OKC phase. Evidence latency spot‑check; blueprint preflight passes.

## PR Hygiene (superseded branches)
- Merged: PR #11 (codex/complete-phase-3) — unified learner-state with adaptive engine and optimistic Study UI.
- Superseded: PRs #1–#9 (early Codex branches) conflict with current engine/UI. Preferred path is to cherry-pick any still-useful assets (e.g., item JSONs, chart components). Most of these assets already exist on `main`.
- Action: Close PRs #1–#9 as superseded. If any missing asset is needed, create a fresh branch from `main` and port it with minimal diffs + validators/tests.

## Single Next Step
Run LO‑Extractor on one real PPT/PDF → update `config/los.json`. Follow with LessonSmith for 5–10 LOs and ItemSmith for 10–15 MCQs; iterate until `npm run validate:items` reports ✓.
