# FSRS Quick Start Guide

Get started with spaced repetition in 5 minutes.

---

## Setup

### 1. Run Migration

```bash
cd backend
alembic upgrade head
```

This creates:
- `fsrs_cards` table
- `fsrs_review_logs` table
- `fsrs_parameters` table (with default parameters)

### 2. Verify Installation

```bash
# Check tables exist
psql $DATABASE_URL -c "\dt fsrs_*"

# Check default parameters loaded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM fsrs_parameters;"
# Should return: 1
```

---

## Basic Usage

### 1. Create a Review Card

**For a Material Chunk**:
```bash
curl -X POST http://localhost:8000/api/reviews/cards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chunk_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**For a Topic**:
```bash
curl -X POST http://localhost:8000/api/reviews/cards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

**Custom Flashcard**:
```bash
curl -X POST http://localhost:8000/api/reviews/cards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "flashcard_content": "What are the 4 chambers of the heart?"
  }'
```

### 2. Get Cards Due for Review

```bash
curl -X GET "http://localhost:8000/api/reviews/due?limit=20" \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "cards": [
    {
      "id": "card-uuid",
      "difficulty": 5.0,
      "stability": 0.0,
      "state": "new",
      "due_date": "2025-10-13T12:00:00Z"
    }
  ],
  "total_count": 1,
  "has_more": false
}
```

### 3. Submit a Review

```bash
curl -X POST http://localhost:8000/api/reviews/{card-uuid} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 3,
    "review_duration_seconds": 10.5
  }'
```

**Ratings**:
- 1 = Again (forgot completely)
- 2 = Hard (difficult to recall)
- 3 = Good (recalled successfully)
- 4 = Easy (recalled effortlessly)

**Response**:
```json
{
  "card": {
    "id": "card-uuid",
    "state": "learning",
    "due_date": "2025-10-16T12:00:00Z",
    "stability": 3.5,
    "reps": 1
  },
  "next_review_date": "2025-10-16T12:00:00Z",
  "interval_days": 3,
  "retention_probability": 0.92,
  "xp_earned": 20
}
```

---

## Bulk Operations

### Create Cards for All Material Chunks

```python
# Python example
from app.services.fsrs_service import FSRSService
from app.models.chunk import MaterialChunk
from sqlalchemy import select

async def create_cards_for_material(user_id, material_id, db):
    service = FSRSService(db)

    # Get all chunks
    stmt = select(MaterialChunk).where(MaterialChunk.material_id == material_id)
    result = await db.execute(stmt)
    chunks = result.scalars().all()

    # Create cards
    cards = []
    for chunk in chunks:
        card = await service.create_card(
            user_id=user_id,
            chunk_id=chunk.id
        )
        cards.append(card)

    return cards
```

### Bulk Create via API

```bash
curl -X POST http://localhost:8000/api/reviews/cards/bulk \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chunk_ids": [
      "uuid1",
      "uuid2",
      "uuid3"
    ]
  }'
```

---

## Daily Review Workflow

### 1. Check How Many Cards Due

```bash
curl -X GET http://localhost:8000/api/reviews/stats \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "total_cards": 150,
  "due_today": 23,
  "new": 45,
  "learning": 30,
  "review": 70,
  "average_stability_days": 12.5
}
```

### 2. Get Today's Cards

```bash
curl -X GET "http://localhost:8000/api/reviews/due?limit=100" \
  -H "Authorization: Bearer {token}"
```

### 3. Review Each Card

For each card:
1. Display content (chunk, topic, or flashcard)
2. User answers/recalls
3. User rates difficulty (1-4)
4. Submit review

```bash
curl -X POST http://localhost:8000/api/reviews/{card-id} \
  -H "Authorization: Bearer {token}" \
  -d '{"rating": 3}'
```

### 4. Check Tomorrow's Schedule

```bash
curl -X GET "http://localhost:8000/api/reviews/schedule?days_ahead=7" \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "schedule": {
    "2025-10-14": 18,
    "2025-10-15": 22,
    "2025-10-16": 15
  },
  "total_reviews": 55
}
```

---

## Frontend Integration

### React Example

```typescript
// hooks/useReviews.ts
import { useState, useEffect } from 'react';

interface Card {
  id: string;
  difficulty: number;
  stability: number;
  state: string;
  due_date: string;
  // ... other fields
}

export function useReviews() {
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    const response = await fetch('/api/reviews/due?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setDueCards(data.cards);
    setLoading(false);
  };

  const submitReview = async (cardId: string, rating: number) => {
    const response = await fetch(`/api/reviews/${cardId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating,
        review_duration_seconds: 10.5
      })
    });

    const result = await response.json();

    // Remove reviewed card from list
    setDueCards(prev => prev.filter(c => c.id !== cardId));

    return result;
  };

  return {
    dueCards,
    loading,
    submitReview,
    refetch: fetchDueCards
  };
}

