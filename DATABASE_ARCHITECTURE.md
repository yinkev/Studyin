# Database Architecture - StudyIn
# Gamified Medical Learning Platform

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Planning Phase
**Related Docs**: TECH_SPEC.md, PRD.md, SECURITY_QUICK_FIXES.md

---

## Table of Contents

1. [Database Technology Selection](#database-technology-selection)
2. [Complete Schema Design](#complete-schema-design)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Indexing Strategy](#indexing-strategy)
5. [Partitioning Strategy](#partitioning-strategy)
6. [Migration Strategy](#migration-strategy)
7. [Data Retention & Archival](#data-retention--archival)
8. [Vector Database Design](#vector-database-design)
9. [Redis Caching Schema](#redis-caching-schema)
10. [Performance Optimization](#performance-optimization)
11. [Complete SQL DDL](#complete-sql-ddl)
12. [Seeding Data](#seeding-data)
13. [Scaling Considerations](#scaling-considerations)

---

## Database Technology Selection

### Primary Database: PostgreSQL 16+

**Why PostgreSQL?**

1. **ACID Compliance**: Medical learning data requires strong consistency and transactional integrity
2. **JSON Support**: JSONB for flexible storage of question options, metadata, and analytics
3. **pgvector Extension**: Native vector storage for embeddings (eliminates need for separate vector DB initially)
4. **Full-Text Search**: Built-in FTS for searching materials and questions
5. **Partitioning**: Native table partitioning for analytics and archival
6. **Advanced Indexing**: GIN, GiST, BRIN indexes for complex queries
7. **Mature Ecosystem**: Excellent Python support via SQLAlchemy, robust backup tools
8. **Scalability**: Read replicas, connection pooling, horizontal scaling with CitusDB if needed
9. **Cost**: Open-source, managed services available (Railway, Supabase, Render)

**Configuration**:
- Version: PostgreSQL 16+
- Extensions: pgvector 0.5+, pg_trgm (fuzzy search), uuid-ossp
- Connection Pool: 20 connections (configurable)
- Max Connections: 100

---

### Cache & Queue: Redis 7.x

**Why Redis?**

1. **Session Storage**: Fast session lookup for authentication
2. **Cache Layer**: Cache frequently accessed data (user stats, question banks)
3. **Rate Limiting**: Track API request counts per user
4. **Job Queue**: Background task queue for document processing
5. **Pub/Sub**: Real-time notifications (optional)
6. **Performance**: Sub-millisecond latency for cache hits

**Use Cases**:
- Session tokens (access tokens, temporary data)
- Cache query results (user dashboard stats)
- Rate limit counters
- Background job queues (document processing, question generation)
- Leaderboard data (optional future feature)

**Configuration**:
- Version: Redis 7.x
- Max Memory: 2GB (configurable)
- Eviction Policy: `allkeys-lru` (Least Recently Used)
- Persistence: AOF (Append-Only File) for job queue data

---

### Vector Database: pgvector (PostgreSQL Extension)

**Why pgvector over Qdrant/Weaviate?**

**Initial Phase (MVP)**:
- **Simplicity**: Single database to manage, no additional infrastructure
- **Cost**: No separate service required
- **Performance**: Adequate for <100K vectors with HNSW indexing
- **Integration**: Native PostgreSQL queries, no additional API calls

**Advantages**:
1. Unified database (no data synchronization issues)
2. ACID transactions for vector + metadata updates
3. Simple backup/restore (one database)
4. Lower operational complexity
5. Easy local development

**Scaling Path**:
- **Phase 1-2**: pgvector (up to 100K vectors)
- **Phase 3+**: Migrate to Qdrant if:
  - Vector count > 1M
  - Complex filtering requirements
  - Need for distributed vector search
  - Performance degradation observed

**Migration Strategy** (if needed later):
```python
# Easy migration from pgvector to Qdrant
# Vectors stored in same format (float array)
# Metadata in JSONB translates to Qdrant payload
```

---

## Complete Schema Design

### Schema Organization

```
studyin_db/
├── auth/           # Authentication tables
│   ├── users
│   ├── refresh_tokens
│   ├── email_verification_tokens
│   └── password_reset_tokens
│
├── materials/      # Study materials
│   ├── materials
│   ├── material_chunks
│   ├── material_processing_jobs
│   └── material_tags
│
├── questions/      # Question bank
│   ├── questions
│   ├── question_options
│   ├── question_explanations
│   └── user_question_attempts
│
├── practice/       # Practice sessions
│   ├── practice_sessions
│   └── practice_session_questions
│
├── ai_coach/       # AI Coach
│   ├── chat_conversations
│   ├── chat_messages
│   ├── learning_paths
│   └── learning_path_milestones
│
├── progress/       # Progress tracking
│   ├── user_progress
│   ├── mastery_levels
│   └── sm2_review_cards
│
├── gamification/   # Gamification
│   ├── achievements
│   ├── user_achievements
│   ├── xp_transactions
│   └── user_streaks
│
└── analytics/      # Analytics (partitioned)
    ├── study_sessions
    ├── performance_metrics
    └── retention_analytics
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core User Tables
    users ||--o{ refresh_tokens : has
    users ||--o{ email_verification_tokens : has
    users ||--o{ password_reset_tokens : has

    %% Materials
    users ||--o{ materials : uploads
    materials ||--o{ material_chunks : contains
    materials ||--o{ material_processing_jobs : tracks
    materials ||--o{ material_tags : tagged_with

    %% Questions
    materials ||--o{ questions : generates
    questions ||--o{ question_options : has
    questions ||--o{ question_explanations : explains
    users ||--o{ user_question_attempts : attempts
    questions ||--o{ user_question_attempts : answered_by

    %% Practice
    users ||--o{ practice_sessions : creates
    practice_sessions ||--o{ practice_session_questions : contains
    questions ||--o{ practice_session_questions : included_in

    %% AI Coach
    users ||--o{ chat_conversations : has
    chat_conversations ||--o{ chat_messages : contains
    users ||--o{ learning_paths : follows
    learning_paths ||--o{ learning_path_milestones : has

    %% Progress
    users ||--o{ user_progress : tracks
    questions ||--o{ user_progress : measured_by
    users ||--o{ mastery_levels : achieves
    users ||--o{ sm2_review_cards : reviews
    questions ||--o{ sm2_review_cards : scheduled_for

    %% Gamification
    users ||--o{ user_achievements : earns
    achievements ||--o{ user_achievements : awarded_to
    users ||--o{ xp_transactions : receives
    users ||--o{ user_streaks : maintains

    %% Analytics
    users ||--o{ study_sessions : logs
    users ||--o{ performance_metrics : generates
    users ||--o{ retention_analytics : tracks

    %% User Entity
    users {
        uuid id PK
        string email UK
        string hashed_password
        string name
        string avatar_url
        int xp
        int level
        int current_streak
        int max_streak
        timestamp last_study_date
        int daily_goal_minutes
        bool notifications_enabled
        bool is_active
        bool is_verified
        timestamp created_at
        timestamp updated_at
    }

    %% Auth Entities
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        uuid family_id
        uuid replaces FK
        bool is_revoked
        timestamp created_at
        timestamp expires_at
    }

    email_verification_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        bool is_used
        timestamp created_at
        timestamp expires_at
    }

    password_reset_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        bool is_used
        timestamp created_at
        timestamp expires_at
    }

    %% Material Entities
    materials {
        uuid id PK
        uuid user_id FK
        string filename
        string file_path
        int file_size
        string file_type
        string title
        text description
        string topic
        jsonb tags
        enum processing_status
        text processing_error
        timestamp processed_at
        int chunk_count
        int question_count
        timestamp created_at
        timestamp updated_at
    }

    material_chunks {
        uuid id PK
        uuid material_id FK
        text content
        vector embedding
        int page_number
        int chunk_index
        int char_start
        int char_end
        jsonb metadata
        timestamp created_at
    }

    material_processing_jobs {
        uuid id PK
        uuid material_id FK
        enum job_type
        enum status
        jsonb parameters
        jsonb result
        text error_message
        timestamp started_at
        timestamp completed_at
        timestamp created_at
    }

    material_tags {
        uuid id PK
        uuid material_id FK
        string tag
        string category
        float confidence
        bool is_auto_generated
        timestamp created_at
    }

    %% Question Entities
    questions {
        uuid id PK
        uuid material_id FK
        text vignette
        jsonb options
        int correct_index
        text explanation
        string topic
        string subtopic
        enum difficulty
        float quality_score
        bool is_verified
        bool is_flagged
        int times_answered
        int times_correct
        jsonb metadata
        timestamp created_at
    }

    question_options {
        uuid id PK
        uuid question_id FK
        int option_index
        text option_text
        text rationale
        timestamp created_at
    }

    question_explanations {
        uuid id PK
        uuid question_id FK
        text correct_explanation
        jsonb incorrect_explanations
        text pathophysiology
        text clinical_relevance
        jsonb references
        timestamp created_at
    }

    user_question_attempts {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        int selected_index
        bool is_correct
        int confidence_rating
        int time_taken_seconds
        enum attempt_type
        uuid session_id FK
        timestamp answered_at
    }

    %% Practice Entities
    practice_sessions {
        uuid id PK
        uuid user_id FK
        enum session_type
        jsonb settings
        int total_questions
        int correct_count
        int total_time_seconds
        int xp_earned
        enum status
        timestamp started_at
        timestamp completed_at
        timestamp created_at
    }

    practice_session_questions {
        uuid id PK
        uuid session_id FK
        uuid question_id FK
        int question_order
        bool is_correct
        int time_taken_seconds
        timestamp answered_at
    }

    %% AI Coach Entities
    chat_conversations {
        uuid id PK
        uuid user_id FK
        string title
        enum conversation_type
        jsonb metadata
        bool is_archived
        timestamp last_message_at
        timestamp created_at
    }

    chat_messages {
        uuid id PK
        uuid conversation_id FK
        enum role
        text content
        jsonb context
        jsonb citations
        int token_count
        float response_time_seconds
        timestamp created_at
    }

    learning_paths {
        uuid id PK
        uuid user_id FK
        string name
        text description
        jsonb topic_tree
        int total_milestones
        int completed_milestones
        enum status
        timestamp created_at
        timestamp updated_at
    }

    learning_path_milestones {
        uuid id PK
        uuid learning_path_id FK
        string topic
        int milestone_order
        jsonb prerequisites
        bool is_completed
        timestamp completed_at
        timestamp created_at
    }

    %% Progress Entities
    user_progress {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        int total_attempts
        int correct_attempts
        float accuracy_rate
        float avg_confidence
        float avg_time_seconds
        timestamp last_attempt_at
        timestamp created_at
        timestamp updated_at
    }

    mastery_levels {
        uuid id PK
        uuid user_id FK
        string topic
        int questions_answered
        int questions_correct
        float mastery_percentage
        enum proficiency_level
        timestamp last_updated
    }

    sm2_review_cards {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        int repetition_count
        float easiness_factor
        int interval_days
        timestamp next_review_date
        bool is_due
        timestamp last_reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    %% Gamification Entities
    achievements {
        uuid id PK
        string code UK
        string name
        text description
        string icon
        enum category
        int xp_reward
        jsonb unlock_conditions
        enum rarity
        bool is_active
        timestamp created_at
    }

    user_achievements {
        uuid id PK
        uuid user_id FK
        uuid achievement_id FK
        int progress
        bool is_completed
        timestamp unlocked_at
        timestamp created_at
    }

    xp_transactions {
        uuid id PK
        uuid user_id FK
        int amount
        enum source
        string description
        jsonb metadata
        timestamp created_at
    }

    user_streaks {
        uuid id PK
        uuid user_id FK
        date streak_date
        bool is_frozen
        int questions_answered
        int study_minutes
        timestamp created_at
    }

    %% Analytics Entities (Partitioned by month)
    study_sessions {
        uuid id PK
        uuid user_id FK
        enum session_type
        int duration_seconds
        int questions_answered
        int xp_earned
        jsonb activity_data
        timestamp started_at
        timestamp ended_at
        timestamp created_at
    }

    performance_metrics {
        uuid id PK
        uuid user_id FK
        date metric_date
        string topic
        int questions_attempted
        float accuracy_rate
        float avg_time_per_question
        int xp_earned
        jsonb detailed_metrics
        timestamp created_at
    }

    retention_analytics {
        uuid id PK
        uuid user_id FK
        date retention_date
        int cards_reviewed
        int cards_correct
        float retention_rate
        jsonb topic_breakdown
        timestamp created_at
    }
```

---

## Complete SQL DDL

### 1. Auth Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),

    -- Gamification
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    last_study_date TIMESTAMP WITH TIME ZONE,

    -- Preferences
    daily_goal_minutes INTEGER NOT NULL DEFAULT 30,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT positive_xp CHECK (xp >= 0),
    CONSTRAINT positive_level CHECK (level >= 1),
    CONSTRAINT valid_daily_goal CHECK (daily_goal_minutes > 0 AND daily_goal_minutes <= 480)
);

-- Refresh tokens table (with family tracking for security)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash
    family_id UUID NOT NULL, -- Track token lineage
    replaces UUID REFERENCES refresh_tokens(id), -- Previous token in family
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);
```

### 2. Materials Schema

```sql
-- Processing status enum
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- File info
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,

    -- Metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    topic VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,

    -- Processing
    processing_status processing_status NOT NULL DEFAULT 'pending',
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Stats
    chunk_count INTEGER NOT NULL DEFAULT 0,
    question_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT positive_counts CHECK (chunk_count >= 0 AND question_count >= 0)
);

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Material chunks table (with embeddings)
CREATE TABLE material_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension

    -- Location
    page_number INTEGER,
    chunk_index INTEGER NOT NULL,
    char_start INTEGER NOT NULL,
    char_end INTEGER NOT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_chunk_range CHECK (char_end > char_start),
    CONSTRAINT positive_chunk_index CHECK (chunk_index >= 0)
);

-- Job type enum
CREATE TYPE job_type AS ENUM ('parse', 'embed', 'generate_questions', 'analyze');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Material processing jobs
CREATE TABLE material_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,

    job_type job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',

    parameters JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,

    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Material tags
CREATE TABLE material_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,

    tag VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- e.g., 'topic', 'difficulty', 'organ_system'
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    is_auto_generated BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_material_tag UNIQUE (material_id, tag)
);
```

### 3. Questions Schema

```sql
-- Difficulty enum
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'nbme');

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,

    -- Content
    vignette TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of option strings
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,

    -- Metadata
    topic VARCHAR(255) NOT NULL,
    subtopic VARCHAR(255),
    difficulty difficulty_level NOT NULL,
    quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),

    -- Flags
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_flagged BOOLEAN NOT NULL DEFAULT false,

    -- Stats
    times_answered INTEGER NOT NULL DEFAULT 0,
    times_correct INTEGER NOT NULL DEFAULT 0,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_correct_index CHECK (correct_index >= 0),
    CONSTRAINT valid_stats CHECK (times_correct <= times_answered),
    CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2)
);

-- Question options (normalized for better explanations)
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    option_index INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    rationale TEXT, -- Why this option is correct/incorrect

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_question_option UNIQUE (question_id, option_index),
    CONSTRAINT positive_option_index CHECK (option_index >= 0)
);

-- Question explanations (detailed explanations)
CREATE TABLE question_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    correct_explanation TEXT NOT NULL,
    incorrect_explanations JSONB DEFAULT '{}'::jsonb, -- Keyed by option index
    pathophysiology TEXT,
    clinical_relevance TEXT,
    references JSONB DEFAULT '[]'::jsonb, -- Citations

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_question_explanation UNIQUE (question_id)
);

