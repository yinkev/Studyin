# Architecture Overview

Behavior-neutral description of Studyin layers, allowed imports, and examples. See README (Architecture Boundaries, Determinism Policy) and AGENTS.md (Architecture Gates) for gates and workflow.

## Layers

- Core (`core/**`)
  - Pure types and use-cases. No direct `scripts/lib/*.mjs` imports in new code.
  - May consume Engine (`@engine`) and Server types where needed.
- Engine (`lib/engine/**`, public barrel `@engine`)
  - Facade over deterministic algorithms; exposes stable APIs for UI/Core/Server.
  - If algorithms live in `scripts/lib/*.mjs`, access them only via `lib/engine/shims/**`.
- Server (`lib/server/**`) and Services (`services/**`)
  - Server-only forms, events, state, adapters. Services provide repository/service abstractions.
  - Prefer Engine/Core APIs. Avoid direct `scripts/lib/*.mjs` imports in new code.
- UI (`app/**`, `components/**`)
  - Next.js pages/components. Depends on Server and Engine public APIs only.
- Scripts (`scripts/lib/*.mjs`, `scripts/**`)
  - Deterministic CLIs and engines; used by jobs and analysis. Not imported directly from domain TS/TSX code.

## Allowed Imports (→)

```
Core → Engine → Server/Services → UI
Scripts/lib .mjs ⇐(via Engine shims) Engine
```

Forbidden (new code)
- UI/Core/Services → `scripts/lib/*.mjs` (import through Engine/shims instead)
- Upward imports against the arrow (e.g., Engine importing UI)

## Examples (in-repo)

- Core using Engine facade
  - `core/use-cases/executeStudyAttempt.ts:4-9` imports from `../../lib/study-engine` for STOP_RULES/EAP helpers.
- Services using Server helpers
  - `services/state/jsonRepository.ts:1-5` uses `lib/server/study-state` to load/save learner state.
- Engine algorithm access (current pattern)
  - `lib/study-engine.ts:1-6` imports deterministic helpers from `scripts/lib/*.mjs`.
  - Target: wrap these via `lib/engine/shims/**` and re-export from `@engine` for domain consumers.
- UI depending on Core/Services
  - `app/study/actions.ts:3-7` wires use-cases and repositories without importing `scripts/lib`.

## Determinism Notes

- Engines and analytics are deterministic. Randomness is seeded; external systems do not affect algorithmic results.
- “Why this next” should derive from explicit numeric signals (SE, mastery, spacing, exposure) available via Engine APIs.

## Migration Notes

- Existing domain→scripts imports are slated for migration to Engine shims/public APIs. Do not introduce new ones. Track deltas in PLAN.md.

