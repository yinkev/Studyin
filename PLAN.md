# PLAN — Studyin UI/UX Phases 2–4

Owner: ProjectManager (Studyin PM)
Status: Active (Oct 7, 2025)
Scope: Token standardization, route cleanup, UX flows, tests/gates

## Milestones

1) Phase 2 — Token Standardization & Audit
- Goal: One design system across production pages using shared tokens.
- Status: 70% — All production pages converted; charts/theme bridge wired.
- Exit: No hard‑coded hex/legacy slate classes in production views; dark/light parity.

2) Phase 3 — Route Cleanup & Consolidation
- Goal: Remove prototype pollution; single upload flow.
- Status: 100% — `/drills` and `/insights` merged; `/upload-new` archived.
- Exit: No links to prototypes from production.

3) Phase 4 — UX Flow Enhancements
- Goal: Global breadcrumbs + footer; polish + perf checks.
- Status: 50% — Breadcrumbs/footer shipped; perf polish pending.
- Exit: CLS < 0.1 on target pages; budgets documented.

## TODO (numbered)

A. Phase 2 — Finish audit
1. Grep and replace any leftover slate/emerald/rose utility classes in production code.
2. Confirm ECharts option builders consistently use the theme adapter keys (text/grid/surface).
3. Re-run dark/light parity check after any edit.

B. Phase 3 — Hygiene (verification)
4. Scan for links to `app/_prototypes/**`; update/remove if found.
5. Ensure AppNav and CTAs reference only production routes.

C. Phase 4 — Perf & Motion
6. Spot‑check budgets: item render <100 ms; evidence <250 ms; CLS <0.1 on `/`, `/study`, `/summary`, `/upload`, `/exam`.
7. Trim heavy backdrops/shadows where necessary; keep token shadows.

D. Tests & Gates
8. Run Vitest: `npm test` (should pass).
9. Generate analytics: `npm run analyze` (writes `public/analytics/latest.json`).
10. Run Playwright smoke: `npm run test:e2e` (ensure dev server available on 3005).
11. Validate dev‑only ingestion gate: `/api/upload` → 403 without `NEXT_PUBLIC_DEV_UPLOAD=1`.

E. Docs & Handoff
12. Update `MASTER_PLAN_UIUX.md` completion % when C and D are done.
13. README: keep “UI/UX Improvements” and “E2E UI Tests” sections current.

## Merge Checklist (ReleaseManager)
- [ ] Phase 2, 3, 4 acceptance criteria satisfied.
- [ ] Tests green (Vitest + Playwright snapshots approved).
- [ ] `npm run analyze` regenerated; charts render under token theme.
- [ ] `/api/upload` dev-only confirmed.
- [ ] README + MASTER_PLAN_UIUX.md updated.

## Notes
- Deterministic policy: no runtime LLM calls; seeded randomness only.
- Keep archived prototypes under `app/_prototypes/` for reference until final cleanup window.

