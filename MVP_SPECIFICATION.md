# Gamified Medical Learning Platform - MVP Specification

## Executive Summary

A psychology-first, gamified learning platform for USMLE Step 1 preparation that combines evidence-based learning science with an engaging Soft Kawaii UI aesthetic. The platform uses AI to create personalized learning pathways, generate representative practice questions, and provide adaptive coaching.

**Core Philosophy**: Psychology → Design → Function (equal importance)

---

## 1. Vision & Goals

### Primary Goal
Create an interactive, personalized learning experience that prepares medical students for USMLE Step 1 through adaptive teaching methods and representative practice questions.

### Success Metrics
- **Learning Effectiveness**: 70-80% target accuracy on practice questions
- **Engagement**: Daily study streak maintenance
- **Progress**: Clear skill tree advancement
- **Mastery**: Spaced repetition scheduling maintains long-term retention
- **Confidence**: User self-assessment alignment with actual performance

---

## 2. Psychology-First Framework

### Core Learning Principles

#### 2.1 Spaced Repetition (SM-2 Algorithm)
- Re-surface concepts at optimal intervals for long-term memory consolidation
- Algorithm adapts based on user performance (quality ratings 0-5)
- Critical for dense medical information retention

#### 2.2 Active Recall
- All interactions force information retrieval vs passive review
- MCQs, fill-in-the-blanks, case studies
- Higher-order thinking questions (not just memorization)

#### 2.3 Cognitive Load Theory
- Break complex topics into microlearning chunks
- Manage information complexity through clear visuals and layouts
- Reduce extraneous cognitive load to focus on intrinsic difficulty
- Progressive disclosure of information

#### 2.4 Constructivism
- AI coach guides users to build their own understanding
- Socratic questioning rather than direct fact presentation
- Encourage concept connections and mental model building
- Support for mind mapping and knowledge graph visualization

#### 2.5 Self-Determination Theory
- **Autonomy**: User control over learning path and pace
- **Competence**: Clear feedback, visible progress, mastery tracking
- **Relatedness**: (Future) Community features, study groups, leaderboards

### Gamification Strategy

#### Progress Mechanics
- **XP/Levels**: Earned through lessons, correct answers, streak maintenance
- **Skill Trees**: Visual curriculum with branches unlocking as topics are mastered
- **Progression Visibility**: Clear sense of advancement and choice

#### Reward System
- **Virtual Currency**: "Stetho-coins" earned through study
- **Cosmetic Rewards**: Avatar items, mascot customizations
- **Collectibles**: Badges for topic mastery (e.g., "Cardiology Master")
- **Achievements**: Milestone recognition

#### Design Principles
- **No Unnecessary Time Pressure**: Avoid timers during learning (separate timed exam mode)
- **Meaningful Rewards**: Tied to learning achievements, not just login
- **Balanced Motivation**: Enhance without distracting from core learning

---

## 3. User Experience Design

### 3.1 Design Aesthetic: Soft Kawaii + Subtle Pixel Accents

#### Color Palette
- **Base**: Soft pastels (light blues, pinks, greens, lavenders)
- **Accent**: Single saturated color for CTAs (coral, mint green)
- **Medical Content**: High contrast, professional presentation
- **Dark Mode**: Available for long study sessions

#### Visual Elements
- **Mascot/AI Coach**: Cute kawaii character with pixel-art animations
  - Happy, encouraging, thoughtful, celebratory expressions
  - Guides user through journey
  - Personified learning coach
- **UI Components**:
  - Rounded corners on buttons and containers (soft feel)
  - Simple, clean pixel-art icons for gamification elements
  - Pixelated progress bars and decorative elements
  - Clean sans-serif fonts for medical content (absolute clarity)
  - **Never** pixel fonts for important medical information

#### Content vs Chrome Separation
- **Chrome (UI)**: Kawaii/pixelated aesthetic, playful, encouraging
- **Content (Medical)**: Professional, clear, accessible
- Diagrams and text presented with medical-grade clarity

