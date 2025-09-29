# Studyin Module Arcade PRD

## Context & Problem Statement
- Studyin targets a deterministic, evidence‑first learning experience across Study, Exam, Drill, and Summary. Today, core pieces exist but are fragmented: items and validator are solid, analytics are present, RAG/search is partial, and governance is emerging. We need a coherent, module‑agnostic product spec that unifies flows, gates, and deterministic analytics while keeping the current OKC heavy‑visual stance.
- Determinism is non‑negotiable: no runtime LLM calls; analytics and scoring must be reproducible from local data. Evidence must remain fast (<250 ms) and traceable to source.

## Goals
1. Deliver module‑agnostic Study, Exam, Drill, and Summary flows wired to deterministic engines and analytics.
2. Enforce item and blueprint gates via CLI and APIs; ensure authoring speed without sacrificing evidence fidelity.
3. Provide transparent adaptivity (“Why this next”) with numeric backing from analytics output, not heuristics.
4. Keep performance within documented budgets while allowing visuals first; maintain determinism and evidence latency.

## Non‑Goals
- No runtime LLMs or nondeterministic ranking. No cloud dependencies required for core usage (local‑first path stays primary).
- No A11y blocking gate during the OKC phase; accessibility audits can fail without blocking merge.
- No commitment to external data collection beyond pseudonymous, local NDJSON unless explicitly enabled.

## Personas & Scenarios
- Student: drills LOs, opens evidence, and sees “Why this next” with actual minutes/deficit values.
- ItemSmith: authors ABCDE items with per‑choice rationales and evidence; runs the validator locally and in CI.
- QA‑Proctor: verifies blueprint feasibility and exam locking; expects 409 with deficits when infeasible.
- ProjectManager: monitors rubric score and keeps PLAN current; requires deterministic outputs attached to PRs.

## Functional Requirements
1. Study/Exam/Drill/Summary Flows
   - Surface evidence chips and dialog for every item; avoid unlocking exam evidence.
   - Expose “Why this next” pill in Study/Drill using analytics fields: TTM per LO and ELG/min from `public/analytics/latest.json`.
2. Item & Blueprint Gates
   - Item validator must enforce ABCDE, per‑choice rationales, LO mapping, difficulty/Bloom, and evidence refs.
     - Published items require `rubric_score ≥ 2.7` per `scripts/validate-items.mjs:146`–`147`.
     - Evidence requires `bbox` or `cropPath` unless `REQUIRE_EVIDENCE_CROP=0` (see `scripts/validate-items.mjs:150`–`157`).
   - Blueprint feasibility preflight exists in validator and API. Exam endpoint returns 409 on deficits (`app/api/forms/route.ts:34`–`43`).
3. Deterministic Analytics
   - `npm run analyze` loads attempts and writes `public/analytics/latest.json` (`scripts/analyze.mjs:6`, `scripts/analyze.mjs:15`).
   - Output includes: `ttm_per_lo`, `elg_per_min`, `confusion_edges`, `speed_accuracy`, `nfd_summary`, and reliability (`kr20`, point‑biserial) as implemented in `scripts/lib/analyzer-core.mjs:37`–`54` and `scripts/lib/analyzer-core.mjs:240`–`257`.
   - Tunables documented in code: `TARGET_MASTERY`, `EXPECTED_GAIN_PER_ATTEMPT`, `MIN_ATTEMPTS_FOR_NFD` (`scripts/lib/analyzer-core.mjs:4`–`7`).
4. Temporal RAG Search
   - Deterministic query embedding and cosine similarity; temporal decay and LO boosts applied in `app/api/search/route.ts:29`–`33` and `app/api/search/route.ts:68`–`72`.
   - Returns k ranked chunks with citations and scores; no external model calls.
5. Governance
   - Rubric scoring script writes `public/analytics/rubric-score.json` (`scripts/score-rubric.mjs:9`–`11`). Attach to PRs and weekly pulses.
   - Git LFS tracks evidence; evidence latency target <250 ms remains a documented expectation.

## Non‑Functional Requirements
- Determinism: all engines and routes are deterministic; no runtime LLM usage.
- Performance: budgets enforced by Lighthouse CI (`.lighthouserc.json:12`–`18`). Visuals may exceed budgets with explicit justification documented in PR.
- Accessibility: non‑blocking in this phase per SOP; still prefer predictable focus and keyboard paths.
- Privacy: telemetry stays pseudonymous; service role keys remain server‑only.

## Acceptance Gates
- Item Gate: validator clean; ABCDE structure, per‑choice rationales, LO mapped; evidence present with `{file,page,(bbox|cropPath)}` or relaxed with citation when `REQUIRE_EVIDENCE_CROP=0` (`scripts/validate-items.mjs:150`–`157`). Published items must meet `rubric_score ≥ 2.7` (`scripts/validate-items.mjs:146`–`147`).
- Exam Gate: blueprint feasibility verified; deficits returned with 409 from forms API (`app/api/forms/route.ts:34`–`43`). Evidence remains locked in exam UI.
- Analytics Gate: latest.json contains required sections; reliability present; generated deterministically from NDJSON (`scripts/analyze.mjs:6`, `scripts/lib/analyzer-core.mjs:37`).
- Governance Gate: `npm run score:rubric` output attached (`public/analytics/rubric-score.json`).

## Metrics
- Rubric: overall ≥ configured threshold (see `config/rubric.json`) with critical categories ≥ threshold.
- RAG: recall@k from `scripts/rag/verify-index.mjs` meets target; document k and thresholds in PR.
- Speed‑accuracy distribution and NFD% trend from analytics.

## Rollout
1. Keep item bank validator green; attach rubric score and analytics outputs to PRs.
2. Wire Study/Drill “Why this next” to `latest.json`.
3. Harden `/api/forms` and blueprint preflight UIs to surface 409 deficits deterministically.
4. Stabilize `/api/search` scoring and verify recall harness.
5. Update SOP docs (README, AGENTS, PLAN) and ensure CI runs validators/tests/analyze.

## Risks & Mitigations
- Analytics drift after refactor → add regression tests comparing snapshots; keep schema version (`scripts/lib/analyzer-core.mjs:4`) stable.
- Evidence latency spikes on large assets → pre‑generate AVIF/WebP crops and store natural dimensions; verify P95 <250 ms in PR.
- Over‑fitting LO boosts in search → cap boosts and document parameters; provide reproducible evaluation.
