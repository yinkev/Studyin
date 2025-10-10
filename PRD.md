# Product Requirements Document (PRD)
# StudyIn - Gamified Medical Learning Platform

> **Living Document**: Comprehensive product specification for USMLE Step 1 preparation platform

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Planning Phase
**Owner**: Kevin Yin
**Target Launch**: Phase-based (no timelines)

---

## Executive Summary

### Product Vision

**StudyIn** is a psychology-first gamified learning platform designed to transform USMLE Step 1 preparation from a stressful, overwhelming experience into an engaging, personalized journey. By combining advanced AI coaching, evidence-based learning science, and delightful gamification wrapped in a unique Soft Kawaii Brutalist UI, StudyIn addresses the core pain points of medical students: anxiety, motivation fatigue, and ineffective study methods.

**One-Line Pitch**:
"Duolingo meets Anki meets AI tutor, specifically engineered for medical students preparing for Step 1."

---

### Problem Statement

**Current Pain Points**:

1. **High Anxiety**:
   - USMLE Step 1 is high-stakes (career-defining)
   - Traditional study platforms are clinical, intimidating
   - Overwhelming amount of content (10,000+ facts to memorize)
   - Delayed feedback (weeks until practice exam results)

2. **Motivation Fatigue**:
   - Study sessions are 6-12 months long
   - Monotonous flashcard reviews
   - No sense of progress or achievement
   - Isolation (solo studying)

3. **Ineffective Methods**:
   - Students use multiple disconnected tools (Anki, UWorld, First Aid, YouTube)
   - No personalized learning path
   - Passive reading instead of active recall
   - Inconsistent spaced repetition

**Impact**:
- 40% of students report severe anxiety during Step 1 prep (source: AAMC surveys)
- Average study time: 300-400 hours over 6 months
- Burnout rates increasing year-over-year
- Suboptimal performance due to stress and poor methods

---

### Solution Overview

**What StudyIn Does**:

1. **Upload → AI Analysis**: Student uploads their lecture notes, textbooks, or any study materials. AI analyzes content and creates a personalized learning pathway.

2. **Adaptive Learning Path**: Based on uploaded content and student performance, AI generates a dynamic skill tree with topics to master in optimal order.

3. **Interactive AI Coach**: Socratic teaching AI that adapts to student's level, asks probing questions, provides hints (not answers), and encourages critical thinking.

4. **NBME-Style MCQ Practice**: AI generates Step 1-representative multiple choice questions with detailed explanations, using student's own materials.

5. **Spaced Repetition System**: SM-2 algorithm schedules reviews at optimal intervals to maximize retention and minimize forgetting.

6. **Gamification Layer**: XP, levels, streaks, achievements, pixel art mascot - all designed with psychological intent to reduce anxiety and increase motivation.

7. **Progress Tracking**: Comprehensive analytics showing mastery levels, weak areas, study patterns, and predictive performance metrics.

**Unique Value Proposition**:
- **Personal**: Uses YOUR materials, not generic content
- **Psychology-First**: Every design decision rooted in learning science and anxiety reduction
- **AI-Powered**: Personalized coaching, not one-size-fits-all
- **All-in-One**: No need for 5 different apps
- **Delightful**: Soft Kawaii Brutalist UI makes studying less intimidating

---

### Success Metrics (Post-Launch)

**North Star Metric**: **Daily Active Study Sessions**
(A student who studies daily is learning effectively and not burning out)

**Key Performance Indicators (KPIs)**:

1. **Engagement**:
   - Daily Active Users (DAU): Target 70% of total users
   - Study streak length: Target 14+ days average
   - Session duration: Target 45-60 minutes (optimal study session)
   - Questions per session: Target 20-40 MCQs

2. **Learning Effectiveness**:
   - Retention rate: Target 85%+ on spaced repetition reviews
   - Question accuracy: Trending upward over time
   - Mastery progression: 10+ topics mastered per month

3. **Satisfaction**:
   - Self-reported anxiety reduction: Target 30%+ decrease
   - NPS (Net Promoter Score): Target 50+
   - Feature usage: 80%+ of users using AI coach weekly

4. **Retention**:
   - 7-day retention: Target 60%+
   - 30-day retention: Target 40%+
   - Completion rate: 80%+ of started learning paths

**Anti-Metrics** (What to avoid):
- Session duration > 90 min (cognitive fatigue)
- Streak anxiety (guilt from breaking streaks)
- Gamification addiction (studying for XP, not learning)

---

## User Personas

### Primary Persona: Sarah - The Anxious High Achiever

