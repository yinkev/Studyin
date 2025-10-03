# Studyin Workflow — MCP-Driven, Deterministic

Behavior-neutral, deterministic workflow playbook for core roles using MCP. Aligns with AGENTS.md and README. No runtime LLMs in shipped code.

## MCP Pattern (Context7)
- Resolve: narrow the question (exact API, budget, threshold, syntax).
- Fetch: open authoritative docs/URLs or repo files.
- Cite: record source, `path:line`, and how it constrains the work.

Example
- Resolve: “Next.js server actions POST limits; App Router headers”
- Fetch: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- Cite:
  - External: Next.js Docs — Server Actions (accessed 2025‑10‑03)
  - Repo: `scripts/analyze.mjs:42` — budget threshold source

## Citations Format
- External: Title — URL (accessed YYYY‑MM‑DD) — note/purpose.
- Repo: `path/to/file:line` — constraint/budget/requirement name.

## PR Citation Template (copy/paste)

```md
### MCP Citations
- External
  - <Title> — <URL> (accessed YYYY‑MM‑DD) — <why cited>
- Repo
  - `scripts/analyze.mjs:42` — Perf budget: TTI/FCP/TBT/CLS
  - `AGENTS.md:...` — Acceptance gates; deterministic stance
  - `README.md:...` — Commands, engines, repo layout

### Determinism
- No runtime LLMs introduced
- Engines and analytics remain deterministic (tests unchanged)
```

## Role Playbooks

### PRD Architect
Inputs
- Blueprint, analytics (`public/analytics/latest.json`), README, PLAN.md, relevant code paths.

Resolve → Fetch → Cite
- Resolve: “Where are perf/validator gates defined?” “Rubric score outputs?”
- Fetch:
  - Repo: `AGENTS.md` (acceptance gates, rubric thresholds)
  - Repo: `scripts/analyze.mjs` (metrics; outputs)
  - Repo: `public/analytics/latest.json` sample (structure)
- Cite:
  - `AGENTS.md:<line>` — Item/Evidence/Analytics gates
  - `scripts/analyze.mjs:<line>` — metric definitions
  - `README.md:<line>` — commands to reproduce

PRD Steps
- Define user problem, goals/non‑goals, scenarios.
- List functional + non‑functional requirements; attach repo citations.
- Record acceptance gates (Perf/Validator) with exact sources.
- Define rollout, metrics, and risks; keep deterministic constraints explicit.

Done When
- Single `PRD.md` ≥92/100, each ★ ≥2.9; citations included.

### Implementation Strategist
Inputs
- PRD, AGENTS.md gates, code paths for engines/UI/scripts.

Resolve → Fetch → Cite
- Resolve: “Which engines are deterministic?” “Where are exposure caps/rails?”
- Fetch:
  - Repo: `scripts/lib/*.mjs` (elo, rasch, gpcm, selector, scheduler, fsrs, exposure, spacing)
  - Repo: `lib/study-engine.ts` and `app/study/actions.ts`
- Cite:
  - `scripts/lib/selector.mjs:<line>` — randomesque top‑K
  - `scripts/lib/exposure.mjs:<line>` — ≤1/day, ≤2/week, cooldown
  - `lib/study-engine.ts:<line>` — “Why this next” signals

Implementation Steps
- Architecture overview and interfaces.
- Data model and migrations (if any).
- File‑by‑file changes, tests (unit/e2e/perf), observability.
- Performance budgets; deterministic behavior preserved; no runtime LLM calls.
- Rollout/backout, timeline, owners, risks—each tied to citations.

Done When
- Single `IMPLEMENTATION.md` ≥92/100, each ★ ≥2.9; citations included.

### ItemSmith
Inputs
- Blueprint/LOs, evidence sources, bank directory.

Resolve → Fetch → Cite
- Resolve: “Validator schema requirements?” “Evidence crop rules?”
- Fetch:
  - Repo: `scripts/validate-items.mjs` (validator gate)
  - Repo: `AGENTS.md` evidence checklist
- Cite:
  - `scripts/validate-items.mjs:<line>` — ABCDE, rationales, LO/Bloom, evidence fields
  - `AGENTS.md:<line>` — crop performance and LFS tracking

Item Steps
- Author A–E with per‑choice rationales; map LO, difficulty, Bloom.
- Attach evidence `{file,page,(bbox|cropPath),citation}`; prefer `cropPath`.
- Validate: `npm run validate:items` (or setup relax via `REQUIRE_EVIDENCE_CROP=0` with citation/source_url).
- Keep deterministic content; no runtime calls.

Done When
- Validator clean; citations present; evidence loads <250 ms target.

### ReleaseManager
Inputs
- PR, artifacts (PRD/IMPLEMENTATION), analytics diffs.

Resolve → Fetch → Cite
- Resolve: “Which gates must pass?” “Where is rubric score produced?”
- Fetch:
  - Repo: `AGENTS.md` (gates, GitHub Flow)
  - Repo: `README.md` (commands, tests, CI order)
- Cite:
  - `AGENTS.md:<line>` — gates list
  - `README.md:<line>` — command sources used in verification

Release Steps
- Verify PR template checkboxes completed.
- Run locally: `npm run validate:items`, `npm test`, `npm run analyze`.
- Weekly pulse: `npm run score:rubric` and attach `public/analytics/rubric-score.json`.
- Confirm “No runtime LLMs introduced”; determinism unchanged.

Done When
- Gates pass, citations included, rubric ≥ thresholds, PR ready.

## Commands Reference
- `npm install`
- `npm run validate:items`
- `npm run analyze`
- `npm test`
- `npm run score:rubric`

