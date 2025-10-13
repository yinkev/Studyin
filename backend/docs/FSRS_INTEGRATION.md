# FSRS (Free Spaced Repetition Scheduler) Integration

## Overview

This document describes the FSRS implementation in Studyin's backend. FSRS is a modern spaced repetition algorithm that optimizes long-term memory retention through adaptive scheduling.

### Why FSRS?

- **Research-backed**: Based on memory science and forgetting curves
- **Adaptive**: Personalizes to each user's learning patterns
- **Efficient**: Maximizes retention while minimizing study time
- **Medical education optimized**: Tuned for high-volume, complex content

### Key Concepts

1. **Cards**: Individual study items (material chunks, topics, flashcards)
2. **Difficulty**: How hard the card is to remember (0.0-10.0)
3. **Stability**: How long (in days) memory lasts at 90% retention
4. **Retrievability**: Current probability of successful recall (0.0-1.0)
5. **Review Ratings**:
   - 1 = Again (forgot)
   - 2 = Hard (difficult to recall)
   - 3 = Good (recalled successfully)
   - 4 = Easy (recalled effortlessly)

---

## Architecture

### Database Models

#### 1. FSRSCard (`fsrs_cards`)

Stores the current state of each study item.

**Key Fields**:
- `user_id`: Owner of the card
- `chunk_id`, `topic_id`, `flashcard_content`: Link to content
- `difficulty`: How hard to remember (0.0-10.0)
- `stability`: Memory stability in days
- `retrievability`: Current recall probability (0.0-1.0)
- `state`: `new`, `learning`, `review`, `relearning`
- `due_date`: When next review is scheduled
- `reps`: Total review count
- `lapses`: Times forgotten

**Indexes** (optimized for performance):
- `(user_id, due_date)`: Fast "cards due" queries
- `(user_id, state)`: Filter by card state
- `(chunk_id)`, `(topic_id)`: Content lookups

#### 2. FSRSReviewLog (`fsrs_review_logs`)

Historical record of every review attempt.

**Key Fields**:
- `card_id`, `user_id`: Links
- `rating`: 1-4 (Again, Hard, Good, Easy)
- `review_duration_seconds`: Time taken
- `state_before`, `state_after`: State transitions
- `difficulty_before`, `difficulty_after`: Difficulty changes
- `stability_before`, `stability_after`: Stability changes

**Purpose**:
- Algorithm optimization
- Learning analytics
- Performance tracking
- Retention analysis

#### 3. FSRSParameters (`fsrs_parameters`)

FSRS algorithm parameters (global or per-user/topic).

**Key Fields**:
- `user_id`: NULL = global defaults
- `topic_id`: Subject-specific parameters
- `parameters`: JSONB with 19 FSRS weights + config
- `optimized`: Whether personalized or default
- `sample_size`: Reviews used for optimization

**Parameter Structure**:
```json
{
  "w": [0.40255, 1.18385, 3.173, ...],  // 19 weights
  "request_retention": 0.9,              // Target 90% retention
  "maximum_interval": 36500,             // Max 100 years
  "enable_fuzz": true                    // Add randomness
}
```

---

## Service Layer: FSRSService

Location: `/app/services/fsrs_service.py`

### Core Methods

#### `create_card()`

Create a new card for study.

```python
card = await fsrs_service.create_card(
    user_id=user.id,
    topic_id=topic.id,
    initial_due_date=datetime.now(UTC)  # Optional
)
```

**Use Cases**:
- User uploads study material → Auto-create cards for chunks
- User starts studying a topic → Create topic card
- User creates custom flashcard

#### `schedule_review()`

Submit a review and update schedule.

```python
updated_card = await fsrs_service.schedule_review(
    card_id=card.id,
    rating=3,  # 1=Again, 2=Hard, 3=Good, 4=Easy
    review_duration_seconds=12.5
)
```

**FSRS Algorithm Flow**:
1. Load current card state
2. Get user's FSRS parameters
3. Calculate new difficulty and stability
4. Determine next review interval
5. Update card in database
6. Create review log entry
7. Update TopicMastery if linked

**Output**: Updated card with new `due_date`, `stability`, `difficulty`

#### `get_due_cards()`

Fetch cards due for review.