**Demographics**:
- Age: 24
- Status: MS2 (second-year medical student)
- Location: Urban medical school
- Study timeline: 6 months until Step 1

**Goals**:
- Score 240+ on Step 1 (competitive for residency)
- Retain information long-term (not just for exam)
- Reduce study anxiety and burnout
- Optimize study efficiency

**Pain Points**:
- Overwhelmed by amount of content
- Anxiety about exam performance
- Unsure if study methods are effective
- Difficulty maintaining motivation for 6 months
- Feels isolated in solo study

**Behaviors**:
- Studies 6-8 hours/day
- Uses Anki (3000+ cards), UWorld (2000+ questions), First Aid (reference)
- Watches YouTube lectures (Pathoma, Sketchy)
- Tracks progress in Excel spreadsheet
- Active in online study groups (Reddit r/step1)

**How StudyIn Helps**:
- Soft Kawaii UI reduces interface-induced anxiety
- AI coach provides companionship and guidance
- Clear progress metrics reduce uncertainty
- Gamification maintains motivation
- All-in-one platform reduces tool-switching overhead

---

### Secondary Persona: Marcus - The Efficient Pragmatist

**Demographics**:
- Age: 26
- Status: MS3 (third-year, retaking Step 1)
- Location: Studying while on clinical rotations
- Study timeline: 3 months (limited time)

**Goals**:
- Improve score from 215 to 230+ (retake)
- Focus on weak areas efficiently
- Study during limited free time
- Balance with clinical responsibilities

**Pain Points**:
- Limited study time (2-3 hours/day max)
- Needs to focus on weakest topics
- Previous methods didn't work
- Lacks confidence after first attempt
- Difficulty finding targeted practice

**Behaviors**:
- Studies in 30-60 min blocks between rotations
- Needs mobile-friendly platform
- Prefers concise explanations over long lectures
- Wants data-driven insights into weaknesses
- Uses Anki during commute

**How StudyIn Helps**:
- Adaptive difficulty focuses on weak areas
- Quick study sessions (30 min) with measurable progress
- Analytics pinpoint exact topics to review
- Mobile-responsive for studying anywhere
- AI coach provides targeted practice

---

### Tertiary Persona: Priya - The Visual Learner

**Demographics**:
- Age: 23
- Status: MS2
- Location: International medical graduate (IMG) studying for USMLE
- Study timeline: 12 months (needs extra time for English medical terminology)

**Goals**:
- Master medical English terminology
- Understand concepts deeply (not just memorize)
- Build confidence for exam
- Match into US residency program

**Pain Points**:
- English medical terms are challenging
- Needs visual aids to understand concepts
- Feels disadvantaged compared to US students
- Lacks personalized guidance
- Difficulty finding IMG-specific resources

**Behaviors**:
- Studies 10-12 hours/day (dedicated study period)
- Heavily uses Sketchy (visual mnemonics)
- Writes detailed notes with diagrams
- Practices questions repeatedly
- Studies in study groups with other IMGs

**How StudyIn Helps**:
- AI coach provides Socratic questioning (deep understanding)
- Can upload notes with diagrams (RAG includes images)
- Explanations tailored to learning style
- Non-judgmental AI coach builds confidence
- Visual skill tree shows progress

---

## Functional Requirements

### FR1: Document Upload & Processing

**User Story**:
As a medical student, I want to upload my lecture notes, textbooks, and study materials so that the AI can create personalized learning content from MY specific curriculum.

**Requirements**:

1.1 **File Upload**:
- Support formats: PDF, DOCX, TXT, images (PNG, JPG for diagrams)
- Max file size: 50 MB per file (configurable)
- Drag-and-drop interface
- Bulk upload (up to 20 files at once)
- Upload progress indicator
- Error handling for corrupt/unsupported files

1.2 **Document Processing**:
- Extract text from PDF (OCR if needed)
- Parse DOCX structure (headings, lists, tables)
- Process images (diagrams, charts) with OCR
- Background processing (non-blocking)
- Processing status updates (real-time via WebSocket)
- Estimated processing time displayed

1.3 **Content Organization**:
- Auto-detect topics from content (ML-based classification)
- Suggest categorization (Cardiology, Neurology, etc.)
- User can edit/override categorization
- Group related documents
- Add tags and metadata

**Acceptance Criteria**:
- [ ] Can upload 20 PDF files (10 MB each) without errors
- [ ] Processing starts within 5 seconds of upload
- [ ] User sees real-time processing progress
- [ ] Processing completes within 2 minutes for 50-page PDF
- [ ] Extracted text accuracy > 95%
- [ ] OCR works for scanned documents

