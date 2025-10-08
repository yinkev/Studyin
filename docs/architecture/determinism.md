# Determinism Policy

Determinism underpins reliable analytics, fair assessment, and reproducible debugging. This document defines non‑negotiable policies and checks.

## Core Rules

- No runtime LLM/API calls in engine paths
- Seeded RNG for any sampling (fixed seed per session)
- No wall‑clock time (`Date.now()`) inside scoring/selection; pass timestamps explicitly
- Pure functions in `lib/engine/**` and `scripts/lib/**` modules
- Identical inputs → identical outputs across machines

## Implementation Notes

- RNG: provide seed via session metadata; derive sub‑seeds per selector/scheduler
- Time: compute durations at the UI/server boundary; pass as numbers (ms)
- Dependencies: avoid nondeterministic libraries in scoring paths
- I/O: analytics generation is pure; file system writes happen after results are computed

## Tests & Verification

```
# Run unit tests
npm test

# Spot‑check selector stability (same seed)
node scripts/lib/selector.mjs --seed 42 --lesson lesson.json
node scripts/lib/selector.mjs --seed 42 --lesson lesson.json  # identical order
```

## CI Guardrails

- Lint rule forbids `Date.now()` and `Math.random()` in engine paths
- PRs that introduce nondeterminism in `lib/engine/**` are blocked