```python
due_cards = await fsrs_service.get_due_cards(
    user_id=user.id,
    limit=20,
    topic_id=topic.id,      # Optional filter
    include_new=True        # Include new cards
)
```

**Query Optimization**:
- Uses `(user_id, due_date)` index
- Orders by due date (most overdue first)
- Then by retrievability (weakest memories first)

#### `predict_retention()`

Estimate current recall probability.

```python
retention = await fsrs_service.predict_retention(card_id)
# Returns: 0.0 - 1.0 (probability)
```

**Formula**: `R = 0.9^(t/S)`
- R = Retention probability
- t = Days since last review
- S = Stability

**Use Cases**:
- Show user which cards are weakest
- Decide whether to review early
- Analytics dashboards

#### `optimize_parameters()`

Personalize FSRS parameters from review history.

```python
params = await fsrs_service.optimize_parameters(
    user_id=user.id,
    topic_id=topic.id,      # Optional: per-subject
    min_reviews=100         # Minimum data required
)
```

**Requirements**:
- Minimum 100 reviews (configurable)
- Varied review history (different ratings, intervals)

**Benefits**:
- 5-10% improvement in prediction accuracy
- Better long-term retention
- Reduced study time

#### `get_card_stats()`

Get user's card statistics.

```python
stats = await fsrs_service.get_card_stats(user_id=user.id)
# Returns:
# {
#   "total_cards": 150,
#   "due_today": 23,
#   "new": 45,
#   "learning": 30,
#   "review": 70,
#   "relearning": 5,
#   "average_stability_days": 12.5,
#   "total_reviews": 1250
# }
```

---

## API Endpoints

Base URL: `/api/reviews`

### 1. Get Due Cards

```http
GET /api/reviews/due?limit=20&topic_id={uuid}&include_new=true
Authorization: Bearer {token}
```

**Response**:
```json
{
  "cards": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "topic_id": "uuid",
      "difficulty": 5.2,
      "stability": 8.5,
      "retrievability": 0.85,
      "state": "review",
      "due_date": "2025-10-13T12:00:00Z",
      "reps": 5,
      "lapses": 1,
      "consecutive_correct": 3
    }
  ],
  "total_count": 20,
  "has_more": true
}
```

### 2. Submit Review

```http
POST /api/reviews/{card_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 3,
  "review_duration_seconds": 12.5
}
```

**Response**:
```json
{
  "card": { /* updated card */ },
  "next_review_date": "2025-10-22T12:00:00Z",
  "interval_days": 9,
  "retention_probability": 0.92,
  "xp_earned": 25,
  "streak_maintained": true
}
```

### 3. Get Upcoming Schedule

```http
GET /api/reviews/schedule?days_ahead=7
Authorization: Bearer {token}
```

**Response**:
```json
{
  "schedule": {
    "2025-10-13": 23,
    "2025-10-14": 18,
    "2025-10-15": 12,
    "2025-10-16": 15,
    "2025-10-17": 20,
    "2025-10-18": 10,
    "2025-10-19": 8
  },
  "total_reviews": 106,
  "days_ahead": 7
}
```

### 4. Predict Retention

```http
GET /api/reviews/retention/{card_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "card_id": "uuid",
  "retention_probability": 0.78,
  "days_since_review": 6,
  "stability_days": 8.5,
  "optimal_review_date": "2025-10-15T12:00:00Z"
}
```

### 5. Create Card

```http
POST /api/reviews/cards
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic_id": "uuid",
  "initial_due_date": "2025-10-13T12:00:00Z"
}
```

### 6. Bulk Create Cards

```http
POST /api/reviews/cards/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "chunk_ids": ["uuid1", "uuid2", "uuid3"],
  "topic_ids": ["uuid4", "uuid5"]
}
```

**Response**:
```json
{
  "created_count": 5,
  "skipped_count": 0,
  "cards": [ /* array of created cards */ ]
}
```

### 7. Get Statistics

```http
GET /api/reviews/stats
Authorization: Bearer {token}
```

### 8. Optimize Parameters

```http
POST /api/reviews/optimize
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic_id": "uuid",  // Optional
  "min_reviews": 100
}
```

---

## Integration with Gamification

### XP Calculation