**Priority**: P0 (Critical - Phase 2)

---

### FR2: AI-Powered Learning Path Generation

**User Story**:
As a medical student, I want the AI to analyze my uploaded content and create a personalized learning path that tells me what to study in the optimal order.

**Requirements**:

2.1 **Content Analysis**:
- Analyze uploaded documents for topics, subtopics, concepts
- Identify prerequisites (e.g., must learn anatomy before pathology)
- Estimate difficulty levels
- Detect knowledge gaps

2.2 **Skill Tree Generation**:
- Create directed acyclic graph (DAG) of topics
- Visualize as interactive skill tree
- Show prerequisites as locked nodes
- Recommend starting points
- Adapt based on user progress

2.3 **Personalization**:
- Ask user about current knowledge level
- Adjust path based on quiz performance
- Prioritize weak areas
- Allow manual reordering
- Suggest daily study plan

**Acceptance Criteria**:
- [ ] Skill tree contains all topics from uploaded content
- [ ] Prerequisites are logically correct (no circulardependencies)
- [ ] User can click on node to start studying
- [ ] Locked nodes show prerequisites
- [ ] Path adapts when user performs poorly on topic

**Priority**: P0 (Critical - Phase 3)

---

### FR3: Interactive AI Coach (RAG + LLM)

**User Story**:
As a medical student, I want to interact with an AI coach that teaches me using the Socratic method, asking questions and providing hints instead of just giving me answers.

**Requirements**:

3.1 **Socratic Teaching**:
- Ask probing questions to stimulate thinking
- Provide hints when student is stuck (not full answers)
- Use uploaded content as context (RAG)
- Adapt difficulty to student's level
- Encourage critical thinking

3.2 **Real-Time Chat Interface**:
- WebSocket connection for low-latency responses
- Streaming responses (word-by-word display)
- Message history preservation
- Typing indicators
- Error recovery (retry on connection loss)

3.3 **Context-Aware Responses**:
- Retrieve relevant chunks from uploaded documents
- Show source citations (which page/document)
- Use student's terminology (from their notes)
- Reference previous conversation history
- Connect concepts across topics

3.4 **Mascot Personality**:
- Encouraging and supportive tone
- Medical terminology accurate
- Not condescending or cutesy
- Empathetic to stress
- Celebrates achievements

**Acceptance Criteria**:
- [ ] Chat responds within 2 seconds (p95)
- [ ] Responses stream word-by-word
- [ ] Answers are grounded in uploaded content
- [ ] Shows citations to source material
- [ ] Tone is supportive and professional
- [ ] Handles conversation context (remembers previous messages)

**Priority**: P0 (Critical - Phase 3)

---

### FR4: NBME-Style MCQ Generation

**User Story**:
As a medical student, I want to practice with NBME-style multiple choice questions generated from my own study materials, so I can test my knowledge in the format I'll see on the real exam.

**Requirements**:

4.1 **Question Generation**:
- Generate MCQs from uploaded content
- NBME format: Clinical vignette + 4-5 answer choices
- Difficulty levels: Easy, Medium, Hard, NBME-representative
- 1000+ questions per standard curriculum
- Quality scoring (reject low-quality questions)

4.2 **Answer Explanations**:
- Explain why correct answer is correct
- Explain why each incorrect answer is incorrect
- Include relevant mechanism/pathophysiology
- Cite source material
- Suggest related topics to review

4.3 **Question Bank Management**:
- Filter by topic, difficulty, performance
- Mark questions for review
- Track performance per question
- Avoid showing same question too soon
- Add custom questions manually

4.4 **Quiz Sessions**:
- Timed mode (1.5 min per question, NBME pace)
- Tutor mode (untimed, immediate feedback)
- Block mode (simulate real exam blocks)
- Confidence ratings (helps calibrate spaced repetition)
- Resume incomplete sessions

**Acceptance Criteria**:
- [ ] Generates 100+ questions from 200-page textbook
- [ ] Questions follow NBME format (vignette + choices)
- [ ] Explanations are accurate and helpful
- [ ] Quality score > 4/5 for generated questions
- [ ] User can filter questions by topic and difficulty
- [ ] Timed mode enforces 1.5 min per question

**Priority**: P0 (Critical - Phase 4)

---

### FR5: Spaced Repetition System

**User Story**:
As a medical student, I want the platform to automatically schedule review sessions at optimal intervals so I remember information long-term without manually planning reviews.

