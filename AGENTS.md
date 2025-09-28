# Studyin Agent SOPs — OMS-1 Upper Limb Module

## Roles & Responsibilities

- **ItemSmith (Codex)** — Draft and revise MCQs (A–E) for Studyin, ensure per-choice rationales, align with blueprint & LO taxonomy, attach evidence, run `npm run validate:items` before submitting.
- **EvidenceCurator** — Produce crops/PDF references (`content/evidence/**`), record page/figure/bbox/citation, verify crop loads <250 ms and dimensions stored (`cropPath` preferred, AVIF/WebP + fallback).
- **ValidatorFixer** — Resolve validator errors without altering clinical meaning; maintain schema_version, evidence integrity, and rubric ≥2.7 for published items.
- **AnalyticsEngineer** — Maintain deterministic engines (`scripts/lib`), keep `scripts/analyze.mjs` outputs aligned with rubric metrics (TTM, ELG/min, confusion, speed-accuracy).
- **UIBuilder** — Implement Study/Exam/Drill/Summary flows (Next.js + Tailwind + shadcn/ui) with keyboard paths and “Why this next” transparency.
- **AccessibilityAuditor** — Run Playwright + axe and manual keyboard walkthrough; enforce WCAG 2.2 AA, focus-visible, target-size, and zero critical issues.
- **PerformanceTuner** — Guard budgets (TTI <2s, item render <100 ms, evidence <250 ms, CLS <0.1). Instrument Web Vitals.
- **DrillPlanner** — Build playlists from analytics (confusion edges, spacing deficits); ensure drills end on mastery/fatigue heuristics.
- **QA-Proctor** — Validate exam realism: blueprint satisfied, evidence locked, deferred feedback, deterministic scoring.
- **ReleaseManager** — Own GitHub Flow, PR previews (Vercel), Conventional Commits, changelog, and rubric score ≥90 with ★ categories ≥2.7.
- **DocScribe** — Keep README, AGENTS.md, rubric docs, prompts, and changelog accurate.
- **DataSteward** — Ensure telemetry (`data/events.ndjson`) is pseudonymous, export-ready, and schema_version aligned.

## Commands & Checks

```bash
npm install          # Install deps (zod, vitest)
npm run validate:items  # Validate all items (blocking gate)
npm run analyze         # Generate public/analytics/latest.json
npm test                # Run Vitest engine smoke tests
```

Optional (when Next.js scaffold exists): `npm run dev`, `npm run build`.

## Acceptance Gates

- **Item Gate (blocking)**: ABCDE present, per-choice rationales (correct + distractors), LO mapped, difficulty & Bloom set, evidence {file,page,(bbox|cropPath)}, rubric_score ≥2.7 once status `published`, validator clean.
- **Evidence Gate**: Crop loads <250 ms (mobile test), one-click open to source PDF, citation present, Git LFS tracked.
- **Exam Gate**: Blueprint feasibility verified, evidence locked, deferred feedback, keyboard-only attempt viable.
- **Analytics Gate**: `latest.json` includes TTM per LO, ELG/min recommendations, confusion edges, speed-accuracy buckets, generated deterministically.
- **A11y & Perf**: WCAG 2.2 AA, zero axe critical errors, TTI <2 s, LCP <2.5 s, INP <200 ms, CLS <0.1.
- **Rubric Compliance**: World-class rubric score ≥90/100; all ★ categories ≥2.7, no regressions from previous release without mitigation plan.

## Workflow Expectations

- Follow GitHub Flow: feature branch → PR → review → merge → deploy.
- Run `npm run validate:items` and `npm test` locally before PR.
- Attach analytics delta or evidence links when relevant; supply proof of blueprint feasibility if exam changes.
- If using external scaffolds (Claudable), tag PR with `eject-from-claudable` and ensure sandbox code not shipped.
- Document schema changes in README + change log; bump `schema_version` fields as needed.

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
  - Record `{file, page, figure?, bbox?|cropPath?, citation}`; prefer `cropPath` to pre-generated AVIF/WebP + PNG fallback.
  - Load test: P95 <250 ms on mid-range laptop; include natural width/height to avoid CLS.
