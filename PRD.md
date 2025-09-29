# Personal Adaptive Study Engine — PRD

## Context & Problem Statement
- We are introducing a personal adaptive study engine that selects items in-session, schedules across topics, and hands off mastered content to a retention lane. The authoritative behavior is defined in `docs/personal-adaptive-study-engine-spec.md` and its delivery prompt. We must implement the engine deterministically, respecting blueprint rails, exposure caps, and stop rules articulated in the spec, while aligning with our existing validator, analytics, and governance stack.
- Determinism is non‑negotiable: no runtime LLM calls; all scoring and scheduling must be reproducible from local data streams (`data/events.ndjson` via `scripts/analyze.mjs:10`–`11`). Evidence must remain fast (<250 ms) and traceable to source.

## Goals
1. Implement Rasch (1‑PL) + GPCM scoring with Elo cold‑start fallback, with online EAP updates and mastery probability as per spec Section 1.
2. Ship a cross‑topic Thompson Sampling scheduler that maximizes expected SE reduction per minute subject to blueprint rails (±5%) and cooldowns (Section 2).
3. Integrate an FSRS‑based retention lane with time budgeting, overdue boosts, and training↔retention handoff criteria (Section 3).
4. Enforce content balancing and exposure caps (≤1/day, ≤2/week, 96h cooldown) with multipliers feeding the selector utility (Section 4).
5. Provide “Why this next” transparency with numeric backing from analytics and engine signals; maintain determinism and performance budgets.

## Non‑Goals (Skip Now)
- No real‑time collaboration, adaptive evidence retrieval, or automated item writing (see spec Section 9).
- No runtime LLMs or nondeterministic ranking.
- No A11y blocking gate during the OKC phase.

## Personas & Scenarios
- Student: studies within a session; engine selects next item per LO with randomesque top‑K; sees a “Why this next” pill with SE, blueprint drift, exposure, and time estimates.
- ItemSmith: authors ABCDE items with per‑choice rationales and evidence; runs validator locally and in CI.
- QA‑Proctor: validates blueprint feasibility and exposure caps; expects 409 with deficits when infeasible.
- ProjectManager: monitors rubric score, analytics deltas, and engine gates; keeps PLAN current.

## Functional Requirements
1) In‑Session Selection & Ability Model
- Rasch 1‑PL with GPCM partial credit, `a=1` fixed; item thresholds `τ` re‑fit weekly via EM; item difficulty `b` shrinkage. Online EAP via 41‑point Gauss–Hermite; maintain LO‑level `θ̂` and `SE` per learner. Elo cold‑start fallback (`K=16`, map `θ = (R − 1500)/400`), blend 70/30 on first warm step then fully Rasch. Mastery probability `Φ((θ̂ − θ_cut)/SE)` with `θ_cut=0`.
- Utility for candidates: `U = [I(θ̂ | b, τ) / median_time(item)] * blueprint_multiplier * exposure_multiplier * fatigue_scalar`. Randomesque: rank by U, take top K=5, choose uniformly.
- Stop within LO: `SE ≤ 0.20` and `items_attempted ≥12`, or last 5 items `ΔSE < 0.02`, or `mastery_prob ≥ 0.85` confirmed with a probe in `b ∈ [θ̂ ± 0.3]`.

2) Cross‑Topic Scheduler
- Thompson Sampling over LO candidate arms optimizing expected `ΔSE/min`, with urgency multiplier and blueprint rails (±5%). Exclude LOs under 96h cooldown unless blueprint deficit >8%. Maintain minimum queue size 2; inject lowest‑exposure LO if empty.

3) Retention Lane
- FSRS review queue, daily; overdue boost `1 + 0.1 * days_overdue`; handoff when LO mastery ≥0.85 with recent probe in window and non‑increasing SE trend; time budgeting baseline ≤40% of session minutes, ≤60% if max overdue >7 days.

4) Content Balancing & Exposure Control
- Enforce blueprint share within ±5% per system/LO, using multipliers `max(0.2, 1 − drift*2)` and `1 + drift*3` (cap 1.5). Exposure caps: item/user ≤1/day, ≤2/week, 96h cooldown; multiplier returns to 0.5 post‑cooldown and 1.0 after 7 days clean. Reduce exposure to 0.6 for items with mean score >0.9 and SE<0.15 unless in retention.