**Requirements**:

5.1 **SM-2 Algorithm Implementation**:
- Calculate next review date based on performance
- Adjust easiness factor per item
- Increase intervals for correct answers
- Reset intervals for incorrect answers
- Account for confidence ratings

5.2 **Review Scheduling**:
- Show "due reviews" daily
- Prioritize by urgency (overdue first)
- Batch reviews by topic (reduce context switching)
- Flexible daily goal (configurable)
- Snooze overdue reviews

5.3 **Progress Tracking**:
- Retention rate per topic
- Review history timeline
- Forgetting curve visualization
- Mastery levels (0-100%)
- Predicted exam performance

**Acceptance Criteria**:
- [ ] SM-2 algorithm correctly calculates intervals
- [ ] Reviews are scheduled at increasing intervals
- [ ] "Due today" count is accurate
- [ ] User can complete 20-50 reviews in 20 minutes
- [ ] Retention rate calculation is accurate

**Priority**: P0 (Critical - Phase 5)

---

### FR6: Gamification System

**User Story**:
As a medical student, I want to earn XP, level up, maintain streaks, and unlock achievements to stay motivated during my 6-month study journey.

**Requirements**:

6.1 **XP & Leveling**:
- Earn XP for: answering questions, completing reviews, study sessions, streaks
- XP amounts scale with difficulty
- Levels increase with exponential XP curve
- Display XP progress bar
- Level-up celebrations (modal with pixel art)

6.2 **Streaks**:
- Track consecutive days studied
- Display streak counter with fire icon
- Freeze streak (1 skip per week)
- Streak milestones (7, 14, 30, 60 days)
- Gentle reminders (no guilt-tripping)

6.3 **Achievements**:
- Unlock achievements for milestones (first quiz, 100 questions, etc.)
- Display achievement badges (pixel art)
- Achievement showcase on profile
- Rare achievements for special accomplishments
- Share achievements (optional)

6.4 **Rewards**:
- Virtual currency (coins) earned from XP
- Spend coins on: avatar customization, themes, mascot outfits
- Unlock study tools (e.g., advanced analytics) with coins
- No pay-to-win (free = full learning features)

6.5 **Mascot System**:
- Pixel art mascot with moods (happy, thinking, celebrating)
- Mascot appears in corner of dashboard
- Provides encouragement during study sessions
- Reacts to achievements and milestones
- Customizable (different mascots unlockable)

**Acceptance Criteria**:
- [ ] XP awarded correctly for all actions
- [ ] Level-up occurs at correct XP thresholds
- [ ] Streak increments daily when user studies
- [ ] Achievements unlock when conditions met
- [ ] Mascot displays correct mood based on context
- [ ] Gamification feels motivating, not distracting

**Priority**: P1 (High - Phase 6)

---

### FR7: Progress Analytics Dashboard

**User Story**:
As a medical student, I want to see detailed analytics about my study progress, strengths, weaknesses, and predicted exam performance so I can focus on areas that need improvement.

**Requirements**:

7.1 **Dashboard Overview**:
- XP and current level
- Study streak
- Questions answered today/week/total
- Mastery percentage by topic
- Due reviews count
- Study time (today/week/month)

7.2 **Detailed Analytics**:
- Performance over time (line chart)
- Topic mastery heatmap
- Question accuracy by topic
- Retention rate trends
- Study session patterns (time of day, duration)
- Weak areas identification

7.3 **Predictive Metrics**:
- Predicted Step 1 score (based on question performance)
- Confidence intervals
- Recommended topics to study
- Estimated time to mastery

7.4 **Export & Sharing**:
- Export data as CSV
- Print study summary
- Share progress (optional, to study groups)

**Acceptance Criteria**:
- [ ] Dashboard loads within 1 second
- [ ] All charts render correctly
- [ ] Data is accurate and up-to-date
- [ ] Weak areas are correctly identified
- [ ] Predicted score has reasonable accuracy

**Priority**: P1 (High - Phase 5)

---

### FR8: User Authentication & Profiles

**User Story**:
As a medical student, I want to create an account, log in securely, and have my study progress saved so I can access it from any device.

**Requirements**:

8.1 **Registration**:
- Email + password sign-up
- Email verification
- Strong password requirements
- Terms of service acceptance
- Privacy policy acceptance

8.2 **Authentication**:
- Login with email + password
- JWT access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- "Remember me" option
- Logout functionality
- Session management

8.3 **Password Management**:
- Password reset via email
- Password change (when logged in)
- Password strength indicator
- Secure password hashing (bcrypt)

