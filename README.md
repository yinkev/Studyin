# Studyin: The Personal Learning Companion (MVP)

This project is a local-first, AI-powered learning application designed to help you study your own materials more effectively. You can upload documents, have them automatically transformed into interactive lessons, and get personalized recommendations on what to study next.

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    This will open the application in your browser at `http://localhost:3000`.

3.  **(Optional) Start the Content Factory Worker**
    ```bash
    npx tsx scripts/worker.ts
    ```
    The worker polls `data/queue/jobs.json` and writes finished lessons to `data/lessons/`. Keep it running while you iterate on uploads; stop with `Ctrl+C` when finished.

## Core Workflow

The application is built around a simple, powerful loop:

1.  **Upload & Process:**
    - Navigate to the `/upload` page.
    - Select a document (PDF, PPT, etc.) from your computer and click "Upload and Process".
    - The upload enqueues a background job via `POST /api/queue/enqueue`.
    - The UI polls `GET /api/queue/status/:jobId`; once the worker finishes, it fetches the lesson with `GET /api/lessons/:lessonId` and shows the confirmation state.
    - Confirm the tags to save the new lesson (persisted under `data/lessons/`).

2.  **Study:**
    - Navigate to the `/study` page.
    - Here you will find the AI Coach's suggestion for what to study next.
    - You can also enter "Manual Mode" to browse your entire library and choose any lesson you wish.

3.  **Learn:**
    - As you complete lessons and answer questions, the Personalization Coach learns about your strengths and weaknesses, improving its future recommendations.

### Background Queue & Worker (Dev)

- Jobs live in `data/queue/jobs.json` and move `queued → processing → completed|failed`.
- API endpoints:
  - `POST /api/queue/enqueue` — create a job (called by `/upload`).
  - `GET /api/queue/status/:jobId` — poll state from the client.
  - `GET /api/lessons/:lessonId` — fetch the generated lesson JSON.
- The worker script consumes the queue deterministically. Restarting it is safe; jobs are persisted.
- Failed jobs retain their error message; fix the root cause, delete the line from `jobs.json` if needed, and re-upload.

### Environment Flags (Dev)

- `NEXT_PUBLIC_DEV_UPLOAD=1` — enables `/upload` and dev pages.
- `WRITE_TELEMETRY=1` — writes local NDJSON to `data/events.ndjson`.
- `INGEST_TOKEN=...` — optional bearer token to guard ingest routes.
- `USE_SUPABASE_INGEST=0` — keep off unless following `docs/SUPABASE_SETUP.md`.


## Documentation Map

- Queue & Worker Runbook: see “Background Queue & Worker (Dev)”.
- Authoring Automations: docs/AUTHORING_AUTOMATION.md
- Engine Spec & Prompts: docs/personal-adaptive-study-engine-spec.md
- Optional Cloud Setup: docs/SUPABASE_SETUP.md
- Archived history: docs/archive/README_HISTORY.md, docs/archive/IMPLEMENTATION_HISTORY.md, docs/archive/ui-blueprint/
> 
> ### Optional Cloud (Supabase)
> 
> Supabase integration remains opt-in. To mirror telemetry/evidence into Supabase:
> 
> 1. Create a Supabase project and run `supabase/schema.sql` then `supabase/policies.sql` to create tables and enable Row Level Security.
> 2. Set env vars (server-only):
> 
>    ```bash
>    USE_SUPABASE_INGEST=1
>    SUPABASE_URL=https://<project>.supabase.co
>    SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
>    ```
> 
>    Leaving `USE_SUPABASE_INGEST` unset keeps the app in local-only mode.
> 
> 3. Consume helpers in `lib/server/supabase.ts` and `scripts/lib/supabase-ingest.mjs` from jobs or CLI scripts (`scripts/analyze.mjs`, `scripts/rag/build-index.mjs`) to insert telemetry or fetch evidence chunks.
> 4. A scheduled workflow (`.github/workflows/analytics-sync.yml`) runs `npm run analyze` daily at 07:00 UTC (and on-demand via workflow_dispatch). When Supabase secrets are present it automatically inserts the analytics snapshot.
> 
> Detailed steps live in `docs/SUPABASE_SETUP.md`. Do not enable the flag in production until policies are hardened and credentials are secured.
> 
> ### Dev Tooling
> 
> - `/dev/authoring` — React Flow workbench for LessonSmith timelines with live JSON preview (requires the dev flag noted above).
> - `/dev/rag-inspector` — Query `/api/search` to inspect deterministic temporal retrieval signals.
> - `docs/AUTHORING_AUTOMATION.md` — n8n automation stubs (upload trigger, validator sweep, analytics sync).
> 
> ## Architecture Boundaries
> 
> Layers and allowed imports (behavior-neutral guardrails):
> - Core (`@core/*` → `core/*`)
>   - Contains shared types, schemas, and business logic use cases.
>   - May import nothing outside of Node/DOM types.
> - Engine (`@engine/*` → `lib/engine/*`, public barrel `@engine`)
>   - Facade over deterministic algorithms and selectors.
>   - May depend on Core. Must not import `scripts/lib/*.mjs` directly; use shims under `lib/engine/shims/**` only.
> - Analytics (`@analytics/*` → `scripts/lib/*`)
>   - Deterministic scripts (Elo/Rasch/GPCM, scheduler, schemas) kept in `.mjs` for CLI usage.
>   - TS code must not import these directly; route through Engine shims or explicit API surfaces.
> - Server (`@server` → `lib/server/index.ts`)
>   - Server-only forms, events, state, and adapters.
>   - May import Engine and Core; must not import UI.
> - UI (`@ui/*` → `components/*` and `app/**`)
>   - React components and pages. May consume Server, Engine, and Core public APIs; never import `.mjs` modules directly.
> 
> ## Deterministic Engines (stubs)
> 
> - `scripts/lib/elo.mjs` — Elo-lite with adjustable K for learn/exam.
> - `scripts/lib/rasch.mjs` — Rasch 1‑PL helpers (EAP via GH quadrature, info, mastery probability).
> - `scripts/lib/gpcm.mjs` — GPCM PMF scaffolding (extend thresholds `τ`).
> - `scripts/lib/selector.mjs` — In‑session utility and randomesque top‑K.
> - `scripts/lib/scheduler.mjs` — Thompson Sampling over LOs optimizing ΔSE/min with seeded RNG.
> - `scripts/lib/fsrs.mjs` — FSRS‑inspired updates and budgeting helpers.
> - `lib/study-engine.ts` — Shared adaptive engine (Rasch EAP, scheduler arms, retention budgeting, “Why this next”).
> 
> ## Determinism Policy
> 
> - No runtime LLM/API calls in the app or engines. All analytics, selection, and scoring are deterministic.
> - Randomness must be seeded and reproducible.
