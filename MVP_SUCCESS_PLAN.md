# MVP Success Plan — Studyin Learning Application

**Status:** Active
**Owner:** ProjectManager (StudyinPlanner)
**Created:** 2025-10-07
**Target:** Functional study application with rubric score ≥92/100, all ★ categories ≥2.9
**Current Rubric Score:** 48.67/100 (Critical categories below threshold)

---

## Executive Summary

**Current State Assessment:**
- ✅ **UI Infrastructure:** Mantine v8.3.0 migrated, glassmorphism design system, 9/9 E2E tests passing (8/9 currently, 1 dev-gate issue)
- ✅ **Engine:** Deterministic adaptive engine ready (Rasch EAP, Thompson Sampling, FSRS retention) at `/Users/kyin/Projects/Studyin/app/study/engine.ts`
- ✅ **Lessons:** 9 wrist-hand lessons exist at `/Users/kyin/Projects/Studyin/content/lessons/wrist-hand/*.lesson.json`
- ✅ **Telemetry:** Events write to `/Users/kyin/Projects/Studyin/data/events.ndjson` via `/Users/kyin/Projects/Studyin/lib/server/events.ts`
- ✅ **Analytics:** Generator works (`npm run analyze` → `/Users/kyin/Projects/Studyin/public/analytics/latest.json`)
- ✅ **Evidence Assets:** 11 image files ready at `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/**/*.png`
- ❌ **CRITICAL GAP:** Content bank empty (`/Users/kyin/Projects/Studyin/content/banks/`) - validator shows "No item files found"
- ⚠️ **Upload:** Dev-only, requires `NEXT_PUBLIC_DEV_UPLOAD=1` + `scripts/worker.ts` running

**The Critical Blocker:** Without items in the content bank, the study engine cannot select questions, rendering the application non-functional for its core purpose.

**Immediate Path to Success:**
1. **TODAY (30 min):** Seed minimal content bank with 3-5 validated items
2. **Week 1:** Validate full study loop, fix critical rubric gaps
3. **Week 2:** Iterate to rubric threshold ≥92/100

---

## Section 1: Immediate Usability (TODAY - 30 minutes)

### Goal
Have a functional study session running in 30 minutes with real content.

### Critical Actions

#### Step 1.1: Seed Minimal Content Bank (10 min)
**Owner:** ItemSmith
**Model:** gpt-5-codex-high
**File Paths:**
- Source template: `/Users/kyin/Projects/Studyin/config/item_ecg_stemi_01.item.json`
- Target directory: `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/`
- Evidence directory: `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/`

**Action Items:**
```bash
# 1. Create bank directory
mkdir -p /Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1

# 2. Copy and adapt template to create 3 minimal items
# Use existing evidence assets:
# - ulnar-nerve-claw-hand/claw-hand.png
# - radial-nerve-wrist-drop/radial-nerve-wrist-drop.png
# - median-nerve-carpal-tunnel/median-nerve-carpal-tunnel.png
```

**Minimal Item Requirements (per `/Users/kyin/Projects/Studyin/scripts/validate-items.mjs:42-70`):**
- schema_version: "1.0.0"
- id: Unique identifier (e.g., "item.ulnar.claw-hand.01")
- stem: Clinical vignette
- choices: A-E with text
- key: Correct answer (A-E)
- rationale_correct: Explanation for correct answer
- rationale_distractors: Object with explanations for A-E (excluding key)
- los: Array with at least one LO ID (e.g., ["lo.hand.neurovascular-supply"])
- difficulty: "easy" | "medium" | "hard"
- bloom: "remember" | "understand" | "apply" | "analyze" | "evaluate"
- evidence: { file, page, cropPath (optional), citation }
- status: "draft" (for now, will validate before publishing)

**Success Criteria:**
```bash
npm run validate:items
# Expected: "✓ 3 items validated" (no errors)
```

#### Step 1.2: Update Learning Objectives Registry (5 min)
**Owner:** ItemSmith
**File Path:** `/Users/kyin/Projects/Studyin/config/los.json`

**Current State:** Empty array (`learning_objectives: []`)

**Action:**
```json
{
  "schema_version": "1.0.0",
  "learning_objectives": [
    {
      "id": "lo.hand.neurovascular-supply",
      "title": "Hand Neurovascular Supply",
      "system": "Upper Limb",
      "section": "Hand",
      "description": "Identify nerve distributions and common injury patterns in the hand"
    },
    {
      "id": "lo.wrist.carpal-architecture",
      "title": "Wrist Carpal Architecture",
      "system": "Upper Limb",
      "section": "Wrist",
      "description": "Understand carpal bone arrangement and ligamentous support"
    }
  ]
}
```

**Success Criteria:**
- LO IDs in items match LO IDs in `/Users/kyin/Projects/Studyin/config/los.json`
- Validator accepts LO references

#### Step 1.3: Update Blueprint for Feasibility (5 min)
**Owner:** QA-Proctor
**File Path:** `/Users/kyin/Projects/Studyin/config/blueprint.json`

**Current State:** Empty weights (`weights: {}`)

**Action:**
```json
{
  "schema_version": "1.0.0",
  "id": "studyin-upper-limb-mvp",
  "weights": {
    "lo.hand.neurovascular-supply": 0.6,
    "lo.wrist.carpal-architecture": 0.4
  }
}
```

