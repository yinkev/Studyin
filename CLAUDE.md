# Claude Code Guidelines for Studyin

## Project-Specific Prompts & Patterns

This guide provides Studyin-specific guidelines for using Claude Code effectively.

---

## Quick Start Commands

```bash
# Start development
npm run dev              # http://localhost:3005

# Run tests
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)

# Build
npm run build

# Type check
npx tsc --noEmit
```

---

## Coding Standards

### TypeScript

**Strict Mode:** Always enabled

```typescript
// ✅ Good: Explicit types
export function computeUtility(
  info: number,
  time: number,
  blueprint: number
): number {
  return (info / time) * blueprint;
}

// ❌ Bad: Implicit any
export function computeUtility(info, time, blueprint) {
  return (info / time) * blueprint;
}
```

**No `any` without justification:**
```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good: Use proper types
interface LearnerState {
  learnerId: string;
  theta: number;
  SE: number;
}
const data: LearnerState = fetchData();

// ✅ Acceptable: Documented exception
// @ts-expect-error - Motion library typing issue with React 19, runtime safe
animate(element, { opacity: 1 });
```

---

## Architecture Constraints

### Layer Boundaries (CRITICAL)

```
UI Layer (app/*, components/*)
  ↓ may import
Server Layer (lib/server/*)
  ↓ may import
Engine Layer (lib/engine/*)
  ↓ may import
Core Layer (lib/core/*)

Analytics (scripts/lib/*.mjs)
  ↑ accessed via Engine shims only
```

**Rules:**
1. **Lower layers NEVER import from higher layers**
2. **Analytics scripts (.mjs) accessed via `lib/engine/shims/` only**
3. **UI never imports from Analytics directly**

**Example:**
```typescript
// ❌ BAD: UI importing analytics directly
import { computeRasch } from '../../../scripts/lib/rasch.mjs';

// ✅ GOOD: UI importing via Engine shim
import { computeRasch } from '@/lib/engine/shims/rasch';
```

**Verification:**
```bash
# Check for violations
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims
# Should return zero results
```

---

## Determinism Policy (NON-NEGOTIABLE)

All adaptive learning engines MUST be deterministic.

### Rules

**✅ ALLOWED:**
```typescript
// Seeded RNG
import seedrandom from 'seedrandom';
const rng = seedrandom(seed);
const value = rng();

// Pure functions
export function computeInfo(theta: number, b: number): number {
  const p = 1 / (1 + Math.exp(-(theta - b)));
  return p * (1 - p);
}
```

**❌ FORBIDDEN:**
```typescript
// Non-seeded random
Math.random()

// Date/time in scoring
const score = performance.now() * factor;

// Runtime API calls in engines
const suggestion = await openai.chat.completions.create({...});
```

### Verification
```bash
# Test determinism: same seed → same output
npm test -- selector.test.ts
npm test -- rasch.test.ts
```

---

## Design System

### Color Psychology (Game Level Palette)

Always use these tokens from `lib/design/tokens.ts`:

```typescript
// ✅ GOOD: Use design tokens
import { colors } from '@/lib/design/tokens';

const badge = (
  <div style={{ backgroundColor: colors.gamification.achievement }}>
    +100 XP!
  </div>
);

// ❌ BAD: Hardcoded colors
const badge = (
  <div style={{ backgroundColor: '#CDD10F' }}>
    +100 XP!
  </div>
);
```

### Component Patterns

**Material Web Components:**
```tsx
// Buttons
<md-filled-button>Primary Action</md-filled-button>
<md-outlined-button>Secondary</md-outlined-button>
<md-text-button>Tertiary</md-text-button>

// Form controls
<md-outlined-text-field label="Email" type="email" />
<md-checkbox checked />
<md-switch selected />
```

**Custom Components:**
```tsx
// GlowCard variants
<GlowCard variant="comfort">     {/* Tea Cookie background */}
<GlowCard variant="flow">         {/* Water Sports - active */}
<GlowCard variant="achievement">  {/* Golden Harvest - dopamine */}
<GlowCard variant="safety">       {/* Palm Green - grounding */}
```

### Animations (Motion)

```tsx
import { animate } from 'motion/react';

// ✅ GOOD: Accessibility-aware
const anim = animate(
  element,
  { opacity: [0, 1], y: [20, 0] },
  { duration: 0.3, easing: 'ease-out' }
);

// Respect prefers-reduced-motion
import { useReducedMotion } from 'motion/react';
const shouldReduceMotion = useReducedMotion();
```

---

## Testing Requirements

### Unit Tests (Vitest)

**All psychometric functions MUST have tests:**

```typescript
// tests/rasch.test.ts
import { describe, it, expect } from 'vitest';
import { computeEAP } from '@/lib/engine/shims/rasch';

describe('Rasch EAP', () => {
  it('should be deterministic', () => {
    const result1 = computeEAP(responses, items, seed);
    const result2 = computeEAP(responses, items, seed);
    expect(result1).toEqual(result2);
  });

  it('should converge to true ability', () => {
    // Property-based test
    const theta = 0.5;
    const estimated = simulateAndEstimate(theta, 20);
    expect(Math.abs(estimated - theta)).toBeLessThan(0.3);
  });
});
```

### E2E Tests (Playwright)

**Smoke tests for all routes:**