5) Telemetry & Analytics
- Log training, scheduler, and retention events to NDJSON using `scripts/lib/schema.mjs` event types (`attemptEventSchema` at `scripts/lib/schema.mjs:103`–`125`; `sessionEventSchema` at `scripts/lib/schema.mjs:127`–`138`).
- `npm run analyze` produces `public/analytics/latest.json` using analyzer core (`scripts/analyze.mjs:10`–`18`, `scripts/lib/analyzer-core.mjs:37`–`175`, `scripts/lib/analyzer-core.mjs:220`–`243`).
- “Why this next” reads from `latest.json` and engine signals for transparency.

6) Weekly Ops
- Nightly/weekly EM re‑fit for GPCM thresholds and difficulty shrinkage; reliability checks (KR‑20/α) using analyzer core (`scripts/lib/analyzer-core.mjs:220`–`243`). Upgrade gates (Section 8) tracked but off until thresholds met.

## Non‑Functional Requirements
- Determinism: all engines and routes deterministic; no runtime LLM usage.
- Performance: Lighthouse budgets (`.lighthouserc.json:12`–`18`) and app responsibilities; evidence P95 <250 ms; item render <100 ms.
- Accessibility: non‑blocking gate during OKC phase.
- Privacy: telemetry stays pseudonymous; service role keys server‑only.

## Acceptance Gates
- Item Gate: validator clean; ABCDE structure; per‑choice rationales; LO mapped; evidence `{file,page,(bbox|cropPath)}` or relaxed with citation when `REQUIRE_EVIDENCE_CROP=0` (`scripts/validate-items.mjs:150`–`157`). Published items must meet `rubric_score ≥ 2.7` (`scripts/validate-items.mjs:146`–`147`).
- Exam Gate: blueprint feasibility verified; deficits returned with 409 (`app/api/forms/route.ts:12`, `app/api/forms/route.ts:32`, `app/api/forms/route.ts:35`). Evidence remains locked in exam UI.
- Analytics Gate: `latest.json` contains `ttm_per_lo`, `elg_per_min`, `confusion_edges`, `speed_accuracy`, `nfd_summary`, and `reliability` generated deterministically from NDJSON (`scripts/analyze.mjs:10`, `scripts/lib/analyzer-core.mjs:37`).
- Engine Gate: blueprint rails enforced (±5%); exposure caps enforced (≤1/day, ≤2/week, 96h cooldown); stop rules respected; randomesque top‑K; retention budgeting applied; all thresholds logged.
- Governance Gate: `npm run score:rubric` output attached (`public/analytics/rubric-score.json`), PLAN updated post‑merge.

## Metrics
- Learning efficiency: SE reduction per minute; TTM per LO; ELG/min ordering stability.
- Reliability: KR‑20/α per form; point‑biserial per item (`scripts/lib/analyzer-core.mjs:213`–`218`, `scripts/lib/analyzer-core.mjs:220`–`243`).
- Exposure health: overexposed items count, cooldown violations, blueprint drift distribution.
- Retention: overdue distribution, lapse rate, retention time share adherence.

## Rollout
1. Land engine libraries (Rasch/GPCM/EAP, Elo bridge, TS scheduler, FSRS lane, exposure/blueprint multipliers) with unit tests; wire telemetry writers.
2. Add Study flow selector that consumes engine outputs and shows “Why this next”.
3. Integrate retention queue with time budgeting; add overdue boosts and handoff.
4. Schedule weekly EM re‑fit; add reliability checks and logging.
5. Update docs (AGENTS.md, IMPLEMENTATION.md, PLAN.md, README) and wire acceptance gates in CI.

## Risks & Mitigations
- Cold‑start instability → Elo fallback with mapping and blended warm step; cap multipliers.
- Analytics drift → regression tests on analyzer core and snapshot diffs; keep schema version (`scripts/lib/analyzer-core.mjs:4`) stable.
- Overexposure or blueprint drift → hard caps and multiplier clamps; queue guards and cooldowns; deficit reporting in UI.
- Evidence latency spikes → pre‑generate AVIF/WebP crops, store natural width/height; spot‑check P95 <250 ms.

Next agent: AdaptiveEngineer · Model: gpt-5-codex-high · Scope: scripts/lib/{selector,scheduler,rasch,gpcm,fsrs,exposure}.mjs app/(study)/engine.ts tests/**