8.4 **Profile Management**:
- Edit name, email, avatar
- Set study goals (daily target)
- Notification preferences
- Privacy settings
- Account deletion

**Acceptance Criteria**:
- [ ] User can register and receive verification email
- [ ] User can log in and stay logged in (remember me)
- [ ] User can reset password via email
- [ ] Sessions expire after 7 days of inactivity
- [ ] Profile changes save correctly

**Priority**: P0 (Critical - Phase 1)

---

## Non-Functional Requirements

### NFR1: Performance

**Requirements**:
- Page load time < 2 seconds (p95)
- API response time < 500ms (p95)
- LLM response time < 3 seconds (first token)
- Quiz question generation < 5 seconds
- Document processing < 2 min per 50-page PDF
- WebSocket latency < 100ms

**Acceptance Criteria**:
- [ ] Lighthouse performance score > 90
- [ ] No blocking operations on UI thread
- [ ] Lazy loading for images and heavy components
- [ ] Database queries use indexes

---

### NFR2: Scalability

**Requirements**:
- Support 1 user initially (personal use)
- Architecture supports 10,000+ users (future)
- Database can handle 1M+ questions
- Storage for 10GB+ of uploaded documents per user
- Concurrent WebSocket connections: 1,000+

**Design Patterns**:
- Stateless backend (horizontal scaling ready)
- Async processing for heavy tasks
- Caching layer (Redis)
- CDN for static assets
- Database connection pooling

---

### NFR3: Security

**Requirements**:
- HTTPS only (TLS 1.3)
- JWT tokens with short expiry
- Refresh token rotation
- Passwords hashed with bcrypt (12 rounds)
- XSS protection (CSP headers)
- CSRF protection
- SQL injection prevention (parameterized queries)
- Rate limiting (100 req/min per user)
- Input validation and sanitization

**Compliance**:
- GDPR (user data export/deletion)
- FERPA (educational records protection)
- No PHI (no real patient data)

---

### NFR4: Accessibility

**Requirements**:
- WCAG 2.1 Level AA compliance
- Color contrast ratios: 4.5:1 (text), 3:1 (UI components)
- Keyboard navigation for all features
- Screen reader support (ARIA labels)
- Focus indicators (3:1 contrast)
- Reduced motion support
- Text resizable up to 200%
- Touch targets > 44px × 44px (mobile)

---

### NFR5: Compatibility

**Desktop Browsers**:
- Chrome 100+ ✅
- Firefox 100+ ✅
- Safari 15+ ✅
- Edge 100+ ✅

**Mobile Browsers**:
- iOS Safari 15+ ✅
- Chrome Android 100+ ✅

**Screen Sizes**:
- Mobile: 320px+ ✅
- Tablet: 768px+ ✅
- Desktop: 1024px+ ✅

---

### NFR6: Reliability

**Requirements**:
- Uptime: 99.5% (allows ~3.6 hours downtime/month)
- Data backup: Daily automated backups
- Disaster recovery: Recovery Point Objective (RPO) < 24 hours
- Error tracking (Sentry)
- Logging (structured logs)
- Monitoring (Prometheus + Grafana)

---

### NFR7: Usability

**Requirements**:
- Onboarding flow < 5 minutes
- New users complete first quiz within 10 minutes
- Error messages are clear and actionable
- Loading states for all async operations
- Tooltips for complex features
- Help documentation accessible
- Empty states with clear CTAs

**Metrics**:
- Task success rate > 90%
- Time to complete first quiz < 10 min
- User satisfaction score > 4/5

---

## Technical Architecture

### Tech Stack

**Frontend**:
- Next.js 15 (App Router)
- React 19 (Server Components)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Zustand (state management)
- TanStack Query (data fetching)
- Socket.io Client (WebSocket)
- Framer Motion (animations)
- Recharts (analytics charts)

**Backend**:
- FastAPI (Python 3.11+)
- SQLAlchemy 2.0 (async ORM)
- Alembic (migrations)
- Pydantic Settings (config)
- Redis Streams (background jobs)

**Databases**:
- PostgreSQL 16 + pgvector
- Redis 7
- Qdrant (optional, for vector search)

**AI/ML**:
- Codex CLI (OAuth, not API keys)
- OpenAI embeddings (via Codex CLI)
- Semantic search (vector similarity)
- RAG pipeline (retrieval augmented generation)

**Deployment**:
- Frontend: Vercel / Railway
- Backend: Railway / Render
- Database: Managed PostgreSQL
- Monitoring: Prometheus + Grafana
- Error tracking: Sentry
- Logs: Cloud logging service

