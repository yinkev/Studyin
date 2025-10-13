# Analytics Query Optimization Strategy

**Last Updated**: 2025-10-13

This document details query patterns, indexing strategies, and performance optimizations for world-class analytics at scale.

---

## Overview

### Query Categories
1. **Dashboard Queries** - Fast, real-time user-facing (< 200ms)
2. **Analytics Queries** - Complex aggregations (< 2s)
3. **Batch Queries** - Nightly jobs, heavy computation (< 5min)
4. **ML Feature Queries** - Training data extraction (< 10min)

### Performance Targets
- **Dashboard**: 95th percentile < 200ms
- **Analytics**: 95th percentile < 2s
- **Batch**: Complete within job window (2am-5am)
- **ML**: Able to handle millions of rows

---

## Indexing Strategy

### Primary Indexes (Already Created in Migration)

#### study_events (Event Log)
```sql
-- User-centric queries (most common)
CREATE INDEX ix_study_events_user_created ON study_events (user_id, created_at);
CREATE INDEX ix_study_events_user_event_type ON study_events (user_id, event_type);
CREATE INDEX ix_study_events_user_session_created ON study_events (user_id, session_id, created_at);

-- Time-range queries
CREATE INDEX ix_study_events_created_user ON study_events (created_at, user_id);
CREATE INDEX ix_study_events_event_created ON study_events (event_type, created_at);

-- Material/topic analysis
CREATE INDEX ix_study_events_material_created ON study_events (material_id, created_at);
CREATE INDEX ix_study_events_topic_created ON study_events (topic_id, created_at);
```

**Why These Indexes?**
- User queries are most common (dashboard, personal analytics)
- Time-range filtering is always present
- Multi-column indexes match WHERE + ORDER BY clauses
- Covering indexes reduce table lookups

#### question_attempts (Critical for Mastery)
```sql
-- User performance queries
CREATE INDEX ix_question_attempts_user_created ON question_attempts (user_id, attempted_at);
CREATE INDEX ix_question_attempts_user_correct ON question_attempts (user_id, is_correct, attempted_at);

-- Question analysis
CREATE INDEX ix_question_attempts_question_user ON question_attempts (question_id, user_id);

-- Topic mastery calculation
CREATE INDEX ix_question_attempts_topic_user ON question_attempts (topic_id, user_id);

-- First attempt analysis (most important for mastery)
CREATE INDEX ix_question_attempts_is_first_attempt ON question_attempts (is_first_attempt);
```

#### topic_mastery (Fast Mastery Lookups)
```sql
-- User's topic progress
CREATE UNIQUE INDEX ix_topic_mastery_user_topic ON topic_mastery (user_id, topic_id);
CREATE INDEX ix_topic_mastery_user_mastery ON topic_mastery (user_id, mastery_score);

-- Topic leaderboards
CREATE INDEX ix_topic_mastery_topic_mastery ON topic_mastery (topic_id, mastery_score);

-- Spaced repetition
CREATE INDEX ix_topic_mastery_user_next_review ON topic_mastery (user_id, next_review_at);
```

#### Aggregate Tables (Fast Dashboard Queries)
```sql
-- daily_user_stats
CREATE UNIQUE INDEX ix_daily_user_stats_user_date ON daily_user_stats (user_id, stat_date);
CREATE INDEX ix_daily_user_stats_date ON daily_user_stats (stat_date);

-- weekly_user_stats
CREATE UNIQUE INDEX ix_weekly_user_stats_user_year_week ON weekly_user_stats (user_id, year, week);

-- knowledge_gaps
CREATE INDEX ix_knowledge_gaps_user_priority ON knowledge_gaps (user_id, priority_score);
CREATE INDEX ix_knowledge_gaps_user_resolved ON knowledge_gaps (user_id, is_resolved);
```

---

## Common Query Patterns

### 1. User Dashboard (Most Frequent)

#### 30-Day Overview
**Use**: `user_learning_metrics` (single row lookup)

```python
# Fast - Single query, indexed
query = """
SELECT
    study_minutes_30d,
    sessions_30d,
    active_days_30d,
    accuracy_30d,
    xp_earned_30d,
    topics_studied_30d,
    current_streak_days,
    avg_mastery_score,
    topics_mastered,
    topics_weak
FROM user_learning_metrics
WHERE user_id = :user_id
"""

# Expected: < 10ms (indexed PK lookup)
```

#### Activity Heatmap (Last 90 Days)
**Use**: `daily_user_stats` (pre-aggregated)

