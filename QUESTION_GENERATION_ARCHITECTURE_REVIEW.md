# Question Generation Implementation - Architecture Review

**Reviewer**: Software Architecture Expert
**Date**: 2025-10-12
**Document Reviewed**: `QUESTION_GENERATION_IMPLEMENTATION.md`
**Project Context**: Medical education platform, PostgreSQL + Redis + ChromaDB, FastAPI + React, Personal use → Production scale

---

## Executive Summary

**Overall Assessment**: ✅ **APPROVED with Recommendations**

The implementation plan is **architecturally sound** for a solo developer building toward production scale. The design demonstrates:
- ✅ **Strong separation of concerns** (models, services, API layers)
- ✅ **Smart use of existing infrastructure** (RAG, Codex, async patterns)
- ✅ **Pragmatic scaling decisions** (table partitioning, caching points identified)
- ✅ **Security-conscious design** (input validation, user isolation)

**Key Strengths**:
1. Integration with existing RAG pipeline is seamless
2. Spaced repetition (SM-2) implementation is mathematically correct
3. Database schema properly normalized with good indexing strategy
4. Service layer cleanly separates generation from storage

**Critical Issues**: 🔴 **1 blocking issue**
**Important Issues**: 🟡 **3 architectural improvements needed**
**Optimizations**: 🟢 **5 scaling opportunities**

**Recommendation**: Implement with modifications. The blocking issue must be addressed before Phase 1. The architectural improvements should be implemented in Phase 2-3. The optimizations can wait until you hit actual performance problems.

---

## 🔴 Critical Issues (Must Fix)

### 1. Hash Partitioning for Single User is Premature Optimization ⚠️

**Issue Location**: `user_attempts` table design (lines 240-289)

**The Problem**:
```sql
-- Current design: 8 hash partitions
CREATE TABLE user_attempts (...) PARTITION BY HASH (user_id);
CREATE TABLE user_attempts_p0 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 0);
-- ... 7 more partitions
```

**Why This Is Wrong for Your Use Case**:
1. **Hash partitioning distributes ONE user across multiple partitions**
   - User A's attempts scattered across p0, p1, p2, etc.
   - Defeats the purpose of partitioning for single-user queries
   - PostgreSQL must scan ALL 8 partitions for every query

2. **Hash partitioning is for load balancing, not isolation**
   - Useful for distributing millions of users across partitions
   - NOT useful for isolating individual user data
   - You're adding complexity with zero benefit at 1-100 users

3. **Performance will be WORSE, not better**
   - More partition overhead
   - Query planner can't prune partitions (hash means data is everywhere)
   - More files on disk = more I/O

**What You Should Use**: LIST partitioning by user_id (when you need it)

```sql
-- Better approach: LIST partitioning (but not yet!)
-- Only use this when you have 1000+ active users

CREATE TABLE user_attempts (
    -- same columns
    PRIMARY KEY (user_id, id)
) PARTITION BY LIST (user_id);

-- Create partition per user (or per user group)
CREATE TABLE user_attempts_user_123 PARTITION OF user_attempts
    FOR VALUES IN ('user-uuid-123');
```

**But Actually, For MVP**: **DON'T PARTITION AT ALL**

```sql
-- Start with this (no partitioning)
CREATE TABLE user_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    -- ... rest of columns
);

-- Just add a good index
CREATE INDEX idx_user_attempts_user_question ON user_attempts(user_id, question_id);
CREATE INDEX idx_user_attempts_next_review ON user_attempts(user_id, next_review_date)
    WHERE review_status != 'mastered';
```

**When to Add Partitioning**:
- ✅ When `user_attempts` table exceeds **10 million rows**
- ✅ When you have **1,000+ active users**
- ✅ When single-user queries are slow despite proper indexes
- ❌ Not now (you have 1 user!)

**Partitioning Strategy for Future**:
1. **Phase 1-2 (1-100 users)**: No partitioning
2. **Phase 3 (100-1000 users)**: Consider time-based partitioning (by month)
   - Easier to archive old data
   - Queries naturally filter by date range
