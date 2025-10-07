# HeroUI → Mantine UI Migration Plan (Studyin)

Date: 2025-10-07
Target: Mantine UI v8.3.0 (latest stable), Next.js 15, React 18, TypeScript
Scope: Replace HeroUI v2.8.5 (NextUI-based) with Mantine across Dashboard, Follow The Money game, and Study interface while preserving gamification UX, animations (Anime.js, Framer Motion), and accessibility.

---

## 0) Summary & Guardrails

- Approach: Incremental, page-by-page migration with a brief compatibility layer for low‑risk swaps, then refactor to idiomatic Mantine.
- Determinism: No runtime LLM calls. Keep Tailwind v4 and animation libs unchanged.
- Budgets: TTI < 2 s, item render < 100 ms, evidence < 250 ms, CLS < 0.1.
- Accessibility: Preserve current roles/ARIA, focus management, keyboard paths.
- Removal: HeroUI packages must be fully removed in Phase 4; verify no imports remain.

---

## 1) Component Mapping (HeroUI → Mantine v7)

| Use case | HeroUI | Mantine | Notes / mapping details |
|---|---|---|---|
| Cards | `Card`, `CardHeader`, `CardBody` | `Card`, `Card.Section`, `Group`, `Stack` | Replace header/body with `Card.Section` (with `inheritPadding`, `withBorder`) and layout via `Group/Stack`.
| Buttons | `Button` (`variant: solid, flat, bordered, light, shadow`; `startContent`) | `Button` (`variant: filled, light, outline, default, subtle, transparent`; `leftSection`, `rightSection`) | Map: `solid→filled`, `flat→light`, `bordered→outline`, `light→subtle`, `shadow→filled + shadow class`. Replace `startContent`→`leftSection`.
| Linear progress | `Progress` | `Progress` | Class names migrate to `className`; color map via theme or `color` prop.
| Circular progress | `CircularProgress` | `RingProgress` | Use `label` for value or wrap with `Text`.
| Chips (display tag) | `Chip` (often non-interactive) | `Badge` or `Pill` | Mantine `Chip` is for selection; use `Badge`/`Pill` for static tags.
| Tooltip | `Tooltip content=` | `Tooltip label=` | Prop rename.
| Skeleton | `Skeleton` | `Skeleton` | Map `className` to `visible/height/width` where preferred.
| Modal | `Modal isOpen isDismissable hideCloseButton size` | `Modal opened onClose withCloseButton size` | Disable outside close via `closeOnClickOutside={false}`; portals managed by Mantine.
| Avatar | `Avatar` | `Avatar` | Parity; style via className.
| Count badge over element | `Badge` wrapping | `Indicator` | Use `Indicator` with `label` around `Avatar`.
| Navbar | `Navbar` | `Header` + `AppShell` + `Group` | Replace `Navbar*` set with Mantine layout primitives.

Custom components to refactor (use Mantine primitives):
- `components/ui/AppHeader.tsx` → use `Header`, `Group`, `Button`, `Indicator`, `Avatar`.
- `components/ui/WhyThisQuestionCard.tsx` → `Card`, `Button`, `Modal`.
- Game components (`FollowTheMoneyGame.tsx`, `Shell.tsx`, `ResultsModal.tsx`) → Cards/Buttons/Modal.

Theme/token strategy:
- Keep existing CSS variables (e.g., `--accent-trust`, `--surface-bg*`, `--text-*`) defined in `app/globals.css` as the single source of truth.
- Create `lib/ui/mantine-theme.ts` with `createTheme` and a small `cssVariablesResolver` to alias Mantine tokens to our CSS vars (e.g., primary → `--accent-trust`).
- Use `defaultColorScheme="auto"` (Mantine) and keep our `ThemeProvider` (class `dark`/`light`). Add a lightweight bridge to sync Mantine color scheme with the current root class (optional refinement in Phase 2).

---

## 2) Migration Strategy & Phases

Phase 1 — Install & Bootstrap (Provider)
- Add Mantine deps, wire `MantineProvider` and `ColorSchemeScript`.
- Ensure styles import order and SSR setup for App Router.

Phase 2 — Dashboard (first)
- Replace UI primitives in `app/dashboard/page.tsx` (Cards, Buttons, Progress/Badge/Tooltip/Skeleton, RingProgress).
- Validate layout/spacing and tokens.

Phase 3 — Game
- Replace Cards/Buttons/Chips→Badges and Modal in:
  - `components/games/follow-the-money/FollowTheMoneyGame.tsx`
  - `components/games/follow-the-money/ResultsModal.tsx`
  - `components/games/follow-the-money/Shell.tsx`
- Keep Anime.js + Framer Motion animations intact.