### 3.2 User Journey Flow

#### Phase 1: Onboarding & Upload (5-10 minutes)
1. **Welcome Screen**: Brief intro to platform, mascot introduction
2. **Account Setup**: Simple sign-up, learning preferences survey
3. **Goal Setting**: USMLE Step 1 prep, target date, study time availability
4. **Material Upload**:
   - Clear drag-and-drop interface
   - Supported formats: PDF, DOCX, TXT, MD, EPUB
   - Multi-file upload capability
   - Real-time processing status
5. **Initial Analysis**:
   - AI analyzes uploaded content
   - Generates topic hierarchy
   - Suggests starting point on skill tree
   - Creates initial diagnostic assessment (optional)

#### Phase 2: Dashboard/Home (Daily Entry Point)
- **Hero Section**: Current position on learning map (skill tree)
- **Daily Goals Card**:
  - "Review 3 topics"
  - "Complete 1 practice quiz"
  - "Maintain your 7-day streak!"
- **Due Reviews**: Topics scheduled for spaced repetition
- **Quick Stats**: XP, level, streak, mastery percentage
- **Mascot Greeting**: Personalized daily message
- **Quick Actions**: Start session, browse topics, view progress

#### Phase 3: Learning Session (20-45 minutes)
1. **Session Initiation**:
   - AI Coach introduces topic (e.g., "Ready to tackle the Renin-Angiotensin System?")
   - Session type indicator (New learning, Review, Assessment)
   - Time estimate displayed

2. **Interactive Content Delivery**:
   - One concept at a time (chunking)
   - Mix of formats: text, diagrams, animations
   - Interactive elements embedded:
     - Quick recall questions
     - Fill-in-the-blank
     - Diagram labeling
     - Clinical scenario analysis

3. **Adaptive Teaching**:
   - AI Coach provides:
     - Explanations tailored to user level
     - Socratic questions to guide understanding
     - Mnemonics and analogies
     - Real-world clinical connections
   - Adjusts based on user responses:
     - Struggles → more explanations, easier questions
     - Success → advance complexity, deeper concepts

4. **Real-time Feedback**:
   - Immediate response to answers
   - Detailed explanations for correct and incorrect options
   - Encouragement and positive reinforcement
   - Progress indicators throughout session

#### Phase 4: Assessment (10-15 minutes)
1. **Quiz Introduction**: Number of questions, topic coverage
2. **NBME-Style Questions**:
   - Clinical vignette format
   - Second/third-order questions
   - 4-5 answer choices
   - Step 1 representative difficulty

3. **Per-Question Flow**:
   - Read vignette and question
   - Select answer
   - **Confidence Rating**: 1-5 scale (metacognitive practice)
   - Immediate feedback with detailed explanation
   - Explanation for ALL answer choices (why right/wrong)
   - Links back to learning material for review

4. **Quiz Summary**:
   - Score and accuracy percentage
   - Time taken
   - Strengths and weaknesses identified
   - Topics needing review highlighted

#### Phase 5: Progress Review (2-5 minutes)
- **Session Summary**:
  - XP gained
  - New badges/achievements unlocked
  - Skill tree progression animation
  - Topics mastered
  - New topics unlocked

- **Mascot Celebration**: Encouraging message, visual animation

- **Next Steps Recommendation**:
  - Suggested next session
  - Reviews coming due
  - Weak areas to address

### 3.3 Navigation Structure

