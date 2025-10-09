# Modularity & Architecture Principles

## Overview

Studyin follows a strict layered architecture to maintain modularity, testability, and scalability.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI LAYER                                           │
│  Location: app/*, components/*                      │
│  Purpose: React components, pages, UI logic         │
│  May import: Server, Engine, Core                   │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  SERVER LAYER                                       │
│  Location: lib/server/*                             │
│  Purpose: Server-side logic, API routes, state      │
│  May import: Engine, Core                           │
│  Must NOT import: UI                                │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  ENGINE LAYER                                       │
│  Location: lib/engine/*                             │
│  Purpose: Adaptive learning algorithms              │
│  May import: Core, Analytics (via shims only)       │
│  Must NOT import: Server, UI                        │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  CORE LAYER                                         │
│  Location: lib/core/*                               │
│  Purpose: Shared types, schemas, constants          │
│  May import: Nothing (external libs only)           │
│  Must NOT import: Engine, Server, UI                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ANALYTICS LAYER (Special)                          │
│  Location: scripts/lib/*.mjs                        │
│  Purpose: Deterministic algorithms (CLI-compatible) │
│  May import: Nothing (pure functions)               │
│  Accessed via: Engine shims (lib/engine/shims/*)    │
└─────────────────────────────────────────────────────┘
```

---

## Import Rules

### Rule 1: One-Way Dependency Flow

**Allowed:**
```typescript
// UI → Server
import { getLearnerId } from '@/lib/server/learner';

// Server → Engine
import { selectNextItem } from '@/lib/engine/selector';

// Engine → Core
import { ItemSchema } from '@/lib/core/schemas';

// UI/Server/Engine → Core
import { MASTERY_THRESHOLD } from '@/lib/core/constants';
```

**FORBIDDEN:**
```typescript
// ❌ Core → Engine
import { selectItem } from '@/lib/engine/selector';

// ❌ Server → UI
import { Button } from '@/components/ui/Button';

// ❌ Engine → Server
import { saveState } from '@/lib/server/state';
```

### Rule 2: Analytics Access via Shims

**❌ WRONG:**
```typescript
// UI or Engine importing analytics directly
import { computeRasch } from '../../../scripts/lib/rasch.mjs';
```

**✅ CORRECT:**
```typescript
// 1. Create shim in lib/engine/shims/rasch.ts
export { computeRasch } from '../../../scripts/lib/rasch.mjs';

// 2. Import via shim
import { computeRasch } from '@/lib/engine/shims/rasch';
```

**Why shims?**
- Analytics scripts (.mjs) are CLI-compatible
- TypeScript needs type declarations
- Shims provide type bridge without duplication

### Rule 3: No Circular Dependencies

**Detection:**
```bash
# Use madge or similar tool
npx madge --circular --extensions ts,tsx lib/
```

**Prevention:**
- Keep dependencies flowing downward
- Use dependency injection for cross-module needs
- Extract shared code to Core layer

---

## Module Cohesion Guidelines

### High Cohesion (Good)

**Example: lib/engine/selector.ts**
```typescript
// All functions relate to item selection
export function selectNextItem(candidates: Item[], state: State): Item
export function rankCandidates(candidates: Item[], utility: Utility): Item[]
export function applyThompsonSampling(arms: Arm[], seed: number): Arm
```

**Cohesion:** ✅ High - All functions serve one purpose

### Low Cohesion (Bad)

**Example: lib/utils/misc.ts** (anti-pattern)
```typescript
// Random unrelated functions
export function formatDate(date: Date): string
export function computeRasch(theta: number, b: number): number
export function validateEmail(email: string): boolean
```

**Cohesion:** ❌ Low - Functions are unrelated

**Fix:** Split into focused modules
```typescript
// lib/utils/date.ts
export function formatDate(date: Date): string

// lib/engine/rasch.ts
export function computeRasch(theta: number, b: number): number

// lib/validation/email.ts
export function validateEmail(email: string): boolean
```

---

## Coupling Guidelines

### Loose Coupling (Good)

**Use dependency injection:**
```typescript
// ✅ GOOD: Function accepts dependencies
export function processAttempt(
  attempt: Attempt,
  computeRasch: (theta: number, b: number) => number
): Result {
  const info = computeRasch(attempt.theta, attempt.difficulty);
  // ...
}

// Call site provides dependency
processAttempt(attempt, computeRasch);
```

**Why good?**
- Easy to test (mock dependencies)
- Easy to swap implementations
- No hidden dependencies

### Tight Coupling (Bad)

**Direct imports:**
```typescript
// ❌ BAD: Function directly imports dependency
import { computeRasch } from '../rasch';

export function processAttempt(attempt: Attempt): Result {
  const info = computeRasch(attempt.theta, attempt.difficulty);
  // ...
}
```

**Why bad?**
- Hard to test (must mock module)
- Can't swap implementations easily
- Hidden dependency

---

## Barrel Exports

### When to Use

**✅ Use barrels for:**
```typescript
// components/atoms/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Badge } from './Badge';

// Consumers import from barrel
import { Button, Card } from '@/components/atoms';
```

### When to Avoid

**❌ Avoid barrels for:**
- Large modules (increases bundle size)
- Circular dependency risks
- Server-side code (increases cold start time)

**Example of over-use:**
```typescript
// lib/index.ts (TOO BROAD)
export * from './server';
export * from './engine';
export * from './core';
// This re-exports hundreds of things!
```

---

## Module Boundaries

### File Organization

**By feature (preferred):**
```
lib/engine/
  ├── selector.ts          # Item selection logic
  ├── rasch.ts             # Rasch IRT
  ├── gpcm.ts              # GPCM scoring
  ├── scheduler.ts         # Thompson Sampling
  ├── fsrs.ts              # FSRS retention
  └── shims/               # Analytics bridges
      ├── rasch.ts
      ├── gpcm.ts
      └── scheduler.ts
```

**By type (avoid):**
```
lib/
  ├── functions/           # All functions together
  ├── types/               # All types together
  └── constants/           # All constants together
```

**Why feature-based?**
- Related code stays together
- Easier to find and modify
- Natural module boundaries

### Component Organization

**Atomic design:**
```
components/
  ├── atoms/              # Basic building blocks
  │   ├── Button.tsx
  │   ├── Badge.tsx
  │   └── GlowCard.tsx
  ├── molecules/          # Simple combinations
  │   ├── SearchBar.tsx
  │   └── ItemCard.tsx
  ├── organisms/          # Complex combinations
  │   ├── LessonViewer.tsx
  │   └── Dashboard.tsx
  └── layout/             # Layout components
      ├── AppNav.tsx
      └── Footer.tsx
```

---

## Circular Dependency Prevention

### Common Causes

**1. Mutual Imports:**
```typescript
// a.ts
import { funcB } from './b';
export function funcA() { funcB(); }

// b.ts
import { funcA } from './a'; // CIRCULAR!
export function funcB() { funcA(); }
```

**Fix:** Extract shared code to new module
```typescript
// shared.ts
export function sharedLogic() { /* ... */ }