3. **Phase 4 (1000+ users)**: Consider LIST partitioning by user cohorts
   - Group users into buckets (power users, casual users, inactive)
   - Partition by cohort, not individual user

**Impact**: 🔴 **Blocking** - Remove partitioning from Phase 1 migration

**Why This Still Scales**:
- PostgreSQL with good indexes handles 100M+ rows easily
- B-tree indexes on `(user_id, next_review_date)` are extremely fast
- Partitioning adds overhead until you actually need it
- You can add partitioning later without downtime (pg_partman)

---

## 🟡 Important Issues (Architectural Improvements)

### 2. Question Generation Prompt Doesn't Use RAG Context ⚠️

**Issue Location**: `generate_questions()` method (lines 678-716, codex_llm.py)

**The Problem**:
```python
# Current implementation (lines 695-698)
prompt = f"""Generate {num_questions} NBME-style USMLE Step 1 multiple choice questions about {topic}.
Difficulty level: {difficulty}/5
Format: Return JSON array with objects containing: question, options (array of 4), correct_index, explanation.
"""
```

**What's Wrong**:
- ❌ **Ignores RAG context completely**
- ❌ Questions generated from general knowledge, not user's materials
- ❌ Can't reference specific concepts from uploaded PDFs
- ❌ Defeats the entire purpose of document-based learning

**The Fix Is Already in the Plan** (lines 1023-1030):
```python
# Step 2: Build prompt
prompt = self._build_prompt(
    context=context,  # ✅ Uses RAG context
    topic=request.topic,
    difficulty=request.difficulty,
    num_questions=request.num_questions,
    user_level=request.user_level,
)
```

**But There's a Gap**:
The `generate_questions()` method in `codex_llm.py` is used directly by the plan, but it doesn't accept `context` parameter.

**Solution**: Refactor `generate_questions()` to accept context

```python
# In codex_llm.py
async def generate_questions(
    self,
    topic: str,
    difficulty: int,
    num_questions: int = 5,
    context: str = "",  # ✅ Add this
    user_level: int = 3,  # ✅ Add this
) -> List[Dict]:
    """Generate NBME-style medical questions using Codex."""

    # Use the better prompt template
    prompt = f"""You are an expert medical educator creating USMLE Step 1 practice questions.

**Context from Study Materials**:
{context if context else "No specific context provided. Generate from general medical knowledge."}

**Task**: Generate {num_questions} high-quality multiple choice questions about **{topic}**.

**Difficulty Level**: {difficulty}/5
**Student Level**: {user_level}/5 (1=beginner, 5=expert medical student)

[... rest of NBME-style prompt from lines 1122-1182 ...]
"""

    chunks = []
    async for chunk in self.generate_completion(prompt, model="gpt-5"):
        chunks.append(chunk)
    response = "".join(chunks)

    # ... rest of parsing logic
```

**Why This Matters**:
- Questions grounded in user's actual study materials
- Can reference specific diagrams, examples from their PDFs
- Personalized to what they've uploaded
- Much higher educational value

**Impact**: 🟡 **Important** - Fix in Phase 2 (Question Generator Service)

---

### 3. Hardcoded Model Name Violates Configuration Design ⚠️

**Issue Location**: Multiple places

**The Problem**:
```python
# Line 701 (codex_llm.py)
async for chunk in self.generate_completion(prompt, model="gpt-5"):

# Line 755 (codex_llm.py)
model="claude-3.5-sonnet",

# Line 1084 (question_generator.py - in the plan)
generation_model=settings.CODEX_DEFAULT_MODEL,  # ✅ This is correct
```

**Why This Violates Architecture**:
Your `config.py` already has:
```python
CODEX_DEFAULT_MODEL: str = "gpt-5"
```

But code hardcodes model names instead of using config.

**The Fix**:
```python
# codex_llm.py - Update generate_questions()
async def generate_questions(
    self,
    topic: str,
    difficulty: int,
    num_questions: int = 5,
    context: str = "",
    user_level: int = 3,
    model: Optional[str] = None,  # ✅ Add this
) -> List[Dict]:
    """Generate NBME-style medical questions using Codex."""
    from app.config import settings

    effective_model = model or settings.CODEX_DEFAULT_MODEL  # ✅ Use config

    # ...
    async for chunk in self.generate_completion(prompt, model=effective_model):
        # ...
```

