# Studyin Plan (V5)

## Milestones

1) Core pipeline — DONE
- Schemas + Zod, validator with blueprint preflight
- Deterministic engines (Elo-lite, spacing, blueprint fitter)
- Analyzer + rubric scorer

2) UI core — IN PROGRESS
- Landing, Study, Exam, Drills, Summary
- Charts (D3) + Canvas TTM
- A11y keyboard paths, evidence panel

3) Analytics & Drills — IN PROGRESS
- Refine TTM/ELG/min definitions
- Confusion graphs, speed×accuracy
- ELG/min playlists + reasons

4) Governance & CI — IN PROGRESS
- CI: build, validate, unit, analyze, e2e axe, Lighthouse
- CODEOWNERS, PR template, rubric score surfaced

## To‑Do

- Evidence: replace placeholder crops with real assets; add `source_url`; flip items to `review`/`published`.
- Analytics: enrich `data/events.ndjson`, rerun analyze, iterate chart formats & tooltips.
- Exam polish: add timer + blueprint meter; lock evidence; post‑submit score.
- Summary polish: Canvas confusion graph (optional), D3 tooltips, consistent legends.
- CI: raise Lighthouse thresholds once stable; make axe fail on “serious+”.
- Docs: keep README/AGENTS/PLAN current; add screenshots to PR template.

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.
- Weekly: run `npm run score:rubric` and publish the snapshot.
- Release: gates green (validator, a11y, perf, rubric); evidence latency spot‑check; blueprint preflight passes.

