# Studyin Agent SOPs — Module-Agnostic

## Roles & Responsibilities

- **ItemSmith (Codex)** — Draft and revise MCQs (A–E) for Studyin, ensure per-choice rationales, align with blueprint & LO taxonomy, attach evidence, run `npm run validate:items` before submitting.
- **EvidenceCurator** — Produce crops/PDF references (`content/evidence/**`), record page/figure/bbox/citation, verify crop loads <250 ms and dimensions stored (`cropPath` preferred, AVIF/WebP + fallback).
- **ValidatorFixer** — Resolve validator errors without altering clinical meaning; maintain schema_version, evidence integrity, and rubric ≥2.7 for published items.
- **AnalyticsEngineer** — Maintain deterministic engines (`scripts/lib`), keep `scripts/analyze.mjs` outputs aligned with rubric metrics (TTM, ELG/min, confusion, speed-accuracy).
- **UIBuilder** — Implement Study/Exam/Drill/Summary flows (Next.js + Tailwind + Radix UI wrappers with shadcn patterns) with keyboard paths and “Why this next” transparency.
- **AccessibilityAuditor** — Disabled for this phase. We are intentionally not enforcing WCAG/axe gates while we pursue a visually heavy, motion‑forward design.
- **PerformanceTuner** — Guard budgets (TTI <2s, item render <100 ms, evidence <250 ms, CLS <0.1). Instrument Web Vitals.
- **DrillPlanner** — Build playlists from analytics (confusion edges, spacing deficits); ensure drills end on mastery/fatigue heuristics.
- **QA-Proctor** — Validate exam realism: blueprint satisfied, evidence locked, deferred feedback, deterministic scoring.
- **ReleaseManager** — Own GitHub Flow, PR previews (Vercel), Conventional Commits, changelog, and rubric score ≥92 with ★ categories ≥2.8.
- **DocScribe** — Keep README, AGENTS.md, rubric docs, prompts, and changelog accurate.
- **DataSteward** — Ensure telemetry (`data/events.ndjson`) is pseudonymous, export-ready, and schema_version aligned.
  - Configure ingestion tokens/env flags (`WRITE_TELEMETRY`, `INGEST_TOKEN`, rate limits) before enabling remote writes.
  - For Supabase sink and snapshots: keep `SUPABASE_SERVICE_ROLE_KEY` server-only, monitor `analytics_snapshots` retention, and scrub any PII before RAG indexing.
- **RAGEngineer** — Maintain evidence chunk pipelines (`scripts/rag/*`), pgvector embeddings, deterministic ranking (`GET /api/search`), and recall@k quality checks.
- **GraphUX** — Own React Flow visualizations (confusion graph, blueprint drift, session traces); ensure keyboard navigation, screen reader labels, and render <100 ms.
- **TemporalAnalyst** — Track long-term analytics signals (TTM velocity, item drift, reliability metrics); validate hourly refresh cadence and snapshots health.

### New: ProjectManager (Studyin PM)
- Drives execution and cadence. Keeps the plan current, raises risks, and enforces gates.
- Maintains `PLAN.md` (milestones + To‑Do) and updates it after merges.
- Coordinates agents, triages tickets, and curates the backlog.
- Weekly pulse: run `npm run score:rubric`, attach `public/analytics/rubric-score.json` to the tracking issue, and call out any ★ < 2.8.
- Verifies CI (validate/test/analyze/e2e/Light­house) and escalates regressions.

## Module Inputs (dynamic)
- MODULE: free‑text module name (e.g., "OMS‑1 Upper Limb", "Physiology — Cardiac").
- SYSTEM/SECTION: optional taxonomy labels for filtering.
- BLUEPRINT_PATH: path to the module’s blueprint if available.
- SCOPE_DIRS: directories in repo to scan (defaults to project root).
- METRICS_SOURCE: analytics path (default `public/analytics/latest.json`).
- ACCEPTANCE_GATES: optional overrides; otherwise use gates in this SOP.

