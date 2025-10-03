# Studyin Agent SOPs — Module-Agnostic

## Roles & Responsibilities

- **ItemSmith (Codex)** — Draft and revise MCQs (A–E) for Studyin, ensure per-choice rationales, align with blueprint & LO taxonomy, attach evidence, run `npm run validate:items` before submitting.
- **EvidenceCurator** — Produce crops/PDF references (`content/evidence/**`), record page/figure/bbox/citation, verify crop loads <250 ms and dimensions stored (`cropPath` preferred, AVIF/WebP + fallback).
- **ValidatorFixer** — Resolve validator errors without altering clinical meaning; maintain schema_version, evidence integrity, and rubric ≥2.7 for published items.
- **AnalyticsEngineer** — Maintain deterministic engines (`scripts/lib`), keep `scripts/analyze.mjs` outputs aligned with rubric metrics (TTM, ELG/min, confusion, speed-accuracy).
- **UIBuilder** — Implement Study/Exam/Drill/Summary flows (Next.js + Tailwind + Radix UI wrappers with shadcn patterns) with keyboard paths and “Why this next” transparency.
<!-- Accessibility auditor role removed for this phase -->
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
- **AdaptiveEngineer (Agent)** — Own the Personal Adaptive Study Engine end‑to‑end: Rasch/GPCM + Elo fallback, in‑session selector, cross‑topic Thompson Sampling scheduler, FSRS retention lane, blueprint rails (±5%), exposure caps (≤1/day, ≤2/week, 96h cooldown), and stop rules. Maintain deterministic behavior, telemetry logging, and “Why this next” transparency.

### New: ProjectManager (Studyin PM)
- Drives execution and cadence. Keeps the plan current, raises risks, and enforces gates.
- Maintains `PLAN.md` (milestones + To‑Do) and updates it after merges.
- Coordinates agents, triages tickets, and curates the backlog.
- Weekly pulse: run `npm run score:rubric`, attach `public/analytics/rubric-score.json` to the tracking issue, and call out any ★ < 2.8.
- Verifies CI (validate/test/analyze/e2e). Performance budgets may be asserted when configured.

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
- Delivers: user problem, goals/non‑goals, personas & scenarios, functional + non‑functional requirements, acceptance gates (Perf/Validator), metrics, rollout & risks.
- Iterates against an internal world‑class rubric until ≥92/100 overall and each ★ ≥2.9; then outputs the final `PRD.md` (single artifact, no scratch notes).
- Cites exact repo files/lines for all constraints and budgets (e.g., `scripts/analyze.mjs:42`).
- Consumes Module Inputs; do not hard‑code module names.

### New: Adaptive Engine Spec (Authoritative)
- Before any adaptive engine work, read: `docs/personal-adaptive-study-engine-prompt.md` and `docs/personal-adaptive-study-engine-spec.md`. Treat these as authoritative for algorithms, thresholds, and gating. Do not deviate from formulas; adapt only for language/runtime.

### New: Implementation Strategist (Agent)
- Owns authoring `IMPLEMENTATION.md` translating PRD into a concrete, testable plan.
- Delivers: architecture overview, interfaces, data model, file‑by‑file changes, migrations, tests (unit/e2e/perf), observability, security/privacy, performance work, rollout/backout, timeline & owners, risk register.
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

Optional: `npm run dev` (auto-opens browser), `npm run dev:start`, `npm run build`, `npm run pm:pulse`.

## Acceptance Gates

- **Item Gate (blocking)**: ABCDE present, per-choice rationales (correct + distractors), LO mapped, difficulty & Bloom set, evidence {file,page,(bbox|cropPath)}, rubric_score ≥2.7 once status `published`, validator clean.
- **Evidence Gate**: Crop loads <250 ms (mobile test), one-click open to source PDF, citation present, Git LFS tracked.
- **Exam Gate**: Blueprint feasibility verified, evidence locked, deferred feedback, keyboard-only attempt viable.
- **Analytics Gate**: `latest.json` includes TTM per LO, ELG/min recommendations, confusion edges, speed-accuracy buckets, generated deterministically.
<!-- A11y gate removed for this phase -->
- **Perf (Relaxed)**: Budgets may be exceeded when justified by visuals/animations.
 - **Engine Gate**: For the adaptive engine, enforce: blueprint rails within ±5% (per system/LO), exposure caps (≤1/day, ≤2/week, 96h cooldown), randomesque top‑K selector, stop rules (`SE ≤ 0.20` with min items, or `ΔSE` plateau, or `mastery_prob ≥ 0.85` with probe in `b ∈ [θ̂ ± 0.3]`), retention budgeting ≤40% baseline (≤60% if overdue >7d). Log reasons/signals for each selection.