**Why This Matters**:
- Model pricing changes (GPT-5 might get expensive)
- You might want to A/B test models
- Different models for different difficulty levels
- Can't change models without code changes

**Best Practice**:
```python
# In config.py (add these)
CODEX_DEFAULT_MODEL: str = "gpt-5"
CODEX_QUESTION_GEN_MODEL: str = "gpt-5"  # Separate config for question gen
CODEX_TEACHING_MODEL: str = "claude-3.5-sonnet"  # Different for teaching
CODEX_EMBEDDING_MODEL: str = "text-embedding-004"  # Different for embeddings
```

**Impact**: 🟡 **Important** - Fix in Phase 2, affects operational flexibility

---

### 4. Missing Database Constraints for Data Integrity ⚠️

**Issue Location**: Migration 006 (lines 759-889)

**The Problem**: Schema has checks but missing important constraints

**What's Missing**:

1. **No UNIQUE constraint on user answers**
   ```sql
   -- Current: User can answer same question multiple times simultaneously
   -- Should have: Prevent duplicate attempts within same time window

   -- Add this:
   CREATE UNIQUE INDEX idx_user_attempts_active_session
       ON user_attempts (user_id, question_id, answered_at)
       WHERE answered_at > NOW() - INTERVAL '1 hour';
   ```

2. **No check constraint on time_taken_seconds upper bound**
   ```sql
   -- Current: time_taken_seconds > 0
   -- Should have: time_taken_seconds BETWEEN 1 AND 3600 (max 1 hour)

   CHECK (time_taken_seconds BETWEEN 1 AND 3600)
   ```

3. **No validation that correct_index matches options array length**
   ```sql
   -- Add this check constraint:
   CHECK (
       correct_index >= 0
       AND correct_index < jsonb_array_length(options)
   )
   ```

4. **Missing CASCADE behavior for material deletion**
   ```sql
   -- Current: material_id ON DELETE SET NULL
   -- Problem: Orphaned questions lose their source context

   -- Options:
   -- A) Soft delete: Keep material_id, add is_archived flag
   -- B) CASCADE: Delete questions when material deleted
   -- C) RESTRICT: Prevent material deletion if questions exist

   -- Recommendation: RESTRICT for MVP (preserve questions)
   material_id UUID REFERENCES materials(id) ON DELETE RESTRICT
   ```

**Impact**: 🟡 **Important** - Add in Phase 1 migration to prevent data corruption

---

## 🟢 Optimization Opportunities (Do Later)

### 5. Async vs Sync Question Generation

**Current Design**: Synchronous generation (blocks API request)

```python
# Current flow:
POST /api/questions/generate
  → QuestionGeneratorService.generate_questions()
    → Codex CLI call (2-10 seconds)
    → Parse and validate
    → Save to database
  ← Return questions (total: 5-15 seconds)
```

**Problem**: User waits 5-15 seconds for response

**Better Approach**: Background job with polling

```python
# Better flow:
POST /api/questions/generate
  → Create generation job
  → Return job_id immediately (200ms)

GET /api/questions/jobs/{job_id}
  → Return status (pending/complete/failed)
  → Return questions when ready

# Or WebSocket:
WebSocket /api/questions/generate/stream
  → Send generation events in real-time
  → Stream questions as they're generated
```

**When to Implement**:
- ✅ When users complain about slow generation
- ✅ When you want to generate 20+ questions at once
- ❌ Not for MVP (5 questions in 5-10 seconds is acceptable)

**Implementation Complexity**: Medium
- Need background job queue (Celery or ARQ)
- Need job status tracking
- More complex error handling

**Decision**: Skip for MVP, add in Phase 3

---

### 6. Question Caching Strategy

**Current Design**: No caching mentioned

**Problem**: Regenerating identical questions wastes LLM calls ($$$)

**Caching Opportunities**:

1. **Generated Question Cache** (Redis)
   ```python
   cache_key = f"questions:{topic}:{difficulty}:{hash(context)}"
   # TTL: 24 hours (questions stay fresh)
   ```

