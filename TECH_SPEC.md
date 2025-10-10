# Technical Specification Sheet
# StudyIn - Gamified Medical Learning Platform

> **Reference Document**: Detailed technical specifications for implementation

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Planning Phase
**Related Docs**: PRD.md, DESIGN_SYSTEM.md, PHASES.md

---

## Quick Reference

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend Framework | Next.js | 15.x | App Router, Server Components |
| Frontend UI | React | 19.x | UI library |
| Frontend Language | TypeScript | 5.x | Type safety |
| Frontend Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Frontend Components | shadcn/ui | latest | Component library |
| State Management | Zustand | 4.x | Client state |
| Data Fetching | TanStack Query | 5.x | Server state, caching |
| WebSocket Client | Socket.io Client | 4.x | Real-time communication |
| Animations | Framer Motion | 11.x | UI animations |
| Charts | Recharts | 2.x | Analytics visualizations |
| Backend Framework | FastAPI | 0.110+ | Async Python web framework |
| Backend Language | Python | 3.11+ | Programming language |
| ORM | SQLAlchemy | 2.0+ | Database abstraction (async) |
| Migrations | Alembic | 1.13+ | Schema migrations |
| Configuration | Pydantic Settings | 2.x | Dynamic config management |
| Database (Primary) | PostgreSQL | 16+ | Relational database |
| Vector Extension | pgvector | 0.5+ | Vector embeddings |
| Cache/Jobs | Redis | 7.x | Caching + background jobs |
| Vector DB (Optional) | Qdrant | 1.7+ | Dedicated vector search |
| LLM Integration | Codex CLI | latest | AI coach, question generation |
| Embeddings | OpenAI (via Codex) | text-embedding-3-small | Vector embeddings |

---

## Frontend Technical Specification

### 1. Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # Register page
│   │   │   └── layout.tsx            # Auth layout
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Main dashboard
│   │   │   ├── study/
│   │   │   │   └── page.tsx          # Study session
│   │   │   ├── quiz/
│   │   │   │   └── page.tsx          # Quiz interface
│   │   │   ├── progress/
│   │   │   │   └── page.tsx          # Analytics
│   │   │   └── layout.tsx            # Dashboard layout
│   │   ├── api/                      # API routes (if needed)
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── gamification/             # Gamification components
│   │   │   ├── PixelMascot.tsx
│   │   │   ├── XPBar.tsx
│   │   │   ├── StreakCounter.tsx
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── LevelDisplay.tsx
│   │   ├── quiz/                     # Quiz components
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── OptionButton.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── Explanation.tsx
│   │   │   └── QuizSummary.tsx
│   │   ├── chat/                     # AI Coach components
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── StreamingResponse.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── skill-tree/               # Learning path components
│   │   │   ├── SkillTreeCanvas.tsx
│   │   │   ├── SkillNode.tsx
│   │   │   └── ConnectionLine.tsx
│   │   └── layout/                   # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── api/                      # API client
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── auth.ts               # Auth endpoints
│   │   │   ├── quiz.ts               # Quiz endpoints
│   │   │   ├── progress.ts           # Progress endpoints
│   │   │   └── documents.ts          # Document endpoints
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useQuiz.ts
│   │   │   └── useProgress.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── cn.ts                 # Class name merger
│   │   │   ├── format.ts             # Formatters
│   │   │   ├── validation.ts         # Form validation
│   │   │   └── constants.ts          # Constants
│   │   └── config.ts                 # Dynamic configuration
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts              # Auth state
│   │   ├── quizStore.ts              # Quiz state
│   │   └── uiStore.ts                # UI state (theme, etc.)
│   │
│   ├── styles/
│   │   └── globals.css               # Global styles + Tailwind
│   │
│   └── types/
│       ├── api.ts                    # API response types
│       ├── quiz.ts                   # Quiz types
│       └── user.ts                   # User types
│
├── public/
│   ├── pixel-art/                    # Pixel art assets
│   │   ├── mascot/
│   │   ├── badges/
│   │   └── icons/
│   └── fonts/                        # Custom fonts
│
├── __tests__/                        # Tests
│   ├── components/
│   ├── pages/
│   └── utils/
│
├── .env.local                        # Environment variables
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

