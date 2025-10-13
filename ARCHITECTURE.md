# StudyIn System Architecture

> **Technical Architecture Documentation for StudyIn Medical Learning Platform**

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Data Architecture](#data-architecture)
7. [AI/LLM Integration](#aillm-integration)
8. [Security Architecture](#security-architecture)
9. [Infrastructure](#infrastructure)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

StudyIn is a modern, scalable medical learning platform built with a microservices-oriented architecture, featuring real-time AI coaching, adaptive learning algorithms, and comprehensive analytics.

### Key Architectural Components
- **Frontend**: React 19.2 SPA with Vite bundler
- **Backend**: FastAPI async Python framework
- **Database**: PostgreSQL (primary) + Redis (cache/sessions)
- **AI/LLM**: Codex CLI integration via OAuth
- **Real-time**: WebSocket for bidirectional communication
- **Vector DB**: ChromaDB for semantic search

---

## Architecture Principles

### 1. **Separation of Concerns**
- Clear boundaries between presentation, business logic, and data layers
- Independent scaling of components
- Technology-agnostic interfaces

### 2. **Security First**
- Zero-trust architecture
- Defense in depth
- Principle of least privilege
- Encrypted data at rest and in transit

### 3. **Performance Optimization**
- Async/await throughout the stack
- Strategic caching at multiple levels
- Lazy loading and code splitting
- Database query optimization

### 4. **Developer Experience**
- Type safety (TypeScript + Python type hints)
- Comprehensive error handling
- Detailed logging and monitoring
- Self-documenting APIs

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   React SPA  │  │  Mobile App  │  │   API Client │         │
│  │   (Vite)     │  │ (React Native)│  │   (SDK)      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (nginx)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Load Balancing | Rate Limiting | SSL/TLS | Caching      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   FastAPI       │ │   WebSocket     │ │   Static        │
│   REST API      │ │   Server        │ │   Assets        │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Auth      │  │   Learning  │  │   Analytics │           │
│  │   Service   │  │   Engine    │  │   Service   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   RAG       │  │   Chat      │  │ Gamification│           │
│  │   Pipeline  │  │   Service   │  │   Service   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │   ChromaDB   │
│   Database   │ │  Cache/Queue │ │  Vector DB   │
└──────────────┘ └──────────────┘ └──────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Codex CLI  │  │    Email    │  │   Storage   │           │
│  │   (LLM)     │  │   Service   │  │     (S3)    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack
```
React 19.2.0 + TypeScript 5.6 + Vite 7.0 + Tailwind CSS v4
```

### Component Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (buttons, cards, inputs)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── chat/           # Chat system components
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   ├── gamification/   # Gamification components
│   │   ├── XPBar.tsx
│   │   ├── StreakCounter.tsx
│   │   └── BadgeDisplay.tsx
│   └── analytics/      # Analytics visualizations
│       ├── ProgressChart.tsx
│       ├── HeatMap.tsx
│       └── MetricsCard.tsx
├── pages/              # Route-level components
│   ├── Dashboard.tsx
│   ├── ChatView.tsx
│   ├── AnalyticsView.tsx
│   └── UploadView.tsx
├── hooks/              # Custom React hooks
│   ├── useChatSession.ts
│   ├── useAuth.ts
│   └── useAnalytics.ts
├── lib/                # Utilities and helpers
│   ├── api/           # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   └── utils/         # Helper functions
├── stores/            # Zustand state management
│   ├── authStore.ts
│   ├── chatStore.ts
│   └── gameStore.ts
└── styles/            # CSS and design system
    ├── index.css      # Global styles
    └── tokens.css     # Design tokens
```

### State Management

```typescript
// Zustand Store Example
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const response = await api.auth.login(credentials);
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true
    });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshToken: async () => {
    const token = await api.auth.refresh();
    set({ token });
  }
}));
```

### Performance Optimizations

1. **Code Splitting**
   - Route-based lazy loading
   - Component-level dynamic imports
   - Vendor chunk optimization

2. **React Optimizations**
   - React.memo for expensive components
   - useMemo/useCallback for computed values
   - Virtual scrolling for long lists

3. **Asset Optimization**
   - Image lazy loading
   - WebP format with fallbacks
   - SVG sprite sheets

---

## Backend Architecture

### Technology Stack
```
FastAPI + SQLAlchemy 2.0 + Pydantic + Redis + PostgreSQL
```

### Layer Architecture

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication routes
│   │   ├── chat.py       # WebSocket chat
│   │   ├── materials.py  # Document management
│   │   └── analytics.py  # Analytics endpoints
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration
│   │   ├── security.py   # Security utilities
│   │   ├── jwt.py        # JWT handling
│   │   └── dependencies.py # Dependency injection
│   ├── models/           # Database models
│   │   ├── user.py
│   │   ├── material.py
│   │   └── analytics.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── user.py
│   │   ├── material.py
│   │   └── response.py
│   ├── services/         # Business logic
│   │   ├── auth_service.py
│   │   ├── learning_engine.py
│   │   ├── rag_service.py
│   │   └── gamification.py
│   ├── middleware/       # Custom middleware
│   │   ├── auth.py
│   │   ├── rate_limit.py
│   │   └── logging.py
│   └── utils/           # Utility functions
│       ├── validators.py
│       └── formatters.py
├── alembic/             # Database migrations
├── tests/               # Test suite
└── requirements.txt
```