```python
# Fast - Range query on indexed column
query = """
SELECT
    stat_date,
    total_study_minutes,
    questions_attempted,
    accuracy_rate,
    xp_earned,
    goal_achieved
FROM daily_user_stats
WHERE user_id = :user_id
  AND stat_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY stat_date ASC
"""

# Expected: < 50ms (90 rows, indexed)
# Could add LIMIT for pagination if needed
```

#### Recent Study Sessions
**Use**: `study_sessions` (indexed time range)

```python
# Fast - Recent sessions with limit
query = """
SELECT
    started_at,
    ended_at,
    duration_seconds,
    active_seconds,
    materials_viewed,
    questions_attempted,
    questions_correct,
    xp_earned
FROM study_sessions
WHERE user_id = :user_id
  AND is_active = false
  AND started_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY started_at DESC
LIMIT 20
"""

# Expected: < 50ms (indexed + LIMIT)
```

#### Topic Mastery Progress
**Use**: `topic_mastery` JOIN `topics`

```python
# Moderate - JOIN with small result set
query = """
SELECT
    t.name as topic_name,
    t.level as topic_level,
    t.board_exam_weight,
    tm.mastery_score,
    tm.questions_attempted,
    tm.accuracy_rate,
    tm.last_studied_at,
    tm.next_review_at
FROM topic_mastery tm
JOIN topics t ON tm.topic_id = t.id
WHERE tm.user_id = :user_id
  AND tm.mastery_score > 0  -- Only topics user has studied
ORDER BY tm.mastery_score ASC  -- Weakest first
LIMIT 10
"""

# Expected: < 100ms (indexed JOIN, small result set)
```

#### Knowledge Gaps (Personalized Recommendations)
**Use**: `knowledge_gaps` (pre-computed)

```python
# Fast - Direct lookup with ORDER BY on indexed column
query = """
SELECT
    kg.topic_id,
    t.name as topic_name,
    kg.severity,
    kg.gap_score,
    kg.priority_score,
    kg.accuracy_rate,
    kg.estimated_study_hours,
    kg.recommended_materials
FROM knowledge_gaps kg
JOIN topics t ON kg.topic_id = t.id
WHERE kg.user_id = :user_id
  AND kg.is_resolved = false
ORDER BY kg.priority_score DESC
LIMIT 5
"""

# Expected: < 50ms (indexed priority_score)
```

---

### 2. Topic Analytics

#### Topic Performance Over Time
**Use**: `topic_daily_stats` (time series)

```python
# Fast - Range query on composite index
query = """
SELECT
    stat_date,
    study_minutes,
    questions_attempted,
    accuracy_rate,
    mastery_at_end
FROM topic_daily_stats
WHERE user_id = :user_id
  AND topic_id = :topic_id
  AND stat_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY stat_date ASC
"""

# Expected: < 50ms (composite index covers query)
```

#### Compare Multiple Topics
**Use**: `topic_mastery` (indexed IN clause)

```python
# Fast - Multi-row lookup on indexed columns
query = """
SELECT
    topic_id,
    mastery_score,
    questions_attempted,
    questions_correct,
    last_studied_at
FROM topic_mastery
WHERE user_id = :user_id
  AND topic_id IN :topic_ids  -- Max 10 topics
"""

# Expected: < 50ms (indexed IN query)
```

---

### 3. Question Performance Analysis

#### Question History (Spaced Repetition)
**Use**: `question_attempts` (for specific question)

```python
# Fast - Composite index on question + user
query = """
SELECT
    attempted_at,
    is_correct,
    time_to_answer_seconds,
    confidence_level,
    attempt_number,
    days_since_last_attempt
FROM question_attempts
WHERE question_id = :question_id
  AND user_id = :user_id
ORDER BY attempted_at DESC
"""

# Expected: < 20ms (small result set, indexed)
```

#### First Attempt Accuracy (Mastery Indicator)
**Use**: `question_attempts` (filtered on is_first_attempt)

```python
# Moderate - Filter on indexed boolean + time range
query = """
SELECT
    COUNT(*) as total_first_attempts,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_first_attempts,
    AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
    AVG(time_to_answer_seconds) as avg_response_time
FROM question_attempts
WHERE user_id = :user_id
  AND topic_id = :topic_id
  AND is_first_attempt = true
  AND attempted_at >= CURRENT_DATE - INTERVAL '30 days'
"""

# Expected: < 100ms (indexed scan + aggregation)
```