---

### 2. Dynamic Configuration

**File**: `src/lib/config.ts`

```typescript
// All configuration loaded from environment variables

interface Config {
  // API
  apiUrl: string;
  wsUrl: string;

  // Features
  features: {
    gamification: boolean;
    aiCoach: boolean;
    darkMode: boolean;
  };

  // Theme
  theme: {
    primaryColor: string;
    accentColor: string;
  };

  // Limits
  limits: {
    maxUploadSize: number;
    questionsPerSession: number;
    dailyGoal: number;
  };
}

export const config: Config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',

  features: {
    gamification: process.env.NEXT_PUBLIC_ENABLE_GAMIFICATION !== 'false',
    aiCoach: process.env.NEXT_PUBLIC_ENABLE_AI_COACH !== 'false',
    darkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  },

  theme: {
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#FF6B9D',
    accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#4A90E2',
  },

  limits: {
    maxUploadSize: parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE || '52428800'), // 50MB
    questionsPerSession: parseInt(process.env.NEXT_PUBLIC_QUESTIONS_PER_SESSION || '20'),
    dailyGoal: parseInt(process.env.NEXT_PUBLIC_DAILY_GOAL || '30'), // minutes
  },
};
```

**.env.local**:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Feature Flags
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_AI_COACH=true
NEXT_PUBLIC_ENABLE_DARK_MODE=false

# Theme
NEXT_PUBLIC_PRIMARY_COLOR=#FF6B9D
NEXT_PUBLIC_ACCENT_COLOR=#4A90E2

# Limits
NEXT_PUBLIC_MAX_UPLOAD_SIZE=52428800
NEXT_PUBLIC_QUESTIONS_PER_SESSION=20
NEXT_PUBLIC_DAILY_GOAL=30
```

---

### 3. State Management

**Auth Store** (`stores/authStore.ts`):

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
```

**Quiz Store** (`stores/quizStore.ts`):

```typescript
import { create } from 'zustand';

interface Question {
  id: string;
  vignette: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  confidenceRatings: (number | null)[];
  startTime: Date | null;
  endTime: Date | null;

  // Actions
  loadQuestions: (questions: Question[]) => void;
  answerQuestion: (index: number, answerIndex: number, confidence: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  questions: [],
  currentIndex: 0,
  answers: [],
  confidenceRatings: [],
  startTime: null,
  endTime: null,

  loadQuestions: (questions) => set({
    questions,
    answers: new Array(questions.length).fill(null),
    confidenceRatings: new Array(questions.length).fill(null),
    currentIndex: 0,
    startTime: new Date(),
  }),

  answerQuestion: (index, answerIndex, confidence) => set((state) => {
    const newAnswers = [...state.answers];
    const newRatings = [...state.confidenceRatings];
    newAnswers[index] = answerIndex;
    newRatings[index] = confidence;
    return { answers: newAnswers, confidenceRatings: newRatings };
  }),

  nextQuestion: () => set((state) => ({
    currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
  })),

  previousQuestion: () => set((state) => ({
    currentIndex: Math.max(state.currentIndex - 1, 0),
  })),

  finishQuiz: () => set({ endTime: new Date() }),

  reset: () => set({
    questions: [],
    currentIndex: 0,
    answers: [],
    confidenceRatings: [],
    startTime: null,
    endTime: null,
  }),
}));
```

---

### 4. API Client

**File**: `lib/api/client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { useAuthStore } from '@/stores/authStore';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**API Endpoints** (`lib/api/auth.ts`):

```typescript
import { apiClient } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    level: number;
    xp: number;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
```

---

### 5. WebSocket Integration

**Hook**: `lib/hooks/useWebSocket.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { useAuthStore } from '@/stores/authStore';

