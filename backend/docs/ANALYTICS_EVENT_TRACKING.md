# Analytics Event Tracking Strategy

**Last Updated**: 2025-10-13

This document defines WHEN and WHERE to track analytics events for world-class medical education insights.

---

## Overview

The analytics system captures:
- **Raw events** → `study_events` table (immutable, append-only)
- **Session aggregates** → `study_sessions` table (updated during session)
- **Daily aggregates** → `daily_user_stats`, `topic_daily_stats` (end-of-day batch + real-time)
- **Mastery scores** → `topic_mastery` (updated after questions/materials)
- **Knowledge gaps** → `knowledge_gaps` (batch job, daily/weekly)

---

## Event Tracking Points

### 1. Study Session Events

#### SESSION_START
**When**: User starts a study session (opens app, starts timer, begins activity)

**Where**:
- Frontend: When user clicks "Start Study Session"
- Backend: `POST /api/sessions/start`

**Data to Capture**:
```python
from app.services.analytics import track_event

await track_event(
    user_id=user.id,
    session_id=session_id,  # Generate UUID for new session
    event_type="session_start",
    properties={
        "device_type": "web",  # or "mobile", "tablet"
        "user_agent": request.headers.get("User-Agent"),
        "timezone": user.timezone,
    }
)

# Also create StudySession record
session = StudySession(
    id=session_id,
    user_id=user.id,
    started_at=datetime.utcnow(),
    is_active=True
)
await db_session.add(session)
```

#### SESSION_END
**When**: User ends study session (explicit end, timeout, or browser close)

**Where**:
- Frontend: When user clicks "End Session" or after 30min inactivity
- Backend: `POST /api/sessions/{session_id}/end`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=session_id,
    event_type="session_end",
    properties={
        "duration_seconds": session.duration_seconds,
        "active_seconds": session.active_seconds,
        "materials_viewed": session.materials_viewed,
        "questions_attempted": session.questions_attempted,
        "xp_earned": session.xp_earned,
    }
)

# Update StudySession record
session.ended_at = datetime.utcnow()
session.is_active = False
await db_session.commit()

# Trigger daily stats update (async task)
await update_daily_user_stats(user_id, date.today())
```

#### SESSION_PAUSE / SESSION_RESUME
**When**: User pauses timer (break, distraction) and resumes

**Where**: `POST /api/sessions/{session_id}/pause|resume`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=session_id,
    event_type="session_pause",  # or "session_resume"
    properties={
        "pause_reason": "break",  # Optional: user-provided
    }
)

# Update session pause count
session.pause_count += 1
```

---

### 2. Material Interaction Events

#### MATERIAL_OPEN
**When**: User opens a PDF/document for study

**Where**:
- Frontend: When material viewer loads
- Backend: `GET /api/materials/{material_id}` (track in middleware)

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="material_open",
    material_id=material_id,
    topic_id=material.topic_id,
    properties={
        "material_type": "pdf",
        "material_name": material.filename,
        "total_pages": material.page_count,
    }
)

# Create MaterialInteraction record
interaction = MaterialInteraction(
    user_id=user.id,
    session_id=current_session_id,
    material_id=material_id,
    topic_id=material.topic_id,
    interaction_type="read",
    started_at=datetime.utcnow(),
)
await db_session.add(interaction)

# Update session metrics
session.materials_viewed += 1
```

#### MATERIAL_READ (Chunk-level)
**When**: User reads a chunk (detected by scroll position, time on chunk, etc.)

**Where**:
- Frontend: Send event every 30 seconds if user is actively reading
- Backend: `POST /api/analytics/events` (batch endpoint)

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="material_read",
    material_id=material_id,
    chunk_id=chunk_id,
    topic_id=chunk.topic_id,
    properties={
        "time_spent_seconds": 30,
        "scroll_depth_percent": 75,
        "chunk_index": chunk.chunk_index,
        "is_complete": True,  # If user reached end of chunk
    }
)

# Update MaterialInteraction
interaction.duration_seconds += 30
interaction.scroll_depth_percent = max(
    interaction.scroll_depth_percent, 75
)
if scroll_depth >= 90:
    interaction.is_complete = True

# Update session metrics
session.chunks_read += 1
```