**Blueprint Feasibility Check (per `/Users/kyin/Projects/Studyin/scripts/lib/blueprint.mjs:12`):**
- Weights sum to ~1.0 (±5% tolerance)
- Each LO in blueprint has at least 1 item in bank
- No deficit warnings when generating forms

#### Step 1.4: Test Study Flow End-to-End (10 min)
**Owner:** UIBuilder + AdaptiveEngineer
**Terminal Commands:**

```bash
# 1. Start dev server
npm run dev:start
# Server starts on http://localhost:3005

# 2. In new terminal: verify analytics baseline
npm run analyze
cat /Users/kyin/Projects/Studyin/public/analytics/latest.json
# Expected: has_events: false, empty arrays (normal before first session)

# 3. Navigate to study page
# http://localhost:3005/study
# Expected: Should show lesson viewer with generated MCQ from lesson content

# 4. Complete one attempt (select answer, view rationale)
# Expected:
# - Answer selection logs to data/events.ndjson
# - Rationale displays with evidence reference
# - "Next" button advances to next question

# 5. Verify telemetry
cat /Users/kyin/Projects/Studyin/data/events.ndjson | tail -1 | jq .
# Expected: AttemptEvent with schema_version "1.1.0"

# 6. Regenerate analytics
npm run analyze
cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.has_events'
# Expected: true
```

**Success Criteria:**
- ✅ Study page loads without errors
- ✅ At least one MCQ renders from lesson content
- ✅ Answer submission writes to `/Users/kyin/Projects/Studyin/data/events.ndjson`
- ✅ Analytics regenerate with `has_events: true`
- ✅ Lesson viewer displays high-yield content from `/Users/kyin/Projects/Studyin/content/lessons/wrist-hand/*.lesson.json`

**Known Limitation:** Current study page loads lessons only (line 10-42 of `/Users/kyin/Projects/Studyin/app/study/page.tsx`). Items from content bank require engine integration in `/Users/kyin/Projects/Studyin/app/study/engine.ts` (see Week 1 tasks).

---

## Section 2: Content Strategy (Week 1)

### Goal
Build a realistic content bank with 12-20 high-quality items across 2-3 LOs to enable genuine adaptive study sessions.

### Content Roadmap

#### Phase 2.1: Expand to 12 Items (Days 1-2)
**Owner:** ItemSmith
**Model:** gpt-5-codex-high
**File Paths:** `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/`

**Target Distribution:**
- **lo.hand.neurovascular-supply:** 7 items
  - 2 easy (remember/understand): Nerve distributions, basic anatomy
  - 3 medium (apply): Clinical presentations (claw hand, carpal tunnel)
  - 2 hard (analyze): Differential diagnosis, injury patterns
- **lo.wrist.carpal-architecture:** 5 items
  - 2 easy: Bone identification, ligament names
  - 2 medium: Fracture patterns, stability mechanisms
  - 1 hard: Complex injury assessment

**Evidence Mapping:**
Use existing assets in `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/`:
- ulnar-nerve-claw-hand/claw-hand.png
- radial-nerve-wrist-drop/radial-nerve-wrist-drop.png
- median-nerve-carpal-tunnel/median-nerve-carpal-tunnel.png
- median-nerve-pronator/median-nerve-pronator.png
- radial-nerve-monteggia/radial-nerve-monteggia.png
- ulnar-nerve-handlebar-palsy/ulnar-nerve-handlebar-palsy.png

**Validation Gates (per `/Users/kyin/Projects/Studyin/scripts/validate-items.mjs:145-157`):**
```bash
# After each batch of 3-4 items
npm run validate:items

# Check for:
# - All ABCDE choices present
# - rationale_distractors covers all non-key choices
# - evidence.file points to existing asset
# - evidence.cropPath or citation present (REQUIRE_EVIDENCE_CROP=0 initially)
# - rubric_score ≥ 2.7 for status "published"
```

**Item Authoring Workflow:**
1. Draft 3 items per session
2. Run validator: `npm run validate:items`
3. Fix errors flagged by ValidatorFixer
4. Self-review against rubric (see Section 4)
5. Update status to "review" after internal QA
6. Update status to "published" after rubric ≥ 2.7

#### Phase 2.2: Evidence Enhancement (Days 3-4)
**Owner:** EvidenceCurator
**File Paths:** `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/`

**Tasks:**
1. **Generate Missing Crops:** Items without cropPath should have evidence crops created
   ```bash
   # Example crop generation (pseudo-code, tool-dependent)
   # Input: source PDF + bbox coordinates
   # Output: AVIF/WebP + PNG fallback at cropPath
   ```

2. **Performance Validation (per `/Users/kyin/Projects/Studyin/AGENTS.md:76`):**
   - Crop loads <250 ms P95 (mobile test)
   - Natural width/height stored to prevent CLS
   - Git LFS tracking for all images >100KB

3. **Citation Completeness:**
   - Each evidence object has `citation` field
   - `source_url` optional but recommended
   - Format: "Author, Title, Year" or "Textbook Chapter X, Page Y"

**Success Criteria:**
- ✅ 12/12 items have either cropPath OR (citation AND bbox)
- ✅ Evidence gate passes: Crop loads <250 ms
- ✅ No broken image references in study UI

#### Phase 2.3: Blueprint Refinement (Day 5)
**Owner:** QA-Proctor
**File Path:** `/Users/kyin/Projects/Studyin/config/blueprint.json`