interface UseWebSocketOptions {
  onMessage?: (message: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    const socket = io(config.wsUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('message', (data: string) => {
      options.onMessage?.(data);
    });

    socket.on('error', (error: Error) => {
      options.onError?.(error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const sendMessage = (message: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message', message);
    }
  };

  return { isConnected, sendMessage };
};
```

---

## Backend Technical Specification

### 1. Project Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI app entry point
│   ├── config.py                     # Pydantic Settings (dynamic config)
│   │
│   ├── api/                          # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                   # Dependencies (auth, db)
│   │   ├── auth.py                   # Auth endpoints
│   │   ├── users.py                  # User endpoints
│   │   ├── documents.py              # Document upload/management
│   │   ├── quiz.py                   # Quiz endpoints
│   │   ├── progress.py               # Progress tracking
│   │   ├── chat.py                   # WebSocket chat
│   │   └── analytics.py              # Analytics endpoints
│   │
│   ├── core/                         # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py               # JWT, password hashing
│   │   ├── cache.py                  # Redis caching
│   │   └── exceptions.py             # Custom exceptions
│   │
│   ├── db/                           # Database
│   │   ├── __init__.py
│   │   ├── session.py                # Async session management
│   │   ├── base.py                   # Base model
│   │   └── init_db.py                # Database initialization
│   │
│   ├── models/                       # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py                   # User model
│   │   ├── material.py               # Study material model
│   │   ├── question.py               # Question model
│   │   ├── progress.py               # Progress tracking model
│   │   └── achievement.py            # Achievement model
│   │
│   ├── schemas/                      # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py                   # User schemas
│   │   ├── material.py               # Material schemas
│   │   ├── question.py               # Question schemas
│   │   └── progress.py               # Progress schemas
│   │
│   ├── repositories/                 # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py                   # Base repository
│   │   ├── user.py                   # User repository
│   │   ├── material.py               # Material repository
│   │   ├── question.py               # Question repository
│   │   └── progress.py               # Progress repository
│   │
│   ├── services/                     # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py                   # Auth service
│   │   ├── document_processor.py    # Document processing
│   │   ├── embedder.py               # Embedding generation
│   │   ├── question_generator.py    # MCQ generation
│   │   ├── sm2.py                    # SM-2 algorithm
│   │   ├── xp_calculator.py          # XP and leveling logic
│   │   └── ai_coach/                 # AI coach module
│   │       ├── __init__.py
│   │       ├── coach.py              # Main coach logic
│   │       ├── rag.py                # RAG pipeline
│   │       └── prompts.py            # Prompt templates
│   │
│   ├── workers/                      # Background workers
│   │   ├── __init__.py
│   │   ├── document_worker.py        # Process documents
│   │   ├── embedding_worker.py       # Generate embeddings
│   │   └── question_worker.py        # Generate questions
│   │
│   └── utils/                        # Utility functions
│       ├── __init__.py
│       ├── file_parser.py            # PDF/DOCX parsing
│       ├── chunker.py                # Semantic chunking
│       └── validators.py             # Input validation
│
├── alembic/                          # Database migrations
│   ├── versions/
│   │   └── 001_initial.py
│   └── env.py
│
├── tests/                            # Tests
│   ├── api/
│   ├── services/
│   └── utils/
│
├── .env                              # Environment variables
├── requirements.txt                  # Python dependencies
├── alembic.ini                       # Alembic configuration
└── pytest.ini                        # Pytest configuration
```

---

### 2. Dynamic Configuration

**File**: `app/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """
    All settings loaded from environment variables.
    No hardcoded values!
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

    # App
    APP_NAME: str = "StudyIn"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str  # Required from env
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    # Security
    SECRET_KEY: str  # Required from env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    BCRYPT_ROUNDS: int = 12

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # File Upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".png", ".jpg"]
    UPLOAD_DIR: str = "./uploads"

    # Codex CLI (OAuth, no API keys)
    CODEX_MODEL: str = "claude-3-5-sonnet-20241022"
    CODEX_MAX_TOKENS: int = 4096
    CODEX_TEMPERATURE: float = 0.7

    # Embeddings
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 128

    # Qdrant (optional)
    QDRANT_URL: Optional[str] = None
    QDRANT_COLLECTION: str = "studyin_chunks"

    # Gamification (dynamic, configurable)
    XP_PER_QUESTION: int = 10
    XP_BONUS_CORRECT: int = 5
    XP_PENALTY_INCORRECT: int = 0
    XP_STREAK_BONUS: int = 20  # Per day
    LEVEL_XP_BASE: int = 100
    LEVEL_XP_MULTIPLIER: float = 1.5

    # Spaced Repetition
    SM2_INITIAL_INTERVAL: int = 1  # days
    SM2_INITIAL_EF: float = 2.5
    SM2_MIN_EF: float = 1.3

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

settings = Settings()
```

**.env**:
```bash
# App
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://studyin_user:password@localhost:5432/studyin

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# File Upload
MAX_UPLOAD_SIZE=52428800
UPLOAD_DIR=./uploads

# Codex CLI
CODEX_MODEL=claude-3-5-sonnet-20241022
CODEX_MAX_TOKENS=4096
CODEX_TEMPERATURE=0.7

# Embeddings
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=512
CHUNK_OVERLAP=128

# Qdrant (optional)
# QDRANT_URL=http://localhost:6333

# Gamification
XP_PER_QUESTION=10
XP_BONUS_CORRECT=5
XP_STREAK_BONUS=20
```

---

### 3. Database Models

**User Model** (`models/user.py`):

```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)

    # Gamification
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    max_streak = Column(Integer, default=0, nullable=False)
    last_study_date = Column(DateTime, nullable=True)

    # Preferences
    daily_goal_minutes = Column(Integer, default=30, nullable=False)
    notifications_enabled = Column(Boolean, default=True)

    # Metadata
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    materials = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
```

**Material Model** (`models/material.py`):

```python
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base
import enum

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # File info
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String, nullable=False)

    # Metadata
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # JSON string

    # Processing
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_error = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)

    # Stats
    chunk_count = Column(Integer, default=0)
    question_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="materials")
    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="material", cascade="all, delete-orphan")
```

**Question Model** (`models/question.py`):

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=True)

    # Content
    vignette = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False)  # ["Option A", "Option B", ...]
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)