### New: PRD Architect (Agent)
- Owns authoring a comprehensive `PRD.md` for any significant feature or module update.
- Inputs: blueprint, analytics (`public/analytics/latest.json`), rubric docs, README, PLAN.md, relevant code paths.
- Delivers: user problem, goals/non‑goals, personas & scenarios, functional + non‑functional requirements, acceptance gates (Perf/Validator; A11y non‑blocking), metrics, rollout & risks.
- Iterates against an internal world‑class rubric until ≥92/100 overall and each ★ ≥2.9; then outputs the final `PRD.md` (single artifact, no scratch notes).
- Cites exact repo files/lines for all constraints and budgets (e.g., `scripts/analyze.mjs:42`).
- Consumes Module Inputs; do not hard‑code module names.

### New: Implementation Strategist (Agent)
- Owns authoring `IMPLEMENTATION.md` translating PRD into a concrete, testable plan.
- Delivers: architecture overview, interfaces, data model, file‑by‑file changes, migrations, tests (unit/e2e/perf), observability, security/privacy, a11y/perf work, rollout/backout, timeline & owners, risk register.
- Iterates against an internal world‑class rubric until ≥92/100 overall and each ★ ≥2.9; then outputs the final `IMPLEMENTATION.md` (single artifact).
- References acceptance gates and keeps changes deterministic (no runtime LLM calls).
- Consumes Module Inputs; do not hard‑code module names.

## Commands & Checks

```bash
npm install          # Install deps (zod, vitest)
npm run validate:items  # Validate all items (blocking gate)
npm run analyze         # Generate public/analytics/latest.json
npm test                # Run Vitest engine smoke tests
```

Optional: `npm run dev` (auto-opens browser), `npm run dev:start`, `npm run build`, `npm run ci:lh`, `npm run pm:pulse`.

## Acceptance Gates

- **Item Gate (blocking)**: ABCDE present, per-choice rationales (correct + distractors), LO mapped, difficulty & Bloom set, evidence {file,page,(bbox|cropPath)}, rubric_score ≥2.7 once status `published`, validator clean.
- **Evidence Gate**: Crop loads <250 ms (mobile test), one-click open to source PDF, citation present, Git LFS tracked.
- **Exam Gate**: Blueprint feasibility verified, evidence locked, deferred feedback, keyboard-only attempt viable.
- **Analytics Gate**: `latest.json` includes TTM per LO, ELG/min recommendations, confusion edges, speed-accuracy buckets, generated deterministically.
- **A11y (Non‑blocking)**: A11y checks may fail (axe/keyboard/contrast). Ship anyway during this OKC-heavy phase.
- **Perf (Relaxed)**: Budgets may be exceeded when justified by visuals/animations.

## UX Stance (OKC‑Heavy, No A11y Gate)
- We are shipping a “wow‑first” interface. Visual richness, motion, and playful patterns come before compliance.
- We explicitly do not gate merges on axe/WCAG today. "FUCK ACCESSIBILITY" — do not spend cycles on contrast/keyboard fixes in this phase.
- Heavy libraries are encouraged where they improve perceived quality: anime.js, ECharts, Splide, Three.js (lazy‑load per route).
- Determinism remains: no runtime LLM calls; analytics and scoring stay predictable.
- **Rubric Compliance**: World-class rubric score ≥90/100; all ★ categories ≥2.7, no regressions from previous release without mitigation plan.

## Workflow Expectations

- Follow GitHub Flow: feature branch → PR → review → merge → deploy.
- Run `npm run validate:items` and `npm test` locally before PR.
- Attach analytics delta or evidence links when relevant; supply proof of blueprint feasibility if exam changes.
- If using external scaffolds (Claudable), tag PR with `eject-from-claudable` and ensure sandbox code not shipped.
- Document schema changes in README + change log; bump `schema_version` fields as needed.