**Action:** Update weights based on 12-item bank
```json
{
  "schema_version": "1.0.0",
  "id": "studyin-upper-limb-mvp",
  "weights": {
    "lo.hand.neurovascular-supply": 0.58,
    "lo.wrist.carpal-architecture": 0.42
  }
}
```

**Blueprint Feasibility Test (per `/Users/kyin/Projects/Studyin/PRD.md:64-66`):**
```bash
# Generate a 10-item exam form
# Expected: No 409 deficits, blueprint drift within ±5%
# Tool: app/api/forms/route.ts (if exam endpoint exists)
```

**Acceptance:**
- ✅ Blueprint weights sum to 1.0 (±0.05)
- ✅ Each LO can generate ≥3 unique items per session
- ✅ No exposure cap violations in 30-item session simulation

---

## Section 3: Workflow Validation

### Goal
Verify Upload → Study → Feedback loop with real file paths and success metrics.

### 3.1: Upload Flow (Development Only)

**Prerequisites:**
- `.env.local` contains `NEXT_PUBLIC_DEV_UPLOAD=1` ✅ (confirmed at `/Users/kyin/Projects/Studyin/.env.local`)
- Worker script exists at `/Users/kyin/Projects/Studyin/scripts/worker.ts` ✅

**Test Procedure:**
```bash
# Terminal 1: Start dev server
npm run dev:start

# Terminal 2: Start worker
npx tsx scripts/worker.ts
# Expected: "[worker] polling for jobs..."

# Terminal 3: Monitor queue
watch -n 2 "cat /Users/kyin/Projects/Studyin/data/queue/jobs.json | jq '.[] | {id, status}'"
```

**Upload Test:**
1. Navigate to `http://localhost:3005/upload`
2. Upload a small PDF (e.g., 1-page clinical case)
3. Monitor worker terminal for progress:
   - `init` → `ocr` → `lo-extraction` → `mcq-generation` → `validation` → `refinement` → `saving`
4. Check output in `/Users/kyin/Projects/Studyin/data/lessons/`

**Success Criteria:**
- ✅ File uploads to `/Users/kyin/Projects/Studyin/data/uploads/`
- ✅ Job appears in `/Users/kyin/Projects/Studyin/data/queue/jobs.json` with status "queued"
- ✅ Worker processes job (status → "processing" → "completed")
- ✅ Lesson JSON written to `/Users/kyin/Projects/Studyin/data/lessons/`
- ✅ Lesson passes schema validation (`interactiveLessonSchema`)

**Known Issues (from queue analysis):**
- Queue shows 3+ failed jobs with JSON parse errors
- Common failure: "Expected ',' or '}' after property value"
- **Mitigation:** ValidatorFixer should review worker output before saving

**Ownership:** DataSteward + AdaptiveEngineer

### 3.2: Study Flow Integration

**File Paths:**
- Study page: `/Users/kyin/Projects/Studyin/app/study/page.tsx`
- Engine core: `/Users/kyin/Projects/Studyin/app/study/engine.ts`
- Item selector: `/Users/kyin/Projects/Studyin/lib/study-engine` (imported at line 3-18 of engine.ts)

**Current Limitation:** Study page loads lessons only (lines 10-42). Items from content bank require integration.

**Integration Task (Week 1):**
**Owner:** AdaptiveEngineer + UIBuilder
**Model:** gpt-5-codex-high

**Objective:** Wire content bank items into study engine selector

**Implementation Steps:**
1. **Load Bank Items:**
   ```typescript
   // In app/study/page.tsx or new loader
   async function loadBankItems(loId: string): Promise<CandidateItem[]> {
     const bankRoot = '/Users/kyin/Projects/Studyin/content/banks';
     const files = await fs.readdir(path.join(bankRoot, 'upper-limb-oms1'));
     // Parse and filter by LO
     // Return as CandidateItem[] for engine
   }
   ```

2. **Initialize Engine State:**
   ```typescript
   // Load learner state from lib/server/study-state.ts
   const learnerState = await loadLearnerState('demo-learner');
   const candidates = await loadBankItems('lo.hand.neurovascular-supply');

   // Call selectNextItem from lib/study-engine
   const selection = selectNextItem(candidates, learnerState, blueprint);
   ```

3. **Render Selected Item:**
   - Replace lesson MCQ stub with actual item from selection
   - Display stem, choices A-E, evidence reference
   - Wire answer submission to engine update + telemetry

4. **Update Learner State:**
   ```typescript
   // After attempt
   const eapResult = runEapUpdate(learnerState, itemId, score);
   await updateLearnerLoState(learnerId, loId, eapResult);
   await recordItemExposure(learnerId, itemId);
   ```

**Success Criteria:**
- ✅ Study page selects items from `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/`
- ✅ Engine respects blueprint weights (58% hand, 42% wrist)
- ✅ Exposure caps enforced (≤1/day, ≤2/week per item)
- ✅ "Why this next" transparency displays engine reasoning
- ✅ Stop rules trigger (SE ≤ 0.20 OR mastery_prob ≥ 0.85)

### 3.3: Feedback Loop Validation

**Test Scenario:** 10-item study session

