# Radix UI Integration PRD

## Context & Problem Statement
- Current UI components lean on bespoke Tailwind compositions with limited shared primitives. Components such as the floating tooltip in `components/canvas/Tooltip.tsx:6` rely on custom focus and positioning logic, increasing regression risk whenever accessibility rules evolve.
- The layout already enforces Skip to Content and semantic structure (`app/layout.tsx:16`), but keyboard paths in Study/Exam/Drill modes require consistent focus handling. Without a shared primitive layer, each feature must implement its own aria/focus logic, slowing delivery.
- SOP gates expect WCAG 2.2 AA compliance and zero axe critical issues (`AGENTS.md:65`). Meeting those gates reliably needs primitives with tested focus management.

## Goals
1. Adopt Radix UI primitives as the shared accessibility backbone for Studyin’s interactive surfaces while preserving Tailwind styling.
2. Replace bespoke overlays (tooltips, popovers, dialogs) with Radix-based components that pass keyboard, focus, and screen-reader requirements.
3. Maintain deterministic rendering performance within existing budgets (`.lighthouserc.json:12`–`18`), avoiding layout shift or blocking-time regressions.
4. Document the architecture so future modules can reuse the same approach, satisfying DocScribe expectations (`AGENTS.md:15`).

## Non-Goals
- No visual redesign beyond minor spacing/contrast tweaks necessary for Radix styling.
- No introduction of runtime theming engines or design tokens beyond what `app/globals.css:1` already defines.
- No change to deterministic analytics engines (`scripts/analyze.mjs`) or item validation (`scripts/validate-items.mjs`).

## Personas & Scenarios
- **Author (ItemSmith / UIBuilder):** Needs reliable dialog/tooltip primitives to surface evidence and “Why this next” reasoning without rebuilding focus logic each time.
- **Student (Keyboard-first):** Navigates Study mode using shortcuts explained in `components/StudyView.tsx:55`–`64`. The new components must preserve these shortcuts and allow focus to remain predictable when popovers/dialogs open.
- **AccessibilityAuditor:** Runs axe via `npm run ci:axe` and expects zero critical failures by default.

## Functional Requirements
1. Provide Radix wrappers (`components/ui/radix/*.tsx`) for Tooltip, Popover, Dialog, DropdownMenu, Tabs, Toast, and VisuallyHidden. Expose Tailwind-friendly APIs.
2. Replace the ad-hoc canvas tooltip with a Radix-backed implementation preserving the same API (`components/canvas/Tooltip.tsx`).
3. Introduce an application-wide `TooltipProvider` to ensure consistent delays (`app/layout.tsx`, new `app/providers.tsx`).
4. Update Study view to expose “Why this next” rationale via Radix Popover, keeping deterministic copy derived from analytics (see `components/StudyView.tsx:16`–`35`).
5. Expose evidence details through a Radix Dialog with focus trap while keeping existing toggle shortcuts (`components/StudyView.tsx:104`–`143`).
6. Ensure Radix primitives are available for future flows (Exam, Drills, Summary) even if immediate adoption is limited in this iteration.

## Non-Functional Requirements
- **Accessibility:** WCAG 2.2 AA, skip link remains functional (`app/layout.tsx:16`), dialogs must trap focus and close on Escape.
- **Performance:** Meet Lighthouse budgets (TTI <2s, FCP <2s, TBT <200 ms, CLS <0.1 per `.lighthouserc.json:12`–`18`). Tooltips/popovers should avoid forced reflow by using portals and CSS transforms.
- **Determinism:** No runtime network calls or LLM usage; components must behave predictably offline.

## Acceptance Criteria
1. Axe CLI (`npm run ci:axe`) reports zero critical issues with Radix components mounted. AccessibilityAuditor signs off.
2. Keyboard walkthrough of Study, Exam, Drills, Summary passes without focus loss; evidence dialog opens/closes via keyboard.
3. Lighthouse CI maintains existing performance budgets; any regressions require mitigation plan.
4. Docs (`README.md`, `AGENTS.md`) reflect Radix usage and updated role expectations.

## Metrics
- Accessibility: Number of axe violations (target 0 critical).
- Performance: Lighthouse scores meeting thresholds.
- Adoption velocity: Time to author new interactions using wrappers (qualitative; tracked in PLAN.md updates).

## Rollout Plan
1. Add Radix dependencies and wrappers.
2. Wrap App layout with shared providers.
3. Refactor tooltips/popovers/dialogs in Study view.
4. Update documentation and SOP roles.
5. Run validation suite: `npm run validate:items`, `npm test`, `npm run analyze`, `npm run ci:axe`, `npm run ci:lh` (locally or in CI as feasible).

## Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Portal stacking conflicts with sticky header (`components/marketing/Header.tsx:17`) | Ensure tooltip/dialog portals mount at document.body with higher z-index and override stacking contexts via Tailwind classes. |
| Radix SSR hydration mismatches | Use `forceMount` where content is conditionally rendered and ensure client-only components guard with `'use client';` |
| Increased bundle size | Tree-shake by importing only used Radix primitives; wrap exports via barrel files. |
| Keyboard shortcut collisions (Study view toggles) | Preserve existing handlers in `components/StudyView.tsx:55`–`74` and ensure dialogs respect `onOpenChange` tied to state. |