#### Weakest Question Types
**Use**: `question_attempts` JOIN `questions`

```python
# Complex - Requires question metadata JOIN
query = """
SELECT
    q.question_type,
    q.difficulty,
    COUNT(*) as attempts,
    AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
    AVG(qa.time_to_answer_seconds) as avg_time
FROM question_attempts qa
JOIN questions q ON qa.question_id = q.id
WHERE qa.user_id = :user_id
  AND qa.attempted_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY q.question_type, q.difficulty
HAVING COUNT(*) >= 5  -- Minimum sample size
ORDER BY accuracy ASC
"""

# Expected: < 300ms (JOIN + GROUP BY)
# Optimization: Add index on questions(question_type, difficulty)
```

---

### 4. Batch Analytics (Nightly Jobs)

#### Update Daily User Stats
**Use**: Aggregate from `study_events` and `study_sessions`

```python
# Heavy - Daily aggregation (run at 00:05 UTC)
query = """
INSERT INTO daily_user_stats (
    user_id, stat_date, sessions_count, total_study_minutes,
    materials_viewed, questions_attempted, questions_correct, ...
)
SELECT
    ss.user_id,
    DATE(ss.started_at) as stat_date,
    COUNT(DISTINCT ss.id) as sessions_count,
    SUM(ss.duration_seconds) / 60 as total_study_minutes,
    SUM(ss.materials_viewed) as materials_viewed,
    SUM(ss.questions_attempted) as questions_attempted,
    SUM(ss.questions_correct) as questions_correct,
    ...
FROM study_sessions ss
WHERE ss.started_at >= :yesterday_start
  AND ss.started_at < :today_start
  AND ss.is_active = false
GROUP BY ss.user_id, DATE(ss.started_at)
ON CONFLICT (user_id, stat_date) DO UPDATE SET
    sessions_count = EXCLUDED.sessions_count,
    total_study_minutes = EXCLUDED.total_study_minutes,
    ...
"""

# Expected: < 1min for 10K users
# Optimization: Process in batches of 1000 users
```

#### Recalculate Topic Mastery
**Use**: Complex algorithm on `question_attempts` + `material_interactions`

```python
# Very Heavy - Run for users with activity in last 24h
async def recalculate_topic_mastery(user_id: UUID, topic_id: UUID):
    """
    Mastery score algorithm:
    1. Question accuracy (50% weight)
       - First attempt accuracy: 30%
       - Overall accuracy: 20%
    2. Retrieval strength (30% weight)
       - Based on spaced repetition success
       - Forgetting curve modeling
    3. Material completion (20% weight)
       - Completed vs total materials
       - Time spent vs expected time
    """

    # Query 1: Question performance
    question_perf = await db.execute("""
        SELECT
            COUNT(*) FILTER (WHERE is_first_attempt) as first_attempts,
            SUM(CASE WHEN is_first_attempt AND is_correct THEN 1 ELSE 0 END) as first_correct,
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as total_correct,
            AVG(time_to_answer_seconds) as avg_response_time
        FROM question_attempts
        WHERE user_id = :user_id AND topic_id = :topic_id
    """)

    # Query 2: Material progress
    material_progress = await db.execute("""
        SELECT
            COUNT(DISTINCT material_id) as materials_viewed,
            COUNT(DISTINCT material_id) FILTER (WHERE is_complete) as materials_completed,
            SUM(duration_seconds) as total_time_seconds
        FROM material_interactions
        WHERE user_id = :user_id AND topic_id = :topic_id
    """)

    # Query 3: Forgetting curve (recent attempts)
    retrieval_strength = await calculate_retrieval_strength(user_id, topic_id)

    # Calculate composite mastery score
    mastery_score = (
        0.30 * first_attempt_accuracy +
        0.20 * overall_accuracy +
        0.30 * retrieval_strength +
        0.20 * material_completion_rate
    )

    # Update topic_mastery
    await db.execute("""
        UPDATE topic_mastery
        SET
            mastery_score = :mastery_score,
            retrieval_strength = :retrieval_strength,
            questions_attempted = :total_attempts,
            questions_correct = :total_correct,
            first_attempt_accuracy = :first_attempt_accuracy,
            last_calculated_at = NOW()
        WHERE user_id = :user_id AND topic_id = :topic_id
    """)

# Expected: < 500ms per topic
# Optimization: Batch update 100 topics at a time
```

#### Detect Knowledge Gaps
**Use**: Analysis of `topic_mastery` + `question_attempts`

