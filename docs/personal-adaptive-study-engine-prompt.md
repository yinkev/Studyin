# Personal Adaptive Study Engine — Delivery Prompt

## Prompt
You are an implementation agent preparing to build the Personal Adaptive Study Engine. Follow every requirement, numeric threshold, and pseudocode directive in the attached spec without deviation. Do not ask clarifying questions; if data is missing, assume reasonable defaults and state them. Maintain the section structure, algorithms, and gating rules exactly as written. Treat the spec below as authoritative for modeling choices, analytics, exposure controls, and weekly operations.

When collaborating with downstream tools or agents:
- Preserve all formulas, thresholds, and stopping rules.
- Keep the Rasch/GPCM + Elo fallback stack, Thompson Sampling scheduler, and FSRS retention mechanics intact.
- Ensure content balancing, exposure caps, and analytics logging schemas match the spec verbatim.
- Use the pseudocode as the foundation for production code, adapting only for language syntax.

Produce work artifacts that satisfy every checklist item in Section 11 and respect the upgrade gates in Section 8. Confirm compliance with the “Skip now” exclusions before implementing optional features.

## Spec (Authoritative Reference)

**1) In-session item selection & ability model**
- Model: Rasch (1-PL) with GPCM scoring (`a=1` fixed). Each response yields score `s = k/m` with partial credit log-likelihood `LL(θ) = Σ_k s_k log gpcm_pmf(k | θ, b, τ)`; item category thresholds `τ` re-fit weekly via EM using complete logs; difficulty `b` updated with shrinkage toward global mean.
- Prior: ability prior `N(prior_mu(LO), σ_prior^2)` with `σ_prior = 0.8`; tighten to `0.6` once `n_LO ≥ 20`. Maintain LO-level θ and SE per learner.
- Online update: after each response, perform EAP using 41-point Gauss–Hermite quadrature. Compute posterior weights `w_i ∝ prior(θ_i) * Π gpcm_pmf(k_resp | θ_i, b, τ)`. Normalize, compute `θ̂ = Σ w_i θ_i`, `SE = sqrt(Σ w_i (θ_i - θ̂)^2)`. Persist LO θ/SE and session θ/SE.
- Cold-start fallback: initialize LO ability and item difficulty with Bayesian Elo (`K=16`, logistic scale 400). Update Elo after each response using score `s=k/m`. Map Elo `R` to Rasch by `θ = (R - 1500) / 400`. Switch to Rasch per LO when **LO responses ≥3** and per item when **item responses ≥10**; blend by weighting 70% Rasch/30% Elo on first warm step, then fully Rasch.
- Utility function for candidate item within current LO: `U = [I(θ̂ | b, τ) / median_time(item)] * blueprint_multiplier(LO, system, ±5%) * exposure_multiplier(item) * fatigue_scalar`. Use `I(θ) = Var_{K~P(θ)}[K]` (variance trick). Apply penalty `fatigue_scalar = 0.8` if session time >45 min.
- Selector: filter items tagged to LO with `exposure_multiplier > 0` (respect caps). Rank by utility, take top `K=5`, choose uniformly at random (randomesque). Require at least one probe where `|θ̂ - b| ≤ 0.3` per LO before declaring mastery.
- Content gating: reject items that would push LO/system share outside **±5%** blueprint window or whose median time >6 min (cap). If none available, relax to highest info ignoring time cap but still respecting exposures.
- Stop rules within LO: stop when `SE ≤ 0.20` **and** `items_attempted ≥12`, **or** last 5 items yield `ΔSE < 0.02`, **or** `mastery_prob ≥ 0.85` confirmed with a fresh probe where `b ∈ [θ̂ ± 0.3]`. Session stops when combined fatigue score >0.6 (≥70 min or ≥3 LO mastered this session) or blueprint rails satisfied and queue empty.
- Mastery probability: `mastery_prob = Φ((θ̂ - θ_cut)/SE)` with `θ_cut = 0.0`. Flag for retention handoff when `mastery_prob ≥ 0.85` and last probe within window.

**2) Cross-topic scheduler**
- Objective: maximize expected LO SE reduction per minute. Maintain Gaussian posteriors over `ΔSE/min` for each LO-system pair using Thompson Sampling.
- Features: current LO SE, slope of SE over last 3 responses, blueprint gap (`target_share - share`), time since last practice, fatigue.
- TS procedure: sample `δ_i ~ N(μ_i, σ_i^2)` for each eligible LO; adjust with urgency multiplier `u_i = 1 + max(0, days_since_last - 3)/7`. Apply blueprint rails enforcing **±5%** per system/LO via multiplier `blueprint_multiplier`. Select LO maximizing `δ_i * u_i * blueprint_multiplier`. Tie-break by highest blueprint deficit, then highest SE, then longest time since last exposure.
- Eligibility: exclude LOs under cooldown (<96h since last attempt) unless blueprint deficit >8%. Minimum queue size 2 LOs; if none eligible, inject lowest exposure LO meeting blueprint rails.