-- Attempt type enum
CREATE TYPE attempt_type AS ENUM ('practice', 'review', 'test');

-- User question attempts
CREATE TABLE user_question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    selected_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 5),
    time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds >= 0),

    attempt_type attempt_type NOT NULL,
    session_id UUID, -- References practice_sessions or study_sessions

    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 4. Practice Schema

```sql
-- Session type enum
CREATE TYPE session_type AS ENUM ('timed', 'tutor', 'review', 'test');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed', 'abandoned');

-- Practice sessions
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_type session_type NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb, -- Timer settings, filters, etc.

    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,

    status session_status NOT NULL DEFAULT 'active',

    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_counts CHECK (correct_count <= total_questions),
    CONSTRAINT valid_xp CHECK (xp_earned >= 0)
);

-- Practice session questions (many-to-many)
CREATE TABLE practice_session_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    question_order INTEGER NOT NULL,
    is_correct BOOLEAN,
    time_taken_seconds INTEGER,

    answered_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_session_question UNIQUE (session_id, question_id),
    CONSTRAINT positive_question_order CHECK (question_order > 0)
);
```

### 5. AI Coach Schema

```sql
-- Conversation type enum
CREATE TYPE conversation_type AS ENUM ('teaching', 'review', 'exploration', 'clarification');

-- Chat conversations
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(500),
    conversation_type conversation_type NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    is_archived BOOLEAN NOT NULL DEFAULT false,

    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Message role enum
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,

    role message_role NOT NULL,
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb, -- RAG context, retrieved chunks
    citations JSONB DEFAULT '[]'::jsonb, -- Source citations

    token_count INTEGER,
    response_time_seconds FLOAT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Learning path status enum
CREATE TYPE learning_path_status AS ENUM ('active', 'paused', 'completed');

-- Learning paths
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(500) NOT NULL,
    description TEXT,
    topic_tree JSONB NOT NULL, -- DAG of topics and prerequisites

    total_milestones INTEGER NOT NULL DEFAULT 0,
    completed_milestones INTEGER NOT NULL DEFAULT 0,

    status learning_path_status NOT NULL DEFAULT 'active',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_milestone_count CHECK (completed_milestones <= total_milestones)
);

-- Learning path milestones
CREATE TABLE learning_path_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,

    topic VARCHAR(255) NOT NULL,
    milestone_order INTEGER NOT NULL,
    prerequisites JSONB DEFAULT '[]'::jsonb, -- Array of prerequisite milestone IDs

    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_path_milestone UNIQUE (learning_path_id, topic),
    CONSTRAINT positive_milestone_order CHECK (milestone_order > 0)
);
```