---

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │   Dashboard   │  │   Quiz UI     │  │   AI Coach Chat  │ │
│  │  (Analytics)  │  │   (MCQs)      │  │   (WebSocket)    │ │
│  └───────────────┘  └───────────────┘  └──────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │          State Management (Zustand + TanStack Query)     │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Auth API   │  │   Quiz API   │  │   Chat WebSocket  │  │
│  │  (JWT)       │  │   (MCQs)     │  │   (Real-time)     │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Document API │  │ Progress API │  │   Analytics API   │  │
│  │ (Upload)     │  │ (SM-2, XP)   │  │   (Stats)         │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼──────────────────┐
        │                   │                  │
        ▼                   ▼                  ▼
┌──────────────┐   ┌─────────────────┐   ┌──────────────┐
│  PostgreSQL  │   │  Redis (Cache   │   │   Qdrant     │
│   + pgvector │   │  + Job Queue)   │   │  (Optional)  │
│              │   │                 │   │              │
│ - Users      │   │ - Session cache │   │ - Embeddings │
│ - Materials  │   │ - Job queue     │   │ - Vector     │
│ - Questions  │   │ - Rate limits   │   │   search     │
│ - Progress   │   │                 │   │              │
└──────────────┘   └─────────────────┘   └──────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────┐
│                 BACKGROUND WORKERS                     │
│                                                        │
│  ┌────────────────────┐  ┌──────────────────────────┐ │
│  │ Document Processor │  │  Question Generator      │ │
│  │ - Parse PDF/DOCX   │  │  - LLM MCQ generation    │ │
│  │ - Extract text     │  │  - Quality scoring       │ │
│  │ - Semantic chunking│  │                          │ │
│  └────────────────────┘  └──────────────────────────┘ │
│                                                        │
│  ┌────────────────────┐  ┌──────────────────────────┐ │
│  │ Embedder Worker    │  │  Analytics Worker        │ │
│  │ - Generate vectors │  │  - Calculate metrics     │ │
│  │ - Store in Qdrant  │  │  - Update dashboards     │ │
│  └────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                            │
                            │ Codex CLI OAuth
                            ▼
                    ┌───────────────┐
                    │   CODEX CLI   │
                    │  (LLM + RAG)  │
                    │               │
                    │ - AI Coach    │
                    │ - Question Gen│
                    │ - Embeddings  │
                    └───────────────┘
```

---

## User Flows

### Flow 1: New User Onboarding

```
1. User lands on homepage
   ↓
2. Sees value proposition + Soft Kawaii Brutalist UI
   ↓
3. Clicks "Sign Up"
   ↓
4. Enters email + password
   ↓
5. Receives verification email
   ↓
6. Clicks verification link
   ↓
7. Redirected to onboarding wizard:
   a. "What's your current study phase?" (Beginning / Mid / Final review)
   b. "What topics do you want to focus on?" (Checkboxes)
   c. "What's your daily study goal?" (30 min / 60 min / 90 min)
   ↓
8. Onboarding complete → Dashboard
   ↓
9. Empty state: "Upload your first study material"
   ↓
10. User uploads PDF lecture notes
    ↓
11. Processing starts (progress bar, mascot encouragement)
    ↓
12. Processing complete → Notification: "Your learning path is ready!"
    ↓
13. User clicks notification → Skill tree view
    ↓
14. User clicks first topic node → Begins first study session
```

---

### Flow 2: Daily Study Session

```
1. User logs in
   ↓
2. Dashboard shows:
   - Streak: 7 days 🔥
   - Due reviews: 25
   - Recommended topic: "Cardiac Physiology"
   - Quick action: "Continue Learning"
   ↓
3. User clicks "Continue Learning"
   ↓
4. Redirected to AI Coach chat
   ↓
5. Mascot greets: "Welcome back! Let's review cardiac physiology. Can you explain what happens during ventricular systole?"
   ↓
6. User types answer
   ↓
7. AI Coach responds with Socratic follow-up: "Good start! What causes the pressure to increase in the left ventricle?"
   ↓
8. Conversation continues (3-5 exchanges)
   ↓
9. AI Coach: "Great job! Now let's test your knowledge with a few questions."
   ↓
10. Transition to quiz mode
    ↓
11. User answers 10 MCQs
    ↓
12. After each question:
    - Immediate feedback (correct/incorrect)
    - Detailed explanation
    - Confidence rating slider
    ↓
