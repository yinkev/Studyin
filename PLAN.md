# Studyin Plan: Phase 1 MVP - The Personal Learning Companion

## Primary Goal
The singular focus of this phase is to build a **local-first, private, and intelligent learning companion**. The user will be able to upload their own study materials, have them transformed into interactive lessons by an AI, and receive personalized guidance on what to study next. All user data and AI processing will remain on the user's local machine.

## Core User Workflow
The entire MVP experience is built around a simple, powerful loop:
1.  **Upload:** The user uploads a source file (e.g., lecture notes).
2.  **Process:** A local AI process analyzes the file, enriches it with web research, and generates a structured, interactive lesson.
3.  **Study:** The user studies the new lesson. The system tracks their performance and uses it to guide future study sessions.

---

## MVP Feature Set & Design Decisions

This section supersedes the archived planning content below. This is the definitive scope for the MVP.

### 1. Architecture & Technology
- **Local-First:** All processing and data storage are confined to the user's machine. No cloud servers will be used for AI processing or data persistence in this phase.
- **AI Engine:** A local AI CLI (e.g., `gemini-cli`, `codex-cli`) will be orchestrated by the application using the `clink` tool.
- **Personalization Engine:** A lightweight deterministic engine running in the browser will handle personalization, scheduling, and analytics.

### 2. The AI Tutor (Content Processing)
- **Trigger:** Initiated when a user uploads a file on the `/upload` page.
- **Grounding:** The AI will use **web search** (`google_web_search` tool) to ground and enrich the content.
- **Source Hierarchy:** The **Uploaded File is "Ground Truth."** The AI must not contradict the source file but can use web search for clarification, examples, and supplementary detail.
- **Output:** The AI will generate:
    1.  An **Interactive Lesson** in a structured JSON format.
    2.  A list of **suggested tags** for the lesson.

### 3. Content & File Management
- **Tagging:** The AI will auto-suggest tags. The user will be presented with these suggestions and have the final say to confirm, edit, or add tags before saving.
- **File Organization:** The UI will provide a simple way to view and manage uploaded files and their corresponding lessons.

### 4. The Study Experience
- **Personalization Coach:** The browser-based engine will suggest the next best topic to study.
- **User Control:** The user has **full control**. They can accept the Coach's suggestion or enter a "Manual Mode" to browse and study any lesson they choose.
- **Interactive Lessons (V1 Format):** Lessons will be composed of a sequence of blocks, including `headings`, `text_blocks`, and `multiple_choice_questions`.
- **Confidence-Based Assessment:** After answering a question, the user will be prompted to rate their confidence (`High`, `Medium`, `Low`). This data will be used by the Personalization Coach.

### 5. Error Handling
- A simple, clear message ("An error occurred. Please try again.") will be displayed if the AI fails to process a file.

---
---