#### MATERIAL_COMPLETE
**When**: User finishes entire material (reached end, marked as complete)

**Where**: `POST /api/materials/{material_id}/complete`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="material_complete",
    material_id=material_id,
    topic_id=material.topic_id,
    properties={
        "total_time_seconds": interaction.duration_seconds,
        "completion_percentage": 100,
    }
)

# Update MaterialInteraction
interaction.is_complete = True
interaction.ended_at = datetime.utcnow()

# Update session metrics
session.materials_completed += 1

# Award XP
xp_earned = calculate_xp(material, interaction.duration_seconds)
await award_xp(user_id, xp_earned, reason="material_complete")
```

#### MATERIAL_HIGHLIGHT / NOTE / BOOKMARK
**When**: User highlights text, adds note, or bookmarks

**Where**: `POST /api/materials/{material_id}/annotations`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="material_highlight",  # or note, bookmark
    material_id=material_id,
    chunk_id=chunk_id,
    topic_id=chunk.topic_id,
    properties={
        "annotation_type": "highlight",
        "text_length": len(highlighted_text),
        "chunk_position": position_in_chunk,
    }
)

# Update MaterialInteraction counts
interaction.highlights_count += 1  # or notes_count, bookmarked=True
```

---

### 3. Question/Quiz Events

#### QUESTION_VIEW
**When**: User views a practice question

**Where**: `GET /api/questions/{question_id}`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="question_view",
    question_id=question_id,
    topic_id=question.topic_id,
    properties={
        "question_type": "multiple_choice",
        "difficulty": question.difficulty,
        "is_first_view": not has_seen_before,
    }
)
```

#### QUESTION_ATTEMPT / QUESTION_SUBMIT
**When**: User submits answer to question

**Where**: `POST /api/questions/{question_id}/submit`

**Data to Capture**:
```python
# Calculate if first attempt
is_first = await is_first_attempt(user_id, question_id)
attempt_number = await get_attempt_count(user_id, question_id) + 1
days_since_last = await days_since_last_attempt(user_id, question_id)

await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="question_submit",
    question_id=question_id,
    topic_id=question.topic_id,
    properties={
        "selected_answer": answer,
        "correct_answer": question.correct_answer,
        "is_correct": answer == question.correct_answer,
        "time_to_answer_seconds": time_spent,
        "confidence_level": confidence,  # If user provided
        "is_first_attempt": is_first,
        "attempt_number": attempt_number,
        "hint_used": hint_was_used,
    }
)

# Create QuestionAttempt record (critical for mastery tracking!)
attempt = QuestionAttempt(
    user_id=user.id,
    session_id=current_session_id,
    question_id=question_id,
    topic_id=question.topic_id,
    attempted_at=datetime.utcnow(),
    time_to_answer_seconds=time_spent,
    is_correct=is_correct,
    confidence_level=confidence,
    selected_answer=answer,
    correct_answer=question.correct_answer,
    is_first_attempt=is_first,
    attempt_number=attempt_number,
    days_since_last_attempt=days_since_last,
    hint_used=hint_was_used,
    explanation_viewed=False,
)
await db_session.add(attempt)

# Update session metrics
session.questions_attempted += 1
if is_correct:
    session.questions_correct += 1

# Award XP
xp_earned = calculate_question_xp(is_correct, is_first, difficulty)
await award_xp(user_id, xp_earned, reason="question_attempt")

# CRITICAL: Update topic mastery (async task)
await update_topic_mastery(user_id, question.topic_id)
```

#### QUIZ_START / QUIZ_COMPLETE
**When**: User starts/completes a quiz (multiple questions)

**Where**: `POST /api/quizzes/{quiz_id}/start|complete`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="quiz_complete",
    properties={
        "quiz_id": quiz_id,
        "total_questions": quiz.question_count,
        "correct_answers": correct_count,
        "accuracy": correct_count / quiz.question_count,
        "total_time_seconds": quiz_duration,
        "quiz_type": "practice",  # or "mock_exam", "flashcards"
    }
)
```

---

