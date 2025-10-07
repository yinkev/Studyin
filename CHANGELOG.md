# Changelog

## 2025-10-07

### UI Migration: HeroUI v2.8.5 → Mantine UI v8.3.0

**Phase A: Component Migration**
- Migrated all components from HeroUI to Mantine UI v8.3.0
  - `AppNav.tsx`: Navbar → Mantine Avatar, Button, Menu, Indicator, Burger, Group, Box
  - `FollowTheMoneyGame.tsx` and Shell/ResultsModal: Card, Button, Badge with Mantine
  - `WhyThisQuestionCard.tsx`: Card, Button, Modal migration
  - Landing page (`app/page.tsx`): Card, Progress, Button with conditional rendering
  - Dashboard (`app/dashboard/page.tsx`): Card, Progress, Badge, RingProgress, Tooltip, Skeleton
  - Summary page (`app/summary/page.tsx`): Card migration with consistent header/body pattern
- Removed HeroUIProvider from `app/providers.tsx`
- Uninstalled all HeroUI packages: `@heroui/react`, `@heroui/system`, `@heroui/theme` (191 packages removed)
- Fixed CSS imports: consolidated to single `@mantine/core/styles.css` import
- Removed AppShell structure causing component errors
- Removed all placeholder content from landing page and components

**Phase B: Analytics & Telemetry**
- Installed `recharts` as peer dependency for `@mantine/charts`
- Created game telemetry system:
  - `lib/services/gameTelemetry.ts`: Telemetry service with session tracking
  - `app/api/game-telemetry/route.ts`: API endpoint for logging game sessions
  - Integrated telemetry into Follow The Money game component
  - Tracks difficulty, win/loss, time, XP gained per session
- Verified dashboard uses real data from `useDashboardMetrics` hook (no placeholders)

**Phase C: Engine Improvements**
- Enabled exposure caps and cooldown eligibility in study engine (`lib/study-engine.ts:343`)
  - Changed `disableCaps = true` to `disableCaps = false`
  - Enabled cooldown-based eligibility: `eligible = cooldown >= effectiveCooldownHours`
- Created comprehensive cooldown integration tests (`tests/engine.cooldown.test.ts`)
  - Tests cooldown eligibility marking
  - Tests scheduling respects cooldowns
  - Tests fallback to ineligible pool when needed
  - All 4 tests passing

**Testing**
- All E2E tests passing: 9/9 tests
  - Home, dashboard, study, summary, upload, exam routes render successfully
  - Navbar and theme toggle persist correctly
  - Dev-only upload gate working
- All unit tests passing
- All cooldown integration tests passing (4/4)

**Status**: Migration complete, all pages loading with 200 OK, zero HeroUI dependencies remaining.

---

## 2025-10-06

- Added strong TypeScript interfaces for study and retention events, eliminating `unknown` payloads when parsing schemas.
- Introduced `types/scripts-modules.d.ts` and `types/animejs.d.ts` to document and type deterministic script exports and UI animation helpers.
- Hardened `/api/search` typing and sanitation logic, ensuring evidence chunks return typed LO arrays.
- Updated adaptive study flows and services to consume the new engine metadata shapes.
