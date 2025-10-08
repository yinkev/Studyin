# Psychometric Engine

Studyin uses **Rasch Item Response Theory (IRT)** to estimate learner ability and select optimal items.

## Core Algorithm: Rasch 1-PL

Parameters:
- `θ` (theta): learner ability
- `b`: item difficulty
- `SE`: standard error of `θ`

Probability of correct response:
```
P(correct | θ, b) = 1 / (1 + exp(-(θ - b)))
```

Ability Estimation:
- Expected A Posteriori (EAP) using equispaced quadrature (41 points)

Implementation: scripts/lib/rasch.mjs

## Partial Credit Scoring: GPCM

For multi-step items (partial credit):
- Thresholds: `τ` (tau) per score level
- Information: variance method
- Fallback: binomial likelihood if thresholds undefined

Implementation: lib/study-engine.ts

## Item Selection: Thompson Sampling

Goal: maximize information gain per minute (ΔSE/min)

Utility function:
```
utility = (info / time) × blueprint_multiplier × exposure_cap × fatigue_penalty
```

- Blueprint multiplier: boost under-represented topics (drift >5%)
- Exposure cap: prevent over-exposure to single items
- Cooldown: 96h unless blueprint deficit >8%

Implementation: lib/engine/shims/scheduler.ts

## Retention: FSRS

Spaced repetition:
- Overdue boost: `1 + 0.1 × days_overdue`
- Time budget: ≤40% session (≤60% if max overdue >7d)
- Probe policy: keep calibration fresh

Implementation: lib/engine/shims/fsrs.ts

## Determinism Guarantee

- Seeded RNG; all randomness reproducible
- No runtime API calls in scoring paths
- Same inputs → Same outputs

Test determinism:
```
npm test -- rasch.test.ts
```