**Formula**:
```
XP = base_xp + rating_bonus + state_bonus + streak_bonus

Base XP: 10 points
Rating bonus:
  - Again (1): +0
  - Hard (2): +5
  - Good (3): +10
  - Easy (4): +20

State bonus:
  - New: +0
  - Learning: +5
  - Review: +10
  - Relearning: +15

Streak bonus: +2 per consecutive correct (max +20)
```

**Example**: Review a card in "review" state, rating "Good", 5 consecutive correct
```
XP = 10 + 10 + 10 + 10 = 40 points
```

### Streak Integration

Reviewing cards maintains daily streak:
- Review at least 1 card per day → Streak continues
- Miss a day → Streak resets

### Level Progression

XP from reviews contributes to user level:
- Level 1: 0-100 XP
- Level 2: 100-300 XP
- Level 3: 300-600 XP
- (Progressive scaling)

---

## Integration with TopicMastery

FSRS cards automatically update `topic_mastery` table:

**When**: After each review (if card linked to topic)

**Metrics Updated**:
- `mastery_score`: Composite metric (0.0-1.0)
  - 30% card maturity (cards in "review" state with stability ≥ 21 days)
  - 30% average stability (normalized to 30 days)
  - 20% average retrievability
  - 20% recent retention rate (last 30 days)

- `retrieval_strength`: Average retrievability across all cards
- `retention_rate`: % of reviews rated ≥ 3 (Good/Easy)
- `last_studied_at`: Timestamp of last review

**Benefit**: Unified progress tracking across FSRS and other learning modes

---

## Performance Considerations

### Database Indexes

All critical queries are optimized:

1. **Due Cards Query** (`get_due_cards`):
   - Index: `(user_id, due_date)`
   - Typical query time: <10ms for 10K cards

2. **Card State Filters**:
   - Index: `(user_id, state)`
   - Use for filtering by learning stage

3. **Review History**:
   - Index: `(card_id, reviewed_at)`
   - Fast lookup of card's review history

4. **User Statistics**:
   - Aggregation queries use indexes
   - Denormalized counts in `TopicMastery`

### Caching Strategy

**FSRS Instance Caching**:
- FSRS instances cached per (user_id, topic_id)
- Cleared on parameter optimization
- Reduces DB lookups for parameters

**Query Result Caching** (future):
- Cache "due cards" for 1 minute
- Cache "upcoming schedule" for 5 minutes
- Invalidate on review submission

### Scalability

**Current Design** (up to 100K users):
- Async database operations
- Indexed queries
- Bulk operations support

**Future Optimizations** (100K+ users):
- Redis cache for hot data
- Read replicas for analytics
- Background job for parameter optimization
- Materialized views for statistics

---

## Algorithm Details: FSRS-4.5

### Memory Model

FSRS models memory with three key variables:

1. **Difficulty (D)**: How hard the card is to remember
   - Range: 0.0 - 10.0
   - Increases when you forget (rating 1-2)
   - Decreases when you remember easily (rating 4)

2. **Stability (S)**: How long memory lasts (in days)
   - Time until retention drops to 90%
   - Increases with each successful review
   - Resets to lower value on lapse

3. **Retrievability (R)**: Current recall probability
   - Formula: `R = 0.9^(t/S)`
   - Where t = days since last review
   - Decreases over time (forgetting curve)

### Scheduling Algorithm

1. **New Card** (first review):
   - Initial D = 5.0 (medium difficulty)
   - Initial S = 0 (not yet stable)
   - Calculate S based on rating:
     - Again (1): S = 0.4 days
     - Hard (2): S = 1.0 day
     - Good (3): S = 3.0 days
     - Easy (4): S = 7.0 days

2. **Subsequent Reviews**:
   - Calculate retrievability at review time
   - Update D based on:
     - Current D
     - Retrievability at review
     - Rating given
   - Update S based on:
     - Previous S
     - Retrievability at review
     - Rating given
     - 19 learned weights (FSRS parameters)

3. **Next Interval**:
   - Interval = S * (target_retention)^(1/decay_factor)
   - Typically S * 0.9 to S * 1.5
   - Fuzzed by ±5% if enabled

### Parameter Optimization

FSRS uses 19 weights (w[0] - w[18]) to model:
- How difficulty changes with performance
- How stability grows with reviews
- Memory decay rates
- Effects of different ratings