// a.ts
import { sharedLogic } from './shared';

// b.ts
import { sharedLogic } from './shared';
```

**2. Type-only Imports:**
```typescript
// a.ts
import type { TypeB } from './b';
export type TypeA = { b: TypeB };

// b.ts
import type { TypeA } from './a';
export type TypeB = { a: TypeA };
```

**Fix:** Extract types to shared file
```typescript
// types.ts
export type TypeA = { b: TypeB };
export type TypeB = { /* ... */ };

// a.ts & b.ts
import type { TypeA, TypeB } from './types';
```

---

## Dependency Inversion

### Principle

High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Example: Data Persistence

**❌ BAD: Direct dependency**
```typescript
// lib/engine/selector.ts
import { saveToLocalStorage } from '@/lib/storage/localStorage';

export function selectItem(items: Item[]): Item {
  const selected = /* selection logic */;
  saveToLocalStorage('selected', selected); // Direct coupling!
  return selected;
}
```

**✅ GOOD: Dependency injection**
```typescript
// lib/engine/selector.ts
export function selectItem(
  items: Item[],
  persist?: (key: string, value: unknown) => void
): Item {
  const selected = /* selection logic */;
  if (persist) persist('selected', selected);
  return selected;
}

// Call site provides implementation
import { saveToLocalStorage } from '@/lib/storage/localStorage';
const item = selectItem(items, saveToLocalStorage);
```

---

## Testing Boundaries

### Unit Testing

**Each layer tests in isolation:**

```typescript
// tests/engine/selector.test.ts
import { selectItem } from '@/lib/engine/selector';