Phase 4 — Study Interface & Layout
- Migrate `app/layout.tsx` (Navbar → `Header`+`Group`) and `app/page.tsx`.
- Replace remaining HeroUI uses: `components/ui/WhyThisQuestionCard.tsx`, `components/ui/AppHeader.tsx`.
- Remove HeroUIProvider and packages; repo‑wide import sweep.

Phase 5 — Cleanup & Hardening
- Remove any compatibility shims, dead styles; run tests, QA, and performance checks.

---

## 3) Breaking Changes & Risks

API differences
- Button props: `startContent` → `leftSection`; variant names differ (see mapping).
- Modal: `isOpen` → `opened`, `hideCloseButton` → `withCloseButton={false}`, `isDismissable` → `closeOnClickOutside`.
- `CircularProgress` → `RingProgress` (structure/props differ).
- `Chip` non-interactive → use `Badge`/`Pill`.

Animations
- Mantine does not conflict with Anime.js/Framer Motion. Retain current motion wrappers and `className` styling. Verify Modals with Framer Motion children (portal layering/z-index).

Responsive styling
- HeroUI provided some internal spacing; Mantine favors layout primitives. Use Tailwind classes you already have and complement with `Group/Stack` where needed.

Accessibility
- Keep explicit `button` elements and ARIA in game shells (`Shell.tsx`). Ensure Mantine Modal focus trapping mirrors current behavior; add `closeOnEscape` settings to match UX.

Theming
- Dual theme systems (our class-based + Mantine) can drift. Use `defaultColorScheme="auto"` initially; optionally add a tiny bridge to call `setColorScheme('dark'|'light')` when our `ThemeProvider` toggles.

Performance
- Mantine styles are runtime-injected CSS variables; ensure `@mantine/core/styles.css` is included once. Validate Lighthouse metrics post‑migration.

Mitigations
- Introduce a small compatibility layer (optional) under `components/ui/compat/` to map common props during Phase 2–3, then remove in Phase 5.

---

## 4) Implementation Plan (exact steps)

Dependencies
- Install: `@mantine/core@^7`, `@mantine/hooks@^7`, `@mantine/notifications@^7` (optional).
- Remove in Phase 4: `@heroui/react`, `@heroui/system`, `@heroui/theme`.

Provider & layout
1) `app/layout.tsx`
   - Import `@mantine/core/styles.css`.
   - Add `{...mantineHtmlProps}` to `<html>`.
   - Insert `<ColorSchemeScript defaultColorScheme="auto" />` inside `<head>`.
   - Wrap `<MantineProvider defaultColorScheme="auto" theme={theme}>` around app.
2) `app/providers.tsx`
   - Remove `HeroUIProvider` wrapper.
   - Export a `MantineThemeBridge` that reads `getActiveTheme()` and (optionally) calls `setColorScheme` from `useMantineColorScheme` to sync on mount.
3) `lib/ui/mantine-theme.ts`
   - `createTheme({ primaryColor: 'brand', colors: { brand: [...] } })` (derive shades from existing CSS vars or static palette close to `--accent-trust`).
   - `cssVariablesResolver` to alias `--mantine-color-text` etc. to existing tokens where helpful.

Dashboard (first target)
4) `app/dashboard/page.tsx`
   - Replace imports from `@heroui/react` with `@mantine/core`:
     - `Card`, `Card.Section`, `Button`, `Progress`, `Badge`, `Tooltip`, `Skeleton`.
     - `RingProgress` instead of `CircularProgress` (use `label` for percentage).
   - Map variants and `startContent`→`leftSection`.

Game
5) `components/games/follow-the-money/ResultsModal.tsx`
   - `Modal` props: `opened`, `onClose`, `withCloseButton={false}`, `closeOnClickOutside={false}`.
6) `components/games/follow-the-money/FollowTheMoneyGame.tsx`
   - Replace `Chip` with `Badge`.
   - Replace Card/Button as in Dashboard.
7) `components/games/follow-the-money/Shell.tsx`
   - Swap Card for Mantine `Card` (keep the outer native `button` for a11y). Maintain motion animations.

Study interface & header
8) `components/ui/AppHeader.tsx`
   - Replace NavBar with `Header` + `Group`; replace count `Badge` with `Indicator` over `Avatar`.
9) `components/ui/WhyThisQuestionCard.tsx`
   - Swap Card/Button; Modal as in Step 5.
10) `app/page.tsx` and `app/summary/page.tsx`
    - Replace basic components similarly.

Removal & cleanup
11) Repo sweep: `rg -n "@heroui"` → ensure zero matches.
12) `package.json`: remove HeroUI deps; run `npm i`.
13) Purge dead styles/classes and any `HeroUIProvider` remnants.

---

## 5) Testing & Validation