2. **RAG Context Cache** (Already exists in rag_service.py)
   - Already caching retrieved chunks
   - Good!

3. **Due Reviews Cache** (Redis)
   ```python
   # Cache the due reviews query (expensive join)
   cache_key = f"due_reviews:{user_id}"
   # TTL: 5 minutes (updates frequently)
   ```

**When to Implement**:
- ✅ After measuring LLM costs
- ✅ After users start generating questions regularly
- ✅ When you have multiple users requesting same topics

**Decision**: Add in Phase 5 (Production Optimizations)

---

### 7. SM-2 Algorithm Parameter Tuning

**Current Design**: Standard SM-2 with fixed parameters

```python
# Line 1294 (from plan)
SM2_MIN_EF = 1.3  # Where is this defined?
```

**Issue**: `SM2_MIN_EF` referenced but not in config.py

**Add to config.py**:
```python
# Spaced Repetition (SM-2 Algorithm)
SM2_MIN_EASINESS: float = 1.3
SM2_MAX_EASINESS: float = 2.5
SM2_INITIAL_EASINESS: float = 2.5
SM2_INITIAL_INTERVAL: int = 1  # Days
SM2_SECOND_INTERVAL: int = 6   # Days
```

**Why Configurable**:
- Different subjects have different retention curves
- Medical terminology vs clinical reasoning
- You might want to A/B test different parameters
- Research suggests medical students need modified intervals

**Optimization**: Use user-specific easiness factors
```python
# Future enhancement
class UserAttempt:
    # Current: Global SM-2 parameters
    # Better: Per-user calibration
    user_calibration_factor: float = 1.0  # Adjusts intervals based on user performance
```

**When to Implement**: After collecting 6 months of data on user retention

---

### 8. Prompt Engineering Versioning

**Current Design**: Prompt template hardcoded in code

**Problem**: Can't A/B test prompts or track quality over time

**Better Approach**: Versioned prompt templates

```python
# In database:
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY,
    template_name VARCHAR(100),  -- "question_gen_v1", "question_gen_v2"
    version INTEGER,
    prompt_template TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

# In code:
async def get_prompt_template(template_name: str) -> str:
    """Get active prompt template for A/B testing."""
    # Could also use feature flags for gradual rollout
```

**Benefits**:
- A/B test different prompt strategies
- Track which prompts produce better questions
- Rollback to previous prompts if quality drops
- Version control for prompt improvements

**When to Implement**: After generating 1,000+ questions and collecting quality metrics

---

### 9. Question Quality Scoring

**Current Design**: Manual `quality_score` field (line 210)

```sql
quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
```

**Problem**: No automated way to calculate quality

**Quality Metrics to Track**:
```python
# Calculate quality based on:
1. Success rate (too easy = bad, too hard = bad)
   - Target: 50-70% success rate

2. Time distribution (too fast = trivial, too slow = unclear)
   - Target: 60-120 seconds

3. Confidence correlation (correct + confident = good)
   - High confidence incorrect = misleading question

4. Flag rate (users flagging as incorrect)
   - > 10% flags = remove question

# Formula:
quality = (
    0.4 * success_rate_score +      # 40% weight
    0.3 * time_distribution_score +  # 30% weight
    0.2 * confidence_score +          # 20% weight
    0.1 * (1 - flag_rate)            # 10% weight
)
```

**When to Implement**:
- After 500+ question attempts
- When you have enough data for statistical significance

---

### 10. Rate Limiting for Question Generation

**Current Design**: No rate limiting mentioned

**Problem**: LLM calls are expensive and slow

**Rate Limiting Strategy**:

1. **User-level limits**
   ```python
   # In Redis
   rate_limit_key = f"question_gen:{user_id}"
   # Limit: 10 generations per hour
   # Limit: 100 questions per day
   ```

2. **IP-level limits** (prevent abuse)
   ```python
   # Limit: 20 generations per hour per IP
   ```

3. **System-level limits** (protect Codex CLI)
   ```python
   # Max concurrent Codex calls: 5
   # Queue additional requests
   ```

**When to Implement**:
- ✅ Before allowing user registration
- ✅ When you have 10+ users
- ❌ Not for solo dev testing

