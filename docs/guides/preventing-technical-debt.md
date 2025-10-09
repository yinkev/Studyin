# Preventing Technical Debt

## Overview

This guide provides strategies to keep the Studyin codebase clean, maintainable, and free of technical debt.

---

## Code Review Checklist

### Before Creating PR

```bash
# 1. Run full test suite
npm test && npm run test:e2e

# 2. Type check
npx tsc --noEmit

# 3. Build verification
npm run build

# 4. Check for layer violations
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims

# 5. Check for determinism violations
grep -r "Date.now()\|Math.random()" lib/engine/

# 6. Check for dead code
# Run cleanup detection (see below)
```

### During Code Review

**Automated Checks:**
- ✅ All tests passing
- ✅ Type errors: 0
- ✅ Build succeeds
- ✅ No layer boundary violations
- ✅ No determinism violations

**Manual Checks:**
- ✅ Code follows [CLAUDE.md](../../CLAUDE.md) standards
- ✅ New features have tests
- ✅ Documentation updated
- ✅ No hardcoded values (use constants)
- ✅ Accessibility considered (WCAG 2.2 AAA)
- ✅ Design system compliance (Material Web + Game Level palette)

**Use Agent:**
```bash
/mcp zen codereview
files: ["path/to/changed/files"]
focus_on: "determinism, type safety, layer boundaries"
```

---

## Refactoring Triggers

### When to Refactor

**File Size:**
```bash
# Find large files (>500 lines)
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -10
```

**Trigger:** File >800 lines → Consider splitting

**Import Count:**
```bash
# Find files with many imports (>15)
grep -r "^import" --include="*.ts" --include="*.tsx" | awk -F: '{print $1}' | uniq -c | sort -rn | head -10
```

**Trigger:** >20 imports → Possible over-coupling

**Complexity:**
```bash
# Find deeply nested code
# If you see >4 levels of nesting, refactor
```

**Trigger:** >4 nested levels → Extract functions

### How to Refactor Safely

```bash
# 1. Ensure tests exist
npm test

# 2. Make incremental changes
# - One logical change per commit
# - Run tests after each change

# 3. Use agents
/mcp zen planner
task: "Refactor lib/skill-tree/progression.ts into modules"

# 4. Verify determinism (if touching engine)
npm test -- rasch.test.ts selector.test.ts
```

---

## Cleanup Schedules

### Weekly (Every Friday)

```bash
# 1. Find unused imports
npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | grep "is declared but"

# 2. Find TODOs
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" components/ lib/ app/
# Review and either fix or remove

# 3. Check for commented code
grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" components/ lib/ app/ | wc -l
# If count >50, review and remove dead code

# 4. Find console.logs
grep -r "console\." --include="*.ts" --include="*.tsx" components/ lib/ app/ | grep -v "console.error\|console.warn"
# Remove debug statements
```

### Monthly (First Monday)

```bash
# 1. Dependency updates
npm outdated
# Review and update non-breaking changes

# 2. Find orphaned files
# Use agent to scan for unused components
/mcp zen thinkdeep
step: "Find unused components and utilities across entire codebase"

# 3. Documentation refresh
# Verify all docs are current
# Update examples if API changed

# 4. Accessibility audit
/agent ui-ux-designer
"Audit app for WCAG 2.2 AAA compliance"
```

### Quarterly (Every 3 Months)

```bash
# 1. Architecture review
/mcp zen consensus
models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]
prompt: "Review current architecture for improvements or simplifications"

# 2. Performance audit
# Profile key flows
# Optimize if needed

# 3. Security audit
/mcp zen codereview
review_type: "security"
files: ["app/api/", "lib/server/"]

# 4. Design system refresh
/agent ui-ux-designer
"Review design system for consistency and modern best practices"
```

---

## Dead Code Detection

### Automated Detection

```bash
# 1. Find unused exports
# Create script: scripts/find-unused-exports.mjs
```

```javascript
// scripts/find-unused-exports.mjs
import { glob } from 'glob';
import { readFileSync } from 'fs';

const files = await glob('**/*.{ts,tsx}', { ignore: ['node_modules/**', '.next/**'] });

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  // Extract exports
  const exports = content.match(/export\s+(const|function|class|interface|type)\s+(\w+)/g);

  if (exports) {
    for (const exp of exports) {
      const name = exp.split(/\s+/).pop();
      // Search for imports of this name
      const used = files.some(f => {
        if (f === file) return false; // Skip self
        const c = readFileSync(f, 'utf-8');
        return c.includes(name);
      });

      if (!used) {
        console.log(`Potentially unused: ${name} in ${file}`);
      }
    }
  }
}
```

### Agent-Assisted Detection

```bash
# Use Codex for comprehensive scan
/mcp codex codex
prompt: "Scan entire codebase and list all unused components, utilities, and types. For each, verify by grepping for imports. Generate removal plan."
config: {"approval-policy": "on-request"}
```

---

## Dependency Management

### Adding Dependencies

**Before adding:**
1. Is there a simpler solution?
2. Is there already a similar dependency?
3. Is it well-maintained?
4. What's the bundle size impact?

