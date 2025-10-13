# StudyIn API Documentation

> **Complete API Reference for StudyIn Medical Learning Platform**

## Base URL
```
Development: http://localhost:8000
Production: https://api.studyin.app
WebSocket: ws://localhost:8000 (wss:// for production)
```

## Authentication

StudyIn uses JWT (JSON Web Token) authentication with access and refresh tokens.

### Token Flow
1. User logs in with credentials → Receive access + refresh tokens
2. Include access token in `Authorization: Bearer <token>` header
3. When access token expires → Use refresh token to get new access token
4. Refresh token expires → User must log in again

---

## API Endpoints

### 🔐 Authentication & User Management

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "medstudent",
  "full_name": "John Doe"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "medstudent",
  "full_name": "John Doe",
  "created_at": "2025-01-11T10:00:00Z",
  "message": "User created successfully"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "medstudent",
    "level": 3,
    "xp": 1240,
    "streak": 9
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access_token>

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "medstudent",
  "full_name": "John Doe",
  "profile": {
    "level": 3,
    "xp": 1240,
    "total_xp": 5240,
    "streak": 9,
    "best_streak": 15,
    "badges": ["early_bird", "consistent_learner"],
    "learning_style": "visual",
    "target_exam_date": "2025-06-15",
    "study_goals": {
      "daily_minutes": 45,
      "questions_per_day": 50
    }
  },
  "statistics": {
    "total_questions": 450,
    "correct_answers": 338,
    "accuracy": 75.1,
    "study_time_minutes": 2340,
    "materials_uploaded": 12
  }
}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "newusername",
  "full_name": "Jane Doe",
  "learning_style": "kinesthetic",
  "target_exam_date": "2025-07-01",
  "study_goals": {
    "daily_minutes": 60,
    "questions_per_day": 75
  }
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

---

### 📚 Materials Management

#### Upload Material
```http
POST /api/materials/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <PDF or DOCX file>
title: "Pathology Chapter 1"
subject: "pathology"
tags: ["cardiovascular", "inflammation"]

Response: 201 Created
{
  "id": "mat_uuid",
  "title": "Pathology Chapter 1",
  "filename": "pathology_ch1.pdf",
  "file_type": "application/pdf",
  "file_size": 2456789,
  "subject": "pathology",
  "tags": ["cardiovascular", "inflammation"],
  "status": "processing",
  "chunks_created": 0,
  "uploaded_at": "2025-01-11T10:00:00Z"
}
```

#### Get Materials List
```http
GET /api/materials?page=1&limit=20&subject=pathology
Authorization: Bearer <access_token>

Response: 200 OK
{
  "materials": [
    {
      "id": "mat_uuid",
      "title": "Pathology Chapter 1",
      "filename": "pathology_ch1.pdf",
      "subject": "pathology",
      "tags": ["cardiovascular", "inflammation"],
      "status": "ready",
      "chunks_created": 45,
      "uploaded_at": "2025-01-11T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Material Details
```http
GET /api/materials/{material_id}
Authorization: Bearer <access_token>

Response: 200 OK
{
  "id": "mat_uuid",
  "title": "Pathology Chapter 1",
  "filename": "pathology_ch1.pdf",
  "file_type": "application/pdf",
  "file_size": 2456789,
  "subject": "pathology",
  "tags": ["cardiovascular", "inflammation"],
  "status": "ready",
  "chunks": [
    {
      "id": "chunk_uuid",
      "content": "The cardiovascular system consists of...",
      "page": 1,
      "position": 0
    }
  ],
  "metadata": {
    "pages": 25,
    "words": 12500,
    "topics_extracted": ["heart", "vessels", "circulation"]
  },
  "processing_time": 45.2,
  "uploaded_at": "2025-01-11T10:00:00Z"
}
```

#### Delete Material
```http
DELETE /api/materials/{material_id}
Authorization: Bearer <access_token>