**Procedure:**
```bash
# 1. Baseline state
npm run analyze
# Record TTM per LO, mastery metrics

# 2. Complete 10 attempts via study UI
# Alternate correct/incorrect to test EAP updates

# 3. Check telemetry
cat /Users/kyin/Projects/Studyin/data/events.ndjson | jq 'select(.event_type == "attempt")' | wc -l
# Expected: 10 attempt events

# 4. Regenerate analytics
npm run analyze

# 5. Verify analytics changes
cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.ttm_per_lo'
# Expected: Array with TTM estimates per LO

cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.confusion_edges'
# Expected: Edges for commonly confused LOs

# 6. Check mastery progression
cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.mastery_per_lo'
# Expected: Probability updates based on EAP
```

**Success Criteria:**
- ✅ Attempt events include `engine` metadata (theta_hat, se, mastery_probability)
- ✅ Analytics reflect session data (TTM, ELG/min, confusion edges)
- ✅ Learner state persists across sessions
- ✅ Retention queue populates for mastered LOs (mastery_prob ≥ 0.85)

**File References:**
- Telemetry writer: `/Users/kyin/Projects/Studyin/lib/server/events.ts:82-93`
- Analytics generator: `/Users/kyin/Projects/Studyin/scripts/analyze.mjs`
- State persistence: `/Users/kyin/Projects/Studyin/lib/server/study-state.ts`

---

## Section 4: Quality Gates

### Goal
Achieve rubric score ≥92/100 with all ★ categories ≥2.9 via systematic gap closure.

**Current Rubric Snapshot (from `/Users/kyin/Projects/Studyin/public/analytics/rubric-score.json`):**

| Category | Current | Target | Critical | Gap |
|----------|---------|--------|----------|-----|
| Evidence fidelity ★ | 2.0 | 2.9 | YES | -0.9 |
| Item quality ★ | 2.0 | 2.9 | YES | -0.9 |
| Assessment validity ★ | 1.0 | 2.9 | YES | -1.9 |
| Learning science ★ | 2.0 | 2.9 | YES | -0.9 |
| Adaptivity transparency ★ | 1.0 | 2.9 | YES | -1.9 |
| Analytics actionability ★ | 2.0 | 2.9 | YES | -0.9 |
| Performance ★ | 1.0 | 2.9 | YES | -1.9 |
| Governance ★ | 2.0 | 2.9 | YES | -0.9 |

**Overall Score:** 48.67/100 (Target: ≥92)

### 4.1: Critical Gap Closure Plan

#### Gap 1: Evidence Fidelity (2.0 → 2.9)
**Owner:** EvidenceCurator
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:116`):**
- Figure + crop + citation + <250 ms load

**Action Items:**
1. ✅ **Crops Exist:** Use existing 11 PNG assets in `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/`
2. ⚠️ **Citation:** Add citation strings to all evidence objects
3. ⚠️ **Performance:** Measure P95 load time
   ```bash
   # Test crop load performance
   # Expected: <250 ms for all assets
   ```
4. ⚠️ **Dimensions:** Store naturalWidth/naturalHeight to prevent CLS

**Target:** All 12 items have evidence with {file, cropPath, citation, <250ms load}

#### Gap 2: Item Quality (2.0 → 2.9)
**Owner:** ItemSmith + ValidatorFixer
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:117`):**
- NFD <5%, point-biserial >0.15, rubric ≥2.7

**Action Items:**
1. **Distractor Quality:** Ensure rationale_distractors explain WHY each wrong answer is wrong
2. **Clinical Realism:** Stems should mirror USMLE/NBME vignette style
3. **Rubric Self-Score:** ItemSmith scores each item ≥2.7 before publishing
4. **Pilot Testing:** After 10 attempts per item, check NFD via analytics
   ```bash
   npm run analyze
   cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.nfd_summary'
   # Expected: All items NFD <5%
   ```

**Validation Script (per `/Users/kyin/Projects/Studyin/scripts/validate-items.mjs:145-147`):**
```bash
npm run validate:items
# Must show: "rubric_score ≥ 2.7" for all published items
```

#### Gap 3: Assessment Validity (1.0 → 2.9)
**Owner:** QA-Proctor
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:118`):**
- Blueprint enforced, KR-20/α ≥0.7, deterministic scoring

**Action Items:**
1. **Blueprint Enforcement:**
   - Update `/Users/kyin/Projects/Studyin/config/blueprint.json` with LO weights
   - Verify engine respects ±5% rails (per `/Users/kyin/Projects/Studyin/PRD.md:46-47`)
2. **Reliability Check:**
   ```bash
   # After 30+ attempts across 12 items
   npm run analyze
   cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.reliability'
   # Expected: KR-20 or Cronbach's α ≥ 0.7
   ```
3. **Deterministic Scoring:** All scoring in `/Users/kyin/Projects/Studyin/lib/study-engine` uses fixed algorithms (no runtime LLM)

#### Gap 4: Learning Science (2.0 → 2.9)
**Owner:** AdaptiveEngineer
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:119`):**
- Personal spacing + ELG/min, fatigue detection

**Action Items:**
1. **Spacing Algorithm:** FSRS retention lane operational (per `/Users/kyin/Projects/Studyin/PRD.md:43-44`)
   - Verify handoff when mastery ≥0.85
   - Test overdue boost calculation
2. **ELG/min Ranking:**
   ```bash
   npm run analyze
   cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq '.elg_per_min'
   # Expected: Sorted recommendations by expected learning gain
   ```
3. **Fatigue Detection:** Document stop rules in engine
   - SE ≤ 0.20 with ≥12 items
   - Last 5 items ΔSE < 0.02
   - Reference: `/Users/kyin/Projects/Studyin/PRD.md:38`