### 6. Progress Schema

```sql
-- User progress (aggregate per question)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    accuracy_rate FLOAT GENERATED ALWAYS AS (
        CASE WHEN total_attempts > 0
        THEN correct_attempts::float / total_attempts::float
        ELSE 0 END
    ) STORED,

    avg_confidence FLOAT,
    avg_time_seconds FLOAT,

    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_question_progress UNIQUE (user_id, question_id),
    CONSTRAINT valid_attempts CHECK (correct_attempts <= total_attempts)
);

-- Proficiency level enum
CREATE TYPE proficiency_level AS ENUM ('novice', 'beginner', 'intermediate', 'advanced', 'expert');

-- Mastery levels (aggregate per topic)
CREATE TABLE mastery_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    topic VARCHAR(255) NOT NULL,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    mastery_percentage FLOAT GENERATED ALWAYS AS (
        CASE WHEN questions_answered > 0
        THEN (questions_correct::float / questions_answered::float) * 100
        ELSE 0 END
    ) STORED,

    proficiency_level proficiency_level NOT NULL DEFAULT 'novice',

    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_topic_mastery UNIQUE (user_id, topic),
    CONSTRAINT valid_mastery_counts CHECK (questions_correct <= questions_answered)
);

-- SM-2 review cards
CREATE TABLE sm2_review_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    repetition_count INTEGER NOT NULL DEFAULT 0,
    easiness_factor FLOAT NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,

    next_review_date DATE NOT NULL,
    is_due BOOLEAN GENERATED ALWAYS AS (next_review_date <= CURRENT_DATE) STORED,

    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_question_card UNIQUE (user_id, question_id),
    CONSTRAINT valid_easiness_factor CHECK (easiness_factor >= 1.3),
    CONSTRAINT positive_interval CHECK (interval_days > 0)
);
```

### 7. Gamification Schema

```sql
-- Achievement category and rarity enums
CREATE TYPE achievement_category AS ENUM ('milestone', 'streak', 'mastery', 'speed', 'consistency', 'special');
CREATE TYPE achievement_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'first_question', 'streak_7'

    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(500), -- Icon URL or emoji

    category achievement_category NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,

    unlock_conditions JSONB NOT NULL, -- Conditions to unlock
    rarity achievement_rarity NOT NULL DEFAULT 'common',

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT positive_xp_reward CHECK (xp_reward >= 0)
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

    progress INTEGER NOT NULL DEFAULT 0, -- Progress towards unlock condition
    is_completed BOOLEAN NOT NULL DEFAULT false,

    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- XP source enum
CREATE TYPE xp_source AS ENUM (
    'question_answered',
    'streak_bonus',
    'achievement_unlock',
    'milestone_complete',
    'review_complete',
    'daily_goal_met'
);

-- XP transactions (ledger pattern)
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount INTEGER NOT NULL, -- Can be negative (future: penalties)
    source xp_source NOT NULL,
    description TEXT,

    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User streaks (one record per day)
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    streak_date DATE NOT NULL,
    is_frozen BOOLEAN NOT NULL DEFAULT false, -- Streak freeze used

    questions_answered INTEGER NOT NULL DEFAULT 0,
    study_minutes INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_streak_date UNIQUE (user_id, streak_date),
    CONSTRAINT positive_counts CHECK (questions_answered >= 0 AND study_minutes >= 0)
);
```