Response: 204 No Content
```

---

### 💬 AI Coach Chat

#### WebSocket Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/chat');

// Connection opened
ws.onopen = () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'access_token_here'
  }));
};

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'connected':
      console.log('Connected to AI Coach');
      break;
    case 'message':
      console.log('AI:', data.content);
      break;
    case 'streaming':
      console.log('Chunk:', data.chunk);
      break;
    case 'error':
      console.error('Error:', data.message);
      break;
  }
};

// Send message
ws.send(JSON.stringify({
  type: 'message',
  content: 'Explain the cardiac cycle',
  context: {
    difficulty: 3,
    learning_style: 'visual'
  }
}));
```

#### HTTP Chat Endpoints

##### Send Message
```http
POST /api/chat/message
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Explain the cardiac cycle",
  "context": {
    "difficulty": 3,
    "learning_style": "visual",
    "include_materials": true
  }
}

Response: 200 OK
{
  "id": "msg_uuid",
  "response": "The cardiac cycle consists of two main phases...",
  "citations": [
    {
      "material_id": "mat_uuid",
      "chunk_id": "chunk_uuid",
      "relevance": 0.92
    }
  ],
  "timestamp": "2025-01-11T10:00:00Z"
}
```

##### Get Chat History
```http
GET /api/chat/history?limit=50&before=2025-01-11T10:00:00Z
Authorization: Bearer <access_token>

Response: 200 OK
{
  "messages": [
    {
      "id": "msg_uuid",
      "role": "user",
      "content": "Explain the cardiac cycle",
      "timestamp": "2025-01-11T09:55:00Z"
    },
    {
      "id": "msg_uuid2",
      "role": "assistant",
      "content": "The cardiac cycle consists of...",
      "timestamp": "2025-01-11T09:55:05Z"
    }
  ],
  "has_more": true
}
```

---

### 📊 Analytics

#### Dashboard Metrics
```http
GET /api/analytics/dashboard
Authorization: Bearer <access_token>

Response: 200 OK
{
  "overview": {
    "total_xp": 5240,
    "current_level": 3,
    "next_level_xp": 1800,
    "current_streak": 9,
    "best_streak": 15,
    "study_time_today": 45,
    "questions_today": 32,
    "accuracy_today": 78.1
  },
  "weekly_progress": {
    "xp_gained": 420,
    "questions_answered": 210,
    "average_accuracy": 75.3,
    "study_minutes": 315,
    "topics_covered": ["cardiology", "neurology", "pharmacology"]
  },
  "performance_trends": [
    {
      "date": "2025-01-04",
      "accuracy": 72.5,
      "questions": 45,
      "xp": 180
    },
    {
      "date": "2025-01-05",
      "accuracy": 74.2,
      "questions": 50,
      "xp": 210
    }
  ],
  "subject_performance": {
    "anatomy": { "accuracy": 82.3, "questions": 120 },
    "physiology": { "accuracy": 78.5, "questions": 95 },
    "pathology": { "accuracy": 71.2, "questions": 85 }
  }
}
```

#### Learning Progress
```http
GET /api/analytics/progress?period=month
Authorization: Bearer <access_token>

Response: 200 OK
{
  "period": "month",
  "start_date": "2024-12-11",
  "end_date": "2025-01-11",
  "metrics": {
    "total_study_time": 2340,
    "total_questions": 1450,
    "correct_answers": 1088,
    "overall_accuracy": 75.0,
    "xp_gained": 2100,
    "levels_gained": 2,
    "badges_earned": ["consistent_learner", "accuracy_master"]
  },
  "daily_data": [
    {
      "date": "2025-01-01",
      "study_time": 65,
      "questions": 55,
      "accuracy": 76.4,
      "xp": 85
    }
  ],
  "topics_mastered": [
    {
      "topic": "cardiac_physiology",
      "mastery": 85,
      "questions_answered": 120
    }
  ]
}
```