**Impact**: 🟢 Low priority for MVP, critical for production

---

## Scalability Analysis

### Current Design Handles:

| Users | Questions/User | Total Questions | User Attempts/Year | Performance |
|-------|---------------|-----------------|-------------------|-------------|
| 1 | 1,000 | 1K | 10K | ✅ Excellent |
| 10 | 1,000 | 10K | 100K | ✅ Excellent |
| 100 | 1,000 | 100K | 1M | ✅ Good |
| 1,000 | 1,000 | 1M | 10M | ⚠️ Needs optimization |
| 10,000 | 1,000 | 10M | 100M | 🔴 Needs partitioning |

### What Breaks at Each Scale:

**10 Users → 100 Users**:
- ✅ Nothing breaks
- ✅ Standard indexes handle this easily
- ✅ Single PostgreSQL instance sufficient

**100 Users → 1,000 Users**:
- ⚠️ LLM costs become significant ($$$)
- ⚠️ Need question caching
- ⚠️ Consider pre-generating questions for popular topics
- ✅ Database still fine with indexes

**1,000 Users → 10,000 Users**:
- 🔴 `user_attempts` table query performance degrades
- 🔴 Need time-based partitioning (by month)
- 🔴 Need read replicas for analytics queries
- 🔴 Need background job queue for question generation
- 🔴 Need CDN for static question assets

**10,000+ Users**:
- 🔴 Need microservices architecture
- 🔴 Separate question generation service
- 🔴 Dedicated vector DB cluster (ChromaDB → Pinecone/Weaviate)
- 🔴 Multi-region deployment
- 🔴 Elasticsearch for question search

### Cost Analysis (LLM Calls)

**Assumptions**:
- GPT-5 pricing: $0.01 per 1K tokens (estimate)
- Average question generation: 2K tokens output
- Cost per question: ~$0.02

**Monthly Costs**:
| Users | Questions/Month | LLM Cost/Month |
|-------|----------------|----------------|
| 1 | 100 | $2 |
| 10 | 1,000 | $20 |
| 100 | 10,000 | $200 |
| 1,000 | 100,000 | $2,000 |

**Optimization Impact**:
- ✅ Question caching: 50% cost reduction (repeated topics)
- ✅ Pre-generation: 70% cost reduction (popular topics)
- ✅ Batch generation: 20% cost reduction (API efficiency)

**At 1,000 users**: $2,000/month → $300/month with optimizations

---

## Database Design Deep Dive

### Schema Review: Questions Table

**✅ Good Design Decisions**:
1. **UUID primary keys** - Good for distributed systems, prevents enumeration
2. **User isolation** - `user_id` foreign key with CASCADE delete
3. **JSONB for options** - Flexible for varying option formats
4. **Statistics tracking** - `times_answered`, `times_correct` for quality scoring
5. **Source tracking** - `source_chunk_ids` links back to RAG context
6. **Metadata flexibility** - `generation_metadata` for future extensions

**⚠️ Missing Indexes**:
```sql
-- Add these for query performance:
CREATE INDEX idx_questions_user_topic ON questions(user_id, topic);
CREATE INDEX idx_questions_user_difficulty ON questions(user_id, difficulty);

-- For analytics queries:
CREATE INDEX idx_questions_quality ON questions(quality_score DESC)
    WHERE quality_score > 0.7;

-- For finding similar questions (prevent duplicates):
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty, user_id);
```

**🔮 Future Enhancements**:
```sql
-- Add full-text search
ALTER TABLE questions ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', vignette)) STORED;
CREATE INDEX idx_questions_fts ON questions USING GIN(tsv);

-- Add question tags
ALTER TABLE questions ADD COLUMN tags TEXT[];
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
```

---

### Schema Review: User Attempts Table

**✅ Good Design Decisions**:
1. **SM-2 fields** - Complete implementation of spaced repetition
2. **XP tracking** - Good for gamification integration
3. **Confidence tracking** - Essential for quality scoring
4. **Time tracking** - `time_taken_seconds` for difficulty calibration