```
├── Dashboard (Home)
│   ├── Daily Goals
│   ├── Skill Tree Overview
│   └── Quick Actions
│
├── Learning Map (Skill Tree)
│   ├── View all topics
│   ├── Filter by system/category
│   └── See progress and prerequisites
│
├── Study Session
│   ├── Active Learning
│   ├── Spaced Repetition Review
│   └── Practice Questions
│
├── Progress Tracker
│   ├── Overall Statistics
│   ├── Topic Mastery Breakdown
│   ├── Streak Calendar
│   └── Performance Analytics
│
├── Question Bank
│   ├── Browse by Topic
│   ├── Custom Quiz Builder
│   └── Saved/Flagged Questions
│
├── Materials Library
│   ├── Uploaded Materials
│   ├── Upload New
│   └── Processing Queue
│
└── Profile & Settings
    ├── Learning Preferences
    ├── Study Schedule
    ├── Customization (avatar, theme)
    └── Account Settings
```

---

## 4. Technical Architecture

### 4.1 Technology Stack

#### Frontend
**Recommendation**: React with TypeScript
- **Framework**: Next.js 14+ (App Router)
- **UI Library**:
  - Tailwind CSS (rapid styling)
  - shadcn/ui (accessible components)
  - Framer Motion (animations)
- **State Management**: Zustand or TanStack Query
- **Real-time**: Socket.io client
- **Charts**: Recharts or Chart.js
- **Icons**: Lucide React + custom pixel art

**Design System**:
```
├── Colors: Pastel palette with accent
├── Typography: Inter (UI), Merriweather (content)
├── Spacing: 8px base grid
├── Components: Kawaii-themed with rounded corners
└── Animations: Smooth, delightful micro-interactions
```

#### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async, type-safe, auto-docs)
- **API Style**: Hybrid REST + WebSocket
  - REST for CRUD operations
  - WebSocket for real-time learning sessions
  - SSE for streaming LLM responses

#### Database
- **Primary DB**: PostgreSQL 16+ with pgvector extension
  - User data, progress, questions
  - Vector embeddings for semantic search
  - JSONB for flexible metadata
- **Cache**: Redis 7
  - Session data
  - API response caching
  - Queue for background jobs

#### AI/LLM Integration
- **Primary LLM**: Claude 3.5 Sonnet
  - Medical reasoning and Socratic teaching
  - Long context window (200k tokens)
  - Strong instruction following
- **Secondary LLM**: GPT-4o-mini
  - MCQ generation (cost-effective)
  - Bulk processing tasks
- **Specialist LLM**: Gemini 1.5 Flash
  - Initial document analysis
  - Very cost-effective for bulk operations
- **Embeddings**: OpenAI text-embedding-3-small
  - 1536 dimensions
  - Cost-effective, high quality

#### Vector Database
- **Choice**: Qdrant (self-hosted) or Pinecone (managed)
- **Purpose**: Semantic search of learning materials
- **Strategy**: Hybrid search (vector + keyword) with reranking

#### File Storage
- **Local**: Filesystem for uploaded documents
- **Cloud** (Future): S3-compatible storage (AWS S3 or MinIO)

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration** (Production): Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry

### 4.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Next.js + Tailwind + Socket.io                     │
│  (Soft Kawaii UI with Pixel Accents)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    API Gateway (FastAPI)                     │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ REST APIs    │ WebSocket    │ SSE for Streaming    │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼─────────┐
│ Auth   │  │ Cache  │  │ Rate Limit  │
│ Service│  │ Redis  │  │ Middleware  │
└───┬────┘  └───┬────┘  └───┬─────────┘
    │            │            │
    └────────────┼────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                     Core Services Layer                      │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Document        │  │ AI Coach        │                  │
