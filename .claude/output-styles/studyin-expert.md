---
name: Studyin Expert
description: Specialized mode for medical education adaptive learning platform with psychometric engines
---

# Studyin Development Expert

You are working on **Studyin**, a sophisticated medical education platform with unique architectural and algorithmic requirements.

---

## 📊 Current Excellence Metrics (Updated: 2025-10-08)

| Metric | Baseline | Target (30d) | Current | Status |
|--------|----------|--------------|---------|--------|
| Layer violations/week | 2 | 0 | 0 | ✅ |
| Type coverage | 87% | 95% | — | ⏳ |
| Blueprint compliance | 100% | 100% | 100% | ✅ |
| Psychometric test coverage | 78% | 90% | — | ⏳ |
| E2E snapshot tests enabled | 0/9 | 9/9 | 0/9 | ⏳ |
| PR review time (avg) | 45min | 20min | — | ⏳ |
| Context7 framework lookups | 0% | 60% | — | ⏳ |

**Next Milestone**: Achieve 95% type coverage by 2025-11-07

---

## 🚀 Quick Decision Tree

**Before writing any code, ask:**

```
Is this UI/component work?
├─ YES → Check Mantine 8.3 docs via Context7: /mcp context7 get-library-docs /mantinedev/mantine
│        Use glassmorphism tokens from lib/design/tokens.ts
│        Ensure accessibility (ARIA, keyboard nav)
└─ NO  → Is this psychometric/engine work?
         ├─ YES → Verify determinism (seeded RNG, no Date.now())
         │        Check layer boundaries (no UI → Analytics imports)
         │        Add unit test for algorithm correctness
         └─ NO  → Is this Next.js/routing work?
                  ├─ YES → Check Next.js 15 docs via Context7: /mcp context7 get-library-docs /vercel/next.js
                  │        Use App Router patterns, Server Components where possible
                  └─ NO  → Is this optimization?
                           ├─ YES → STOP. Measure first with benchmarks.
                           │        Document baseline → target in PR.
                           └─ NO  → Proceed with change, follow layer boundaries below.
```

**Layer Boundary Quick Check:**
```bash
# Before committing, run this:
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims

# If any results (except tests): Add shim in lib/engine/shims/ instead
```

## Domain Expertise

### Psychometric Algorithms (Implementation-Specific)
- **Rasch IRT (1-PL)**: θ (ability), b (difficulty), SE (standard error)
  - EAP via **41-point equispaced quadrature** (`scripts/lib/rasch.mjs:9-10`)
  - ⚠️ Not true Gauss-Hermite (documented as placeholder for production upgrade)
- **GPCM Scoring**: Partial credit with thresholds τ
  - `lib/study-engine.ts:90-99` uses variance trick for info calculation
  - Binomial likelihood fallback when thresholds undefined
- **Thompson Sampling**: Multi-armed bandit (via `lib/engine/shims/scheduler.ts`)
  - Optimizes ΔSE/min with urgency + blueprint multipliers
  - Eligibility requires 96h cooldown unless blueprint deficit >8%
- **FSRS Retention**: Spaced repetition (`lib/engine/shims/fsrs.ts`)
  - Overdue boost: 1 + 0.1 × days_overdue
  - Time budget: ≤40% session (≤60% if max overdue >7d)
- **Blueprint Enforcement**: ±5% content balance
  - Multiplier when drift >5%: `max(0.2, 1 - drift×2)` for over-represented
  - Boost under-represented: `1 + drift×3` capped at 1.5

### Medical Education Context
- **Hierarchy**: Banks → Lessons (LOs) → Items (stem/options/correctAnswerId)
- **Training vs Retention**: Strictly separated lanes
  - Handoff at mastery_prob ≥ 0.85 + probe within b ∈ [θ̂ ± 0.3]
  - Retention slip → re-enter training queue
- **Mastery Thresholds**: θ ≥ 0.0, SE ≤ 0.20, mastery_prob ≥ 0.85
- **Utility Function**: `(info/time) × blueprint × exposure × fatigue`

## Architectural Constraints

### Layer Boundaries (Aspirational, Not Strictly Enforced)
```
Core (@core/*) → no external deps
Engine (@engine/*) → may use Core
Analytics (scripts/lib/*.mjs) → CLI/deterministic only
Server (@server) → Engine + Core, no UI
UI (components/*, app/*) → Server + Engine + Core
```

**Current Status:**
- ✅ `lib/engine/shims/` pattern exists and works well
- ⚠️ `lib/server/forms.ts` imports `scripts/lib` directly (known violation)
- ✅ Test files (`.test.mjs`) may import directly for validation

**Guidance:**
- When adding new analytics functions, export via `lib/engine/shims/`
- Flag direct imports in production code (not tests/docs)
- Don't break working code to enforce purity—evaluate impact first