**Optimization Process**:
1. Collect user's review history
2. For each review, predict retention
3. Compare prediction vs actual performance
4. Minimize loss function (log-likelihood)
5. Update 19 weights to fit user's data

**Requirements**:
- Minimum 100-200 reviews
- Varied ratings (not all 3s or 4s)
- Multiple review cycles

---

## Medical Education Optimizations

### High Retention Targets

Medical content requires higher retention:
- Default retention: 0.9 (90%)
- Critical topics (anatomy, pharmacology): 0.95 (95%)
- Exam-critical content: 0.98 (98%)

Configure via `request_retention` parameter.

### Subject-Specific Parameters

Different subjects have different learning curves:
- **Anatomy**: Stable, long intervals (physiology)
- **Pharmacology**: Frequent review (drug names, dosages)
- **Clinical Medicine**: Mixed (concepts + details)

Optimize parameters per topic for best results.

### Integration with Questions

Link FSRS cards to question attempts:
- Question answered correctly → Review card as "Good" (3)
- Question answered incorrectly → Review card as "Again" (1)
- Integrate question performance into card scheduling

### Bulk Operations

Medical students often study in batches:
- Upload PDF → Auto-create cards for all chunks
- Start topic → Bulk create topic cards
- Practice test → Bulk review cards

Use `/api/reviews/cards/bulk` for efficiency.

---

## Testing

### Unit Tests

Location: `/tests/test_fsrs_service.py`

**Coverage**:
- Card creation (all content types)
- Review scheduling (all ratings)
- Due card queries (filters, limits, ordering)
- Retention prediction
- Parameter optimization
- Statistics
- Cache behavior

**Run Tests**:
```bash
cd backend
pytest tests/test_fsrs_service.py -v
```

### Integration Tests

Test full API flow:
1. Create user
2. Upload material
3. Create cards
4. Get due cards
5. Submit reviews
6. Check schedule
7. Verify XP earned
8. Check TopicMastery updated

### Load Testing

Simulate 1000 concurrent users:
- Each user reviews 20 cards
- Measure p95 latency
- Target: <100ms per review

---

## Monitoring

### Key Metrics

1. **Performance**:
   - Review submission latency (p50, p95, p99)
   - Due cards query time
   - Parameter optimization time

2. **Usage**:
   - Cards created per day
   - Reviews submitted per day
   - Daily active reviewers
   - Average reviews per user

3. **Learning**:
   - Average retention rate
   - Cards by state distribution
   - Average stability
   - Lapse rate (% reviews rated 1-2)

4. **Algorithm**:
   - Prediction accuracy (RMSE)
   - Users with optimized parameters
   - Average interval length

### Logging

**Review Events**:
```python
logger.info(
    f"Reviewed card {card_id}, rating={rating}, "
    f"next_due={card.due_date}, stability={card.stability:.2f} days"
)
```

**Performance Logs**:
```python
performance_logger.info(
    "fsrs_review_submitted",
    extra={
        "user_id": user_id,
        "rating": rating,
        "duration_ms": duration_ms,
        "new_interval_days": card.scheduled_days
    }
)
```

### Alerts

Set up alerts for:
- Review latency > 500ms (p95)
- Error rate > 1%
- Database connection pool exhaustion
- Card creation failures

---

## Migration Guide

### Running the Migration

```bash
cd backend

# Apply migration
alembic upgrade head

# Verify tables created
psql $DATABASE_URL -c "\dt fsrs_*"
# Should show: fsrs_cards, fsrs_review_logs, fsrs_parameters
```

### Seeding Default Parameters

Migration automatically inserts global default FSRS parameters.

**Verify**:
```sql
SELECT id, user_id, topic_id, optimized, sample_size
FROM fsrs_parameters
WHERE user_id IS NULL AND topic_id IS NULL;
```

### Creating Initial Cards

After migration, bulk create cards for existing content:

```python
# For all existing material chunks
chunks = await db.execute(select(MaterialChunk))
for chunk in chunks.scalars().all():
    await fsrs_service.create_card(
        user_id=chunk.material.user_id,
        chunk_id=chunk.id
    )

# For all topics users are studying
user_topics = await db.execute(
    select(TopicMastery.user_id, TopicMastery.topic_id)
)
for user_id, topic_id in user_topics:
    await fsrs_service.create_card(
        user_id=user_id,
        topic_id=topic_id
    )
```

