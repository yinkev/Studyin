# Studyin Module Arcade (Skeleton)

Deterministic, evidence-first scaffold for Studyin modules. It ships with an OMS-1 upper-limb sample bank today, but the prompts, CI, and agents are module-agnostic so you can retarget new systems without retooling.

UI stack: Next.js App Router + Tailwind CSS 4 (via `@tailwindcss/postcss`) + Radix UI primitives (wrapped under `components/ui/radix`) with light shadcn-style styling helpers.

## Quick Start

```bash
nvm use
npm install
npm run validate:items   # Validate sample bank (A–E gate)
npm run analyze          # Generate public/analytics/latest.json
npm test                 # Run engine smoke tests (Vitest)

# Dev server (auto opens http://localhost:3000)
npm run dev
```

Requirements: Node 20.14.x LTS (pinned via `.nvmrc`). If you use `nvm`, run `nvm install` once and `nvm use` for every session. Install Git LFS for evidence assets.

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

## Tests & CI

- Unit: `npm test` (Vitest).
- Manual/MCP a11y: use Chrome DevTools MCP or axe browser extension while `npm run dev` is running.
- CI runs: validate → unit → analyze → build → axe CI (serious+ blockers) → Lighthouse CI (per `.lighthouserc.json`).
- CI helpers:
  - `npm run ci:axe`: requires either `npm run dev` running in another terminal or a prior `npm run build && npm run start`. Exits non-zero on serious axe issues.
  - `npm run ci:lh`: run `npm run build` first. The command launches Lighthouse CI using `.lighthouserc.json` budgets.

## Project Management Scripts

- `npm run score:rubric`: Computes rubric metrics and writes `public/analytics/rubric-score.json`. Run during the weekly pulse and attach the JSON to the tracking issue.
- `npm run pm:pulse`: Generates a condensed status pulse leveraging `PLAN.md`, rubric deltas, and analytics snapshots. Use it for async updates or stand-ups.

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

## Next Steps

1. Attach evidence crops (`content/evidence/**`) and mark vetted items as `review`.
2. Expand analytics calculations (TTM, ELG/min, confusion graph) with richer telemetry.
3. Scaffold Next.js App Router UI (Study, Exam, Drills, Summary) consuming `latest.json`.
4. Add CI (tests, validate, axe, Lighthouse) enforcing rubric budgets; publish rubric score on PRs.
5. Add CODEOWNERS, PR template, and workflow automation for Studyin release discipline.

Refer to `AGENTS.md` for role expectations, acceptance gates, and workflow SOPs.
