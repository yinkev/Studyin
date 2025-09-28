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

### Recommendation
1. **Ship Radix Study refactor with tight QA cadence.**
   - Scope: Complete Day 2 tasks from `IMPLEMENTATION.md` for the Study mode — Radix Popover for “Why this next”, Radix Dialog for evidence drawer, parity for keyboard shortcuts, and snapshot updates if component structure changes.
   - Owners: UIBuilder (implementation), AccessibilityAuditor (paired review).
   - Definition of done: feature branch demos clean keyboard-only traversal (tab/shift+tab/esc shortcuts preserved) and preserves analytics/tooling hooks.
2. **Immediately verify a11y and performance gates after merge.**
   - Commands: `npm run ci:axe`, manual keyboard pass (Study mode), `npm run ci:lh` targeting ≥0.9 accessibility / ≥0.75 performance baseline.
   - Owners: AccessibilityAuditor (axe + manual), PerformanceTuner (Lighthouse + bundle diff notes).
   - Definition of done: no axe serious/critical issues; Lighthouse deltas recorded in PLAN.md if any drop >0.03.

### Next Up (Immediate Focus)
- **Execution checklist for Radix Study refactor:**
  1. Rebase feature branch on latest main and confirm no conflicting Radix primitives already landed.
  2. Implement Popover/Dialog swaps with Radix accessible primitives; update keyboard shortcut map if the trigger semantics shift.
  3. Update unit stories/tests (if present) and capture before/after screenshots for QA archive.
  4. Pair with AccessibilityAuditor for focused keyboard + screen-reader smoke test before requesting review.
- **Post-merge QA + monitoring:**
  1. Run `npm run ci:axe` in CI or locally and attach summary to PR description.
  2. Execute manual keyboard walkthrough (Study mode: entry, rationale popover, evidence dialog, exit) and note findings.
  3. Capture Lighthouse report via `npm run ci:lh`; compare against previous baseline and list mitigation steps for any regression.

### Backlog (Keep Warm)
- UI: finish Radix adoption across Exam/Drill views; audit focus traps and keyboard paths after tooltip/dialog refactor.
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