│  │ Processor       │  │ Orchestrator    │                  │
│  │                 │  │                 │                  │
│  │ • Parse         │  │ • LLM Router    │                  │
│  │ • Chunk         │  │ • Fallback      │                  │
│  │ • Embed         │  │ • Streaming     │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                     │                           │
│  ┌────────▼────────┐  ┌────────▼────────┐                  │
│  │ Learning        │  │ Question        │                  │
│  │ Engine          │  │ Generator       │                  │
│  │                 │  │                 │                  │
│  │ • Path Gen      │  │ • MCQ Gen       │                  │
│  │ • Adaptation    │  │ • NBME Style    │                  │
│  │ • Difficulty    │  │ • Explanation   │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                     │                           │
│  ┌────────▼────────┐  ┌────────▼────────┐                  │
│  │ Progress        │  │ Gamification    │                  │
│  │ Tracker         │  │ Service         │                  │
│  │                 │  │                 │                  │
│  │ • Spaced Rep    │  │ • XP/Levels     │                  │
│  │ • SM-2 Algo     │  │ • Achievements  │                  │
│  │ • Mastery       │  │ • Streaks       │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────────┐ ┌▼──────────┐ ┌▼───────────┐
│ PostgreSQL │ │  Qdrant   │ │   Redis    │
│  +pgvector │ │  (Vector  │ │  (Cache +  │
│            │ │   Store)  │ │   Queue)   │
└────────────┘ └───────────┘ └────────────┘
```

### 4.3 Data Models (Summary)

#### Core Entities
1. **User**: Profile, preferences, gamification stats (XP, level, streak)
2. **LearningMaterial**: Uploaded files, processing status, metadata
3. **MaterialChunk**: Segmented content with vector embeddings
4. **LearningPath**: Personalized curriculum, goal-oriented
5. **LearningPathNode**: Individual topics in path, prerequisites, status
6. **Question**: MCQs with explanations, difficulty, topics
7. **QuestionResponse**: User answers, correctness, confidence, timing
8. **UserProgress**: Spaced repetition params (SM-2), mastery level
9. **LearningSession**: Study session record, XP earned, performance
10. **Achievement**: Badges, collectibles, unlocks

### 4.4 API Design

#### REST Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

POST   /api/v1/materials/upload
GET    /api/v1/materials
GET    /api/v1/materials/{id}
POST   /api/v1/materials/{id}/process

GET    /api/v1/learning-paths
POST   /api/v1/learning-paths
GET    /api/v1/learning-paths/{id}
PUT    /api/v1/learning-paths/{id}

POST   /api/v1/sessions
GET    /api/v1/sessions/{id}
POST   /api/v1/sessions/{id}/end

GET    /api/v1/questions
POST   /api/v1/questions/generate
POST   /api/v1/questions/{id}/answer

GET    /api/v1/progress
GET    /api/v1/progress/due-reviews
POST   /api/v1/progress/{id}/review

GET    /api/v1/gamification/profile
GET    /api/v1/gamification/achievements
POST   /api/v1/gamification/claim-reward
```

#### WebSocket Endpoints
```
WS     /ws/session/{session_id}
       - Events: start, content, answer, feedback, adapt, end
```

### 4.5 AI Integration Architecture

#### Cost Optimization Strategy
- **Semantic Caching**: 92% similarity threshold (60% savings)
- **Model Routing**: Right model for right task (30% savings)
- **Request Batching**: Coalesce similar requests (20% savings)
- **Target**: $10-15/month for 100 questions/day (76% cost reduction)

#### RAG Pipeline
1. **Document Upload** → Parser (PyPDF2, python-docx)
2. **Chunking** → Hierarchical + semantic (512 tokens, 128 overlap)
3. **Embedding** → OpenAI text-embedding-3-small
4. **Storage** → Qdrant vector database
5. **Retrieval** → Hybrid search (vector + keyword) + reranking
6. **Context** → Inject into LLM prompts

#### Adaptive Learning Flow
```
User Performance → Difficulty Calculator
                   ↓
       [Target: 70-80% accuracy]
                   ↓
    ┌──────────────┴──────────────┐
    │                             │
Too Easy (>85%)          Too Hard (<65%)
    │                             │
    ▼                             ▼
Increase                    Decrease
Difficulty                  Difficulty
    │                             │
    └──────────────┬──────────────┘
                   ▼
          Update Learning Path
                   ▼
        Generate Next Content
```