### 8. Analytics Schema (Partitioned)

```sql
-- Study sessions (partitioned by month)
CREATE TABLE study_sessions (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_type session_type NOT NULL,
    duration_seconds INTEGER NOT NULL,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,

    activity_data JSONB DEFAULT '{}'::jsonb,

    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for study_sessions (example: 2025)
CREATE TABLE study_sessions_2025_01 PARTITION OF study_sessions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE study_sessions_2025_02 PARTITION OF study_sessions
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Future partitions created automatically by maintenance script

-- Performance metrics (partitioned by month)
CREATE TABLE performance_metrics (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    metric_date DATE NOT NULL,
    topic VARCHAR(255),

    questions_attempted INTEGER NOT NULL DEFAULT 0,
    accuracy_rate FLOAT,
    avg_time_per_question FLOAT,
    xp_earned INTEGER NOT NULL DEFAULT 0,

    detailed_metrics JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for performance_metrics
CREATE TABLE performance_metrics_2025_01 PARTITION OF performance_metrics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE performance_metrics_2025_02 PARTITION OF performance_metrics
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Retention analytics (partitioned by month)
CREATE TABLE retention_analytics (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    retention_date DATE NOT NULL,
    cards_reviewed INTEGER NOT NULL DEFAULT 0,
    cards_correct INTEGER NOT NULL DEFAULT 0,
    retention_rate FLOAT,

    topic_breakdown JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for retention_analytics
CREATE TABLE retention_analytics_2025_01 PARTITION OF retention_analytics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE retention_analytics_2025_02 PARTITION OF retention_analytics
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

---

## Indexing Strategy

### Primary Indexes (Created with Tables)

All primary keys automatically get B-tree indexes.

### Performance Indexes

```sql
-- ============================================================================
-- AUTH INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email); -- Login lookup
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true; -- Active users
CREATE INDEX idx_users_verified ON users(is_verified) WHERE is_verified = true; -- Verified users
CREATE INDEX idx_users_last_study ON users(last_study_date DESC) WHERE last_study_date IS NOT NULL; -- Recent activity

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id) WHERE is_revoked = false;
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at) WHERE is_revoked = false;

-- Email verification
CREATE INDEX idx_email_verification_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_expires ON email_verification_tokens(expires_at) WHERE is_used = false;

-- Password reset
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at) WHERE is_used = false;

-- ============================================================================
-- MATERIALS INDEXES
-- ============================================================================

-- Materials
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_status ON materials(processing_status) WHERE processing_status != 'completed';
CREATE INDEX idx_materials_topic ON materials(topic) WHERE topic IS NOT NULL;
CREATE INDEX idx_materials_created ON materials(created_at DESC);

-- GIN index for JSONB tags
CREATE INDEX idx_materials_tags ON materials USING GIN (tags);

-- Full-text search on title and description
CREATE INDEX idx_materials_search ON materials USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Material chunks
CREATE INDEX idx_chunks_material_id ON material_chunks(material_id);
CREATE INDEX idx_chunks_page_number ON material_chunks(page_number) WHERE page_number IS NOT NULL;

-- HNSW index for vector similarity search (pgvector)
CREATE INDEX idx_chunks_embedding ON material_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (faster build, slower queries)
-- CREATE INDEX idx_chunks_embedding ON material_chunks
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);

-- Full-text search on chunk content
CREATE INDEX idx_chunks_content_search ON material_chunks USING GIN (
    to_tsvector('english', content)
);

-- Processing jobs
CREATE INDEX idx_jobs_material_id ON material_processing_jobs(material_id);
CREATE INDEX idx_jobs_status ON material_processing_jobs(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_jobs_type ON material_processing_jobs(job_type);

-- Material tags
CREATE INDEX idx_tags_material_id ON material_tags(material_id);
CREATE INDEX idx_tags_tag ON material_tags(tag);
CREATE INDEX idx_tags_category ON material_tags(category) WHERE category IS NOT NULL;

-- ============================================================================
-- QUESTIONS INDEXES
-- ============================================================================

-- Questions
CREATE INDEX idx_questions_material_id ON questions(material_id) WHERE material_id IS NOT NULL;
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_verified ON questions(is_verified) WHERE is_verified = true;
CREATE INDEX idx_questions_flagged ON questions(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_questions_quality ON questions(quality_score DESC) WHERE quality_score > 0.7;

-- Composite index for question filtering
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty);

-- Full-text search on vignette
CREATE INDEX idx_questions_vignette_search ON questions USING GIN (
    to_tsvector('english', vignette)
);

-- Question options
CREATE INDEX idx_options_question_id ON question_options(question_id);

-- Question explanations
CREATE INDEX idx_explanations_question_id ON question_explanations(question_id);

-- User question attempts
CREATE INDEX idx_attempts_user_id ON user_question_attempts(user_id);
CREATE INDEX idx_attempts_question_id ON user_question_attempts(question_id);
CREATE INDEX idx_attempts_session_id ON user_question_attempts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_attempts_answered_at ON user_question_attempts(answered_at DESC);

-- Composite index for user question history
CREATE INDEX idx_attempts_user_question ON user_question_attempts(user_id, question_id, answered_at DESC);

-- ============================================================================
-- PRACTICE INDEXES
-- ============================================================================

-- Practice sessions
CREATE INDEX idx_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_sessions_status ON practice_sessions(status) WHERE status IN ('active', 'paused');
CREATE INDEX idx_sessions_started_at ON practice_sessions(started_at DESC);
CREATE INDEX idx_sessions_type ON practice_sessions(session_type);

-- Practice session questions
CREATE INDEX idx_session_questions_session_id ON practice_session_questions(session_id);
CREATE INDEX idx_session_questions_question_id ON practice_session_questions(question_id);

-- ============================================================================
-- AI COACH INDEXES
-- ============================================================================

-- Chat conversations
CREATE INDEX idx_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_conversations_type ON chat_conversations(conversation_type);
CREATE INDEX idx_conversations_last_message ON chat_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_archived ON chat_conversations(is_archived) WHERE is_archived = false;

-- Chat messages
CREATE INDEX idx_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_messages_role ON chat_messages(role);

-- Full-text search on message content
CREATE INDEX idx_messages_content_search ON chat_messages USING GIN (
    to_tsvector('english', content)
);

-- Learning paths
CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status) WHERE status = 'active';

-- Learning path milestones
CREATE INDEX idx_milestones_path_id ON learning_path_milestones(learning_path_id);
CREATE INDEX idx_milestones_completed ON learning_path_milestones(is_completed);
CREATE INDEX idx_milestones_order ON learning_path_milestones(learning_path_id, milestone_order);

-- ============================================================================
-- PROGRESS INDEXES
-- ============================================================================

-- User progress
CREATE INDEX idx_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_progress_question_id ON user_progress(question_id);
CREATE INDEX idx_progress_last_attempt ON user_progress(last_attempt_at DESC NULLS LAST);
CREATE INDEX idx_progress_accuracy ON user_progress(accuracy_rate DESC) WHERE total_attempts >= 3;

-- Mastery levels
CREATE INDEX idx_mastery_user_id ON mastery_levels(user_id);
CREATE INDEX idx_mastery_topic ON mastery_levels(topic);
CREATE INDEX idx_mastery_percentage ON mastery_levels(mastery_percentage DESC);
CREATE INDEX idx_mastery_user_topic ON mastery_levels(user_id, topic);