**Example:**
```bash
# ❌ BAD: Add lodash for one function
npm install lodash

# ✅ GOOD: Implement simple helper
// lib/utils.ts
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
```

### Removing Dependencies

**Process:**
```bash
# 1. Search for usage
grep -r "from 'package-name'" --include="*.ts" --include="*.tsx"

# 2. If zero results, remove
npm uninstall package-name

# 3. Verify build
npm run build

# 4. Verify tests
npm test
```

### Updating Dependencies

**Safe update process:**
```bash
# 1. Check outdated
npm outdated

# 2. Update patch/minor (safe)
npm update

# 3. Test
npm test && npm run build

# 4. For major updates, one at a time
npm install package-name@latest
npm test && npm run build
# If passes, commit. If fails, investigate or revert.
```

---

## Preventing Common Debt

### 1. Hardcoded Values

**❌ BAD:**
```typescript
if (score > 0.85) { /* mastered */ }
const bgColor = '#CDD10F';
```

**✅ GOOD:**
```typescript
import { MASTERY_THRESHOLD } from '@/lib/constants';
import { colors } from '@/lib/design/tokens';

if (score > MASTERY_THRESHOLD) { /* mastered */ }
const bgColor = colors.gamification.achievement;
```

### 2. Duplicate Code

**❌ BAD:**
```typescript
// components/A.tsx
const handleSubmit = () => {
  // ... 20 lines of logic
};

// components/B.tsx
const handleSubmit = () => {
  // ... same 20 lines of logic
};
```

**✅ GOOD:**
```typescript
// lib/hooks/useSubmit.ts
export function useSubmit() {
  return () => {
    // ... 20 lines of logic
  };
}

// components/A.tsx & B.tsx
import { useSubmit } from '@/lib/hooks/useSubmit';
const handleSubmit = useSubmit();
```

### 3. Missing Tests

**Rule:** If it has logic, it needs a test.

**❌ BAD:**
```typescript
// New feature with complex logic, no tests
export function computeComplexScore(data: Data): number {
  // ... 50 lines of logic
}
```

**✅ GOOD:**
```typescript
// Implementation + tests
export function computeComplexScore(data: Data): number {
  // ... 50 lines of logic
}

// tests/computeComplexScore.test.ts
describe('computeComplexScore', () => {
  it('should handle edge case X', () => { /* ... */ });
  it('should be deterministic', () => { /* ... */ });
});
```

### 4. Undocumented Decisions

**❌ BAD:**
```typescript
// Why is this threshold 0.85? Who knows?
if (mastery > 0.85) { /* ... */ }
```

**✅ GOOD:**
```typescript
// Mastery threshold based on psychometric research:
// 0.85 probability represents "competent" level (85% chance of correct response)
// See: docs/architecture/psychometric-engine.md
const MASTERY_THRESHOLD = 0.85;
if (mastery > MASTERY_THRESHOLD) { /* ... */ }
```

### 5. Layer Violations

**❌ BAD:**
```typescript
// UI component importing analytics directly
import { computeRasch } from '../../../scripts/lib/rasch.mjs';
```

**✅ GOOD:**
```typescript
// UI component importing via Engine shim
import { computeRasch } from '@/lib/engine/shims/rasch';
```

**Prevention:**
```bash
# Add to CI/CD pipeline
.github/workflows/ci.yml
  - name: Check layer boundaries
    run: |
      if grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims; then
        echo "Layer violation detected!"
        exit 1
      fi
```

---

## Metrics to Track

### Code Quality Metrics

```bash
# 1. TypeScript errors
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Target: 0

# 2. Test coverage
npm test -- --coverage
# Target: >80%

# 3. Build time
time npm run build
# Target: <5s

# 4. Bundle size
npm run build | grep "Total size"
# Track over time, flag >20% increases
```

### Codebase Health Metrics

```bash
# 1. File count
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l

# 2. Total lines of code
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | tail -1

# 3. Average file size
# target: <300 lines average

# 4. Dependency count
npm list --depth=0 | wc -l
# Track over time
```

---

## Emergency Cleanup

**When tech debt gets critical (>100 TS errors, >50 TODOs, build >10s):**

```bash
# 1. Use agents for comprehensive cleanup
/mcp zen thinkdeep
step: "Analyze entire codebase for technical debt"

/mcp zen planner
task: "Create comprehensive cleanup plan"

/mcp codex codex
prompt: "[Plan from planner]"
config: {"approval-policy": "never"}

# 2. Verify after cleanup
npm run build && npm test && npm run test:e2e

# 3. Document what was done
# Create CLEANUP_REPORT_YYYY-MM-DD.md

# 4. Update prevention strategies
# Add checks to CI to prevent recurrence
```

---

## Resources

- [AGENTS.md](../../AGENTS.md) - Agent workflows for cleanup
- [CLAUDE.md](../../CLAUDE.md) - Coding standards
- [Architecture Modularity](../architecture/modularity.md) - Layer boundaries
- [Maintenance Schedule](maintenance.md) - Regular tasks
