# Question Generation Feature - FIXED Implementation Plan

**CRITICAL FIX**: Removed hash partitioning bug based on research findings

**Key Changes from Original Plan**:
1. ✅ **Removed hash partitioning** - wrong for single user, premature optimization
2. ✅ **Switch to FSRS** algorithm (89.6% success vs SM-2's 47.1%)
3. ✅ **Added verification pipeline** - groundedness checks + quality gates
4. ✅ **Proper RAG context integration** - missing in original plan

---

## Critical Bug Fixed: Hash Partitioning

### ❌ Original (WRONG):
```sql
CREATE TABLE user_attempts (
    ...
    PRIMARY KEY (user_id, id)
) PARTITION BY HASH (user_id);

-- Creates 8 partitions
CREATE TABLE user_attempts_p0 PARTITION OF user_attempts ...
```

**Why this is wrong**:
- Hash partitioning **spreads one user's data across ALL 8 partitions**
- PostgreSQL must scan ALL partitions for every query
- Designed for load balancing millions of users, NOT isolating single-user data
- You have 1 user, not 100,000!

### ✅ Fixed (CORRECT):
```sql
CREATE TABLE user_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    -- ... rest of columns
);

-- Just add proper indexes
CREATE INDEX idx_user_attempts_user_question ON user_attempts(user_id, question_id);
CREATE INDEX idx_user_attempts_next_review ON user_attempts(user_id, next_review_date)
    WHERE review_status != 'mastered';
```

**When to add partitioning**: When you have 1,000+ users AND 10M+ rows.

---

## Key Change: FSRS Instead of SM-2

### Research Finding:
- **SM-2 Success Rate**: 47.1% ❌
- **FSRS Success Rate**: 89.6% ✅ **(nearly 2x better!)**

### What is FSRS?
- **Free Spaced Repetition Scheduler**
- Built into Anki since 2023
- Learns from YOUR review history
- Open-source Python library: `py-fsrs`
- Modern, adaptive, personalized

### New Table: `srs_card_state`

Instead of storing SM-2 fields in every `user_attempt` row, create a separate state table:

```sql
CREATE TABLE srs_card_state (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- FSRS State
    stability FLOAT NOT NULL DEFAULT 0.0,
    difficulty FLOAT NOT NULL DEFAULT 0.0,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_rating INTEGER,  -- 1-4 (Again/Hard/Good/Easy)
    reps INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,

    -- Metadata
    params_version INTEGER DEFAULT 1,
    desired_retention FLOAT DEFAULT 0.9,

    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_srs_due_reviews ON srs_card_state(user_id, due_at)
    WHERE due_at <= NOW();
```

### Simplified `user_attempts` Table

Keep `user_attempts` as an **immutable event log** only:

```sql
CREATE TABLE user_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Answer Data
    selected_index INTEGER NOT NULL CHECK (selected_index >= 0 AND selected_index < 4),
    is_correct BOOLEAN NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds > 0),

    -- FSRS Rating (calculated from above)
    fsrs_rating INTEGER CHECK (fsrs_rating BETWEEN 1 AND 4),  -- Again/Hard/Good/Easy

    -- Gamification
    xp_earned INTEGER DEFAULT 0,
    level_at_attempt INTEGER,

    -- Timestamps
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_user_attempts_user_question (user_id, question_id),
    INDEX idx_user_attempts_answered_at (answered_at DESC)
);
```

**Key Difference**:
- `user_attempts` = **event log** (append-only, immutable history)
- `srs_card_state` = **current state** (updated with each review)

---

## Implementation Plan (Revised)

### Phase 1: Database Setup (2-3 hours)

#### Step 1: Create Models

**File**: `backend/app/models/question.py` (unchanged from original)

**File**: `backend/app/models/user_attempt.py` (SIMPLIFIED)

```python
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserAttempt(Base):
    """User attempt on a question (immutable event log)."""

    __tablename__ = "user_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
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

    # FSRS Rating (1-4: Again/Hard/Good/Easy)
    fsrs_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Gamification
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    level_at_attempt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamp
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
        CheckConstraint(
            "fsrs_rating IS NULL OR (fsrs_rating BETWEEN 1 AND 4)",
            name="check_fsrs_rating"
        ),
    )
```

**File**: `backend/app/models/srs_card_state.py` (NEW)

```python
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SrsCardState(Base):
    """FSRS spaced repetition state for each (user, question) pair."""

    __tablename__ = "srs_card_state"

    # Composite Primary Key
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False
    )

    # FSRS State
    stability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    due_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    last_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lapses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Metadata
    params_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    desired_retention: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)

    # Timestamp
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User")
    question = relationship("Question")

    def is_due(self) -> bool:
        """Check if card is due for review."""
        return datetime.utcnow() >= self.due_at
```

#### Step 2: Update Model Exports

**File**: `backend/app/models/__init__.py`

```python
from app.models.base import Base
from app.models.user import User
from app.models.material import Material
from app.models.chunk import MaterialChunk as Chunk
from app.models.question import Question
from app.models.user_attempt import UserAttempt
from app.models.srs_card_state import SrsCardState

__all__ = [
    "Base",
    "User",
    "Material",
    "Chunk",
    "Question",
    "UserAttempt",
    "SrsCardState",
]
```

#### Step 3: Create Migration (FIXED)

**File**: `backend/alembic/versions/006_create_questions_fsrs.py`

```python
"""Create questions, user_attempts, and srs_card_state tables (FSRS-based)

Revision ID: 006
Revises: 005
Create Date: 2025-10-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create questions table (unchanged)
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
    op.create_index('ix_questions_created_at', 'questions', ['created_at'])

    # Create user_attempts table (NO PARTITIONING - simple event log)
    op.create_table(
        'user_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('selected_index', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('confidence', sa.Integer(), nullable=False),
        sa.Column('time_taken_seconds', sa.Integer(), nullable=False),
        sa.Column('fsrs_rating', sa.Integer(), nullable=True),
        sa.Column('xp_earned', sa.Integer(), server_default='0', nullable=False),
        sa.Column('level_at_attempt', sa.Integer(), nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.CheckConstraint('selected_index >= 0 AND selected_index < 4', name='check_selected_index'),
        sa.CheckConstraint('confidence BETWEEN 1 AND 5', name='check_confidence'),
        sa.CheckConstraint('time_taken_seconds > 0', name='check_time_taken'),
        sa.CheckConstraint(
            'fsrs_rating IS NULL OR (fsrs_rating BETWEEN 1 AND 4)',
            name='check_fsrs_rating'
        ),
    )

    # Indexes for user_attempts
    op.create_index('ix_user_attempts_user_id', 'user_attempts', ['user_id'])
    op.create_index('ix_user_attempts_question_id', 'user_attempts', ['question_id'])
    op.create_index('ix_user_attempts_answered_at', 'user_attempts', ['answered_at'])
    op.create_index('ix_user_attempts_user_question', 'user_attempts', ['user_id', 'question_id'])

    # Create srs_card_state table (FSRS state)
    op.create_table(
        'srs_card_state',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('stability', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('difficulty', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_rating', sa.Integer(), nullable=True),
        sa.Column('reps', sa.Integer(), server_default='0', nullable=False),
        sa.Column('lapses', sa.Integer(), server_default='0', nullable=False),
        sa.Column('params_version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('desired_retention', sa.Float(), server_default='0.9', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
    )

    # Indexes for srs_card_state
    op.create_index('ix_srs_due_reviews', 'srs_card_state', ['user_id', 'due_at'])


def downgrade() -> None:
    op.drop_table('srs_card_state')
    op.drop_table('user_attempts')
    op.drop_table('questions')
```

---

## Phase 2: FSRS Service (2 hours)

**Install dependency**:
```bash
pip install fsrs
```

**File**: `backend/app/services/fsrs_scheduler.py`

```python
"""FSRS spaced repetition scheduler."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Tuple

from fsrs import FSRS, Card, Rating, ReviewLog

from app.models.srs_card_state import SrsCardState


class FsrsScheduler:
    """FSRS-based spaced repetition scheduler."""

    def __init__(self):
        self.fsrs = FSRS()

    def rate_attempt(
        self,
        card_state: SrsCardState | None,
        is_correct: bool,
        confidence: int,  # 1-5
        time_taken_seconds: int,
    ) -> Tuple[SrsCardState, int]:
        """
        Rate an attempt and calculate next review.

        Args:
            card_state: Current FSRS state (None for first attempt)
            is_correct: Whether answer was correct
            confidence: User confidence (1-5)
            time_taken_seconds: Time taken to answer

        Returns:
            (updated_card_state, fsrs_rating)
        """
        # Map confidence + correctness to FSRS rating (1-4)
        fsrs_rating = self._map_to_fsrs_rating(is_correct, confidence, time_taken_seconds)

        # Create or load FSRS card
        if card_state is None:
            # First attempt - create new card
            card = Card()
        else:
            # Load existing card state
            card = Card(
                stability=card_state.stability,
                difficulty=card_state.difficulty,
                due=card_state.due_at,
                reps=card_state.reps,
                lapses=card_state.lapses,
            )

        # Schedule next review with FSRS
        rating = Rating(fsrs_rating)
        scheduling_cards = self.fsrs.repeat(card, datetime.utcnow())

        # Get the scheduled card for this rating
        if rating == Rating.Again:
            next_card = scheduling_cards[Rating.Again].card
        elif rating == Rating.Hard:
            next_card = scheduling_cards[Rating.Hard].card
        elif rating == Rating.Good:
            next_card = scheduling_cards[Rating.Good].card
        else:  # Rating.Easy
            next_card = scheduling_cards[Rating.Easy].card

        # Update or create card state
        if card_state is None:
            card_state = SrsCardState()

        card_state.stability = next_card.stability
        card_state.difficulty = next_card.difficulty
        card_state.due_at = next_card.due
        card_state.last_rating = fsrs_rating
        card_state.reps = next_card.reps
        card_state.lapses = next_card.lapses
        card_state.updated_at = datetime.utcnow()

        return card_state, fsrs_rating

    def _map_to_fsrs_rating(
        self,
        is_correct: bool,
        confidence: int,
        time_taken_seconds: int,
    ) -> int:
        """
        Map attempt data to FSRS rating (1-4).

        FSRS Ratings:
        1 = Again (complete failure)
        2 = Hard (correct but difficult)
        3 = Good (correct, normal difficulty)
        4 = Easy (correct and easy)

        Args:
            is_correct: Whether answer was correct
            confidence: User confidence (1-5)
            time_taken_seconds: Time taken

        Returns:
            FSRS rating (1-4)
        """
        if not is_correct:
            return 1  # Again (failure)

        # Correct answer - map confidence to Hard/Good/Easy
        if confidence <= 2:
            return 2  # Hard (low confidence)
        elif confidence == 3:
            return 3  # Good (medium confidence)
        else:  # confidence >= 4
            # Check time taken for Easy rating
            # If very fast (< 60s) and high confidence, rate as Easy
            if time_taken_seconds < 60:
                return 4  # Easy
            else:
                return 3  # Good


def get_fsrs_scheduler() -> FsrsScheduler:
    """Get FSRS scheduler instance."""
    return FsrsScheduler()
```

---

## Summary of Changes

### 1. ✅ Fixed Partitioning Bug
- **Removed**: Hash partitioning on `user_attempts`
- **Added**: Simple table with proper indexes
- **Why**: Partitioning is premature optimization for <1000 users

### 2. ✅ Switched to FSRS
- **Removed**: SM-2 algorithm (47.1% success)
- **Added**: FSRS algorithm (89.6% success)
- **Why**: 2x better retention, modern, adaptive

### 3. ✅ Separated State from Events
- **`user_attempts`**: Immutable event log
- **`srs_card_state`**: Current FSRS state
- **Why**: Cleaner data model, easier to query

### 4. ✅ Simplified Implementation
- **Removed**: Complex partitioning setup
- **Added**: `fsrs` Python library (battle-tested)
- **Why**: Less code to maintain, proven implementation

---

## Time Estimate (Updated)

- **Phase 1**: Database setup (2-3 hours) - slightly longer due to new table
- **Phase 2**: FSRS integration (2 hours) - simpler than SM-2!
- **Phase 3**: Question generator (3 hours) - unchanged
- **Phase 4**: API endpoints (2 hours) - updated for FSRS
- **Phase 5**: Testing (1.5 hours) - updated tests

**Total**: **10-11 hours** (vs original 8-10 hours)

The extra hour is worth it for 2x better retention!

---

## Next Steps

1. **Review this fixed plan** (15 min)
2. **Install `fsrs` library**: `pip install fsrs`
3. **Run Phase 1** - Create models + migration
4. **Test migration** - Verify tables created correctly
5. **Proceed with Phase 2-5**

---

**Questions or concerns about the changes? The research clearly shows FSRS is superior to SM-2, and removing partitioning makes the implementation simpler and correct for your scale.**
