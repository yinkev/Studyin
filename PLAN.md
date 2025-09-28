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

## Recently Completed

- Radix UI adoption finished across Study, Exam, and Drills, with keyboard shortcuts and dialog focus traps verified.
- Evidence library refreshed with production crops, canonical `source_url` links, and eligible items promoted from `draft` to `review`/`published`.
- Analytics pipeline seeded with richer telemetry, regenerated `latest.json`, and chart components upgraded with accessible tooltips.
- Exam flow now ships a timed session header, blueprint coverage meter, and post-submit score/LO summary while keeping evidence locked.
- Governance docs and README updated to reflect CI expectations and the refreshed product surface.

## Next Five To‑Dos

1. **Exam review export** — add a downloadable review packet (PDF/CSV) that includes incorrect items with evidence citations and LO mastery trends.
2. **Adaptive scheduling** — wire the spacing engine into Study mode so TTM deltas schedule the next item deterministically.
3. **Analytics segmentation** — extend `npm run analyze` to surface learner cohorts (e.g., keyboard-only vs. mixed input) and write the delta to `public/analytics/latest.json`.
4. **Performance guardrails** — instrument Web Vitals in the app shell and document the measurement workflow in README plus CI.
5. **Validator hardening** — expand `npm run validate:items` to fail on stale `source_url` responses (HTTP 4xx/5xx) and record the latency budget in PLAN.

Items beyond this top-five backlog (e.g., Summary canvas confusion graph) can re-enter the queue once the above are completed or unblocked.

## Cadence
- Daily: sync PLAN status; triage issues; verify CI on latest PRs.
- Weekly: run `npm run score:rubric` and publish the snapshot.
- Release: gates green (validator, a11y, perf, rubric); evidence latency spot‑check; blueprint preflight passes.