13. Quiz summary:
    - Score: 8/10
    - XP earned: +80 XP
    - Topics mastered: Cardiac Cycle (+10%)
    - Weak areas: Valvular defects (recommend review)
    ↓
14. Celebration animation (pixel art mascot cheering)
    ↓
15. Return to dashboard (updated stats)
```

---

### Flow 3: Spaced Repetition Review

```
1. User opens app
   ↓
2. Notification: "You have 25 reviews due today"
   ↓
3. Dashboard shows "Due Reviews: 25" card
   ↓
4. User clicks "Start Reviews"
   ↓
5. Review session begins (tutor mode)
   ↓
6. System shows question from 3 days ago (based on SM-2)
   ↓
7. User answers
   ↓
8. Immediate feedback + explanation
   ↓
9. User rates difficulty (1-5)
   ↓
10. SM-2 algorithm calculates next review date:
    - Correct + easy (5): Next review in 10 days
    - Correct + hard (3): Next review in 3 days
    - Incorrect (1): Next review tomorrow
    ↓
11. Repeat for all 25 reviews (~20 minutes)
    ↓
12. Summary:
    - Retention rate: 88%
    - Streak maintained: 8 days 🔥
    - XP earned: +125 XP
    - Level up! (Level 14 → 15)
    ↓