> ## Archived Planning (Superseded by Phase 1 MVP)
>
> *The following content is preserved for historical context. The official plan for the current development cycle is detailed in the "Phase 1 MVP" section above.*
>
> # Studyin Plan (V7)
>
> ## Vision
> Build a local-first, evidence-anchored study engine that ingests structured sources, teaches with interactive lessons, drills with deterministic MCQs/spotters, tracks telemetry, and retrieves via temporal + personal RAG while Codex-CLI remains the automation brain.
>
> ## Core User Journey (The "Magic Moment")
>
> To keep the project anchored, all near-term development should serve the following core user flow:
>
> 1.  **Analyze (A):** User uploads a source file (PPT, PDF). The app runs the **LO-Extractor** and presents a summary of the key Learning Objectives.
> 2.  **Baseline (B):** The app immediately generates a short (e.g., 5-question) diagnostic quiz using **ItemSmith** MCQs to gauge the user's initial knowledge.
> 3.  **Teach (C):** Based on the quiz, the app presents the first interactive **LessonSmith** card to begin the guided learning process.
>
> This `Analyze -> Baseline -> Teach` sequence provides immediate value, creates an engaging learning loop, and generates the initial telemetry required for the adaptive engine.
>
> ## Recent Merge Log
> - Latest — OKC-heavy UI, analytics cards, lessons scaffolding landed; GLTFLoader CDN fixed; analytics regenerated.
>
> ### 2025-10-02 — Health Check CI PR (#13)
> - Finalized GET `/api/health` + test; CI build green; Vercel deploy ok.
> - Outcome: added durable CI signal for future PRs.
>
> ### 2025-10-02 — “Why this next” Pill UI PR (#14)
> - Added deterministic pill component (no runtime LLM); wired into StudyView; tests added.
> - Guarded exam form builder to surface deficits when published-only pool is too small.
> - Outcome: transparency increase with minimal risk; main remains green via required build check.
>
> ## Milestone — 2025-10-02 · Health Check CI PR
> - Branch: `feat/health-check-ci` (local). Scope: `app/api/health/route.ts`, `tests/api/health.test.ts`.
> - Validator: ✓ 0 errors (30 items). Blueprint tracked; statuses {review: 4, draft: 26}.
> - Analyze: ✓ `public/analytics/latest.json` refreshed deterministically (primary delta `generated_at`).
> - Tests: ✓ 10 files, 33 tests passed (vitest).
> - Integrity: no item edits; `schema_version`/evidence unchanged; clinical text/rationales untouched.
>
> Next agent: ReleaseManager · Model: gpt-5-codex-high · Scope: app/api/** tests/api/**
> - Actions: open PR “feat(api): harden health check and add test”; verify CI (validate/analyze/tests) and merge if green.
>
> Next agent: ProjectManager · Model: gpt-5-codex-high · Scope: PLAN.md docs/**
> - Actions: track follow-ups — (1) LO extractor kick-off, (2) “Why this next” pill wiring using `public/analytics/latest.json`, (3) schedule analytics refresh.
>
> ## Zen MCP Consensus (2025-10-06)
> - Architecture: strict 4-layer boundary — UI (`app/**`, `components/**`) → Server (`app/api/**`, server actions) → Engine Shims (`lib/engine/shims/**`) → Deterministic Core (`scripts/lib/*.mjs`). No UI/domain importing `scripts/lib` directly.
> - Engine: Rasch+GPCM with Elo cold-start, Thompson Sampling scheduler over ΔSE/min, FSRS retention budgeting; randomesque top‑K; blueprint rails ±5%; exposure caps ≤1/day, ≤2/week with 96h cooldown; stop rules per spec.
> - Telemetry: log engine signals for every selection/attempt (“reason” + multipliers + θ̂/SE) to NDJSON; keep pseudonymous; optional Supabase sink behind `USE_SUPABASE_INGEST=1`.
> - RAG: deterministic indexer + `/api/search` implemented; add recall harness and docs; surface temporal + mastery signals in “Why this next”.
> - Performance: assert budgets (item render <100 ms; evidence <250 ms P95); add small perf tests; keep CLS <0.1 via fixed chip sizes.
>
> Consensus Owners
> - AdaptiveEngineer: engine shims + signals logging.
> - AnalyticsEngineer: analyzer stability + recall harness.
> - UIBuilder: StudyView integration and pill polish.
> - ProjectManager: cadence, PLAN upkeep, gate checks.
>
> ## Module Inputs
> - MODULE: <fill at epic kickoff>
> - SYSTEM/SECTION: <optional>
> - BLUEPRINT_PATH: `config/blueprint.json` (override via env)
> - SCOPE_DIRS: `content/banks/**` (CSV or glob)
> - METRICS_SOURCE: `public/analytics/latest.json`
>
> ## Non-Negotiables
> - Evidence pill everywhere (local file + page/figure/crop or web URL + access date).  
> - Deterministic runtime (scoring, blueprint weights, temporal ranking in code—no runtime LLM calls).  
> - High-yield layer per LO (pitfalls, exceptions, Step 1 relevance).  
> - Deep telemetry (lesson reveals, animation dwell, evidence opens, attempts, retrieval).  
> - Local-first today; cloud (Vercel/Supabase) is optional acceleration, never a blocker.
>
> ## Temporal + Personal RAG
> - Ranking score: `final = α·cosine + λ·recency(doc) + μ·recency(lastWrongOnLO) + ν·underReviewedLO − γ·staleness`.  Defaults α=1.0, λ=0.25, μ=0.35, ν=0.15, γ=0.20, τ≈60d.
> - Always expose the score breakdown (“Why this next” pill).  
> - Eval harness: 25–50 seeded queries with ground-truth chunks; measure Recall@10/MRR@10 for MiniLM baseline, temporal boost, and any upgrades before adoption.

## Milestones (A–E cadence)

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

### C — Optional Cloud (COMPLETE)
- Supabase tables + RLS (attempts/sessions/analytics_snapshots/evidence_chunks) — schema + policies in repo.
- Setup doc (`docs/SUPABASE_SETUP.md`) and README section; env flag gating (`USE_SUPABASE_INGEST`).
- `/api/attempts` & `/api/sessions` ingest endpoints push to Supabase when the flag is enabled and credentials provided.
- Nightly cron (`.github/workflows/analytics-sync.yml`) runs `npm run analyze` and inserts analytics snapshots when secrets exist.
- Runtime remains deterministic: ingestion stays off by default; service role keys are server-only; RLS restricts mutations.

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

> ## Module-Agnostic Checklist
> - Provide MODULE/SYSTEM/SECTION + `BLUEPRINT_PATH`, `LOS_PATH`, `SCOPE_DIRS`, `METRICS_SOURCE` per epic.  
> - Maintain PRD ≥92/100 (★ ≥2.9) then IMPLEMENTATION ≥92/100 before shipping.  
> - Update `PLAN.md` post-merge (ProjectManager), keep `README.md`, `AGENTS.md`, `PRD.md`, `IMPLEMENTATION.md` in sync.
>
> ## De-Hardcode Initiative (module agnostic)
> - `scripts/validate-items.mjs` now reads `SCOPE_DIRS` (CSV or glob under `content/banks/**`); `BLUEPRINT_PATH`/`LOS_PATH` env overrides supported.  
> - `scripts/rag/build-index.mjs` accepts `BANK_DIRS`/`SCOPE_DIRS` (defaults to recursive bank scan).  
> - UI fallbacks avoid module names (e.g., Study empty state).  
> - Follow-up: extend indexer to image embeddings (CLIP) once MiniLM + temporal eval hits target uplift.
> 
> ## To‑Do (Ordered to deliver Core User Journey)
>
> ### Milestone A: Core Feel (Get the first user journey working)
> - [x] **A1: Define Core Content Structure**
>     - [x] Create `los.json` for the Anatomy module.
>     - [x] Define `item.json` schema v1.1.0.
>     - [x] Define `lesson.json` schema v1.0.0.
> - [x] **A2: Build Initial Content Corpus**
>     - [x] Migrate existing Upper Limb items to schema v1.1.0.
>     - [x] Author 15-20 new `ItemSmith` MCQs for Lower Limb & Back.
>     - [x] Draft 5-10 `LessonSmith` concept cards for key anatomy topics.
> - [x] **A3: Implement Core UI Flows**
>     - [x] Build `StudyView` to render `LessonSmith` cards.
>     - [x] Build `ExamView` to administer a diagnostic quiz from the question bank.
>     - [x] Implement basic event logging to `data/events.ndjson` for all user interactions.
> - [x] **A4: Build Minimum Viable Mastery UI (FAST-TRACK)**
>     - [x] **Create `InsightsView` to display a simple list of Learning Objectives and their mastery scores.**
>     - [x] **This view will initially be powered by a placeholder calculation.**
>
> ### Milestone B: Retrieval & Insights (Make the app smart)
> - [x] **B1: Establish Analytics Baseline**
>     - [x] Finalize `scripts/analyze.mjs` to process `events.ndjson`.
>     - [x] **Implement a simple mastery calculation (e.g., `correct / total`) in `analyzer-core.mjs`.**
>     - [x] Ensure `public/analytics/latest.json` contains a `mastery_per_lo` map.
> - [x] **B2: Wire Analytics to UI**
>     - [x] **Connect the `InsightsView` to the live data from `public/analytics/latest.json`.**
>     - [x] This completes the first feedback loop: `Answer Question -> See Mastery Score Change`.
>
> ### Milestone C: Optional Cloud (Prepare for scale)
> - [x] **C1: Set up Supabase Backend**
>     - [x] Run migrations to create `attempts`, `sessions`, `analytics_snapshots`, `evidence_chunks` tables (`supabase/schema.sql`).
>     - [x] Implement Row Level Security (RLS) policies for all tables (`supabase/policies.sql`).
> - [x] **C2: Enable Cloud Ingestion & Processing**
>     - [x] Reuse `/api/attempts` and `/api/sessions` to write to Supabase when `USE_SUPABASE_INGEST=1`.
>     - [x] Set up a cron job (GitHub Action `analytics-sync`) to run `analyze.mjs` nightly and push snapshots when secrets are configured.
>
> ### Milestone D: Authoring Speed (Improve workflow efficiency)
> - [x] **D1: Build Visual Editors**
>     - [x] React Flow-based editor at `/dev/authoring` with live JSON preview.
>     - [x] RAG inspector UI at `/dev/rag-inspector` for temporal scoring review.
> - [x] **D2: Automate Local Workflows**
>     - [x] n8n stubs documented in `docs/AUTHORING_AUTOMATION.md` (upload trigger, validator sweep, analytics sync).
>
> ### Milestone X: Advanced RAG (Previously B2)
> - [x] **X1: Build Deterministic RAG Engine**
>     - [x] Finalize `scripts/rag/build-index.mjs` to chunk items and generate embeddings (with verifier + tests).
>     - [x] Implement `/api/search` endpoint and the "Temporal + Personal RAG" scoring formula.
>     - [x] Surface temporal scoring signals in the Study UI ("Why this next" companion) with documentation.
>
> ### Milestone E: Adaptive Engine (Create a personalized tutor)
> - [x] **E1: Implement Core Models**
>     - [x] Integrate a Rasch/GPCM model to estimate user ability and item difficulty (with Elo cold-start).
>     - [x] Integrate an FSRS model for spaced repetition scheduling.
> - [x] **E2: Build the Scheduler**
>     - [x] Implement the cross-topic Thompson Sampling scheduler to select the next best item.
>     - [x] Enforce all engine gates (blueprint rails, exposure caps, stop rules).
> - [x] **E3: Refine and Monitor**
>     - [x] Weekly EM re-fit job (`.github/workflows/refit-weekly.yml`) uploads summaries.
>     - [x] Reliability metrics surfaced in analytics (KR-20, low point-biserial items); Supabase snapshots keep longitudinal history.
>
> ## Cadence
> - Daily: sync PLAN status; triage issues; verify CI on latest PRs.  
> - Weekly: run `npm run score:rubric`; attach `public/analytics/rubric-score.json` to tracker; flag ★ < 2.8.  
> - Weekly: run `npm run jobs:refit`; review `data/refit-summaries/` output with AnalyticsEngineer before rollouts.  
> - Weekly GitHub Action (`refit-weekly.yml`) runs `npm run jobs:refit`, uploads the artifact, and serves as the automation path for refit summaries (replace with n8n/cron if operating offline).  
> - Release: gates green (validator, perf, rubric). Evidence latency spot‑check; blueprint preflight passes.
>
> ## PR Hygiene (superseded branches)
> - Merged: PR #11 (codex/complete-phase-3) — unified learner-state with adaptive engine and optimistic Study UI.
> - Superseded: PRs #1–#9 (early Codex branches) conflict with current engine/UI. Preferred path is to cherry-pick any still-useful assets (e.g., item JSONs, chart components). Most of these assets already exist on `main`.
> - Action: Close PRs #1–#9 as superseded. If any missing asset is needed, create a fresh branch from `main` and port it with minimal diffs + validators/tests.
>
> ## Single Next Step
> Two-track focus for the next 2–3 days:
> - Engine logging: add optional `engine` field to attempt/session events; emit selection signals to NDJSON. Do not break analyzer; bump schema versions conservatively.
> - Perf checks: add lightweight render/perf tests and evidence P95 sampling in CI.
>
> ### PM TODOs
> - [ ] Update README.md and AGENTS.md with queue/status/lesson API workflow plus worker runbook (reference "Queue + Content Factory Runbook").
>
> Concrete TODOs
> - [x] Telemetry: extend `scripts/lib/schema.mjs` and `core/types/events.ts` with optional `engine` object; bump `attemptEvent`/`sessionEvent` to `1.1.0`; update writers in `core/use-cases/*` and `app/study/engine.ts`.
> - [x] Analyzer: keep ignoring unknown keys; confirm `public/analytics/latest.json` remains stable (ran `npm run analyze`).
> - [x] RAG: add `tests/rag-recall.test.mjs`; document `/api/search` usage in README.
> - [x] Perf: add `tests/performance/render.study-pill.test.tsx` and a simple NDJSON timing sampler script.
> - [x] Optional cloud: stub Supabase tables + RLS policy doc; keep disabled by default.
> - [x] Harden `/upload` dev flow: keep behind `NEXT_PUBLIC_DEV_UPLOAD`, confirm sanitized filenames, and document Automator handler (README section).
> - [x] Generate a sample module through the `/upload` flow, run `npm run validate:items`, and archive outcomes for ValidatorFixer reference.
> - [x] Complete dynamic module loader view so new content/banks/new-module/ is visible in Study tabs once validator passes.
> - [x] Telemetry sample: capture representative attempt event with `engine` metadata (`data/events.ndjson`) and archive under `docs/HANDOFF.md` for validator review.
> - [x] Docs: ensure README.md quick-start and AGENTS.md reflect exposure caps + Playwright split (rolled in; verify no additional gaps).
> - [x] Integrate new module into scheduler/blueprint once validator passes.
>
> Docs status
> - README: Quick Start, Local Dev Ingestion, Optional Cloud (Supabase) — updated.
> - AGENTS: Engine gate (exposure caps) + dev-only `/upload` reminder — updated.
> - HANDOFF: Telemetry + validator snapshots — updated.
> - SUPABASE_SETUP: new doc for optional cloud path.
>
> Next agent: ProjectManager · Model: gpt-5-codex-high · Scope: docs/** README.md PLAN.md

## Queue + Content Factory Runbook (Dev)
- Queue adapter persists to `data/queue/jobs.json`; lifecycle: `queued → processing → completed|failed`.
- API surface:
  - `POST /api/queue/enqueue` — enqueue uploads (`{ fileName, fileSize, seed? }`).
  - `GET /api/queue/status/:id` — poll job state (includes `result.lessonId`).
  - `GET /api/lessons/:id` — retrieve generated lesson JSON.
- Worker (`scripts/worker.ts`) polls every ~1.5 s, generates deterministic lessons, and writes them to `data/lessons/lesson.<job>.lesson.json`.
- Run worker locally with `npx tsx scripts/worker.ts`; stop via `Ctrl+C`. Jobs remain persisted for postmortems.
- Failures mark jobs `failed` with error text; UI poller surfaces the message without clearing history.
- Reset procedure: delete `data/queue/jobs.json` (dev-only) and restart worker/UI. Core services auto-instantiate via `lib/services/runtime.ts` when API routes execute.
