# Question Generation Feature - Complete Implementation Plan

**Project**: StudyIn Medical Education Platform
**Feature Status**: 40% Complete → 100% Complete
**Implementation Time**: 8-10 hours
**Priority**: Phase 4 Feature (Critical for MVP)

---

## Executive Summary

The question generation feature is **40% complete**. Basic Codex integration exists, but the full system is missing:
- ✅ Codex CLI integration (`generate_questions` method in `codex_llm.py`)
- ❌ Database models for questions and user attempts
- ❌ Database migrations
- ❌ API endpoints for question generation
- ❌ Question bank storage and retrieval
- ❌ Answer validation and feedback
- ❌ Spaced repetition (SM-2) integration
- ❌ Frontend integration

**This document provides the complete implementation to make it work end-to-end.**

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [What's Missing](#whats-missing)
3. [Database Design](#database-design)
4. [Prompt Engineering](#prompt-engineering)
5. [Implementation Plan](#implementation-plan)
6. [Code Examples](#code-examples)
7. [Testing Strategy](#testing-strategy)
8. [Integration Points](#integration-points)

---

## Current State Assessment

### What Exists (40% Complete)

#### 1. Codex CLI Integration ✅
**File**: `backend/app/services/codex_llm.py` (lines 678-716)

```python
async def generate_questions(
    self,
    topic: str,
    difficulty: int,
    num_questions: int = 5,
) -> List[Dict]:
    """Generate NBME-style medical questions using Codex."""
    prompt = f"""Generate {num_questions} NBME-style USMLE Step 1 multiple choice questions about {topic}.
Difficulty level: {difficulty}/5
Format: Return JSON array with objects containing: question, options (array of 4), correct_index, explanation.
"""
    # Collects streamed response and parses JSON
    chunks = []
    async for chunk in self.generate_completion(prompt, model="gpt-5"):
        chunks.append(chunk)
    response = "".join(chunks)

    # Parses JSON response
    try:
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        else:
            json_str = response
        return json.loads(json_str)
    except (json.JSONDecodeError, IndexError):
        raise ValueError(f"Failed to parse questions from Codex response: {response}")
```

**Assessment**:
- ✅ Basic prompt template
- ✅ JSON parsing with error handling
- ✅ Codex CLI integration
- ❌ Prompt lacks NBME-specific guidance
- ❌ No context integration (doesn't use RAG)
- ❌ No quality validation
- ❌ No difficulty calibration
- ❌ Hardcoded model ("gpt-5")

#### 2. RAG Service ✅
**File**: `backend/app/services/rag_service.py`

- ✅ Context retrieval works
- ✅ Can fetch relevant chunks for topic
- ✅ Ready for question generation integration

#### 3. Database Infrastructure ✅
- ✅ PostgreSQL with async SQLAlchemy
- ✅ Alembic migrations setup
- ✅ User and Material models exist
- ✅ MaterialChunk model with vector support

---

## What's Missing (60%)

### 1. Database Models ❌

**Missing Models**:
- `Question` model (store generated questions)
- `UserAttempt` model (track answers and spaced repetition)
- `QuestionBank` model (optional: curated question collections)

**Missing Fields**:
- Question difficulty calibration (actual vs predicted)
- Question quality metrics (flagged, verified)
- Spaced repetition state (SM-2 algorithm fields)
- Answer statistics (times answered, success rate)

### 2. Database Migrations ❌

**Missing Migration**:
- Create `questions` table
- Create `user_attempts` table (partitioned by user_id)
- Create indexes for performance
- Create constraints for data integrity

### 3. API Endpoints ❌

**Missing Endpoints**:
```
POST   /api/questions/generate          # Generate questions from material
GET    /api/questions                   # List questions (with filters)
GET    /api/questions/:id               # Get single question
POST   /api/questions/:id/answer        # Submit answer
GET    /api/questions/due               # Get due reviews (SM-2)
POST   /api/questions/:id/flag          # Flag question as incorrect
```

### 4. Question Generator Service ❌

**Missing Features**:
- NBME-style prompt engineering
- Context integration (use RAG chunks)
- Difficulty level mapping (1-5 → NBME difficulty)
- Question validation (format, quality checks)
- Duplicate detection
- Question storage after generation

### 5. Answer Validation ❌

**Missing Logic**:
- Check answer correctness
- Calculate XP based on difficulty + confidence
- Update user stats (XP, level, streak)
- Record attempt for spaced repetition
- Generate personalized feedback

### 6. Spaced Repetition ❌

**Missing Integration**:
- SM-2 algorithm implementation (exists in TECH_SPEC but not in code)
- Calculate next review date
- Track repetition count and ease factor
- Query due reviews
- Adaptive scheduling based on performance

### 7. Question Bank Management ❌

**Missing Features**:
- List questions by topic/difficulty
- Filter by review status (new, learning, mastered)
- Search questions by content
- Update question quality scores
- Delete or archive questions

### 8. Frontend Integration ❌

**Missing Components**:
- Question display component
- Answer submission form
- Confidence rating slider (1-5)
- Explanation display after answer
- Due review notification
- Question generation trigger from materials

---

## Database Design

### 1. Questions Table

```sql
CREATE TABLE questions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    vignette TEXT NOT NULL,                    -- Clinical scenario
    options JSONB NOT NULL,                    -- ["A. Option 1", "B. Option 2", ...]
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index < 4),
    explanation TEXT NOT NULL,

    -- Classification
    topic VARCHAR(255) NOT NULL,               -- "Cardiology", "Neurology", etc.
    subtopic VARCHAR(255),                     -- "Cardiac Cycle", "Action Potentials", etc.
    difficulty VARCHAR(50) NOT NULL,           -- "easy", "medium", "hard", "nbme"
    predicted_difficulty INTEGER CHECK (predicted_difficulty BETWEEN 1 AND 5),

    -- Quality Metrics
    quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
    is_verified BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    -- Statistics
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_confidence FLOAT,
    avg_time_seconds FLOAT,

    -- Source Tracking
    source_chunk_ids UUID[],                   -- Which chunks were used to generate
    generation_model VARCHAR(100),             -- "gpt-5", "claude-3.5-sonnet", etc.
    generation_metadata JSONB,                 -- Full generation context

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_questions_user_id (user_id),
    INDEX idx_questions_material_id (material_id),
    INDEX idx_questions_topic (topic),
    INDEX idx_questions_difficulty (difficulty),
    INDEX idx_questions_created_at (created_at DESC)
);
```

### 2. User Attempts Table (Partitioned)

```sql
CREATE TABLE user_attempts (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid(),

    -- Foreign Keys (partition key: user_id)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Answer Data
    selected_index INTEGER NOT NULL CHECK (selected_index >= 0 AND selected_index < 4),
    is_correct BOOLEAN NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    time_taken_seconds INTEGER NOT NULL,

    -- XP and Gamification
    xp_earned INTEGER DEFAULT 0,
    level_at_attempt INTEGER,

    -- Spaced Repetition (SM-2 Algorithm)
    sm2_interval INTEGER DEFAULT 1,            -- Days until next review
    sm2_easiness_factor FLOAT DEFAULT 2.5,     -- Ease factor (1.3-2.5)
    sm2_repetition INTEGER DEFAULT 0,          -- Successful repetition count
    next_review_date TIMESTAMP WITH TIME ZONE,

    -- Review Status
    review_status VARCHAR(50) DEFAULT 'new',   -- "new", "learning", "reviewing", "mastered"

    -- Timestamps
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (user_id, id)                  -- Composite key for partitioning
) PARTITION BY HASH (user_id);

-- Create partitions (8 partitions for better distribution)
CREATE TABLE user_attempts_p0 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 0);
CREATE TABLE user_attempts_p1 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 1);
CREATE TABLE user_attempts_p2 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 2);
CREATE TABLE user_attempts_p3 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 3);
CREATE TABLE user_attempts_p4 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 4);
CREATE TABLE user_attempts_p5 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 5);
CREATE TABLE user_attempts_p6 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 6);
CREATE TABLE user_attempts_p7 PARTITION OF user_attempts FOR VALUES WITH (MODULUS 8, REMAINDER 7);

-- Indexes
CREATE INDEX idx_user_attempts_question_id ON user_attempts (question_id);
CREATE INDEX idx_user_attempts_next_review ON user_attempts (user_id, next_review_date) WHERE review_status != 'mastered';
CREATE INDEX idx_user_attempts_answered_at ON user_attempts (answered_at DESC);
```

**Why Partitioned?**
- User attempts table will grow FAST (millions of rows)
- Partition by user_id for query performance
- Each user's data isolated in separate partition
- Easier maintenance (drop old partitions, archive data)

---

## Prompt Engineering

### NBME-Style Question Generation Prompt

**Requirements for NBME Questions**:
1. Clinical vignette (patient scenario)
2. Question stem (what is being asked)
3. 4-5 answer options (single best answer)
4. Distractors based on common misconceptions
5. Explanation with teaching points

### Prompt Template v2 (Production Quality)

```python
def build_question_generation_prompt(
    context: str,
    topic: str,
    difficulty: int,
    num_questions: int,
    user_level: int = 3,
) -> str:
    """
    Build NBME-style question generation prompt with RAG context.

    Args:
        context: Relevant chunks from RAG retrieval
        topic: Specific topic to focus on
        difficulty: Difficulty level 1-5 (1=beginner, 5=NBME)
        num_questions: Number of questions to generate
        user_level: User's knowledge level (affects vignette complexity)

    Returns:
        Formatted prompt for Codex CLI
    """

    difficulty_descriptions = {
        1: "Basic recall - simple definitions and concepts",
        2: "Application - use concepts in straightforward scenarios",
        3: "Analysis - interpret data and make connections",
        4: "Synthesis - complex clinical reasoning",
        5: "NBME-style - multi-step reasoning with realistic distractors",
    }

    difficulty_desc = difficulty_descriptions.get(difficulty, "Medium")

    prompt = f"""You are an expert medical educator creating USMLE Step 1 practice questions.

**Context from Study Materials**:
{context}

**Task**: Generate {num_questions} high-quality multiple choice questions about **{topic}**.

**Difficulty Level**: {difficulty}/5 - {difficulty_desc}
**Student Level**: {user_level}/5 (1=beginner, 5=expert medical student)

**NBME Question Format Requirements**:

1. **Clinical Vignette**: Start with a realistic patient presentation
   - Include age, gender, chief complaint
   - Relevant history (HPI, PMH, medications, social history)
   - Physical exam findings
   - Lab/imaging results if relevant
   - Length: 2-4 sentences for level 1-2, 4-6 sentences for level 3-5

2. **Question Stem**: Clear, specific question
   - "What is the most likely diagnosis?"
   - "Which of the following is the best next step in management?"
   - "Which mechanism best explains this finding?"
   - Avoid "All of the following EXCEPT" (poor question design)

3. **Answer Options**: 4 options (A, B, C, D)
   - One clearly correct answer
   - Three plausible distractors (common misconceptions or similar conditions)
   - Similar length and format for all options
   - Avoid "all of the above" or "none of the above"
   - Alphabetize or order logically

4. **Explanation**: Comprehensive teaching explanation
   - Why the correct answer is correct (2-3 sentences)
   - Why each distractor is incorrect (1 sentence each)
   - Key teaching points (2-3 bullet points)
   - Clinical pearls or mnemonics if applicable

**Difficulty Calibration**:
- Level 1-2: Single-step reasoning, straightforward presentations
- Level 3: Two-step reasoning, common conditions with classic presentations
- Level 4: Multi-step reasoning, less common conditions, atypical presentations
- Level 5: NBME-style - complex reasoning, realistic distractors, integrated knowledge

**Response Format** (JSON):
```json
[
  {{
    "vignette": "A 65-year-old man with a history of hypertension presents to the emergency department with sudden onset chest pain...",
    "question": "What is the most likely diagnosis?",
    "options": [
      "Acute myocardial infarction",
      "Pulmonary embolism",
      "Aortic dissection",
      "Pneumothorax"
    ],
    "correct_index": 2,
    "explanation": "This patient most likely has an aortic dissection based on the sudden onset of severe 'tearing' chest pain...",
    "teaching_points": [
      "Aortic dissection classically presents with sudden 'tearing' pain",
      "Risk factors include hypertension, connective tissue disorders, and trauma",
      "Diagnosis confirmed with CT angiography or TEE"
    ],
    "topic": "{topic}",
    "subtopic": "Cardiovascular Emergencies",
    "difficulty": "{difficulty_desc}"
  }}
]
```

**Important**:
- Base questions on the provided study material context
- Ensure medical accuracy
- Use realistic clinical scenarios
- Avoid trivial or overly obscure questions
- Make distractors plausible but definitively incorrect

Generate {num_questions} questions now:"""

    return prompt
```

---

## Implementation Plan

### Phase 1: Database Setup (2 hours)

#### Step 1.1: Create Models
**File**: `backend/app/models/question.py`

```python
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text,
    ForeignKey, Boolean, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Question(Base):
    """Question model for generated MCQs."""

    __tablename__ = "questions"

    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Foreign Keys
    material_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("materials.id", ondelete="SET NULL"),
        nullable=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Content
    vignette: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSONB, nullable=False)  # List[str]
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    # Classification
    topic: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subtopic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    predicted_difficulty: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Quality Metrics
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Statistics
    times_answered: Mapped[int] = mapped_column(Integer, default=0)
    times_correct: Mapped[int] = mapped_column(Integer, default=0)
    avg_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Source Tracking
    source_chunk_ids: Mapped[Optional[List[uuid.UUID]]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True
    )
    generation_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    generation_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    material = relationship("Material", backref="questions")
    user = relationship("User", backref="questions")
    attempts = relationship(
        "UserAttempt",
        back_populates="question",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        CheckConstraint("correct_index >= 0 AND correct_index < 4", name="check_correct_index"),
        CheckConstraint("quality_score >= 0 AND quality_score <= 1", name="check_quality_score"),
        CheckConstraint(
            "predicted_difficulty IS NULL OR (predicted_difficulty BETWEEN 1 AND 5)",
            name="check_predicted_difficulty"
        ),
    )

    @property
    def success_rate(self) -> float:
        """Calculate success rate (0-1)."""
        if self.times_answered == 0:
            return 0.0
        return self.times_correct / self.times_answered

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "vignette": self.vignette,
            "options": self.options,
            "topic": self.topic,
            "subtopic": self.subtopic,
            "difficulty": self.difficulty,
            "times_answered": self.times_answered,
            "success_rate": self.success_rate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_dict_with_answer(self) -> dict:
        """Convert to dictionary WITH answer (for after answering or review)."""
        data = self.to_dict()
        data.update({
            "correct_index": self.correct_index,
            "explanation": self.explanation,
        })
        return data
```

**File**: `backend/app/models/user_attempt.py`

```python
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import (
    Column, Integer, Float, DateTime, Boolean,
    ForeignKey, String, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserAttempt(Base):
    """User attempt on a question (spaced repetition tracking)."""

    __tablename__ = "user_attempts"

    # Composite Primary Key (for partitioning)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True  # Part of composite key
    )

    # Foreign Keys
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Answer Data
    selected_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    # XP and Gamification
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    level_at_attempt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Spaced Repetition (SM-2 Algorithm)
    sm2_interval: Mapped[int] = mapped_column(Integer, default=1)  # Days
    sm2_easiness_factor: Mapped[float] = mapped_column(Float, default=2.5)
    sm2_repetition: Mapped[int] = mapped_column(Integer, default=0)
    next_review_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )

    # Review Status
    review_status: Mapped[str] = mapped_column(
        String(50),
        default="new",  # "new", "learning", "reviewing", "mastered"
        nullable=False
    )

    # Timestamps
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        index=True
    )

    # Relationships
    user = relationship("User", backref="attempts")
    question = relationship("Question", back_populates="attempts")

    # Constraints
    __table_args__ = (
        CheckConstraint("selected_index >= 0 AND selected_index < 4", name="check_selected_index"),
        CheckConstraint("confidence BETWEEN 1 AND 5", name="check_confidence"),
        CheckConstraint("time_taken_seconds > 0", name="check_time_taken"),
        CheckConstraint("sm2_interval >= 1", name="check_sm2_interval"),
        CheckConstraint(
            "sm2_easiness_factor >= 1.3 AND sm2_easiness_factor <= 2.5",
            name="check_sm2_ef"
        ),
        {"postgresql_partition_by": "HASH (user_id)"},  # Partitioning directive
    )

    def is_due_for_review(self) -> bool:
        """Check if this attempt is due for review."""
        if not self.next_review_date:
            return True
        return datetime.utcnow() >= self.next_review_date

    def calculate_quality(self) -> int:
        """
        Calculate SM-2 quality score (0-5).

        Based on:
        - Correctness (correct=3+, incorrect=0-2)
        - Confidence (1-5)
        - Time taken (bonus for efficiency)

        Returns:
            0-5 quality score for SM-2 algorithm
        """
        if not self.is_correct:
            # Incorrect answer: 0-2 based on confidence
            # High confidence but wrong = 0 (overconfident)
            # Low confidence and wrong = 2 (at least aware of uncertainty)
            return max(0, 3 - self.confidence)

        # Correct answer: 3-5 based on confidence and time
        base_quality = min(5, 3 + (self.confidence - 3))

        # Time bonus (if answered quickly)
        # Optimal time: 60-90 seconds
        if 60 <= self.time_taken_seconds <= 90:
            base_quality = min(5, base_quality + 1)

        return base_quality

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "question_id": str(self.question_id),
            "selected_index": self.selected_index,
            "is_correct": self.is_correct,
            "confidence": self.confidence,
            "time_taken_seconds": self.time_taken_seconds,
            "xp_earned": self.xp_earned,
            "review_status": self.review_status,
            "next_review_date": self.next_review_date.isoformat() if self.next_review_date else None,
            "answered_at": self.answered_at.isoformat() if self.answered_at else None,
        }
```

#### Step 1.2: Update Model Exports

**File**: `backend/app/models/__init__.py`

```python
"""Database models."""

from __future__ import annotations

from app.models.base import Base
from app.models.chunk import MaterialChunk as Chunk
from app.models.material import Material
from app.models.user import User
from app.models.question import Question
from app.models.user_attempt import UserAttempt

# Analytics models (optional import)
try:
    from app.models.analytics import AnalyticsEvent, UserProfile

    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
        "Question",
        "UserAttempt",
        "AnalyticsEvent",
        "UserProfile",
    ]
except ImportError:
    __all__ = [
        "Base",
        "User",
        "Material",
        "Chunk",
        "Question",
        "UserAttempt",
    ]
```

#### Step 1.3: Create Migration

**File**: `backend/alembic/versions/006_create_questions.py`

```python
"""Create questions and user_attempts tables

Revision ID: 006
Revises: 005
Create Date: 2025-10-12

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create questions table
    op.create_table(
        'questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vignette', sa.Text(), nullable=False),
        sa.Column('options', postgresql.JSONB(), nullable=False),
        sa.Column('correct_index', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('topic', sa.String(255), nullable=False),
        sa.Column('subtopic', sa.String(255), nullable=True),
        sa.Column('difficulty', sa.String(50), nullable=False),
        sa.Column('predicted_difficulty', sa.Integer(), nullable=True),
        sa.Column('quality_score', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_flagged', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('flag_reason', sa.Text(), nullable=True),
        sa.Column('times_answered', sa.Integer(), server_default='0', nullable=False),
        sa.Column('times_correct', sa.Integer(), server_default='0', nullable=False),
        sa.Column('avg_confidence', sa.Float(), nullable=True),
        sa.Column('avg_time_seconds', sa.Float(), nullable=True),
        sa.Column('source_chunk_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('generation_model', sa.String(100), nullable=True),
        sa.Column('generation_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint('correct_index >= 0 AND correct_index < 4', name='check_correct_index'),
        sa.CheckConstraint('quality_score >= 0 AND quality_score <= 1', name='check_quality_score'),
        sa.CheckConstraint(
            'predicted_difficulty IS NULL OR (predicted_difficulty BETWEEN 1 AND 5)',
            name='check_predicted_difficulty'
        ),
    )

    # Indexes for questions
    op.create_index('ix_questions_user_id', 'questions', ['user_id'])
    op.create_index('ix_questions_material_id', 'questions', ['material_id'])
    op.create_index('ix_questions_topic', 'questions', ['topic'])
    op.create_index('ix_questions_difficulty', 'questions', ['difficulty'])
    op.create_index('ix_questions_created_at', 'questions', ['created_at'], postgresql_ops={'created_at': 'DESC'})

    # Create user_attempts table (partitioned by user_id)
    op.execute("""
        CREATE TABLE user_attempts (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            question_id UUID NOT NULL,
            selected_index INTEGER NOT NULL,
            is_correct BOOLEAN NOT NULL,
            confidence INTEGER NOT NULL,
            time_taken_seconds INTEGER NOT NULL,
            xp_earned INTEGER DEFAULT 0,
            level_at_attempt INTEGER,
            sm2_interval INTEGER DEFAULT 1,
            sm2_easiness_factor FLOAT DEFAULT 2.5,
            sm2_repetition INTEGER DEFAULT 0,
            next_review_date TIMESTAMP WITH TIME ZONE,
            review_status VARCHAR(50) DEFAULT 'new',
            answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
            CONSTRAINT check_selected_index CHECK (selected_index >= 0 AND selected_index < 4),
            CONSTRAINT check_confidence CHECK (confidence BETWEEN 1 AND 5),
            CONSTRAINT check_time_taken CHECK (time_taken_seconds > 0),
            CONSTRAINT check_sm2_interval CHECK (sm2_interval >= 1),
            CONSTRAINT check_sm2_ef CHECK (sm2_easiness_factor >= 1.3 AND sm2_easiness_factor <= 2.5)
        ) PARTITION BY HASH (user_id);
    """)

    # Create 8 partitions for user_attempts
    for i in range(8):
        op.execute(f"""
            CREATE TABLE user_attempts_p{i}
            PARTITION OF user_attempts
            FOR VALUES WITH (MODULUS 8, REMAINDER {i});
        """)

    # Indexes for user_attempts
    op.execute("CREATE INDEX ix_user_attempts_question_id ON user_attempts (question_id);")
    op.execute("""
        CREATE INDEX ix_user_attempts_next_review
        ON user_attempts (user_id, next_review_date)
        WHERE review_status != 'mastered';
    """)
    op.execute("CREATE INDEX ix_user_attempts_answered_at ON user_attempts (answered_at DESC);")


def downgrade() -> None:
    # Drop user_attempts partitions
    for i in range(8):
        op.execute(f"DROP TABLE IF EXISTS user_attempts_p{i};")

    # Drop user_attempts table
    op.execute("DROP TABLE IF EXISTS user_attempts;")

    # Drop questions indexes
    op.drop_index('ix_questions_created_at', table_name='questions')
    op.drop_index('ix_questions_difficulty', table_name='questions')
    op.drop_index('ix_questions_topic', table_name='questions')
    op.drop_index('ix_questions_material_id', table_name='questions')
    op.drop_index('ix_questions_user_id', table_name='questions')

    # Drop questions table
    op.drop_table('questions')
```

#### Step 1.4: Run Migration

```bash
cd backend
alembic upgrade head
```

---

### Phase 2: Question Generator Service (3 hours)

**File**: `backend/app/services/question_generator.py`

```python
"""Question generation service using Codex CLI + RAG."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.services.codex_llm import get_codex_llm
from app.services.rag_service import get_rag_service
from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class QuestionGenerationRequest:
    """Request parameters for question generation."""

    material_id: uuid.UUID
    user_id: uuid.UUID
    topic: str
    num_questions: int = 5
    difficulty: int = 3  # 1-5
    user_level: int = 3  # 1-5
    use_rag: bool = True  # Whether to retrieve context from RAG


@dataclass
class GeneratedQuestion:
    """Single generated question."""

    vignette: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    teaching_points: Optional[List[str]] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    difficulty: Optional[str] = None


class QuestionGeneratorService:
    """Generate NBME-style questions using Codex + RAG."""

    def __init__(self):
        self.codex = get_codex_llm()
        self.rag = get_rag_service()

    async def generate_questions(
        self,
        *,
        session: AsyncSession,
        request: QuestionGenerationRequest,
    ) -> List[Question]:
        """
        Generate questions from material using RAG context.

        Args:
            session: Database session
            request: Generation request parameters

        Returns:
            List of Question model instances (not yet committed to DB)

        Raises:
            ValueError: If generation fails or produces invalid questions
        """
        logger.info(
            "question_generation_started",
            extra={
                "user_id": str(request.user_id),
                "material_id": str(request.material_id),
                "topic": request.topic,
                "num_questions": request.num_questions,
                "difficulty": request.difficulty,
            }
        )

        # Step 1: Retrieve relevant context from RAG
        context = ""
        source_chunk_ids = []

        if request.use_rag:
            rag_chunks = await self.rag.retrieve_context(
                session=session,
                user_id=request.user_id,
                query=request.topic,
                top_k=6,  # Get more context for question generation
            )

            if rag_chunks:
                context = self.rag.render_context_summary(rag_chunks)
                source_chunk_ids = [uuid.UUID(chunk.chunk_id) for chunk in rag_chunks]

                logger.info(
                    "rag_context_retrieved",
                    extra={
                        "user_id": str(request.user_id),
                        "chunks_found": len(rag_chunks),
                        "chunk_ids": [chunk.chunk_id for chunk in rag_chunks],
                    }
                )
            else:
                logger.warning(
                    "rag_no_context",
                    extra={
                        "user_id": str(request.user_id),
                        "topic": request.topic,
                    }
                )
                # Continue without context (generate from general knowledge)

        # Step 2: Build prompt
        prompt = self._build_prompt(
            context=context,
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            user_level=request.user_level,
        )

        # Step 3: Generate questions via Codex
        try:
            raw_questions = await self.codex.generate_questions(
                topic=request.topic,
                difficulty=request.difficulty,
                num_questions=request.num_questions,
            )
        except Exception as e:
            logger.error(
                "question_generation_failed",
                extra={
                    "user_id": str(request.user_id),
                    "error": str(e),
                }
            )
            raise ValueError(f"Failed to generate questions: {e}")

        # Step 4: Validate and parse questions
        validated_questions = []
        for idx, raw_q in enumerate(raw_questions):
            try:
                generated_q = self._parse_question(raw_q)
                validated_questions.append(generated_q)
            except Exception as e:
                logger.warning(
                    "question_validation_failed",
                    extra={
                        "user_id": str(request.user_id),
                        "question_index": idx,
                        "error": str(e),
                    }
                )
                # Skip invalid questions

        if not validated_questions:
            raise ValueError("No valid questions generated")

        # Step 5: Convert to Question models
        question_models = []
        for generated_q in validated_questions:
            question = Question(
                material_id=request.material_id,
                user_id=request.user_id,
                vignette=f"{generated_q.vignette}\n\n{generated_q.question}",
                options=generated_q.options,
                correct_index=generated_q.correct_index,
                explanation=generated_q.explanation,
                topic=generated_q.topic or request.topic,
                subtopic=generated_q.subtopic,
                difficulty=self._map_difficulty(request.difficulty),
                predicted_difficulty=request.difficulty,
                source_chunk_ids=source_chunk_ids if source_chunk_ids else None,
                generation_model=settings.CODEX_DEFAULT_MODEL,
                generation_metadata={
                    "user_level": request.user_level,
                    "use_rag": request.use_rag,
                    "teaching_points": generated_q.teaching_points,
                },
            )
            question_models.append(question)

        logger.info(
            "question_generation_complete",
            extra={
                "user_id": str(request.user_id),
                "questions_generated": len(question_models),
            }
        )

        return question_models

    def _build_prompt(
        self,
        context: str,
        topic: str,
        difficulty: int,
        num_questions: int,
        user_level: int,
    ) -> str:
        """Build the question generation prompt."""
        difficulty_descriptions = {
            1: "Basic recall - simple definitions and concepts",
            2: "Application - use concepts in straightforward scenarios",
            3: "Analysis - interpret data and make connections",
            4: "Synthesis - complex clinical reasoning",
            5: "NBME-style - multi-step reasoning with realistic distractors",
        }

        difficulty_desc = difficulty_descriptions.get(difficulty, "Medium")

        prompt = f"""You are an expert medical educator creating USMLE Step 1 practice questions.

**Context from Study Materials**:
{context if context else "No specific context provided. Generate from general medical knowledge."}

**Task**: Generate {num_questions} high-quality multiple choice questions about **{topic}**.

**Difficulty Level**: {difficulty}/5 - {difficulty_desc}
**Student Level**: {user_level}/5 (1=beginner, 5=expert medical student)

**NBME Question Format Requirements**:

1. **Clinical Vignette**: Start with a realistic patient presentation
   - Include age, gender, chief complaint
   - Relevant history (HPI, PMH, medications, social history)
   - Physical exam findings
   - Lab/imaging results if relevant
   - Length: 2-4 sentences for level 1-2, 4-6 sentences for level 3-5

2. **Question Stem**: Clear, specific question
   - "What is the most likely diagnosis?"
   - "Which of the following is the best next step in management?"
   - "Which mechanism best explains this finding?"

3. **Answer Options**: 4 options
   - One clearly correct answer
   - Three plausible distractors
   - Similar length and format

4. **Explanation**: Comprehensive teaching explanation
   - Why correct answer is correct (2-3 sentences)
   - Why each distractor is incorrect (1 sentence each)
   - Key teaching points (2-3 bullet points)

**Response Format** (JSON):
```json
[
  {{
    "vignette": "A 65-year-old man with a history of hypertension presents...",
    "question": "What is the most likely diagnosis?",
    "options": [
      "Acute myocardial infarction",
      "Pulmonary embolism",
      "Aortic dissection",
      "Pneumothorax"
    ],
    "correct_index": 2,
    "explanation": "This patient most likely has an aortic dissection...",
    "teaching_points": [
      "Aortic dissection classically presents with sudden 'tearing' pain",
      "Risk factors include hypertension and connective tissue disorders"
    ],
    "topic": "{topic}",
    "subtopic": "Cardiovascular Emergencies",
    "difficulty": "{difficulty_desc}"
  }}
]
```

Generate {num_questions} questions now:"""

        return prompt

    def _parse_question(self, raw_question: dict) -> GeneratedQuestion:
        """Parse and validate a generated question."""
        # Validate required fields
        required_fields = ["vignette", "question", "options", "correct_index", "explanation"]
        for field in required_fields:
            if field not in raw_question:
                raise ValueError(f"Missing required field: {field}")

        # Validate options
        options = raw_question["options"]
        if not isinstance(options, list) or len(options) != 4:
            raise ValueError("Options must be a list of 4 items")

        # Validate correct_index
        correct_index = raw_question["correct_index"]
        if not isinstance(correct_index, int) or not (0 <= correct_index < 4):
            raise ValueError("correct_index must be an integer 0-3")

        return GeneratedQuestion(
            vignette=raw_question["vignette"],
            question=raw_question["question"],
            options=options,
            correct_index=correct_index,
            explanation=raw_question["explanation"],
            teaching_points=raw_question.get("teaching_points"),
            topic=raw_question.get("topic"),
            subtopic=raw_question.get("subtopic"),
            difficulty=raw_question.get("difficulty"),
        )

    def _map_difficulty(self, difficulty: int) -> str:
        """Map difficulty level (1-5) to string."""
        mapping = {
            1: "easy",
            2: "medium",
            3: "medium",
            4: "hard",
            5: "nbme",
        }
        return mapping.get(difficulty, "medium")


def get_question_generator() -> QuestionGeneratorService:
    """Get question generator service instance."""
    return QuestionGeneratorService()
```

---

### Phase 3: Spaced Repetition Service (1.5 hours)

**File**: `backend/app/services/sm2_algorithm.py`

```python
"""SM-2 spaced repetition algorithm implementation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from app.config import settings


@dataclass
class SM2Result:
    """Result of SM-2 calculation."""

    interval: int  # Days until next review
    easiness_factor: float  # Updated EF
    repetition: int  # Repetition count
    next_review_date: datetime  # Calculated next review date


class SM2Algorithm:
    """SuperMemo 2 spaced repetition algorithm."""

    @staticmethod
    def calculate_next_review(
        quality: int,  # 0-5 rating (0=complete blackout, 5=perfect)
        repetition: int,  # Current repetition count
        easiness_factor: float,  # Current EF
        interval: int,  # Current interval in days
    ) -> SM2Result:
        """
        Calculate next review date based on SM-2 algorithm.

        Args:
            quality: Response quality (0-5)
                0 = Complete blackout
                1 = Incorrect, but recognized answer after seeing it
                2 = Incorrect, but felt close
                3 = Correct, but with serious difficulty
                4 = Correct, with hesitation
                5 = Perfect response
            repetition: Number of successful repetitions
            easiness_factor: Current ease factor (1.3-2.5)
            interval: Current interval in days

        Returns:
            SM2Result with updated values
        """
        # Update easiness factor
        # EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        new_ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

        # Ensure EF stays within bounds
        new_ef = max(settings.SM2_MIN_EF, new_ef)

        # Update repetition and interval
        if quality >= 3:  # Correct answer
            if repetition == 0:
                new_interval = 1  # First review tomorrow
            elif repetition == 1:
                new_interval = 6  # Second review in 6 days
            else:
                new_interval = round(interval * new_ef)

            new_repetition = repetition + 1
        else:  # Incorrect answer
            new_repetition = 0
            new_interval = 1  # Start over

        # Calculate next review date
        next_review_date = datetime.utcnow() + timedelta(days=new_interval)

        return SM2Result(
            interval=new_interval,
            easiness_factor=new_ef,
            repetition=new_repetition,
            next_review_date=next_review_date,
        )

    @staticmethod
    def calculate_quality_from_attempt(
        is_correct: bool,
        confidence: int,  # 1-5
        time_taken_seconds: int,
        optimal_time_seconds: int = 90,
    ) -> int:
        """
        Calculate SM-2 quality score from attempt data.

        Args:
            is_correct: Whether answer was correct
            confidence: User's confidence rating (1-5)
            time_taken_seconds: Time taken to answer
            optimal_time_seconds: Optimal time for this difficulty

        Returns:
            Quality score (0-5)
        """
        if not is_correct:
            # Incorrect answer: 0-2 based on confidence
            # High confidence but wrong = 0 (overconfident, complete blackout)
            # Low confidence and wrong = 2 (at least aware of uncertainty)
            if confidence >= 4:
                return 0  # Overconfident
            elif confidence == 3:
                return 1  # Somewhat confident
            else:
                return 2  # Low confidence (good awareness)

        # Correct answer: 3-5 based on confidence and time
        # Base quality from confidence
        if confidence <= 2:
            quality = 3  # Correct but not confident
        elif confidence == 3:
            quality = 4  # Correct with some hesitation
        else:
            quality = 5  # Confident and correct

        # Adjust for time taken
        # If took much longer than optimal, reduce quality by 1
        if time_taken_seconds > optimal_time_seconds * 1.5 and quality > 3:
            quality -= 1

        return quality

    @staticmethod
    def determine_review_status(
        repetition: int,
        easiness_factor: float,
        interval: int,
    ) -> str:
        """
        Determine review status based on SM-2 state.

        Returns:
            "new", "learning", "reviewing", or "mastered"
        """
        if repetition == 0:
            return "new"
        elif repetition < 3:
            return "learning"
        elif repetition >= 3 and interval < 21:
            return "reviewing"
        else:
            return "mastered"


def get_sm2_algorithm() -> SM2Algorithm:
    """Get SM-2 algorithm instance."""
    return SM2Algorithm()
```

---

### Phase 4: API Endpoints (2 hours)

**File**: `backend/app/api/questions.py`

```python
"""Question generation and quiz API endpoints."""

from __future__ import annotations

import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.question import Question
from app.models.user import User
from app.models.user_attempt import UserAttempt
from app.services.question_generator import (
    QuestionGeneratorService,
    QuestionGenerationRequest,
    get_question_generator,
)
from app.services.sm2_algorithm import get_sm2_algorithm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/questions", tags=["questions"])


# ==============================================================================
# Request/Response Schemas
# ==============================================================================

class GenerateQuestionsRequest(BaseModel):
    """Request to generate questions."""

    material_id: str = Field(..., description="Material UUID")
    topic: str = Field(..., min_length=1, max_length=255)
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: int = Field(3, ge=1, le=5)
    user_level: int = Field(3, ge=1, le=5)
    use_rag: bool = Field(True, description="Use RAG context for generation")


class QuestionResponse(BaseModel):
    """Single question response (without answer)."""

    id: str
    vignette: str
    options: List[str]
    topic: str
    subtopic: Optional[str]
    difficulty: str
    times_answered: int
    success_rate: float
    created_at: str


class QuestionWithAnswerResponse(QuestionResponse):
    """Question response with answer (for review)."""

    correct_index: int
    explanation: str


class AnswerQuestionRequest(BaseModel):
    """Request to answer a question."""

    selected_index: int = Field(..., ge=0, le=3)
    confidence: int = Field(..., ge=1, le=5)
    time_taken_seconds: int = Field(..., gt=0)


class AnswerQuestionResponse(BaseModel):
    """Response after answering a question."""

    is_correct: bool
    correct_index: int
    explanation: str
    xp_earned: int
    next_review_date: Optional[str]
    review_status: str


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("/generate", response_model=List[QuestionResponse])
async def generate_questions(
    request: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    generator: QuestionGeneratorService = Depends(get_question_generator),
):
    """
    Generate NBME-style questions from a material.

    - Retrieves relevant context from RAG system
    - Generates questions using Codex CLI
    - Stores questions in database
    - Returns questions WITHOUT answers
    """
    try:
        material_id = uuid.UUID(request.material_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid material_id format")

    # Create generation request
    gen_request = QuestionGenerationRequest(
        material_id=material_id,
        user_id=current_user.id,
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        user_level=request.user_level,
        use_rag=request.use_rag,
    )

    # Generate questions
    try:
        questions = await generator.generate_questions(
            session=session,
            request=gen_request,
        )
    except ValueError as e:
        logger.error(
            "question_generation_failed",
            extra={"user_id": str(current_user.id), "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))

    # Save questions to database
    for question in questions:
        session.add(question)

    await session.commit()

    # Refresh to get IDs
    for question in questions:
        await session.refresh(question)

    logger.info(
        "questions_generated",
        extra={
            "user_id": str(current_user.id),
            "material_id": str(material_id),
            "count": len(questions),
        }
    )

    # Return questions without answers
    return [
        QuestionResponse(
            id=str(q.id),
            vignette=q.vignette,
            options=q.options,
            topic=q.topic,
            subtopic=q.subtopic,
            difficulty=q.difficulty,
            times_answered=q.times_answered,
            success_rate=q.success_rate,
            created_at=q.created_at.isoformat(),
        )
        for q in questions
    ]


@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    List questions for current user.

    Filters:
    - topic: Filter by topic
    - difficulty: Filter by difficulty ("easy", "medium", "hard", "nbme")
    - limit: Max results (default 20)
    - offset: Pagination offset (default 0)
    """
    query = select(Question).where(Question.user_id == current_user.id)

    if topic:
        query = query.where(Question.topic == topic)

    if difficulty:
        query = query.where(Question.difficulty == difficulty)

    query = query.order_by(Question.created_at.desc()).limit(limit).offset(offset)

    result = await session.execute(query)
    questions = result.scalars().all()

    return [
        QuestionResponse(
            id=str(q.id),
            vignette=q.vignette,
            options=q.options,
            topic=q.topic,
            subtopic=q.subtopic,
            difficulty=q.difficulty,
            times_answered=q.times_answered,
            success_rate=q.success_rate,
            created_at=q.created_at.isoformat(),
        )
        for q in questions
    ]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get a single question by ID (without answer)."""
    try:
        q_id = uuid.UUID(question_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid question_id format")

    result = await session.execute(
        select(Question).where(
            Question.id == q_id,
            Question.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return QuestionResponse(
        id=str(question.id),
        vignette=question.vignette,
        options=question.options,
        topic=question.topic,
        subtopic=question.subtopic,
        difficulty=question.difficulty,
        times_answered=question.times_answered,
        success_rate=question.success_rate,
        created_at=question.created_at.isoformat(),
    )


@router.post("/{question_id}/answer", response_model=AnswerQuestionResponse)
async def answer_question(
    question_id: str,
    request: AnswerQuestionRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Submit an answer to a question.

    - Validates answer
    - Calculates XP
    - Updates spaced repetition state (SM-2)
    - Updates question statistics
    - Returns feedback with next review date
    """
    try:
        q_id = uuid.UUID(question_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid question_id format")

    # Get question
    result = await session.execute(
        select(Question).where(
            Question.id == q_id,
            Question.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check if already answered (get last attempt)
    last_attempt_result = await session.execute(
        select(UserAttempt)
        .where(
            UserAttempt.user_id == current_user.id,
            UserAttempt.question_id == q_id
        )
        .order_by(UserAttempt.answered_at.desc())
        .limit(1)
    )
    last_attempt = last_attempt_result.scalar_one_or_none()

    # Validate answer
    is_correct = request.selected_index == question.correct_index

    # Calculate XP (simple formula for MVP)
    difficulty_multipliers = {
        "easy": 1.0,
        "medium": 1.5,
        "hard": 2.0,
        "nbme": 2.5,
    }
    base_xp = 10  # Base XP per question
    xp_earned = int(base_xp * difficulty_multipliers.get(question.difficulty, 1.0))

    if is_correct:
        xp_earned += 5  # Bonus for correct
        # Confidence bonus
        if request.confidence >= 4:
            xp_earned += 3

    # Calculate SM-2 quality
    sm2 = get_sm2_algorithm()
    quality = sm2.calculate_quality_from_attempt(
        is_correct=is_correct,
        confidence=request.confidence,
        time_taken_seconds=request.time_taken_seconds,
    )

    # Get previous SM-2 state
    if last_attempt:
        prev_interval = last_attempt.sm2_interval
        prev_ef = last_attempt.sm2_easiness_factor
        prev_repetition = last_attempt.sm2_repetition
    else:
        prev_interval = 1
        prev_ef = 2.5
        prev_repetition = 0

    # Calculate next review
    sm2_result = sm2.calculate_next_review(
        quality=quality,
        repetition=prev_repetition,
        easiness_factor=prev_ef,
        interval=prev_interval,
    )

    review_status = sm2.determine_review_status(
        repetition=sm2_result.repetition,
        easiness_factor=sm2_result.easiness_factor,
        interval=sm2_result.interval,
    )

    # Create attempt record
    attempt = UserAttempt(
        user_id=current_user.id,
        question_id=q_id,
        selected_index=request.selected_index,
        is_correct=is_correct,
        confidence=request.confidence,
        time_taken_seconds=request.time_taken_seconds,
        xp_earned=xp_earned,
        level_at_attempt=current_user.level if hasattr(current_user, 'level') else None,
        sm2_interval=sm2_result.interval,
        sm2_easiness_factor=sm2_result.easiness_factor,
        sm2_repetition=sm2_result.repetition,
        next_review_date=sm2_result.next_review_date,
        review_status=review_status,
    )
    session.add(attempt)

    # Update question statistics
    question.times_answered += 1
    if is_correct:
        question.times_correct += 1

    # Update user XP (if user model has XP field)
    if hasattr(current_user, 'xp'):
        current_user.xp += xp_earned

    await session.commit()

    logger.info(
        "question_answered",
        extra={
            "user_id": str(current_user.id),
            "question_id": str(q_id),
            "is_correct": is_correct,
            "xp_earned": xp_earned,
            "review_status": review_status,
        }
    )

    return AnswerQuestionResponse(
        is_correct=is_correct,
        correct_index=question.correct_index,
        explanation=question.explanation,
        xp_earned=xp_earned,
        next_review_date=sm2_result.next_review_date.isoformat(),
        review_status=review_status,
    )


@router.get("/due/reviews", response_model=List[QuestionResponse])
async def get_due_reviews(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Get questions due for review (spaced repetition).

    Returns questions where:
    - next_review_date <= now
    - review_status != 'mastered'
    - Ordered by next_review_date (oldest first)
    """
    # Subquery to get latest attempt for each question
    latest_attempts = (
        select(
            UserAttempt.question_id,
            func.max(UserAttempt.answered_at).label('latest_answered_at')
        )
        .where(UserAttempt.user_id == current_user.id)
        .group_by(UserAttempt.question_id)
        .subquery()
    )

    # Get questions due for review
    query = (
        select(Question)
        .join(
            UserAttempt,
            (UserAttempt.question_id == Question.id) &
            (UserAttempt.user_id == current_user.id)
        )
        .join(
            latest_attempts,
            (latest_attempts.c.question_id == Question.id) &
            (latest_attempts.c.latest_answered_at == UserAttempt.answered_at)
        )
        .where(
            Question.user_id == current_user.id,
            UserAttempt.next_review_date <= func.now(),
            UserAttempt.review_status != 'mastered'
        )
        .order_by(UserAttempt.next_review_date.asc())
        .limit(limit)
    )

    result = await session.execute(query)
    questions = result.scalars().all()

    return [
        QuestionResponse(
            id=str(q.id),
            vignette=q.vignette,
            options=q.options,
            topic=q.topic,
            subtopic=q.subtopic,
            difficulty=q.difficulty,
            times_answered=q.times_answered,
            success_rate=q.success_rate,
            created_at=q.created_at.isoformat(),
        )
        for q in questions
    ]


@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a question (and all associated attempts)."""
    try:
        q_id = uuid.UUID(question_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid question_id format")

    result = await session.execute(
        select(Question).where(
            Question.id == q_id,
            Question.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    await session.delete(question)
    await session.commit()

    logger.info(
        "question_deleted",
        extra={"user_id": str(current_user.id), "question_id": str(q_id)}
    )

    return {"status": "deleted", "question_id": str(q_id)}
```

#### Register Router

**File**: `backend/app/main.py`

Add this import:
```python
from app.api import questions as questions_routes
```

Add this router registration:
```python
app.include_router(questions_routes.router)
```

---

### Phase 5: Testing (1.5 hours)

**File**: `backend/tests/test_question_generation.py`

```python
"""Tests for question generation feature."""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.question_generator import (
    QuestionGeneratorService,
    QuestionGenerationRequest,
)
from app.services.sm2_algorithm import SM2Algorithm


class TestQuestionGenerator:
    """Test question generation service."""

    @pytest.mark.asyncio
    async def test_generate_questions_with_rag(self, db_session, test_user, test_material):
        """Test question generation with RAG context."""
        generator = QuestionGeneratorService()

        # Mock RAG service
        with patch.object(generator.rag, 'retrieve_context') as mock_rag:
            mock_rag.return_value = []  # Empty for simplicity

            # Mock Codex service
            with patch.object(generator.codex, 'generate_questions') as mock_codex:
                mock_codex.return_value = [
                    {
                        "vignette": "A 65-year-old man presents with chest pain",
                        "question": "What is the most likely diagnosis?",
                        "options": ["MI", "PE", "Dissection", "Pneumothorax"],
                        "correct_index": 2,
                        "explanation": "This is aortic dissection...",
                        "topic": "Cardiology",
                    }
                ]

                request = QuestionGenerationRequest(
                    material_id=test_material.id,
                    user_id=test_user.id,
                    topic="Cardiology",
                    num_questions=1,
                    difficulty=3,
                )

                questions = await generator.generate_questions(
                    session=db_session,
                    request=request,
                )

                assert len(questions) == 1
                assert questions[0].topic == "Cardiology"
                assert questions[0].user_id == test_user.id


class TestSM2Algorithm:
    """Test SM-2 spaced repetition algorithm."""

    def test_first_review_correct(self):
        """Test first review with correct answer."""
        sm2 = SM2Algorithm()

        result = sm2.calculate_next_review(
            quality=5,  # Perfect response
            repetition=0,
            easiness_factor=2.5,
            interval=1,
        )

        assert result.interval == 1  # First review tomorrow
        assert result.repetition == 1
        assert result.easiness_factor >= 2.5  # Should maintain or increase

    def test_second_review_correct(self):
        """Test second review with correct answer."""
        sm2 = SM2Algorithm()

        result = sm2.calculate_next_review(
            quality=4,  # Good response
            repetition=1,
            easiness_factor=2.5,
            interval=1,
        )

        assert result.interval == 6  # Second review in 6 days
        assert result.repetition == 2

    def test_incorrect_answer_resets(self):
        """Test incorrect answer resets progress."""
        sm2 = SM2Algorithm()

        result = sm2.calculate_next_review(
            quality=2,  # Incorrect
            repetition=5,
            easiness_factor=2.3,
            interval=30,
        )

        assert result.interval == 1  # Reset to 1 day
        assert result.repetition == 0  # Reset repetition

    def test_quality_calculation_correct_confident(self):
        """Test quality calculation for correct + confident answer."""
        sm2 = SM2Algorithm()

        quality = sm2.calculate_quality_from_attempt(
            is_correct=True,
            confidence=5,
            time_taken_seconds=60,
        )

        assert quality == 5  # Perfect

    def test_quality_calculation_incorrect_overconfident(self):
        """Test quality calculation for incorrect + overconfident answer."""
        sm2 = SM2Algorithm()

        quality = sm2.calculate_quality_from_attempt(
            is_correct=False,
            confidence=5,
            time_taken_seconds=30,
        )

        assert quality == 0  # Complete blackout (overconfident)
```

---

## Integration with Frontend

### Example Frontend Usage

```typescript
// Generate questions from material
const generateQuestions = async (materialId: string) => {
  const response = await apiClient.post('/api/questions/generate', {
    material_id: materialId,
    topic: 'Cardiology',
    num_questions: 10,
    difficulty: 3,
    user_level: 3,
    use_rag: true,
  });
  return response.data;
};

// Get a question to answer
const getQuestion = async (questionId: string) => {
  const response = await apiClient.get(`/api/questions/${questionId}`);
  return response.data;
};

// Submit answer
const answerQuestion = async (
  questionId: string,
  selectedIndex: number,
  confidence: number,
  timeTaken: number
) => {
  const response = await apiClient.post(`/api/questions/${questionId}/answer`, {
    selected_index: selectedIndex,
    confidence: confidence,
    time_taken_seconds: timeTaken,
  });
  return response.data;
};

// Get due reviews
const getDueReviews = async () => {
  const response = await apiClient.get('/api/questions/due/reviews');
  return response.data;
};
```

---

## Summary

### Completion Checklist

- [ ] **Phase 1**: Database setup (2 hours)
  - [ ] Create Question and UserAttempt models
  - [ ] Create Alembic migration
  - [ ] Run migration
  - [ ] Verify tables created

- [ ] **Phase 2**: Question generator service (3 hours)
  - [ ] Implement QuestionGeneratorService
  - [ ] Build NBME-style prompt template
  - [ ] Integrate with RAG service
  - [ ] Add question validation
  - [ ] Test question generation

- [ ] **Phase 3**: Spaced repetition (1.5 hours)
  - [ ] Implement SM2Algorithm
  - [ ] Add quality calculation
  - [ ] Add review status determination
  - [ ] Test SM-2 calculations

- [ ] **Phase 4**: API endpoints (2 hours)
  - [ ] POST /api/questions/generate
  - [ ] GET /api/questions
  - [ ] GET /api/questions/:id
  - [ ] POST /api/questions/:id/answer
  - [ ] GET /api/questions/due/reviews
  - [ ] DELETE /api/questions/:id
  - [ ] Register router in main.py

- [ ] **Phase 5**: Testing (1.5 hours)
  - [ ] Write unit tests
  - [ ] Test question generation flow
  - [ ] Test spaced repetition logic
  - [ ] Test API endpoints
  - [ ] End-to-end manual testing

### Total Time: 8-10 hours

---

## Next Steps

1. **Start with Phase 1** (database setup) - this is foundational
2. **Test each phase** before moving to next
3. **Integrate with frontend** progressively
4. **Monitor performance** in production (question generation can be slow)
5. **Collect feedback** and iterate on prompt quality

---

## Production Considerations

### Performance Optimization
- **Cache generated questions** to avoid regenerating identical topics
- **Background job** for question generation (don't block API request)
- **Batch generation** - generate 20 questions at once, serve them over time
- **Pre-generate questions** for popular topics

### Quality Control
- **Human review** of generated questions (admin interface)
- **Flag mechanism** for poor quality questions
- **A/B testing** different prompts
- **Track question statistics** (success rate, time taken) to identify bad questions

### Scalability
- **Partition user_attempts** table (already done)
- **Index optimization** for due reviews query
- **Cache due reviews** (update every 5 minutes)
- **Rate limit** question generation (expensive LLM calls)

---

**Questions? Issues? Check the code examples above for complete implementations.**