## UX Stance (OKC‑Heavy)
- We are shipping a “wow‑first” interface. Visual richness, motion, and playful patterns come before compliance.
<!-- Accessibility checks are out of scope for this phase. -->
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
<!-- Accessibility score removed for this phase -->
- **Performance ★**: TTI <2 s, item render <100 ms, evidence <250 ms, CLS <0.1.
- **Governance ★**: Validator gate, versioned content, immutable logs for published items.

Keep this SOP current as tooling evolves. Changes require DocScribe + ReleaseManager sign-off.
- **Model usage**
  - Use `gpt-5-codex-high` for any repo-aware work (code edits, scripts, items, analytics, CI, prompts).
  - Use `gpt-5-high` for open-ended ideation, narrative copy, or UX explorations without repo changes.
  - Optional: use `gpt-5-codex-mid` for quick triage or small, low-risk edits when cost matters.

## Agent Recommendation Playbook
- Default: prefer `gpt-5-codex-high` for next steps that touch the repo.

### Model Tiers (selection guide)
- `gpt-5-minimal`: ultra‑cheap, for trivial checks, quick summaries, or routing.
- `gpt-5-low`: low‑cost narrative or brainstorming; not for code.
- `gpt-5-medium`: balanced narrative or light planning; limited code reasoning.
- `gpt-5-high`: long‑form PRD/IMPLEMENTATION prose; complex narrative synthesis.

- `gpt-5-codex-low`: quick triage, tiny diffs, find/replace, small config edits.
- `gpt-5-codex-medium`: moderate code edits in 1–3 files, simple tests.
- `gpt-5-codex-high` (default): repo‑aware multi‑file changes, engine work, tests, scripts, CI.

### Task → Agent → Model
- Study/Exam engine changes → AdaptiveEngineer + Implementation Strategist → `gpt-5-codex-high`.
- Item authoring/fixes → ItemSmith + EvidenceCurator + ValidatorFixer → `gpt-5-codex-high` (repo), `gpt-5-high` (rationale prose).
- Analytics/metrics & gates → AnalyticsEngineer → `gpt-5-codex-high`.
- UI flows/graphs → UIBuilder + GraphUX → `gpt-5-codex-high`.
- RAG/index/search → RAGEngineer → `gpt-5-codex-high`.
- Telemetry/privacy/env → DataSteward → `gpt-5-codex-high`.
- Planning/docs → PRD Architect / Implementation Strategist / DocScribe → `gpt-5-high` (narrative) or `gpt-5-codex-medium` for code‑referenced sections.

### Verification Note (online + local)
- Local source of truth: `~/.codex/config.toml` (`model`, `model_reasoning_effort`) — currently set to `gpt-5` with `high` effort. Adjust per task.
- Online sanity check: confirm your provider’s current model availability and capacity before overriding tiers. If a tier is unavailable, fall back to the nearest higher tier for correctness (e.g., prefer `codex-medium` → `codex-high`).

### “Next-Step Agent” Convention
- At the end of each artifact/PR or milestone update, include a line:
  - `Next agent: <Role> · Model: <gpt-5-codex-high|gpt-5-high|gpt-5-codex-mid> · Scope: <paths>`
- Examples:
  - `Next agent: AdaptiveEngineer · Model: gpt-5-codex-high · Scope: scripts/lib/{selector,scheduler}.mjs`
  - `Next agent: ItemSmith · Model: gpt-5-codex-high · Scope: content/banks/**`
  - `Next agent: UIBuilder · Model: gpt-5-codex-high · Scope: app/(study)/** components/**`

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
