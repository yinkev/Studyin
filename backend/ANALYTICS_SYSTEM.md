# StudyIn Analytics System

## Overview

The StudyIn analytics system provides comprehensive tracking and reporting capabilities for learning metrics, gamification progress, and system health monitoring. Built with privacy-first design principles and HIPAA compliance.

## Architecture

### Components

1. **Event Models** (`app/models/analytics.py`)
   - Pydantic models for different event types
   - HIPAA-compliant with anonymized user IDs
   - No PII storage

2. **Event Bus** (`app/services/analytics/event_bus.py`)
   - Redis-based pub/sub system
   - Real-time event processing
   - Event persistence and history

3. **Event Tracker** (`app/services/analytics/tracker.py`)
   - High-level tracking utilities
   - Session management
   - Metric aggregation

4. **Analytics API** (`app/api/analytics.py`)
   - RESTful endpoints for dashboards
   - Aggregated metrics
   - Time-series data

5. **Database Schema** (`alembic/versions/004_analytics.py`)
   - Optimized for time-series queries
   - Indexed for performance
   - Materialized views for dashboards

## Event Types

### Learning Events
- `SESSION_START` - Learning session begins
- `SESSION_END` - Learning session ends
- `MATERIAL_VIEW` - Material viewed
- `MATERIAL_COMPLETE` - Material completed

### Gamification Events
- `XP_EARNED` - Experience points earned
- `LEVEL_UP` - User leveled up
- `ACHIEVEMENT_EARNED` - Achievement unlocked
- `STREAK_UPDATE` - Streak days updated

### AI Coach Events
- `AI_MESSAGE_SENT` - User sends message to AI
- `AI_MESSAGE_RECEIVED` - AI responds to user
- `AI_FEEDBACK_RATED` - User rates AI response

### System Events
- `API_REQUEST` - API endpoint called
- `API_ERROR` - API error occurred
- `SEARCH_QUERY` - Search performed

## API Endpoints

### Learning Overview
```
GET /api/analytics/learning/overview?days=30
```
Returns 30-day metrics including:
- Total sessions and duration
- Materials viewed/completed
- XP earned and current level
- Streaks and achievements

### Activity Heatmap
```
GET /api/analytics/learning/heatmap?days=365
```
Returns daily activity data for calendar visualization:
- Activity counts per day
- Duration in minutes
- XP earned

### Gamification Progress
```
GET /api/analytics/gamification/progress?days=30
```
Returns gamification metrics:
- Current XP and level
- Progress to next level
- Achievement history
- XP trends

### System Metrics
```
GET /api/analytics/system/metrics?hours=24
```
Returns system health metrics:
- API performance (p50, p95, p99)
- Error rates and types
- Top endpoints by usage
- Active user count

### Event Tracking
```
POST /api/analytics/events/track
{
  "event_type": "session_start",
  "properties": {
    "material_id": "uuid"
  }
}
```

## Privacy & Compliance

### HIPAA Compliance
- **Anonymized User IDs**: All user IDs are hashed using SHA-256
- **No PII Storage**: No personally identifiable information stored
- **Data Minimization**: Only essential metrics tracked
- **Secure Transmission**: All data encrypted in transit

### Data Retention
- Event history: 7 days in Redis
- Aggregated metrics: Indefinite
- System metrics: 30 days
- Raw events: Can be configured

## Database Tables

### Core Tables
- `analytics_events` - Raw event storage
- `learning_sessions` - Session aggregations
- `gamification_stats` - User gamification state
- `daily_activity_summary` - Pre-aggregated daily metrics
- `ai_coach_metrics` - AI interaction metrics
- `system_metrics` - API performance data

### Indexes
- Time-based queries optimized with BTREE indexes
- JSONB properties searchable with GIN indexes
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Materialized Views
- `hourly_analytics_summary` - Hourly aggregations for dashboards

## Redis Structure

### Channels
- `analytics:session_start`
- `analytics:session_end`
- `analytics:material_view`
- `analytics:xp_earned`
- etc.

### Data Structures
- **Lists**: Recent events per type (`analytics:history:{event_type}`)
- **Sorted Sets**: Timeline of all events (`analytics:timeline`)
- **Pub/Sub**: Real-time event distribution

## Testing

### Unit Tests
Run the test suite:
```bash
python test_analytics.py
```

Tests cover:
- Event publishing
- Event subscription
- Metric aggregation
- API endpoints
- Privacy compliance

### Load Testing
The system is designed to handle:
- 10,000+ events per second
- 1,000+ concurrent users
- Sub-100ms event processing

## Monitoring

### Health Checks
- Redis connectivity
- Database query performance
- Event processing lag
- Memory usage

### Alerts
Configure alerts for:
- High error rates (>1%)
- Slow response times (>1s p95)
- Failed event processing
- Redis connection issues

## Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=optional_password

# Analytics Settings
ANALYTICS_EVENT_RETENTION_DAYS=7
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=60
```

### Performance Tuning
- Adjust Redis connection pool size
- Configure event batch processing
- Tune materialized view refresh intervals
- Optimize database connection pools

## Usage Examples

### Track Learning Session
```python
from app.services.analytics import AnalyticsTracker

tracker = AnalyticsTracker(db_session)

# Start session
session_id = await tracker.start_learning_session(
    user_id=user.id,
    material_id=material.id
)

# Track material interaction
await tracker.track_material_interaction(
    user_id=user.id,
    material_id=material.id,
    material_type="pdf",
    interaction_type="view",
    progress_percentage=50.0
)

# End session
await tracker.end_learning_session(
    user_id=user.id,
    session_id=session_id,
    xp_earned=100
)
```

### Subscribe to Events
```python
from app.services.analytics import get_event_bus

bus = get_event_bus()

async def handle_xp_event(event):
    print(f"User earned {event.xp_amount} XP!")

await bus.subscribe([EventType.XP_EARNED], handle_xp_event)
await bus.start_listening()
```

### Query Metrics
```python
# Get learning overview
response = await client.get("/api/analytics/learning/overview")
metrics = response.json()

print(f"Total sessions: {metrics['total_sessions']}")
print(f"Current streak: {metrics['current_streak']}")
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis is running: `redis-cli ping`
   - Verify connection settings
   - Check firewall rules

2. **Slow Queries**
   - Run `EXPLAIN ANALYZE` on slow queries
   - Check index usage
   - Consider query optimization

3. **High Memory Usage**
   - Reduce event retention period
   - Optimize Redis memory settings
   - Check for memory leaks

4. **Event Processing Lag**
   - Increase worker count
   - Optimize event handlers
   - Check Redis performance

## Future Enhancements

- [ ] Real-time dashboards with WebSocket
- [ ] Machine learning for trend prediction
- [ ] Custom event definitions
- [ ] Export to data warehouse
- [ ] Advanced funnel analysis
- [ ] Cohort analysis
- [ ] A/B testing framework
- [ ] Alert automation

## Support

For issues or questions about the analytics system, please refer to:
- Technical documentation: `/docs/analytics`
- API documentation: `/docs#analytics`
- Support team: analytics@studyin.app