    # Metadata
    topic = Column(String, nullable=False)
    subtopic = Column(String, nullable=True)
    difficulty = Column(String, nullable=False)  # easy, medium, hard, nbme
    quality_score = Column(Float, default=0.0)

    # Flags
    is_verified = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)

    # Stats
    times_answered = Column(Integer, default=0)
    times_correct = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    material = relationship("Material", back_populates="questions")
    progress_entries = relationship("Progress", back_populates="question")
```

---

### 4. Services

**SM-2 Algorithm** (`services/sm2.py`):

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from app.config import settings

@dataclass
class SM2Result:
    interval: int  # days until next review
    easiness_factor: float  # updated EF
    repetition: int  # repetition count

class SM2Algorithm:
    """SuperMemo 2 spaced repetition algorithm"""

    @staticmethod
    def calculate_next_review(
        quality: int,  # 0-5 rating (0=complete blackout, 5=perfect)
        repetition: int,  # current repetition count
        easiness_factor: float,  # current EF
        interval: int  # current interval in days
    ) -> SM2Result:
        """
        Calculate next review date based on SM-2 algorithm.

        Args:
            quality: Response quality (0-5)
            repetition: Number of successful repetitions
            easiness_factor: Current ease factor
            interval: Current interval in days

        Returns:
            SM2Result with updated values
        """

        # Update easiness factor
        new_ef = max(
            settings.SM2_MIN_EF,
            easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        )

        # Update repetition and interval
        if quality >= 3:  # Correct answer
            if repetition == 0:
                new_interval = 1
            elif repetition == 1:
                new_interval = 6
            else:
                new_interval = round(interval * new_ef)
            new_repetition = repetition + 1
        else:  # Incorrect answer
            new_repetition = 0
            new_interval = 1

        return SM2Result(
            interval=new_interval,
            easiness_factor=new_ef,
            repetition=new_repetition
        )

    @staticmethod
    def get_next_review_date(interval: int) -> datetime:
        """Calculate next review date from interval"""
        return datetime.utcnow() + timedelta(days=interval)
```