### 4. AI Coach Events

#### AI_QUESTION_ASKED
**When**: User sends message to AI coach

**Where**: `POST /api/ai-coach/ask` (WebSocket: on message send)

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="ai_question_asked",
    topic_id=detected_topic_id,  # NLP topic detection
    properties={
        "question_length": len(question),
        "context_provided": bool(context),
        "conversation_turn": turn_number,
        "detected_topics": topic_ids,
    }
)

# Update session metrics
session.ai_interactions += 1
```

#### AI_RESPONSE_RECEIVED
**When**: AI coach responds

**Where**: After LLM response generated

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="ai_response_received",
    properties={
        "response_length": len(response),
        "response_time_ms": response_time,
        "model_used": "gpt-5",
        "tokens_used": token_count,
    }
)
```

#### AI_FEEDBACK_POSITIVE / NEGATIVE
**When**: User rates AI response (thumbs up/down)

**Where**: `POST /api/ai-coach/feedback`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="ai_feedback_positive",  # or negative
    properties={
        "message_id": message_id,
        "rating": 5,  # 1-5 scale
        "feedback_text": feedback,  # Optional user comment
    }
)
```

#### AI_HINT_REQUESTED / AI_EXPLANATION_REQUESTED
**When**: User asks for hint or explanation (question context)

**Where**: `POST /api/questions/{question_id}/hint|explanation`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="ai_hint_requested",
    question_id=question_id,
    topic_id=question.topic_id,
    properties={
        "hint_type": "guided",  # or "direct"
        "time_before_hint": seconds_since_view,
    }
)

# Flag in QuestionAttempt
attempt.hint_used = True  # or explanation_viewed
```

---

### 5. Gamification Events

#### XP_EARNED
**When**: User earns XP (automatic, after activities)

**Where**: After material complete, question correct, streak, etc.

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="xp_earned",
    properties={
        "xp_amount": xp_earned,
        "xp_source": "question_correct",  # or "material_complete", "streak"
        "new_total_xp": user.total_xp + xp_earned,
    }
)

# Update session metrics
session.xp_earned += xp_earned

# Check for level up
if should_level_up(user.total_xp + xp_earned):
    await trigger_level_up(user_id)
```

#### LEVEL_UP
**When**: User reaches new level

**Where**: After XP award triggers level threshold

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="level_up",
    properties={
        "old_level": user.level,
        "new_level": user.level + 1,
        "total_xp": user.total_xp,
    }
)

# Update user_gamification table
user_gamification.level = user.level + 1
```

#### ACHIEVEMENT_UNLOCKED
**When**: User unlocks achievement (first question, 7-day streak, etc.)

**Where**: Achievement detection (after event processing)

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="achievement_unlocked",
    properties={
        "achievement_id": achievement.id,
        "achievement_name": achievement.name,
        "achievement_type": "streak",  # or "mastery", "milestone"
        "xp_reward": achievement.xp_reward,
    }
)

# Update session metrics
session.achievements_unlocked += 1
```

#### STREAK_CONTINUED / STREAK_BROKEN
**When**: Daily check-in or missed day

**Where**:
- `POST /api/gamification/checkin` (daily)
- Batch job (detect broken streaks at 00:00 UTC)

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="streak_continued",  # or "streak_broken"
    properties={
        "old_streak": user_gamification.current_streak,
        "new_streak": user_gamification.current_streak + 1,  # or 0 if broken
        "is_new_record": new_streak > user_gamification.longest_streak,
    }
)
```

---

### 6. Search and Discovery Events

#### SEARCH_PERFORMED
**When**: User searches for materials/topics

**Where**: `GET /api/search?q=...`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="search_performed",
    properties={
        "query": search_query,
        "result_count": len(results),
        "filters_applied": filters,
        "search_type": "semantic",  # or "keyword"
    }
)
```

#### TOPIC_EXPLORED
**When**: User browses topic page

**Where**: `GET /api/topics/{topic_id}`

**Data to Capture**:
```python
await track_event(
    user_id=user.id,
    session_id=current_session_id,
    event_type="topic_explored",
    topic_id=topic_id,
    properties={
        "topic_name": topic.name,
        "topic_level": topic.level,
        "current_mastery": mastery_score,  # If available
    }
)
```

---

## Batch Event Processing

Some events are sent in batches for performance:

```python
# Frontend: Queue events locally, send every 30 seconds
const eventQueue = [];