---

## 5. MVP Feature Requirements

### 5.1 Core Features (Must-Have)

#### F1: User Authentication & Profile
- Sign up / Login
- Basic profile management
- Learning preferences (study time, pace)
- Privacy controls (personal use)

#### F2: Material Upload & Processing
- Upload PDF, DOCX, TXT, MD files
- Multi-file upload support
- Processing status indication
- Automatic content analysis and chunking
- Topic extraction and hierarchy generation
- Error handling and retry mechanisms

#### F3: AI-Powered Learning Path
- Generate personalized curriculum from uploaded materials
- Visual skill tree representation
- Topic prerequisites and dependencies
- Progress tracking per topic
- Unlocking mechanism (master prerequisites → unlock next)
- Path adaptation based on performance

#### F4: Interactive Learning Sessions
- AI Coach-guided study sessions
- Mixed content delivery (text, diagrams, questions)
- Socratic questioning and explanations
- Real-time adaptation to user understanding
- Session pause/resume functionality
- Progress saving

#### F5: Practice Questions (MCQs)
- NBME/USMLE Step 1 style questions
- Clinical vignette format
- 4-5 answer choices
- Detailed explanations for all options
- Difficulty levels (1-5)
- Topic tagging
- Confidence-based assessment
- Timed and untimed modes

#### F6: Spaced Repetition System
- SM-2 algorithm implementation
- Automatic scheduling of reviews
- "Due today" dashboard section
- Performance-based interval adjustment
- Review queue management
- Retention statistics

#### F7: Progress Tracking & Analytics
- Overall progress percentage
- Topic mastery breakdown
- Study time tracking
- Accuracy rates over time
- Streak tracking (daily, weekly)
- Knowledge gap identification
- Performance trends

#### F8: Gamification System
- XP points for activities
- Level progression
- Daily/weekly streaks
- Skill tree visualization
- Badges and achievements
- Virtual currency (Stetho-coins)
- Customizable avatar/mascot

#### F9: Soft Kawaii UI
- Pastel color palette
- Rounded, friendly interface
- Pixel-art accent elements
- Animated mascot/coach character
- Smooth transitions and micro-interactions
- Responsive design (desktop, tablet, mobile)
- Dark mode support

### 5.2 Secondary Features (Nice-to-Have for MVP)

#### F10: Question Bank Browser
- Filter by topic, difficulty, status
- Search functionality
- Bookmark/flag questions
- Create custom quizzes

#### F11: Performance Analytics Dashboard
- Detailed charts and graphs
- Strengths and weaknesses visualization
- Comparison over time
- Export reports

#### F12: Study Schedule Planner
- Calendar integration
- Study session reminders
- Daily goal setting
- Time blocking

### 5.3 Future Features (Post-MVP)

- Community features (study groups, leaderboards)
- Video content integration
- Flashcard mode
- Voice interaction with AI coach
- Mobile app (React Native / Flutter)
- Collaborative note-taking
- Integration with Anki
- Multi-user support (classes, institutions)
- Advanced analytics (predictive modeling)
- Content marketplace

---

## 6. MVP Development Phases

### Phase 0: Setup & Foundation (1 week)
- [ ] Initialize project repositories (frontend + backend)
- [ ] Set up development environment (Docker Compose)
- [ ] Configure databases (PostgreSQL, Redis, Qdrant)
- [ ] Set up basic CI/CD pipeline
- [ ] Design system setup (colors, typography, components)
- [ ] API structure planning

**Deliverables**:
- Working development environment
- Basic design system
- Repository structure
- API documentation framework

### Phase 1: Core Infrastructure (2 weeks)

#### Backend
- [ ] User authentication system (JWT)
- [ ] Database models and migrations
- [ ] Basic REST API endpoints
- [ ] File upload handling
- [ ] LLM integration wrapper (Claude, GPT, Gemini)
- [ ] Error handling and logging