```javascript
// tests/e2e/smoke.spec.js
test('/study route loads', async ({ page }) => {
  await page.goto('http://localhost:3005/study');
  await expect(page.locator('h1')).toContainText('Study');
});
```

---

## Commit Message Convention

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```bash
feat(engine): add FSRS stability updates
fix(ui): correct contrast ratio on achievement badges
docs(architecture): update layer boundary rules
chore(deps): remove unused echarts dependency
test(rasch): add EAP convergence property test
```

---

## Common Patterns

### Adding a New Route

```typescript
// 1. Create page component
// app/new-route/page.tsx
export default function NewRoutePage() {
  return <div>New Route</div>;
}

// 2. Add to navigation
// components/layout/AppNav.tsx
<Link href="/new-route">New Route</Link>

// 3. Add E2E smoke test
// tests/e2e/smoke.spec.js
test('/new-route loads', async ({ page }) => {
  await page.goto('http://localhost:3005/new-route');
  // assertions...
});
```

### Adding a New Component

```typescript
// 1. Create component with types
// components/atoms/NewComponent.tsx
interface NewComponentProps {
  title: string;
  onClick?: () => void;
}

export function NewComponent({ title, onClick }: NewComponentProps) {
  return (
    <GlowCard variant="comfort">
      <h2>{title}</h2>
      <md-filled-button onClick={onClick}>
        Action
      </md-filled-button>
    </GlowCard>
  );
}

// 2. Export from barrel (if needed)
// components/atoms/index.ts
export { NewComponent } from './NewComponent';

// 3. Use in pages
import { NewComponent } from '@/components/atoms/NewComponent';
```

### Adding Design Tokens

```typescript
// 1. Add to lib/design/tokens.ts
export const colors = {
  gamification: {
    newState: '#HEX',  // Psychology: [description]
  }
};

// 2. Add CSS variable to app/globals-md3.css
:root {
  --gamification-new-state: #HEX;
}

// 3. Document in docs/architecture/design-system.md
```

---

## Pre-Commit Checklist

Before committing:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Run tests
npm test

# 3. Build verification
npm run build

# 4. Check for layer violations
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims

# 5. Check for determinism violations (if touching engine)
grep -r "Date.now()\|Math.random()" lib/engine/

# 6. Format check (if using Prettier)
npm run format:check
```

**Optional but recommended:**
```bash
# Use zen precommit agent
/mcp zen precommit
path: "/Users/kyin/Projects/Studyin"
include_staged: true
```

---

## Agent Integration

See [AGENTS.md](AGENTS.md) for comprehensive agent workflows.

**Quick patterns:**

```bash
# Design new feature
/agent ui-ux-designer "Design [feature] with Game Level palette"

# Plan implementation
/mcp zen planner task: "[feature description]"

# Implement
/mcp codex codex prompt: "[plan from planner]"

# Review
/mcp zen codereview files: ["..."]
```

---

## Performance Guidelines

### Don't Optimize Prematurely

```bash
# ❌ BAD: Optimize without measuring
# "I think this is slow, let me refactor"

# ✅ GOOD: Measure first
# 1. Profile with real data
# 2. Document baseline
# 3. Optimize
# 4. Measure improvement
# 5. Document in PR
```

### Time Budgets (Engine)

```typescript
// Retention review time budget
const retentionTimeBudget = 0.4; // ≤40% of session
const maxOverdueDays = 7;
if (maxOverdue > maxOverdueDays) {
  retentionTimeBudget = 0.6; // Allow up to 60%
}
```

---

## Security

### Environment Variables

```bash
# Server-only secrets (never in NEXT_PUBLIC_*)
SUPABASE_SERVICE_ROLE_KEY=...
INGEST_TOKEN=...

# Client-safe config
NEXT_PUBLIC_DEV_UPLOAD=1
```

### Input Validation

```typescript
// Always validate with Zod
import { z } from 'zod';

const AttemptSchema = z.object({
  itemId: z.string().uuid(),
  response: z.enum(['A', 'B', 'C', 'D']),
  timeSpent: z.number().positive(),
});

export async function submitAttempt(data: unknown) {
  const validated = AttemptSchema.parse(data); // Throws if invalid
  // ... process validated data
}
```

---

## Accessibility

### WCAG 2.2 AAA Requirements

**All text:**
- Minimum 4.5:1 contrast (normal text)
- 7:1+ contrast preferred (AAA)

**Interactive elements:**
- Keyboard navigable
- Focus indicators visible
- ARIA labels where needed

**Verification:**
```bash
# Use UI/UX Designer agent
/agent ui-ux-designer "Audit app for WCAG 2.2 AAA compliance"
```

**Manual checks:**
```bash
# 1. Keyboard navigation
# Tab through entire app - can you access everything?

# 2. Screen reader
# Use VoiceOver (Mac) or NVDA (Windows)

# 3. Color contrast
# Use browser DevTools or online tools
```

---

## Resources

- [Architecture Overview](docs/architecture/overview.md)
- [Psychometric Engine](docs/architecture/psychometric-engine.md)
- [Design System](docs/architecture/design-system.md)
- [API Routes Reference](docs/reference/api-routes.md)
- [Agent Workflows](AGENTS.md)
- [Contributing Guide](CONTRIBUTING.md)
