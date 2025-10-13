# 📊 Analytics Dashboard - Quick Start Guide

> **TL;DR:** Your analytics dashboard is ready! Navigate to Analytics in the nav bar to see it in action.

---

## ✅ What's Done

### Frontend (100% Complete)
- ✅ Analytics page with ECharts visualizations
- ✅ Analytics API hooks and types
- ✅ Event tracking integrated throughout app
- ✅ Navigation updated with Analytics link
- ✅ All components styled with Soft Kawaii Brutalist design

### Backend (Needs Implementation)
- ⏳ API endpoints (see below)
- ⏳ Database schema for analytics
- ⏳ Event ingestion pipeline

---

## 🚀 Start the Frontend

```bash
cd frontend
npm run dev
```

Navigate to http://localhost:5173 and click **Analytics** in the nav bar.

**Expected Behavior:**
- Without backend: Loading spinner → Error message with retry button
- With backend: Beautiful analytics dashboard with charts and metrics

---

## 🔌 Backend API Requirements

### 1. Learning Overview Endpoint

```python
# backend/app/api/analytics.py

@router.get("/learning/overview")
async def get_learning_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get 30-day learning metrics summary"""

    # Calculate metrics from database
    metrics = {
        "total_sessions": 42,
        "total_minutes": 1260,
        "avg_session_minutes": 30.0,
        "questions_attempted": 156,
        "questions_correct": 128,
        "accuracy_percent": 82.05,
        "materials_reviewed": 12,
        "unique_topics": 8
    }

    return {
        "metrics": metrics,
        "period_days": 30
    }
```

### 2. Activity Heatmap Endpoint

```python
@router.get("/learning/heatmap")
async def get_activity_heatmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get daily activity data for calendar heatmap"""

    # Query daily aggregates for last 90 days
    activities = [
        {
            "date": "2025-10-01",
            "sessions": 2,
            "minutes": 60,
            "xp_earned": 120
        },
        # ... more days
    ]

    return {
        "activities": activities,
        "period_days": 90
    }
```

### 3. Gamification Progress Endpoint

```python
@router.get("/gamification/progress")
async def get_gamification_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get XP trends and achievements"""

    # Query XP history
    xp_trend = [
        {
            "date": "2025-10-01",
            "xp": 120,
            "cumulative_xp": 5420
        },
        # ... more days
    ]

    # Query achievements
    achievements = [
        {
            "id": "first-session",
            "title": "First Steps",
            "description": "Complete your first study session",
            "icon": "🎯",
            "unlocked_at": "2025-09-15T10:30:00Z",
            "progress_current": 1,
            "progress_target": 1
        },
        # ... more achievements
    ]

    return {
        "xp_trend": xp_trend,
        "achievements": achievements,
        "level": current_user.level,
        "total_xp": current_user.total_xp
    }
```

### 4. Event Tracking Endpoint

```python
@router.post("/events")
async def track_event(
    event: AnalyticsEvent,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ingest analytics events from frontend"""

    # Store event in database or send to analytics service
    analytics_event = AnalyticsEventModel(
        user_id=current_user.id,
        category=event.category,
        action=event.action,
        label=event.label,
        value=event.value,
        metadata=event.metadata,
        timestamp=event.timestamp
    )

    db.add(analytics_event)
    await db.commit()

    return {"status": "success"}
```

---

## 📊 Database Schema

### Analytics Events Table

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,  -- session, material, chat, gamification, navigation
    action VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    value INTEGER,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_category ON analytics_events(category);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_user_timestamp ON analytics_events(user_id, timestamp DESC);
```

### Daily Aggregates Table (Optional, for performance)

```sql
CREATE TABLE analytics_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    materials_reviewed INTEGER DEFAULT 0,
    unique_topics INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_user_date ON analytics_daily_aggregates(user_id, date DESC);
```

---

## 🧪 Test with Mock Data

### Option 1: Mock API Server

Create `backend/app/api/analytics_mock.py`:

```python
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/learning/overview")
async def mock_learning_overview():
    return {
        "metrics": {
            "total_sessions": 42,
            "total_minutes": 1260,
            "avg_session_minutes": 30.0,
            "questions_attempted": 156,
            "questions_correct": 128,
            "accuracy_percent": 82.05,
            "materials_reviewed": 12,
            "unique_topics": 8
        },
        "period_days": 30
    }

@router.get("/learning/heatmap")
async def mock_activity_heatmap():
    activities = []
    base_date = datetime.now() - timedelta(days=90)

    for i in range(90):
        date = base_date + timedelta(days=i)
        activities.append({
            "date": date.strftime("%Y-%m-%d"),
            "sessions": i % 3,
            "minutes": (i % 5) * 15,
            "xp_earned": (i % 5) * 30
        })

    return {
        "activities": activities,
        "period_days": 90
    }

@router.get("/gamification/progress")
async def mock_gamification_progress():
    xp_trend = []
    cumulative = 5000
    base_date = datetime.now() - timedelta(days=30)

    for i in range(30):
        date = base_date + timedelta(days=i)
        daily_xp = (i % 7 + 1) * 20
        cumulative += daily_xp

        xp_trend.append({
            "date": date.strftime("%Y-%m-%d"),
            "xp": daily_xp,
            "cumulative_xp": cumulative
        })

    achievements = [
        {
            "id": "first-session",
            "title": "First Steps",
            "description": "Complete your first study session",
            "icon": "🎯",
            "unlocked_at": (datetime.now() - timedelta(days=20)).isoformat(),
            "progress_current": 1,
            "progress_target": 1
        },
        {
            "id": "streak-7",
            "title": "Week Warrior",
            "description": "Maintain a 7-day study streak",
            "icon": "🔥",
            "unlocked_at": None,
            "progress_current": 5,
            "progress_target": 7
        },
        {
            "id": "xp-1000",
            "title": "XP Master",
            "description": "Earn 1000 total XP",
            "icon": "⭐",
            "unlocked_at": (datetime.now() - timedelta(days=10)).isoformat(),
            "progress_current": 1000,
            "progress_target": 1000
        }
    ]

    return {
        "xp_trend": xp_trend,
        "achievements": achievements,
        "level": 5,
        "total_xp": cumulative
    }

