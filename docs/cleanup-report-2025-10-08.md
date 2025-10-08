# Deep Clean — Phases 21–26 Report (Oct 8, 2025)

## Summary
- Scope: Migrate `framer-motion` → `motion/react`, consolidate unused deps, sweep code quality, align scripts.
- Build: Passed (`next build`). Tests: 50/50 passing (Vitest). No regressions detected.

## Changes
- Moved follow‑the‑money game to `motion/react`.
  - `components/games/follow-the-money/ResultsModal.tsx`
  - `components/games/follow-the-money/Shell.tsx`
- Removed unused dependencies:
  - `framer-motion`
  - `echarts`
  - `recharts`
  - `dagre`
  - `@types/dagre` (dev)
- Cleaned production `console.*`:
  - Removed logs from `lib/hooks/useDashboardMetrics.ts` and `components/InteractiveLessonViewer.tsx`.
  - Remaining logs are confined to `lib/services/codex-sdk.example.ts` (examples only).
- Scripts cleanup:
  - Fixed `dev:open` port mismatch (`3000` → `3005`).
  - Updated `mcp:devtools` target to `http://localhost:3005`.
  - Added `docs/scripts.md` with script references.

## Metrics
- Files removed: 0
- Dependencies removed: 5
- Commits created: 5
  - d6e5131 chore(scripts): align dev ports to 3005 and document scripts
  - be37327 chore: remove dev console logs from production code (allow only error/warn)
  - e474a22 chore(deps): remove unused visualization/layout libs (echarts, recharts, dagre)
  - f49a729 chore: remove framer-motion dependency (consolidate on motion)
  - cce2cab chore: migrate framer-motion to motion for consistency
- Build time:
  - Before dep removals: ~3.3s (Next.js 15)
  - After dep removals: ~3.2s
- Test summary: 17 files, 50 tests, all passing (~385–414ms total runtime)

## Code Quality Scan
- TODOs (candidate tickets):
  - `lib/services/dashboardAnalytics.ts:145` — Look up LO name from registry
  - `app/summary/page.tsx:190` — Replace removed ECharts charts (D3/Recharts alt)
  - `lib/hooks/useXPSystem.tsx:21` — Replace local user ID with auth user
  - `lib/coach.ts:82` — Implement FSRS stability updates
- console.* (production):
  - None remaining (only `console.error` in error paths).
- Hardcoded http:// URLs:
  - `components/Mascot.tsx:18` — SVG namespace `http://www.w3.org/2000/svg` (benign/standard)

## Notes
- No runtime behavior changes expected; animation API parity maintained via `motion/react`.
- If ECharts is reintroduced later, prefer lazy loading and a unified theme adapter.

## Follow‑ups (optional)
- Convert TODOs above into GitHub issues.
- Consider pruning any additional unused dev tools after a full repo audit.