**XP Calculator** (`services/xp_calculator.py`):

```python
from app.config import settings
import math

class XPCalculator:
    """Calculate XP and levels"""

    @staticmethod
    def calculate_question_xp(
        difficulty: str,
        is_correct: bool,
        confidence: int,  # 1-5
        time_taken_seconds: int
    ) -> int:
        """Calculate XP for answering a question"""

        # Base XP from config
        base_xp = settings.XP_PER_QUESTION

        # Difficulty multiplier
        difficulty_multipliers = {
            "easy": 1.0,
            "medium": 1.5,
            "hard": 2.0,
            "nbme": 2.5
        }
        base_xp *= difficulty_multipliers.get(difficulty, 1.0)

        # Correct answer bonus
        if is_correct:
            base_xp += settings.XP_BONUS_CORRECT

            # Confidence bonus (higher confidence = more bonus)
            confidence_bonus = (confidence - 3) * 2  # -4 to +4
            base_xp += max(0, confidence_bonus)
        else:
            # No penalty for incorrect, but no bonus
            pass

        # Time bonus (reward efficiency)
        # Optimal time: 90 seconds per question
        if time_taken_seconds < 90 and is_correct:
            time_bonus = 5
            base_xp += time_bonus

        return int(base_xp)

    @staticmethod
    def calculate_level_from_xp(xp: int) -> int:
        """Calculate level from total XP"""
        # Level formula: XP = BASE * (MULTIPLIER ^ (level - 1))
        # Inverse: level = log(XP / BASE) / log(MULTIPLIER) + 1

        if xp < settings.LEVEL_XP_BASE:
            return 1

        level = math.floor(
            math.log(xp / settings.LEVEL_XP_BASE) /
            math.log(settings.LEVEL_XP_MULTIPLIER)
        ) + 1

        return max(1, level)

    @staticmethod
    def calculate_xp_for_level(level: int) -> int:
        """Calculate total XP required to reach a level"""
        if level <= 1:
            return 0

        return int(
            settings.LEVEL_XP_BASE *
            (settings.LEVEL_XP_MULTIPLIER ** (level - 1))
        )

    @staticmethod
    def calculate_xp_to_next_level(current_xp: int, current_level: int) -> int:
        """Calculate XP needed for next level"""
        next_level_xp = XPCalculator.calculate_xp_for_level(current_level + 1)
        return next_level_xp - current_xp
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌────────────────┐
│    User      │1       *│    Material      │1       *│MaterialChunk   │
├──────────────┤────────┤──────────────────┤────────┤────────────────┤
│ id (PK)      │        │ id (PK)          │        │ id (PK)        │
│ email        │        │ user_id (FK)     │        │ material_id(FK)│
│ hashed_pw    │        │ filename         │        │ content        │
│ name         │        │ file_path        │        │ embedding      │
│ avatar_url   │        │ title            │        │ page_number    │
│ xp           │        │ topic            │        │ chunk_index    │
│ level        │        │ status           │        │ created_at     │
│ streak       │        │ created_at       │        └────────────────┘
│ created_at   │        └──────────────────┘
└──────────────┘                │
      │                         │1
      │                         │
      │1                        │
      │                         │*
      │                  ┌──────────────────┐
      │                  │    Question      │
      │                  ├──────────────────┤
      │                  │ id (PK)          │
      │                  │ material_id (FK) │
      │                  │ vignette         │
      │                  │ options (JSON)   │
      │                  │ correct_index    │
      │                  │ explanation      │
      │                  │ topic            │
      │                  │ difficulty       │
      │                  │ quality_score    │
      │                  │ created_at       │
      │                  └──────────────────┘
      │                         │
      │1                        │1
      │                         │
      │*                        │*
┌──────────────────┐    ┌──────────────────┐
│    Progress      │    │Achievement       │
├──────────────────┤    ├──────────────────┤
│ id (PK)          │    │ id (PK)          │
│ user_id (FK)     │    │ name             │
│ question_id (FK) │    │ description      │
│ answered_at      │    │ icon             │
│ is_correct       │    │ xp_reward        │
│ confidence       │    │ unlock_condition │
│ time_taken_sec   │    └──────────────────┘
│ xp_earned        │           │
│ sm2_interval     │           │*
│ sm2_ef           │           │
│ sm2_repetition   │           │*
│ next_review      │    ┌──────────────────┐
└──────────────────┘    │UserAchievement   │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ user_id (FK)     │
                        │ achievement_id(FK│
                        │ unlocked_at      │
                        └──────────────────┘
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/register         # Register new user
POST   /api/auth/login            # Login (get tokens)
POST   /api/auth/refresh          # Refresh access token
POST   /api/auth/logout           # Logout (invalidate token)
POST   /api/auth/forgot-password  # Request password reset
POST   /api/auth/reset-password   # Reset password with token
```