Checkpoints (per phase)
- Phase 1: App boots; color scheme toggles; no layout regressions; Lighthouse (Home) ≥ 90 Perf.
- Phase 2 (Dashboard):
  - Playwright route test `/dashboard`: key elements visible; RingProgress shows value; buttons clickable.
  - Visual snapshot compare (±2% pixel diff).
- Phase 3 (Game):
  - E2E flow: start game → shuffles animate (Anime.js) → selection → Modal appears → XP awarded.
  - Keyboard: Space/Enter triggers selection; focus outline visible.
- Phase 4 (Study):
  - MCQ interactions, evidence panel toggles, framer-motion effects, header nav.
- A11y sanity: Tab order, focus trap in Modal, Tooltip announces labels.

Scripts to run
- `npm run test` (Vitest smoke tests).
- `npm run test:e2e` (Playwright) — add 3 focused specs for `/dashboard`, `/games/follow-the-money`, `/study`.
- `npm run analyze` and Lighthouse CI (optional) to check budgets.

---

## 6) Alternatives

- Compatibility shims (faster): Implement `components/ui/compat/{Button,Card,Progress,Modal,Chip,Badge,Tooltip,Skeleton}.tsx` exposing the subset of HeroUI-like props used here and rendering Mantine under the hood. Pros: tiny diffs per file; Cons: adds a layer to remove later (Phase 5).
- Direct refactor (cleaner end-state): Update all imports/props to Mantine immediately. Pros: fewer abstractions long-term; Cons: larger diffs, higher regression risk.

Recommendation: Use shims for Dashboard + Game; direct refactor for Study and layout once patterns are stable.

---

## 7) Work Items (ordered)

1. Add Mantine provider and theme bridge:
   - `app/layout.tsx`, `app/providers.tsx`, `lib/ui/mantine-theme.ts` (new).
2. Dashboard migration: `app/dashboard/page.tsx`.
3. Game migration: `components/games/follow-the-money/{FollowTheMoneyGame,ResultsModal,Shell}.tsx`.
4. Study migration: `components/ui/{AppHeader,WhyThisQuestionCard}.tsx`, `app/page.tsx`, `app/summary/page.tsx`.
5. Remove HeroUI; sweep imports; update `package.json`.
6. Tests: Add Playwright specs for 3 routes; run smoke tests and budgets.

---

## 8) Risks & Mitigations

- Visual drift (spacing/typography): snapshot tests; keep Tailwind layout classes; prefer Mantine `Group/Stack` to mirror spacing.
- Modal layering with Framer Motion: verify z-index theme tokens; set `zIndex={
  { modal: 200 } }` in theme if needed.
- Color scheme divergence: add bridge hook to sync Mantine with existing `ThemeProvider` during Phase 2.
- Performance regressions: import `@mantine/core/styles.css` once; lazy‑load heavy routes unchanged.

---

## 9) Exact Diffs (high-level guidance)

- `app/layout.tsx`
  - Add: `import '@mantine/core/styles.css'`
  - Add: `import { MantineProvider, ColorSchemeScript, mantineHtmlProps } from '@mantine/core'`
  - Wrap `<MantineProvider defaultColorScheme="auto">{children}</MantineProvider>` and insert `<ColorSchemeScript defaultColorScheme="auto" />` in `<head>`.
- `app/providers.tsx`
  - Remove `HeroUIProvider`; add `MantineProvider` and (optional) a `MantineThemeBridge` that calls `setColorScheme` based on `getActiveTheme()` on mount.
- Replace per-file imports from `@heroui/react` with `@mantine/core` and adjust props:
  - `startContent`→`leftSection`, `variant` mapping, `isOpen`→`opened`.
  - `CircularProgress`→`RingProgress`.

---

## 10) Rollout & Backout

- Branch: `feat/ui-mantine-migration` → PRs per phase. Attach screenshots and Playwright artifacts.
- Backout: Revert phase PR if regressions exceed budgets; HeroUI remains until Phase 4.
- Done when: `rg "@heroui"` returns none; budgets pass; Playwright green on 3 routes.

---

## 11) Acceptance Gates (Studyin SOP)

- Exam/Engine gates unaffected.
- UI Gate for this migration:
  - Validator/test/analyze CI green; Lighthouse (P95) budgets respected.
  - Determinism preserved; no API/runtime calls.
  - “Why this next” transparency and gamification visuals unchanged.

---

## 12) References (files to change)

- `app/dashboard/page.tsx`
- `components/games/follow-the-money/{FollowTheMoneyGame.tsx,ResultsModal.tsx,Shell.tsx}`
- `app/layout.tsx`, `app/providers.tsx`
- `app/page.tsx`, `app/summary/page.tsx`
- `components/ui/{AppHeader.tsx,WhyThisQuestionCard.tsx}`
- New: `lib/ui/mantine-theme.ts`, optional `components/ui/compat/*`