-- SM-2 review cards
CREATE INDEX idx_sm2_user_id ON sm2_review_cards(user_id);
CREATE INDEX idx_sm2_question_id ON sm2_review_cards(question_id);
CREATE INDEX idx_sm2_next_review ON sm2_review_cards(next_review_date) WHERE next_review_date <= CURRENT_DATE;
CREATE INDEX idx_sm2_is_due ON sm2_review_cards(user_id, is_due) WHERE is_due = true;

-- ============================================================================
-- GAMIFICATION INDEXES
-- ============================================================================

-- Achievements
CREATE INDEX idx_achievements_code ON achievements(code);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active) WHERE is_active = true;

-- User achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC NULLS LAST);

-- XP transactions
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source);

-- User streaks
CREATE INDEX idx_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_streaks_date ON user_streaks(streak_date DESC);
CREATE INDEX idx_streaks_user_date ON user_streaks(user_id, streak_date DESC);

-- ============================================================================
-- ANALYTICS INDEXES (Applied to each partition)
-- ============================================================================

-- Study sessions (template for partitions)
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id, created_at);
CREATE INDEX idx_study_sessions_started_at ON study_sessions(started_at);
CREATE INDEX idx_study_sessions_type ON study_sessions(session_type);

-- Performance metrics (template for partitions)
CREATE INDEX idx_perf_metrics_user_id ON performance_metrics(user_id, created_at);
CREATE INDEX idx_perf_metrics_date ON performance_metrics(metric_date);
CREATE INDEX idx_perf_metrics_topic ON performance_metrics(topic) WHERE topic IS NOT NULL;

-- Retention analytics (template for partitions)
CREATE INDEX idx_retention_user_id ON retention_analytics(user_id, created_at);
CREATE INDEX idx_retention_date ON retention_analytics(retention_date);
```

### Index Maintenance

```sql
-- Automatic index maintenance function
CREATE OR REPLACE FUNCTION maintain_indexes()
RETURNS void AS $$
BEGIN
    -- Reindex tables with high write activity weekly
    REINDEX TABLE CONCURRENTLY user_question_attempts;
    REINDEX TABLE CONCURRENTLY xp_transactions;
    REINDEX TABLE CONCURRENTLY user_streaks;

    -- Update statistics for query planner
    ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Schedule via cron or pg_cron extension
-- SELECT cron.schedule('maintain-indexes', '0 3 * * 0', 'SELECT maintain_indexes()');
```

---

## Partitioning Strategy

### Time-Based Partitioning (Analytics Tables)

**Rationale**: Analytics data grows unbounded and is queried by time range. Partitioning:
- Improves query performance (partition pruning)
- Enables easy archival (detach old partitions)
- Simplifies maintenance (VACUUM, REINDEX per partition)

**Partition Scheme**: Monthly partitions for all analytics tables

```sql
-- Automated partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partitions(
    table_name text,
    start_date date,
    end_date date
)
RETURNS void AS $$
DECLARE
    partition_date date;
    partition_name text;
    partition_start date;
    partition_end date;
BEGIN
    partition_date := date_trunc('month', start_date);

    WHILE partition_date < end_date LOOP
        partition_start := partition_date;
        partition_end := partition_date + interval '1 month';
        partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM');

        -- Create partition if it doesn't exist
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, table_name, partition_start, partition_end
        );

        -- Create indexes on new partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id, created_at)',
            'idx_' || partition_name || '_user_id', partition_name);

        partition_date := partition_end;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for next 12 months
SELECT create_monthly_partitions('study_sessions', CURRENT_DATE, CURRENT_DATE + interval '12 months');
SELECT create_monthly_partitions('performance_metrics', CURRENT_DATE, CURRENT_DATE + interval '12 months');
SELECT create_monthly_partitions('retention_analytics', CURRENT_DATE, CURRENT_DATE + interval '12 months');
```

### Archival Strategy

```sql
-- Archive old partitions (convert to read-only, compress)
CREATE OR REPLACE FUNCTION archive_old_partitions(
    table_name text,
    months_to_keep integer
)
RETURNS void AS $$
DECLARE
    partition_name text;
    cutoff_date date;
BEGIN
    cutoff_date := date_trunc('month', CURRENT_DATE - interval '1 month' * months_to_keep);

    FOR partition_name IN
        SELECT tablename
        FROM pg_tables
        WHERE tablename LIKE table_name || '_%'
        AND tablename < table_name || '_' || to_char(cutoff_date, 'YYYY_MM')
    LOOP
        -- Detach partition (still queryable as separate table)
        EXECUTE format('ALTER TABLE %I DETACH PARTITION %I', table_name, partition_name);

        -- Compress archived partition (pg_squeeze or manual)
        -- Export to cold storage (S3, etc.)
        RAISE NOTICE 'Archived partition: %', partition_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Archive analytics data older than 12 months
-- SELECT archive_old_partitions('study_sessions', 12);
```

### User-Based Sharding (Future Consideration)

**When to Consider**:
- User count > 100K
- Single database performance degrades
- Need geographic distribution

**Shard Key**: `user_id` (hash-based sharding)

**Strategy**:
```sql
-- Logical sharding using PostgreSQL schemas
CREATE SCHEMA shard_0;
CREATE SCHEMA shard_1;
CREATE SCHEMA shard_2;

-- Route queries based on user_id hash
-- hash(user_id) % num_shards
```

**Not Implemented Yet**: Premature for MVP. Monitor and implement if needed.

---

## Migration Strategy

### Alembic Configuration

**File**: `alembic.ini`

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+asyncpg://user:password@localhost/studyin

[post_write_hooks]
hooks = ruff
ruff.type = console_scripts
ruff.entrypoint = ruff
ruff.options = check --fix REVISION_SCRIPT_FILENAME
```

**File**: `alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.db.base import Base
from app.config import settings

# Import all models for autogenerate
from app.models.user import User
from app.models.material import Material, MaterialChunk
from app.models.question import Question
# ... import all models

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
```

### Migration Workflow

**1. Create Migration**:
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add refresh_tokens table"