#### Gap 5: Adaptivity Transparency (1.0 → 2.9)
**Owner:** UIBuilder + AdaptiveEngineer
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:120`):**
- "Why this next" pill cites spacing/mastery/confusion with numbers

**Action Items:**
1. **Build UI Component:**
   ```typescript
   // In components/WhyThisNext.tsx
   // Display engine metadata from attemptEvent
   // Show: theta_hat, SE, mastery_prob, blueprint_drift, exposure_days
   ```
2. **Wire Engine Signals:**
   - Use `buildWhyThisNext` from `/Users/kyin/Projects/Studyin/lib/study-engine` (imported at line 9)
   - Display in study UI before each item
3. **Numeric Backing:**
   - "Your mastery: 68% (SE: 0.25)"
   - "Blueprint: Hand 61% (target 58%)"
   - "Last seen: 3 days ago"

**Reference:** `/Users/kyin/Projects/Studyin/PRD.md:52` (transparency requirement)

#### Gap 6: Analytics Actionability (2.0 → 2.9)
**Owner:** AnalyticsEngineer
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:121`):**
- TTM, ELG/min, confusion, speed-accuracy drive recommended drill

**Action Items:**
1. **Verify Analytics Output:**
   ```bash
   npm run analyze
   cat /Users/kyin/Projects/Studyin/public/analytics/latest.json | jq 'keys'
   # Expected: ["ttm_per_lo", "elg_per_min", "confusion_edges", "speed_accuracy", "nfd_summary", "retention_summary"]
   ```
2. **Drill Recommendations:**
   - DrillsView at `/Users/kyin/Projects/Studyin/components/DrillsView.tsx` (referenced in study/page.tsx:129)
   - Should populate from analytics confusion_edges
3. **Speed-Accuracy Buckets:**
   - Classify attempts as fast_wrong, slow_wrong, fast_right, slow_right
   - Threshold: median_seconds per item

**Validation:** Analytics contain actionable insights for ≥3 LOs

#### Gap 7: Performance (1.0 → 2.9)
**Owner:** PerformanceTuner
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:123`):**
- TTI <2s, item render <100 ms, evidence <250 ms, CLS <0.1

**Action Items:**
1. **Performance Budgets (per `/Users/kyin/Projects/Studyin/AGENTS.md:80`):**
   - TTI <2s: Test on `/`, `/study`, `/summary`, `/upload`, `/exam`
   - Item render <100 ms: Measure from item load to first paint
   - Evidence <250 ms: P95 crop load time (mobile test)
   - CLS <0.1: Store naturalWidth/naturalHeight for all images

2. **Measurement Tools:**
   ```bash
   # Use Lighthouse or Chrome DevTools
   # Record metrics in PLAN.md after each optimization
   ```

3. **Known Issues:**
   - Heavy glassmorphism effects may impact CLS
   - Mitigation: Preload critical CSS, use will-change sparingly

**Target:** All budgets met on 4G mobile connection

#### Gap 8: Governance (2.0 → 2.9)
**Owner:** ReleaseManager + DataSteward
**Rubric Criteria (per `/Users/kyin/Projects/Studyin/AGENTS.md:124`):**
- Validator gate, versioned content, immutable logs for published items

**Action Items:**
1. **Validator Gate:**
   ```bash
   # Add to CI pipeline (if using GitHub Actions)
   npm run validate:items || exit 1
   ```
2. **Content Versioning:**
   - All items have schema_version field ✅
   - created_at/updated_at timestamps
   - source_sha256 for immutability (optional but recommended)
3. **Immutable Logs:**
   - Published items (status: "published") should not be edited
   - New version = new item ID
   - Event logs in `/Users/kyin/Projects/Studyin/data/events.ndjson` are append-only

**Reference:** `/Users/kyin/Projects/Studyin/scripts/validate-items.mjs` (validator enforcement)

### 4.2: Acceptance Criteria

**Item Gate (Blocking):**
- ✅ ABCDE choices present
- ✅ Per-choice rationales (correct + distractors)
- ✅ LO mapped to `/Users/kyin/Projects/Studyin/config/los.json`
- ✅ Difficulty & Bloom set
- ✅ Evidence {file, page, cropPath OR citation}
- ✅ rubric_score ≥ 2.7 for status "published"
- ✅ Validator clean: `npm run validate:items`

**Engine Gate:**
- ✅ Blueprint rails within ±5% per LO
- ✅ Exposure caps enforced (≤1/day, ≤2/week, 96h cooldown)
- ✅ Stop rules respected (SE ≤ 0.20 OR mastery ≥ 0.85)
- ✅ Randomesque top-K selector (K=5)
- ✅ Retention budgeting ≤40% baseline (≤60% if overdue >7d)
- ✅ Engine metadata logged in attemptEvent

**Analytics Gate:**
- ✅ `latest.json` contains: ttm_per_lo, elg_per_min, confusion_edges, speed_accuracy, nfd_summary, reliability
- ✅ Generated deterministically from `/Users/kyin/Projects/Studyin/data/events.ndjson`

**Governance Gate:**
- ✅ `npm run score:rubric` shows ≥92/100
- ✅ All ★ categories ≥2.9
- ✅ PLAN.md updated post-merge

### 4.3: Performance Budgets

**Target Metrics (Relaxed per `/Users/kyin/Projects/Studyin/AGENTS.md:80`):**
- TTI: <2s (homepage, study page)
- Item Render: <100 ms (question display)
- Evidence Load: <250 ms P95 (crop images)
- CLS: <0.1 (study session, dashboard)

**Measurement Protocol:**
```bash
# 1. Lighthouse CI (if configured)
npm run lighthouse

