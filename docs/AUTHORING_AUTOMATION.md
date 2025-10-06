# Authoring Automations (Dev‑Only)

These simple recipes speed up authoring while keeping the app deterministic. They are optional and should run only on trusted local machines.

## 1) Upload → Content Factory (Queue)
- Trigger: watch a folder you use for source files (optional), or use the `/upload` UI.
- Worker: run `npx tsx scripts/worker.ts` in a second terminal. It polls `data/queue/jobs.json` and writes finished lessons to `data/lessons/`.
- REST calls (if automating outside the UI):
  ```bash
  # enqueue a job
  curl -sS -X POST http://localhost:3000/api/queue/enqueue \
    -H 'content-type: application/json' \
    -d '{"fileName":"{{ $json.fileName }}","fileSize":{{ $json.size || 0 }}}'

  # poll status (return .status queued|processing|completed|failed)
  curl -sS http://localhost:3000/api/queue/status/{{ $json.jobId }}

  # fetch lesson JSON when completed
  curl -sS http://localhost:3000/api/lessons/{{ $json.lessonId }} > data/lessons/{{ $json.lessonId }}.lesson.json
  ```
- Log a short note to `docs/QualitativeInsights.md` with the filename, tag decisions, and any authoring surprises.

## 2) Validator + Analytics Sweep
- Trigger: manual button or hourly cron while iterating on a module.
- Steps:
  1. Run `npm run validate:items` (full bank).
  2. To isolate a new module: `BLUEPRINT_PATH=config/blueprint-dev.json SCOPE_DIRS=content/banks/new-module VALIDATION_FORM_LENGTH=2 npm run validate:items`.
  3. Run `npm run analyze` to refresh `public/analytics/latest.json`.
  4. Save validator JSON or NDJSON excerpts under `data/validator-history/` for later comparison (optional).

## 3) Analytics Snapshot (Optional Cloud)
- Trigger: after validator success on a feature branch.
- Action: `npm run analyze` with Supabase secrets to push snapshots (see `docs/SUPABASE_SETUP.md`).
- Optional: run `npm run jobs:refit` to generate a Rasch/GPCM weekly summary and store it.

## Environment Flags (local‑only defaults)
- `NEXT_PUBLIC_DEV_UPLOAD=1` — enables `/upload` and developer pages.
- `WRITE_TELEMETRY=1` — writes NDJSON to `data/events.ndjson` locally (no remote sinks).
- `INGEST_TOKEN=...` — set if you want to require a bearer token on ingest routes.
- `USE_SUPABASE_INGEST=0` — keep off unless following the setup guide.

Keep secrets (e.g., Supabase) in `.env.local`. Do not enable remote ingestion in production.