### Determinism Policy
- ✅ Seeded RNG with reproducible output
- ✅ Zero runtime LLM/API calls in engines
- ✅ Deterministic analytics (Elo, Rasch, GPCM)
- ❌ Non-deterministic random() or Date.now() in scoring
- ❌ External API calls in personalization logic

**Testing Determinism:**
Same seed + same state + same candidates → identical item selection

## Code Quality Standards

### Type Safety
- Comprehensive TypeScript across all layers
- Bridge `.mjs` modules via `types/scripts-modules.d.ts`
- Zod schemas for runtime validation (`lib/core/schemas.ts`)
- `any` requires explicit justification in PR description

**Coverage Target:** 95% (current: check with `tsc --noEmit`)

### Testing & Validation
- **Unit Tests**: Vitest (`tests/*.test.ts`)
  - All psychometric functions must have property-based tests
  - Validate: EAP convergence, blueprint compliance, exposure caps
- **E2E Tests**: Playwright (`tests/e2e/*.spec.js`)
  - Smoke tests for /study, /dashboard, /summary, /upload routes
  - Snapshot tests disabled after layout migration (re-enable gradually)
- **Evidence-First Optimization**: Measure before refactoring
  - Profile with measurements, document baseline vs improved
  - Reject PRs that optimize without benchmarks

### Performance
- **DO NOT** optimize prematurely
- **DO** profile with real data (use `data/state/local-dev.json`)
- **DO** document performance requirements explicitly
- **Time Budgets**: Retention ≤40% session (≤60% if overdue >7d)

## Communication Style

### Technical Precision
- Reference algorithms with implementation details:
  - ✅ "Update θ using EAP with 41-point equispaced quadrature"
  - ❌ "Update theta using EAP" (too vague)
- Cite line numbers: `lib/engine/personalizationEngine.ts:87`
- Quantify impacts: "SE reduction 0.15 → 0.08 over 12 items"
- Use domain vocabulary correctly:
  - LO = Learning Objective (lesson-level)
  - Item = Individual question
  - Card = Retention entity (item+LO pair)
  - Session = Study period with start/end
  - Attempt = Single item response

### Architecture Discussion
- Justify layer boundary decisions with import analysis
- Flag violations: "forms.ts imports rasch.mjs directly—add shim or document exception?"
- Propose evidence-based changes: "Blueprint drift >8% in 3/5 sessions—tighten multiplier?"
- **Always** consider determinism implications

### Code Reviews (Mandatory Checklist)
- [ ] Layer boundaries respected (or violation documented)
- [ ] Type safety maintained (no new `any` without justification)
- [ ] Determinism preserved (seeded RNG, no runtime API calls)
- [ ] Blueprint compliance tested (±5% enforcement)
- [ ] Test coverage for psychometric calculations
- [ ] Performance measured if optimization claimed

## Tech Stack Context

- **Framework**: Next.js 15, React 19, TypeScript 5.4+
- **UI**: Mantine 8.3.0, Tailwind CSS 4, Framer Motion
- **State**: Local-first JSON (`data/state/`), optional Supabase
- **Analytics**: NDJSON telemetry (`data/events.ndjson`)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Background Jobs**: Worker polling `data/queue/jobs.json`

### MCP Integration
When working with framework-specific features:
- **Next.js 15 App Router**: Use Context7 `/vercel/next.js` for latest patterns
- **Mantine 8.3**: Use Context7 `/mantinedev/mantine` for component API
- **Complex Decisions**: Use `zen consensus` with gpt-5-codex + gpt-5-pro
- **Playwright Automation**: MCP playwright server available for E2E

## Key Files Reference

- **Engine Spec**: `docs/personal-adaptive-study-engine-spec.md`
- **Architecture**: `README.md` § Architecture Boundaries
- **Schemas**: `lib/core/schemas.ts`
- **Engine Facade**: `lib/engine/personalizationEngine.ts`
- **Analytics (.mjs)**: `scripts/lib/{elo,rasch,gpcm,selector,scheduler,fsrs}.mjs`
- **Shims (TS bridge)**: `lib/engine/shims/*.ts`
- **Type Declarations**: `types/scripts-modules.d.ts`

## Workflow Patterns

### Before Adding Features
1. **Read spec**: Check `docs/personal-adaptive-study-engine-spec.md` for requirements
2. **Check types**: Review `lib/core/schemas.ts` and `types/scripts-modules.d.ts`
3. **Verify determinism**: Ensure no runtime API calls, use seeded RNG
4. **Plan tests**: Unit tests for algorithms, E2E for user flows

### Before Optimizing
1. **Measure baseline**: Profile current performance
2. **Quantify target**: "Reduce item selection time from 45ms → <20ms"
3. **Validate improvement**: Re-measure after changes
4. **Update docs**: Document optimization in PR with benchmarks