13. Level-up modal with pixel art celebration
```

---

## Design Specifications

### UI/UX Principles

1. **Psychology-First → Design → Function**
   - Every design decision rooted in learning science
   - Reduce anxiety, increase motivation
   - Soft Kawaii Brutalist aesthetic

2. **Brutal Structure, Soft Surface**
   - Clean grids, clear hierarchy (Brutalism)
   - Pastel colors, rounded corners (Kawaii)
   - Pixel art accents (Nostalgia)

3. **Content-First Contrast**
   - Medical content: High contrast (WCAG AAA)
   - UI chrome: Low contrast (Soft pastels)

4. **Honest Functionality**
   - Buttons look like buttons
   - Clear affordances
   - No hidden interactions

5. **Encouraging, Not Condescending**
   - Supportive microcopy
   - Gentle error messages
   - Celebrate progress

**Full Design System**: See DESIGN_SYSTEM.md

---

## Development Phases

### Phase 0: Foundation (2-3 weeks estimated)
- [ ] Initialize Next.js 15 + FastAPI projects
- [ ] Set up PostgreSQL, Redis locally
- [ ] Configure Codex CLI OAuth
- [ ] Create dynamic configuration system
- [ ] Set up git repository and CI/CD

### Phase 1: Core Infrastructure (3-4 weeks)
- [ ] Implement authentication (JWT)
- [ ] Create database models
- [ ] Build API structure
- [ ] Set up dashboard layout
- [ ] Implement basic routing

### Phase 2: Document Processing (2-3 weeks)
- [ ] Build file upload system
- [ ] Implement document parser
- [ ] Create semantic chunking
- [ ] Generate embeddings via Codex CLI
- [ ] Set up vector storage (pgvector or Qdrant)
- [ ] Build semantic search

### Phase 3: AI Coach (3-4 weeks)
- [ ] Integrate Codex CLI for LLM
- [ ] Build WebSocket server
- [ ] Implement RAG pipeline
- [ ] Create chat UI
- [ ] Implement Socratic prompting
- [ ] Generate learning paths

### Phase 4: Question Generation (2-3 weeks)
- [ ] Build MCQ generation with LLM
- [ ] Implement quality scoring
- [ ] Create quiz UI
- [ ] Build question bank management
- [ ] Implement timed/tutor modes

### Phase 5: Spaced Repetition (2 weeks)
- [ ] Implement SM-2 algorithm
- [ ] Build review scheduling
- [ ] Create progress tracking
- [ ] Build analytics dashboard

### Phase 6: Gamification (2-3 weeks)
- [ ] Implement XP and leveling
- [ ] Create achievement system
- [ ] Build streak tracking
- [ ] Design pixel art mascot and badges
- [ ] Implement reward system

### Phase 7: Polish (2-3 weeks)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Testing (unit, integration, E2E)
- [ ] Bug fixes
- [ ] Documentation

### Phase 8: Deployment (1 week)
- [ ] Set up production environment
- [ ] Configure CI/CD
- [ ] Set up monitoring
- [ ] Deploy frontend and backend
- [ ] Final testing

**Total Estimated Time**: 19-26 weeks (no hard deadlines - quality over speed)

---

## Risks & Mitigation

### Risk 1: LLM Hallucinations (Medical Misinformation)

**Risk**: AI coach provides incorrect medical information, student studies wrong facts.

**Severity**: CRITICAL

**Mitigation**:
- Always cite sources (show which document/page answer came from)
- RAG-based responses (grounded in user's materials, not hallucinations)
- Quality scoring for generated questions
- User can flag incorrect content
- Add disclaimer: "Verify critical information with authoritative sources"

---

### Risk 2: Codex CLI Rate Limits / Downtime

**Risk**: Codex CLI hits rate limits or goes down, blocking core features.

**Severity**: HIGH

**Mitigation**:
- Implement graceful degradation (fallback to cached responses)
- Batch requests to reduce API calls
- Cache frequently requested content
- Show clear error messages when LLM unavailable
- Core features (flashcards, pre-generated questions) work without LLM

---

### Risk 3: User Burnout from Gamification

**Risk**: Users study for XP instead of learning, or feel guilty breaking streaks.

**Severity**: MEDIUM

**Mitigation**:
- Focus metrics on learning outcomes (mastery, retention) not just XP
- Streak freeze feature (1 skip per week)
- Gentle reminders, no guilt-tripping notifications
- Option to hide gamification elements
- Regular user surveys on stress levels

---

### Risk 4: Poor Question Quality

**Risk**: AI-generated questions are too easy, too hard, or not NBME-representative.

**Severity**: HIGH

**Mitigation**:
- Quality scoring algorithm (reject low-quality questions)
- User can rate question quality
- Difficulty calibration based on user performance
- Option to add manually curated questions
- Partner with medical educators for question bank review

---

### Risk 5: Data Privacy & Security

**Risk**: User study materials contain sensitive information, security breach.

**Severity**: CRITICAL

**Mitigation**:
- Encryption at rest and in transit (TLS 1.3)
- Secure file upload (scan for malware)
- User data deletion (GDPR compliance)
- No sharing of user content with third parties
- Regular security audits
- Transparent privacy policy

---

## Success Criteria

### MVP Success (3 months post-launch):

- [ ] 1 user (personal use) studies daily for 30+ days
- [ ] User completes 500+ questions
- [ ] User masters 10+ topics
- [ ] Self-reported anxiety reduction
- [ ] User prefers StudyIn over previous methods

### v1.0 Success (6 months post-launch):

- [ ] User completes entire Step 1 curriculum (50+ topics)
- [ ] User takes Step 1 exam and passes
- [ ] User recommends to classmates (NPS > 50)
- [ ] Zero critical bugs
- [ ] 95%+ uptime

### Long-term Success (12+ months):

- [ ] Expand to 10 beta users (friends, classmates)
- [ ] 80%+ retention (users continue using after 3 months)
- [ ] Average study streak > 21 days
- [ ] User performance improves over time (measurable in analytics)

---

## Appendix

### Glossary

**NBME**: National Board of Medical Examiners - creates USMLE exams
**USMLE Step 1**: First major medical licensing exam in US
**Spaced Repetition**: Learning technique using increasing intervals between reviews
**SM-2**: SuperMemo 2 algorithm for spaced repetition
**RAG**: Retrieval Augmented Generation - LLM + knowledge retrieval
**Socratic Method**: Teaching by asking questions, not giving answers
**Anki**: Popular spaced repetition flashcard software
**UWorld**: Popular USMLE question bank (2000+ questions)

### References

**Learning Science**:
- Bjork, R. A. (1994). "Memory and Metamemory Considerations in the Training of Human Beings"
- Roediger, H. L. (2006). "The Critical Role of Retrieval Practice in Long-Term Retention"
- Dunlosky, J. (2013). "Strengthening the Student Toolbox: Study Strategies to Boost Learning"

**Gamification**:
- Deterding, S. (2011). "From Game Design Elements to Gamefulness: Defining Gamification"
- McGonigal, J. (2011). "Reality is Broken: Why Games Make Us Better"

**Medical Education**:
- AAMC. (2023). "Medical School Graduation Questionnaire: Student Wellness Survey"
- NBME. (2024). "USMLE Step 1 Content Description and General Information"

---

## Changelog

### 2025-10-09 (v1.0)
- Initial PRD creation
- Defined all functional and non-functional requirements
- Created user personas (Sarah, Marcus, Priya)
- Documented technical architecture
- Outlined 8 development phases
- Added risk mitigation strategies
- Defined success criteria

---

**Remember**: This PRD is a living document. Update as requirements evolve, user feedback is received, and technical constraints are discovered.
