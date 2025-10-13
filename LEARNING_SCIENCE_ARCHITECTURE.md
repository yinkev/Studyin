# Studyin Learning Science Architecture
## World-Class Learning Science Stack for Medical Education

**Document Status**: Architecture Design v1.0
**Last Updated**: 2025-10-13
**Target**: Medical students (USMLE/board exam preparation)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principle: FSRS as Computational Backbone](#core-principle-fsrs-as-computational-backbone)
3. [Component 1: FSRS-Based Spaced Repetition](#component-1-fsrs-based-spaced-repetition)
4. [Component 2: Active Recall & Retrieval Practice](#component-2-active-recall--retrieval-practice)
5. [Component 3: Metacognition & Self-Assessment](#component-3-metacognition--self-assessment)
6. [Component 4: Cognitive Load Management](#component-4-cognitive-load-management)
7. [Component 5: Long-Term Retention Optimization](#component-5-long-term-retention-optimization)
8. [Component 6: Medical Education-Specific Science](#component-6-medical-education-specific-science)
9. [Unified System Integration](#unified-system-integration)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Success Metrics & Validation](#success-metrics--validation)

---

## Executive Summary

### Vision
Build the most scientifically rigorous, data-driven learning platform for medical education by integrating modern learning science research with proven computational algorithms.

### Core Innovation
Use **FSRS (Free Spaced Repetition Scheduler)** as the computational backbone that unifies all learning science components:
- FSRS provides individual forgetting curves
- All other systems feed signals INTO FSRS to optimize scheduling
- Create a closed-loop learning optimization system

### Key Differentiators
1. **Beyond Basic SRS**: Integrates metacognition, cognitive load, and clinical reasoning
2. **Medical Education-Specific**: Designed for complex medical knowledge domains
3. **Data-Driven Personalization**: Adapts to individual learning patterns
4. **Unified Architecture**: Components work synergistically, not in isolation
5. **Research-Backed**: Every feature grounded in learning science literature

---

## Core Principle: FSRS as Computational Backbone

### Why FSRS?

**Scientific Basis:**
- Based on the Three Component Model of Memory (Retrievability, Stability, Difficulty)
- More accurate than SM-2 (shown in multiple studies)
- Adapts to individual forgetting curves
- Handles variability in review timing better
- Open-source, actively maintained

**FSRS Model:**
```
Retrievability (R) = exp(ln(0.9) / S * t)
  where:
    S = Stability (how long until retrievability drops to 90%)
    t = time since last review
    D = Difficulty (intrinsic difficulty of card)

After review:
  S_new = f(S_old, D, R, rating)
  D_new = g(D_old, rating)
```

**Key FSRS Parameters:**
- `w` = 17 weight parameters learned from review history
- `D` = Difficulty (1-10, per card)
- `S` = Stability (days, per review)
- `R` = Retrievability (0-1, calculated real-time)

### Architecture: FSRS as Central Hub

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│         ┌─────────────────────────────┐             │
│         │   FSRS SCHEDULER CORE       │             │
│         │                              │             │
│         │  • Forgetting curves         │             │
│         │  • Stability/Difficulty      │             │
│         │  • Review timing             │             │
│         │  • Parameter optimization    │             │
│         └────────────┬─────────────────┘             │
│                      │                                │
│         ┌────────────┴─────────────┐                 │
│         │                          │                 │
│    ┌────▼─────┐              ┌─────▼────┐           │
│    │ Signals  │              │ Outputs  │           │
│    │   IN     │              │   OUT    │           │
│    └────┬─────┘              └─────┬────┘           │
│         │                          │                 │
│         │                          │                 │
│  ┌──────▼─────────────┐    ┌───────▼─────────────┐  │
│  │                    │    │                      │  │
│  │  INPUT SIGNALS:    │    │  OUTPUT ACTIONS:     │  │
│  │                    │    │                      │  │
│  │  • Metacognition   │    │  • Next review time  │  │
│  │  • Cognitive load  │    │  • Question type     │  │
│  │  • Clinical context│    │  • Difficulty level  │  │
│  │  • Study sessions  │    │  • Interleaving      │  │
│  │  • Performance     │    │  • Load management   │  │
│  │                    │    │                      │  │
│  └────────────────────┘    └──────────────────────┘  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Integration Philosophy:**
1. All learning events generate signals for FSRS
2. FSRS optimizes scheduling based on all signals
3. Scheduling decisions influence other systems
4. Closed-loop: outcomes feed back to improve FSRS

---

## Component 1: FSRS-Based Spaced Repetition

### Scientific Basis

**Key Research:**
- Ebbinghaus (1885): Forgetting curve
- Bjork & Bjork (1992): New Theory of Disuse - retrieval strength vs storage strength
- Cepeda et al. (2006): Spacing effect meta-analysis
- Mozer et al. (2009): Optimal review timing
- FSRS Research (2022-2024): Modern computational approach

**Core Principles:**
1. **Spacing Effect**: Distributed practice > massed practice
2. **Desirable Difficulty**: Optimal retrieval challenge strengthens memory
3. **Individual Differences**: Forgetting rates vary by person and material
4. **Retrieval-Based Learning**: Testing effect enhances retention

### Database Schema

```sql
-- Core FSRS Parameters Table
CREATE TABLE fsrs_parameters (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    w_params FLOAT[17] NOT NULL DEFAULT ARRAY[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    -- Default params from FSRS research, will be optimized per user
    request_retention FLOAT NOT NULL DEFAULT 0.90, -- Target retrievability
    maximum_interval INTEGER NOT NULL DEFAULT 36500, -- Max days between reviews
    training_samples INTEGER DEFAULT 0, -- Number of reviews used for training
    last_optimized TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Card State (per card instance for a user)
CREATE TABLE card_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    card_id UUID NOT NULL REFERENCES cards(id), -- Base card from question bank

    -- FSRS Core State
    state VARCHAR(10) NOT NULL DEFAULT 'new', -- new, learning, review, relearning
    difficulty FLOAT NOT NULL DEFAULT 5.0, -- 1-10 scale
    stability FLOAT NOT NULL DEFAULT 0.0, -- days
    retrievability FLOAT, -- calculated on-demand

    -- Review History
    due_date TIMESTAMP NOT NULL,
    last_review TIMESTAMP,
    elapsed_days INTEGER DEFAULT 0,
    scheduled_days INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,

    -- Context for scheduling
    last_rating INTEGER, -- 1-4 (Again, Hard, Good, Easy)
    interval_modifier FLOAT DEFAULT 1.0, -- For fine-tuning

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, card_id)
);

CREATE INDEX idx_card_states_due ON card_states(user_id, due_date) WHERE state != 'suspended';
CREATE INDEX idx_card_states_stability ON card_states(stability);

-- Review History (for FSRS optimization)
CREATE TABLE review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_state_id UUID NOT NULL REFERENCES card_states(id),

    -- Review details
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
    review_time TIMESTAMP NOT NULL DEFAULT NOW(),

    -- State before review
    state_before VARCHAR(10) NOT NULL,
    difficulty_before FLOAT NOT NULL,
    stability_before FLOAT NOT NULL,
    elapsed_days INTEGER NOT NULL,
    scheduled_days INTEGER NOT NULL,

    -- State after review
    difficulty_after FLOAT NOT NULL,
    stability_after FLOAT NOT NULL,
    scheduled_days_after INTEGER NOT NULL,

    -- Timing
    review_duration_ms INTEGER, -- How long to answer

    -- Context
    session_id UUID, -- Study session

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_logs_card ON review_logs(card_state_id, review_time);
CREATE INDEX idx_review_logs_session ON review_logs(session_id);

-- Scheduling Queue (denormalized for performance)
CREATE MATERIALIZED VIEW review_queue AS
SELECT
    cs.id as card_state_id,
    cs.user_id,
    cs.card_id,
    cs.due_date,
    cs.state,
    cs.difficulty,
    cs.stability,
    cs.retrievability,
    c.content,
    c.card_type,
    c.topic_id,
    -- Pre-calculate review priority
    CASE
        WHEN cs.due_date <= NOW() THEN
            -- Overdue cards get higher priority
            EXTRACT(EPOCH FROM (NOW() - cs.due_date)) / 86400.0 * 100
        ELSE 0
    END as priority_score
FROM card_states cs
JOIN cards c ON c.id = cs.card_id
WHERE cs.state IN ('learning', 'review', 'relearning')
ORDER BY cs.due_date ASC;

CREATE UNIQUE INDEX idx_review_queue_card ON review_queue(card_state_id);
CREATE INDEX idx_review_queue_user_due ON review_queue(user_id, due_date);

REFRESH MATERIALIZED VIEW CONCURRENTLY review_queue;
```

### Implementation: FSRS Service

```python
# backend/app/services/fsrs/fsrs_core.py

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import numpy as np
from scipy.optimize import minimize

@dataclass
class FSRSCard:
    """Card state for FSRS algorithm"""
    difficulty: float  # 1-10
    stability: float   # days
    elapsed_days: int
    scheduled_days: int
    reps: int
    lapses: int
    state: str  # new, learning, review, relearning
    last_review: Optional[datetime]

@dataclass
class FSRSReviewLog:
    """Review history entry"""
    rating: int  # 1-4
    elapsed_days: int
    scheduled_days: int
    review_time: datetime
    state_before: str
    difficulty_before: float
    stability_before: float

@dataclass
class FSRSSchedulingInfo:
    """Next review scheduling"""
    again: datetime      # Rating 1
    hard: datetime       # Rating 2
    good: datetime       # Rating 3
    easy: datetime       # Rating 4
    again_interval: int
    hard_interval: int
    good_interval: int
    easy_interval: int

class FSRSScheduler:
    """
    FSRS Algorithm Implementation
    Based on: https://github.com/open-spaced-repetition/fsrs4anki
    """

    # Default parameters from FSRS research
    DEFAULT_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]

    def __init__(self, w: List[float] = None, request_retention: float = 0.9):
        """
        Initialize FSRS scheduler

        Args:
            w: 17 weight parameters (will be optimized per user)
            request_retention: Target retrievability (default 0.9 = 90%)
        """
        self.w = w or self.DEFAULT_W
        self.request_retention = request_retention

    def calculate_retrievability(self, elapsed_days: int, stability: float) -> float:
        """
        Calculate retrievability (probability of recall)

        R(t) = exp(ln(0.9) / S * t)

        Args:
            elapsed_days: Days since last review
            stability: Current stability in days

        Returns:
            Retrievability (0-1)
        """
        if stability <= 0:
            return 0.0
        return np.exp(np.log(0.9) / stability * elapsed_days)

    def calculate_next_stability(self,
                                 current_stability: float,
                                 difficulty: float,
                                 retrievability: float,
                                 rating: int,
                                 state: str) -> float:
        """
        Calculate new stability after review

        This is where the magic happens - FSRS learns optimal spacing
        """
        if state == 'new':
            # Initial stability based on rating
            if rating == 1:  # Again
                return self.w[0]
            elif rating == 2:  # Hard
                return self.w[1]
            elif rating == 3:  # Good
                return self.w[2]
            else:  # Easy
                return self.w[3]
        else:
            # Update stability based on review success
            if rating == 1:  # Again (forgot)
                # Stability decreases with forgetting
                return self.w[11] * (current_stability ** self.w[12]) * \
                       (np.exp(self.w[13] * (1 - retrievability)))
            else:
                # Successful recall - stability increases
                success_multiplier = (
                    1 +
                    np.exp(self.w[8]) *
                    (11 - difficulty) *
                    (current_stability ** -self.w[9]) *
                    (np.exp((1 - retrievability) * self.w[10]) - 1)
                )

                # Rating-specific multiplier
                if rating == 2:  # Hard
                    hard_penalty = self.w[15]
                    return current_stability * success_multiplier * hard_penalty
                elif rating == 3:  # Good
                    return current_stability * success_multiplier
                else:  # Easy
                    easy_bonus = self.w[16]
                    return current_stability * success_multiplier * easy_bonus

    def calculate_next_difficulty(self,
                                  current_difficulty: float,
                                  rating: int) -> float:
        """
        Update difficulty based on review rating

        Difficulty is intrinsic to the card - represents inherent complexity
        """
        # Difficulty change based on rating
        if rating == 1:  # Again - increase difficulty
            delta = -self.w[6] * (rating - 3)
        else:
            delta = -self.w[6] * (rating - 3)

        new_difficulty = current_difficulty + delta

        # Clamp to 1-10 range
        return max(1, min(10, new_difficulty))

    def calculate_interval_from_stability(self, stability: float) -> int:
        """
        Calculate next review interval from stability

        Interval is set so retrievability drops to request_retention
        """
        # Solve: R(interval) = request_retention
        # exp(ln(0.9) / S * interval) = request_retention
        # interval = S * ln(request_retention) / ln(0.9)

        interval = stability * np.log(self.request_retention) / np.log(0.9)

        # Round to nearest day, minimum 1 day
        return max(1, int(round(interval)))

    def schedule(self, card: FSRSCard, current_time: datetime) -> FSRSSchedulingInfo:
        """
        Calculate next review schedule for all possible ratings

        Returns scheduling info for Again/Hard/Good/Easy
        """
        # Calculate current retrievability
        elapsed_days = 0
        if card.last_review:
            elapsed_days = (current_time - card.last_review).days

        retrievability = self.calculate_retrievability(elapsed_days, card.stability)

        # Calculate stability for each rating
        intervals = {}

        for rating in [1, 2, 3, 4]:
            new_stability = self.calculate_next_stability(
                card.stability,
                card.difficulty,
                retrievability,
                rating,
                card.state
            )

            # Special handling for learning state
            if card.state == 'new' or card.state == 'learning':
                if rating == 1:  # Again
                    intervals[rating] = 1  # Review in 1 minute (converted to 1 day for simplicity)
                elif rating == 2:  # Hard
                    intervals[rating] = max(1, int(new_stability * 0.5))
                elif rating == 3:  # Good
                    intervals[rating] = max(1, int(new_stability))
                else:  # Easy
                    intervals[rating] = max(1, int(new_stability * 1.5))
            else:
                # Review state - use calculated stability
                intervals[rating] = self.calculate_interval_from_stability(new_stability)

        # Create scheduling info
        return FSRSSchedulingInfo(
            again=current_time + timedelta(days=intervals[1]),
            hard=current_time + timedelta(days=intervals[2]),
            good=current_time + timedelta(days=intervals[3]),
            easy=current_time + timedelta(days=intervals[4]),
            again_interval=intervals[1],
            hard_interval=intervals[2],
            good_interval=intervals[3],
            easy_interval=intervals[4]
        )

    def review_card(self,
                    card: FSRSCard,
                    rating: int,
                    review_time: datetime) -> Tuple[FSRSCard, FSRSSchedulingInfo]:
        """
        Process a review and update card state

        Args:
            card: Current card state
            rating: User rating (1-4)
            review_time: When the review happened

        Returns:
            (updated_card, scheduling_info)
        """
        # Calculate current retrievability
        elapsed_days = 0
        if card.last_review:
            elapsed_days = (review_time - card.last_review).days

        retrievability = self.calculate_retrievability(elapsed_days, card.stability)

        # Update stability and difficulty
        new_stability = self.calculate_next_stability(
            card.stability,
            card.difficulty,
            retrievability,
            rating,
            card.state
        )

        new_difficulty = self.calculate_next_difficulty(card.difficulty, rating)

        # Update state
        new_state = card.state
        if rating == 1:  # Failed review
            if card.state == 'review':
                new_state = 'relearning'
            card.lapses += 1
        else:  # Successful review
            if card.state == 'new' or card.state == 'learning':
                new_state = 'review'
            elif card.state == 'relearning':
                new_state = 'review'

        # Calculate next interval
        next_interval = self.calculate_interval_from_stability(new_stability)

        # Create updated card
        updated_card = FSRSCard(
            difficulty=new_difficulty,
            stability=new_stability,
            elapsed_days=elapsed_days,
            scheduled_days=next_interval,
            reps=card.reps + 1,
            lapses=card.lapses,
            state=new_state,
            last_review=review_time
        )

        # Get full scheduling info (for display purposes)
        scheduling_info = self.schedule(card, review_time)

        return updated_card, scheduling_info

    def optimize_parameters(self, review_logs: List[FSRSReviewLog]) -> List[float]:
        """
        Optimize FSRS parameters based on user's review history

        This is the personalization engine - learns individual forgetting curves

        Uses gradient descent to minimize prediction error
        """
        if len(review_logs) < 100:
            # Need sufficient data for optimization
            return self.w

        def loss_function(w: np.ndarray) -> float:
            """
            Calculate loss between predicted and actual retrievability

            Lower loss = better predictions = better scheduling
            """
            total_loss = 0

            for log in review_logs:
                # Predict retrievability with current parameters
                temp_scheduler = FSRSScheduler(w.tolist(), self.request_retention)

                predicted_r = temp_scheduler.calculate_retrievability(
                    log.elapsed_days,
                    log.stability_before
                )

                # Actual performance (inferred from rating)
                # Rating 1 = forgot (R ≈ 0.3)
                # Rating 2 = hard (R ≈ 0.6)
                # Rating 3 = good (R ≈ 0.9)
                # Rating 4 = easy (R ≈ 1.0)
                actual_r = {1: 0.3, 2: 0.6, 3: 0.9, 4: 1.0}[log.rating]

                # Mean squared error
                total_loss += (predicted_r - actual_r) ** 2

            return total_loss / len(review_logs)

        # Optimize using scipy
        initial_w = np.array(self.w)

        result = minimize(
            loss_function,
            initial_w,
            method='L-BFGS-B',
            bounds=[(0.1, 5.0)] * 17,  # Reasonable bounds for parameters
            options={'maxiter': 1000}
        )

        if result.success:
            return result.x.tolist()
        else:
            return self.w

# Example usage
def example_usage():
    """Demonstrate FSRS scheduler"""

    # Initialize scheduler
    scheduler = FSRSScheduler(request_retention=0.9)

    # New card
    card = FSRSCard(
        difficulty=5.0,
        stability=0.0,
        elapsed_days=0,
        scheduled_days=0,
        reps=0,
        lapses=0,
        state='new',
        last_review=None
    )

    # Get initial schedule
    now = datetime.now()
    schedule = scheduler.schedule(card, now)

    print(f"Initial schedule:")
    print(f"  Again: {schedule.again_interval} days")
    print(f"  Hard:  {schedule.hard_interval} days")
    print(f"  Good:  {schedule.good_interval} days")
    print(f"  Easy:  {schedule.easy_interval} days")

    # User reviews with "Good"
    updated_card, new_schedule = scheduler.review_card(card, rating=3, review_time=now)

    print(f"\nAfter 'Good' review:")
    print(f"  New difficulty: {updated_card.difficulty:.2f}")
    print(f"  New stability: {updated_card.stability:.2f} days")
    print(f"  Next review: {updated_card.scheduled_days} days")
    print(f"  State: {updated_card.state}")
```

### API Endpoints

```python
# backend/app/api/v1/fsrs.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from app.services.fsrs.fsrs_core import FSRSScheduler, FSRSCard
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/fsrs", tags=["FSRS Scheduling"])

@router.get("/due-cards")
async def get_due_cards(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """
    Get cards due for review

    Returns cards in priority order:
    1. Overdue cards (by how much they're overdue)
    2. Due cards (by due time)
    3. New cards (limited to prevent overload)
    """
    # Query review_queue materialized view
    query = """
        SELECT *
        FROM review_queue
        WHERE user_id = $1
        AND (due_date <= NOW() OR state = 'new')
        ORDER BY priority_score DESC, due_date ASC
        LIMIT $2
    """

    cards = await db.fetch_all(query, [current_user.id, limit])

    return {
        "cards": cards,
        "total_due": len([c for c in cards if c['due_date'] <= datetime.now()]),
        "total_new": len([c for c in cards if c['state'] == 'new'])
    }

@router.post("/review/{card_state_id}")
async def submit_review(
    card_state_id: str,
    rating: int,  # 1-4
    review_duration_ms: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Submit a review for a card

    Steps:
    1. Load card state
    2. Run FSRS algorithm
    3. Update card state
    4. Log review
    5. Return next review schedule
    """
    # Load card state
    card_state = await db.fetch_one(
        "SELECT * FROM card_states WHERE id = $1 AND user_id = $2",
        [card_state_id, current_user.id]
    )

    if not card_state:
        raise HTTPException(404, "Card not found")

    # Load user's FSRS parameters
    fsrs_params = await db.fetch_one(
        "SELECT * FROM fsrs_parameters WHERE user_id = $1",
        [current_user.id]
    )

    # Initialize scheduler with user's parameters
    scheduler = FSRSScheduler(
        w=fsrs_params['w_params'],
        request_retention=fsrs_params['request_retention']
    )

    # Create FSRS card object
    card = FSRSCard(
        difficulty=card_state['difficulty'],
        stability=card_state['stability'],
        elapsed_days=card_state['elapsed_days'],
        scheduled_days=card_state['scheduled_days'],
        reps=card_state['reps'],
        lapses=card_state['lapses'],
        state=card_state['state'],
        last_review=card_state['last_review']
    )

    # Process review
    updated_card, schedule_info = scheduler.review_card(
        card,
        rating,
        datetime.now()
    )

    # Update database in transaction
    async with db.transaction():
        # Update card state
        await db.execute("""
            UPDATE card_states
            SET
                difficulty = $1,
                stability = $2,
                elapsed_days = $3,
                scheduled_days = $4,
                reps = $5,
                lapses = $6,
                state = $7,
                last_review = $8,
                due_date = $9,
                last_rating = $10,
                updated_at = NOW()
            WHERE id = $11
        """, [
            updated_card.difficulty,
            updated_card.stability,
            updated_card.elapsed_days,
            updated_card.scheduled_days,
            updated_card.reps,
            updated_card.lapses,
            updated_card.state,
            updated_card.last_review,
            # Set due_date based on rating chosen
            {1: schedule_info.again, 2: schedule_info.hard, 3: schedule_info.good, 4: schedule_info.easy}[rating],
            rating,
            card_state_id
        ])

        # Log review
        await db.execute("""
            INSERT INTO review_logs (
                card_state_id,
                rating,
                review_time,
                state_before,
                difficulty_before,
                stability_before,
                elapsed_days,
                scheduled_days,
                difficulty_after,
                stability_after,
                scheduled_days_after,
                review_duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        """, [
            card_state_id,
            rating,
            datetime.now(),
            card_state['state'],
            card_state['difficulty'],
            card_state['stability'],
            card_state['elapsed_days'],
            card_state['scheduled_days'],
            updated_card.difficulty,
            updated_card.stability,
            updated_card.scheduled_days,
            review_duration_ms
        ])

    # Refresh materialized view (async background task)
    # await refresh_review_queue()

    return {
        "success": True,
        "next_review": {1: schedule_info.again, 2: schedule_info.hard, 3: schedule_info.good, 4: schedule_info.easy}[rating],
        "updated_card": {
            "difficulty": updated_card.difficulty,
            "stability": updated_card.stability,
            "state": updated_card.state,
            "reps": updated_card.reps
        },
        "schedule_preview": {
            "again": {"date": schedule_info.again, "interval": schedule_info.again_interval},
            "hard": {"date": schedule_info.hard, "interval": schedule_info.hard_interval},
            "good": {"date": schedule_info.good, "interval": schedule_info.good_interval},
            "easy": {"date": schedule_info.easy, "interval": schedule_info.easy_interval}
        }
    }

@router.post("/optimize-parameters")
async def optimize_parameters(
    current_user: User = Depends(get_current_user)
):
    """
    Optimize FSRS parameters based on user's review history

    Should be run:
    - After every 100 reviews
    - Weekly for active users
    - On demand
    """
    # Get review history
    reviews = await db.fetch_all("""
        SELECT
            rl.*,
            cs.card_id
        FROM review_logs rl
        JOIN card_states cs ON cs.id = rl.card_state_id
        WHERE cs.user_id = $1
        ORDER BY rl.review_time ASC
    """, [current_user.id])

    if len(reviews) < 100:
        return {
            "success": False,
            "message": "Need at least 100 reviews for optimization",
            "current_reviews": len(reviews)
        }

    # Convert to FSRSReviewLog objects
    from app.services.fsrs.fsrs_core import FSRSReviewLog

    review_logs = [
        FSRSReviewLog(
            rating=r['rating'],
            elapsed_days=r['elapsed_days'],
            scheduled_days=r['scheduled_days'],
            review_time=r['review_time'],
            state_before=r['state_before'],
            difficulty_before=r['difficulty_before'],
            stability_before=r['stability_before']
        )
        for r in reviews
    ]

    # Load current parameters
    current_params = await db.fetch_one(
        "SELECT * FROM fsrs_parameters WHERE user_id = $1",
        [current_user.id]
    )

    # Optimize
    scheduler = FSRSScheduler(
        w=current_params['w_params'],
        request_retention=current_params['request_retention']
    )

    optimized_w = scheduler.optimize_parameters(review_logs)

    # Update in database
    await db.execute("""
        UPDATE fsrs_parameters
        SET
            w_params = $1,
            training_samples = $2,
            last_optimized = NOW(),
            updated_at = NOW()
        WHERE user_id = $3
    """, [optimized_w, len(reviews), current_user.id])

    return {
        "success": True,
        "message": "Parameters optimized successfully",
        "training_samples": len(reviews),
        "old_params": current_params['w_params'],
        "new_params": optimized_w
    }

@router.get("/stats")
async def get_review_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """Get review statistics for analysis"""

    stats_query = """
        SELECT
            COUNT(*) as total_reviews,
            AVG(CASE WHEN rating >= 3 THEN 1.0 ELSE 0.0 END) as accuracy,
            AVG(stability_after) as avg_stability,
            AVG(difficulty_after) as avg_difficulty,
            COUNT(DISTINCT DATE(review_time)) as study_days
        FROM review_logs rl
        JOIN card_states cs ON cs.id = rl.card_state_id
        WHERE cs.user_id = $1
        AND rl.review_time >= NOW() - INTERVAL '$2 days'
    """

    stats = await db.fetch_one(stats_query, [current_user.id, days])

    # Get retention curve data
    retention_query = """
        SELECT
            elapsed_days,
            AVG(CASE WHEN rating >= 3 THEN 1.0 ELSE 0.0 END) as retention_rate,
            COUNT(*) as sample_size
        FROM review_logs rl
        JOIN card_states cs ON cs.id = rl.card_state_id
        WHERE cs.user_id = $1
        AND rl.review_time >= NOW() - INTERVAL '$2 days'
        GROUP BY elapsed_days
        ORDER BY elapsed_days
    """

    retention_curve = await db.fetch_all(retention_query, [current_user.id, days])

    return {
        "summary": stats,
        "retention_curve": retention_curve,
        "period_days": days
    }
```

### Frontend Integration

```typescript
// frontend/src/services/fsrs/fsrsService.ts

interface CardSchedule {
  again: Date;
  hard: Date;
  good: Date;
  easy: Date;
  againInterval: number;
  hardInterval: number;
  goodInterval: number;
  easyInterval: number;
}

interface ReviewResult {
  success: boolean;
  nextReview: Date;
  updatedCard: {
    difficulty: number;
    stability: number;
    state: string;
    reps: number;
  };
  schedulePreview: CardSchedule;
}

export class FSRSService {
  async getDueCards(limit: number = 20): Promise<any[]> {
    const response = await api.get(`/fsrs/due-cards?limit=${limit}`);
    return response.data.cards;
  }

  async submitReview(
    cardStateId: string,
    rating: 1 | 2 | 3 | 4,
    durationMs?: number
  ): Promise<ReviewResult> {
    const response = await api.post(`/fsrs/review/${cardStateId}`, {
      rating,
      review_duration_ms: durationMs
    });
    return response.data;
  }

  async getStats(days: number = 30): Promise<any> {
    const response = await api.get(`/fsrs/stats?days=${days}`);
    return response.data;
  }

  async optimizeParameters(): Promise<any> {
    const response = await api.post('/fsrs/optimize-parameters');
    return response.data;
  }
}

// frontend/src/components/ReviewSession/ReviewCard.tsx
import React, { useState, useEffect } from 'react';

export const ReviewCard: React.FC<{ card: any }> = ({ card }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime] = useState(Date.now());

  const handleRating = async (rating: 1 | 2 | 3 | 4) => {
    const duration = Date.now() - startTime;

    const result = await fsrsService.submitReview(
      card.card_state_id,
      rating,
      duration
    );

    // Show next review time
    toast.success(`Next review in ${result.schedulePreview[getRatingKey(rating)].interval} days`);

    // Load next card
    onNextCard();
  };

  return (
    <div className="review-card">
      <div className="question">
        {card.content.question}
      </div>

      {!showAnswer ? (
        <button onClick={() => setShowAnswer(true)}>
          Show Answer
        </button>
      ) : (
        <>
          <div className="answer">
            {card.content.answer}
          </div>

          <div className="rating-buttons">
            <button onClick={() => handleRating(1)} className="again">
              Again
              <span className="interval">1 day</span>
            </button>

            <button onClick={() => handleRating(2)} className="hard">
              Hard
              <span className="interval">2 days</span>
            </button>

            <button onClick={() => handleRating(3)} className="good">
              Good
              <span className="interval">5 days</span>
            </button>

            <button onClick={() => handleRating(4)} className="easy">
              Easy
              <span className="interval">10 days</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

### Success Metrics

**Technical Metrics:**
- Prediction accuracy: Compare predicted retrievability vs actual performance
- Parameter convergence: How quickly user-specific parameters stabilize
- Scheduling precision: Variance in actual review timing vs scheduled

**Learning Metrics:**
- Retention rate: % of reviews with rating ≥ 3
- Long-term retention: Performance on cards with >30 day intervals
- Lapse rate: % of reviews with rating = 1

**Efficiency Metrics:**
- Reviews per day to maintain knowledge
- Time to mastery (card reaches stability > 90 days)
- Knowledge decay rate when reviews are missed

**Target Benchmarks:**
- Retention rate: >85% (better than typical 70-75%)
- Parameter optimization: <5% improvement after initial 500 reviews
- Long-term retention: >80% at 6-month intervals

---

## Component 2: Active Recall & Retrieval Practice

### Scientific Basis

**Key Research:**
- Roediger & Butler (2011): Testing effect
- Karpicke & Roediger (2008): Repeated retrieval > repeated study
- Bjork (1994): Desirable difficulties
- Dunlosky et al. (2013): Practice testing = highest utility learning strategy
- Larsen et al. (2008): Repeated testing in medical education

**Core Principles:**
1. **Testing Effect**: Retrieval practice strengthens memory more than re-reading
2. **Generation Effect**: Self-generated answers > recognition
3. **Effort Hypothesis**: Retrieval difficulty → stronger encoding
4. **Elaborative Retrieval**: Connecting information during retrieval enhances learning

### Question Types & Cognitive Demands

```python
# backend/app/models/questions.py

from enum import Enum

class QuestionType(str, Enum):
    """Question types ordered by retrieval difficulty"""

    # Recognition (easiest)
    MULTIPLE_CHOICE = "mcq"              # NBME-style
    TRUE_FALSE = "true_false"

    # Cued recall
    FILL_IN_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"

    # Free recall (hardest)
    OPEN_ENDED = "open_ended"
    CASE_BASED = "case_based"

    # Application
    CLINICAL_VIGNETTE = "vignette"
    DIFFERENTIAL_DIAGNOSIS = "ddx"
    MECHANISM_EXPLANATION = "mechanism"

class RetrievalStrength(str, Enum):
    """Categorize retrieval difficulty"""
    LOW = "low"          # Multiple choice
    MEDIUM = "medium"    # Cued recall
    HIGH = "high"        # Free recall
    VERY_HIGH = "very_high"  # Application/integration

# Map question types to retrieval strength
RETRIEVAL_STRENGTH_MAP = {
    QuestionType.MULTIPLE_CHOICE: RetrievalStrength.LOW,
    QuestionType.TRUE_FALSE: RetrievalStrength.LOW,
    QuestionType.FILL_IN_BLANK: RetrievalStrength.MEDIUM,
    QuestionType.SHORT_ANSWER: RetrievalStrength.MEDIUM,
    QuestionType.OPEN_ENDED: RetrievalStrength.HIGH,
    QuestionType.CASE_BASED: RetrievalStrength.HIGH,
    QuestionType.CLINICAL_VIGNETTE: RetrievalStrength.VERY_HIGH,
    QuestionType.DIFFERENTIAL_DIAGNOSIS: RetrievalStrength.VERY_HIGH,
    QuestionType.MECHANISM_EXPLANATION: RetrievalStrength.VERY_HIGH,
}
```

### Database Schema

```sql
-- Cards (questions/items to review)
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    content JSONB NOT NULL,
    -- Structure depends on card_type:
    -- MCQ: {question, options: [{text, is_correct, explanation}], explanation, tags}
    -- Short answer: {question, answer, explanation, keywords}
    -- Clinical vignette: {case, question, options, clinical_pearl, tags}

    -- Classification
    card_type VARCHAR(50) NOT NULL, -- From QuestionType enum
    retrieval_strength VARCHAR(20) NOT NULL, -- From RetrievalStrength enum

    -- Source
    source_type VARCHAR(50), -- "user_generated", "ai_generated", "textbook", etc.
    source_document_id UUID REFERENCES documents(id),
    source_page_range INT4RANGE,

    -- Metadata
    topic_id UUID REFERENCES topics(id),
    subtopic_id UUID,
    tags TEXT[],
    estimated_difficulty FLOAT, -- 1-10, ML-predicted

    -- Quality
    quality_score FLOAT, -- From peer review / ML
    times_used INTEGER DEFAULT 0,
    avg_user_rating FLOAT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_type ON cards(card_type);
CREATE INDEX idx_cards_topic ON cards(topic_id);
CREATE INDEX idx_cards_tags ON cards USING GIN(tags);
CREATE INDEX idx_cards_source ON cards(source_document_id);

-- Retrieval practice sessions
CREATE TABLE retrieval_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Session details
    session_type VARCHAR(50) NOT NULL, -- "review", "learn", "exam_prep", "weak_areas"
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,

    -- Configuration
    target_card_count INTEGER,
    actual_card_count INTEGER,
    question_types VARCHAR(50)[],

    -- Performance
    total_correct INTEGER DEFAULT 0,
    total_attempted INTEGER DEFAULT 0,
    avg_confidence FLOAT,
    avg_response_time_ms INTEGER,

    -- Context
    study_mode VARCHAR(50), -- "spaced_repetition", "cramming", "mixed"

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retrieval_sessions_user ON retrieval_sessions(user_id, started_at DESC);

-- Individual retrieval attempts
CREATE TABLE retrieval_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES retrieval_sessions(id),
    card_state_id UUID NOT NULL REFERENCES card_states(id),

    -- Attempt details
    attempt_number INTEGER NOT NULL DEFAULT 1, -- For same card in session
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- Response
    user_answer JSONB, -- Format depends on question type
    is_correct BOOLEAN,
    partial_credit FLOAT, -- For questions with multiple parts

    -- Metacognition (see Component 3)
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
    perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 5),

    -- Timing
    time_to_answer_ms INTEGER,
    time_viewing_question_ms INTEGER,
    time_viewing_explanation_ms INTEGER,

    -- Hints/help used
    hints_requested INTEGER DEFAULT 0,
    hints_viewed TEXT[],

    -- Feedback
    feedback_viewed BOOLEAN DEFAULT FALSE,
    feedback_quality_rating INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retrieval_attempts_session ON retrieval_attempts(session_id);
CREATE INDEX idx_retrieval_attempts_card ON retrieval_attempts(card_state_id, started_at DESC);
```

### Implementation: Retrieval Practice Engine

```python
# backend/app/services/retrieval/retrieval_engine.py

from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
from app.services.fsrs.fsrs_core import FSRSScheduler

@dataclass
class RetrievalContext:
    """Context for selecting appropriate retrieval practice"""
    user_id: str
    session_type: str  # "review", "learn", "exam_prep"
    target_count: int
    difficulty_range: tuple  # (min, max)
    question_types: List[str]
    topics: Optional[List[str]] = None
    include_weak_areas: bool = True

class RetrievalEngine:
    """
    Intelligent retrieval practice selection

    Selects questions based on:
    1. FSRS schedule (due cards)
    2. Retrieval strength progression
    3. Interleaving strategy
    4. Weak area targeting
    5. Cognitive load management
    """

    def __init__(self, fsrs_scheduler: FSRSScheduler):
        self.fsrs = fsrs_scheduler

    async def select_practice_cards(self, context: RetrievalContext) -> List[Dict[Any, Any]]:
        """
        Select optimal cards for retrieval practice

        Algorithm:
        1. Get due cards from FSRS
        2. Add new cards (limited to prevent overload)
        3. Add targeted weak area cards
        4. Apply interleaving strategy
        5. Order by optimal difficulty progression
        """
        selected_cards = []

        # 1. Due cards (highest priority)
        due_cards = await self._get_due_cards(context)
        selected_cards.extend(due_cards[:context.target_count // 2])

        # 2. New cards (controlled introduction)
        if len(selected_cards) < context.target_count:
            new_cards = await self._get_new_cards(context, limit=context.target_count // 4)
            selected_cards.extend(new_cards)

        # 3. Weak area cards (targeted practice)
        if context.include_weak_areas and len(selected_cards) < context.target_count:
            weak_cards = await self._get_weak_area_cards(context, limit=context.target_count // 4)
            selected_cards.extend(weak_cards)

        # 4. Apply interleaving
        selected_cards = self._apply_interleaving(selected_cards)

        # 5. Progressive difficulty
        selected_cards = self._order_by_difficulty_progression(selected_cards)

        return selected_cards[:context.target_count]

    async def _get_due_cards(self, context: RetrievalContext) -> List[Dict]:
        """Get cards due for review"""
        query = """
            SELECT
                cs.*,
                c.content,
                c.card_type,
                c.topic_id,
                c.tags
            FROM card_states cs
            JOIN cards c ON c.id = cs.card_id
            WHERE cs.user_id = $1
            AND cs.due_date <= NOW()
            AND cs.state IN ('review', 'relearning')
            AND c.card_type = ANY($2)
            ORDER BY cs.due_date ASC
        """

        return await db.fetch_all(query, [
            context.user_id,
            context.question_types
        ])

    async def _get_new_cards(self, context: RetrievalContext, limit: int) -> List[Dict]:
        """
        Get new cards for learning

        Strategy:
        - Start with lower retrieval strength (MCQ)
        - From topics user is currently studying
        - High-quality cards only
        """
        query = """
            SELECT
                cs.*,
                c.content,
                c.card_type,
                c.retrieval_strength,
                c.topic_id,
                c.tags
            FROM card_states cs
            JOIN cards c ON c.id = cs.card_id
            WHERE cs.user_id = $1
            AND cs.state = 'new'
            AND c.card_type = ANY($2)
            AND c.quality_score >= 0.7
            ORDER BY
                c.retrieval_strength ASC,  -- Easier first
                c.estimated_difficulty ASC,
                RANDOM()
            LIMIT $3
        """

        return await db.fetch_all(query, [
            context.user_id,
            context.question_types,
            limit
        ])

    async def _get_weak_area_cards(self, context: RetrievalContext, limit: int) -> List[Dict]:
        """
        Identify and target weak areas

        Weak areas determined by:
        - Low accuracy on recent reviews
        - High lapse rate
        - Low stability
        """
        query = """
            WITH weak_cards AS (
                SELECT
                    cs.id,
                    cs.card_id,
                    cs.lapses::FLOAT / NULLIF(cs.reps, 0) as lapse_rate,
                    cs.stability,
                    AVG(CASE WHEN rl.rating >= 3 THEN 1.0 ELSE 0.0 END) as recent_accuracy
                FROM card_states cs
                LEFT JOIN review_logs rl ON rl.card_state_id = cs.id
                WHERE cs.user_id = $1
                AND cs.reps >= 3  -- Has some history
                AND rl.review_time >= NOW() - INTERVAL '30 days'
                GROUP BY cs.id, cs.card_id, cs.lapses, cs.reps, cs.stability
                HAVING AVG(CASE WHEN rl.rating >= 3 THEN 1.0 ELSE 0.0 END) < 0.7
                OR cs.lapses::FLOAT / NULLIF(cs.reps, 0) > 0.3
                ORDER BY lapse_rate DESC, recent_accuracy ASC
                LIMIT $2
            )
            SELECT
                cs.*,
                c.content,
                c.card_type,
                c.topic_id
            FROM weak_cards wc
            JOIN card_states cs ON cs.id = wc.id
            JOIN cards c ON c.id = cs.card_id
            WHERE c.card_type = ANY($3)
        """

        return await db.fetch_all(query, [
            context.user_id,
            limit,
            context.question_types
        ])

    def _apply_interleaving(self, cards: List[Dict]) -> List[Dict]:
        """
        Apply interleaving strategy

        Interleaving: Mix topics/types rather than blocking

        Research shows interleaving improves:
        - Discrimination between concepts
        - Transfer of learning
        - Long-term retention

        Algorithm:
        - Group by topic
        - Round-robin selection
        """
        if len(cards) <= 3:
            return cards

        # Group by topic
        by_topic = {}
        for card in cards:
            topic = card.get('topic_id', 'unknown')
            if topic not in by_topic:
                by_topic[topic] = []
            by_topic[topic].append(card)

        # Round-robin interleaving
        interleaved = []
        topic_keys = list(by_topic.keys())

        while any(by_topic.values()):
            for topic in topic_keys:
                if by_topic[topic]:
                    interleaved.append(by_topic[topic].pop(0))

        return interleaved

    def _order_by_difficulty_progression(self, cards: List[Dict]) -> List[Dict]:
        """
        Order cards by progressive difficulty

        Strategy:
        - Start easier (warm-up)
        - Progressive difficulty increase
        - End with moderate difficulty (avoid burnout)

        Based on: Inverted U-curve of optimal difficulty
        """
        if len(cards) <= 3:
            return cards

        # Sort by difficulty
        sorted_cards = sorted(cards, key=lambda c: c.get('difficulty', 5.0))

        # Create progression: easy -> hard -> moderate
        third = len(sorted_cards) // 3

        progression = (
            sorted_cards[:third] +           # Easy start
            sorted_cards[2*third:] +         # Hardest middle
            sorted_cards[third:2*third]      # Moderate end
        )

        return progression

# Question type progression system
class RetrievalProgression:
    """
    Manages progression through retrieval difficulty levels

    As cards become more stable, increase retrieval difficulty
    """

    PROGRESSION_MAP = {
        # Stability range -> appropriate question types
        (0, 7): [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
        (7, 30): [QuestionType.MULTIPLE_CHOICE, QuestionType.FILL_IN_BLANK, QuestionType.SHORT_ANSWER],
        (30, 90): [QuestionType.SHORT_ANSWER, QuestionType.CASE_BASED, QuestionType.CLINICAL_VIGNETTE],
        (90, float('inf')): [QuestionType.OPEN_ENDED, QuestionType.CLINICAL_VIGNETTE, QuestionType.DIFFERENTIAL_DIAGNOSIS]
    }

    @staticmethod
    def get_appropriate_question_types(stability: float) -> List[QuestionType]:
        """
        Get appropriate question types based on card stability

        Principle: Increase retrieval difficulty as memory strengthens
        """
        for (min_stab, max_stab), types in RetrievalProgression.PROGRESSION_MAP.items():
            if min_stab <= stability < max_stab:
                return types

        return [QuestionType.MULTIPLE_CHOICE]  # Default

    @staticmethod
    async def suggest_next_question_type(card_state_id: str) -> QuestionType:
        """
        Suggest next question type for a card based on current stability
        """
        card_state = await db.fetch_one(
            "SELECT stability FROM card_states WHERE id = $1",
            [card_state_id]
        )

        appropriate_types = RetrievalProgression.get_appropriate_question_types(
            card_state['stability']
        )

        # Return hardest appropriate type (push difficulty)
        return appropriate_types[-1]
```

### API Endpoints

```python
# backend/app/api/v1/retrieval.py

from fastapi import APIRouter, Depends
from app.services.retrieval.retrieval_engine import RetrievalEngine, RetrievalContext

router = APIRouter(prefix="/retrieval", tags=["Retrieval Practice"])

@router.post("/start-session")
async def start_retrieval_session(
    session_type: str,
    target_count: int = 20,
    question_types: List[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Start a retrieval practice session

    Returns optimally selected cards for practice
    """
    # Create context
    context = RetrievalContext(
        user_id=current_user.id,
        session_type=session_type,
        target_count=target_count,
        difficulty_range=(1, 10),
        question_types=question_types or ["mcq", "short_answer"],
        include_weak_areas=True
    )

    # Select cards
    engine = RetrievalEngine(fsrs_scheduler)
    cards = await engine.select_practice_cards(context)

    # Create session record
    session_id = await db.fetch_val("""
        INSERT INTO retrieval_sessions (
            user_id,
            session_type,
            target_card_count,
            question_types
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
    """, [current_user.id, session_type, target_count, question_types])

    return {
        "session_id": session_id,
        "cards": cards,
        "count": len(cards)
    }

@router.post("/submit-answer")
async def submit_retrieval_answer(
    session_id: str,
    card_state_id: str,
    user_answer: Dict[str, Any],
    confidence: int,  # 1-5
    time_to_answer_ms: int,
    current_user: User = Depends(get_current_user)
):
    """
    Submit answer for a retrieval practice attempt

    Steps:
    1. Grade answer
    2. Record attempt
    3. Update FSRS (if appropriate)
    4. Provide feedback
    """
    # Load card
    card = await db.fetch_one("""
        SELECT cs.*, c.content, c.card_type
        FROM card_states cs
        JOIN cards c ON c.id = cs.card_id
        WHERE cs.id = $1 AND cs.user_id = $2
    """, [card_state_id, current_user.id])

    # Grade answer
    is_correct, partial_credit, feedback = await grade_answer(
        card['content'],
        card['card_type'],
        user_answer
    )

    # Record attempt
    attempt_id = await db.fetch_val("""
        INSERT INTO retrieval_attempts (
            session_id,
            card_state_id,
            user_answer,
            is_correct,
            partial_credit,
            confidence_rating,
            time_to_answer_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    """, [
        session_id,
        card_state_id,
        user_answer,
        is_correct,
        partial_credit,
        confidence,
        time_to_answer_ms
    ])

    # Convert to FSRS rating
    # is_correct + confidence → FSRS rating (1-4)
    fsrs_rating = calculate_fsrs_rating(is_correct, confidence, partial_credit)

    # Update FSRS schedule
    from app.api.v1.fsrs import submit_review
    fsrs_result = await submit_review(
        card_state_id,
        fsrs_rating,
        time_to_answer_ms,
        current_user
    )

    # Update session stats
    await db.execute("""
        UPDATE retrieval_sessions
        SET
            total_attempted = total_attempted + 1,
            total_correct = total_correct + CASE WHEN $2 THEN 1 ELSE 0 END,
            actual_card_count = (
                SELECT COUNT(DISTINCT card_state_id)
                FROM retrieval_attempts
                WHERE session_id = $1
            )
        WHERE id = $1
    """, [session_id, is_correct])

    return {
        "attempt_id": attempt_id,
        "is_correct": is_correct,
        "partial_credit": partial_credit,
        "feedback": feedback,
        "next_review": fsrs_result['next_review'],
        "xp_earned": calculate_xp(is_correct, confidence, card['difficulty'])
    }

def calculate_fsrs_rating(is_correct: bool, confidence: int, partial_credit: float) -> int:
    """
    Convert retrieval practice performance to FSRS rating

    Mapping:
    - Wrong + low confidence → Again (1)
    - Wrong + high confidence → Hard (2) [overconfidence]
    - Correct + low confidence → Hard (2)
    - Correct + medium confidence → Good (3)
    - Correct + high confidence → Easy (4)
    """
    if not is_correct and partial_credit < 0.5:
        # Failed
        return 1 if confidence <= 2 else 2  # Overconfident failure
    elif not is_correct or partial_credit < 0.8:
        # Partial success
        return 2
    else:
        # Success
        if confidence <= 2:
            return 2  # Correct but unsure
        elif confidence <= 4:
            return 3  # Correct, moderate confidence
        else:
            return 4  # Correct, very confident

async def grade_answer(
    card_content: Dict,
    card_type: str,
    user_answer: Dict
) -> Tuple[bool, float, str]:
    """
    Grade answer based on question type

    Returns: (is_correct, partial_credit, feedback)
    """
    if card_type == "mcq":
        # Multiple choice
        correct_option = next(
            (opt for opt in card_content['options'] if opt['is_correct']),
            None
        )
        is_correct = user_answer['selected_option'] == correct_option['text']
        feedback = card_content.get('explanation', '')

        return is_correct, 1.0 if is_correct else 0.0, feedback

    elif card_type == "short_answer":
        # Short answer - use LLM for grading
        from app.services.ai.grader import grade_short_answer

        result = await grade_short_answer(
            question=card_content['question'],
            expected_answer=card_content['answer'],
            user_answer=user_answer['text'],
            keywords=card_content.get('keywords', [])
        )

        return result['is_correct'], result['partial_credit'], result['feedback']

    elif card_type == "clinical_vignette":
        # Clinical vignette - MCQ format
        correct_option = next(
            (opt for opt in card_content['options'] if opt['is_correct']),
            None
        )
        is_correct = user_answer['selected_option'] == correct_option['text']

        # Rich feedback for clinical cases
        feedback = f"""
        **Correct Answer:** {correct_option['text']}

        **Explanation:** {correct_option['explanation']}

        **Clinical Pearl:** {card_content.get('clinical_pearl', '')}
        """

        return is_correct, 1.0 if is_correct else 0.0, feedback

    # Default
    return False, 0.0, "Unable to grade this question type"
```

### Success Metrics

**Retrieval Practice Metrics:**
- **Retrieval success rate**: % correct on first attempt
- **Retrieval strength progression**: Tracking question type difficulty over time
- **Interleaving effectiveness**: Performance on interleaved vs blocked practice
- **Transfer performance**: Ability to answer different question types on same content

**Target Benchmarks:**
- Initial retrieval success: 60-70% (optimal difficulty)
- Progression to higher retrieval strength within 30 days
- Interleaved practice: <10% performance drop vs blocked (worth it for long-term benefits)
- Cross-question-type transfer: >70% success on new format for mastered content

---

## Component 3: Metacognition & Self-Assessment

### Scientific Basis

**Key Research:**
- Flavell (1979): Foundation of metacognition
- Koriat (1997): Monitoring and control of memory
- Dunlosky & Metcalfe (2009): Metacognition in learning
- Kruger & Dunning (1999): Unskilled and unaware
- Nelson & Narens (1990): Metamemory framework
- Bjork et al. (2013): Self-regulated learning

**Core Principles:**
1. **Metacognitive Monitoring**: Assessing one's own knowledge state
2. **Metacognitive Control**: Adjusting learning strategies based on monitoring
3. **Judgment of Learning (JOL)**: Predicting future recall
4. **Calibration**: Alignment between confidence and actual performance
5. **Illusions of Competence**: Recognition and mitigation

### Database Schema

```sql
-- Metacognitive judgments
CREATE TABLE metacognitive_judgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retrieval_attempt_id UUID NOT NULL REFERENCES retrieval_attempts(id),

    -- Pre-retrieval judgments
    ease_of_learning INTEGER CHECK (ease_of_learning BETWEEN 1 AND 5),
    -- "How easy will this be to learn?" (1=very hard, 5=very easy)

    -- During retrieval
    feeling_of_knowing INTEGER CHECK (feeling_of_knowing BETWEEN 1 AND 5),
    -- "How confident are you that you know this?" before answering

    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
    -- "How confident are you in your answer?" after answering

    perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 5),
    -- "How difficult was this question?" after answering

    -- Post-retrieval judgments
    judgment_of_learning INTEGER CHECK (judgment_of_learning BETWEEN 1 AND 5),
    -- "How likely are you to remember this in the future?" after feedback

    would_review_again BOOLEAN,
    -- "Should you review this again soon?"

    -- Calibration metrics (computed)
    calibration_accuracy FLOAT,
    -- |confidence - actual_performance|

    overconfidence_score FLOAT,
    -- confidence - actual_performance (positive = overconfident)

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metacog_attempt ON metacognitive_judgments(retrieval_attempt_id);

-- Calibration tracking over time
CREATE TABLE calibration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Calibration metrics
    overall_calibration_error FLOAT,
    -- Mean absolute calibration error (MACE)

    overconfidence_bias FLOAT,
    -- Mean signed calibration error (positive = overconfident)

    calibration_by_confidence JSONB,
    -- {"1": accuracy, "2": accuracy, ...}

    dunning_kruger_score FLOAT,
    -- Correlation between confidence and actual performance
    -- Negative correlation = Dunning-Kruger effect

    -- Performance by metacognitive state
    high_confidence_accuracy FLOAT,
    low_confidence_accuracy FLOAT,

    -- Sample size
    total_judgments INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calibration_user_period ON calibration_history(user_id, period_start DESC);

-- Metacognitive interventions
CREATE TABLE metacognitive_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Intervention type
    intervention_type VARCHAR(50) NOT NULL,
    -- "calibration_training", "dunning_kruger_alert", "overconfidence_warning", "underconfidence_encouragement"

    -- Context
    triggered_by VARCHAR(100),
    -- What caused this intervention

    trigger_data JSONB,
    -- Supporting data

    -- Intervention details
    message TEXT,
    action_items TEXT[],

    -- User response
    acknowledged BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    action_taken VARCHAR(100),

    -- Effectiveness
    before_calibration FLOAT,
    after_calibration FLOAT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interventions_user ON metacognitive_interventions(user_id, created_at DESC);
```

### Implementation: Metacognition Engine

```python
# backend/app/services/metacognition/metacognition_engine.py

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np

@dataclass
class CalibrationMetrics:
    """Calibration analysis results"""
    mean_absolute_error: float  # 0-1, lower is better
    overconfidence_bias: float  # Negative = underconfident
    dunning_kruger_score: float  # Correlation: -1 to 1
    calibration_by_confidence: Dict[int, float]
    sample_size: int

@dataclass
class MetacognitiveState:
    """Current metacognitive profile"""
    user_id: str
    overall_calibration: float
    overconfidence_tendency: float  # -1 to 1
    dunning_kruger_risk: float  # 0 to 1
    needs_intervention: bool
    intervention_type: Optional[str]

class MetacognitionEngine:
    """
    Metacognition monitoring and intervention system

    Functions:
    1. Track metacognitive judgments
    2. Calculate calibration metrics
    3. Detect Dunning-Kruger effect
    4. Trigger interventions
    5. Improve self-assessment over time
    """

    # Calibration thresholds
    GOOD_CALIBRATION = 0.15  # MACE < 0.15 is well-calibrated
    OVERCONFIDENCE_THRESHOLD = 0.25
    DUNNING_KRUGER_THRESHOLD = -0.3  # Negative correlation

    async def record_metacognitive_judgment(
        self,
        attempt_id: str,
        feeling_of_knowing: int,
        confidence: int,
        perceived_difficulty: int,
        judgment_of_learning: int
    ) -> str:
        """Record metacognitive judgments for an attempt"""

        # Get actual performance
        attempt = await db.fetch_one(
            "SELECT is_correct, partial_credit FROM retrieval_attempts WHERE id = $1",
            [attempt_id]
        )

        actual_performance = attempt['partial_credit'] if attempt['partial_credit'] else (
            1.0 if attempt['is_correct'] else 0.0
        )

        # Calculate calibration
        # Confidence: 1-5 → 0.2-1.0
        confidence_prob = confidence / 5.0
        calibration_error = abs(confidence_prob - actual_performance)
        overconfidence = confidence_prob - actual_performance

        # Record
        judgment_id = await db.fetch_val("""
            INSERT INTO metacognitive_judgments (
                retrieval_attempt_id,
                feeling_of_knowing,
                confidence_rating,
                perceived_difficulty,
                judgment_of_learning,
                calibration_accuracy,
                overconfidence_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        """, [
            attempt_id,
            feeling_of_knowing,
            confidence,
            perceived_difficulty,
            judgment_of_learning,
            calibration_error,
            overconfidence
        ])

        return judgment_id

    async def calculate_calibration_metrics(
        self,
        user_id: str,
        days: int = 30
    ) -> CalibrationMetrics:
        """
        Calculate calibration metrics for a user

        Calibration: How well confidence matches actual performance
        """
        # Get recent judgments with performance
        query = """
            SELECT
                mj.confidence_rating,
                mj.calibration_accuracy,
                mj.overconfidence_score,
                ra.is_correct,
                ra.partial_credit
            FROM metacognitive_judgments mj
            JOIN retrieval_attempts ra ON ra.id = mj.retrieval_attempt_id
            JOIN card_states cs ON cs.id = ra.card_state_id
            WHERE cs.user_id = $1
            AND mj.created_at >= NOW() - INTERVAL '$2 days'
        """

        judgments = await db.fetch_all(query, [user_id, days])

        if not judgments:
            return CalibrationMetrics(
                mean_absolute_error=0.0,
                overconfidence_bias=0.0,
                dunning_kruger_score=0.0,
                calibration_by_confidence={},
                sample_size=0
            )

        # Mean Absolute Calibration Error (MACE)
        mace = np.mean([j['calibration_accuracy'] for j in judgments])

        # Overconfidence bias (mean signed error)
        overconfidence = np.mean([j['overconfidence_score'] for j in judgments])

        # Calibration by confidence level
        by_confidence = {}
        for conf_level in [1, 2, 3, 4, 5]:
            level_judgments = [
                j for j in judgments
                if j['confidence_rating'] == conf_level
            ]
            if level_judgments:
                accuracy = np.mean([
                    j['partial_credit'] if j['partial_credit'] else (
                        1.0 if j['is_correct'] else 0.0
                    )
                    for j in level_judgments
                ])
                by_confidence[conf_level] = accuracy

        # Dunning-Kruger detection
        # Calculate correlation between confidence and performance
        confidences = np.array([j['confidence_rating'] / 5.0 for j in judgments])
        performances = np.array([
            j['partial_credit'] if j['partial_credit'] else (
                1.0 if j['is_correct'] else 0.0
            )
            for j in judgments
        ])

        if len(confidences) > 5:
            dunning_kruger = np.corrcoef(confidences, performances)[0, 1]
        else:
            dunning_kruger = 0.0

        return CalibrationMetrics(
            mean_absolute_error=mace,
            overconfidence_bias=overconfidence,
            dunning_kruger_score=dunning_kruger,
            calibration_by_confidence=by_confidence,
            sample_size=len(judgments)
        )

    async def assess_metacognitive_state(
        self,
        user_id: str
    ) -> MetacognitiveState:
        """
        Assess user's current metacognitive state

        Determines if intervention is needed
        """
        metrics = await self.calculate_calibration_metrics(user_id)

        # Determine intervention needs
        needs_intervention = False
        intervention_type = None

        if metrics.sample_size < 20:
            # Not enough data yet
            pass
        elif metrics.dunning_kruger_score < self.DUNNING_KRUGER_THRESHOLD:
            # Dunning-Kruger effect detected
            needs_intervention = True
            intervention_type = "dunning_kruger_alert"
        elif metrics.overconfidence_bias > self.OVERCONFIDENCE_THRESHOLD:
            # Overconfident
            needs_intervention = True
            intervention_type = "overconfidence_warning"
        elif metrics.overconfidence_bias < -self.OVERCONFIDENCE_THRESHOLD:
            # Underconfident
            needs_intervention = True
            intervention_type = "underconfidence_encouragement"
        elif metrics.mean_absolute_error > self.GOOD_CALIBRATION:
            # Poor calibration
            needs_intervention = True
            intervention_type = "calibration_training"

        return MetacognitiveState(
            user_id=user_id,
            overall_calibration=1.0 - metrics.mean_absolute_error,
            overconfidence_tendency=metrics.overconfidence_bias,
            dunning_kruger_risk=max(0, -metrics.dunning_kruger_score),
            needs_intervention=needs_intervention,
            intervention_type=intervention_type
        )

    async def trigger_intervention(
        self,
        user_id: str,
        state: MetacognitiveState
    ) -> Dict:
        """
        Trigger metacognitive intervention

        Interventions:
        1. Dunning-Kruger alert: "You're overconfident on topics you're struggling with"
        2. Overconfidence warning: "Your confidence is higher than your performance"
        3. Underconfidence encouragement: "You're doing better than you think!"
        4. Calibration training: "Let's practice self-assessment"
        """
        if not state.needs_intervention:
            return {"intervention_triggered": False}

        # Generate intervention message
        messages = {
            "dunning_kruger_alert": {
                "title": "⚠️ Confidence vs Performance Gap Detected",
                "message": """
                We've noticed a pattern: you're often highly confident on questions you get wrong.

                This is called the Dunning-Kruger effect - when we don't know enough about a topic,
                we can't accurately assess our own knowledge.

                **What this means:**
                - Your confidence ratings aren't matching your actual performance
                - You may be moving on from topics before they're truly mastered

                **What to do:**
                - Review topics you felt confident about but got wrong
                - Practice more self-assessment: "Can I explain this to someone else?"
                - Use "Hard" ratings more often when uncertain
                """,
                "actions": [
                    "Review overconfident misses",
                    "Enable calibration feedback",
                    "Take metacognition training module"
                ]
            },
            "overconfidence_warning": {
                "title": "📊 You're More Confident Than Accurate",
                "message": """
                Your confidence ratings are consistently higher than your actual performance.

                **Current metrics:**
                - Your average confidence: {confidence:.0%}
                - Your actual accuracy: {accuracy:.0%}
                - Gap: {gap:.0%} overconfident

                **Impact:**
                - You may be reviewing cards too infrequently
                - Knowledge gaps might not get enough attention

                **Suggestions:**
                - Be more conservative with "Easy" ratings
                - Use "Good" for correct answers you had to think about
                - Review cards even when you feel confident
                """,
                "actions": [
                    "Adjust review frequency",
                    "Practice deliberate difficulty",
                    "Enable confidence calibration"
                ]
            },
            "underconfidence_encouragement": {
                "title": "💪 You're Better Than You Think!",
                "message": """
                Good news: You're actually performing better than your confidence suggests!

                **Current metrics:**
                - Your average confidence: {confidence:.0%}
                - Your actual accuracy: {accuracy:.0%}
                - You're {gap:.0%} more accurate than you think!

                **What this means:**
                - You can trust your knowledge more
                - You may be reviewing too frequently

                **Suggestions:**
                - Use "Easy" ratings more when you get it right quickly
                - Trust your first instinct
                - Challenge yourself with harder question types
                """,
                "actions": [
                    "Increase review intervals",
                    "Try harder question types",
                    "Build confidence through recognition"
                ]
            },
            "calibration_training": {
                "title": "🎯 Let's Improve Your Self-Assessment",
                "message": """
                Your confidence doesn't consistently match your performance.
                Let's work on calibrating your self-assessment!

                **Calibration training:**
                We'll practice judging your own knowledge accurately.

                **How it works:**
                1. Predict your performance before answering
                2. Get immediate feedback on your prediction
                3. Learn to recognize true understanding vs familiarity

                **Goal:**
                Match your confidence to your actual performance.
                """,
                "actions": [
                    "Start calibration training",
                    "View calibration examples",
                    "Track improvement over time"
                ]
            }
        }

        intervention_data = messages.get(state.intervention_type, messages["calibration_training"])

        # Calculate metrics for message template
        metrics = await self.calculate_calibration_metrics(user_id)
        confidence_avg = 0.6 + (metrics.overconfidence_bias)  # Rough estimate
        accuracy_avg = confidence_avg - metrics.overconfidence_bias

        # Format message
        formatted_message = intervention_data["message"].format(
            confidence=confidence_avg,
            accuracy=accuracy_avg,
            gap=abs(metrics.overconfidence_bias)
        )

        # Record intervention
        intervention_id = await db.fetch_val("""
            INSERT INTO metacognitive_interventions (
                user_id,
                intervention_type,
                triggered_by,
                trigger_data,
                message,
                action_items,
                before_calibration
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        """, [
            user_id,
            state.intervention_type,
            "automated_assessment",
            {
                "calibration_error": metrics.mean_absolute_error,
                "overconfidence": metrics.overconfidence_bias,
                "dunning_kruger": metrics.dunning_kruger_score
            },
            formatted_message,
            intervention_data["actions"],
            1.0 - metrics.mean_absolute_error
        ])

        return {
            "intervention_triggered": True,
            "intervention_id": intervention_id,
            "type": state.intervention_type,
            "title": intervention_data["title"],
            "message": formatted_message,
            "actions": intervention_data["actions"]
        }

    async def provide_immediate_feedback(
        self,
        attempt_id: str,
        confidence: int,
        is_correct: bool
    ) -> Dict:
        """
        Provide immediate metacognitive feedback after review

        Helps calibration through immediate feedback
        """
        confidence_text = ["Very Low", "Low", "Moderate", "High", "Very High"][confidence - 1]

        if is_correct and confidence >= 4:
            feedback_type = "good_calibration"
            message = f"✅ Good calibration! You were {confidence_text.lower()} confidence and got it correct."
        elif is_correct and confidence <= 2:
            feedback_type = "underconfident_success"
            message = f"💪 You got it right despite {confidence_text.lower()} confidence. Trust yourself more!"
        elif not is_correct and confidence >= 4:
            feedback_type = "overconfident_failure"
            message = f"⚠️ You were {confidence_text.lower()} confidence but got it wrong. This indicates a gap in understanding."
        elif not is_correct and confidence <= 2:
            feedback_type = "good_calibration_failure"
            message = f"📚 You correctly identified this as difficult. Good self-awareness - now let's master it!"
        else:
            feedback_type = "moderate"
            message = "Keep practicing self-assessment!"

        return {
            "feedback_type": feedback_type,
            "message": message,
            "encouragement": True
        }

class CalibrationTrainer:
    """
    Interactive calibration training module

    Teaches users to accurately assess their knowledge
    """

    async def start_training_session(self, user_id: str) -> Dict:
        """Start a calibration training session"""

        # Select cards user has seen before
        cards = await db.fetch_all("""
            SELECT cs.*, c.content, c.card_type
            FROM card_states cs
            JOIN cards c ON c.id = cs.card_id
            WHERE cs.user_id = $1
            AND cs.reps >= 2
            AND cs.reps <= 10
            ORDER BY RANDOM()
            LIMIT 10
        """, [user_id])

        return {
            "session_type": "calibration_training",
            "cards": cards,
            "instructions": """
            For each question:
            1. Read the question
            2. Predict: Will you get this right? (1-5 confidence)
            3. Answer the question
            4. See how your prediction matched reality

            Goal: Learn to accurately predict your performance!
            """
        }

    async def process_training_attempt(
        self,
        user_id: str,
        card_id: str,
        predicted_confidence: int,
        actual_answer: Dict,
        is_correct: bool
    ) -> Dict:
        """
        Process a calibration training attempt

        Provides detailed feedback on calibration
        """
        # Calculate calibration
        predicted_prob = predicted_confidence / 5.0
        actual_prob = 1.0 if is_correct else 0.0
        calibration_error = abs(predicted_prob - actual_prob)

        # Generate feedback
        if calibration_error < 0.2:
            calibration_quality = "excellent"
            feedback = "🎯 Excellent calibration! Your prediction matched reality."
        elif calibration_error < 0.4:
            calibration_quality = "good"
            feedback = "👍 Good calibration. Your prediction was close."
        else:
            calibration_quality = "poor"
            if predicted_prob > actual_prob:
                feedback = "📉 Overconfident. You predicted higher performance than actual."
            else:
                feedback = "📈 Underconfident. You did better than you predicted!"

        return {
            "calibration_error": calibration_error,
            "calibration_quality": calibration_quality,
            "feedback": feedback,
            "learning_point": generate_calibration_learning_point(
                predicted_confidence,
                is_correct,
                calibration_error
            )
        }

def generate_calibration_learning_point(
    predicted_confidence: int,
    is_correct: bool,
    error: float
) -> str:
    """Generate actionable learning point"""

    if is_correct and predicted_confidence >= 4 and error < 0.2:
        return "When you feel very confident AND get it right, that's true mastery!"
    elif is_correct and predicted_confidence <= 2:
        return "You know more than you think! This is a sign to increase confidence."
    elif not is_correct and predicted_confidence >= 4:
        return "High confidence + wrong answer = knowledge gap. Mark this for extra review!"
    elif not is_correct and predicted_confidence <= 2:
        return "You correctly identified uncertainty. Now focus on mastering this concept."
    else:
        return "Keep practicing prediction. The goal is to know when you know!"
```

### API Endpoints

```python
# backend/app/api/v1/metacognition.py

from fastapi import APIRouter, Depends
from app.services.metacognition.metacognition_engine import MetacognitionEngine

router = APIRouter(prefix="/metacognition", tags=["Metacognition"])

@router.get("/status")
async def get_metacognitive_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get user's current metacognitive state
    """
    engine = MetacognitionEngine()
    state = await engine.assess_metacognitive_state(current_user.id)

    return {
        "overall_calibration": state.overall_calibration,
        "overconfidence_tendency": state.overconfidence_tendency,
        "dunning_kruger_risk": state.dunning_kruger_risk,
        "needs_intervention": state.needs_intervention,
        "intervention_type": state.intervention_type
    }

@router.get("/metrics")
async def get_calibration_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed calibration metrics
    """
    engine = MetacognitionEngine()
    metrics = await engine.calculate_calibration_metrics(current_user.id, days)

    return {
        "mean_absolute_error": metrics.mean_absolute_error,
        "overconfidence_bias": metrics.overconfidence_bias,
        "dunning_kruger_score": metrics.dunning_kruger_score,
        "calibration_by_confidence": metrics.calibration_by_confidence,
        "sample_size": metrics.sample_size,
        "interpretation": interpret_calibration_metrics(metrics)
    }

@router.post("/check-intervention")
async def check_and_trigger_intervention(
    current_user: User = Depends(get_current_user)
):
    """
    Check if intervention is needed and trigger if appropriate
    """
    engine = MetacognitionEngine()
    state = await engine.assess_metacognitive_state(current_user.id)

    if state.needs_intervention:
        intervention = await engine.trigger_intervention(current_user.id, state)
        return intervention
    else:
        return {"intervention_triggered": False, "message": "Calibration looks good!"}

@router.post("/calibration-training/start")
async def start_calibration_training(
    current_user: User = Depends(get_current_user)
):
    """
    Start interactive calibration training
    """
    from app.services.metacognition.metacognition_engine import CalibrationTrainer

    trainer = CalibrationTrainer()
    session = await trainer.start_training_session(current_user.id)

    return session

def interpret_calibration_metrics(metrics: CalibrationMetrics) -> Dict:
    """Provide human-readable interpretation"""

    if metrics.sample_size < 20:
        return {
            "overall": "insufficient_data",
            "message": "Keep reviewing! We need more data to assess calibration."
        }

    if metrics.mean_absolute_error < 0.15:
        calibration_status = "excellent"
    elif metrics.mean_absolute_error < 0.25:
        calibration_status = "good"
    elif metrics.mean_absolute_error < 0.35:
        calibration_status = "fair"
    else:
        calibration_status = "poor"

    if metrics.overconfidence_bias > 0.25:
        confidence_status = "overconfident"
    elif metrics.overconfidence_bias < -0.25:
        confidence_status = "underconfident"
    else:
        confidence_status = "well_calibrated"

    if metrics.dunning_kruger_score < -0.3:
        dk_status = "high_risk"
    elif metrics.dunning_kruger_score < 0:
        dk_status = "moderate_risk"
    else:
        dk_status = "low_risk"

    return {
        "calibration_status": calibration_status,
        "confidence_status": confidence_status,
        "dunning_kruger_status": dk_status,
        "message": generate_interpretation_message(
            calibration_status,
            confidence_status,
            dk_status
        )
    }
```

### Success Metrics

**Calibration Metrics:**
- **Mean Absolute Calibration Error (MACE)**: Target <0.15
- **Overconfidence bias**: Target between -0.1 and 0.1
- **Dunning-Kruger correlation**: Target >0.3 (positive correlation)
- **Calibration improvement**: 20% reduction in MACE after intervention

**Behavioral Metrics:**
- **Self-assessment accuracy**: Confidence matches performance
- **Intervention effectiveness**: Calibration improvement post-intervention
- **Learning strategy adjustment**: Change in review patterns after feedback

---

## Component 4: Cognitive Load Management

### Scientific Basis

**Key Research:**
- Sweller (1988): Cognitive Load Theory (CLT)
- Paas & van Merriënboer (1994): Measurement of cognitive load
- Kalyuga (2007): Expertise reversal effect
- Van Merriënboer & Sweller (2005): CLT in complex learning
- Young et al. (2014): CLT in medical education

**Core Principles:**
1. **Intrinsic Load**: Complexity inherent to the material
2. **Extraneous Load**: Load from poor instruction/presentation
3. **Germane Load**: Effort toward schema construction
4. **Working Memory Limits**: 4±1 chunks (Cowan, 2001)
5. **Element Interactivity**: How concepts must be processed together

**Cognitive Load Formula:**
```
Total Load = Intrinsic + Extraneous + Germane

Optimal learning occurs when:
- Intrinsic load is manageable
- Extraneous load is minimized
- Germane load is maximized
- Total load < Working memory capacity
```

### Database Schema

```sql
-- Cognitive load tracking
CREATE TABLE cognitive_load_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_id UUID REFERENCES retrieval_sessions(id),

    -- Time window
    measurement_time TIMESTAMP NOT NULL DEFAULT NOW(),
    measurement_window_minutes INTEGER DEFAULT 15,

    -- Load metrics
    estimated_intrinsic_load FLOAT, -- From card difficulty
    estimated_extraneous_load FLOAT, -- From UI complexity, distractions
    estimated_germane_load FLOAT, -- From learning progress
    total_cognitive_load FLOAT,

    -- Performance indicators
    avg_response_time_ms INTEGER,
    error_rate FLOAT,
    questions_per_minute FLOAT,
    mental_effort_rating INTEGER CHECK (mental_effort_rating BETWEEN 1 AND 9), -- Paas scale

    -- Context
    cards_reviewed INTEGER,
    new_concepts_introduced INTEGER,
    avg_card_difficulty FLOAT,
    topic_switching_count INTEGER,

    -- Overload detection
    is_overloaded BOOLEAN DEFAULT FALSE,
    overload_factors TEXT[],

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cognitive_load_user_time ON cognitive_load_metrics(user_id, measurement_time DESC);
CREATE INDEX idx_cognitive_load_session ON cognitive_load_metrics(session_id);

-- Session pacing
CREATE TABLE session_pacing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES retrieval_sessions(id),

    -- Pacing strategy
    strategy VARCHAR(50) NOT NULL, -- "adaptive", "fixed", "progressive"
    target_duration_minutes INTEGER,
    break_frequency_minutes INTEGER,

    -- Dynamic adjustments
    current_difficulty_level FLOAT,
    difficulty_adjustments JSONB[], -- History of adjustments
    breaks_taken INTEGER DEFAULT 0,
    breaks_recommended INTEGER DEFAULT 0,

    -- Load management
    max_new_cards_per_session INTEGER,
    max_interleaving_difficulty FLOAT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Difficulty progression tracking
CREATE TABLE difficulty_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    topic_id UUID REFERENCES topics(id),

    -- Current zone
    current_difficulty_zone VARCHAR(20), -- "comfort", "learning", "challenge", "overload"
    optimal_difficulty FLOAT, -- 1-10

    -- Zone boundaries (personalized)
    comfort_max FLOAT DEFAULT 4.0,
    learning_min FLOAT DEFAULT 4.0,
    learning_max FLOAT DEFAULT 7.0,
    challenge_min FLOAT DEFAULT 7.0,
    challenge_max FLOAT DEFAULT 9.0,

    -- Performance in each zone
    comfort_zone_accuracy FLOAT,
    learning_zone_accuracy FLOAT,
    challenge_zone_accuracy FLOAT,

    -- Adaptation
    last_adjustment TIMESTAMP,
    adjustment_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_difficulty_prog_user ON difficulty_progression(user_id);
```

### Implementation: Cognitive Load Manager

```python
# backend/app/services/cognitive_load/load_manager.py

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np

@dataclass
class CognitiveLoadState:
    """Current cognitive load state"""
    intrinsic_load: float  # 0-10
    extraneous_load: float  # 0-10
    germane_load: float  # 0-10
    total_load: float  # 0-10
    is_overloaded: bool
    overload_factors: List[str]

@dataclass
class LoadManagementAction:
    """Recommended action to manage load"""
    action_type: str  # "break", "reduce_difficulty", "increase_breaks", "end_session"
    reason: str
    parameters: Dict

class CognitiveLoadManager:
    """
    Manage cognitive load during learning sessions

    Functions:
    1. Estimate current cognitive load
    2. Detect overload conditions
    3. Recommend adaptive interventions
    4. Optimize difficulty progression
    5. Manage session pacing
    """

    # Load thresholds
    OPTIMAL_LOAD_RANGE = (5.0, 7.5)  # Sweet spot for learning
    OVERLOAD_THRESHOLD = 8.5
    UNDERLOAD_THRESHOLD = 4.0

    # Mental effort scale (Paas, 1992)
    # 1-3: Low effort
    # 4-6: Moderate effort
    # 7-9: High effort

    async def estimate_cognitive_load(
        self,
        user_id: str,
        session_id: str,
        window_minutes: int = 15
    ) -> CognitiveLoadState:
        """
        Estimate current cognitive load

        Uses multiple indicators:
        1. Card difficulty (intrinsic)
        2. Response times (processing load)
        3. Error rates (capacity exceeded)
        4. Topic switching (working memory strain)
        5. Self-reported mental effort
        """

        # Get recent activity in window
        window_start = datetime.now() - timedelta(minutes=window_minutes)

        attempts = await db.fetch_all("""
            SELECT
                ra.*,
                cs.difficulty,
                cs.state,
                c.card_type,
                c.topic_id
            FROM retrieval_attempts ra
            JOIN card_states cs ON cs.id = ra.card_state_id
            JOIN cards c ON c.id = cs.card_id
            WHERE ra.session_id = $1
            AND ra.started_at >= $2
            ORDER BY ra.started_at ASC
        """, [session_id, window_start])

        if not attempts:
            return CognitiveLoadState(
                intrinsic_load=0.0,
                extraneous_load=0.0,
                germane_load=0.0,
                total_load=0.0,
                is_overloaded=False,
                overload_factors=[]
            )

        # 1. Intrinsic Load: From card difficulty
        avg_difficulty = np.mean([a['difficulty'] for a in attempts])
        intrinsic_load = avg_difficulty

        # 2. Element Interactivity: Topic switching
        unique_topics = len(set(a['topic_id'] for a in attempts))
        topic_switches = sum(
            1 for i in range(1, len(attempts))
            if attempts[i]['topic_id'] != attempts[i-1]['topic_id']
        )

        # High interactivity increases load
        interactivity_load = min(topic_switches / len(attempts) * 10, 3.0)
        intrinsic_load += interactivity_load

        # 3. Extraneous Load: From performance indicators

        # Response time variance (high variance = confusion)
        response_times = [a['time_to_answer_ms'] for a in attempts if a['time_to_answer_ms']]
        if response_times:
            rt_mean = np.mean(response_times)
            rt_std = np.std(response_times)
            rt_cv = rt_std / rt_mean if rt_mean > 0 else 0  # Coefficient of variation
            extraneous_load = min(rt_cv * 10, 5.0)  # High variance suggests confusion
        else:
            extraneous_load = 0.0

        # Error rate (high errors = possible overload)
        error_rate = 1.0 - np.mean([
            1.0 if a['is_correct'] else 0.0
            for a in attempts
        ])

        if error_rate > 0.5:  # >50% errors suggests overload
            extraneous_load += 2.0

        # 4. Germane Load: Learning progress
        # Estimated from improvement within session
        if len(attempts) >= 5:
            first_half_accuracy = np.mean([
                1.0 if a['is_correct'] else 0.0
                for a in attempts[:len(attempts)//2]
            ])
            second_half_accuracy = np.mean([
                1.0 if a['is_correct'] else 0.0
                for a in attempts[len(attempts)//2:]
            ])

            improvement = second_half_accuracy - first_half_accuracy
            # Positive improvement = high germane load (good!)
            germane_load = max(0, improvement * 10 + 5.0)
        else:
            germane_load = 5.0  # Default moderate

        # Get self-reported mental effort if available
        latest_mental_effort = await db.fetch_val("""
            SELECT mental_effort_rating
            FROM cognitive_load_metrics
            WHERE user_id = $1
            AND measurement_time >= $2
            ORDER BY measurement_time DESC
            LIMIT 1
        """, [user_id, window_start])

        if latest_mental_effort:
            # Mental effort scale is 1-9, normalize to 0-10
            reported_load = (latest_mental_effort / 9.0) * 10.0
            # Weight reported effort highly
            total_load = (intrinsic_load + extraneous_load + germane_load + reported_load * 2) / 4
        else:
            total_load = intrinsic_load + extraneous_load + germane_load

        # Detect overload
        is_overloaded = total_load > self.OVERLOAD_THRESHOLD
        overload_factors = []

        if is_overloaded:
            if intrinsic_load > 8.0:
                overload_factors.append("high_difficulty")
            if topic_switches / len(attempts) > 0.7:
                overload_factors.append("excessive_interleaving")
            if error_rate > 0.5:
                overload_factors.append("high_error_rate")
            if extraneous_load > 5.0:
                overload_factors.append("confusion_indicators")

        # Record measurement
        await db.execute("""
            INSERT INTO cognitive_load_metrics (
                user_id,
                session_id,
                measurement_window_minutes,
                estimated_intrinsic_load,
                estimated_extraneous_load,
                estimated_germane_load,
                total_cognitive_load,
                avg_response_time_ms,
                error_rate,
                questions_per_minute,
                mental_effort_rating,
                cards_reviewed,
                new_concepts_introduced,
                avg_card_difficulty,
                topic_switching_count,
                is_overloaded,
                overload_factors
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        """, [
            user_id,
            session_id,
            window_minutes,
            intrinsic_load,
            extraneous_load,
            germane_load,
            total_load,
            int(np.mean(response_times)) if response_times else None,
            error_rate,
            len(attempts) / window_minutes,
            latest_mental_effort,
            len(attempts),
            len([a for a in attempts if a['state'] == 'new']),
            avg_difficulty,
            topic_switches,
            is_overloaded,
            overload_factors
        ])

        return CognitiveLoadState(
            intrinsic_load=intrinsic_load,
            extraneous_load=extraneous_load,
            germane_load=germane_load,
            total_load=total_load,
            is_overloaded=is_overloaded,
            overload_factors=overload_factors
        )

    async def recommend_load_management_action(
        self,
        load_state: CognitiveLoadState,
        session_duration_minutes: int
    ) -> Optional[LoadManagementAction]:
        """
        Recommend action to manage cognitive load

        Actions:
        - Break: Take a break
        - Reduce difficulty: Switch to easier cards
        - Increase spacing: Add breaks
        - End session: Load too high, end gracefully
        """

        if not load_state.is_overloaded:
            # Check if underloaded
            if load_state.total_load < self.UNDERLOAD_THRESHOLD:
                return LoadManagementAction(
                    action_type="increase_difficulty",
                    reason="You're handling this well! Let's increase the challenge.",
                    parameters={"difficulty_adjustment": +1.0}
                )
            return None  # Optimal range, no action needed

        # Overloaded - determine best intervention

        if "high_difficulty" in load_state.overload_factors:
            return LoadManagementAction(
                action_type="reduce_difficulty",
                reason="The current difficulty is too high. Let's adjust to a better learning zone.",
                parameters={
                    "difficulty_adjustment": -2.0,
                    "filter_new_cards": True
                }
            )

        if "excessive_interleaving" in load_state.overload_factors:
            return LoadManagementAction(
                action_type="reduce_interleaving",
                reason="Switching between too many topics. Let's focus on fewer topics at once.",
                parameters={
                    "max_topics_per_session": 2,
                    "block_practice_temporarily": True
                }
            )

        if session_duration_minutes >= 45 and "high_error_rate" in load_state.overload_factors:
            return LoadManagementAction(
                action_type="break",
                reason="You've been studying for a while and making errors. Time for a break!",
                parameters={
                    "break_duration_minutes": 10,
                    "suggested_activity": "Walk around, hydrate, rest your eyes"
                }
            )

        if load_state.total_load > 9.0:
            return LoadManagementAction(
                action_type="end_session",
                reason="Cognitive overload detected. Great work today - let's end here and consolidate what you learned.",
                parameters={
                    "end_gracefully": True,
                    "show_summary": True
                }
            )

        # Default: recommend break
        return LoadManagementAction(
            action_type="break",
            reason="Cognitive load is high. A short break will help!",
            parameters={"break_duration_minutes": 5}
        )

    async def optimize_difficulty_progression(
        self,
        user_id: str,
        topic_id: str,
        current_performance: float
    ) -> float:
        """
        Optimize difficulty for next cards

        Goal: Keep user in the "learning zone" (optimal challenge)

        Zones:
        - Comfort: Too easy, minimal learning
        - Learning: Optimal difficulty, best learning
        - Challenge: Difficult but manageable
        - Overload: Too difficult, frustration
        """

        # Get user's difficulty progression state
        progression = await db.fetch_one("""
            SELECT * FROM difficulty_progression
            WHERE user_id = $1 AND topic_id = $2
        """, [user_id, topic_id])

        if not progression:
            # Initialize with default zones
            await db.execute("""
                INSERT INTO difficulty_progression (
                    user_id,
                    topic_id,
                    current_difficulty_zone,
                    optimal_difficulty
                ) VALUES ($1, $2, 'learning', 5.5)
            """, [user_id, topic_id])
            return 5.5  # Default starting difficulty

        current_diff = progression['optimal_difficulty']

        # Adjust based on performance
        # Performance: 0-1
        # Target: 60-80% accuracy (optimal learning)

        if current_performance > 0.85:
            # Too easy - increase difficulty
            adjustment = +0.5
            new_zone = "challenge" if current_diff >= 7.0 else "learning"
        elif current_performance > 0.65:
            # Optimal - small adjustment toward center of learning zone
            target = (progression['learning_min'] + progression['learning_max']) / 2
            adjustment = (target - current_diff) * 0.1
            new_zone = "learning"
        elif current_performance > 0.45:
            # Challenging - maintain or slight decrease
            adjustment = -0.2
            new_zone = "learning"
        else:
            # Too hard - decrease difficulty
            adjustment = -0.8
            new_zone = "comfort"

        new_difficulty = max(1.0, min(10.0, current_diff + adjustment))

        # Update progression
        await db.execute("""
            UPDATE difficulty_progression
            SET
                optimal_difficulty = $1,
                current_difficulty_zone = $2,
                last_adjustment = NOW(),
                adjustment_count = adjustment_count + 1,
                updated_at = NOW()
            WHERE user_id = $3 AND topic_id = $4
        """, [new_difficulty, new_zone, user_id, topic_id])

        return new_difficulty

    async def manage_session_pacing(
        self,
        session_id: str,
        current_load: CognitiveLoadState,
        elapsed_minutes: int
    ) -> Dict:
        """
        Manage pacing within a session

        Recommendations:
        - Break timing
        - Session length
        - Card introduction rate
        """

        # Get pacing settings
        pacing = await db.fetch_one(
            "SELECT * FROM session_pacing WHERE session_id = $1",
            [session_id]
        )

        if not pacing:
            # Initialize with defaults
            await db.execute("""
                INSERT INTO session_pacing (
                    session_id,
                    strategy,
                    target_duration_minutes,
                    break_frequency_minutes,
                    max_new_cards_per_session
                ) VALUES ($1, 'adaptive', 45, 15, 20)
            """, [session_id])
            pacing = await db.fetch_one(
                "SELECT * FROM session_pacing WHERE session_id = $1",
                [session_id]
            )

        recommendations = {
            "continue_session": True,
            "recommend_break": False,
            "adjust_difficulty": False,
            "end_session": False,
            "reasons": []
        }

        # Check if break is due
        minutes_since_last_break = elapsed_minutes - (pacing['breaks_taken'] * pacing['break_frequency_minutes'])

        if minutes_since_last_break >= pacing['break_frequency_minutes']:
            recommendations["recommend_break"] = True
            recommendations["reasons"].append(f"It's been {minutes_since_last_break} minutes - time for a break!")

        # Check load state
        if current_load.is_overloaded:
            if "high_difficulty" in current_load.overload_factors:
                recommendations["adjust_difficulty"] = True
                recommendations["reasons"].append("Adjusting difficulty due to cognitive overload")

            if elapsed_minutes >= 30:
                recommendations["recommend_break"] = True
                recommendations["reasons"].append("Cognitive overload detected after extended session")

        # Check session duration
        if elapsed_minutes >= pacing['target_duration_minutes']:
            recommendations["end_session"] = True
            recommendations["continue_session"] = False
            recommendations["reasons"].append("Target session duration reached")

        # Check performance degradation
        recent_accuracy = await db.fetch_val("""
            SELECT AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END)
            FROM retrieval_attempts
            WHERE session_id = $1
            AND started_at >= NOW() - INTERVAL '10 minutes'
        """, [session_id])

        if recent_accuracy and recent_accuracy < 0.4:
            recommendations["end_session"] = True
            recommendations["continue_session"] = False
            recommendations["reasons"].append("Significant performance drop - time to rest")

        return recommendations

# Expertise Reversal Effect Handler
class ExpertiseAdaptation:
    """
    Handle expertise reversal effect

    Principle: As expertise increases, scaffolding becomes detrimental
    """

    @staticmethod
    async def assess_expertise_level(user_id: str, topic_id: str) -> str:
        """
        Assess user expertise: novice, intermediate, advanced

        Based on:
        - Total reviews in topic
        - Average stability
        - Performance consistency
        """

        stats = await db.fetch_one("""
            SELECT
                COUNT(*) as total_reviews,
                AVG(cs.stability) as avg_stability,
                AVG(CASE WHEN rl.rating >= 3 THEN 1.0 ELSE 0.0 END) as avg_accuracy,
                STDDEV(CASE WHEN rl.rating >= 3 THEN 1.0 ELSE 0.0 END) as performance_variance
            FROM card_states cs
            JOIN cards c ON c.id = cs.card_id
            JOIN review_logs rl ON rl.card_state_id = cs.id
            WHERE cs.user_id = $1
            AND c.topic_id = $2
        """, [user_id, topic_id])

        if not stats or stats['total_reviews'] < 20:
            return "novice"

        # Advanced: High stability, high accuracy, low variance
        if (stats['avg_stability'] > 60 and
            stats['avg_accuracy'] > 0.85 and
            stats['performance_variance'] < 0.2):
            return "advanced"

        # Intermediate: Moderate stability, good accuracy
        if stats['avg_stability'] > 20 and stats['avg_accuracy'] > 0.70:
            return "intermediate"

        return "novice"

    @staticmethod
    async def recommend_scaffolding_level(
        user_id: str,
        topic_id: str,
        expertise_level: str
    ) -> Dict:
        """
        Recommend appropriate scaffolding based on expertise

        Scaffolding examples:
        - Hints
        - Worked examples
        - Step-by-step guidance
        - Explanations detail level
        """

        if expertise_level == "novice":
            return {
                "hints_enabled": True,
                "worked_examples": True,
                "step_by_step": True,
                "explanation_detail": "high",
                "question_types": ["mcq", "fill_blank"],
                "allow_partial_credit": True
            }
        elif expertise_level == "intermediate":
            return {
                "hints_enabled": True,
                "worked_examples": False,
                "step_by_step": False,
                "explanation_detail": "medium",
                "question_types": ["mcq", "short_answer", "case_based"],
                "allow_partial_credit": True
            }
        else:  # advanced
            return {
                "hints_enabled": False,
                "worked_examples": False,
                "step_by_step": False,
                "explanation_detail": "low",
                "question_types": ["vignette", "ddx", "mechanism"],
                "allow_partial_credit": False  # Expect mastery
            }
```

### API Endpoints

```python
# backend/app/api/v1/cognitive_load.py

from fastapi import APIRouter, Depends, HTTPException
from app.services.cognitive_load.load_manager import CognitiveLoadManager

router = APIRouter(prefix="/cognitive-load", tags=["Cognitive Load"])

@router.get("/current/{session_id}")
async def get_current_cognitive_load(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get current cognitive load estimate for session
    """
    manager = CognitiveLoadManager()
    load_state = await manager.estimate_cognitive_load(
        current_user.id,
        session_id,
        window_minutes=15
    )

    return {
        "load_state": {
            "intrinsic_load": load_state.intrinsic_load,
            "extraneous_load": load_state.extraneous_load,
            "germane_load": load_state.germane_load,
            "total_load": load_state.total_load,
            "is_overloaded": load_state.is_overloaded,
            "overload_factors": load_state.overload_factors
        },
        "interpretation": interpret_load_state(load_state)
    }

@router.post("/report-mental-effort")
async def report_mental_effort(
    session_id: str,
    mental_effort: int,  # 1-9 scale
    current_user: User = Depends(get_current_user)
):
    """
    User reports subjective mental effort (Paas scale)

    1-3: Very low to low effort
    4-6: Neither low nor high effort
    7-9: High to very high effort
    """
    if not 1 <= mental_effort <= 9:
        raise HTTPException(400, "Mental effort must be 1-9")

    # Will be used in next load calculation
    await db.execute("""
        INSERT INTO cognitive_load_metrics (
            user_id,
            session_id,
            mental_effort_rating,
            measurement_time
        ) VALUES ($1, $2, $3, NOW())
    """, [current_user.id, session_id, mental_effort])

    return {"success": True, "message": "Mental effort recorded"}

@router.get("/recommendations/{session_id}")
async def get_load_management_recommendations(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get recommendations for managing cognitive load
    """
    manager = CognitiveLoadManager()

    # Get current load
    load_state = await manager.estimate_cognitive_load(
        current_user.id,
        session_id,
        window_minutes=15
    )

    # Get session duration
    session = await db.fetch_one(
        "SELECT started_at FROM retrieval_sessions WHERE id = $1",
        [session_id]
    )
    elapsed_minutes = (datetime.now() - session['started_at']).seconds // 60

    # Get recommendation
    action = await manager.recommend_load_management_action(
        load_state,
        elapsed_minutes
    )

    # Get pacing recommendations
    pacing_recs = await manager.manage_session_pacing(
        session_id,
        load_state,
        elapsed_minutes
    )

    return {
        "load_state": load_state,
        "action": action.__dict__ if action else None,
        "pacing": pacing_recs,
        "elapsed_minutes": elapsed_minutes
    }

def interpret_load_state(load_state: CognitiveLoadState) -> Dict:
    """Provide human-readable interpretation"""

    if load_state.is_overloaded:
        return {
            "status": "overloaded",
            "message": "Your cognitive load is high. Consider taking a break or reducing difficulty.",
            "color": "red"
        }
    elif load_state.total_load > 7.0:
        return {
            "status": "challenging",
            "message": "You're in the optimal challenge zone! This is where deep learning happens.",
            "color": "orange"
        }
    elif load_state.total_load >= 5.0:
        return {
            "status": "optimal",
            "message": "Perfect learning zone! Your cognitive load is well-balanced.",
            "color": "green"
        }
    else:
        return {
            "status": "underloaded",
            "message": "This might be too easy. Ready for a bigger challenge?",
            "color": "blue"
        }
```

### Success Metrics

**Cognitive Load Metrics:**
- **Average load**: Target 5.0-7.5 (optimal learning zone)
- **Overload frequency**: <10% of session time
- **Performance-load correlation**: Negative correlation (high load → low performance indicates overload)
- **Mental effort calibration**: Subjective effort matches objective indicators

**Intervention Effectiveness:**
- **Post-break performance**: Improvement after breaks
- **Difficulty adjustment impact**: Performance improvement after adjustment
- **Session completion rate**: Higher when load managed well

**Target Benchmarks:**
- Maintain optimal load range 70%+ of study time
- Overload detection latency: <5 minutes
- Post-intervention load reduction: 20-30%

---

## Component 5: Long-Term Retention Optimization

### Scientific Basis

**Key Research:**
- Ebbinghaus (1885): Forgetting curve
- Bahrick (1984): Permastore - very long-term retention
- Cepeda et al. (2008): Distributed practice and retention
- Kornell & Bjork (2008): Learning difficulty and long-term retention
- Rohrer & Taylor (2007): Spacing effect and long-term memory

**Core Principles:**
1. **Consolidation**: Memory strengthening over time
2. **Reconsolidation**: Reactivation strengthens and updates memories
3. **Interference**: New learning can disrupt old memories
4. **Context Variability**: Multiple contexts improve retention
5. **Sleep Consolidation**: Sleep-dependent memory consolidation

**Retention Optimization Formula:**
```
Long-term retention = f(
    Initial encoding strength,
    Number of retrievals,
    Spacing of retrievals,
    Retrieval difficulty,
    Interference management,
    Consolidation windows
)
```

### Database Schema

```sql
-- Long-term retention tracking
CREATE TABLE retention_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    card_id UUID NOT NULL REFERENCES cards(id),

    -- Retention metrics
    initial_learning_date DATE NOT NULL,
    last_successful_retrieval DATE,
    longest_interval_days INTEGER, -- Longest successfully retrieved interval
    total_retrievals INTEGER DEFAULT 0,
    successful_retrievals INTEGER DEFAULT 0,

    -- Consolidation tracking
    consolidation_phase VARCHAR(20), -- "initial", "intermediate", "permastore"
    estimated_retention_at_1year FLOAT,
    estimated_retention_at_5year FLOAT,

    -- Interference tracking
    similar_concepts TEXT[], -- IDs of similar/competing concepts
    interference_score FLOAT, -- How much interference from similar concepts

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, card_id)
);

CREATE INDEX idx_retention_user ON retention_tracking(user_id);
CREATE INDEX idx_retention_phase ON retention_tracking(consolidation_phase);

-- Sleep and consolidation windows
CREATE TABLE consolidation_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Window details
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    window_type VARCHAR(20), -- "sleep", "rest", "study_break"

    -- Reviews before/after
    reviews_before_window INTEGER,
    reviews_after_window INTEGER,

    -- Performance changes
    pre_window_accuracy FLOAT,
    post_window_accuracy FLOAT,
    consolidation_benefit FLOAT, -- Performance improvement

    -- Sleep-specific (if window_type = 'sleep')
    estimated_sleep_hours FLOAT,
    sleep_quality_rating INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consolidation_user_time ON consolidation_windows(user_id, window_start DESC);

-- Interference management
CREATE TABLE interference_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id_a UUID NOT NULL REFERENCES cards(id),
    card_id_b UUID NOT NULL REFERENCES cards(id),

    -- Similarity metrics
    content_similarity FLOAT, -- 0-1, cosine similarity
    temporal_proximity FLOAT, -- How close in time they're studied
    confusion_rate FLOAT, -- How often confused

    -- Interference type
    interference_type VARCHAR(50), -- "proactive", "retroactive", "both"

    -- Mitigation strategies
    spacing_recommended BOOLEAN DEFAULT TRUE,
    contrast_explanation TEXT, -- How they differ

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interference_cards ON interference_tracking(card_id_a, card_id_b);

-- Context variability tracking
CREATE TABLE context_variability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    card_id UUID NOT NULL REFERENCES cards(id),

    -- Context dimensions
    study_locations TEXT[],
    study_times_of_day TEXT[], -- "morning", "afternoon", "evening"
    question_types_used TEXT[],
    explanation_formats_seen TEXT[],

    -- Variability score
    context_variability_score FLOAT, -- Higher = better

    -- Performance across contexts
    performance_by_location JSONB,
    performance_by_time JSONB,
    performance_by_format JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, card_id)
);
```

### Implementation: Retention Optimizer

```python
# backend/app/services/retention/retention_optimizer.py

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
from scipy.stats import norm

@dataclass
class RetentionPrediction:
    """Predicted retention probability"""
    probability_at_1month: float
    probability_at_3months: float
    probability_at_6months: float
    probability_at_1year: float
    probability_at_5years: float
    consolidation_phase: str
    confidence_interval: Tuple[float, float]

@dataclass
class InterferenceAnalysis:
    """Analysis of interference patterns"""
    similar_concepts: List[str]
    interference_score: float
    recommended_spacing: int  # Days
    contrast_needed: bool
    mitigation_strategies: List[str]

class RetentionOptimizer:
    """
    Optimize for long-term retention

    Functions:
    1. Predict long-term retention
    2. Detect interference patterns
    3. Recommend consolidation strategies
    4. Manage context variability
    5. Optimize for permastore
    """

    # Consolidation phases (Bahrick, 1984)
    PHASE_INITIAL = "initial"  # 0-7 days
    PHASE_INTERMEDIATE = "intermediate"  # 7-90 days
    PHASE_PERMASTORE = "permastore"  # 90+ days, stable

    async def predict_long_term_retention(
        self,
        user_id: str,
        card_id: str
    ) -> RetentionPrediction:
        """
        Predict retention probability at various future time points

        Uses:
        1. FSRS stability as base
        2. Number of retrievals
        3. Spacing pattern
        4. Interference effects
        """

        # Get card state and history
        card_state = await db.fetch_one("""
            SELECT cs.*, c.*
            FROM card_states cs
            JOIN cards c ON c.id = cs.card_id
            WHERE cs.user_id = $1 AND cs.card_id = $2
        """, [user_id, card_id])

        if not card_state:
            raise ValueError("Card not found")

        # Get review history
        reviews = await db.fetch_all("""
            SELECT *
            FROM review_logs
            WHERE card_state_id = $1
            ORDER BY review_time ASC
        """, [card_state['id']])

        if not reviews:
            # New card - use default predictions
            return RetentionPrediction(
                probability_at_1month=0.7,
                probability_at_3months=0.5,
                probability_at_6months=0.3,
                probability_at_1year=0.2,
                probability_at_5years=0.05,
                consolidation_phase=self.PHASE_INITIAL,
                confidence_interval=(0.1, 0.9)
            )

        # Calculate retention using power law of forgetting
        # P(t) = exp(-t/S)
        # where S = stability from FSRS

        stability = card_state['stability']

        # Base predictions from FSRS stability
        def retention_at_days(days: int) -> float:
            return np.exp(-days / max(stability, 1))

        # Adjust for number of retrievals (more retrievals = better retention)
        retrieval_boost = min(len(reviews) * 0.02, 0.2)  # Up to 20% boost

        # Adjust for spacing quality
        if len(reviews) >= 2:
            intervals = [
                (reviews[i]['review_time'] - reviews[i-1]['review_time']).days
                for i in range(1, len(reviews))
            ]
            # Increasing intervals = better spacing
            spacing_trend = np.mean(np.diff(intervals)) if len(intervals) > 1 else 0
            spacing_boost = min(spacing_trend * 0.01, 0.15)
        else:
            spacing_boost = 0

        # Adjust for retrieval success history
        success_rate = np.mean([
            1.0 if r['rating'] >= 3 else 0.0
            for r in reviews
        ])
        success_boost = (success_rate - 0.7) * 0.1  # Bonus for >70% success

        total_boost = retrieval_boost + spacing_boost + success_boost

        # Calculate predictions
        prob_1month = min(1.0, retention_at_days(30) * (1 + total_boost))
        prob_3months = min(1.0, retention_at_days(90) * (1 + total_boost))
        prob_6months = min(1.0, retention_at_days(180) * (1 + total_boost))
        prob_1year = min(1.0, retention_at_days(365) * (1 + total_boost))

        # 5-year prediction uses permastore model
        # Bahrick found ~75% retention for well-learned material at 25 years
        if stability > 180 and len(reviews) > 10:
            # Material has reached permastore
            prob_5years = 0.75 * prob_1year
            phase = self.PHASE_PERMASTORE
        elif stability > 30:
            prob_5years = 0.3 * prob_1year
            phase = self.PHASE_INTERMEDIATE
        else:
            prob_5years = 0.1 * prob_1year
            phase = self.PHASE_INITIAL

        # Confidence interval (wider for longer predictions)
        ci_width = 0.1 + (0.4 * (1 - prob_1year))  # Wider when retention is lower
        ci = (max(0, prob_1year - ci_width), min(1, prob_1year + ci_width))

        # Update tracking
        await db.execute("""
            INSERT INTO retention_tracking (
                user_id,
                card_id,
                initial_learning_date,
                last_successful_retrieval,
                longest_interval_days,
                total_retrievals,
                successful_retrievals,
                consolidation_phase,
                estimated_retention_at_1year,
                estimated_retention_at_5year
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id, card_id)
            DO UPDATE SET
                last_successful_retrieval = EXCLUDED.last_successful_retrieval,
                longest_interval_days = EXCLUDED.longest_interval_days,
                total_retrievals = EXCLUDED.total_retrievals,
                successful_retrievals = EXCLUDED.successful_retrievals,
                consolidation_phase = EXCLUDED.consolidation_phase,
                estimated_retention_at_1year = EXCLUDED.estimated_retention_at_1year,
                estimated_retention_at_5year = EXCLUDED.estimated_retention_at_5year,
                updated_at = NOW()
        """, [
            user_id,
            card_id,
            reviews[0]['review_time'].date(),
            reviews[-1]['review_time'].date() if reviews[-1]['rating'] >= 3 else None,
            max([r['elapsed_days'] for r in reviews]),
            len(reviews),
            sum(1 for r in reviews if r['rating'] >= 3),
            phase,
            prob_1year,
            prob_5years
        ])

        return RetentionPrediction(
            probability_at_1month=prob_1month,
            probability_at_3months=prob_3months,
            probability_at_6months=prob_6months,
            probability_at_1year=prob_1year,
            probability_at_5years=prob_5years,
            consolidation_phase=phase,
            confidence_interval=ci
        )

    async def detect_interference(
        self,
        user_id: str,
        card_id: str
    ) -> InterferenceAnalysis:
        """
        Detect interference from similar concepts

        Types:
        - Proactive: Old learning interferes with new
        - Retroactive: New learning interferes with old
        """

        # Get card content
        card = await db.fetch_one(
            "SELECT * FROM cards WHERE id = $1",
            [card_id]
        )

        # Find similar cards (by topic, tags, or content similarity)
        similar_cards = await db.fetch_all("""
            SELECT
                c.*,
                cs.stability,
                cs.reps,
                cs.lapses
            FROM cards c
            JOIN card_states cs ON cs.card_id = c.id
            WHERE cs.user_id = $1
            AND c.id != $2
            AND (
                c.topic_id = $3
                OR c.tags && $4  -- Overlapping tags
            )
            AND cs.reps > 0
            ORDER BY c.created_at DESC
            LIMIT 10
        """, [user_id, card_id, card['topic_id'], card['tags']])

        if not similar_cards:
            return InterferenceAnalysis(
                similar_concepts=[],
                interference_score=0.0,
                recommended_spacing=0,
                contrast_needed=False,
                mitigation_strategies=[]
            )

        # Calculate interference score
        interference_scores = []

        for similar in similar_cards:
            # Temporal proximity (studied close together = more interference)
            card_state = await db.fetch_one(
                "SELECT last_review FROM card_states WHERE user_id = $1 AND card_id = $2",
                [user_id, card_id]
            )
            similar_state = await db.fetch_one(
                "SELECT last_review FROM card_states WHERE user_id = $1 AND card_id = $2",
                [user_id, similar['id']]
            )

            if card_state['last_review'] and similar_state['last_review']:
                days_apart = abs((card_state['last_review'] - similar_state['last_review']).days)
                temporal_score = max(0, 1.0 - (days_apart / 30.0))  # Normalize to 30 days
            else:
                temporal_score = 0.5

            # Content similarity (would need embedding similarity in production)
            # For now, use tag overlap as proxy
            tag_overlap = len(set(card['tags']) & set(similar['tags'])) / len(set(card['tags']) | set(similar['tags']))

            # Confusion rate (high lapses = possible confusion)
            confusion_rate = similar['lapses'] / max(similar['reps'], 1)

            # Combined interference score
            interference = (temporal_score * 0.4 + tag_overlap * 0.3 + confusion_rate * 0.3)
            interference_scores.append(interference)

        avg_interference = np.mean(interference_scores)

        # Recommendations
        strategies = []
        contrast_needed = False

        if avg_interference > 0.6:
            strategies.append("Increase spacing between similar concepts")
            strategies.append("Review with explicit comparison exercises")
            contrast_needed = True
            recommended_spacing = 7  # Days
        elif avg_interference > 0.4:
            strategies.append("Moderate spacing recommended")
            recommended_spacing = 3
        else:
            strategies.append("Current spacing is adequate")
            recommended_spacing = 0

        if tag_overlap > 0.7:
            strategies.append("Use contrastive learning to highlight differences")
            contrast_needed = True

        return InterferenceAnalysis(
            similar_concepts=[s['id'] for s in similar_cards],
            interference_score=avg_interference,
            recommended_spacing=recommended_spacing,
            contrast_needed=contrast_needed,
            mitigation_strategies=strategies
        )

    async def optimize_consolidation_windows(
        self,
        user_id: str
    ) -> Dict:
        """
        Analyze and optimize consolidation windows

        Key insight: Sleep consolidates memories
        Recommendation: Strategic timing of reviews around sleep
        """

        # Analyze past consolidation windows
        windows = await db.fetch_all("""
            SELECT *
            FROM consolidation_windows
            WHERE user_id = $1
            AND window_type = 'sleep'
            AND consolidation_benefit IS NOT NULL
            ORDER BY window_start DESC
            LIMIT 30
        """, [user_id])

        if not windows:
            return {
                "recommendation": "Study before sleep for better consolidation",
                "optimal_review_time": "evening",
                "evidence_level": "theoretical"
            }

        # Calculate average consolidation benefit
        avg_benefit = np.mean([w['consolidation_benefit'] for w in windows])

        # Find optimal pattern
        pre_sleep_reviews = [w for w in windows if w['reviews_before_window'] > 0]

        if pre_sleep_reviews:
            avg_pre_sleep_benefit = np.mean([
                w['consolidation_benefit'] for w in pre_sleep_reviews
            ])

            if avg_pre_sleep_benefit > avg_benefit * 1.2:
                recommendation = "Reviews before sleep show 20%+ better consolidation. Continue this pattern!"
                optimal_time = "evening"
            else:
                recommendation = "Consistent review timing. Consider experimenting with pre-sleep reviews."
                optimal_time = "flexible"
        else:
            recommendation = "Try reviewing in the evening before sleep for better memory consolidation."
            optimal_time = "evening"

        return {
            "recommendation": recommendation,
            "optimal_review_time": optimal_time,
            "avg_consolidation_benefit": avg_benefit,
            "evidence_level": "personalized" if len(windows) >= 10 else "emerging",
            "sample_size": len(windows)
        }

    async def recommend_permastore_strategy(
        self,
        user_id: str,
        card_id: str
    ) -> Dict:
        """
        Recommend strategy to reach permastore (permanent retention)

        Permastore characteristics (Bahrick, 1984):
        - 90+ days since initial learning
        - 8+ successful retrievals
        - Increasing intervals
        - High stability (>180 days)
        """

        # Get current state
        retention = await db.fetch_one("""
            SELECT * FROM retention_tracking
            WHERE user_id = $1 AND card_id = $2
        """, [user_id, card_id])

        card_state = await db.fetch_one("""
            SELECT * FROM card_states
            WHERE user_id = $1 AND card_id = $2
        """, [user_id, card_id])

        if not retention or not card_state:
            return {
                "phase": "not_started",
                "message": "Start reviewing this card to build toward permanent retention",
                "next_steps": ["Complete first review", "Establish consistent pattern"]
            }

        phase = retention['consolidation_phase']
        days_since_start = (datetime.now().date() - retention['initial_learning_date']).days

        if phase == self.PHASE_PERMASTORE:
            return {
                "phase": "permastore_achieved",
                "message": "Congratulations! This knowledge is in permanent storage. Maintain with occasional reviews.",
                "next_steps": ["Continue reviews at long intervals (90+ days)", "Teach this concept to others"]
            }

        elif phase == self.PHASE_INTERMEDIATE:
            needed_for_permastore = {
                "days_remaining": max(0, 90 - days_since_start),
                "reviews_remaining": max(0, 8 - card_state['reps']),
                "stability_needed": max(0, 180 - card_state['stability'])
            }

            return {
                "phase": "intermediate",
                "message": "You're on track to permanent retention! Keep up the consistent reviews.",
                "progress": {
                    "days": f"{days_since_start}/90",
                    "reviews": f"{card_state['reps']}/8",
                    "stability": f"{card_state['stability']:.0f}/180 days"
                },
                "next_steps": [
                    f"Continue reviews for {needed_for_permastore['days_remaining']} more days",
                    f"Complete {needed_for_permastore['reviews_remaining']} more successful reviews",
                    "Maintain high accuracy (>80%)"
                ],
                "estimated_permastore_date": retention['initial_learning_date'] + timedelta(days=90)
            }

        else:  # PHASE_INITIAL
            return {
                "phase": "initial",
                "message": "Building the foundation for long-term retention.",
                "progress": {
                    "days": f"{days_since_start}/90",
                    "reviews": f"{card_state['reps']}/8",
                    "stability": f"{card_state['stability']:.0f}/180 days"
                },
                "next_steps": [
                    "Focus on consistent, spaced reviews",
                    "Aim for 80%+ accuracy",
                    "Allow intervals to increase naturally"
                ],
                "estimated_permastore_date": retention['initial_learning_date'] + timedelta(days=90)
            }
```

### Success Metrics

**Retention Metrics:**
- **Long-term retention rate**: >75% at 1 year for permastore items
- **Forgetting rate**: <20% between optimal reviews
- **Permastore achievement rate**: >30% of cards reach permastore within 6 months
- **Interference impact**: <10% performance degradation from similar concepts

**Consolidation Metrics:**
- **Sleep consolidation benefit**: 10-20% improvement after sleep
- **Optimal review timing adherence**: >70% of reviews at recommended times
- **Context variability score**: >0.6 (multiple contexts used)

**Target Benchmarks:**
- 1-year retention for active cards: >80%
- 5-year retention for permastore cards: >75%
- Interference-related lapses: <15% of total lapses
- Consolidation window utilization: >60% of eligible sessions

---

*[Document continues with remaining components...]*

## Component 6: Medical Education-Specific Science

[Content continues in next section...]