# Studyin Module Arcade (Skeleton)

Deterministic, evidence-first scaffold for Studyin modules. It ships with an OMS-1 upper-limb sample bank today, but the prompts, CI, and agents are module-agnostic so you can retarget new systems without retooling.

UI stack: Next.js App Router + Tailwind CSS 4 (via `@tailwindcss/postcss`) + Radix UI primitives (wrapped under `components/ui/radix`) with light shadcn-style styling helpers. React Flow powers analytics graphs.

## Quick Start

```bash
npm install
npm run validate:items   # Validate sample bank (A–E gate)
npm run analyze          # Generate public/analytics/latest.json
npm test                 # Run engine smoke tests (Vitest)

# Dev server (auto opens http://localhost:3000)
npm run dev
```

Requirements: Node 20.14.x LTS (set via `.nvmrc` soon). Install Git LFS for evidence assets.

## Repository Layout

```
public/analytics/          # Generated analytics JSON (latest.json)
config/                    # Blueprint, LO hierarchy, error taxonomy
content/banks/upper-limb-oms1/  # One JSON per item (A–E only)
content/evidence/          # PDFs/crops (tracked via Git LFS)
data/                      # Local telemetry (events.ndjson)
app/api/                   # Next.js API routes (telemetry, analytics, forms, health)
lib/server/                # Server-only helpers (forms, telemetry, Supabase adapters)
lib/rag/                   # Deterministic embedding helpers (no external calls)
scripts/lib/               # Deterministic engines + shared schemas
scripts/rag/               # Evidence indexing + recall verification scripts
scripts/validate-items.mjs # Validator CLI gate (Zod-based)
scripts/analyze.mjs        # Analytics pipeline → latest.json + Supabase snapshot
supabase/                  # SQL schema + RLS policies for Supabase ingestion/index
tests/                     # Vitest smoke tests for engines
AGENTS.md                  # Agent SOPs, rubric gates, workflow
PLAN.md                    # Current milestones, To‑Dos, cadence
.lighthouserc.json         # CI Lighthouse thresholds and budgets
```

## Deterministic Engines (stubs)

- `scripts/lib/elo.mjs` — Elo-lite with adjustable K for learn/exam.
- `scripts/lib/spacing.mjs` — Half-life updates + next review scheduling.
- `scripts/lib/blueprint.mjs` — Feasibility checks and greedy form builder.

Engine behavior is covered by `npm test` smoke tests. Update these modules before wiring into the UI.

## Evidence Tooling

- Generate (OpenAI): `node scripts/tools/generate-image.mjs --prompt "ulnar nerve diagram" --out content/evidence/.../img.png`
- Fetch: `node scripts/tools/fetch-evidence.mjs --url https://... --out content/evidence/.../img.png`
- Link to item: `node scripts/tools/link-evidence.mjs --id item.ulnar.claw-hand --path content/evidence/.../img.png --review`
- Relax evidence during setup: `REQUIRE_EVIDENCE_CROP=0 npm run validate:items` (requires `citation` or `source_url`).

## Temporal RAG Tooling

- `node scripts/rag/build-index.mjs` — deterministic chunker that reads item stems/rationales and upserts embeddings into Supabase `evidence_chunks` (requires Supabase env vars).
- `node scripts/rag/verify-index.mjs` — recall@k smoke test that ensures target items appear at the top of results.
- Query top-k evidence:
  ```bash
  curl "http://localhost:3000/api/search?q=ulnar%20nerve&lo=lo.ulnar-nerve&k=5" \
    -H "Authorization: Bearer dev-analytics-refresh"
  ```

## Tests & CI

- Unit: `npm test` (Vitest).
- Manual/MCP a11y: use Chrome DevTools MCP or axe browser extension while `npm run dev` is running.
- CI runs: validate → unit → analyze → build → axe CI (serious+ blockers) → Lighthouse CI (per `.lighthouserc.json`).
- CI helpers: `npm run ci:axe`, `npm run ci:lh` (requires `npm run build` or a running server).

## Agents & Prompts

- See `scripts/codex/` for prompts:
  - `studyin-planner.md` — planning agent (consumes MODULE inputs)
  - `prd-writer.md` — world-class PRD author with internal rubric
  - `implementation-writer.md` — translates PRD into deterministic IMPLEMENTATION.md
  - `itemsmith.md` — author MCQs
  - `validator-fixer.md` — fix validator failures
  - `studyin-pm.md` — project manager agent

## MCP Tooling (Context7, Codex MCP, Chrome DevTools MCP)

