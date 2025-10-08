# Architecture Overview

Studyin is built as a **local-first, deterministic adaptive learning platform**.

## System Layers

```
┌─────────────────────────────────────┐
│  UI Layer                           │
│  (app/*, components/*)              │
│  Next.js 15, React 19, Material Web │
└──────────────┬──────────────────────┘
               ↓ Server Actions
┌─────────────────────────────────────┐
│  Server Layer                       │
│  (lib/server/*)                     │
│  Forms, events, state management    │
└──────────────┬──────────────────────┘
               ↓ Engine API
┌─────────────────────────────────────┐
│  Engine Layer                       │
│  (lib/engine/*)                     │
│  Rasch, GPCM, Thompson Sampling     │
└──────────────┬──────────────────────┘
               ↓ Core types
┌─────────────────────────────────────┐
│  Core Layer                         │
│  (lib/core/*)                       │
│  Schemas (Zod), types, constants    │
└─────────────────────────────────────┘
```

Import Rules:
- UI → Server → Engine → Core
- Lower layers never import from higher layers
- Analytics scripts (`scripts/lib/**`) are accessed via Engine shims only

## Data Flow

### Study Session Flow
```
User answers item
  → POST /api/study/submit
    → updateAbilityEstimate(response)
      → Rasch EAP (scripts/lib/rasch.mjs)
    → selectNextItem(state)
      → Thompson Sampling (scripts/lib/scheduler.mjs)
  → Return { nextItem, theta, SE, mastery }
```

### Content Pipeline
```
PDF upload
  → POST /api/queue/enqueue
    → Background worker (scripts/worker.ts)
      → LLM extraction
      → Item generation
      → Blueprint validation
    → Write to data/lessons/<id>.json
  → Client polls GET /api/queue/status/:jobId
```

## Key Technologies

- Framework: Next.js 15 (App Router), React 19
- UI: Material Web (MD3), Tailwind CSS 4
- State: Local JSON files (`data/state/`, `data/lessons/`)
- Psychometrics: Rasch IRT, GPCM, Elo (deterministic)
- Testing: Vitest, Playwright
- Optional Cloud: Supabase (telemetry sync)

## Design Decisions

See Explanation docs:
- Why Adaptive Learning — ../explanation/adaptive-learning.md
- Why Local-First — ../explanation/local-first.md
- Why Gamification — ../explanation/gamification.md