**3) Retention lane**
- Engine: FSRS-based spaced review queue with daily scheduling independent of training. Store FSRS parameters per card (item+LO) from training history.
- Handoff criteria: move an item from training to retention when LO `mastery_prob ≥ 0.85`, last probe within `b ∈ [θ̂ ± 0.3]`, and SE trend non-increasing over last 3 probes. Freeze training exposure until retention slip occurs.
- Priority logic: compute FSRS next review time; overdue boost factor `boost = 1 + 0.1 * days_overdue(item)`. Items >3 days overdue jump queue; >7 days overdue flag increases session retention time budget to **≤60%** (baseline **≤40%**). Items with recent lapse (incorrect retention response) re-enter training queue.
- Time budgeting: for each session, allocate `retention_minutes = min(0.4, 0.6 if max days_overdue>7) * session_minutes`. Fill queue using FSRS ordering with boosts until budgeted time reached via `take_until_time` using median item times.

**4) Content balancing & exposure control**
- Blueprint enforcement: track cumulative session share per system and LO; ensure selected content keeps shares within **±5%** of target. When share drifts >5%, apply multiplier `blueprint_multiplier = max(0.2, 1 - drift*2)` to deprioritize overrepresented areas, boost underrepresented by `1 + drift*3` capped at 1.5.
- Exposure caps: enforce item/user **≤1/day**, **≤2/week**, with **96h cooldown** before reuse. `exposure_multiplier(item) = 0` when caps hit; gradually restore to 0.5 after cooldown, 1.0 after 7 days clean.
- Partial credit handling: log per-category performance to detect overfamiliarity; if `mean score >0.9` and SE<0.15, reduce exposure multiplier to 0.6 unless retention.
- Diversity: ensure per-session includes ≥2 systems when blueprint allows; if not feasible, log variance alert.

**5) Analytics to instrument from day 1**
- Logging schema (`data/events.ndjson`):
  - `session_start`: `{session_id, user_id, timestamp, planned_minutes}`.
  - `item_presented`: `{session_id, item_id, lo_id, system_id, theta_before, se_before, blueprint_share, exposure_count, time_allocated}`.
  - `item_response`: `{session_id, item_id, response_id, score_fraction, theta_after, se_after, mastery_prob, latency_ms, source_lane}`.
  - `lo_transition`: `{session_id, from_lo, to_lo, reason (scheduler|retention|fatigue), delta_se_expected, delta_se_actual}`.
  - `retention_event`: `{card_id, fsrs_state, due_at, answered_at, result, next_due}`.
- KPIs:
  - Per LO: current θ̂, SE, mastery probability, ΔSE/session, attempts count, days since last practice, blueprint share variance.
  - Per item: difficulty `b`, discrimination proxy (info at θ̂), average score, point-biserial, exposure counts vs caps, median time.
  - Session: time allocation (training vs retention), items per minute, SE reduction per minute, fatigue index, blueprint drift.
- Dashboards (minimal static pages or notebook views):
  1. **Priority LOs**: rank by lowest mastery probability with blueprint deficit >2%, include urgency and expected ΔSE/min.
  2. **Stalled LOs**: list LOs with SE reduction <0.01 over last 3 sessions or Elo plateau, highlight recommended interventions (new items vs retention).
  3. **Overexposed items**: items with exposure_multiplier <0.3 or caps triggered in last week; show alternatives with similar info.
- Analytics cadence: weekly snapshot pipeline storing aggregated metrics, reliability (KR-20 surrogate) per LO cluster, blueprint compliance logs.

