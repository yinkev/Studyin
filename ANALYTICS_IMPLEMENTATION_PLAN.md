# World-Class Analytics Implementation Plan

## 🎯 7 Analytics Designed by Expert Agents

Based on data scientist, backend architect, and frontend developer analysis, here are the 7 world-class analytics to implement:

### 1. **Knowledge Retention Curve** (PRIORITY 1)
**Complexity:** Medium | **Value:** Critical for medical education

**What it shows:**
- Forgetting curves per topic using Ebbinghaus principles
- Predicted retention probability over time
- Topics at risk of being forgotten
- Optimal review schedule recommendations

**Database Requirements:**
```sql
CREATE TABLE topic_reviews (
    user_id UUID,
    topic_name TEXT,
    review_timestamp TIMESTAMPTZ,
    confidence_level INTEGER CHECK (1-5),
    review_number INTEGER,
    days_since_last_review INTEGER
);
```

**Chart Type:** Multi-line ECharts with confidence intervals
**API:** `GET /api/analytics/learning/retention-curve`

---

### 2. **Cognitive Load Heatmap** (PRIORITY 2)
**Complexity:** Medium | **Value:** Identifies struggle zones

**What it shows:**
- 2D heatmap: Body systems × Difficulty level
- Cell color = Performance (red = struggling, green = mastered)
- Cell size = Time invested
- Efficiency scores (performance/time)

**Database Requirements:**
```sql
ALTER TABLE material_chunks
    ADD COLUMN estimated_difficulty INTEGER CHECK (1-10);

-- Track in daily_activity_summary
ADD COLUMN topics_reviewed JSONB;
```

**Chart Type:** ECharts heatmap with custom tooltips
**API:** `GET /api/analytics/learning/cognitive-load-map`

---

### 3. **Question Type Mastery Radar** (PRIORITY 3)
**Complexity:** Easy | **Value:** Quick wins, visual impact

**What it shows:**
- Spider chart with 8-10 axes (Diagnosis, Mechanism, Management, etc.)
- Current mastery vs target benchmark (75% for exam readiness)
- Historical progress overlay
- NBME question type breakdown

**Database Requirements:**
```sql
CREATE TABLE question_attempts (
    user_id UUID,
    question_type TEXT,  -- 'diagnosis', 'mechanism', 'management'
    cognitive_level TEXT,  -- Bloom's taxonomy
    correct BOOLEAN,
    time_spent_seconds INTEGER,
    confidence_before INTEGER
);
```

**Chart Type:** ECharts radar chart
**API:** `GET /api/analytics/learning/question-mastery-radar`

---

### 4. **Study Consistency Score** (PRIORITY 4)
**Complexity:** Medium | **Value:** Habit formation gamification

**What it shows:**
- Consistency score (0-100) based on:
  - Regularity (30%)
  - Timing consistency (25%)
  - Optimal session length (20%)
  - Weekly distribution (15%)
  - Completion rate (10%)
- Personal optimal study times detected via ML
- Session distribution by time of day

**Database Requirements:**
```sql
ALTER TABLE daily_activity_summary
    ADD COLUMN consistency_score INTEGER,
    ADD COLUMN study_time_of_day TEXT,
    ADD COLUMN session_regularity_score FLOAT;

CREATE TABLE user_study_patterns (
    user_id UUID PRIMARY KEY,
    optimal_time_of_day TEXT,
    optimal_session_length_minutes INTEGER,
    consistency_streak_current INTEGER
);
```

**Chart Type:** Stacked bar + line combo chart
**API:** `GET /api/analytics/learning/consistency-score`

---

### 5. **Pre-Exam Readiness Dashboard** (PRIORITY 5)
**Complexity:** Hard | **Value:** Predictive analytics, exam confidence

**What it shows:**
- Overall readiness gauge (0-100%)
- Predicted exam score range with confidence intervals
- Topic-by-topic readiness bars
- Days to readiness at current pace
- Priority study list with time estimates

**Database Requirements:**
```sql
CREATE TABLE exam_readiness_snapshots (
    user_id UUID,
    overall_readiness_score INTEGER,
    predicted_score_range JSONB,  -- {min, max, confidence}
    topic_scores JSONB,
    weak_areas JSONB,
    study_hours_needed INTEGER
);
```

**Chart Type:** Multi-panel dashboard (gauge + bars + line + funnel)
**API:** `GET /api/analytics/learning/exam-readiness`

---

### 6. **Active Recall Efficiency Meter** (PRIORITY 6)
**Complexity:** Medium | **Value:** Study method optimization

**What it shows:**
- Grouped bar chart comparing study methods:
  - Active recall
  - Passive review
  - AI chat
  - Practice questions
- Metrics per method:
  - Time invested
  - Immediate recall rate
  - 48h retention rate
  - Efficiency score (retention/time)

**Database Requirements:**
```sql
CREATE TABLE study_method_sessions (
    user_id UUID,
    study_method TEXT,  -- 'active_recall', 'passive_review', 'ai_chat'
    duration_seconds INTEGER,
    items_recalled_correctly INTEGER,
    subsequent_test_score FLOAT  -- 24-48h later
);
```

**Chart Type:** Grouped bar chart
**API:** `GET /api/analytics/learning/study-method-efficiency`