#### Frontend
- [ ] Authentication screens (login, signup)
- [ ] Dashboard layout
- [ ] Navigation structure
- [ ] Mascot character design and animations
- [ ] Component library foundation

**Deliverables**:
- Working authentication
- Basic frontend navigation
- API endpoint structure
- LLM integration ready

### Phase 2: Document Processing & RAG (2 weeks)
- [ ] Document parser (PDF, DOCX, etc.)
- [ ] Content chunking system
- [ ] Embedding generation pipeline
- [ ] Vector database setup (Qdrant)
- [ ] Semantic search implementation
- [ ] Material upload UI
- [ ] Processing status indicators

**Deliverables**:
- Working document upload and processing
- Semantic search functional
- Materials library UI

### Phase 3: Learning Path & AI Coach (3 weeks)
- [ ] Learning path generation algorithm
- [ ] Skill tree data structure
- [ ] Adaptive difficulty system
- [ ] AI Coach prompt engineering
- [ ] Interactive session flow (WebSocket)
- [ ] Content delivery UI
- [ ] Skill tree visualization
- [ ] Session management

**Deliverables**:
- Generated learning paths from materials
- Interactive learning sessions
- Visual skill tree
- AI Coach conversational interface

### Phase 4: Questions & Assessment (2 weeks)
- [ ] MCQ generation system (LLM-powered)
- [ ] Question database and API
- [ ] Quiz interface
- [ ] Answer submission and feedback
- [ ] Confidence rating system
- [ ] Detailed explanation display
- [ ] Question bank browser

**Deliverables**:
- Working quiz system
- NBME-style questions generated
- Detailed feedback UI

### Phase 5: Spaced Repetition & Progress (2 weeks)
- [ ] SM-2 algorithm implementation
- [ ] Review scheduling system
- [ ] Progress tracking database
- [ ] User progress API endpoints
- [ ] Dashboard with due reviews
- [ ] Progress analytics UI
- [ ] Mastery level indicators

**Deliverables**:
- Spaced repetition system functional
- Progress tracking dashboard
- Review queue management

### Phase 6: Gamification (2 weeks)
- [ ] XP calculation system
- [ ] Level progression logic
- [ ] Streak tracking
- [ ] Achievement system
- [ ] Badge design and unlock conditions
- [ ] Virtual currency system
- [ ] Gamification UI elements
- [ ] Profile customization

**Deliverables**:
- Complete gamification system
- Visual rewards and achievements
- Customizable profile

### Phase 7: Polish & Testing (2 weeks)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Comprehensive testing (unit, integration, e2e)
- [ ] Bug fixes
- [ ] Loading states and error handling
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Documentation

**Deliverables**:
- Polished, production-ready MVP
- Test coverage >80%
- User documentation

### Phase 8: Deployment & Launch (1 week)
- [ ] Production environment setup
- [ ] Database migration scripts
- [ ] Deployment automation
- [ ] Monitoring and alerting
- [ ] Performance testing
- [ ] Security audit
- [ ] Launch preparation

**Deliverables**:
- Deployed production system
- Monitoring dashboards
- Launch-ready platform

**Total Timeline**: ~16 weeks (4 months)

---

## 7. Success Criteria for MVP

### Functional Requirements
✅ Users can upload materials and have them processed
✅ AI generates personalized learning paths from materials
✅ Interactive learning sessions adapt to user performance
✅ NBME-style MCQs are generated with quality explanations
✅ Spaced repetition schedules reviews correctly
✅ Gamification elements motivate continued engagement
✅ Progress is tracked and visualized clearly

### Quality Requirements
✅ **Performance**: Page load <2s, API response <500ms
✅ **Accuracy**: AI-generated questions are medically accurate
✅ **Reliability**: 99.9% uptime target
✅ **Security**: User data encrypted, secure authentication
✅ **Usability**: 90%+ task completion rate in user testing
✅ **Accessibility**: WCAG 2.1 AA compliance
✅ **Cost**: <$15/month for personal use (100 questions/day)

