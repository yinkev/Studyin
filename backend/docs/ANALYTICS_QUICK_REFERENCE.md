# Analytics Schema - Quick Reference

**One-page reference for developers implementing analytics**

---

## 📊 Core Tables & Their Purpose

| Table | Purpose | Updated | Query Time |
|-------|---------|---------|------------|
| `study_events` | Immutable event log | Real-time (append) | Slow (scan) |
| `question_attempts` | Question performance | Real-time (on answer) | Fast (indexed) |
| `material_interactions` | Reading behavior | Real-time (periodic) | Fast (indexed) |
| `study_sessions` | Session aggregates | Real-time (during session) | Fast (PK lookup) |
| `topics` | Medical curriculum | Rarely | Fast (PK lookup) |
| `topic_mastery` | User mastery scores | Async + nightly batch | Fast (indexed) |
| `daily_user_stats` | Daily metrics | Nightly batch | Very fast (PK) |
| `user_learning_metrics` | Rolling metrics | Nightly batch | Very fast (PK) |
| `knowledge_gaps` | AI recommendations | Daily batch | Fast (indexed) |

---

## 🎯 Common Queries & Which Table to Use

| Query | Use This Table | Expected Time |
|-------|---------------|---------------|
| User dashboard (30-day overview) | `user_learning_metrics` | < 10ms |
| Activity heatmap (last 90 days) | `daily_user_stats` | < 50ms |
| Recent study sessions (last 30 days) | `study_sessions` | < 50ms |
| Topic mastery progress | `topic_mastery` JOIN `topics` | < 100ms |
| Knowledge gaps (recommendations) | `knowledge_gaps` JOIN `topics` | < 50ms |
| Topic performance over time | `topic_daily_stats` | < 50ms |
| Question history (spaced repetition) | `question_attempts` | < 20ms |
| First attempt accuracy | `question_attempts` (filtered) | < 100ms |
| Material reading progress | `material_interactions` | < 50ms |

---

## 🔧 Event Tracking - Quick Patterns

### Pattern 1: Track Event Only
```python
from app.services.analytics_tracker import tracker

await tracker.track_event(
    db=db,
    user_id=user.id,
    session_id=session_id,
    event_type="material_open",
    material_id=material_id,
    properties={"material_type": "pdf"}
)
```

### Pattern 2: Track Event + Create Record
```python
event, attempt = await tracker.track_question_attempt(
    db=db,
    user_id=user.id,
    session_id=session_id,
    question_id=question_id,
    topic_id=topic_id,
    selected_answer="A",
    correct_answer="B",
    time_to_answer_seconds=45
)
# Creates: StudyEvent + QuestionAttempt + updates StudySession
```

### Pattern 3: Track Session Lifecycle
```python
# Start
event, session = await tracker.track_session_start(
    db=db,
    user_id=user.id,
    session_id=new_session_id,
    device_type="web"
)

# During session - update metrics
session.materials_viewed += 1
session.questions_attempted += 1

# End
event, session = await tracker.track_session_end(
    db=db,
    user_id=user.id,
    session_id=session_id
)
```

---

## 📈 Key Algorithms

### Mastery Score Calculation
```python
mastery_score = (
    0.30 * first_attempt_accuracy +  # Fresh knowledge
    0.20 * overall_accuracy +         # Reinforced knowledge
    0.30 * retrieval_strength +       # Memory retention (forgetting curve)
    0.20 * material_completion        # Content coverage
)
# Range: 0.0 (not learned) to 1.0 (mastered)
```

### Knowledge Gap Priority
```python
priority_score = (
    gap_score * 3.0 +                    # How big is the gap (1 - mastery)
    topic.board_exam_weight * 2.0 +      # Exam importance (0-10)
    prerequisite_impact * 1.0 +          # Blocks N other topics
    recent_failure_rate * 1.5            # Recent performance trend
)
# Higher score = more urgent to address
```

### Spaced Repetition (SM-2)
```python
if quality < 3:  # Forgot
    next_interval = 1 day
else:
    if interval == 0:
        next_interval = 1 day
    elif interval == 1:
        next_interval = 6 days
    else:
        easiness = 1.3 + (quality - 3) * 0.2
        next_interval = int(interval * easiness)
```

---

## 🔍 Most Important Indexes

### User Queries (Most Frequent)
```sql
-- User dashboard queries
ix_daily_user_stats_user_date (user_id, stat_date)
ix_user_learning_metrics (user_id) -- Primary Key

-- Topic mastery
ix_topic_mastery_user_topic (user_id, topic_id) -- Unique
ix_topic_mastery_user_mastery (user_id, mastery_score)
```

### Time-Range Queries
```sql
ix_study_events_user_created (user_id, created_at)
ix_question_attempts_user_created (user_id, attempted_at)
ix_study_sessions_user_started (user_id, started_at)
```

### Analytics Queries
```sql
ix_knowledge_gaps_user_priority (user_id, priority_score)
ix_question_attempts_topic_user (topic_id, user_id)
ix_material_interactions_material_user (material_id, user_id)
```

---

## ⚡ Performance Tips

### DO ✅
- Use pre-aggregated tables (`daily_user_stats`, `user_learning_metrics`)
- Add LIMIT to queries (especially on `study_events`)
- Cache dashboard data in Redis (5min TTL)
- Run heavy analytics in batch jobs (2am-5am)
- Use composite indexes for WHERE + ORDER BY

