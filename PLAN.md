# Studyin Plan (V6)

## Vision
- Build a local-first, evidence-anchored study engine that ingests structured sources, teaches with interactive lessons, drills with deterministic MCQs/spotters, tracks telemetry, and retrieves via temporal + personal RAG while Codex-CLI remains the automation brain.

## Recent Merge Log
- 2025-09-29 — PR #10 merged into `main` (OKC-heavy UI, analytics cards, lessons scaffolding). Follow-ups: fix GLTFLoader CDN (done), regenerate analytics, quick UI sanity on Home/Study/Summary.

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
- Run LO-Extractor on a real module asset; refresh `config/los.json` (A).  
- Draft 5–10 LessonSmith concept cards + timelines (A).  
- Author 10–15 ItemSmith MCQs with evidence; loop `npm run validate:items` (A).  
- Implement RAG recall@10 harness + expose “why this rank” numerics in UI (B).  
- Finish `/api/search` temporal decay + Supabase/Chroma adapter (B).  
- Schedule analytics refresh (cron/n8n) + monitor `/api/health` (B/C).  
- React Flow editors + OKC polish (D).  
- Publish evidence latency check (P95 <250 ms) + document in README (governance).

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.  
- Weekly: run `npm run score:rubric`; attach `public/analytics/rubric-score.json` to tracker; flag ★ < 2.8.  
- Release: gates green (validator, perf, rubric). A11y non‑blocking in OKC phase. Evidence latency spot‑check; blueprint preflight passes.

## Single Next Step
Run Codex LO-Extractor on one real PPT/PDF → update `config/los.json`. Follow with LessonSmith for 5–10 LOs and ItemSmith for 10–15 MCQs; iterate until `npm run validate:items` reports ✓.