```python
# Complex - Analytical query
query = """
WITH user_topics AS (
    SELECT DISTINCT topic_id
    FROM question_attempts
    WHERE user_id = :user_id
      AND attempted_at >= CURRENT_DATE - INTERVAL '30 days'
),
topic_performance AS (
    SELECT
        qa.topic_id,
        COUNT(*) as attempts,
        AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
        AVG(qa.time_to_answer_seconds) as avg_time,
        tm.mastery_score,
        tm.retention_rate,
        t.board_exam_weight,
        COUNT(DISTINCT tr.target_topic_id) as affects_other_topics
    FROM question_attempts qa
    JOIN topic_mastery tm ON qa.topic_id = tm.topic_id AND qa.user_id = tm.user_id
    JOIN topics t ON qa.topic_id = t.id
    LEFT JOIN topic_relationships tr ON qa.topic_id = tr.source_topic_id
                                      AND tr.relationship_type = 'prerequisite'
    WHERE qa.user_id = :user_id
      AND qa.attempted_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY qa.topic_id, tm.mastery_score, tm.retention_rate, t.board_exam_weight
    HAVING COUNT(*) >= 5  -- Minimum sample size
)
SELECT
    topic_id,
    CASE
        WHEN accuracy < 0.5 AND mastery_score < 0.3 THEN 'critical'
        WHEN accuracy < 0.6 AND mastery_score < 0.5 THEN 'high'
        WHEN accuracy < 0.7 AND mastery_score < 0.7 THEN 'medium'
        ELSE 'low'
    END as severity,
    (1.0 - mastery_score) as gap_score,
    accuracy,
    avg_time,
    board_exam_weight,
    affects_other_topics,
    (
        (1.0 - mastery_score) * 3.0 +  -- Gap score
        board_exam_weight * 2.0 +      -- Importance
        affects_other_topics * 1.0     -- Dependency impact
    ) as priority_score
FROM topic_performance
WHERE mastery_score < 0.8  -- Only gaps (not mastered topics)
ORDER BY priority_score DESC
"""

# Expected: < 2s (complex analytics query)
# Optimization: Run once per day, cache results
```

---

## Query Optimization Techniques

### 1. Use Pre-Aggregated Tables
**Problem**: Scanning `study_events` for 30-day metrics is slow
**Solution**: Use `daily_user_stats` and aggregate 30 rows instead

```python
# SLOW - Scanning event log
SELECT COUNT(*) FROM study_events
WHERE user_id = :user_id
  AND created_at >= NOW() - INTERVAL '30 days';

# FAST - Aggregate daily stats
SELECT SUM(sessions_count) FROM daily_user_stats
WHERE user_id = :user_id
  AND stat_date >= CURRENT_DATE - INTERVAL '30 days';
```

### 2. Covering Indexes
**Problem**: Index lookup → table lookup (2 I/O operations)
**Solution**: Index includes all queried columns (1 I/O operation)

```sql
-- Without covering index
CREATE INDEX ix_attempts_user ON question_attempts (user_id);
-- Query: SELECT attempted_at, is_correct FROM question_attempts WHERE user_id = ?;
-- PostgreSQL: Index scan → Table lookup (2 operations)

-- With covering index
CREATE INDEX ix_attempts_user_covering ON question_attempts (user_id)
    INCLUDE (attempted_at, is_correct);
-- Query: SELECT attempted_at, is_correct FROM question_attempts WHERE user_id = ?;
-- PostgreSQL: Index-only scan (1 operation)
```

### 3. Partial Indexes
**Problem**: Indexing inactive/old data wastes space
**Solution**: Index only relevant rows

```sql
-- Only index active sessions (not old completed ones)
CREATE INDEX ix_study_sessions_active ON study_sessions (user_id, started_at)
WHERE is_active = true;

-- Only index unresolved knowledge gaps
CREATE INDEX ix_knowledge_gaps_unresolved ON knowledge_gaps (user_id, priority_score)
WHERE is_resolved = false;
```

### 4. Query Plan Analysis
Always check query plans for slow queries:

```sql
EXPLAIN ANALYZE
SELECT ...;

-- Look for:
-- ✅ Index Scan (good)
-- ✅ Index Only Scan (best)
-- ⚠️  Bitmap Index Scan (okay for large result sets)
-- ❌ Sequential Scan (bad for large tables)
-- ❌ Nested Loop (bad with large outer table)
```