### User Experience Requirements
✅ Onboarding takes <10 minutes
✅ Learning sessions are engaging and not frustrating
✅ UI feels delightful and encouraging, not childish
✅ Medical content is professional and clear
✅ Navigation is intuitive (users find features without help)
✅ Feedback is immediate and helpful

---

## 8. Technical Specifications

### 8.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | <500ms | p95 |
| Page Load Time | <2s | First Contentful Paint |
| LLM Response Time | <3s | Streaming start |
| Document Processing | <30s | Per PDF (avg 50 pages) |
| Cache Hit Rate | >60% | Redis metrics |
| Database Query Time | <100ms | p95 |
| Uptime | 99.9% | Monthly |

### 8.2 Scalability Considerations

#### Current (MVP)
- **Users**: 1 (personal use)
- **Materials**: ~100 PDFs
- **Questions**: ~10,000 generated
- **Sessions**: ~30/month
- **Storage**: ~10GB

#### Near Future (6-12 months)
- **Users**: 10-50 (friends, classmates)
- **Materials**: ~1,000 PDFs
- **Questions**: ~100,000 generated
- **Sessions**: ~500/month
- **Storage**: ~100GB

#### Architecture designed to scale to:
- 1,000+ users (multi-tenancy)
- Kubernetes deployment
- Horizontal scaling of API servers
- Read replicas for database
- CDN for static assets

### 8.3 Security Requirements

- [ ] HTTPS everywhere (TLS 1.3)
- [ ] JWT-based authentication with refresh tokens
- [ ] Password hashing (bcrypt, cost factor 12)
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (CSP headers)
- [ ] CORS configuration
- [ ] Secrets management (environment variables, not in code)
- [ ] Regular dependency updates
- [ ] API key rotation policy
- [ ] User data encryption at rest
- [ ] Audit logging for sensitive operations

### 8.4 Cost Projections

#### Development Costs (One-time)
- **Developer Time**: 640 hours @ $0 (self-built) = $0
- **Design Assets**: Mascot, icons, illustrations = $200-500 (Fiverr/freelance)
- **Domain & Hosting** (First year): $100

**Total One-time**: ~$300-600

#### Monthly Operating Costs (Personal Use)
- **LLM APIs** (100 questions/day, optimized): $10-15
- **Database** (self-hosted): $0
- **Storage** (10GB): $0.23 (S3)
- **Hosting** (VPS or Railway): $15-25
- **Monitoring** (Sentry free tier): $0
- **Domain**: $1/month

**Total Monthly**: ~$26-41/month

#### With Heavy Optimization (local models, caching):
- **LLM APIs**: $5-8 (aggressive caching)
- **Self-hosted** (home server): $0
- **Domain**: $1

**Total Monthly (Optimized)**: ~$6-9/month

---

## 9. Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM API rate limits | High | Medium | Implement fallback, caching, multiple providers |
| Poor question quality | High | Medium | Human review system, quality scoring, feedback loop |
| Slow document processing | Medium | High | Async processing, progress indicators, optimization |
| Vector search accuracy | Medium | Medium | Hybrid search, reranking, tuning |
| Cost overruns | Medium | Medium | Aggressive caching, model routing, monitoring |
| Data loss | High | Low | Regular backups, database replication |

### Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't find it engaging | High | Medium | User testing, iteration, gamification tuning |
| Learning effectiveness unclear | High | Medium | Track performance metrics, A/B testing |
| UI too playful/not serious | Medium | Medium | Balance testing, user feedback, adjustable themes |
| Overwhelming complexity | Medium | Medium | Progressive disclosure, excellent onboarding |
| Dependency on specific LLM | Medium | Low | Multi-provider architecture, abstraction layer |

