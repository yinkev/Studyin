# OMS-1 Upper Limb Study Arcade (Skeleton)

Deterministic, evidence-first scaffold for Studyin’s OMS-1 upper limb module. This repo seeds the content/analytics pipeline so we can add the Next.js PWA UI later without rework.

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
scripts/lib/               # Deterministic engines + shared schemas
scripts/validate-items.mjs # Validator CLI gate (Zod-based)
scripts/analyze.mjs        # Analytics pipeline → latest.json
tests/                     # Vitest smoke tests for engines
AGENTS.md                  # Agent SOPs, rubric gates, workflow
```

## Deterministic Engines (stubs)

- `scripts/lib/elo.mjs` — Elo-lite with adjustable K for learn/exam.
- `scripts/lib/spacing.mjs` — Half-life updates + next review scheduling.
- `scripts/lib/blueprint.mjs` — Feasibility checks and greedy form builder.

Engine behavior is covered by `npm test` smoke tests. Update these modules before wiring into the UI.

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

## Next Steps

1. Attach evidence crops (`content/evidence/**`) and mark vetted items as `review`.
2. Expand analytics calculations (TTM, ELG/min, confusion graph) with richer telemetry.
3. Scaffold Next.js App Router UI (Study, Exam, Drills, Summary) consuming `latest.json`.
4. Add CI (tests, validate, axe, Lighthouse) enforcing rubric budgets; publish rubric score on PRs.
5. Add CODEOWNERS, PR template, and workflow automation for Studyin release discipline.

Refer to `AGENTS.md` for role expectations, acceptance gates, and workflow SOPs.
