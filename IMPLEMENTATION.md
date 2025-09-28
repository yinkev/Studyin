# Radix UI Adoption Implementation Plan

## Overview
This document translates the Radix UI PRD into concrete engineering work. Scope covers shared UI primitives, Study view integrations, accessibility/performance verification, and documentation updates. All changes stay deterministic—no runtime LLM calls or nonlocal side effects.

## Architecture & Files
- **Radix wrappers** (`components/ui/radix/*.tsx`): thin wrappers over Radix primitives, exporting Tailwind-friendly components similar to shadcn patterns.
- **App providers** (`app/providers.tsx`): client-only component wrapping the tree with `TooltipProvider` and future Radix context roots.
- **Layout integration** (`app/layout.tsx`): import and render Providers above `<Header />`, keeping skip link intact (`app/layout.tsx:16`).
- **Canvas tooltip** (`components/canvas/Tooltip.tsx`): convert to Radix `Tooltip.Root` with controlled `open` state and custom positioning that mirrors existing API.
- **Study view** (`components/StudyView.tsx`): add Radix Popover for “Why this next” and Dialog for evidence, ensuring keyboard shortcuts still toggle local state.
- **Documentation** (`README.md`, `AGENTS.md`, `PLAN.md` if Milestone update needed): note Radix stacks and role expectations.

## Interfaces & Components
1. `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` wrappers.
2. `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverArrow` wrappers.
3. `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogClose` wrappers.
4. `DropdownMenu`, `Tabs`, `Toast`, `VisuallyHidden` wrappers for future flows; expose only necessary primitives now but keep consistent API.
5. `FloatingTooltip` (canvas) maintains props `{ x: number; y: number; children: React.ReactNode }` but internally uses Radix for focus/aria compliance and portal rendering.
6. Study view additions:
   - `Why next` pill becomes a `PopoverTrigger` button with textual summary; popover lists deterministic metrics (spacing, mastery) derived from existing helper `getWhyThisNext`.
   - Evidence button opens `Dialog` containing figure plus metadata (file, page). The toggle (E key) now controls dialog visibility; maintain fallback text when no crop exists.

## Data Model Impacts
No schema changes. Evidence references remain as defined in `scripts/lib/schema.mjs:24`–`54`. Analytics usage remains unchanged.

## File-By-File Changes
1. **package.json / package-lock.json**
   - Add Radix dependencies: `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-visually-hidden`.
2. **components/ui/radix/**
   - Create wrapper files for each primitive with Tailwind classes matching `app/globals.css:14` theme tokens.
3. **components/canvas/Tooltip.tsx**
   - Replace current div with Radix content while keeping API; use `forceMount` and inline transform for precise placement.
4. **app/providers.tsx**
   - New client component returning `<TooltipProvider delayDuration={150}>{children}</TooltipProvider>`; export default `Providers`.
5. **app/layout.tsx**
   - Import Providers and wrap the returned body content (maintain header/footer order and skip link).
6. **components/StudyView.tsx**
   - Wrap `whyNext` pill as `Popover`. Add `Dialog` around evidence figure; ensure the `evidenceOpen` state drives dialog visibility so keyboard toggling persists.
   - Add VisuallyHidden text for keyboard instructions when needed.
7. **README.md**
   - Mention Radix UI as part of the stack and note wrappers path.
8. **AGENTS.md**
   - Update UIBuilder role to explicitly cover Radix primitives and note AccessibilityAuditor verification responsibilities.
9. **PLAN.md**
   - Append milestone/tasks if needed (e.g., “Adopt Radix wrappers in Study view”).

## Testing & Validation
- `npm run validate:items` (schema unchanged but run to ensure no regressions).
- `npm test` (Vitest) to confirm engines unaffected.
- `npm run analyze` to regenerate analytics JSON.
- `npm run ci:axe` (requires dev server) or manual `axe` invocation after verifying `npm run dev`; ensure zero critical issues per acceptance gate.
- `npm run ci:lh` optional local run if time permits; otherwise record expectation in PLAN.md.

## Observability & Telemetry
No new telemetry events required. Ensure existing logging fields (e.g., `opened_evidence` in `AttemptEvent`, `scripts/lib/schema.mjs:70`) reflect dialog usage: toggle dispatch should set `opened_evidence` to `true` when dialog opens. (Future work may wire this into analytics.)

## Accessibility & Performance Work
- Ensure Dialog content has labelled title/description and close button accessible via keyboard.
- Tooltip/Popover use `aria-live`-safe content and avoid focus trap unless necessary.
- Use `pointer-events-none` and CSS transforms to avoid layout thrash for canvas tooltip.
- Keep portal DOM minimal to reduce paint cost; rely on Tailwind classes for animation.

## Security & Privacy
No change; Radix components run fully client-side and respect local-first approach. Evidence dialog displays local data without new network calls.

## Rollout & Backout Strategy
- Branch: `feat/radix-ui-adoption` (example). Commit frequently with Conventional Commit messages (e.g., `feat(ui): add radix tooltip wrappers`).
- Backout: revert commits adding Radix wrappers and dependency updates if regressions emerge; locales unaffected.
- Gatekeeping: ProjectManager ensures `PRD.md` and `IMPLEMENTATION.md` stay updated; ReleaseManager blocks merge until accessibility/performance gates verified.

## Timeline & Ownership
- Day 1: Add dependencies, wrappers, providers (UIBuilder).
- Day 2: Refactor Study view tooltips/popovers/dialogs; run validation/tests (UIBuilder + AccessibilityAuditor).
- Day 3: Optional extension to Exam/Drills tooltip usage; run CI sweeps; update PLAN.md. ReleaseManager signs off once gates pass.

## Risk Register
| Risk | Owner | Status |
| --- | --- | --- |
| Tooltip positioning mismatch when canvas pans | UIBuilder | Validate on multiple viewport sizes; add unit visual check. |
| Evidence dialog breaks keyboard shortcuts | AccessibilityAuditor | Manual walkthrough ensures `onKeyDown` handlers persist. |
| Dependency install blocked offline | ProjectManager | Cache dependencies or vendor Radix packages if necessary. |
| Increased bundle size flagged by Lighthouse | PerformanceTuner | Compare `npm run build` stats; tree-shake unused exports. |