### Users

```
GET    /api/users/me              # Get current user
PATCH  /api/users/me              # Update current user
DELETE /api/users/me              # Delete account
GET    /api/users/me/stats        # Get user stats (XP, level, streak)
```

### Materials

```
GET    /api/materials             # List user's materials
POST   /api/materials             # Upload new material
GET    /api/materials/:id         # Get material details
PATCH  /api/materials/:id         # Update material metadata
DELETE /api/materials/:id         # Delete material
GET    /api/materials/:id/chunks  # Get material chunks
```

### Questions

```
GET    /api/questions             # List questions (filtered)
GET    /api/questions/:id         # Get question details
POST   /api/questions/generate    # Generate questions from material
PATCH  /api/questions/:id         # Update question (flagging, etc.)
DELETE /api/questions/:id         # Delete question
POST   /api/questions/:id/answer  # Submit answer (record progress)
```

### Quiz

```
POST   /api/quiz/session          # Create quiz session
GET    /api/quiz/session/:id      # Get session details
POST   /api/quiz/session/:id/submit  # Submit quiz session
GET    /api/quiz/due-reviews      # Get due reviews for today
```

### Progress

```
GET    /api/progress              # Get user progress
GET    /api/progress/topic/:topic # Get progress for specific topic
GET    /api/progress/analytics    # Get detailed analytics
POST   /api/progress/review       # Record review (SM-2 update)
```

### Chat (WebSocket)

```
WS     /ws/chat                   # WebSocket for AI coach chat
```

Events:
- Client → Server: `message` (user message)
- Server → Client: `message` (AI response, streaming)
- Server → Client: `typing` (typing indicator)
- Server → Client: `error` (error message)

---

## Deployment

### Frontend Deployment (Vercel)

**vercel.json**:
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_WS_URL": "@ws_url"
  }
}
```

### Backend Deployment (Railway)

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Monitoring & Observability

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])

# Business metrics
questions_answered = Counter('questions_answered_total', 'Total questions answered', ['topic', 'correct'])
xp_earned = Counter('xp_earned_total', 'Total XP earned')
active_users = Gauge('active_users', 'Number of active users')
```

### Logging

```python
import logging
import structlog

# Structured logging
logger = structlog.get_logger()

logger.info("user_logged_in", user_id=user.id, email=user.email)
logger.error("question_generation_failed", material_id=material.id, error=str(e))
```

---

## Security Checklist

- [ ] HTTPS only (TLS 1.3)
- [ ] JWT tokens with short expiry (15 min)
- [ ] Refresh token rotation
- [ ] bcrypt for password hashing (12 rounds)
- [ ] CORS configured properly
- [ ] Rate limiting (100 req/min per user)
- [ ] Input validation (Pydantic)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (CSP headers)
- [ ] CSRF protection (SameSite cookies)
- [ ] File upload validation (type, size)
- [ ] No secrets in code (use env vars)
- [ ] Error messages don't leak info
- [ ] Logging excludes sensitive data
- [ ] Database backups enabled
- [ ] Monitoring and alerting configured

---

## Changelog

### 2025-10-09 (v1.0)
- Initial technical specification
- Frontend structure and configuration
- Backend structure and configuration
- Database schema
- API endpoints
- Deployment specifications
- Security checklist

---

**Remember**: This is a living document. Update as implementation progresses and requirements change.
