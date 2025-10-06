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

---

> ## Archived README (For Historical Context)
> 
> *The original README is preserved below for historical context. The information above reflects the current state of the MVP.*
> 
> # Studyin Module Arcade (Skeleton)
> 
> Deterministic, evidence-first scaffold for Studyin modules. It ships with an OMS-1 upper-limb sample bank today, but the prompts, CI, and agents are module-agnostic so you can retarget new systems without retooling.
> 
> UI stack: Next.js App Router + Tailwind CSS 4 (via `@tailwindcss/postcss`) + OKC (Duolingo‑inspired) design. Heavy visuals via anime.js (micro‑motion), ECharts (charts), Splide (carousels), and Three.js (3D viewer). React Flow powers the custom graphs.
> 
> ## Quick Start
> 
> ```bash
> npm install
> npm run validate:items   # Validate sample bank (A–E gate)
> npm run analyze          # Generate public/analytics/latest.json
> npm run jobs:refit       # (manual) Run weekly Rasch/GPCM refit summary (writes data/refit-summaries)
> npm test                 # Run engine smoke tests (Vitest)
> # Optional: npm test -- --include=tests/e2e-js/** to execute Playwright smoke tests (default Vitest run excludes tests/e2e-js/**)
> 
> # Dev server (auto opens http://localhost:3000)
> npm run dev
> ```
> 
> Requirements: Node 20.14.x LTS (set via `.nvmrc`). Install Git LFS for evidence assets.
>
> Before running validators, define your own learning objectives and blueprint:
> 1. Edit `config/los.json` and add each LO you plan to assess.
> 2. Populate `config/blueprint.json` with weights that sum to 1.0 (or leave empty until content exists).
> 3. Optional: use `config/blueprint-dev.json` for temporary weights while iterating on new modules.
> 
> ## Repository Layout
> 
> ```
> public/analytics/          # Generated analytics JSON (latest.json)
> config/                    # Blueprint, LO hierarchy, error taxonomy
> content/banks/             # Place new `*.item.json` files by module (empty by default)
> content/evidence/          # PDFs/crops (tracked via Git LFS)
> data/                      # Local telemetry (events.ndjson, state snapshots)
> data/refit-summaries/      # Weekly Rasch refit outputs (`npm run jobs:refit`)
> scripts/perf/              # Deterministic profiling scripts (e.g., sample-events-latency)
> app/api/                   # Next.js API routes (telemetry, analytics, forms, health)
> core/                      # Core types, schemas, and use cases
> app/study/                 # Study flow (UI components and server actions)
> lib/server/                # Server-only helpers (forms, telemetry, Supabase adapters)
> lib/rag/                   # Deterministic embedding helpers (no external calls)
> scripts/lib/               # Deterministic engines + shared schemas
> scripts/rag/               # Evidence indexing + recall verification scripts
> scripts/validate-items.mjs # Validator CLI gate (Zod-based)
> scripts/analyze.mjs        # Analytics pipeline → latest.json + Supabase snapshot
> supabase/                  # SQL schema + RLS policies for Supabase ingestion/index
> tests/                     # Vitest smoke tests for engines
> tests/e2e-js/              # Playwright smoke tests (run manually via Playwright CLI)
> AGENTS.md                  # Agent SOPs, rubric gates, workflow
> PLAN.md                    # Current milestones, To‑Dos, cadence
> ```
> 
> ### Local Dev Ingestion (`/upload`)
> 
> The `/upload` route is an optional development-only workflow that triggers the local CLI via a custom URL scheme. It is **disabled by default**.
> 
> - Enable it by setting `NEXT_PUBLIC_DEV_UPLOAD=1` (or `NEXT_PUBLIC_DEV_TOOLS=1`) in `.env.local` and restarting `npm run dev`.
> - Upload files must already exist under `data/uploads/`. The page only accepts filenames containing `[A-Za-z0-9_.-]`.
> - Clicking “Click Here to Process File” opens a `studyin-cli://process?file=<name>` URL. On macOS you can register this scheme with Automator (see in-app instructions) to run:
> 
>   ```bash
>   clink gemini -r planner -f data/uploads/<file>
>   # …prompt omitted for brevity…
>   npm run validate:items
>   ```
> 
> - Always review and whitelist the Automator script before use; the workflow is meant for trusted local experiments only. Generated modules must still pass the validator and manual review before inclusion in the study experience.
> - To validate only the generated module:
>
>   ```bash
>   BLUEPRINT_PATH=config/blueprint-dev.json \
>   SCOPE_DIRS=content/banks/new-module \
>   VALIDATION_FORM_LENGTH=2 \
>   npm run validate:items
>   ```
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