# Manual migration (for complex changes)
alembic revision -m "Add custom indexes"
```

**2. Review Migration**:
```python
# alembic/versions/001_add_refresh_tokens.py
"""Add refresh_tokens table

Revision ID: 001
Revises:
Create Date: 2025-10-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create refresh_tokens table
    op.create_table('refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('family_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('replaces', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_revoked', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['replaces'], ['refresh_tokens.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )

    # Create indexes
    op.create_index('idx_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('idx_refresh_tokens_family_id', 'refresh_tokens', ['family_id'])

def downgrade() -> None:
    op.drop_index('idx_refresh_tokens_family_id', table_name='refresh_tokens')
    op.drop_index('idx_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
```

**3. Test Migration**:
```bash
# Upgrade
alembic upgrade head

# Downgrade (rollback)
alembic downgrade -1

# Check current version
alembic current
```

**4. Zero-Downtime Migration Patterns**:

```python
# Pattern 1: Add column (nullable first)
def upgrade():
    # Step 1: Add column as nullable
    op.add_column('users', sa.Column('new_field', sa.String(), nullable=True))

    # Step 2: Backfill data (in batches for large tables)
    connection = op.get_bind()
    connection.execute("""
        UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL
    """)

    # Step 3: Make not nullable (separate migration)
    # op.alter_column('users', 'new_field', nullable=False)

# Pattern 2: Rename column (multi-step)
def upgrade():
    # Step 1: Add new column
    op.add_column('users', sa.Column('email_address', sa.String(), nullable=True))

    # Step 2: Copy data
    op.execute("UPDATE users SET email_address = email")

    # Step 3: Update application to use new column
    # (Deploy new code here)

    # Step 4: Drop old column (separate migration after verification)
    # op.drop_column('users', 'email')
```

### Migration Versioning Strategy

**Branch-Based Versioning**:
```
main branch:     001 → 002 → 003 → 004
feature branch:  001 → 002 → 003a (merge to main as 005)
```

**Resolution**:
```bash
# Rebase feature branch migrations
alembic upgrade head
alembic revision --autogenerate -m "Merge feature"
```

---

## Data Retention & Archival

### Retention Policies

| Data Type | Hot Storage | Warm Storage | Cold Storage | Deletion |
|-----------|-------------|--------------|--------------|----------|
| User data | Indefinite | N/A | N/A | On request (GDPR) |
| Materials | Indefinite | N/A | N/A | On user deletion |
| Questions | Indefinite | N/A | N/A | On material deletion |
| Attempts | 12 months | 12-24 months | > 24 months | > 36 months |
| Analytics | 6 months | 6-12 months | > 12 months | > 24 months |
| Chat logs | 6 months | 6-12 months | > 12 months | > 24 months |
| Sessions | 3 months | 3-12 months | > 12 months | > 24 months |

### GDPR Compliance (User Data Deletion)

```sql
-- Complete user data deletion function
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    deletion_report jsonb;
BEGIN
    -- Build deletion report
    deletion_report := jsonb_build_object(
        'user_id', target_user_id,
        'deleted_at', NOW(),
        'tables_affected', jsonb_build_object(
            'materials', (SELECT COUNT(*) FROM materials WHERE user_id = target_user_id),
            'questions', (SELECT COUNT(*) FROM user_question_attempts WHERE user_id = target_user_id),
            'sessions', (SELECT COUNT(*) FROM practice_sessions WHERE user_id = target_user_id),
            'conversations', (SELECT COUNT(*) FROM chat_conversations WHERE user_id = target_user_id)
        )
    );

    -- Delete user (cascades to all related tables)
    DELETE FROM users WHERE id = target_user_id;

    -- Anonymize analytics (keep aggregates, remove PII)
    UPDATE study_sessions
    SET user_id = '00000000-0000-0000-0000-000000000000'::uuid,
        activity_data = '{}'::jsonb
    WHERE user_id = target_user_id;

    UPDATE performance_metrics
    SET user_id = '00000000-0000-0000-0000-000000000000'::uuid,
        detailed_metrics = '{}'::jsonb
    WHERE user_id = target_user_id;

    RETURN deletion_report;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT delete_user_data('user-uuid-here');
```

### Backup and Restore Procedures

**Daily Backups**:
```bash
#!/bin/bash
# backup.sh - Daily PostgreSQL backup

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="studyin"

# Full database backup
pg_dump -Fc -f "$BACKUP_DIR/studyin_$DATE.dump" $DB_NAME

# Compress
gzip "$BACKUP_DIR/studyin_$DATE.dump"

# Upload to S3 (or other cloud storage)
aws s3 cp "$BACKUP_DIR/studyin_$DATE.dump.gz" s3://studyin-backups/daily/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

# Delete S3 backups older than 30 days
aws s3 ls s3://studyin-backups/daily/ | while read -r line; do
    createDate=$(echo $line | awk {'print $1" "$2'})
    createDate=$(date -d"$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk {'print $4'})
        aws s3 rm s3://studyin-backups/daily/$fileName
    fi
done
```

**Point-in-Time Recovery (PITR)**:
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://studyin-backups/wal/%f'

# Restore to specific point in time
pg_basebackup -D /var/lib/postgresql/data_restore -Fp -Xs -P
# Create recovery.conf with target timestamp
# Start PostgreSQL in recovery mode
```

---

## Vector Database Design

### pgvector Schema

**Embedding Storage**:
- **Table**: `material_chunks`
- **Column**: `embedding vector(1536)` (OpenAI text-embedding-3-small)
- **Index**: HNSW (Hierarchical Navigable Small World)

**Configuration**:
```sql
-- HNSW index parameters
-- m: maximum number of connections per layer (16 = good balance)
-- ef_construction: size of dynamic candidate list (64 = good quality)
CREATE INDEX idx_chunks_embedding ON material_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Query-time parameters (set per session)
SET hnsw.ef_search = 100; -- Larger = better recall, slower
```

### Similarity Search Queries

```sql
-- Find top 5 most similar chunks to query embedding
SELECT
    mc.id,
    mc.content,
    mc.page_number,
    m.title,
    1 - (mc.embedding <=> $1::vector) AS similarity
FROM material_chunks mc
JOIN materials m ON mc.material_id = m.id
WHERE m.user_id = $2
ORDER BY mc.embedding <=> $1::vector
LIMIT 5;

-- Find similar chunks with metadata filtering
SELECT
    mc.id,
    mc.content,
    mc.page_number,
    m.title,
    1 - (mc.embedding <=> $1::vector) AS similarity
FROM material_chunks mc
JOIN materials m ON mc.material_id = m.id
WHERE m.user_id = $2
    AND m.topic = $3
    AND (1 - (mc.embedding <=> $1::vector)) > 0.75 -- Similarity threshold
ORDER BY mc.embedding <=> $1::vector
LIMIT 10;
```

### RAG Pipeline Integration

```python
# app/services/ai_coach/rag.py

async def retrieve_relevant_chunks(
    query: str,
    user_id: uuid.UUID,
    topic: Optional[str] = None,
    top_k: int = 5
) -> List[ChunkResult]:
    """
    Retrieve relevant chunks for RAG.

    Args:
        query: User's question
        user_id: Current user ID
        topic: Optional topic filter
        top_k: Number of chunks to retrieve

    Returns:
        List of relevant chunks with metadata
    """
    # Generate query embedding via Codex CLI
    embedding = await generate_embedding(query)

    # Build query
    query = select(
        MaterialChunk.id,
        MaterialChunk.content,
        MaterialChunk.page_number,
        MaterialChunk.metadata,
        Material.title,
        Material.filename,
        (1 - MaterialChunk.embedding.cosine_distance(embedding)).label('similarity')
    ).join(Material).where(
        Material.user_id == user_id
    )

    # Add topic filter if provided
    if topic:
        query = query.where(Material.topic == topic)

    # Order by similarity
    query = query.order_by(
        MaterialChunk.embedding.cosine_distance(embedding)
    ).limit(top_k)

    results = await session.execute(query)
    return results.all()
```

### Migration to Qdrant (If Needed)

**When to Migrate**:
- Vector count > 1M
- Complex filtering needs (nested metadata queries)
- Need for distributed search
- pgvector query latency > 500ms

**Migration Script**:
```python
# scripts/migrate_to_qdrant.py

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

async def migrate_pgvector_to_qdrant():
    """Migrate embeddings from pgvector to Qdrant"""

    # Initialize Qdrant
    qdrant = QdrantClient(host="localhost", port=6333)

    # Create collection
    qdrant.create_collection(
        collection_name="studyin_chunks",
        vectors_config=VectorParams(
            size=1536,
            distance=Distance.COSINE
        )
    )

    # Batch migrate chunks
    batch_size = 1000
    offset = 0

    while True:
        chunks = await session.execute(
            select(MaterialChunk)
            .limit(batch_size)
            .offset(offset)
        )
        chunks = chunks.scalars().all()

        if not chunks:
            break

        # Prepare batch for Qdrant
        points = [
            {
                "id": str(chunk.id),
                "vector": chunk.embedding.tolist(),
                "payload": {
                    "material_id": str(chunk.material_id),
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "metadata": chunk.metadata
                }
            }
            for chunk in chunks
        ]

        # Upload batch
        qdrant.upsert(
            collection_name="studyin_chunks",
            points=points
        )

        offset += batch_size
        print(f"Migrated {offset} chunks")

    print("Migration complete!")
```

---

## Redis Caching Schema

### Key Patterns

```
studyin:session:{token_hash}               # Session data
studyin:user:{user_id}:stats               # User dashboard stats
studyin:user:{user_id}:due_reviews         # Due review count
studyin:ratelimit:{user_id}:{endpoint}     # Rate limit counter
studyin:job:{job_id}                       # Background job data
studyin:cache:questions:{topic}:{difficulty} # Cached question lists
studyin:leaderboard:{timeframe}            # Future: leaderboard data
```

### Cache Strategies

**1. Session Storage** (Short TTL):
```python
# Store access token metadata (15 min TTL)
await redis.setex(
    f"studyin:session:{token_hash}",
    900,  # 15 minutes
    json.dumps({
        "user_id": str(user.id),
        "email": user.email,
        "issued_at": datetime.utcnow().isoformat()
    })
)

# Retrieve session
session_data = await redis.get(f"studyin:session:{token_hash}")
if session_data:
    return json.loads(session_data)
```

**2. Dashboard Stats Cache** (5 min TTL):
```python
# Cache expensive dashboard queries
cache_key = f"studyin:user:{user_id}:stats"
cached = await redis.get(cache_key)

if cached:
    return json.loads(cached)

# Compute stats (expensive query)
stats = await compute_user_stats(user_id)

# Cache for 5 minutes
await redis.setex(cache_key, 300, json.dumps(stats))
return stats
```

**3. Due Reviews Cache** (1 min TTL):
```python
# Cache due review count
cache_key = f"studyin:user:{user_id}:due_reviews"
count = await redis.get(cache_key)

if count is not None:
    return int(count)

# Query database
count = await session.execute(
    select(func.count(SM2ReviewCard.id))
    .where(SM2ReviewCard.user_id == user_id)
    .where(SM2ReviewCard.is_due == True)
)
count = count.scalar()

# Cache for 1 minute
await redis.setex(cache_key, 60, count)
return count
```

**4. Rate Limiting**:
```python
# Rate limit: 5 login attempts per minute
key = f"studyin:ratelimit:{user_id}:login"
attempts = await redis.incr(key)

if attempts == 1:
    await redis.expire(key, 60)  # Set TTL on first attempt

if attempts > 5:
    raise HTTPException(429, "Rate limit exceeded")
```

**5. Job Queue** (Redis Streams):
```python
# Producer: Enqueue document processing job
await redis.xadd(
    "studyin:jobs:document_processing",
    {
        "material_id": str(material.id),
        "job_type": "parse_and_embed",
        "priority": "normal"
    }
)

# Consumer: Process jobs
while True:
    messages = await redis.xread(
        {"studyin:jobs:document_processing": "$"},
        count=1,
        block=5000
    )

    for stream, message_list in messages:
        for message_id, data in message_list:
            # Process job
            await process_document(data["material_id"])

            # Acknowledge
            await redis.xack("studyin:jobs:document_processing", "workers", message_id)
```

### Cache Invalidation Rules

```python
# Invalidate cache on relevant mutations

async def update_user_progress(user_id: uuid.UUID, question_id: uuid.UUID):
    # Update database
    await session.execute(...)
    await session.commit()

    # Invalidate caches
    await redis.delete(f"studyin:user:{user_id}:stats")
    await redis.delete(f"studyin:user:{user_id}:due_reviews")

async def complete_session(session_id: uuid.UUID):
    session = await get_session(session_id)

    # Update database
    await session.commit()

    # Invalidate user stats
    await redis.delete(f"studyin:user:{session.user_id}:stats")
```

### Redis Configuration

```python
# app/core/cache.py

import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    max_connections=20
)

# Namespace helper
def cache_key(*parts: str) -> str:
    """Generate namespaced cache key"""
    return f"studyin:{':'.join(parts)}"

# Common operations
async def get_cached(key: str):
    data = await redis_client.get(key)
    return json.loads(data) if data else None

async def set_cached(key: str, value: any, ttl: int = 300):
    await redis_client.setex(key, ttl, json.dumps(value))

async def invalidate(pattern: str):
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)
```

---

## Performance Optimization

### Connection Pooling

```python
# app/db/session.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,        # Maintain 20 connections
    max_overflow=10,     # Allow 10 additional connections under load
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,   # Recycle connections after 1 hour
    pool_timeout=30,     # Timeout after 30 seconds waiting for connection
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### Query Optimization Patterns

**1. Eager Loading (Avoid N+1)**:
```python
# ❌ BAD: N+1 query problem
materials = await session.execute(select(Material).where(Material.user_id == user_id))
for material in materials.scalars():
    # Triggers additional query per material
    chunk_count = len(material.chunks)

# ✅ GOOD: Eager load with joinedload
from sqlalchemy.orm import selectinload

materials = await session.execute(
    select(Material)
    .options(selectinload(Material.chunks))
    .where(Material.user_id == user_id)
)
for material in materials.scalars():
    chunk_count = len(material.chunks)  # No additional query
```

**2. Pagination**:
```python
# Cursor-based pagination (better for large datasets)
async def get_questions_paginated(
    cursor: Optional[uuid.UUID] = None,
    limit: int = 20
):
    query = select(Question).order_by(Question.created_at.desc())

    if cursor:
        # Get questions after cursor
        cursor_question = await session.get(Question, cursor)
        query = query.where(Question.created_at < cursor_question.created_at)

    query = query.limit(limit + 1)  # Fetch one extra to check if more exist
    results = await session.execute(query)
    questions = results.scalars().all()

    has_more = len(questions) > limit
    if has_more:
        questions = questions[:limit]

    next_cursor = questions[-1].id if has_more else None

    return {
        "questions": questions,
        "next_cursor": next_cursor,
        "has_more": has_more
    }
```

**3. Batch Operations**:
```python
# Batch insert questions
async def bulk_insert_questions(questions: List[dict]):
    # Use bulk_insert_mappings for better performance
    await session.execute(
        insert(Question),
        questions
    )
    await session.commit()

# Batch update SM-2 cards
async def bulk_update_sm2_cards(updates: List[dict]):
    await session.execute(
        update(SM2ReviewCard),
        updates
    )
    await session.commit()
```

**4. Materialized Views** (for expensive aggregations):
```sql
-- Create materialized view for user stats
CREATE MATERIALIZED VIEW user_stats_mv AS
SELECT
    u.id AS user_id,
    u.xp,
    u.level,
    u.current_streak,
    COUNT(DISTINCT uqa.id) AS total_questions_answered,
    COUNT(DISTINCT CASE WHEN uqa.is_correct THEN uqa.id END) AS total_correct,
    AVG(CASE WHEN uqa.is_correct THEN 1.0 ELSE 0.0 END) AS overall_accuracy,
    COUNT(DISTINCT m.id) AS materials_uploaded
FROM users u
LEFT JOIN user_question_attempts uqa ON u.id = uqa.user_id
LEFT JOIN materials m ON u.id = m.user_id
GROUP BY u.id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_user_stats_mv_user_id ON user_stats_mv(user_id);

-- Refresh materialized view (scheduled hourly)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_mv;
```

### Read Replicas Strategy

**Configuration** (future scaling):
```python
# Read replica for analytics queries
analytics_engine = create_async_engine(
    settings.DATABASE_REPLICA_URL,
    pool_size=10
)

# Route read-only queries to replica
async def get_analytics_data(user_id: uuid.UUID):
    async with AsyncSession(analytics_engine) as session:
        result = await session.execute(
            select(PerformanceMetrics)
            .where(PerformanceMetrics.user_id == user_id)
            .order_by(PerformanceMetrics.metric_date.desc())
            .limit(30)
        )
        return result.scalars().all()
```

### Query Monitoring

```python
# app/middleware/query_monitor.py

import time
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info["query_start_time"].pop(-1)

    # Log slow queries (> 1 second)
    if total > 1.0:
        logger.warning(
            f"Slow query detected: {total:.2f}s",
            extra={
                "query": statement,
                "duration": total,
                "params": parameters
            }
        )
```

---

## Seeding Data

### Development Seed Data

**File**: `scripts/seed_dev_data.py`

```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import engine, AsyncSessionLocal
from app.models.user import User
from app.models.achievement import Achievement
from app.core.security import get_password_hash

async def seed_database():
    """Seed database with development data"""

    async with AsyncSessionLocal() as session:
        # Create test user
        test_user = User(
            email="test@studyin.app",
            hashed_password=get_password_hash("testpassword123"),
            name="Test User",
            is_verified=True,
            xp=500,
            level=5,
            current_streak=7
        )
        session.add(test_user)

        # Create achievements
        achievements = [
            Achievement(
                code="first_question",
                name="First Steps",
                description="Answer your first question",
                icon="🎯",
                category="milestone",
                xp_reward=10,
                unlock_conditions={"questions_answered": 1},
                rarity="common"
            ),
            Achievement(
                code="streak_7",
                name="Week Warrior",
                description="Maintain a 7-day study streak",
                icon="🔥",
                category="streak",
                xp_reward=50,
                unlock_conditions={"streak_days": 7},
                rarity="uncommon"
            ),
            Achievement(
                code="streak_30",
                name="Monthly Master",
                description="Maintain a 30-day study streak",
                icon="🏆",
                category="streak",
                xp_reward=200,
                unlock_conditions={"streak_days": 30},
                rarity="rare"
            ),
            Achievement(
                code="perfect_10",
                name="Perfect Score",
                description="Answer 10 questions in a row correctly",
                icon="💯",
                category="mastery",
                xp_reward=100,
                unlock_conditions={"correct_streak": 10},
                rarity="epic"
            ),
            Achievement(
                code="speed_demon",
                name="Speed Demon",
                description="Answer a question in under 30 seconds",
                icon="⚡",
                category="speed",
                xp_reward=25,
                unlock_conditions={"time_under_seconds": 30},
                rarity="uncommon"
            ),
            Achievement(
                code="night_owl",
                name="Night Owl",
                description="Study after midnight",
                icon="🦉",
                category="special",
                xp_reward=15,
                unlock_conditions={"study_hour_after": 0},
                rarity="common"
            ),
            Achievement(
                code="early_bird",
                name="Early Bird",
                description="Study before 6 AM",
                icon="🐦",
                category="special",
                xp_reward=15,
                unlock_conditions={"study_hour_before": 6},
                rarity="common"
            ),
            Achievement(
                code="master_anatomy",
                name="Anatomy Master",
                description="Achieve 90% mastery in Anatomy",
                icon="🧠",
                category="mastery",
                xp_reward=150,
                unlock_conditions={"topic": "Anatomy", "mastery_percentage": 90},
                rarity="rare"
            ),
        ]

        session.add_all(achievements)

        await session.commit()
        print("✅ Development database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
```

**Run Seeding**:
```bash
# Seed development database
python scripts/seed_dev_data.py
```

---

## Scaling Considerations

### Current Architecture (MVP - Single User)

```
Single PostgreSQL Instance:
- All tables in one database
- pgvector for embeddings
- Redis for cache/queue
- Suitable for 1-100 users
```

### Scaling Path (Future Growth)

**Phase 1: Vertical Scaling (1-1K users)**
- Increase database instance size (CPU, RAM)
- Add read replica for analytics
- Increase Redis memory

**Phase 2: Caching & Optimization (1K-10K users)**
- Implement materialized views
- Aggressive caching strategy
- CDN for static assets
- Connection pooling optimization

**Phase 3: Partitioning (10K-100K users)**
- Partition analytics tables by month
- Archive old data to cold storage
- Implement table-level sharding (by user_id)

**Phase 4: Distributed Architecture (100K+ users)**
- Migrate to Qdrant for vector search
- Implement database sharding
- Microservices architecture (separate auth, analytics)
- Message queue for async operations

### Monitoring Strategy

```python
# app/middleware/monitoring.py

from prometheus_client import Counter, Histogram, Gauge

# Metrics
db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['table', 'operation']
)

db_connections = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

cache_hits = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type']
)

cache_misses = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type']
)

# Usage
with db_query_duration.labels(table='users', operation='select').time():
    result = await session.execute(query)
```

---

## Summary

### Key Design Decisions

1. **PostgreSQL with pgvector**: Single database for simplicity, scales to 100K vectors
2. **Redis for caching**: Session storage, rate limiting, job queue
3. **Time-based partitioning**: Monthly partitions for analytics tables
4. **Alembic for migrations**: Version-controlled schema changes
5. **GDPR-compliant deletion**: Complete user data removal on request
6. **Security-first**: Refresh token rotation, family tracking, HttpOnly cookies
7. **Performance-optimized**: Comprehensive indexing, connection pooling, caching

### Migration Checklist

- [ ] Install PostgreSQL 16+ with pgvector extension
- [ ] Install Redis 7.x
- [ ] Configure Alembic
- [ ] Run initial migration (create all tables)
- [ ] Create indexes
- [ ] Seed development data
- [ ] Test authentication flow
- [ ] Test document upload
- [ ] Verify vector similarity search
- [ ] Configure backup schedule
- [ ] Set up monitoring

### Next Steps

1. Review this architecture with team
2. Set up local development database
3. Implement SQLAlchemy models
4. Create Alembic migrations
5. Write database integration tests
6. Document API schemas (Pydantic)

---

**Last Updated**: 2025-10-09
**Version**: 1.0
**Status**: Ready for Implementation