// components/ReviewCard.tsx
export function ReviewCard({ card, onReview }) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleRating = async (rating: number) => {
    await onReview(card.id, rating);
  };

  return (
    <div className="review-card">
      <div className="card-content">
        {/* Display chunk content, topic, or flashcard */}
        {card.flashcard_content || "Content from chunk/topic"}
      </div>

      {!showAnswer ? (
        <button onClick={() => setShowAnswer(true)}>
          Show Answer
        </button>
      ) : (
        <div className="rating-buttons">
          <button onClick={() => handleRating(1)}>Again</button>
          <button onClick={() => handleRating(2)}>Hard</button>
          <button onClick={() => handleRating(3)}>Good</button>
          <button onClick={() => handleRating(4)}>Easy</button>
        </div>
      )}

      <div className="card-stats">
        <span>Reps: {card.reps}</span>
        <span>Stability: {card.stability.toFixed(1)} days</span>
      </div>
    </div>
  );
}

// pages/ReviewPage.tsx
export function ReviewPage() {
  const { dueCards, loading, submitReview } = useReviews();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleReview = async (cardId: string, rating: number) => {
    const result = await submitReview(cardId, rating);

    // Show XP earned
    toast.success(`+${result.xp_earned} XP!`);

    // Move to next card
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) return <Spinner />;

  if (dueCards.length === 0) {
    return <div>No cards due! Come back tomorrow.</div>;
  }

  const currentCard = dueCards[currentIndex];
  const progress = ((currentIndex + 1) / dueCards.length) * 100;

  return (
    <div className="review-page">
      <div className="progress-bar" style={{ width: `${progress}%` }} />

      <div className="card-counter">
        {currentIndex + 1} / {dueCards.length}
      </div>

      {currentCard && (
        <ReviewCard
          card={currentCard}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
```

---

## Python Service Usage

### In Your Backend Code

```python
from app.services.fsrs_service import FSRSService
from app.db.session import get_db

async def review_workflow_example():
    async with get_db() as db:
        service = FSRSService(db)
        user_id = "user-uuid"

        # 1. Create cards for a topic
        topic_id = "topic-uuid"
        card = await service.create_card(
            user_id=user_id,
            topic_id=topic_id
        )

        # 2. Get due cards
        due_cards = await service.get_due_cards(
            user_id=user_id,
            limit=20
        )

        # 3. Simulate reviewing first card
        if due_cards:
            card = due_cards[0]
            updated_card = await service.schedule_review(
                card_id=card.id,
                rating=3,  # Good
                review_duration_seconds=10.5
            )

            print(f"Next review: {updated_card.due_date}")
            print(f"Stability: {updated_card.stability:.1f} days")

        # 4. Check statistics
        stats = await service.get_card_stats(user_id=user_id)
        print(f"Total cards: {stats['total_cards']}")
        print(f"Due today: {stats['due_today']}")

        # 5. Predict retention
        retention = await service.predict_retention(card.id)
        print(f"Retention: {retention:.2%}")

        # 6. Optimize parameters (after 100+ reviews)
        params = await service.optimize_parameters(
            user_id=user_id,
            min_reviews=100
        )
        if params:
            print("Parameters optimized!")
```

---

## Testing

### Run Unit Tests

```bash
cd backend
pytest tests/test_fsrs_service.py -v
```

### Manual Testing

```bash
# Create test user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Login to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Use token for review endpoints
export TOKEN="eyJ..."

curl -X POST http://localhost:8000/api/reviews/cards \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"flashcard_content": "Test card"}'
```

---

## Monitoring

### Check System Health

```bash
# Card counts
curl -X GET http://localhost:8000/api/reviews/stats \
  -H "Authorization: Bearer {token}"

# Recent reviews
psql $DATABASE_URL -c "
  SELECT
    DATE(reviewed_at) as date,
    COUNT(*) as reviews,
    AVG(CASE WHEN rating >= 3 THEN 1.0 ELSE 0.0 END) as retention_rate
  FROM fsrs_review_logs
  WHERE reviewed_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(reviewed_at)
  ORDER BY date DESC;
"

# Average stability by user
psql $DATABASE_URL -c "
  SELECT
    user_id,
    COUNT(*) as card_count,
    AVG(stability) as avg_stability,
    AVG(retrievability) as avg_retrievability
  FROM fsrs_cards
  WHERE stability > 0
  GROUP BY user_id
  ORDER BY card_count DESC
  LIMIT 10;
"
```

---

## Common Issues

### "No cards due"

**Solution**: Create cards first!
```bash
curl -X POST http://localhost:8000/api/reviews/cards \
  -H "Authorization: Bearer {token}" \
  -d '{"topic_id": "your-topic-uuid"}'
```

### "Insufficient reviews for optimization"

**Solution**: Need 100+ reviews before optimizing. Keep reviewing!

### Cards not advancing to "review" state

**Solution**: Review cards with "Good" (3) or "Easy" (4) ratings multiple times.

---

## Next Steps

1. **Integrate with Material Upload**: Auto-create cards when users upload PDFs
2. **Add to Study Dashboard**: Show due card count prominently
3. **Create Review Mode**: Dedicated page for daily reviews
4. **Gamification**: Award XP and badges for consistent reviewing
5. **Analytics**: Show retention curves and learning progress

---

## Resources

- **Full Documentation**: See `FSRS_INTEGRATION.md`
- **FSRS Algorithm**: https://github.com/open-spaced-repetition/fsrs4anki
- **API Reference**: http://localhost:8000/docs (FastAPI auto-docs)

---

**Questions?** Open an issue on GitHub or contact backend@studyin.app