---

## 10. Next Steps

### Immediate Actions (Week 1)
1. **Approve Specification**: Review and sign-off on this MVP spec
2. **Choose Tech Stack Variants**:
   - Frontend: React vs Vue vs Svelte (Recommendation: React/Next.js)
   - Vector DB: Qdrant (self-hosted) vs Pinecone (managed)
   - Deployment: VPS vs Railway vs AWS
3. **Set Up Development Environment**:
   - Create GitHub repositories
   - Initialize projects
   - Docker Compose setup
4. **Design System Kickoff**:
   - Finalize color palette
   - Design mascot character
   - Create component mockups in Figma
5. **API Key Acquisition**:
   - Anthropic (Claude)
   - OpenAI (GPT-4, embeddings)
   - Google (Gemini)

### Questions for You

Before we proceed with implementation:

1. **Timeline**: Is 4 months acceptable, or do you need faster MVP? (Can adjust scope)
2. **Technical Skills**: Are you comfortable with React/Python, or should we adjust stack?
3. **Deployment**: Self-host vs managed services preference? (Cost vs convenience)
4. **Design**: Do you have specific mascot/character ideas, or should we design from scratch?
5. **Content**: Do you have USMLE materials ready to upload, or need sample content?
6. **Budget**: Is $300-600 setup + $25-40/month acceptable?
7. **Team**: Solo development or will you have help?

---

## 11. Appendices

### A. Technology Alternatives Considered

#### Frontend Frameworks
- **React**: ✅ Chosen - Large ecosystem, excellent tooling
- **Vue**: Good alternative, simpler learning curve
- **Svelte**: Fastest, but smaller ecosystem
- **Angular**: Overkill for MVP

#### Backend Frameworks
- **FastAPI**: ✅ Chosen - Modern, async, Python
- **Django**: Heavier, more batteries included
- **Node.js/Express**: JavaScript everywhere, but weaker AI ecosystem
- **Ruby on Rails**: Rapid but declining community

#### Databases
- **PostgreSQL**: ✅ Chosen - Robust, pgvector extension
- **MongoDB**: Flexible schema, but less structured
- **MySQL**: Mature, but no vector support
- **Supabase**: PostgreSQL + BaaS, good for rapid development

#### Vector Databases
- **Qdrant**: ✅ Chosen for self-hosted - Fast, easy to deploy
- **Pinecone**: ✅ Chosen for managed - Zero ops, scales automatically
- **Weaviate**: Good but more complex
- **Milvus**: Enterprise-grade, overkill for MVP

### B. Design Inspiration References

#### Kawaii UI Examples
- Duolingo (gamification, mascot)
- Habitica (RPG gamification)
- Forest (minimalist gamification)
- Notion (clean, modern, friendly)

#### Medical Education Platforms
- Anki (spaced repetition gold standard)
- UWorld (question quality benchmark)
- Osmosis (visual learning)
- Amboss (knowledge integration)

#### Aesthetic References
- Animal Crossing (soft, inviting)
- Stardew Valley (pixel art charm)
- Pokémon (progression systems)
- Celeste (encouraging design)

### C. Glossary

- **SM-2**: SuperMemo 2 algorithm for spaced repetition
- **NBME**: National Board of Medical Examiners
- **USMLE**: United States Medical Licensing Examination
- **MCQ**: Multiple Choice Question
- **RAG**: Retrieval Augmented Generation
- **LLM**: Large Language Model
- **pgvector**: PostgreSQL extension for vector similarity search
- **JWT**: JSON Web Token
- **WCAG**: Web Content Accessibility Guidelines

---

## Document Control

**Version**: 1.0
**Date**: 2025-10-09
**Author**: Claude Code (AI Architect)
**Status**: Draft - Awaiting Approval
**Next Review**: Upon user feedback

---

**Ready to proceed with implementation? Let me know your feedback on this specification!**