### 5. Connection Pooling
Configure pg_bouncer or SQLAlchemy pool:

```python
# Backend: app/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,  # Concurrent connections
    max_overflow=10,  # Burst capacity
    pool_pre_ping=True,  # Test connections before use
    pool_recycle=3600,  # Recycle after 1 hour
)
```

---

## PostgreSQL-Specific Optimizations

### 1. Table Partitioning (study_events)
**Problem**: Event table grows infinitely, queries slow down
**Solution**: Partition by month

```sql
-- Create partitioned table
CREATE TABLE study_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    ...
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE study_events_2025_01 PARTITION OF study_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE study_events_2025_02 PARTITION OF study_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Indexes on each partition
CREATE INDEX ix_study_events_2025_01_user_created
    ON study_events_2025_01 (user_id, created_at);
```

**Benefits**:
- Queries only scan relevant partitions
- Old partitions can be archived/dropped
- Maintenance operations faster (VACUUM, ANALYZE)

### 2. Materialized Views (Complex Aggregations)
**Problem**: Complex analytics queries recalculated every time
**Solution**: Pre-compute with materialized view

```sql
-- Topic difficulty ranking (updated nightly)
CREATE MATERIALIZED VIEW topic_difficulty_stats AS
SELECT
    topic_id,
    COUNT(DISTINCT user_id) as learners_count,
    AVG(CASE WHEN is_first_attempt AND is_correct THEN 1.0 ELSE 0.0 END) as avg_first_attempt_accuracy,
    AVG(time_to_answer_seconds) as avg_response_time,
    STDDEV(time_to_answer_seconds) as response_time_stddev
FROM question_attempts
WHERE attempted_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY topic_id
HAVING COUNT(*) >= 100;  -- Minimum sample size

-- Refresh nightly
REFRESH MATERIALIZED VIEW CONCURRENTLY topic_difficulty_stats;
```

### 3. JSONB Indexing (properties column)
**Problem**: Querying inside JSONB is slow
**Solution**: GIN index for JSONB

```sql
-- Index for property searches
CREATE INDEX ix_study_events_properties ON study_events USING GIN (properties);

-- Fast query: Find events with specific property
SELECT * FROM study_events
WHERE properties @> '{"device_type": "mobile"}';

-- Extract specific JSONB fields for frequent queries
CREATE INDEX ix_study_events_device_type ON study_events
    ((properties->>'device_type'));
```

### 4. Statistics & ANALYZE
Keep table statistics fresh:

```sql
-- Manual analyze after bulk inserts
ANALYZE study_events;

-- Auto-vacuum configuration (postgresql.conf)
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
```

---

## Monitoring & Alerting

### 1. Slow Query Log
```sql
-- postgresql.conf
log_min_duration_statement = 1000  -- Log queries > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### 2. Query Performance Tracking
```python
# Middleware: Track query times
@app.middleware("http")
async def track_query_performance(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    if duration > 0.2:  # Slow query threshold
        logger.warning(f"Slow query: {request.url.path} took {duration:.2f}s")
        # Send to monitoring (DataDog, New Relic, etc.)

    return response
```

### 3. Index Usage Stats
```sql
-- Check which indexes are used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;  -- Unused indexes at top
```

---

## Scaling Strategy

### Current Scale (Personal Use)
- **Users**: 1-10
- **Events/day**: < 10K
- **Storage**: < 1GB
- **Strategy**: Single PostgreSQL instance, basic indexes

### Medium Scale (100-1K Users)
- **Events/day**: 10K-1M
- **Storage**: 1-100GB
- **Strategy**:
  - Table partitioning (study_events)
  - Read replicas for analytics
  - Redis cache for hot data

### Large Scale (10K+ Users)
- **Events/day**: 1M-100M
- **Storage**: 100GB-10TB
- **Strategy**:
  - Separate analytics database
  - TimescaleDB for time-series
  - Event streaming (Kafka)
  - Data warehouse (BigQuery, Redshift)

---

## Summary

**Key Takeaways**:
1. **Use pre-aggregated tables** for dashboard queries
2. **Index strategically** - composite indexes for common patterns
3. **Partition large tables** - especially event logs
4. **Monitor query performance** - log slow queries
5. **Batch heavy computations** - run during low-traffic hours
6. **Test at scale** - Use realistic data volumes

**Next Steps**:
1. Run migration to create indexes
2. Implement event tracking service
3. Build batch aggregation jobs
4. Set up query performance monitoring
5. Benchmark with realistic data