### Service Layer Pattern

```python
# Service Layer Example
class LearningEngineService:
    def __init__(
        self,
        db: AsyncSession,
        cache: Redis,
        llm_client: CodexClient
    ):
        self.db = db
        self.cache = cache
        self.llm = llm_client

    async def generate_question(
        self,
        user_id: str,
        topic: str,
        difficulty: int
    ) -> Question:
        # Get user profile for personalization
        user = await self.get_user_profile(user_id)

        # Check cache for similar questions
        cache_key = f"question:{topic}:{difficulty}"
        cached = await self.cache.get(cache_key)
        if cached:
            return Question.parse_raw(cached)

        # Generate via LLM
        prompt = self.build_prompt(topic, difficulty, user.learning_style)
        response = await self.llm.generate(prompt)

        # Parse and validate
        question = self.parse_question(response)

        # Cache for reuse
        await self.cache.setex(
            cache_key,
            3600,
            question.json()
        )

        # Record in database
        await self.save_question(question, user_id)

        return question
```

### WebSocket Implementation

```python
class ChatWebSocket:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str
    ):
        await websocket.accept()
        self.connections[user_id] = websocket

        # Send initial connection message
        await self.send_message(
            user_id,
            {"type": "connected", "session_id": str(uuid4())}
        )

    async def handle_message(
        self,
        user_id: str,
        message: dict
    ):
        msg_type = message.get("type")

        if msg_type == "message":
            # Process with AI
            response = await self.process_with_ai(
                message["content"],
                user_id
            )

            # Stream response
            async for chunk in response:
                await self.send_message(
                    user_id,
                    {"type": "streaming", "chunk": chunk}
                )

    async def disconnect(self, user_id: str):
        if user_id in self.connections:
            del self.connections[user_id]
```

---

## Data Architecture

### Database Schema

```sql
-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    learning_style VARCHAR(50),
    target_exam_date DATE,
    study_goals JSONB
);

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    subject VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'processing',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Tables
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    questions_answered INTEGER,
    correct_answers INTEGER,
    xp_earned INTEGER
);

CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    question_id UUID,
    answer_given VARCHAR(10),
    is_correct BOOLEAN,
    time_taken_seconds INTEGER,
    confidence_level INTEGER,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_materials_user ON materials(user_id);
CREATE INDEX idx_chunks_material ON material_chunks(material_id);
CREATE INDEX idx_chunks_embedding ON material_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, started_at);
CREATE INDEX idx_attempts_user_date ON question_attempts(user_id, attempted_at);
```

### Redis Data Structures

```redis
# User Sessions
user:session:{user_id} -> {
    "token": "jwt_token",
    "expires": 1234567890,
    "refresh_token": "refresh_token"
}

# Rate Limiting
rate:limit:{user_id}:{endpoint} -> counter (expires in 60s)

# Chat Context
chat:context:{session_id} -> {
    "messages": [...],
    "user_level": 3,
    "learning_style": "visual"
}

# Analytics Cache
analytics:dashboard:{user_id} -> cached_json (TTL: 5 minutes)

# Gamification
game:streak:{user_id} -> {
    "current": 9,
    "last_checkin": "2025-01-11T10:00:00Z"
}

# Real-time Leaderboard (Sorted Set)
leaderboard:week:2025-02 -> [
    (user_id_1, 850),
    (user_id_2, 780),
    ...
]
```

---

## AI/LLM Integration

### RAG Pipeline Architecture

```
Document Upload → Processing Pipeline → Vector Store → Retrieval
                        │
                        ▼
              ┌─────────────────┐
              │  Text Extraction │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  Chunking       │
              │  (512 tokens)   │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  Embedding      │
              │  Generation     │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  Vector Store   │
              │  (ChromaDB)     │
              └─────────────────┘

Query Flow:
User Query → Embedding → Vector Search → Reranking → Context
                                             │
                                             ▼
                                    LLM + Context → Response
```

### LLM Service Integration

