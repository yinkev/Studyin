# System Flows & Diagrams
# StudyIn - Gamified Medical Learning Platform

> **Visual Guide**: System architecture, data flows, and user journeys with diagrams

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Planning Phase
**Related Docs**: PRD.md, TECH_SPEC.md, IMPLEMENTATION_PLAN.md

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [User Journey Flows](#user-journey-flows)
4. [Component Interaction Diagrams](#component-interaction-diagrams)
5. [Database Entity Relationships](#database-entity-relationships)
6. [API Flow Diagrams](#api-flow-diagrams)
7. [Background Job Flows](#background-job-flows)
8. [WebSocket Communication Flow](#websocket-communication-flow)
9. [Authentication Flow](#authentication-flow)
10. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER DEVICES                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │             │
│  │   Browser    │  │   Browser    │  │   Browser    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                    HTTPS / WebSocket (TLS 1.3)
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│                      (Next.js 15 + React 19)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Server Components (SSR)                           │ │
│  │  - Landing page                                                │ │
│  │  - Static content                                              │ │
│  │  - SEO-optimized pages                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Client Components (CSR)                           │ │
│  │  - Dashboard (interactive)                                     │ │
│  │  - Quiz interface                                              │ │
│  │  - AI Coach chat                                               │ │
│  │  - Progress analytics                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │       State Management (Zustand + TanStack Query)              │ │
│  │  - Auth state (JWT tokens)                                     │ │
│  │  - Quiz state (questions, answers)                             │ │
│  │  - UI state (theme, modals)                                    │ │
│  │  - Server state cache (TanStack Query)                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    REST API + WebSocket
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                                │
│                         (FastAPI + Python 3.11+)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   API Gateway (FastAPI)                        │ │
│  │                                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │ │
│  │  │   Auth   │ │   Quiz   │ │Document  │ │   WebSocket     │  │ │
│  │  │   API    │ │   API    │ │   API    │ │   (Chat)        │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │ │
│  │                                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │ │
│  │  │Progress  │ │Analytics │ │  Users   │                      │ │
│  │  │   API    │ │   API    │ │   API    │                      │ │
│  │  └──────────┘ └──────────┘ └──────────┘                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Service Layer                                │ │
│  │                                                                │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                │ │
│  │  │   Auth     │ │  Document  │ │  Question  │                │ │
│  │  │  Service   │ │  Processor │ │  Generator │                │ │
│  │  └────────────┘ └────────────┘ └────────────┘                │ │
│  │                                                                │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                │ │
│  │  │    SM-2    │ │    XP      │ │  AI Coach  │                │ │
│  │  │  Algorithm │ │ Calculator │ │   (RAG)    │                │ │
│  │  └────────────┘ └────────────┘ └────────────┘                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │               Repository Layer (Data Access)                   │ │
│  │  - UserRepository                                              │ │
│  │  - MaterialRepository                                          │ │
│  │  - QuestionRepository                                          │ │
│  │  - ProgressRepository                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
  │                 │  │                 │  │                 │
  │   PostgreSQL    │  │      Redis      │  │     Qdrant      │
  │   16 + pgvector │  │   7 (Cache +    │  │   (Optional)    │
  │                 │  │    Job Queue)   │  │   Vector Search │
  │  - Users        │  │                 │  │                 │
  │  - Materials    │  │  - Session      │  │  - Embeddings   │
  │  - Questions    │  │  - Cache        │  │  - Chunks       │
  │  - Progress     │  │  - Rate limits  │  │                 │
  │  - Achievements │  │  - Job queue    │  │                 │
  │                 │  │                 │  │                 │
  └─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS                                │
│                      (Redis Streams + Async)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │   Document      │  │   Embedder      │  │    Question      │   │
│  │   Processor     │  │   Worker        │  │    Generator     │   │
│  │                 │  │                 │  │                  │   │
│  │  - Parse PDF    │  │  - Generate     │  │  - LLM MCQs     │   │
│  │  - Extract text │  │    embeddings   │  │  - Quality      │   │
│  │  - Chunk docs   │  │  - Store vectors│  │    scoring      │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Codex CLI (OAuth)
                                ▼
                         ┌──────────────┐
                         │  CODEX CLI   │
                         │  (LLM + RAG) │
                         │              │
                         │  - AI Coach  │
                         │  - Question  │
                         │    Gen       │
                         │  - Embeddings│
                         └──────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration & Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Enter email + password
     │
     ▼
┌────────────────────┐
│  Frontend (React)  │
│                    │
│  - Validate form   │
│  - Hash password?  │
│    (NO - backend)  │
└─────────┬──────────┘
          │
          │ 2. POST /api/auth/register
          │    { email, password, name }
          │
          ▼
┌─────────────────────────────────────┐
│  Backend (FastAPI)                  │
│                                     │
│  3. Validate input (Pydantic)       │
│  4. Check if email exists           │
│  5. Hash password (bcrypt, 12 rounds│
│  6. Create user record              │
│  7. Generate JWT tokens             │
│     - Access token (15 min)         │
│     - Refresh token (7 days)        │
│  8. Store refresh token in DB       │
└─────────────┬───────────────────────┘
              │
              │ 9. Return tokens + user data
              │    {
              │      access_token,
              │      refresh_token,
              │      user: { id, email, name, level, xp }
              │    }
              ▼
┌────────────────────┐
│  Frontend          │
│                    │
│  10. Store tokens  │
│      - Access token│
│        in memory   │
│      - Refresh     │
│        token in    │
│        localStorage│
│  11. Redirect to   │
│      onboarding    │
└────────────────────┘
```

---

### 2. Document Upload & Processing Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Select PDF file (drag & drop)
     │
     ▼
┌────────────────────────────────────────┐
│  Frontend                              │
│                                        │
│  2. Validate file                      │
│     - Type: PDF, DOCX, TXT             │
│     - Size: < 50 MB                    │
│  3. Show upload progress UI            │
│  4. Create FormData                    │
└────────┬───────────────────────────────┘
         │
         │ 5. POST /api/materials (multipart/form-data)
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend API                            │
│                                         │
│  6. Validate file                       │
│  7. Save file to disk (./uploads/)      │
│  8. Create Material record              │
│     status = PENDING                    │
│  9. Enqueue background job              │
│     - job_type: process_document        │
│     - material_id: <UUID>               │
│ 10. Return Material ID                  │
└─────────┬───────────────────────────────┘
          │
          │ 11. Material ID + status
          │
          ▼
┌────────────────────┐
│  Frontend          │
│                    │
│ 12. Poll status    │
│     OR             │
│ 13. WebSocket      │
│     updates        │
└────────────────────┘

              ┌──────────────────────────────┐
              │  Background Worker           │
              │  (Redis Stream Consumer)     │
              │                              │
              │ 14. Dequeue job              │
              │ 15. Load file                │
              │ 16. Parse PDF                │
              │     - Extract text (pypdf2)  │
              │     - OCR if needed (Tesseract│
              │ 17. Semantic chunking        │
              │     - Chunk size: 512 tokens │
              │     - Overlap: 128 tokens    │
              │ 18. For each chunk:          │
              │     a. Generate embedding    │
              │        (Codex CLI OAuth)     │
              │     b. Store in Qdrant       │
              │        OR pgvector            │
              │ 19. Update Material status   │
              │     status = COMPLETED       │
              │ 20. Send WebSocket update    │
              └──────────────────────────────┘
                           │
                           │ 21. Notification
                           ▼
                  ┌────────────────┐
                  │  Frontend      │
                  │  (WebSocket)   │
                  │                │
                  │  "Processing   │
                  │   complete!"   │
                  └────────────────┘
```

---

### 3. AI Coach Chat Flow (RAG + Streaming)

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Type question: "What causes myocardial infarction?"
     │
     ▼
┌──────────────────────────────────────┐
│  Frontend (Chat Component)           │
│                                      │
│  2. Add message to chat history      │
│  3. Show user message                │
│  4. Show typing indicator            │
└────────┬─────────────────────────────┘
         │
         │ 5. WebSocket emit: "message"
         │    { content: "What causes..." }
         │
         ▼
┌───────────────────────────────────────────────────────┐
│  Backend WebSocket Handler                            │
│                                                       │
│  6. Receive message                                   │
│  7. Retrieve conversation history (last 5 messages)   │
│  8. Perform RAG:                                      │
│                                                       │
│     ┌─────────────────────────────────────────────┐  │
│     │  RAG Pipeline                               │  │
│     │                                             │  │
│     │  a. Generate query embedding                │  │
│     │     (Codex CLI OAuth)                       │  │
│     │                                             │  │
│     │  b. Vector similarity search                │  │
│     │     - Query Qdrant/pgvector                 │  │
│     │     - Top 5 similar chunks                  │  │
│     │     - Threshold: > 0.7 similarity           │  │
│     │                                             │  │
│     │  c. Retrieve full chunks                    │  │
│     │     - Content                               │  │
│     │     - Source (material_id, page_number)     │  │
│     │                                             │  │
│     │  d. Build context                           │  │
│     │     context = "\n\n".join(chunks)           │  │
│     └─────────────────────────────────────────────┘  │
│                                                       │
│  9. Build prompt:                                     │
│     ```                                               │
│     You are a medical tutor using Socratic method.   │
│                                                       │
│     Context from student's materials:                 │
│     {context}                                         │
│                                                       │
│     Conversation history:                             │
│     {history}                                         │
│                                                       │
│     Student question:                                 │
│     {question}                                        │
│                                                       │
│     Instructions:                                     │
│     - Ask probing questions                           │
│     - Provide hints, not full answers                 │
│     - Be encouraging                                  │
│     - Cite sources when possible                      │
│     ```                                               │
│                                                       │
│ 10. Call Codex CLI (streaming):                      │
│     client.messages.create(                           │
│       model="claude-3-5-sonnet",                      │
│       messages=[...],                                 │
│       stream=True                                     │
│     )                                                 │
└───────────────────────────────────────────────────────┘
         │
         │ 11. Stream response tokens
         │     (word by word)
         ▼
┌────────────────────┐
│  Frontend          │
│  (WebSocket)       │
│                    │
│ 12. Receive tokens │
│ 13. Append to      │
│     message bubble │
│ 14. Scroll to      │
│     bottom         │
│ 15. Show citations │
│     (source links) │
└────────────────────┘
```

---

### 4. Question Generation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Click "Generate Questions"
     │    Select: Material, Topic, Difficulty, Count (20)
     │
     ▼
┌────────────────────────────────────┐
│  Frontend                          │
│                                    │
│  2. Show loading state             │
│     "Generating 20 questions..."   │
└────────┬───────────────────────────┘
         │
         │ 3. POST /api/questions/generate
         │    {
         │      material_id,
         │      topic,
         │      difficulty,
         │      count: 20
         │    }
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  Backend API                                         │
│                                                      │
│  4. Validate request                                 │
│  5. Check if material is processed                   │
│  6. Enqueue background job                           │
│     - job_type: generate_questions                   │
│     - material_id, topic, difficulty, count          │
│  7. Return job_id for status tracking                │
└──────────┬───────────────────────────────────────────┘
           │
           │ 8. Job ID
           │
           ▼
┌────────────────────┐
│  Frontend          │
│                    │
│  9. Poll job status│
│     /api/jobs/:id  │
└────────────────────┘

       ┌───────────────────────────────────────────────┐
       │  Background Worker                            │
       │  (Question Generator)                         │
       │                                               │
       │ 10. Dequeue job                               │
       │ 11. Retrieve chunks for topic                 │
       │ 12. For each batch of 5 questions:            │
       │                                               │
       │     a. Select relevant chunks                 │
       │     b. Build prompt:                          │
       │        ```                                    │
       │        Generate 5 NBME-style MCQs             │
       │        based on this content:                 │
       │                                               │
       │        {chunks}                               │
       │                                               │
       │        Topic: {topic}                         │
       │        Difficulty: {difficulty}               │
       │                                               │
       │        Format:                                │
       │        - Clinical vignette (3-5 sentences)    │
       │        - 4-5 answer options                   │
       │        - Correct answer                       │
       │        - Explanation (why correct is correct, │
       │          why others are incorrect)            │
       │        ```                                    │
       │                                               │
       │     c. Call Codex CLI (OAuth)                 │
       │     d. Parse response (JSON)                  │
       │     e. Quality scoring:                       │
       │        - Vignette length: 50-200 words ✓      │
       │        - Options count: 4-5 ✓                 │
       │        - Explanation length: 100+ words ✓     │
       │        - Medical terminology present ✓        │
       │        - Quality score: 0-5                   │
       │                                               │
       │     f. If quality_score >= 3:                 │
       │        - Save to database                     │
       │        Else:                                  │
       │        - Regenerate OR skip                   │
       │                                               │
       │ 13. Update job status:                        │
       │     status = COMPLETED                        │
       │     questions_generated = 20                  │
       └───────────────────────────────────────────────┘
                      │
                      │ 14. Job complete notification
                      ▼
              ┌────────────────┐
              │  Frontend      │
              │                │
              │ 15. Redirect to│
              │     quiz       │
              │     interface  │
              └────────────────┘
```

---

### 5. Quiz Session & Spaced Repetition Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Start quiz (20 questions)
     │
     ▼
┌───────────────────────────────────────┐
│  Frontend (Quiz Component)            │
│                                       │
│  2. POST /api/quiz/session            │
│     {                                 │
│       topic: "Cardiology",            │
│       difficulty: "medium",           │
│       count: 20,                      │
│       mode: "tutor"  // or "timed"    │
│     }                                 │
└───────────┬───────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│  Backend API                                     │
│                                                  │
│  3. Create quiz session record                   │
│     - session_id (UUID)                          │
│     - user_id                                    │
│     - created_at                                 │
│                                                  │
│  4. Select questions:                            │
│     a. Prioritize due reviews (SM-2)             │
│        - next_review <= today                    │
│     b. Fill remaining with new questions         │
│        - topic match                             │
│        - difficulty match                        │
│        - not recently seen (> 7 days ago)        │
│     c. Randomize order                           │
│                                                  │
│  5. Return session + questions                   │
│     {                                            │
│       session_id,                                │
│       questions: [...]                           │
│     }                                            │
└──────────┬───────────────────────────────────────┘
           │
           │ 6. Session data
           ▼
┌────────────────────────────────────────┐
│  Frontend                              │
│                                        │
│  7. Load questions into state          │
│     (Zustand store)                    │
│  8. Start timer (if timed mode)        │
│  9. Display first question             │
└────────────────────────────────────────┘

    User answers questions...

┌────────────────────────────────────────┐
│  Frontend                              │
│                                        │
│ 10. User selects answer                │
│ 11. User rates confidence (1-5)        │
│ 12. User clicks "Submit Answer"        │
│                                        │
│ 13. POST /api/questions/:id/answer     │
│     {                                  │
│       session_id,                      │
│       answer_index: 2,                 │
│       confidence: 4,                   │
│       time_taken_seconds: 67           │
│     }                                  │
└────────┬───────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────┐
│  Backend API                                      │
│                                                   │
│ 14. Validate answer                               │
│     is_correct = (answer_index == correct_index)  │
│                                                   │
│ 15. Calculate XP earned:                          │
│     xp = XPCalculator.calculate_question_xp(      │
│       difficulty="medium",                        │
│       is_correct=True,                            │
│       confidence=4,                               │
│       time_taken_seconds=67                       │
│     )                                             │
│     # Result: 15 XP base + 5 bonus = 20 XP        │
│                                                   │
│ 16. Update user XP and level:                     │
│     user.xp += 20                                 │
│     new_level = XPCalculator.calculate_level(     │
│       user.xp                                     │
│     )                                             │
│     if new_level > user.level:                    │
│       # Level up!                                 │
│       user.level = new_level                      │
│                                                   │
│ 17. Calculate next review (SM-2):                 │
│     result = SM2Algorithm.calculate_next_review(  │
│       quality=4,  # From confidence                │
│       repetition=progress.sm2_repetition,         │
│       easiness_factor=progress.sm2_ef,            │
│       interval=progress.sm2_interval              │
│     )                                             │
│     # Result: interval=10 days, ef=2.6, rep=2     │
│                                                   │
│ 18. Create/Update Progress record:               │
│     - question_id                                 │
│     - user_id                                     │
│     - is_correct                                  │
│     - confidence                                  │
│     - time_taken_seconds                          │
│     - xp_earned                                   │
│     - sm2_interval = 10                           │
│     - sm2_ef = 2.6                                │
│     - sm2_repetition = 2                          │
│     - next_review = today + 10 days               │
│                                                   │
│ 19. Return feedback:                              │
│     {                                             │
│       is_correct,                                 │
│       explanation,                                │
│       xp_earned,                                  │
│       new_xp,                                     │
│       new_level,                                  │
│       level_up: true/false,                       │
│       next_review_date                            │
│     }                                             │
└───────────┬───────────────────────────────────────┘
            │
            │ 20. Feedback data
            ▼
┌────────────────────────────────────────┐
│  Frontend                              │
│                                        │
│ 21. Show answer feedback               │
│     - Correct/Incorrect badge          │
│     - Detailed explanation             │
│     - XP earned animation (+20 XP)     │
│     - If level_up: Celebration modal   │
│                                        │
│ 22. Update state:                      │
│     - user.xp = new_xp                 │
│     - user.level = new_level           │
│                                        │
│ 23. User clicks "Next Question"        │
│ 24. Repeat steps 10-23 for all Qs      │
│                                        │
│ 25. After last question:               │
│     POST /api/quiz/session/:id/submit  │
│                                        │
│ 26. Show quiz summary:                 │
│     - Score: 18/20 (90%)               │
│     - Total XP earned: +380 XP         │
│     - Topics mastered: +15%            │
│     - Weak areas: [...]                │
│     - Celebration animation            │
└────────────────────────────────────────┘
```

---

## Component Interaction Diagrams

### Frontend Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                    app/layout.tsx                      │
│                  (Root Layout)                         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Providers:                                      │ │
│  │  - TanStackQueryProvider                         │ │
│  │  - ThemeProvider (if dark mode)                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Global UI:                                      │ │
│  │  - Header (nav)                                  │ │
│  │  - Footer                                        │ │
│  │  - Toast notifications                           │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼─────────┐ ┌────▼────────────┐
│   (auth)/      │ │  (dashboard)/│ │   api/          │
│   layout.tsx   │ │  layout.tsx  │ │   (optional)    │
│                │ │              │ │                 │
│  - Centered    │ │  - Sidebar   │ │  - API routes   │
│  - No header   │ │  - Header    │ │    if needed    │
│  - Soft bg     │ │  - Main area │ │                 │
└───────┬────────┘ └────┬─────────┘ └─────────────────┘
        │               │
    ┌───▼───┐      ┌────▼──────────────────────┐
    │ Login │      │  Dashboard Components     │
    │ Page  │      │                           │
    └───────┘      │  ┌─────────────────────┐  │
    ┌───────┐      │  │  DashboardCard      │  │
    │Register      │  │  - XP display       │  │
    │ Page  │      │  │  - Streak counter   │  │
    └───────┘      │  │  - Level badge      │  │
                   │  └─────────────────────┘  │
                   │                           │
                   │  ┌─────────────────────┐  │
                   │  │  QuickActions       │  │
                   │  │  - Continue learning│  │
                   │  │  - Start quiz       │  │
                   │  └─────────────────────┘  │
                   │                           │
                   │  ┌─────────────────────┐  │
                   │  │  ProgressChart      │  │
                   │  │  (Recharts)         │  │
                   │  └─────────────────────┘  │
                   │                           │
                   │  ┌─────────────────────┐  │
                   │  │  PixelMascot        │  │
                   │  │  (fixed bottom-right│  │
                   │  └─────────────────────┘  │
                   └───────────────────────────┘

    ┌─────────────────────────────────┐
    │      Quiz Components            │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  QuestionCard             │  │
    │  │  - Vignette               │  │
    │  │  - OptionButtons          │  │
    │  │  - ConfidenceSlider       │  │
    │  │  - Timer (if timed)       │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  QuestionNavigation       │  │
    │  │  - Question numbers (1-20)│  │
    │  │  - Flagged indicators     │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  ExplanationPanel         │  │
    │  │  - Correct answer         │  │
    │  │  - Detailed explanation   │  │
    │  │  - Source citation        │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  QuizSummary              │  │
    │  │  - Score                  │  │
    │  │  - XP earned              │  │
    │  │  - Time taken             │  │
    │  │  - Mastery updates        │  │
    │  └───────────────────────────┘  │
    └─────────────────────────────────┘

    ┌─────────────────────────────────┐
    │      Chat Components            │
    │      (AI Coach)                 │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  ChatWindow               │  │
    │  │  - Message history        │  │
    │  │  - Auto-scroll            │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  MessageBubble            │  │
    │  │  - User message (right)   │  │
    │  │  - AI message (left)      │  │
    │  │  - Timestamp              │  │
    │  │  - Citations (if present) │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  StreamingResponse        │  │
    │  │  - Word-by-word display   │  │
    │  │  - Typing animation       │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  ChatInput                │  │
    │  │  - Text input             │  │
    │  │  - Send button            │  │
    │  │  - File upload (optional) │  │
    │  └───────────────────────────┘  │
    │                                 │
    │  ┌───────────────────────────┐  │
    │  │  PixelMascot              │  │
    │  │  - Animated avatar        │  │
    │  │  - Mood changes           │  │
    │  └───────────────────────────┘  │
    └─────────────────────────────────┘
```

---

## Database Entity Relationships

### Complete ERD with All Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
├─────────────────────────────────────────────────────────────┤
│ id (PK, UUID)                                               │
│ email (UNIQUE, NOT NULL)                                    │
│ hashed_password (NOT NULL)                                  │
│ name (NOT NULL)                                             │
│ avatar_url (NULL)                                           │
│                                                             │
│ # Gamification                                              │
│ xp (INT, DEFAULT 0)                                         │
│ level (INT, DEFAULT 1)                                      │
│ current_streak (INT, DEFAULT 0)                             │
│ max_streak (INT, DEFAULT 0)                                 │
│ last_study_date (DATETIME, NULL)                            │
│                                                             │
│ # Preferences                                               │
│ daily_goal_minutes (INT, DEFAULT 30)                        │
│ notifications_enabled (BOOL, DEFAULT true)                  │
│                                                             │
│ # Metadata                                                  │
│ is_active (BOOL, DEFAULT true)                              │
│ is_verified (BOOL, DEFAULT false)                           │
│ created_at (DATETIME)                                       │
│ updated_at (DATETIME)                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 1:N
             │
    ┌────────▼────────────────────────────┐
    │                                     │
    │                                     │
┌───▼──────────────┐     ┌────────────────▼──────────┐
│    Material      │     │      Progress             │
├──────────────────┤     ├───────────────────────────┤
│ id (PK)          │     │ id (PK)                   │
│ user_id (FK)  ───┼─────│ user_id (FK)              │
│ filename         │     │ question_id (FK) ─────────┼──┐
│ file_path        │     │ answered_at (DATETIME)    │  │
│ file_size        │     │ is_correct (BOOL)         │  │
│ file_type        │     │ confidence (INT 1-5)      │  │
│ title            │     │ time_taken_seconds (INT)  │  │
│ description      │     │ xp_earned (INT)           │  │
│ topic            │     │                           │  │
│ tags (JSON)      │     │ # SM-2 Algorithm          │  │
│                  │     │ sm2_interval (INT days)   │  │
│ # Processing     │     │ sm2_easiness_factor (FLOAT│  │
│ status (ENUM)    │     │ sm2_repetition (INT)      │  │
│ error (TEXT)     │     │ next_review (DATETIME)    │  │
│ processed_at     │     │                           │  │
│                  │     │ created_at (DATETIME)     │  │
│ # Stats          │     └───────────────────────────┘  │
│ chunk_count      │                                     │
│ question_count   │                                     │
│                  │                                     │
│ created_at       │                                     │
│ updated_at       │                                     │
└────────┬─────────┘                                     │
         │                                               │
         │ 1:N                                           │
         │                                               │
    ┌────▼─────────────────┐                            │
    │                      │                            │
┌───▼───────────────┐  ┌──▼──────────────┐             │
│ MaterialChunk     │  │   Question      │◄────────────┘
├───────────────────┤  ├─────────────────┤
│ id (PK)           │  │ id (PK)         │
│ material_id (FK)  │  │ material_id (FK)│
│ content (TEXT)    │  │                 │
│ embedding (VECTOR)│  │ vignette (TEXT) │
│ page_number (INT) │  │ options (JSON)  │
│ chunk_index (INT) │  │ correct_index   │
│ created_at        │  │ explanation     │
└───────────────────┘  │                 │
                       │ topic           │
                       │ subtopic        │
                       │ difficulty      │
                       │ quality_score   │
                       │                 │
                       │ # Flags         │
                       │ is_verified     │
                       │ is_flagged      │
                       │                 │
                       │ # Stats         │
                       │ times_answered  │
                       │ times_correct   │
                       │                 │
                       │ created_at      │
                       └─────────────────┘

┌──────────────────────────────────────────────────────┐
│              Achievement                             │
├──────────────────────────────────────────────────────┤
│ id (PK)                                              │
│ name (VARCHAR)                                       │
│ description (TEXT)                                   │
│ icon (VARCHAR) # pixel art filename                 │
│ xp_reward (INT)                                      │
│ unlock_condition (JSON)                              │
│ created_at (DATETIME)                                │
└────────────┬─────────────────────────────────────────┘
             │
             │ 1:N
             │
   ┌─────────▼──────────────┐
   │  UserAchievement       │
   ├────────────────────────┤
   │ id (PK)                │
   │ user_id (FK) ──────────┼───┐
   │ achievement_id (FK)    │   │
   │ unlocked_at (DATETIME) │   │
   └────────────────────────┘   │
                                │
                ┌───────────────┘
                │
                │ Back to User table
                └──────────► (User table above)
```

---

## Authentication Flow

### JWT Token Flow with Refresh

```
┌──────────────────────────────────────────────────────────┐
│                  1. Initial Login                        │
└───────────────────────┬──────────────────────────────────┘
                        │
    User enters email + password
                        │
                        ▼
        POST /api/auth/login { email, password }
                        │
                        ▼
    ┌───────────────────────────────────────────┐
    │  Backend validates credentials            │
    │  - Check email exists                     │
    │  - Verify password (bcrypt.compare)       │
    │                                           │
    │  If valid:                                │
    │    - Generate Access Token (15 min)       │
    │    - Generate Refresh Token (7 days)      │
    │    - Store Refresh Token in DB            │
    │                                           │
    │  Return:                                  │
    │  {                                        │
    │    access_token: "eyJ...",                │
    │    refresh_token: "eyJ...",               │
    │    user: { id, email, name, xp, level }   │
    │  }                                        │
    └───────────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Frontend stores tokens       │
        │  - Access token in memory     │
        │    (React state)              │
        │  - Refresh token in           │
        │    localStorage (persistent)  │
        │                               │
        │  Redirect to dashboard        │
        └───────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│           2. Authenticated API Requests                  │
└───────────────────────┬──────────────────────────────────┘
                        │
    User makes API request (e.g., GET /api/materials)
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Frontend (Axios interceptor) │
        │  - Add Authorization header   │
        │    "Bearer {access_token}"    │
        └───────────────┬───────────────┘
                        │
                        ▼
        GET /api/materials
        Headers: { Authorization: "Bearer eyJ..." }
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Backend (Auth middleware)    │
        │  - Extract token from header  │
        │  - Verify JWT signature       │
        │  - Check expiration           │
        │                               │
        │  If valid:                    │
        │    - Decode payload           │
        │    - Get user_id              │
        │    - Inject into request      │
        │    - Continue to handler      │
        │                               │
        │  If invalid/expired:          │
        │    - Return 401 Unauthorized  │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  API Handler                  │
        │  - Access current_user        │
        │  - Process request            │
        │  - Return response            │
        └───────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│            3. Token Refresh Flow                         │
└───────────────────────┬──────────────────────────────────┘
                        │
    Access token expires after 15 minutes
                        │
                        ▼
        User makes API request
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Backend returns 401          │
        │  { error: "Token expired" }   │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Frontend (Axios response     │
        │   interceptor)                │
        │                               │
        │  1. Detect 401 error          │
        │  2. Get refresh_token from    │
        │     localStorage              │
        │  3. POST /api/auth/refresh    │
        │     { refresh_token }         │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Backend                      │
        │  - Verify refresh token       │
        │  - Check if token exists in DB│
        │    (not revoked)              │
        │  - Generate new access token  │
        │                               │
        │  Return:                      │
        │  { access_token: "eyJ..." }   │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Frontend                     │
        │  - Store new access token     │
        │  - Retry original request     │
        │    with new token             │
        └───────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   4. Logout Flow                         │
└───────────────────────┬──────────────────────────────────┘
                        │
    User clicks "Logout"
                        │
                        ▼
        POST /api/auth/logout
        Headers: { Authorization: "Bearer {access_token}" }
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Backend                      │
        │  - Decode access token        │
        │  - Get user_id                │
        │  - Delete refresh token from  │
        │    database                   │
        │    (revoke token)             │
        │                               │
        │  Return: { success: true }    │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Frontend                     │
        │  - Clear access token (memory)│
        │  - Clear refresh token        │
        │    (localStorage)             │
        │  - Clear user state (Zustand) │
        │  - Redirect to login page     │
        └───────────────────────────────┘
```

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         ▼
              ┌──────────────────────┐
              │   Cloudflare CDN     │
              │   - SSL termination  │
              │   - DDoS protection  │
              │   - Cache static     │
              └──────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌──────────────┐
│   Vercel      │ │   Railway     │ │  Supabase /  │
│  (Frontend)   │ │  (Backend)    │ │  Railway     │
│               │ │               │ │  (Database)  │
│ - Next.js 15  │ │ - FastAPI     │ │              │
│ - Static files│ │ - Uvicorn     │ │ - PostgreSQL │
│ - Edge fns    │ │ - Workers     │ │ - pgvector   │
│ - Auto-deploy │ │ - Auto-deploy │ │ - Backups    │
│   on push     │ │   on push     │ │              │
└───────────────┘ └───────┬───────┘ └──────┬───────┘
                          │                 │
                          │                 │
                  ┌───────▼────────┐ ┌──────▼──────┐
                  │  Redis Cloud   │ │   Qdrant    │
                  │  (Upstash)     │ │   Cloud     │
                  │                │ │  (Optional) │
                  │  - Cache       │ │             │
                  │  - Job queue   │ │  - Vectors  │
                  │  - Rate limits │ │  - Search   │
                  └────────────────┘ └─────────────┘

┌─────────────────────────────────────────────────────────┐
│                  MONITORING & LOGGING                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │   Sentry   │  │  Prometheus │  │    Grafana     │  │
│  │            │  │  + Grafana  │  │   Dashboards   │  │
│  │  - Error   │  │             │  │                │  │
│  │    tracking│  │  - Metrics  │  │  - Uptime      │  │
│  │  - Stack   │  │  - Alerts   │  │  - Performance │  │
│  │    traces  │  │             │  │  - Analytics   │  │
│  └────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Changelog

### 2025-10-09
- Initial system flows and diagrams document
- High-level architecture diagram
- Data flow diagrams (registration, document upload, AI chat, questions, quiz)
- Component interaction diagrams
- Database ERD
- Authentication flow with JWT refresh
- Deployment architecture

---

**Remember**: These diagrams are living documentation. Update as the system evolves and implementation details change.