**🔴 Issues** (see Critical Issue #1):
- Remove hash partitioning
- Use simple table with good indexes

**✅ Index Strategy** (after removing partitioning):
```sql
-- Primary query pattern: Get user's attempts for a question
CREATE INDEX idx_user_attempts_user_question ON user_attempts(user_id, question_id);

-- Due reviews query (most important!)
CREATE INDEX idx_user_attempts_due_reviews
    ON user_attempts(user_id, next_review_date)
    WHERE review_status IN ('learning', 'reviewing');

-- Analytics queries
CREATE INDEX idx_user_attempts_recent
    ON user_attempts(user_id, answered_at DESC);

-- Performance tracking
CREATE INDEX idx_user_attempts_correctness
    ON user_attempts(user_id, is_correct, answered_at);
```

---

## API Design Review

### Endpoint Structure: ✅ RESTful and Clear

```
POST   /api/questions/generate          # ✅ Good: Clear action
GET    /api/questions                   # ✅ Good: List with filters
GET    /api/questions/:id               # ✅ Good: Single resource
POST   /api/questions/:id/answer        # ✅ Good: Action on resource
GET    /api/questions/due               # ⚠️ Should be: /api/questions/due/reviews
DELETE /api/questions/:id               # ✅ Good: Resource deletion
```

**Suggested Improvements**:

1. **Batch operations**:
   ```python
   POST /api/questions/batch-generate
   # Generate multiple question sets at once
   # Request: [{"topic": "cardiology", "num": 5}, {"topic": "neurology", "num": 5}]
   # Response: [{"job_id": "...", "topic": "..."}]
   ```

2. **Question preview before saving**:
   ```python
   POST /api/questions/preview
   # Generate questions but don't save (for review before accepting)
   # Response: Generated questions with "accept" button
   ```

3. **Bulk answer submission**:
   ```python
   POST /api/questions/answers/batch
   # Submit multiple answers at once (for timed quizzes)
   ```

4. **Question collections/decks**:
   ```python
   POST /api/questions/collections
   # Create question collections for specific exam prep
   ```

---

## Integration Points Analysis

### 1. RAG Integration: ✅ Well Designed

**Flow**:
```
User uploads PDF → Document processing → Chunks → ChromaDB
                                                      ↓
Question generation request → Topic → RAG retrieval → Context
                                                      ↓
                                              Question Generator
```

**Strengths**:
- ✅ Uses existing `retrieve_context()` method
- ✅ Tracks source chunks with `source_chunk_ids`
- ✅ Can show users which part of material inspired each question

**Improvement**: Add chunk relevance to question quality
```python
# In Question model
@property
def source_quality(self) -> float:
    """
    Calculate quality based on source chunk relevance.
    Questions from highly relevant chunks are higher quality.
    """
    if not self.generation_metadata:
        return 0.5

    chunk_distances = self.generation_metadata.get('chunk_distances', [])
    if not chunk_distances:
        return 0.5

    # Average distance (lower is better)
    avg_distance = sum(chunk_distances) / len(chunk_distances)
    # Convert to quality score (0-1)
    return max(0, 1 - avg_distance)
```

---

### 2. Gamification Integration: ⚠️ Needs Clarification

**Current Design**:
```python
# XP calculation (lines 1698-1712)
xp_earned = int(base_xp * difficulty_multipliers.get(question.difficulty, 1.0))
if is_correct:
    xp_earned += 5
if request.confidence >= 4:
    xp_earned += 3
```

**Issue**: User model doesn't have XP/level fields

**From user.py**:
```python
class User(Base):
    id = Column(UUID, primary_key=True)
    email = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    # ❌ No xp, level, streak fields!
```

**Missing Migration**: Need to add gamification fields to User model

```sql
-- Add to users table:
ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_activity_date DATE;

-- Index for leaderboards
CREATE INDEX idx_users_xp ON users(xp DESC);
```

**Or Better**: Separate `user_profiles` table
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Impact**: 🟡 Need to decide: Modify User model or create UserProfile table?

---

### 3. Analytics Integration: ✅ Good Tracking Points

**Data Points Captured**:
- ✅ Question generation metadata
- ✅ Answer attempts with confidence
- ✅ Time taken per question
- ✅ XP earned per attempt
- ✅ Review status progression

**Analytics Queries Enabled**:
```python
# User progress over time
SELECT DATE(answered_at), COUNT(*), AVG(is_correct::int)
FROM user_attempts
WHERE user_id = ?
GROUP BY DATE(answered_at);

# Topic mastery
SELECT q.topic,
       COUNT(*) as total,
       SUM(ua.is_correct::int) as correct,
       AVG(ua.confidence) as avg_confidence
FROM user_attempts ua
JOIN questions q ON ua.question_id = q.id
WHERE ua.user_id = ?
GROUP BY q.topic;

# Spaced repetition effectiveness
SELECT review_status,
       COUNT(*),
       AVG(sm2_interval),
       AVG(sm2_easiness_factor)
FROM user_attempts
WHERE user_id = ?
GROUP BY review_status;
```

**Future Analytics**:
- Learning curve (time to mastery per topic)
- Prediction of exam readiness
- Weak area identification
- Optimal study time recommendations

---

## Security Considerations

### Input Validation: ✅ Well Covered

**Already Implemented** (from codex_llm.py):
- ✅ Prompt sanitization (lines 116-199)
- ✅ Shell metacharacter filtering
- ✅ Null byte detection
- ✅ Length limits (50KB)
- ✅ Model name validation

**Additional Recommendations**:

1. **Rate limiting on question generation** (expensive operation)
   ```python
   @router.post("/generate")
   @rate_limit(max_requests=10, window=3600)  # 10 generations per hour
   async def generate_questions(...):
   ```

2. **Validation on answer submission** (prevent cheating)
   ```python
   # Check that question belongs to user
   if question.user_id != current_user.id:
       raise HTTPException(403, "Not your question")

   # Check that question wasn't just answered (prevent spam)
   last_attempt = get_last_attempt(user_id, question_id)
   if last_attempt and (now - last_attempt.answered_at) < timedelta(seconds=5):
       raise HTTPException(429, "Too fast! Wait before re-answering")
   ```

3. **Content filtering on generated questions**
   ```python
   # Check for inappropriate content in generated questions
   # (LLMs can sometimes generate unexpected content)
   def validate_question_content(question: Dict) -> bool:
       # Check for profanity, personal info, etc.
       prohibited_terms = [...]  # Load from config
       content = f"{question['vignette']} {question['explanation']}"
       return not any(term in content.lower() for term in prohibited_terms)
   ```

---

## Testing Strategy Assessment

**From Plan** (lines 1915-2041):
- ✅ Unit tests for question generator
- ✅ Unit tests for SM-2 algorithm
- ✅ Mocking external dependencies

**Missing Test Coverage**:

1. **Integration tests**:
   ```python
   async def test_end_to_end_question_workflow():
       """Test full workflow: upload PDF → generate questions → answer → review."""
       # Upload material
       # Generate questions from material
       # Answer questions
       # Check spaced repetition scheduling
       # Verify due reviews appear
   ```

2. **Performance tests**:
   ```python
   async def test_question_generation_performance():
       """Ensure generation completes within SLA."""
       start = time.time()
       questions = await generate_questions(topic="cardiology", num=10)
       duration = time.time() - start
       assert duration < 15.0  # Must complete in 15 seconds
   ```

3. **Data integrity tests**:
   ```python
   async def test_user_isolation():
       """Ensure users can't access other users' questions."""
       user1_question = await create_question(user_id=user1.id)
       response = await api_client.get(
           f"/api/questions/{user1_question.id}",
           headers={"Authorization": f"Bearer {user2_token}"}
       )
       assert response.status_code == 404  # Not found (not 403!)
   ```

4. **Edge case tests**:
   ```python
   async def test_malformed_codex_response():
       """Handle Codex returning invalid JSON."""
       with mock_codex_response("Not JSON at all"):
           with pytest.raises(ValueError, match="Failed to parse"):
               await generate_questions(topic="test")
   ```

---

## Deployment Considerations

### Phase 1 (MVP): Single Server
```yaml
# docker-compose.yml
services:
  backend:
    image: studyin-backend:latest
    environment:
      - CODEX_CLI_PATH=/usr/local/bin/codex
      - CODEX_DEFAULT_MODEL=gpt-5
    volumes:
      - ./uploads:/app/uploads
      - ./chroma_data:/app/chroma_data
    depends_on:
      - postgres
      - redis
      - chromadb
```

### Phase 2 (100 users): Load Balanced
```yaml
# Add nginx load balancer
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - backend-1
    - backend-2
```

### Phase 3 (1000 users): Managed Services
```yaml
# Move to managed services
DATABASE_URL: ${RDS_POSTGRES_URL}
REDIS_URL: ${ELASTICACHE_URL}
CHROMADB_URL: ${CHROMADB_CLOUD_URL}

# Separate question generation service
question-generator:
  image: studyin-question-gen:latest
  replicas: 3
  resources:
    limits:
      memory: 2G
      cpu: 1000m
```

---

## Recommendations Summary

### Phase 0 (Before Starting):
1. 🔴 **Remove hash partitioning from user_attempts** (Critical)
2. 🟡 **Add gamification fields to User model** (Important)
3. 🟡 **Add missing database constraints** (Important)

### Phase 1 (Database Setup):
- ✅ Use the models as designed (without partitioning)
- ✅ Add recommended indexes
- ✅ Add data integrity constraints
- ✅ Run migration and verify

### Phase 2 (Question Generator Service):
- 🟡 **Fix generate_questions() to use RAG context** (Important)
- 🟡 **Make model names configurable** (Important)
- ✅ Implement as designed otherwise

### Phase 3 (Spaced Repetition):
- ✅ SM-2 implementation is correct, use as-is
- ✅ Add SM-2 config to settings.py
- ✅ Test with real questions

### Phase 4 (API Endpoints):
- ✅ Endpoint design is good
- ✅ Add rate limiting before production
- ✅ Add user isolation tests

### Phase 5 (Testing):
- ✅ Add the missing test categories
- ✅ Add performance benchmarks
- ✅ Test with real Codex CLI (not just mocks)

### Future (Post-MVP):
- 🟢 Add question caching (when costs matter)
- 🟢 Add background job queue (when users complain about speed)
- 🟢 Add time-based partitioning (when table exceeds 10M rows)
- 🟢 Add quality scoring (when you have enough data)

---

## Conclusion

**Overall Architecture Grade**: **A- (Excellent for solo dev, production-ready foundation)**

**What You Did Right**:
1. ✅ Clean separation of concerns (models → services → API)
2. ✅ Integration with existing infrastructure is seamless
3. ✅ SM-2 algorithm implementation is correct
4. ✅ Security considerations are thorough
5. ✅ Schema design is well-normalized
6. ✅ RAG integration is well thought out

**What Needs Fixing**:
1. 🔴 Remove hash partitioning (premature optimization)
2. 🟡 Fix question generation to use RAG context
3. 🟡 Make model names configurable
4. 🟡 Add gamification fields to User model

**What You Can Skip (For Now)**:
1. 🟢 Caching (add when costs matter)
2. 🟢 Background jobs (add when users complain)
3. 🟢 Advanced analytics (add when you have data)
4. 🟢 Microservices (add when you have scale problems)

**Time Estimate Validation**:
- Original estimate: 8-10 hours
- With fixes: 9-12 hours (1-2 hours for architecture changes)
- Still reasonable for weekend implementation

**Go/No-Go Decision**: ✅ **GO** (with the blocking fix)

You've designed a solid system. Fix the partitioning issue, implement the RAG context integration properly, and you'll have a production-quality question generation system that scales from 1 to 1,000 users without major rewrites.

---

## Next Steps

1. **Read this review** and decide which fixes to implement
2. **Update the implementation plan** with architecture changes
3. **Start with Phase 1** (database setup with fixes)
4. **Test each phase** before moving to the next
5. **Come back to optimizations** when you have real performance data

**Questions?** Ask about any architectural decision. I can provide more detail on:
- Alternative database design approaches
- Caching strategies for different scales
- Microservices migration path
- Cost optimization strategies
- Security hardening
- Testing strategies

Good luck with implementation! 🚀