#### Performance Analytics
```http
GET /api/analytics/performance?subject=pathology
Authorization: Bearer <access_token>

Response: 200 OK
{
  "subject": "pathology",
  "overall_stats": {
    "total_questions": 450,
    "correct": 315,
    "accuracy": 70.0,
    "average_time_per_question": 45.2,
    "difficulty_distribution": {
      "easy": { "count": 150, "accuracy": 85.3 },
      "medium": { "count": 200, "accuracy": 70.0 },
      "hard": { "count": 100, "accuracy": 52.0 }
    }
  },
  "error_patterns": [
    {
      "pattern": "Confusing inflammation types",
      "frequency": 12,
      "examples": ["acute vs chronic", "granulomatous"]
    }
  ],
  "recommendations": [
    "Review acute inflammation mechanisms",
    "Practice more case-based questions",
    "Focus on pathology image recognition"
  ]
}
```

---

### 🎮 Gamification

#### Get Stats
```http
GET /api/gamification/stats
Authorization: Bearer <access_token>

Response: 200 OK
{
  "user_id": "uuid",
  "level": 3,
  "current_xp": 1240,
  "level_xp": 1800,
  "total_xp": 5240,
  "rank": "Medical Student",
  "next_rank": "Resident",
  "streak": {
    "current": 9,
    "best": 15,
    "last_checkin": "2025-01-11T08:00:00Z"
  },
  "badges": [
    {
      "id": "early_bird",
      "name": "Early Bird",
      "description": "Study before 6 AM",
      "earned_at": "2025-01-05T05:45:00Z",
      "rarity": "common"
    },
    {
      "id": "streak_master",
      "name": "Streak Master",
      "description": "7-day streak",
      "earned_at": "2025-01-08T10:00:00Z",
      "rarity": "rare"
    }
  ],
  "achievements_progress": [
    {
      "id": "question_champion",
      "name": "Question Champion",
      "progress": 450,
      "target": 500,
      "reward_xp": 250
    }
  ]
}
```

#### Daily Check-in
```http
POST /api/gamification/checkin
Authorization: Bearer <access_token>

Response: 200 OK
{
  "success": true,
  "streak": {
    "current": 10,
    "bonus_xp": 50,
    "milestone_reached": true,
    "milestone_reward": {
      "badge": "streak_warrior",
      "xp": 100
    }
  },
  "daily_bonus": {
    "xp": 25,
    "multiplier": 1.5
  },
  "next_checkin": "2025-01-12T00:00:00Z"
}
```

#### Leaderboard
```http
GET /api/gamification/leaderboard?period=week&limit=10
Authorization: Bearer <access_token>

Response: 200 OK
{
  "period": "week",
  "user_rank": 5,
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid1",
      "username": "topstudent",
      "level": 5,
      "xp_gained": 850,
      "accuracy": 82.5,
      "streak": 15
    },
    {
      "rank": 2,
      "user_id": "uuid2",
      "username": "medgenius",
      "level": 4,
      "xp_gained": 780,
      "accuracy": 79.3,
      "streak": 12
    }
  ],
  "total_participants": 245
}
```

---

### 📝 Question Generation

#### Generate Questions
```http
POST /api/questions/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic": "cardiovascular_pathology",
  "difficulty": 3,
  "count": 5,
  "question_type": "mcq",
  "use_materials": true,
  "clinical_vignette": true
}

Response: 200 OK
{
  "questions": [
    {
      "id": "q_uuid",
      "question": "A 65-year-old man presents with chest pain...",
      "type": "mcq",
      "options": [
        { "id": "a", "text": "Myocardial infarction" },
        { "id": "b", "text": "Stable angina" },
        { "id": "c", "text": "Prinzmetal angina" },
        { "id": "d", "text": "Pericarditis" }
      ],
      "correct_answer": "a",
      "explanation": "The patient's presentation is most consistent with...",
      "difficulty": 3,
      "topic": "cardiovascular_pathology",
      "subtopics": ["MI", "acute_coronary_syndrome"],
      "learning_objectives": [
        "Recognize clinical presentation of MI",
        "Differentiate types of chest pain"
      ]
    }
  ],
  "generation_time": 2.3,
  "materials_used": ["mat_uuid1", "mat_uuid2"]
}
```

