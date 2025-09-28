# Studyin Plan (V5)

## Milestones

1) Core pipeline — DONE
- Schemas + Zod, validator with blueprint preflight
- Deterministic engines (Elo-lite, spacing, blueprint fitter)
- Analyzer + rubric scorer

2) UI core — IN PROGRESS
- Landing, Study, Exam, Drills, Summary (baseline complete; continue polish)
- Charts (D3 + canvas) with tooltips/gridlines — DONE
- A11y keyboard paths, evidence panel — DONE / monitor regressions

3) Analytics & Drills — IN PROGRESS
- Refine TTM/ELG/min definitions
- Confusion graphs, speed×accuracy
- ELG/min playlists + reasons

4) Governance & CI — IN PROGRESS
- CI: build, validate, unit, analyze, e2e axe, Lighthouse
- CODEOWNERS, PR template, rubric score surfaced

## To‑Do

- UI: finish Radix adoption across Study/Exam/Drill views; audit focus traps and keyboard paths after tooltip/dialog refactor.
- Evidence: replace placeholder crops with real assets; add `source_url`; flip items to `review`/`published`.
- Analytics: enrich `data/events.ndjson`, rerun analyze, iterate chart formats & tooltips.
- Exam polish: add timer + blueprint meter; lock evidence; post‑submit score.
- Summary polish: optional canvas confusion graph; add chart tooltips/legends if analytics grow.
- CI: monitor Lighthouse thresholds (perf ≥0.75, a11y ≥0.9) and tighten over time; keep axe serious+ gating green.
- Docs: keep README/AGENTS/PLAN current; add screenshots to PR template.

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.
- Weekly: run `npm run score:rubric` and publish the snapshot.
- Release: gates green (validator, a11y, perf, rubric); evidence latency spot‑check; blueprint preflight passes.