---

## Future Enhancements

### Near-Term (1-3 months)

1. **Mobile Optimization**:
   - Offline review support
   - Sync when back online
   - Progressive Web App (PWA)

2. **Advanced Analytics**:
   - Retention heatmaps
   - Learning curve visualization
   - Predicted exam readiness

3. **Gamification Integration**:
   - Achievements for review milestones
   - Leaderboards (reviews per week)
   - Streak rewards

### Mid-Term (3-6 months)

1. **AI-Generated Flashcards**:
   - Auto-create flashcards from material chunks
   - Use LLM to generate questions
   - Link to FSRS for scheduling

2. **Study Mode Recommendations**:
   - "You should review Cardiology today"
   - "Pharmacology cards are weakest"
   - Optimal study time suggestions

3. **Collaborative Learning**:
   - Share flashcard decks
   - Compare retention rates
   - Study groups with shared schedules

### Long-Term (6+ months)

1. **Advanced Memory Models**:
   - Context-dependent memory (time of day, location)
   - Interference effects (similar topics)
   - Mood and sleep impact

2. **Adaptive Content**:
   - Dynamically adjust material difficulty
   - Personalized learning paths
   - Prerequisite detection

3. **Exam Preparation**:
   - Simulate exam conditions
   - Predict exam scores
   - Targeted review for weak areas

---

## Troubleshooting

### Common Issues

#### 1. No Cards Due

**Symptom**: `get_due_cards()` returns empty list

**Possible Causes**:
- No cards created yet → Use bulk create
- All cards scheduled in future → Check `due_date`
- Wrong user_id → Verify authentication

**Debug**:
```sql
SELECT state, COUNT(*)
FROM fsrs_cards
WHERE user_id = '{user_id}'
GROUP BY state;
```

#### 2. Cards Not Advancing

**Symptom**: Cards stuck in "learning" state

**Possible Causes**:
- Always rating "Again" (1) → Check review behavior
- Algorithm issue → Verify parameters loaded

**Debug**:
```sql
SELECT rating, COUNT(*)
FROM fsrs_review_logs
WHERE user_id = '{user_id}'
GROUP BY rating;
```

#### 3. Parameter Optimization Fails

**Symptom**: `optimize_parameters()` returns None

**Possible Causes**:
- Insufficient reviews (< min_reviews)
- All reviews same rating (no variance)
- Data quality issues

**Debug**:
```sql
SELECT COUNT(*) as review_count
FROM fsrs_review_logs
WHERE user_id = '{user_id}';

SELECT rating, COUNT(*)
FROM fsrs_review_logs
WHERE user_id = '{user_id}'
GROUP BY rating;
```

### Performance Issues

#### Slow Due Cards Query

**Symptom**: `/api/reviews/due` takes > 500ms

**Solutions**:
1. Check index usage:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM fsrs_cards
   WHERE user_id = '{user_id}' AND due_date <= NOW()
   ORDER BY due_date ASC
   LIMIT 20;
   ```

2. Verify index exists:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'fsrs_cards';
   ```

3. If index missing, recreate:
   ```sql
   CREATE INDEX CONCURRENTLY ix_fsrs_cards_user_due
   ON fsrs_cards (user_id, due_date);
   ```

#### High Memory Usage

**Symptom**: Python process using excessive RAM

**Possible Causes**:
- FSRS cache not cleared
- Large batch operations
- Memory leak in optimizer

**Solutions**:
- Clear cache periodically: `fsrs_service._fsrs_cache.clear()`
- Use smaller batch sizes in bulk operations
- Profile with `memory_profiler`

---

## Support

### Documentation
- FSRS Algorithm: https://github.com/open-spaced-repetition/fsrs4anki/wiki
- Medical Education SRS: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9896433/

### Contact
- Backend Team: backend@studyin.app
- FSRS Issues: GitHub Issues

### Contributing

Contributions welcome! Focus areas:
- Performance optimizations
- Medical education features
- Algorithm improvements
- Test coverage

---

**Last Updated**: 2025-10-13
**Version**: 1.0
**Author**: Backend Team