#### Submit Answer
```http
POST /api/questions/answer
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "question_id": "q_uuid",
  "answer": "a",
  "time_taken": 45,
  "confidence": 4
}

Response: 200 OK
{
  "correct": true,
  "correct_answer": "a",
  "explanation": "The patient's presentation is most consistent with...",
  "xp_earned": 15,
  "accuracy_impact": 0.5,
  "mastery_update": {
    "topic": "cardiovascular_pathology",
    "new_mastery": 72,
    "change": 2
  },
  "streak_bonus": false
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "status": 400
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Rate Limiting

API requests are rate-limited per user:
- **Default**: 100 requests per minute
- **Chat**: 30 messages per minute
- **File Upload**: 10 uploads per hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704981600
```

---

## WebSocket Events

### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `auth` | Authenticate connection | `{ token: string }` |
| `message` | Send chat message | `{ content: string, context: object }` |
| `typing` | User typing indicator | `{ typing: boolean }` |
| `ping` | Keep-alive ping | `{}` |

### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Successfully connected | `{ session_id: string }` |
| `message` | AI response | `{ content: string, id: string }` |
| `streaming` | Streaming chunk | `{ chunk: string, done: boolean }` |
| `typing` | AI typing indicator | `{ typing: boolean }` |
| `error` | Error occurred | `{ message: string, code: string }` |
| `pong` | Keep-alive response | `{}` |

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { StudyInClient } from '@studyin/sdk';

const client = new StudyInClient({
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000'
});

// Login
const { accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Set auth token
client.setAuthToken(accessToken);

// Upload material
const material = await client.materials.upload({
  file: fileBlob,
  title: 'Pathology Notes',
  subject: 'pathology'
});

// Chat with AI
const chat = client.chat.connect();
chat.on('message', (msg) => console.log(msg));
chat.send('Explain cardiac cycle');
```

### Python
```python
from studyin import StudyInClient

client = StudyInClient(
    api_url="http://localhost:8000",
    ws_url="ws://localhost:8000"
)

# Login
auth = client.auth.login(
    email="user@example.com",
    password="password"
)
client.set_token(auth.access_token)

# Upload material
with open("notes.pdf", "rb") as f:
    material = client.materials.upload(
        file=f,
        title="Pathology Notes",
        subject="pathology"
    )

# Generate questions
questions = client.questions.generate(
    topic="cardiovascular",
    difficulty=3,
    count=5
)

for q in questions:
    print(q.question)
    answer = input("Your answer: ")
    result = client.questions.answer(q.id, answer)
    print(f"Correct: {result.correct}")
```

---

## Best Practices

### Authentication
- Store tokens securely (HttpOnly cookies or secure storage)
- Refresh access tokens before expiry
- Never expose tokens in URLs or logs

### Error Handling
- Implement exponential backoff for retries
- Handle network failures gracefully
- Show user-friendly error messages

### Performance
- Use pagination for large datasets
- Implement request caching where appropriate
- Batch requests when possible

### WebSocket
- Implement reconnection logic
- Handle connection drops gracefully
- Use heartbeat/ping-pong for connection health

---

## Changelog

### Version 2.0 (January 2025)
- Added WebSocket streaming for AI Coach
- Implemented gamification system
- Added analytics dashboard endpoints
- Enhanced security with rate limiting
- Added batch operations support

### Version 1.0 (December 2024)
- Initial API release
- Basic authentication
- Material upload
- Question generation
- Chat functionality

---

## Support

For API support and questions:
- **Documentation**: https://docs.studyin.app
- **Status Page**: https://status.studyin.app
- **Support Email**: api-support@studyin.app
- **Discord**: https://discord.gg/studyin-dev