# Personal Adaptive Study Engine — Implementation Plan

## Overview
This plan translates the authoritative spec in `docs/personal-adaptive-study-engine-spec.md` into concrete, testable work. We will implement Rasch/GPCM with Elo fallback, a Thompson Sampling cross‑topic scheduler, and an FSRS‑based retention lane, all deterministic and gated by blueprint rails and exposure caps. We will wire telemetry using `scripts/lib/schema.mjs` and surface transparent reasons in the UI.

## Architecture
- Ability & Scoring
  - `scripts/lib/rasch.mjs`: Rasch 1‑PL utilities, Gauss–Hermite nodes/weights (41‑point), EAP posterior computation, information function `I(θ)`.
  - `scripts/lib/gpcm.mjs`: GPCM PMF/log‑likelihood and category thresholds `τ` handling; EM re‑fit scaffold for weekly job.
  - `scripts/lib/elo.mjs`: Reuse for cold‑start; add helpers to map Elo R↔Rasch θ (θ = (R−1500)/400) and blend with Rasch.
- Selector & Scheduler
  - `scripts/lib/selector.mjs`: In‑LO candidate scorer implementing utility `U = [I(θ̂|b,τ)/median_time] * multipliers` and randomesque K‑of‑N pick.
  - `scripts/lib/scheduler.mjs`: Thompson Sampling over LO arms for expected `ΔSE/min`, urgency multiplier, and blueprint rail multipliers; cooldown enforcement.
- Retention Lane
  - `scripts/lib/fsrs.mjs`: FSRS parameter updates and next review scheduling; overdue boosts; time budgeting to ≤40% baseline, ≤60% when overdue >7d.
- Balancing & Exposure
  - `scripts/lib/exposure.mjs`: Item exposure ledger (≤1/day, ≤2/week, 96h cooldown), multiplier curve (0→0.5→1.0), and partial‑credit overfamiliarity clamp.
  - `scripts/lib/blueprint.mjs`: Reuse; add functions to compute drift and multipliers per LO/system (±5% rails with clamps).
- Telemetry & Analytics
  - Use `AttemptEvent` and `SessionEvent` from `scripts/lib/schema.mjs:103`–`138` for training/retention/scheduler events; enrich with engine fields via an `engine` property under `metadata`.
  - Analyzer remains in `scripts/lib/analyzer-core.mjs`; extend summary with exposure/blueprint drift counters if needed (non‑breaking, bump `ANALYTICS_SCHEMA_VERSION` at `scripts/lib/analyzer-core.mjs:4`).
- Learner State & Actions
  - `lib/study-engine.ts`: shared adaptive helpers (Rasch ability, scheduler arms, retention budgeting, “Why this next”).
  - `lib/study-insights.ts`: compute dashboards (priority/stalled LOs, overexposed items) from learner state + analytics.
  - `lib/server/study-state.ts`: file-backed learner state store (`data/state/<learner>.json`, override via `STUDY_STATE_DIR`).
  - `app/study/actions.ts`: server action to update learner state, append telemetry, and return refreshed signals to the client.

## Data Model
- Per‑learner state: LO‑level `θ̂`, `SE`, last probe `b` window flag, and item‑level response counts; persisted in app storage (server‑side JSON under `data/state/<user>.json`) for local dev; optional Supabase tables later.
- Exposure ledger: per item/user timestamps for day/week counts and cooldown unlock times.
- Retention cards: FSRS parameters per item+LO; next review timestamps.

## File‑by‑File Changes (execution order)
1. `scripts/lib/rasch.mjs` — GH nodes/weights, EAP posterior, info function, mastery probability.
2. `scripts/lib/gpcm.mjs` — PMF/log‑likelihood, thresholds `τ`, EM re‑fit scaffold and shrinkage hooks.
3. `scripts/lib/selector.mjs` — Utility computation, filters (time cap ≤6 min; exposure), randomesque top‑K.
4. `scripts/lib/scheduler.mjs` — TS over LO arms with urgency and blueprint multipliers; cooldown logic.
5. `scripts/lib/fsrs.mjs` — FSRS updates, scheduling, budgeted queue filler.
6. `scripts/lib/exposure.mjs` — Ledger, multipliers, overfamiliarity clamp.
7. `lib/server/study-state.ts` — Persist learner LO ability + item exposure counts (JSON with cooldown history).
8. `lib/study-engine.ts` — Export shared helpers (difficulty→β, Thompson arms, retention budgeting, “Why this next”).
9. `app/study/actions.ts` — Server action handling Rasch update, telemetry append, learner state persistence.
10. `app/study/engine.ts` — Server module orchestrating selection loop; integrates telemetry writers using schemas and re-exports shared helpers.
11. `components/StudyView.tsx` — Client view invoking the server action, rendering “Why this next,” and respecting recommended LO queue.
12. `scripts/jobs/refit-weekly.mjs` — Weekly Rasch/GPCM refit summary (`npm run jobs:refit`); emits per-item stats (attempt totals, p-value, suggested half-life) under `data/refit-summaries/` for governance review.
13. Docs: update `README.md`, `AGENTS.md`, `PLAN.md` with engine gates and operations.