# 2. Manual Chrome DevTools
# - Open study page
# - Performance tab → Record → Complete one item
# - Check: LCP <2s, CLS <0.1, TBT <200ms

# 3. Evidence load test
# - Network tab → Slow 4G throttle
# - Measure time from request to image display
# - Target: P95 <250ms across 10 images
```

**Ownership:** PerformanceTuner reports metrics in weekly rubric pulse

---

## Section 5: Next Steps & Prioritized Backlog

### Immediate Actions (Week 1)

**Owner:** ProjectManager coordinates; agents execute per assignments below

#### A. Critical Path: Content Bank Seeding
**Days 1-2**

1. **ItemSmith (gpt-5-codex-high):** Create 3 seed items
   - File: `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/item.*.json`
   - Template: `/Users/kyin/Projects/Studyin/config/item_ecg_stemi_01.item.json`
   - Evidence: Map to existing PNGs in `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/`

2. **ValidatorFixer (gpt-5-codex-high):** Ensure 3 items pass validation
   ```bash
   npm run validate:items
   ```

3. **EvidenceCurator (gpt-5-codex-high):** Add citations to 3 evidence objects
   - Field: `citation` (required per relaxed mode)
   - Example: "Gray's Anatomy, 42nd Ed., Fig 6.45"

4. **QA-Proctor (gpt-5-codex-high):** Update LOs and blueprint
   - `/Users/kyin/Projects/Studyin/config/los.json` → 2 LO definitions
   - `/Users/kyin/Projects/Studyin/config/blueprint.json` → weights sum to 1.0

**Milestone:** Validator shows "✓ 3 items validated"

#### B. Engine Integration
**Days 3-4**

5. **AdaptiveEngineer (gpt-5-codex-high):** Wire content bank to study engine
   - Scope: `/Users/kyin/Projects/Studyin/app/study/engine.ts`, `/Users/kyin/Projects/Studyin/lib/study-engine/`
   - Tasks:
     - Load items from `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/`
     - Call `selectNextItem` with loaded candidates
     - Wire EAP updates to learner state
     - Log engine metadata to attemptEvent

6. **UIBuilder (gpt-5-codex-high):** Update study page to render bank items
   - Scope: `/Users/kyin/Projects/Studyin/app/study/page.tsx`, `/Users/kyin/Projects/Studyin/components/`
   - Tasks:
     - Replace lesson MCQ stub with engine-selected item
     - Display ABCDE choices, rationales, evidence
     - Add "Why this next" transparency component

**Milestone:** Study session uses 3 real items from content bank

#### C. Validation & Iteration
**Days 5-7**

7. **QA-Proctor (gpt-5-codex-high):** End-to-end testing
   - Complete 10-item study session
   - Verify telemetry: `cat /Users/kyin/Projects/Studyin/data/events.ndjson | jq .`
   - Regenerate analytics: `npm run analyze`
   - Check: has_events: true, ttm_per_lo populated

8. **ItemSmith (gpt-5-codex-high):** Expand to 12 items
   - 7 hand items, 5 wrist items
   - Distribution: 4 easy, 5 medium, 3 hard
   - All pass validator with rubric ≥2.7

9. **AnalyticsEngineer (gpt-5-codex-high):** Validate analytics pipeline
   - Confirm TTM, ELG/min, confusion_edges in latest.json
   - Test reliability calculation (requires ≥30 attempts)

10. **PerformanceTuner (gpt-5-codex-high):** Initial performance audit
    - Measure: TTI, item render, evidence load, CLS
    - Document in `/Users/kyin/Projects/Studyin/PLAN.md`

**Milestone:** Rubric score ≥60/100, critical categories ≥2.0

### Strategic Initiatives (Week 2)

#### D. Quality Elevation
**Days 8-10**

11. **EvidenceCurator (gpt-5-codex-high):** Generate optimal crops
    - Convert PNG to AVIF/WebP + PNG fallback
    - Store naturalWidth/naturalHeight
    - Test P95 <250ms load

12. **ItemSmith (gpt-5-codex-high):** Rubric-driven revision
    - Self-score all 12 items against rubric
    - Revise distractors for NFD <5%
    - Upgrade to status "published"

13. **ValidatorFixer (gpt-5-codex-high):** Evidence integrity audit
    - Ensure all cropPath references resolve
    - Citations complete for all items
    - Evidence gate passes

**Milestone:** Evidence fidelity ≥2.7, Item quality ≥2.7

#### E. Engine Transparency
**Days 11-12**

14. **AdaptiveEngineer + UIBuilder (gpt-5-codex-high):** "Why this next" component
    - Display theta_hat, SE, mastery_prob
    - Show blueprint drift, exposure days
    - Wire to `buildWhyThisNext` from engine

15. **AnalyticsEngineer (gpt-5-codex-high):** Drill recommendations
    - Populate DrillsView from confusion_edges
    - Test speed-accuracy bucketing
    - Validate ELG/min rankings

**Milestone:** Adaptivity transparency ≥2.7, Analytics actionability ≥2.7

#### F. Performance Optimization
**Days 13-14**

16. **PerformanceTuner (gpt-5-codex-high):** Budget compliance
    - Optimize heavy glassmorphism effects
    - Preload critical assets
    - Test on 4G mobile

17. **UIBuilder (gpt-5-codex-high):** CLS prevention
    - Add naturalWidth/naturalHeight to all images
    - Reserve space for evidence crops
    - Test: CLS <0.1 on study page

**Milestone:** Performance ≥2.7

### Final Push (Week 3)

#### G. Governance & Release
**Days 15-17**

18. **DataSteward (gpt-5-codex-high):** Immutability enforcement
    - Published items locked (source_sha256)
    - Event logs append-only
    - Git LFS for evidence assets

19. **ReleaseManager (gpt-5-codex-high):** CI pipeline
    - Add validator gate: `npm run validate:items || exit 1`
    - Add test gate: `npm test || exit 1`
    - Add analytics gate: `npm run analyze`

20. **DocScribe (gpt-5-high):** Documentation update
    - README: Study workflow, content authoring
    - AGENTS.md: Role assignments current
    - PLAN.md: Milestones reflect Week 1-3 progress

**Milestone:** Governance ≥2.9

#### H. Final Rubric Check
**Days 18-19**

21. **ProjectManager (gpt-5-high):** Comprehensive testing
    - Run full 30-item study session
    - Verify all acceptance gates
    - Generate final rubric score:
      ```bash
      npm run score:rubric
      cat /Users/kyin/Projects/Studyin/public/analytics/rubric-score.json
      ```

22. **All Agents:** Gap closure iteration
    - Address any category <2.9
    - Prioritize critical categories
    - Document mitigations

**Milestone:** Rubric score ≥92/100, all ★ categories ≥2.9

#### I. MVP Launch
**Day 20**

23. **ReleaseManager (gpt-5-codex-high):** Deployment prep
    - Merge feature branch to main
    - Tag release: `v0.2.0-mvp`
    - Deploy to staging

24. **ProjectManager (gpt-5-high):** Success validation
    - User acceptance testing (5 sessions)
    - Performance validation (production)
    - Rubric score attached to release notes

**Milestone:** Functional MVP in production

---

## Appendix: File Path Reference

### Critical Paths

**Content:**
- Items: `/Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/*.json`
- Lessons: `/Users/kyin/Projects/Studyin/content/lessons/wrist-hand/*.lesson.json`
- Evidence: `/Users/kyin/Projects/Studyin/content/evidence/upper-limb-oms1/**/*.png`

**Configuration:**
- Blueprint: `/Users/kyin/Projects/Studyin/config/blueprint.json`
- LOs: `/Users/kyin/Projects/Studyin/config/los.json`
- Rubric: `/Users/kyin/Projects/Studyin/config/rubric.json`

**Engine & State:**
- Engine core: `/Users/kyin/Projects/Studyin/app/study/engine.ts`
- Study engine lib: `/Users/kyin/Projects/Studyin/lib/study-engine/`
- Learner state: `/Users/kyin/Projects/Studyin/lib/server/study-state.ts`

**Data & Analytics:**
- Events: `/Users/kyin/Projects/Studyin/data/events.ndjson`
- Analytics: `/Users/kyin/Projects/Studyin/public/analytics/latest.json`
- Rubric score: `/Users/kyin/Projects/Studyin/public/analytics/rubric-score.json`
- Queue: `/Users/kyin/Projects/Studyin/data/queue/jobs.json`

**Scripts:**
- Validator: `/Users/kyin/Projects/Studyin/scripts/validate-items.mjs`
- Analyzer: `/Users/kyin/Projects/Studyin/scripts/analyze.mjs`
- Worker: `/Users/kyin/Projects/Studyin/scripts/worker.ts`
- Rubric scorer: `/Users/kyin/Projects/Studyin/scripts/score-rubric.mjs`

**UI Components:**
- Study page: `/Users/kyin/Projects/Studyin/app/study/page.tsx`
- Upload page: `/Users/kyin/Projects/Studyin/app/upload/page.tsx`
- Lesson viewer: `/Users/kyin/Projects/Studyin/components/InteractiveLessonViewer.tsx`
- Drills view: `/Users/kyin/Projects/Studyin/components/DrillsView.tsx`

**Schemas:**
- Core schemas: `/Users/kyin/Projects/Studyin/lib/core/schemas.ts`
- Script schemas: `/Users/kyin/Projects/Studyin/scripts/lib/schema.mjs`

**Documentation:**
- Agents guide: `/Users/kyin/Projects/Studyin/AGENTS.md`
- PRD: `/Users/kyin/Projects/Studyin/PRD.md`
- Plan: `/Users/kyin/Projects/Studyin/PLAN.md`
- README: `/Users/kyin/Projects/Studyin/README.md`

---

## Commands Quick Reference

```bash
# Development
npm run dev:start              # Start dev server (http://localhost:3005)
npx tsx scripts/worker.ts      # Start upload worker

