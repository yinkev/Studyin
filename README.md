# OMS-1 Upper Limb Study Arcade (Skeleton)

Deterministic, evidence-first scaffold for an OMS-1 upper limb study arcade. This repo seeds the content/analytics pipeline so we can add the Next.js PWA UI later without rework.

## Quick Start

```bash
npm install
npm run validate:items   # Validate sample bank (A–E gate)
npm run analyze          # Generate app/public/analytics/latest.json
npm test                 # Run engine smoke tests (Vitest)

# Placeholder until the Next.js app is added
npm run dev
```

Requirements: Node 20.14.x LTS.

## Repository Layout

```
app/public/analytics/      # Generated analytics JSON (latest.json)
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

## Data & Validation Pipeline

- `scripts/lib/schema.mjs` defines shared Zod schemas for items, blueprint, LOS, events.
- `npm run validate:items` enforces:
  - schema_version alignment
  - ABCDE choices with unique text
  - per-choice rationales (correct + distractors)
  - evidence includes `file`, `page`, and `bbox` or `cropPath`
  - LO IDs exist in `config/los.json`
  - published items must have `rubric_score ≥ 2.7`
- `npm run analyze` reads `data/events.ndjson` (if present) and writes placeholder analytics to `app/public/analytics/latest.json`.

## Next Steps

1. Flesh out item bank and evidence assets (Git LFS for PDFs/crops).
2. Expand analytics calculations (TTM, ELG/min, confusion graph) once events accumulate.
3. Scaffold the Next.js App Router UI (Study, Exam, Drills, Summary) consuming `latest.json`.
4. Add CI (Lighthouse, Playwright + axe, validator) enforcing rubric budgets.

Refer to `AGENTS.md` for role expectations, acceptance gates, and workflow SOPs.