**6) Pseudocode**
```pseudo
function update_theta_and_pick_item(lo_state, responses, candidates, session_ctx):
  gh = GH_41_points()
  for point in gh:
    prior = normal_pdf(point.theta, prior_mu(lo_state), prior_sd(lo_state))
    likelihood = 1.0
    for resp in responses:
      likelihood *= gpcm_pmf(resp.score, point.theta, resp.item.b, resp.item.tau)
    point.weight = prior * likelihood
  norm = sum(point.weight for point in gh)
  for point in gh:
    point.weight /= norm
  theta_hat = sum(point.weight * point.theta for point in gh)
  se = sqrt(sum(point.weight * (point.theta - theta_hat)^2 for point in gh))
  mastery_prob = normal_cdf((theta_hat - 0.0) / se)
  utilities = []
  for item in candidates:
    if not within_blueprint_window(item, session_ctx, 0.05):
      continue
    if !exposure_allowed(item):
      continue
    info = fisher_info_gpcm(theta_hat, item.b, item.tau)
    util = (info / median_time(item))
    util *= blueprint_multiplier(item.lo, item.system)
    util *= exposure_multiplier(item)
    if session_ctx.minutes > 45:
      util *= 0.8
    utilities.append({item, util})
  top5 = randomesque_top_k(utilities, 5)
  next_item = uniform_choice(top5)
  return {theta_hat, se, mastery_prob, next_item}
```
```pseudo
function choose_next_lo(lo_stats, blueprint_targets):
  eligible = []
  for lo in lo_stats:
    if lo.cooldown_remaining > 0 and blueprint_gap(lo) <= 0.08:
      continue
    sample = normal_sample(lo.mean_delta_se_per_min, lo.var_delta_se_per_min)
    urgency = 1 + max(0, lo.days_since_last - 3) / 7
    bp_mult = blueprint_multiplier(lo.id, lo.system)
    score = sample * urgency * bp_mult
    eligible.append({lo, score})
  if eligible.empty():
    lo = argmin_blueprint_share(lo_stats)
    return lo
  sorted_los = sort_descending(eligible, key=score)
  top = sorted_los[0]
  ties = [e for e in sorted_los if approx_equal(e.score, top.score, 0.01)]
  best = tie_break(ties)
  return best.lo
```
```pseudo
function build_retention_queue(fsrs_cards, session_minutes):
  budget = session_minutes * (0.4 if max_days_overdue(fsrs_cards) <= 7 else 0.6)
  ordered = []
  for card in fsrs_cards:
    due_in_days = days_overdue(card)
    base_time = median_time(card.item)
    boost = 1 + 0.1 * max(0, due_in_days)
    priority = FSRS_recall_prob(card) * -1 * boost
    ordered.append({card, priority, base_time})
  sorted_cards = sort_ascending(ordered, key=priority)
  queue = take_until_time(sorted_cards, budget)
  return queue
```

**7) Defaults assumed**
- Single user persona with consistent daily availability of 60–75 minutes.
- Accurate blueprint targets supplied per system/LO; missing targets default to equal weight.
- Item metadata complete (difficulty `b`, thresholds `τ`, median times) and refreshed weekly.
- Telemetry storage local (`data/events.ndjson`) with rotation weekly and manual Supabase export disabled initially.
- Session cadence: 5 study days per week; retention run daily including rest days via mobile check-ins.

**8) Upgrade path**
- **2-PL transition**: upgrade when **median item responses ≥150** and ≥**20%** items misfit (`infit/outfit >1.2 or <0.8`) **or** LO reliability < **0.75**. Introduce discrimination estimates, retrain weekly with EM.
- **Multilevel prior**: enable hierarchical priors per system when each system has **≥5** LOs with pairwise `r>0.30` across **≥200** joint responses.
- **Pairwise MIRT**: evaluate when **Yen’s Q3 > 0.20** for a LO pair on **≥100** joint responses for **4** consecutive weeks.
- **Exposure analytics**: add adaptive obtrusion tests once weekly exposures exceed 500 events.
- **Automation**: migrate logging to Supabase once daily events >5,000 and ingestion tokens configured.

**9) Skip now**
- No real-time collaborative sessions.
- No adaptive evidence retrieval or RAG surfacing during session.
- No automated item writing or distractor generation.
- No mobile native app; responsive web suffices.

**10) ROI call**
- Combines Rasch/GPCM with Elo fallback to deliver accurate ability estimates in low-data regimes while staying simple to maintain. TS scheduler with blueprint rails ensures cross-topic coverage and focuses on SE reduction, increasing efficiency per minute. FSRS retention lane protects long-term memory with minimal extra plumbing. Deterministic analytics and strict exposure caps manage overfitting and cognitive load. Stack balances rigor and implementation speed for a personal engine.

**11) What to build this week**
1. Implement telemetry schema and log writers for training, retention, and scheduler events.
2. Build Rasch/GPCM online updater with Elo cold-start bridge and randomesque selector respecting utility multipliers and exposure caps.
3. Implement Thompson Sampling scheduler with blueprint rails and fatigue-aware session loop.
4. Integrate FSRS retention queue with time budgeting and overdue boosts.
5. Ship analytics dashboards (Priority LOs, Stalled LOs, Overexposed items) using logged data.
6. Configure weekly EM refit job and reliability checks; document operational playbook.