# Validation & Testing
npm run validate:items         # Validate content bank items
npm test                       # Run Vitest unit tests (50 tests)
npm run test:e2e              # Run Playwright E2E tests (9 tests)

# Analytics & Scoring
npm run analyze               # Generate analytics (→ public/analytics/latest.json)
npm run score:rubric          # Score against rubric (→ public/analytics/rubric-score.json)

# Monitoring
cat data/events.ndjson | tail -10 | jq .                    # Recent telemetry
cat data/queue/jobs.json | jq '.[] | {id, status}'          # Queue status
cat public/analytics/latest.json | jq '.has_events'         # Analytics health
cat public/analytics/rubric-score.json | jq '.overall_score' # Rubric score
```

---

## Success Metrics

**30-Minute Checkpoint (TODAY):**
- ✅ 3 items in content bank
- ✅ Validator clean
- ✅ Study page loads without errors
- ✅ One telemetry event written

**Week 1 Checkpoint:**
- ✅ 12 items across 2 LOs
- ✅ Blueprint feasible
- ✅ Engine selects from bank
- ✅ Analytics populate
- ✅ Rubric ≥60/100

**Week 2 Checkpoint:**
- ✅ Evidence fidelity ≥2.7
- ✅ Item quality ≥2.7
- ✅ Adaptivity transparency ≥2.7
- ✅ Performance budgets met
- ✅ Rubric ≥80/100

**Week 3 (MVP Launch):**
- ✅ All ★ categories ≥2.9
- ✅ Rubric ≥92/100
- ✅ 30-item study session functional
- ✅ Acceptance gates pass
- ✅ Production deployment ready

---

## Risks & Mitigations

| Risk | Severity | Mitigation | Owner |
|------|----------|------------|-------|
| Empty content bank blocks study | CRITICAL | Seed 3 items TODAY (Section 1.1) | ItemSmith |
| Upload worker fails (3+ failures in queue) | HIGH | ValidatorFixer reviews worker output; fallback to manual lesson creation | DataSteward |
| Evidence load >250ms on mobile | MEDIUM | AVIF/WebP conversion; lazy loading | EvidenceCurator |
| Rubric <92 at Week 3 | HIGH | Prioritize critical categories; weekly pulse checks | ProjectManager |
| Engine integration delays | MEDIUM | Use lesson MCQs as fallback; phased rollout | AdaptiveEngineer |
| Performance budgets missed | MEDIUM | Glassmorphism effects tunable; progressive enhancement | PerformanceTuner |
| Blueprint infeasibility (409 deficits) | LOW | Adjust weights dynamically; ensure ≥3 items per LO | QA-Proctor |

---

## Agent Assignments Summary

| Agent | Model | Primary Scope | Week 1 Tasks |
|-------|-------|---------------|--------------|
| ItemSmith | gpt-5-codex-high | Content authoring | Create 12 items, rubric ≥2.7 |
| EvidenceCurator | gpt-5-codex-high | Evidence assets | Add citations, test <250ms load |
| ValidatorFixer | gpt-5-codex-high | Validation errors | Fix validator issues, ensure gates pass |
| AdaptiveEngineer | gpt-5-codex-high | Study engine | Wire bank items, EAP updates, telemetry |
| UIBuilder | gpt-5-codex-high | Study UI | Render bank items, transparency component |
| AnalyticsEngineer | gpt-5-codex-high | Analytics pipeline | Validate TTM/ELG/confusion output |
| QA-Proctor | gpt-5-codex-high | Testing & gates | Blueprint feasibility, E2E testing |
| PerformanceTuner | gpt-5-codex-high | Performance | Measure budgets, optimize CLS |
| DataSteward | gpt-5-codex-high | Telemetry & state | Event integrity, worker monitoring |
| ReleaseManager | gpt-5-codex-high | CI/CD | Validator gate, test automation |
| DocScribe | gpt-5-high | Documentation | Update README, PLAN.md |
| ProjectManager | gpt-5-high | Coordination | Weekly pulse, rubric tracking, risk mgmt |

---

## Next Agent Recommendations

**Immediate (TODAY):**
```
Next agent: ItemSmith · Model: gpt-5-codex-high · Scope: /Users/kyin/Projects/Studyin/content/banks/upper-limb-oms1/
```

**Week 1 Day 3:**
```
Next agent: AdaptiveEngineer · Model: gpt-5-codex-high · Scope: /Users/kyin/Projects/Studyin/app/study/engine.ts, /Users/kyin/Projects/Studyin/lib/study-engine/
```

**Week 2 Day 11:**
```
Next agent: UIBuilder · Model: gpt-5-codex-high · Scope: /Users/kyin/Projects/Studyin/components/, /Users/kyin/Projects/Studyin/app/study/page.tsx
```

**Week 3 Day 18:**
```
Next agent: ProjectManager · Model: gpt-5-high · Scope: Comprehensive rubric review and gap closure
```

---

## Conclusion

This MVP Success Plan provides a **clear path from empty content bank to functional study application** in 3 weeks. The plan is:

1. **Actionable:** Every step has specific file paths, commands, and success criteria
2. **Staged:** Stage 1 process (no formal PRD/IMPLEMENTATION.md overhead)
3. **Deterministic:** All algorithms use fixed logic, no runtime LLM calls
4. **Rubric-Driven:** 48.67 → 92+ score via systematic gap closure
5. **Role-Aligned:** Agent assignments follow `/Users/kyin/Projects/Studyin/AGENTS.md:128` (gpt-5-codex-high for repo work)

**User can execute TODAY:** Section 1 provides a 30-minute path to first study session. The remaining sections build toward production-ready MVP with all quality gates satisfied.

**File Path:** Save this document as `/Users/kyin/Projects/Studyin/MVP_SUCCESS_PLAN.md` and execute Section 1.1 immediately.