## Interfaces & Contracts
- Inference loop API (internal):
  - `selectNext({ learnerId, loId, sessionState }) -> { itemId, reason, signals }` using `selector.mjs`.
  - `scheduleNextLo({ learnerId, eligibleLos, blueprint }) -> { loId, reason, signals }` using `scheduler.mjs`.
  - `retentionQueue({ learnerId, sessionMinutes }) -> Array<{ itemId, dueAt }>` using `fsrs.mjs`.
- Telemetry
  - Reuse existing ingestion endpoints: `POST /api/attempts`, `POST /api/sessions`; keep deterministic writers; NDJSON path in `scripts/analyze.mjs:10`.

## Tests (unit/e2e/perf)
- `tests/rasch.eap.test.mjs` — EAP update monotonicity and convergence on synthetic item responses.
- `tests/gpcm.pmf.test.mjs` — PMF sums to 1; log‑likelihood increases under correct updates.
- `tests/scheduler.ts.test` — TS prioritizes LOs with higher sampled `ΔSE/min`, respects rails and cooldowns.
- `tests/exposure.ledger.test.mjs` — Caps enforced (≤1/day, ≤2/week) and cooldown transitions.
- `tests/fsrs.queue.test.mjs` — Budgeted fill obeys ≤40%/≤60% rule and overdue boosts.
- `tests/engine.state.test.ts` — Learner state persistence roundtrips, exposure counters, JSON shape.
- UI snapshot for “Why this next” pill shows numeric components and matches engine signals.

## Observability & Ops
- Add structured `console.debug` with `{ engine: 'selector|scheduler|fsrs', reason, signals }` in server logs.
- Weekly job logs EM fit status and reliability deltas; bump `ANALYTICS_SCHEMA_VERSION` only on additive fields (`scripts/lib/analyzer-core.mjs:4`).

## Security & Privacy
- No PII in state files; key by pseudonymous learner IDs.
- Keep service‑role secrets server‑only; reuse existing envs in `.env.example`.

## Acceptance Gates (from PRD)
- Blueprint rails within ±5%; exposure caps enforced; stop rules met; randomesque top‑K; retention budgeting.
 - Deterministic outputs; evidence P95 <250 ms.
- Validator clean; analytics present and deterministic; PLAN updated post‑merge.

## Rollout & Backout
- Branch: `feat/adaptive-engine`.
- Rollout in phases (selector → scheduler → retention → weekly EM fit), feature‑flagged behind `ENGINE_ENABLE=1` in server modules.
- Backout: disable the flag and fall back to current static Study/Drill ordering; keep attempt ingestion untouched.

## Risk Register
| Risk | Owner | Status | Mitigation |
| --- | --- | --- | --- |
| Rasch/EAP numerical instability | AnalyticsEngineer | Open | Clamp θ grid, log‑sum‑exp stabilization, unit tests.
| Cold‑start quality | AnalyticsEngineer | Open | Elo fallback and blended warm step; sanity bounds.
| Scheduler overfocus on long LOs | Implementation Strategist | Open | Use per‑minute objective and blueprint multipliers; cap utility.
| Overexposure | QA‑Proctor | Open | Strict caps and cooldown enforcement; ledger tests.
| Weekly EM maintenance load | ProjectManager | Open | Automate job with logs and guardrails; only adjust when reliability improves.