function trackEvent(event) {
    eventQueue.push(event);

    if (eventQueue.length >= 10 || lastFlush > 30000) {
        flushEvents();
    }
}

async function flushEvents() {
    await fetch('/api/analytics/events/batch', {
        method: 'POST',
        body: JSON.stringify({ events: eventQueue })
    });
    eventQueue = [];
}
```

---

## Event Data Flow

```
User Action
    ↓
Frontend Event Tracking
    ↓
API Endpoint (validate, enrich)
    ↓
┌─────────────────┬──────────────────┐
│                 │                  │
study_events      StudySession       QuestionAttempt
(immutable)       (update)           (create)
    ↓                 ↓                  ↓
Background Jobs                     Async Tasks
    ↓                                   ↓
daily_user_stats                  topic_mastery
topic_daily_stats                 knowledge_gaps
weekly_user_stats
user_learning_metrics
```

---

## Privacy & HIPAA Compliance

- **No PII in events**: Only `user_id` (anonymized UUID)
- **IP addresses**: Hash or truncate (last octet removed)
- **User agents**: Store for debugging, not for analytics
- **Secure storage**: All event data encrypted at rest
- **Retention policy**: Raw events kept for 2 years, aggregates indefinitely
- **Audit log**: Track who accessed analytics data

---

## Performance Considerations

### Real-time Updates (Hot Path)
- `study_events` - Always write immediately (append-only, fast)
- `study_sessions` - Update during session (in-memory, flush periodically)
- `question_attempts` - Write immediately (critical for mastery)
- `material_interactions` - Update every 30s (batch writes)

### Batch Updates (Warm Path)
- `daily_user_stats` - Update at session end + nightly batch
- `topic_mastery` - Update after question attempt (async) + nightly recalc
- `knowledge_gaps` - Daily batch job (intensive computation)

### Cold Storage (Archive)
- `study_events` older than 90 days → Partition to slower storage
- `study_events` older than 2 years → Archive to S3/GCS

---

## Testing Event Tracking

```python
# tests/test_analytics_tracking.py

async def test_session_start_event():
    """Test session start event is tracked correctly."""
    response = await client.post("/api/sessions/start")
    assert response.status_code == 200

    # Check event was created
    event = await db.query(StudyEvent).filter_by(
        user_id=user.id,
        event_type="session_start"
    ).first()
    assert event is not None
    assert event.session_id is not None

    # Check session was created
    session = await db.query(StudySession).get(event.session_id)
    assert session.is_active is True

async def test_question_attempt_tracking():
    """Test question attempt creates all necessary records."""
    response = await client.post(f"/api/questions/{question_id}/submit", json={
        "answer": "A",
        "time_spent": 45
    })
    assert response.status_code == 200

    # Check event
    event = await db.query(StudyEvent).filter_by(
        event_type="question_submit",
        question_id=question_id
    ).first()
    assert event is not None

    # Check attempt record
    attempt = await db.query(QuestionAttempt).filter_by(
        user_id=user.id,
        question_id=question_id
    ).first()
    assert attempt is not None
    assert attempt.time_to_answer_seconds == 45

    # Check mastery updated
    mastery = await db.query(TopicMastery).filter_by(
        user_id=user.id,
        topic_id=question.topic_id
    ).first()
    assert mastery.questions_attempted == 1
```

---

## Summary

**Key Principles**:
1. **Track everything** - Raw events never lie
2. **Immutable events** - Never update, only append
3. **Dual writes** - Events + aggregates updated together
4. **Async when possible** - Don't block user requests
5. **Privacy first** - No PII, anonymized data
6. **Test thoroughly** - Analytics bugs are hard to detect

**Next Steps**:
1. Implement event tracking service
2. Add middleware for automatic tracking
3. Create background jobs for aggregates
4. Build mastery calculation algorithms
5. Design analytics dashboards