describe('selectItem', () => {
  it('should select optimal item', () => {
    const items = [/* test data */];
    const selected = selectItem(items, mockPersist);
    expect(selected).toMatchObject(/* expected */);
  });
});
```

**Mock dependencies:**
```typescript
const mockPersist = vi.fn();
const mockComputeRasch = vi.fn().mockReturnValue(0.5);

selectItem(items, mockPersist, mockComputeRasch);

expect(mockPersist).toHaveBeenCalledWith('selected', expect.any(Object));
```

### Integration Testing

**Test across layers:**

```typescript
// tests/integration/study-flow.test.ts
import { submitAttempt } from '@/app/api/study/submit';
import { selectNextItem } from '@/lib/engine/selector';

describe('Study flow', () => {
  it('should select next item after attempt', async () => {
    const result = await submitAttempt(attempt);
    const next = selectNextItem(result.candidates, result.state);
    expect(next).toBeDefined();
  });
});
```

---

## Practical Examples

### Example 1: Adding New Psychometric Algorithm

**Step 1: Create in Analytics layer**
```typescript
// scripts/lib/new-algorithm.mjs
export function computeNewMetric(data) {
  // Pure, deterministic function
  return result;
}
```

**Step 2: Add type declarations**
```typescript
// types/scripts-modules.d.ts
declare module '../scripts/lib/new-algorithm.mjs' {
  export function computeNewMetric(data: Data): number;
}
```

**Step 3: Create Engine shim**
```typescript
// lib/engine/shims/new-algorithm.ts
export { computeNewMetric } from '../../../scripts/lib/new-algorithm.mjs';
```

**Step 4: Use in Engine**
```typescript
// lib/engine/personalizationEngine.ts
import { computeNewMetric } from './shims/new-algorithm';

export function enhancedSelection(items: Item[]): Item {
  const metric = computeNewMetric(data);
  // ... use metric
}
```

**Step 5: Add tests**
```typescript
// tests/new-algorithm.test.ts
import { computeNewMetric } from '@/lib/engine/shims/new-algorithm';

describe('computeNewMetric', () => {
  it('should be deterministic', () => {
    // Test
  });
});
```

### Example 2: Adding New API Route

**Step 1: Create route handler**
```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processData } from '@/lib/server/processor';

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await processData(data);
  return NextResponse.json(result);
}
```

**Step 2: Add server logic**
```typescript
// lib/server/processor.ts
import { compute } from '@/lib/engine/algorithm';

export function processData(data: Input): Output {
  return compute(data);
}
```

**Step 3: Add UI consumer**
```typescript
// components/NewFeature.tsx
async function handleSubmit(data: FormData) {
  const response = await fetch('/api/new-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  // ... handle result
}
```

---

## Verification Tools

### Check Layer Boundaries

```bash
# Add to package.json scripts
"verify:layers": "bash scripts/verify-layers.sh"
```

```bash
# scripts/verify-layers.sh
#!/bin/bash

echo "Checking layer boundaries..."

# Check for UI → Analytics violations
if grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims; then
  echo "❌ FAIL: Found direct analytics imports outside shims"
  exit 1
fi

# Check for Core → higher layer violations
if grep -r "from.*lib/engine\|from.*lib/server\|from.*components" lib/core; then
  echo "❌ FAIL: Core importing from higher layers"
  exit 1
fi

echo "✅ PASS: Layer boundaries intact"
```

### Detect Circular Dependencies

```bash
# Use madge
npx madge --circular --extensions ts,tsx lib/

# Or add to CI
"verify:circular": "madge --circular --extensions ts,tsx lib/ || exit 1"
```

---

## Resources

- [Architecture Overview](overview.md)
- [Preventing Technical Debt](../guides/preventing-technical-debt.md)
- [CLAUDE.md - Coding Standards](../../CLAUDE.md)
- [Layer Boundary Tests](../../tests/architecture/)