---

### 7. **Peak Performance Window Analyzer** (PRIORITY 7)
**Complexity:** Easy | **Value:** Personalized scheduling

**What it shows:**
- Calendar heatmap (GitHub-style):
  - Rows: Hours of day (6 AM - 11 PM)
  - Columns: Days of week
  - Color: Performance score
- Line overlay: Energy curve throughout day
- Peak windows identified with recommendations

**Database Requirements:**
```sql
CREATE TABLE performance_context (
    user_id UUID,
    session_start TIMESTAMPTZ,
    day_of_week INTEGER,
    hour_of_day INTEGER,
    performance_score FLOAT,
    self_reported_energy INTEGER CHECK (1-5),
    time_since_last_break_minutes INTEGER
);
```

**Chart Type:** Calendar heatmap + line chart
**API:** `GET /api/analytics/learning/performance-windows`

---

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Database schema + basic tracking

- [ ] Create Alembic migration for all new tables
- [ ] Add tracking service: `/backend/app/services/analytics_tracker.py`
- [ ] Implement event logging in existing endpoints
- [ ] Create base API structure: `/backend/app/api/endpoints/analytics_advanced.py`

**Priority Analytics:**
1. Question Type Mastery Radar (Easy)
2. Peak Performance Window (Easy)

---

### Phase 2: Medium Complexity (Week 2)
**Goal:** Actionable insights

- [ ] Implement retention curve calculations
- [ ] Build cognitive load heatmap
- [ ] Add study consistency scoring
- [ ] Create frontend components for Phase 1 + 2 analytics

**Priority Analytics:**
3. Knowledge Retention Curve
4. Cognitive Load Heatmap
5. Study Consistency Score

---

### Phase 3: Advanced (Week 3)
**Goal:** Predictive analytics

- [ ] Build exam readiness prediction model
- [ ] Implement study method efficiency tracking
- [ ] Add ML-based pattern detection
- [ ] Polish all frontend visualizations

**Priority Analytics:**
6. Active Recall Efficiency Meter
7. Pre-Exam Readiness Dashboard

---

## 🎨 Frontend Component Structure

### New Components to Create:

```
/frontend/src/components/analytics/advanced/
├── RetentionCurveChart.tsx
├── CognitiveLoadHeatmap.tsx
├── QuestionMasteryRadar.tsx
├── ConsistencyScoreChart.tsx
├── ExamReadinessDashboard.tsx
├── StudyEfficiencyChart.tsx
└── PerformanceWindowHeatmap.tsx
```

### Enhanced Analytics View:

```
/frontend/src/pages/EnhancedAnalyticsView.tsx
```

---

## 🔧 Backend Structure

### New Files:

```
/backend/app/
├── models/
│   ├── analytics_events.py       # Event tables
│   ├── topics.py                 # Topic taxonomy
│   └── analytics_aggregates.py   # Pre-computed metrics
│
├── services/
│   └── analytics_tracker.py      # Centralized event tracking
│
├── api/endpoints/
│   └── analytics_advanced.py     # 7 new endpoints
│
└── alembic/versions/
    └── 004_advanced_analytics.py # Schema migration
```

---

## 📊 Key Algorithms

### Retention Curve (Exponential Decay)
```python
R(t) = R₀ * e^(-t/S)
where:
  R(t) = retention at time t
  R₀ = initial retention (from last review confidence)
  t = days since last review
  S = stability factor (increases with each review)
```

### Consistency Score
```python
score = (
    regularity_score * 0.30 +      # Frequency variance
    timing_consistency * 0.25 +     # Same time of day
    session_length_match * 0.20 +   # Optimal duration
    weekly_distribution * 0.15 +    # Spread across week
    completion_rate * 0.10          # Finishing sessions
)
```

### Exam Readiness
```python
readiness = (
    topic_mastery * 0.40 +          # Coverage & scores
    question_accuracy * 0.25 +      # Practice performance
    retention_health * 0.20 +       # Forgetting curve status
    study_consistency * 0.10 +      # Habit strength
    review_coverage * 0.05          # Material completion
)
```

---

## ✅ Success Metrics

### Performance Targets:
- Dashboard load: < 2s (all 7 analytics)
- Individual chart: < 500ms
- Real-time updates: < 100ms (optimistic UI)
- Batch jobs: Complete in 2-5 AM window

### User Experience:
- Zero placeholder data (all charts functional)
- Actionable recommendations on every view
- Motion animations for data entry
- Mobile-responsive (all charts)

---

## 🚀 Next Steps

1. **Review this plan** - Confirm priorities and scope
2. **Run database migration** - Set up schema
3. **Implement Phase 1** - Quick wins (radar + performance window)
4. **Build frontend components** - ECharts integration with Motion
5. **Add event tracking** - Instrument existing endpoints
6. **Test and iterate** - Real data validation

---

**All analytics are designed to be:**
- ✅ Immediately implementable (no placeholders)
- ✅ Based on learning science (evidence-based)
- ✅ Visually excellent (ECharts + Motion)
- ✅ Actionable (clear next steps)
- ✅ Medical education-specific (NBME/USMLE focused)

Ready to implement! 🎯