- **Context7 + Codex MCP**: configure your MCP client (Cursor, Context7 desktop, VS Code MCP) to point at `scripts/codex/` prompts. Set the working directory to the repo root.
- **Chrome DevTools MCP**: run `npm run dev` (auto-opens http://localhost:3000) and start Chrome with `--remote-debugging-port=9222`. Attach the DevTools MCP to audit accessibility/perf.
- **Usage pattern**:
  1. Generate a context window in your MCP client (open files or load `PLAN.md`).
  2. Run a prompt (planner / PM / itemsmith / validator) with recent diffs or questions.
  3. For quick a11y/perf checks, use Chrome DevTools MCP or the axe extension, then note results in PLAN.md or the PR.

### Quick setup
1. Copy `.mcp/servers.example.json` to your MCP servers config (often `~/.config/mcp/servers.json`).
2. Adjust the Studyin path if the repo lives elsewhere.
3. Ensure `codex-mcp-server` and `chrome-devtools-mcp` CLIs are available (via `npm install -g` or `npx`).
4. Start `npm run dev`. Launch Chrome: `open -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-mcp` (macOS example).
5. Reload Context7; confirm tools like `fs.readFile`, `git.diff`, `navigate`, `lighthouse`, `axe` are listed.


## Working With Codex & Git

- Use `gpt-5-codex-high` for repo-aware tasks (code, items, analytics). Switch to `gpt-5-high` only for narrative ideation.
- Stage intentionally: `git add <path>`; review via `git status -sb`; commit with Conventional Commits (`feat(scope): summary`).
- Follow GitHub Flow: feature branch → PR → review → merge → deploy.
- See `AGENTS.md` for role responsibilities, SOPs, and evidence checklists.

## Data & Validation Pipeline

- `scripts/lib/schema.mjs` defines shared Zod schemas for items, blueprint, LOS, events.
- `npm run validate:items` enforces:
  - schema_version alignment
  - ABCDE choices with unique text
  - per-choice rationales (correct + distractors)
  - evidence includes `file`, `page`, and by default `bbox` or `cropPath`
  - LO IDs exist in `config/los.json`
  - published items must have `rubric_score ≥ 2.7`
  - To relax evidence during setup: run with `REQUIRE_EVIDENCE_CROP=0` to allow citation‑only (must include `citation` or `source_url`)
- `npm run analyze` reads `data/events.ndjson` (if present) and writes placeholder analytics to `public/analytics/latest.json`.
- `npm run dev` auto-opens the app in your default browser (set `DEV_URL` to override) — use `npm run dev:start` to run without auto-opening.

## Telemetry & Analytics APIs

- `POST /api/attempts` — ingest attempt events (schema `AttemptEvent`); token required (`Authorization: Bearer <INGEST_TOKEN>`). Rate limited (10 KB, 60 req/min). Writes to NDJSON unless `USE_SUPABASE_INGEST=1`, in which case rows land in Supabase `attempts`.
- `POST /api/sessions` — session lifecycle events; same validation + token path (`SessionEvent`).
- `POST /api/analytics/refresh` — recomputes analytics. With `READ_ANALYTICS_FROM_SUPABASE=1` (default when Supabase ingest enabled) it pulls attempts from Supabase and writes both `public/analytics/latest.json` and the `analytics_snapshots` table.
- `GET /api/snapshots/latest` — returns metadata + payload for the most recent analytics snapshot (service-role required).
- `GET /api/forms` — deterministic blueprint form builder (`length`, `seed`, `publishedOnly`). Returns items without evidence crops.
- `GET /api/search` — temporal RAG endpoint (query, LO filters, recency). Returns top-k evidence snippets with citations.
- `GET /api/health` — reports telemetry + analytics flags, `last_generated_at`, and file existence.

### Environments
- Copy `.env.example` to `.env.local` and populate:
  - `WRITE_TELEMETRY`, `INGEST_TOKEN`, `ANALYTICS_REFRESH_TOKEN`
  - `USE_SUPABASE_INGEST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `READ_ANALYTICS_FROM_SUPABASE` (default auto-follows `USE_SUPABASE_INGEST`)
  - Optional NDJSON fallbacks (`EVENTS_PATH`, `ANALYTICS_OUT_PATH`)
- Install Supabase client: `npm i @supabase/supabase-js`
- Apply Supabase schema & policies (`supabase/schema.sql`, `supabase/policies.sql`)

## Exam Form API

- Request a deterministic blueprint-aligned form via `GET /api/forms?length=20&seed=42&publishedOnly=1`.
- The endpoint returns `{ id, blueprint_id, length, seed, items[] }` where each item omits evidence crops to keep exams locked.
- If `publishedOnly=1` removes too many items to satisfy the blueprint, the route responds `409` with a deficit report so QA-Proctor can triage gaps.
- Server components can import `buildExamForm` from `lib/server/forms` directly to avoid extra HTTP hops inside the app.

## Analytics & Snapshots

- `scripts/lib/analyzer-core.mjs` exports deterministic summarizers (TTM, ELG/min, confusion, speed×accuracy, reliability scores, temporal drift).
- `npm run analyze` reuses the core and writes `public/analytics/latest.json` (and inserts into `analytics_snapshots` when Supabase configured).
- Snapshots table retains history; fetch via `/api/snapshots/latest` or directly in Supabase for reporting.
- Schedule hourly refresh (cron hitting `/api/analytics/refresh`) so latest.json stays current.

## Supabase Integration

- Apply SQL: `supabase/schema.sql` + `supabase/policies.sql` (attempts, sessions, analytics_snapshots, evidence_chunks + RLS).
- Vector search for RAG relies on pgvector; ensure `create extension if not exists vector;` is run (included in schema script).
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; clients never see it.
- Evidence stays in Git LFS; the RAG index stores chunk text + metadata only.

## Next Steps

1. Seed Supabase `attempts` with historical telemetry (use `scripts/tools/seed-attempts.mjs`) and verify analytics snapshots.
2. Monitor hourly refresh job and `/api/health` (`last_generated_at` should be recent).
3. Expand RAG coverage (chunk more evidence sources; run `scripts/rag/build-index.mjs`).
4. Iterate React Flow dashboards (confusion graph, blueprint gap explorer, session trace) with accessibility audits.
5. Broaden automated tests (Vitest + integration) to cover RAG search, reliability metrics, and snapshot endpoints.

Refer to `AGENTS.md` for role expectations, acceptance gates, and workflow SOPs.
