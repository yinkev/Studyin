# Why Adaptive Learning

Adaptive learning focuses practice where it yields the highest learning gain per minute. Studyin uses psychometrics to estimate ability and uncertainty, then selects the next best item deterministically.

## Goals

- Maximize learning efficiency (ΔSE/min)
- Maintain engagement with appropriate challenge
- Cover blueprint evenly within ±5% rails

## How It Works

1. Estimate ability (θ) via Rasch IRT after each response
2. Compute item information around current θ
3. Apply blueprint multipliers and exposure caps
4. Sample within a top‑K using seeded Thompson Sampling
5. Insert periodic probes to keep calibration fresh

## Benefits

- Faster path to mastery with fewer items
- Transparent “Why this next” signals (blueprint, retention, info)
- Fairness: exposure caps and cooldowns prevent item overfitting

## Evidence‑Based Policies

- Stop rules: `SE ≤ 0.20` with minimum items, or plateau in `ΔSE`, or `mastery_prob ≥ 0.85` with probe near `b ∈ [θ̂ ± 0.3]`
- Retention budgeting ≤40% baseline (≤60% if overdue >7d)