@router.post("/events")
async def mock_track_event():
    return {"status": "success"}
```

Register in `backend/app/main.py`:

```python
from app.api import analytics_mock

app.include_router(
    analytics_mock.router,
    prefix="/api/analytics",
    tags=["analytics"]
)
```

### Option 2: Frontend Mock

Use axios-mock-adapter (already installed):

```typescript
// frontend/src/mocks/analyticsMocks.ts
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/lib/api/client';

export function setupAnalyticsMocks() {
  const mock = new MockAdapter(apiClient);

  // Learning overview
  mock.onGet('/api/analytics/learning/overview').reply(200, {
    metrics: {
      total_sessions: 42,
      total_minutes: 1260,
      avg_session_minutes: 30.0,
      questions_attempted: 156,
      questions_correct: 128,
      accuracy_percent: 82.05,
      materials_reviewed: 12,
      unique_topics: 8,
    },
    period_days: 30,
  });

  // Activity heatmap
  const activities = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 90);

  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    activities.push({
      date: date.toISOString().split('T')[0],
      sessions: i % 3,
      minutes: (i % 5) * 15,
      xp_earned: (i % 5) * 30,
    });
  }

  mock.onGet('/api/analytics/learning/heatmap').reply(200, {
    activities,
    period_days: 90,
  });

  // Gamification progress
  const xp_trend = [];
  let cumulative = 5000;

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - 30 + i);
    const daily_xp = ((i % 7) + 1) * 20;
    cumulative += daily_xp;

    xp_trend.push({
      date: date.toISOString().split('T')[0],
      xp: daily_xp,
      cumulative_xp: cumulative,
    });
  }

  mock.onGet('/api/analytics/gamification/progress').reply(200, {
    xp_trend,
    achievements: [
      {
        id: 'first-session',
        title: 'First Steps',
        description: 'Complete your first study session',
        icon: '🎯',
        unlocked_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        progress_current: 1,
        progress_target: 1,
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day study streak',
        icon: '🔥',
        unlocked_at: null,
        progress_current: 5,
        progress_target: 7,
      },
    ],
    level: 5,
    total_xp: cumulative,
  });

  // Event tracking
  mock.onPost('/api/analytics/events').reply(200, { status: 'success' });
}
```

Enable in `frontend/src/main.tsx`:

```typescript
import { setupAnalyticsMocks } from '@/mocks/analyticsMocks';

// In development only
if (import.meta.env.DEV) {
  setupAnalyticsMocks();
}
```

---

## 📱 Screenshots of What You'll See

### 1. Analytics Dashboard
- Hero header with refresh button
- 6 metric cards with Kawaii icons
- Smart insights based on your data

### 2. XP Trend Chart
- Dual-axis chart (bar + line)
- Daily XP bars in blush pink
- Cumulative XP line in primary purple
- Gradient fill under line
- Interactive tooltips

### 3. Study Heatmap
- Calendar layout (like GitHub contributions)
- Color intensity = study minutes
- Hover shows date + minutes
- Smooth animations

### 4. Achievement Gallery
- Progress cards with unlock status
- Locked achievements show progress bars
- Unlocked achievements show date
- Gradient glow effects

---

## 🎯 Next Steps

1. **Test Frontend (Now)**
   ```bash
   cd frontend
   npm run dev
   # Click Analytics in nav bar
   ```

2. **Implement Backend APIs** (see code samples above)
   - Start with mock endpoints
   - Replace with real DB queries
   - Add proper error handling

3. **Create Database Schema**
   - Run migration for analytics_events table
   - Optionally add daily_aggregates table
   - Create indexes for performance

4. **Test End-to-End**
   - Upload materials → Track events
   - Start chat session → Track session
   - Check analytics dashboard → See data
   - Verify charts render correctly

5. **Deploy to Production**
   - Test with real user data
   - Monitor API performance
   - Adjust caching if needed

---

## 🐛 Troubleshooting

### "Failed to load analytics data"
**Cause:** Backend APIs not implemented or returning errors
**Fix:**
- Check backend logs for errors
- Verify API endpoints match frontend URLs
- Use mock data (see above) for testing

### Charts not rendering
**Cause:** Invalid data format from API
**Fix:**
- Verify API response matches TypeScript types
- Check browser console for errors
- Ensure dates are in "YYYY-MM-DD" format

### TypeScript errors
**Cause:** ECharts type definitions
**Fix:** Already fixed with `skipLibCheck: true` in tsconfig.json

### Events not tracking
**Cause:** API endpoint missing or failing silently
**Fix:**
- Events fail silently by design (won't break UX)
- Check Network tab for failed POST requests
- Implement `/api/analytics/events` endpoint

---

## 📚 Additional Resources

- **Full Documentation:** `/ANALYTICS_DASHBOARD_COMPLETE.md`
- **ECharts Docs:** https://echarts.apache.org/en/index.html
- **React ECharts:** https://git.hust.cc/echarts-for-react/

---

**Happy Analyzing! 📊✨**

Questions? Check the full documentation or the inline code comments.