Next agent: AdaptiveEngineer · Model: gpt-5-codex-high · Scope: scripts/lib/{selector,scheduler,rasch,gpcm,fsrs,exposure}.mjs app/(study)/engine.ts tests/**

---

# Feature — “Why This Next” Pill · Implementation Plan (Scoped)

Date: 2025-10-02
Owners: UIBuilder, GraphUX, AnalyticsEngineer

## 1) Architecture (deterministic, UI-only)
- Data source: `public/analytics/latest.json` read on server via `lib/getAnalytics.ts`.
  - Output path contract: `scripts/analyze.mjs:10–11`; generator: `scripts/analyze.mjs:13–19`.
  - Field contract: `scripts/lib/analyzer-core.mjs:278–299` (summary root), `:194–201` (confusion_edges), `:189–193` (elg_per_min), `:146–162` (ttm_per_lo).
- Signals formatter: `lib/study-engine.ts:220–248` (`buildWhyThisNext`), reused by the pill.
- Placement: Study screen header next to the existing Why toggle in `components/StudyView.tsx:352–405`.
- Rendering: Small client component that receives deterministic props (numbers) and renders pill with no network calls.

## 2) Interfaces
```ts
// components/pills/WhyThisNextPill.tsx (new)
export interface WhySignals {
  info: number; blueprintMult: number; exposureMult: number; fatigue: number;
  medianSec: number; thetaHat: number; se: number; masteryProb: number;
  loIds: string[]; itemId: string;
}
export function WhyThisNextPill(props: { signals: WhySignals; onClick?: () => void }): JSX.Element
```

## 3) Data flow
1) Server loads analytics once per request in `app/study/page.tsx` via `loadAnalyticsSummary()` (see `lib/getAnalytics.ts:1–24`).
2) `StudyTabs` → `StudyView` receives `analytics` prop (see `app/study/page.tsx:1–22, 30–44`).
3) `StudyView` derives per-item candidate signals using helpers:
   - derive ability: `components/StudyView.tsx:64–93` and `lib/study-engine.ts:246–261`.
   - score candidates: `lib/study-engine.ts:51–92`.
   - compose rationale: `lib/study-engine.ts:220–248`.
4) Pass structured numbers to the pill component (no string concatenation in the UI); pill renders compact chips with a simple tooltip.

## 4) File‑by‑File Changes
1. `components/pills/WhyThisNextPill.tsx` — NEW: render compact pill with numeric chips (Info, Blueprint×, Exposure×, Median s, θ̂, SE, Mastery).
2. `components/StudyView.tsx` — REF: replace inline string `whyNext` display with `<WhyThisNextPill signals={…} />` keeping the existing popover (lines `352–405`).
3. `tests/why-pill.test.tsx` — NEW: unit render test verifying chips render and numbers are formatted deterministically; snapshot minimal.
4. `tests/engine.why.test.ts` — KEEP/ADOPT: already validates `buildWhyThisNext` composition (present in repo, add to test run).
5. `README.md` — DOC: add short usage note for the pill and analytics dependency.

## 5) Tests (unit/e2e/perf)
- Unit: `tests/why-pill.test.tsx` ensures all chips present and formatted; `tests/engine.why.test.ts` already covers string builder.
- Integration: add Study view render smoke with mocked analytics to ensure pill mounts.
- Perf: ensure render <1ms in jsdom by limiting chip count and using memoized formatting.

## 6) Observability
- Add `data-why-next` attributes to chips for test selectors.
- Optional `console.debug` in dev builds gated by `NODE_ENV!=='production'`.

## 7) Security/Privacy
- Read‑only local JSON; no PII; no network calls; no runtime LLM.

## 8) Performance
- Focus on render speed and stability in this phase.
- No layout shift: fixed-size inline pill; clamp to 2 lines in existing popover.

## 9) Rollout & Backout
- Feature‑flag via boolean prop on `StudyView` (default ON). Backout by rendering the prior inline string.

## 10) Owners & Timeline
- Day 0: component + tests (UIBuilder, GraphUX).
- Day 1: integrate into `StudyView`, add snapshot and smoke test; PM updates PLAN.

## 11) Risks
- Risk: analytics missing → show ghost pill with “Analytics unavailable”.
- Risk: overlong numbers → format with fixed decimals and max-width chips.

## 12) Acceptance Gates (must pass)
- Deterministic: no runtime fetch beyond local JSON; snapshot stable.
- Tests green; validator unaffected; CI build required by branch protection stays green.
- PLAN updated after merge.