### DON'T ❌
- Scan `study_events` for recent data (use `study_sessions`)
- Update event tables (immutable - append only)
- Query without indexes (check EXPLAIN ANALYZE)
- Join >3 tables in dashboard queries
- Run ML inference in request path (precompute)

---

## 📊 Data Flow Diagram

```
User Action (e.g., answer question)
    ↓
FastAPI Endpoint
    ↓
analytics_tracker.track_question_attempt()
    ↓
┌────────────────┬─────────────────┬────────────────┐
│                │                 │                │
study_events     question_attempts study_sessions
(immutable)      (create)          (update metrics)
│                │                 │
└────────────────┴─────────────────┴────────────────┘
                       ↓
                  Async Task
                       ↓
              update_topic_mastery()
                       ↓
                topic_mastery
              (recalculate score)
                       ↓
              Nightly Batch Job
                       ↓
    ┌──────────────────┼──────────────────┐
    ↓                  ↓                  ↓
daily_user_stats  knowledge_gaps  user_learning_metrics
(aggregate)       (detect gaps)   (rolling windows)
```

---

## 🚀 Quick Implementation Checklist

### Step 1: Run Migration
```bash
cd /Users/kyin/Projects/Studyin/backend
alembic upgrade head
```

### Step 2: Add Tracking to Endpoints
```python
# In your endpoint
from app.services.analytics_tracker import tracker

@app.post("/api/questions/{question_id}/submit")
async def submit_answer(
    question_id: UUID,
    answer: str,
    db: AsyncSession = Depends(get_db),
):
    # Your existing logic...

    # Add tracking
    await tracker.track_question_attempt(
        db=db,
        user_id=current_user.id,
        session_id=current_session_id,
        question_id=question_id,
        topic_id=question.topic_id,
        selected_answer=answer,
        correct_answer=question.correct_answer,
        time_to_answer_seconds=time_spent,
    )

    return {"is_correct": is_correct}
```

### Step 3: Build Dashboard Query
```python
@app.get("/api/analytics/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fast query - single row lookup
    metrics = await db.execute(
        select(UserLearningMetrics)
        .where(UserLearningMetrics.user_id == current_user.id)
    )
    user_metrics = metrics.scalar_one_or_none()

    # Fast query - 90 rows
    daily = await db.execute(
        select(DailyUserStats)
        .where(DailyUserStats.user_id == current_user.id)
        .where(DailyUserStats.stat_date >= date.today() - timedelta(days=90))
        .order_by(DailyUserStats.stat_date)
    )
    daily_stats = daily.scalars().all()

    return {
        "overview": user_metrics,
        "daily": daily_stats,
    }
```

### Step 4: Add Batch Job
```python
# In background job (Celery/APScheduler)
@celery.task
async def aggregate_daily_stats():
    """Run at 00:05 UTC to aggregate previous day."""
    yesterday = date.today() - timedelta(days=1)

    # Get all users with activity
    users = await get_active_users(yesterday)

    for user_id in users:
        await create_or_update_daily_stats(user_id, yesterday)
```

---

## 🔒 Privacy & Security

### DO ✅
- Anonymize IP addresses (last octet removed)
- Store only user_id (no PII)
- Hash session IDs
- Encrypt database at rest
- Audit who accesses analytics

### DON'T ❌
- Store email, name, DOB in events
- Log full user agents in production
- Share raw event data
- Keep events >2 years
- Allow unauthenticated analytics access

---

## 📚 File Locations

| File | Path |
|------|------|
| Event Models | `/backend/app/models/analytics_events.py` |
| Topic Models | `/backend/app/models/topics.py` |
| Aggregate Models | `/backend/app/models/analytics_aggregates.py` |
| Migration | `/backend/alembic/versions/003_analytics_schema.py` |
| Tracker Service | `/backend/app/services/analytics_tracker.py` |
| Event Tracking Guide | `/backend/docs/ANALYTICS_EVENT_TRACKING.md` |
| Query Optimization | `/backend/docs/ANALYTICS_QUERY_OPTIMIZATION.md` |
| Architecture | `/backend/docs/ANALYTICS_ARCHITECTURE.md` |

---

## 💡 Pro Tips

1. **Cache Aggressively**: Dashboard queries should hit Redis first
2. **Batch Events**: Send material read events in 30s batches (not every second)
3. **Index Selectivity**: Most selective column first in composite index
4. **Partition Early**: Set up monthly partitions on `study_events` before hitting 10M rows
5. **Monitor Slow Queries**: Log queries >1s, alert on queries >5s
6. **Test at Scale**: Generate 1M+ events for realistic performance testing
7. **Version Calculations**: Add `calculation_version` to support algorithm changes
8. **Async Everything**: Heavy analytics should never block user requests

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Dashboard slow (>1s) | Use pre-aggregated tables, add Redis cache |
| Event table too large | Enable monthly partitioning, archive old data |
| Batch jobs timeout | Process in smaller batches (1000 users at a time) |
| Mastery score doesn't update | Check async task is running, verify topic_id |
| Missing events | Check session_id is valid, verify FK constraints |
| Slow dashboard query | Check EXPLAIN ANALYZE, add missing index |

---

**🚀 You're ready to implement world-class analytics!**

Next: Run migration → Add tracking → Build dashboard → Ship it!
