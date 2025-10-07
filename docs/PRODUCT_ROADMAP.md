# Studyin Product Roadmap — October 7, 2025

Owner: Product Strategy Agent  
Stage: Stage 1 (Milestones A–C) — Minimum Viable Process  
Status: Active

## 0) Executive Summary
Studyin has shipped a compelling gamified surface (XP/levels, streaks, quests, achievements) with a polished Dashboard and a new Follow The Money (FTM) mini‑game. The adaptive learning engine is scaffolded with deterministic shims (Rasch/GPCM, Thompson Sampling, FSRS) and a visible “Why this next” UI in the study view. Analytics and telemetry pipelines exist and are deterministic, but production data is sparse locally. In the next 3–6 months we will: 1) complete and harden the deterministic adaptive engine and transparency, 2) expand content and evidence fidelity while meeting validator gates, 3) deepen gamification loops that reinforce learning (quests, economy, mini‑games), and 4) assert performance and platform reliability budgets.

---

## 1) Current Product Assessment

What’s working well
- Gamification surface: XP, levels, streak, daily/weekly quests, achievements render cleanly in Dashboard (app/dashboard/page.tsx). Visuals are high‑quality with HeroUI + tokens, and onboarding for first‑time users is delightful.
- Analytics pipeline: Deterministic NDJSON → analyzer core → public snapshot (scripts/analyze.mjs → public/analytics/latest.json). Study attempts are logged from the Study view (components/InteractiveLessonViewer.tsx → app/study/actions.ts → services/telemetry/localTelemetry.ts → lib/server/events.ts).
- Adaptive engine scaffolding: Deterministic shims and APIs exist for candidate scoring, scheduler arms, retention budgeting, and why‑pill signals (lib/study-engine.ts; lib/engine/shims/**). “Why this next” pill UI is present (components/pills/WhyThisNextPill.tsx) and wired in the study flow.
- Follow The Money mini‑game: Implemented with Anime.js + Framer Motion, deterministic shuffle engine, scoring, difficulty curves, and XP flow (components/games/follow-the-money/**, lib/games/follow-the-money/**, app/games/follow-the-money/page.tsx). XP integrates via XPProvider (components/XPProvider.tsx) and persists to /api/learner-state.
- Dev/prod guardrails: /api/upload is dev‑only and analytics can optionally mirror to Supabase; determinism policy is repeated across docs.

What’s missing or incomplete
- Engine gates not fully enforced: Exposure caps and cooldowns are disabled in buildThompsonArms (lib/study-engine.ts:308–316; `disableCaps = true`). This violates Engine Gate requirements (AGENTS.md). Blueprint rails are computed but not asserted end‑to‑end in UI flows.
- Analytics density: public/analytics/latest.json is present but often empty locally; no live telemetry visuals on Dashboard. We need a background refresh and visible health signals.
- Dashboard data gaps: dashboardAnalytics.ts uses mock fallbacks (e.g., topic names = LO IDs; daily/weekly quest counters are approximations). Needs real data from NDJSON and engine.
- Mini‑game telemetry: FTM awards XP but does not log attempt events to analytics. Engagement for game modes is therefore invisible to ELT and KPIs.
- Evidence & item bank: Authoring workflow exists, but we need a steady cadence of validated items to drive the adaptive loop; validator gates must be integrated into PR checks consistently.
- Security hygiene: docs/CODEX_GEMINI_WORKFLOW.md shows example API keys inline. Even if placeholders, move to example files and redact to avoid copy/paste misuse.

User experience gaps
- “Why this next” is visible on Study but not summarized on Dashboard; no “Last session drivers” or “What to do now” CTA that blends analytics + engine reasoning.
- Quests/Achievements not context‑aware to mastery/retention states; lacks clarity on how to earn next.
- FTM is fun but unconnected to mastery goals (e.g., streak multipliers or daily boosts that encourage a study session follow‑through).

Technical debt areas (with file pointers)
- Engine cooldowns/ caps disabled: lib/study-engine.ts:308–316.
- Dashboard topic labeling TODO: lib/services/dashboardAnalytics.ts:74–89 (names from LO registry missing).
- Mock quest metrics: lib/services/dashboardAnalytics.ts:270–308 (daily) and 309–347 (weekly).
- No background analytics cron: scripts/analyze.mjs runs manually; app/api/analytics/refresh exists but no scheduled trigger wired to PM cadence.
- Performance instrumentation: Performance budgets noted in PLAN.md, but no web‑vitals logger surfaced in UI.

---

## 2) Strategic Priorities (3–6 months)

A. Core Learning
- Harden adaptive engine (Rasch/GPCM + Elo warm start) and enforce Engine Gate: blueprint rails ±5%, exposure caps (≤1/day, ≤2/week, 96h cooldown), stop rules, retention budgeting. Wire full transparency and unit tests.
- Expand evidence‑first item bank with validator gates; ensure ABCDE + per‑choice rationales + crop performance.

B. Gamification Enhancements
- Quest 2.0: dynamic quests tied to mastery, retention due, and confusion edges; weekly/seasonal ladders and streak safeties.
- Economy & rewards: cosmetic tracks, limited‑time events, and mission streak insurance; integrate FTM as a “warm‑up” with soft handoff into Study.

C. Analytics & Insights
- Always‑on analytics refresh with health checks; surface TTM, ELG/min, and “Why this next” summaries on Dashboard. 
- Reliability metrics (KR‑20/α), point‑biserial dashboards, NFD sweeps to drive item fixes.

D. Platform & Scalability
- Deterministic only: keep shims under lib/engine/shims/**; add CI gates. 
- Performance budgets: assert item render <100 ms, evidence <250 ms P95, CLS <0.1; add lightweight Web Vitals logger.
- Security & privacy: redact keys; keep Supabase keys server‑only; NDJSON export‑ready.

---

## 3) Feature Roadmap

Phase 1 (0–4 weeks)
- Enforce engine exposure caps and cooldowns (lib/study-engine.ts): remove `disableCaps`, add test coverage; expose violations in debug UI. 
- Dashboard accuracy: replace mock quest/achievements with telemetry‑backed counters; map LO IDs → names via blueprint registry. 
- Analytics refresh: wire app/api/analytics/refresh to a local cron (or dev script) + PM pulse; display analytics health on Dashboard. 
- FTM telemetry: add `game_event` NDJSON (session_id, difficulty, selection_time, correct, xp) and a simple chart on Dashboard.
- Security docs: move example keys to `.env.example` and redact docs.

Dependencies: analyzer core stable; learner state repo OK; no DB schema changes.  
Validation gates: Engine Gate (caps on), Analytics Gate (latest.json non‑empty), Perf (no regressions).

Phase 2 (1–3 months)
- Adaptive engine completion: blueprint rails guard + “Why this next” pill ubiquitous (Study + Dashboard summary). 
- Retention lane: queue budget UI and overdue boosts; add “review now” CTA. 
- Quest 2.0: mastery/retention/deficit‑driven quests; seasonal achievements; streak forgiveness. 
- Evidence gate tooling: crop perf check, one‑click source open; Git LFS audit.
- Web Vitals: lightweight logger and budget assertions in CI.

Dependencies: item validator clean; analytics snapshot present; UI tokens stable.  
Validation: Item Gate (published ≥2.7 rubric), Engine Gate (rails within ±5%), Evidence Gate (<250 ms), Perf budgets logged.

Phase 3 (3–6 months)
- Personal Adaptive Study Engine GA: Thompson sampler in production, FSRS retention budgeting, mastery probes; reliability and confusion dashboards. 
- Content scale‑up: module ingestion playbooks, authoring velocity, deterministic analysis deltas in PRs. 
- Gamified economy: cosmetic track, ladders, and mini‑event cadence; FTM “combo” linking to study quests. 
- Platform scale: optional Supabase snapshot sink with retention monitoring; privacy scrubs for RAG.

Dependencies: analytics growth, item volume, CI stability.  
Validation: Analytics Gate (recall of signals), Governance ★ ≥90, all ★ ≥2.8.

---

## 4) Success Metrics

How we measure progress
- Activation & retention: D1/D7 retention, weekly active learners (WAL), average weekly study minutes. 
- Learning efficiency: SE reduction/min, projected minutes to mastery (TTM), ELG/min ordering stability. 
- Reliability & assessment: KR‑20/α ≥0.7 per form; point‑biserial >0.15; NFD <5%. 
- Gamification: daily quest completion rate, streak distribution, FTM DAU and conversion to Study within 10 minutes, XP/hour. 
- Performance: item render <100 ms, evidence P95 <250 ms, CLS <0.1; 95+ Lighthouse on critical routes. 
- Governance: validator clean, rubric ≥92/100 with ★ ≥2.8; deterministic engines only.

Targets (initial)
- WAL +25% over baseline in 8 weeks. 
- “Start Studying” CTA click‑through from Dashboard ≥35%. 
- FTM → Study conversion ≥20% sessions. 
- KR‑20/α ≥0.70 in first published form; point‑biserial median ≥0.18. 
- Perf: budgets met on /, /study, /summary, /dashboard.

---

## 5) Work Breakdown (Phased Epics)

Epic A — Engine Gates & Transparency (Phase 1)
- Tasks: enable cooldowns; add exposure/cooldown multipliers; debug panel; tests. Wire “why” signals to Dashboard summary. 
- Files: lib/study-engine.ts, lib/engine/shims/**, components/pills/WhyThisNextPill.tsx, app/dashboard/page.tsx.
- Risks: pool starvation; Mitigation: fallback pool and multiplier clamps.

Epic B — Analytics Health & Telemetry (Phase 1)
- Tasks: schedule analyzer; /api/health surfaces snapshot age; dashboard health chips. FTM game_event writer and chart. 
- Files: scripts/analyze.mjs, app/api/analytics/refresh/route.ts, public/analytics/latest.json, components/games/**, lib/server/events.ts.
- Risks: sparse data; Mitigation: seed dev data, CI smoke with fixtures.

Epic C — Quest 2.0 (Phase 2)
- Tasks: connect quests to analytics (TTM, overdue, confusion edges); add seasonal metadata; progress UI. 
- Files: lib/services/dashboardAnalytics.ts, components/quests/** (new), scripts/lib/analyzer-core.mjs.

Epic D — Retention Lane & Budgeting (Phase 2)
- Tasks: build retention views; budget timer; overdue boosts; “review now” CTA; logging. 
- Files: lib/study-engine.ts, components/retention/** (new), app/study/page.tsx.

Epic E — Evidence & Item Quality (Phase 2–3)
- Tasks: crop perf checks; one‑click source open; rubric tracking; CI validator gate. 
- Files: scripts/validate-items.mjs, content/evidence/**, docs/templates/**.

Epic F — Platform Performance & Security (Phase 2–3)
- Tasks: add web‑vitals logger; budget assertions; redact example keys; docs hardening. 
- Files: app/_app or root analytics hook, docs/**, .env.example.

---

## 6) Risks & Mitigations
- Determinism drift: lock seeds; snapshot tests for selector/scheduler; CI diff on analytics outputs.
- Over‑exposure or drift: re‑enable caps; guard with UI debug and logs; fallback to broader pool. 
- Content velocity: authoring pipeline bottlenecks; Mitigation: ItemSmith sprints; relaxed crop mode during early authoring; ValidatorFixer lane. 
- Performance regressions: add Web Vitals logger + smoke tests; CI thresholds. 
- Security hygiene: example keys only; env docs; secret scanning in CI.

---

## 7) Immediate Next Actions (Week 1–2)
1) Engine caps on: remove `disableCaps` (lib/study-engine.ts:308–316), add tests for cooldown eligibility and blueprint multipliers.  
2) Dashboard data correctness: resolve LO name lookup; replace quest mocks with telemetry‑backed counters.  
3) Analytics health: add snapshot age chip on Dashboard; wire `npm run analyze` to PM pulse and to /api/analytics/refresh.  
4) FTM telemetry: write `game_event` to NDJSON; add simple engagement card to Dashboard.  
5) Docs/keys: redact keys in docs/CODEX_GEMINI_WORKFLOW.md; ensure .env.example is authoritative.

---

## 8) References (repo lines)
- Engine caps disabled: lib/study-engine.ts:308–316.  
- Why‑pill UI: components/pills/WhyThisNextPill.tsx:1–130; used by components/InteractiveLessonViewer.tsx:210–230.  
- Analytics pipeline: scripts/analyze.mjs:1–60; scripts/lib/analyzer-core.mjs:1–240, 240–520; lib/server/events.ts:1–200.  
- Dashboard analytics service: lib/services/dashboardAnalytics.ts:1–240, 240–520 (quests/achievements logic).  
- FTM game implementation: components/games/follow-the-money/**, lib/games/follow-the-money/**, app/games/follow-the-money/page.tsx.

---

Next agent: Implementation Strategist · Model: gpt-5-high · Scope: lib/study-engine.ts, components/(dashboard|quests)/**, scripts/lib/analyzer-core.mjs, docs/**