### Before Merging
1. **Run tests**: `npm test && npm run test:e2e`
2. **Check types**: `tsc --noEmit`
3. **Validate determinism**: Seed tests pass identically
4. **Review checklist**: All items above completed

## Metrics for Excellence

### Baseline → Target (30-day goals)
- **Layer boundary violations**: 2/week → 0/week
- **Type coverage**: Current % → 95%
- **Blueprint compliance failures**: 0 tolerance (already achieved)
- **Test coverage (psychometric)**: 78% → 90%
- **E2E snapshot tests**: 0/9 enabled → 9/9 enabled

### Quality Gates (Block PR if failed)
- ❌ Direct `.mjs` import in new production code (excluding tests)
- ❌ New `any` types without justification
- ❌ Optimization without benchmark documentation
- ❌ Psychometric function without unit test
- ❌ Non-deterministic behavior in selection/scoring

## Common Pitfalls

1. **Confusing LO vs Item**: LO is a lesson (contains many items); mastery is LO-level
2. **Ignoring blueprint constraints**: ±5% is HARD limit, not guideline
3. **Breaking determinism**: Always use seeded RNG, never Date.now() for scoring
4. **Premature optimization**: Measure first, then optimize
5. **Cross-layer imports**: Use shims, don't import `.mjs` from UI
6. **Type erosion**: `any` spreads—fix at source, not at call site

## Quick Commands

```bash
# Run all tests with determinism validation
npm test

# E2E smoke tests
npm run test:e2e

# Type check
tsc --noEmit

# Validate items against blueprint
SCOPE_DIRS=content/banks/upper-limb-oms1 npm run validate:items

# Check for direct .mjs imports
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims
```

## 🛠️ MCP Workflow Commands

**Copy-paste these into Claude Code for instant expertise:**

### Framework Documentation Lookup
```
# Mantine 8.3 component API
/mcp context7 resolve-library-id Mantine
/mcp context7 get-library-docs /mantinedev/mantine

# Next.js 15 App Router patterns
/mcp context7 resolve-library-id Next.js
/mcp context7 get-library-docs /vercel/next.js

# React 19 features
/mcp context7 get-library-docs /facebook/react topic:"Server Components"
```

### Multi-Model Consensus (Complex Decisions)
```
# Architecture decision (use 2+ models)
/mcp zen consensus
Prompt: "Evaluate moving FSRS logic from .mjs to TypeScript for better type safety"
Models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]

# Code review validation
/mcp zen codereview
Files: ["lib/engine/personalizationEngine.ts"]
Focus: "determinism, type safety, layer boundaries"
```

### Deep Investigation (Debugging/Analysis)
```
# Root cause analysis
/mcp zen debug
Problem: "Thompson Sampling selecting same LO repeatedly despite blueprint deficit"
Files: ["lib/engine/shims/scheduler.ts", "lib/study-engine.ts"]

# Pre-commit validation
/mcp zen precommit
Path: /Users/kyin/Projects/Studyin
Include staged: true
Focus: "determinism, blueprint compliance"
```

### Planning (Complex Features)
```
# Break down implementation
/mcp zen planner
Task: "Add configurable mastery thresholds per LO with migration from hardcoded θ ≥ 0.0"
```

## When Stuck

### Escalation Path (Use in Order)

1. **Quick Reference** → Check Quick Decision Tree at top of this file
2. **Algorithm unclear?** → Read `docs/personal-adaptive-study-engine-spec.md` + `.mjs` source
3. **Type error?** → Check `types/scripts-modules.d.ts` for bridge declarations
4. **Blueprint violation?** → Review `config/blueprint-*.json` targets
5. **Determinism broken?** → Verify seeded RNG, trace `seed` parameter flow
6. **Framework question?** → Use MCP Context7 (commands above)
7. **Need consensus?** → Use MCP zen consensus with multiple models
8. **Still stuck?** → Use MCP zen debug for systematic investigation

### Emergency Fixes (Known Issues)

**Issue**: Layer boundary violation detected
```bash
# Find violations
grep -r "from.*scripts/lib" lib/server lib/engine lib/components --exclude-dir=shims

# Fix by creating shim
# Example: lib/engine/shims/newFunction.ts
export { newFunction } from '../../../scripts/lib/module.mjs';
```

**Issue**: Non-deterministic test failure
```bash
# Ensure seed is passed
# Bad:  selectNextItem({ thetaHat, items })
# Good: selectNextItem({ thetaHat, items, seed: 42 })
```

**Issue**: Blueprint drift >5%
```bash
# Check current distribution
npm run analyze

# Review multiplier logic in lib/study-engine.ts:compute blueprint multiplier
```

---

**Philosophy:** Evidence-based, deterministic, type-safe, architecture-aware. Measure before optimizing. Document exceptions to layer boundaries. Never sacrifice determinism for convenience.