```python
class CodexLLMService:
    def __init__(self):
        self.client = CodexClient()  # OAuth authenticated
        self.model_router = ModelRouter()

    async def generate_response(
        self,
        prompt: str,
        context: Optional[str] = None,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        # Route to appropriate model
        model = self.model_router.select_model(prompt)

        # Build enhanced prompt with context
        enhanced_prompt = self.build_prompt(prompt, context)

        if stream:
            return self.stream_response(enhanced_prompt, model)
        else:
            return await self.get_response(enhanced_prompt, model)

    async def stream_response(
        self,
        prompt: str,
        model: str
    ) -> AsyncGenerator[str, None]:
        async for chunk in self.client.stream(
            prompt=prompt,
            model=model,
            temperature=0.7
        ):
            yield chunk
```

---

## Security Architecture

### Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │   API    │      │Database  │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                  │
     │  POST /login    │                  │
     │────────────────>│                  │
     │                 │  Verify password │
     │                 │─────────────────>│
     │                 │                  │
     │                 │  Create tokens   │
     │                 │<─────────────────│
     │  Access+Refresh │                  │
     │<────────────────│                  │
     │                 │                  │
     │  API Request    │                  │
     │  Bearer: token  │                  │
     │────────────────>│                  │
     │                 │  Validate JWT    │
     │                 │─────────────────>│
     │                 │                  │
     │   Response      │                  │
     │<────────────────│                  │
```

### Security Layers

1. **Network Security**
   - TLS 1.3 encryption
   - Certificate pinning
   - DDoS protection

2. **Application Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

3. **Data Security**
   - Encryption at rest (AES-256)
   - Encrypted backups
   - Secure key management

4. **Access Control**
   - Role-based access (RBAC)
   - Resource-level permissions
   - API key management

---

## Infrastructure

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres/studyin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - chromadb
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --reload --host 0.0.0.0

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=studyin
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  chroma_data:
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────┐
│                   CloudFlare CDN                    │
│         (DDoS Protection, Caching, SSL)             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                 Load Balancer (AWS ALB)             │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Backend    │ │   Backend    │ │   Backend    │
│   Instance   │ │   Instance   │ │   Instance   │
│   (ECS)      │ │   (ECS)      │ │   (ECS)      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │   ChromaDB   │
│   (RDS)      │ │ (ElastiCache)│ │   (EC2)      │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: studyin-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: studyin/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Monitoring & Observability

### Metrics Collection

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Business metrics
questions_generated = Counter(
    'questions_generated_total',
    'Total questions generated',
    ['topic', 'difficulty']
)

active_users = Gauge(
    'active_users',
    'Currently active users'
)

# WebSocket metrics
ws_connections = Gauge(
    'websocket_connections',
    'Active WebSocket connections'
)
```

### Logging Strategy

```python
import structlog

logger = structlog.get_logger()

# Structured logging
logger.info(
    "user_action",
    user_id=user_id,
    action="generate_question",
    topic=topic,
    difficulty=difficulty,
    duration_ms=duration
)

# Error tracking
logger.error(
    "api_error",
    user_id=user_id,
    endpoint=endpoint,
    error_code=error_code,
    error_message=str(error),
    traceback=traceback.format_exc()
)
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Proper indexing
   - Partitioning for large tables

2. **Caching Strategy**
   - Redis for session data
   - CDN for static assets
   - Application-level caching
   - Database query caching

3. **Async Processing**
   - Background job queues
   - Async API endpoints
   - Non-blocking I/O
   - Event-driven architecture

4. **Frontend Performance**
   - Code splitting
   - Lazy loading
   - Service workers
   - Image optimization

---

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups with 30-day retention
- **File Storage**: Replicated across multiple regions
- **Configuration**: Version controlled in Git

### Recovery Procedures
1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 24 hours
3. **Failover**: Automated with health checks
4. **Rollback**: Blue-green deployment support

---

## Future Considerations

### Planned Enhancements
1. **Microservices Migration**: Break monolith into services
2. **GraphQL Gateway**: Unified API interface
3. **Event Sourcing**: Complete audit trail
4. **ML Pipeline**: Custom model training
5. **Multi-region**: Global deployment

### Scalability Path
- Horizontal scaling via Kubernetes
- Database sharding for user data
- Separate read/write databases
- Asynchronous processing with queues
- Edge computing for real-time features

---

## Conclusion

StudyIn's architecture is designed to be:
- **Scalable**: Handle growth from hundreds to millions of users
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple layers of protection
- **Performant**: Optimized at every layer
- **Reliable**: Built-in redundancy and failover

The architecture supports rapid iteration while maintaining stability and performance for medical students who depend on the platform for their education.