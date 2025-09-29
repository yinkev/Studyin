Studyin Agent Workflow (Deterministic + Rubric-Gated)

- Models & Modes
  - Use `gpt-5-codex-high` for any repo-aware work (edits, scripts, items, analytics).
  - Use `gpt-5-high` for ideation-only tasks (copy/UX narratives) without repo touches.

- MCP & Docs
  - Always fetch up-to-date docs via Context7 MCP when spec details matter.
  - Pattern: resolve ID → fetch topic.
    - `resolve-library-id("<lib>")` → `get-library-docs(id, topic="<focus>")`.
  - Cite repos/lines or doc sources explicitly in PR descriptions.

- Role Playbook (AGENTS.md-aligned)
  - ProjectManager: keeps `PLAN.md` current; enforces acceptance gates; runs weekly `npm run score:rubric`.
  - PRD Architect: drafts `PRD.md` for significant changes; self-score ≥92/100 and ★ ≥2.9.
  - Implementation Strategist: drafts `IMPLEMENTATION.md` from PRD; self-score ≥92/100 and ★ ≥2.9.
  - ItemSmith/EvidenceCurator/ValidatorFixer: author → attach evidence → `npm run validate:items` clean.
  - UIBuilder/PerformanceTuner: implement flows with Tailwind v4 + Radix; monitor Web Vitals; keep item render <100 ms.

- Cadence
  1) Create feature branch and initial `PLAN.md` with Module Inputs (MODULE, SYSTEM/SECTION, SCOPE_DIRS, BLUEPRINT_PATH, METRICS_SOURCE).
  2) PRD Architect produces `PRD.md` citing repo paths (e.g., `scripts/analyze.mjs:42`).
  3) Implementation Strategist delivers `IMPLEMENTATION.md` with file-by-file plan, tests, and rollout/backout.
  4) Implement changes; keep diffs minimal and deterministic (no runtime LLM calls).
  5) Run gates locally: `npm run validate:items`, `npm test`, `npm run analyze`, optional `npm run ci:lh`.
  6) Open PR with analytics deltas or evidence links; PM reviews rubric scores and merges when gates pass.

- Agent Invocation
  - Start with an `update_plan` outline and keep exactly one step `in_progress` until complete.
  - Group shell actions behind a brief preamble (1–2 sentences) and run.
  - Prefer `rg` for code search; read files in ≤250 line chunks.
  - After edits, validate with focused tests first, then broader checks.

- Tailwind v4 Defaults
  - Keep plugins in CSS via `@plugin` and theme in `@theme` (see `app/globals.css`).
  - Use `@source` to include any non-standard template paths.
  - Avoid `tailwind.config.*` unless strictly necessary.

- Ship Criteria (excerpt)
  - Validator clean; rubric_score ≥2.7 on published items.
  - Analytics `public/analytics/latest.json` regenerates deterministically.
  - Perf targets monitored: TTI <2s, evidence <250 ms, CLS <0.1.
  - A11y non-blocking during OKC-heavy phase; document known issues.