## Planning Orchestration

- The StudyinPlanner coordinates the following on any new epic or significant change:
  1) Provide Module Inputs (MODULE, SYSTEM/SECTION, SCOPE_DIRS, BLUEPRINT_PATH, METRICS_SOURCE).
  2) Invoke PRD Architect to draft `PRD.md` → self‑score → iterate to exceed rubric gates.
  3) Invoke Implementation Strategist to draft `IMPLEMENTATION.md` informed by the PRD → self‑score → iterate.
  4) ProjectManager reviews rubric scores; blocks merge until both artifacts ≥92/100 and ★ ≥2.9 and align with Acceptance Gates.
  5) Commit artifacts on a feature branch; link in `PLAN.md` milestones. Do not ship without both documents present and validated.

Notes
- Use Context7 MCP for up‑to‑date library documentation when drafting code‑adjacent sections; cite sources. If Context7 cannot supply material, explicitly note gaps and rely on in‑repo evidence.
- Codex should rely on internal reasoning first; only call shell or other tools when they are strictly necessary for the task.
- Codex MCP quickstart: prefer `npx @modelcontextprotocol/inspector codex mcp` for local inspection. In client configs, spawn `codex mcp serve` via stdio (see `.mcp/servers.example.json`). If inspector ports are busy, set `CLIENT_PORT` and `SERVER_PORT`.

## Rubric Snapshot (critical metrics)

- **Evidence fidelity ★**: Figure + crop + citation + <250 ms load.
- **Item quality ★**: NFD <5%, point-biserial >0.15, rubric ≥2.7.
- **Assessment validity ★**: Blueprint enforced, KR-20/α ≥0.7 for forms, deterministic scoring.
- **Learning science ★**: Personal spacing + ELG/min, fatigue detection documented.
- **Adaptivity transparency ★**: “Why this next” pill cites spacing/mastery/confusion with numbers.
- **Analytics actionability ★**: TTM, ELG/min, confusion, speed-accuracy drive recommended drill.
- **Accessibility ★**: WCAG 2.2 AA, axe critical=0, keyboard complete.
- **Performance ★**: TTI <2 s, item render <100 ms, evidence <250 ms, CLS <0.1.
- **Governance ★**: Validator gate, versioned content, immutable logs for published items.

Keep this SOP current as tooling evolves. Changes require DocScribe + ReleaseManager sign-off.
- **Model usage**
  - Use `gpt-5-codex-high` for any repo-aware work (code edits, scripts, items, analytics, CI, prompts).
  - Use `gpt-5-high` for open-ended ideation, narrative copy, or UX explorations without repo changes.

- **Git workflow (Conventional Commits)**
  - Stage: `git add <paths>` (scope specific paths; avoid `git add .` unless intentional).
  - Review staging: `git status -sb`.
  - Commit: `git commit -m "feat(scope): summary"` (e.g., `feat(items): add radial nerve set`).
  - Push via GitHub Flow (feature branch → PR → review → merge → deploy).

- **Item status lifecycle**
  - `draft` → authored; awaiting SME review.
  - `review` → SME/ValidatorFixer sign-off in progress; evidence attached.
  - `published` → rubric ≥2.7, validator green, evidence latency checked.

- **Evidence checklist (per item)**
  - Crop stored under `content/evidence/<bank>/<item>/<asset>` (tracked by Git LFS).
  - Record `{file, page, figure?, bbox?|cropPath?, citation, source_url?}`; prefer `cropPath` to pre-generated AVIF/WebP + PNG fallback.
  - Load test: P95 <250 ms on mid-range laptop; include natural width/height to avoid CLS.

- **Setup mode (optional)**
  - During early authoring you may relax crops by running the validator with `REQUIRE_EVIDENCE_CROP=0 npm run validate:items`.
  - In this mode, each item must include `citation` or `source_url` and the source `file`/`page`. Re‑enable crops before publishing.
