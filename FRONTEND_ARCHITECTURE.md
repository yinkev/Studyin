# Frontend Architecture - StudyIn

> **Reference Document**: Complete Next.js 15 frontend architecture with security-first design

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Architecture Planning Phase
**Related Docs**: TECH_SPEC.md, PRD.md, DESIGN_SYSTEM.md, SECURITY_QUICK_FIXES.md

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Application Structure](#2-application-structure)
3. [State Management](#3-state-management)
4. [Authentication & Security](#4-authentication--security)
5. [Component Architecture](#5-component-architecture)
6. [Data Fetching & Caching](#6-data-fetching--caching)
7. [Real-time Features](#7-real-time-features)
8. [Routing & Navigation](#8-routing--navigation)
9. [Form Handling](#9-form-handling)
10. [Performance Optimization](#10-performance-optimization)
11. [Styling Architecture](#11-styling-architecture)
12. [TypeScript Patterns](#12-typescript-patterns)
13. [Testing Strategy](#13-testing-strategy)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Architecture Overview

### 1.1 Core Principles

**Psychology-First Design**
- Every architectural decision prioritizes user experience and reduces anxiety
- Loading states are encouraging, not frustrating
- Errors are helpful, not technical
- Performance impacts learning effectiveness

**Security by Default**
- No tokens in localStorage (XSS protection)
- HttpOnly cookies for refresh tokens
- Automatic token refresh with rotation
- CSRF protection via SameSite cookies

**Server-First with Client Interactivity**
- Server Components for static content (SEO, performance)
- Client Components for interactivity (quiz, chat, gamification)
- Streaming for real-time AI responses
- Progressive enhancement

**Scalable from Day One**
- Modular component architecture
- Clear separation of concerns
- Type-safe APIs
- Testable patterns

---

### 1.2 Next.js 15 Features Used

**App Router**
- File-system based routing
- Layouts for shared UI
- Route groups for organization
- Parallel routes for dashboard
- Intercepting routes for modals

**Server Components (RSC)**
- Default for all pages
- Fetch data at build/request time
- Zero JavaScript to client (where possible)
- SEO-friendly by default

**Client Components**
- Interactive UI (quiz, chat, gamification)
- Real-time WebSocket connections
- State management
- Animations and transitions

**Streaming**
- AI responses stream word-by-word
- Loading states with Suspense
- Progressive page rendering
- Better perceived performance

**Server Actions**
- Form submissions without API routes
- Type-safe mutations
- Optimistic updates
- Progressive enhancement

---

### 1.3 Technology Stack

```typescript
// Core Framework
"next": "^15.0.0"              // App Router, RSC, Streaming
"react": "^19.0.0"             // UI library
"typescript": "^5.3.0"         // Type safety

// State Management
"zustand": "^4.5.0"            // Global client state
"@tanstack/react-query": "^5.17.0"  // Server state, caching

// Real-time
"socket.io-client": "^4.7.0"   // WebSocket client
"@microsoft/signalr": "^8.0.0" // Alternative WebSocket (optional)

// UI & Styling
"tailwindcss": "^4.0.0"        // Utility-first CSS
"framer-motion": "^11.0.0"     // Animations
"lucide-react": "^0.312.0"     // Icons
"class-variance-authority": "^0.7.0"  // Component variants
"tailwind-merge": "^2.2.0"     // Merge Tailwind classes

// Forms & Validation
"react-hook-form": "^7.49.0"   // Form state
"zod": "^3.22.4"               // Schema validation
"@hookform/resolvers": "^3.3.4"  // RHF + Zod integration

// Data Visualization
"recharts": "^2.10.0"          // Charts for analytics
"d3": "^7.8.5"                 // Skill tree visualization

// Development
"@types/node": "^20.10.0"      // Node types
"@types/react": "^18.2.0"      // React types
"eslint": "^8.56.0"            // Linting
"prettier": "^3.1.0"           // Formatting
"vitest": "^1.1.0"             // Unit testing
"@playwright/test": "^1.40.0"  // E2E testing
```

---

## 2. Application Structure

### 2.1 Directory Organization

```
frontend/
├── src/
│   ├── app/                           # Next.js 15 App Router
│   │   ├── (auth)/                    # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page (Server Component)
│   │   │   ├── register/
│   │   │   │   └── page.tsx           # Register page
│   │   │   └── layout.tsx             # Auth layout (minimal)
│   │   │
│   │   ├── (dashboard)/               # Protected routes group
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Main dashboard (Server)
│   │   │   │   ├── loading.tsx        # Loading UI
│   │   │   │   └── error.tsx          # Error boundary
│   │   │   │
│   │   │   ├── study/
│   │   │   │   ├── [sessionId]/
│   │   │   │   │   ├── page.tsx       # Study session (Client)
│   │   │   │   │   └── layout.tsx     # Session layout
│   │   │   │   └── page.tsx           # Study overview
│   │   │   │
│   │   │   ├── quiz/
│   │   │   │   ├── [quizId]/
│   │   │   │   │   └── page.tsx       # Active quiz (Client)
│   │   │   │   └── page.tsx           # Quiz selection
│   │   │   │
│   │   │   ├── materials/
│   │   │   │   ├── page.tsx           # Materials list
│   │   │   │   ├── upload/
│   │   │   │   │   └── page.tsx       # Upload page
│   │   │   │   └── [materialId]/
│   │   │   │       └── page.tsx       # Material details
│   │   │   │
│   │   │   ├── progress/
│   │   │   │   ├── page.tsx           # Analytics dashboard
│   │   │   │   └── @charts/           # Parallel route for charts
│   │   │   │       └── default.tsx
│   │   │   │
│   │   │   ├── skill-tree/
│   │   │   │   └── page.tsx           # Learning path visualization
│   │   │   │
│   │   │   └── layout.tsx             # Dashboard layout (sidebar, header)
│   │   │
│   │   ├── api/                       # API route handlers (optional)
│   │   │   └── upload/
│   │   │       └── route.ts           # File upload handler
│   │   │
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Global styles
│   │   └── providers.tsx              # Client providers
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   │
│   │   ├── auth/                      # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── PasswordResetForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/                 # Dashboard widgets
│   │   │   ├── DailyGoals.tsx
│   │   │   ├── DueReviews.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── MascotGreeting.tsx
│   │   │
│   │   ├── study/                     # Study session components
│   │   │   ├── ContentCard.tsx
│   │   │   ├── SessionControls.tsx
│   │   │   ├── SessionProgress.tsx
│   │   │   └── RelatedTopics.tsx
│   │   │
│   │   ├── quiz/                      # Quiz components
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── OptionButton.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── ConfidenceRating.tsx
│   │   │   ├── AnswerFeedback.tsx
│   │   │   └── QuizSummary.tsx
│   │   │
│   │   ├── chat/                      # AI Coach chat
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── StreamingResponse.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── ChatInput.tsx
│   │   │
│   │   ├── skill-tree/                # Learning path visualization
│   │   │   ├── SkillTreeCanvas.tsx
│   │   │   ├── SkillNode.tsx
│   │   │   ├── ConnectionLine.tsx
│   │   │   └── NodeTooltip.tsx
│   │   │
│   │   ├── gamification/              # Gamification UI
│   │   │   ├── XPBar.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   ├── StreakCounter.tsx
│   │   │   ├── AchievementCard.tsx
│   │   │   ├── RewardModal.tsx
│   │   │   └── LevelUpAnimation.tsx
│   │   │
│   │   ├── materials/                 # Materials management
│   │   │   ├── MaterialCard.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ProcessingStatus.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── MaterialFilters.tsx
│   │   │
│   │   ├── progress/                  # Analytics components
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── TopicMasteryHeatmap.tsx
│   │   │   ├── RetentionGraph.tsx
│   │   │   ├── StudyTimeChart.tsx
│   │   │   └── WeakAreasCard.tsx
│   │   │
│   │   └── shared/                    # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       ├── PixelMascot.tsx
│   │       ├── PixelBadge.tsx
│   │       └── Breadcrumbs.tsx
│   │
│   ├── lib/
│   │   ├── api/                       # API client layer
│   │   │   ├── client.ts              # Axios instance with interceptors
│   │   │   ├── auth.ts                # Auth endpoints
│   │   │   ├── materials.ts           # Materials endpoints
│   │   │   ├── quiz.ts                # Quiz endpoints
│   │   │   ├── progress.ts            # Progress endpoints
│   │   │   └── types.ts               # API response types
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts             # Authentication hook
│   │   │   ├── useWebSocket.ts        # WebSocket hook
│   │   │   ├── useQuiz.ts             # Quiz state hook
│   │   │   ├── useProgress.ts         # Progress tracking hook
│   │   │   ├── useTokenRefresh.ts     # Auto token refresh
│   │   │   └── useDebounce.ts         # Utility hooks
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── cn.ts                  # Class name merger
│   │   │   ├── format.ts              # Date/number formatters
│   │   │   ├── validation.ts          # Client-side validators
│   │   │   ├── constants.ts           # App constants
│   │   │   └── helpers.ts             # General utilities
│   │   │
│   │   ├── schemas/                   # Zod validation schemas
│   │   │   ├── auth.ts                # Auth form schemas
│   │   │   ├── material.ts            # Material upload schemas
│   │   │   └── user.ts                # User profile schemas
│   │   │
│   │   └── config.ts                  # Dynamic configuration
│   │
│   ├── stores/                        # Zustand state stores
│   │   ├── authStore.ts               # Auth state (access token, user)
│   │   ├── quizStore.ts               # Active quiz state
│   │   ├── sessionStore.ts            # Study session state
│   │   ├── uiStore.ts                 # UI state (sidebar, theme)
│   │   └── chatStore.ts               # Chat history state
│   │
│   ├── styles/
│   │   └── globals.css                # Tailwind imports + custom CSS
│   │
│   └── types/
│       ├── index.ts                   # Shared types
│       ├── api.ts                     # API response types
│       ├── user.ts                    # User types
│       ├── quiz.ts                    # Quiz types
│       ├── material.ts                # Material types
│       └── gamification.ts            # Gamification types
│
├── public/
│   ├── pixel-art/                     # Pixel art assets
│   │   ├── mascot/
│   │   │   ├── happy.png
│   │   │   ├── thinking.png
│   │   │   └── celebrating.png
│   │   ├── badges/
│   │   │   ├── star.png
│   │   │   ├── trophy.png
│   │   │   └── fire.png
│   │   └── icons/
│   └── fonts/                         # Custom fonts
│
├── __tests__/                         # Tests
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── study-flow.spec.ts
│       └── quiz-flow.spec.ts
│
├── .env.local                         # Environment variables
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
├── vitest.config.ts                   # Vitest configuration
├── playwright.config.ts               # Playwright configuration
└── package.json                       # Dependencies
```

---

## 3. State Management

### 3.1 State Architecture

**Three-Layer State Model**

```typescript
// Layer 1: Server State (React Query)
// - User profile, materials, questions, progress
// - Cached, automatically refetched
// - Optimistic updates

// Layer 2: Global Client State (Zustand)
// - Access token, current user
// - Active quiz state, session state
// - UI state (sidebar, theme)

// Layer 3: Local Component State (useState)
// - Form inputs, modals, accordions
// - Ephemeral UI state
// - Animation triggers
```

---

### 3.2 Zustand Stores

**Auth Store** (`stores/authStore.ts`):

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
}

interface AuthState {
  // State
  accessToken: string | null;  // ✅ In-memory only (no localStorage!)
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: true }, false, 'auth/setAccessToken'),

      setUser: (user) =>
        set({ user, isAuthenticated: true }, false, 'auth/setUser'),

      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }, false, 'auth/logout'),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }), false, 'auth/updateUser'),
    }),
    { name: 'AuthStore' }
  )
);

// ✅ NO PERSIST MIDDLEWARE - access token never stored
// Refresh token is in HttpOnly cookie (backend managed)
```

**Quiz Store** (`stores/quizStore.ts`):

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Question {
  id: string;
  vignette: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nbme';
}

interface QuizState {
  // State
  quizId: string | null;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  confidenceRatings: (number | null)[];
  startTime: Date | null;
  endTime: Date | null;
  isSubmitted: boolean;

  // Computed
  isComplete: boolean;
  score: number;

  // Actions
  loadQuiz: (quizId: string, questions: Question[]) => void;
  answerQuestion: (index: number, answerIndex: number, confidence: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()(
  devtools(
    (set, get) => ({
      quizId: null,
      questions: [],
      currentIndex: 0,
      answers: [],
      confidenceRatings: [],
      startTime: null,
      endTime: null,
      isSubmitted: false,

      get isComplete() {
        const { answers, questions } = get();
        return answers.every(a => a !== null) && answers.length === questions.length;
      },

      get score() {
        const { answers, questions } = get();
        let correct = 0;
        answers.forEach((answer, i) => {
          if (answer === questions[i]?.correctIndex) correct++;
        });
        return questions.length > 0 ? (correct / questions.length) * 100 : 0;
      },

      loadQuiz: (quizId, questions) => set({
        quizId,
        questions,
        answers: new Array(questions.length).fill(null),
        confidenceRatings: new Array(questions.length).fill(null),
        currentIndex: 0,
        startTime: new Date(),
        endTime: null,
        isSubmitted: false,
      }, false, 'quiz/load'),

      answerQuestion: (index, answerIndex, confidence) =>
        set((state) => {
          const newAnswers = [...state.answers];
          const newRatings = [...state.confidenceRatings];
          newAnswers[index] = answerIndex;
          newRatings[index] = confidence;
          return { answers: newAnswers, confidenceRatings: newRatings };
        }, false, 'quiz/answer'),

      nextQuestion: () =>
        set((state) => ({
          currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1)
        }), false, 'quiz/next'),

      previousQuestion: () =>
        set((state) => ({
          currentIndex: Math.max(state.currentIndex - 1, 0)
        }), false, 'quiz/previous'),

      submitQuiz: () =>
        set({ endTime: new Date(), isSubmitted: true }, false, 'quiz/submit'),

      reset: () =>
        set({
          quizId: null,
          questions: [],
          currentIndex: 0,
          answers: [],
          confidenceRatings: [],
          startTime: null,
          endTime: null,
          isSubmitted: false,
        }, false, 'quiz/reset'),
    }),
    { name: 'QuizStore' }
  )
);
```

**UI Store** (`stores/uiStore.ts`):

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Theme (future)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Mascot visibility
  mascotVisible: boolean;
  toggleMascot: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      mascotVisible: true,

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) =>
        set({ theme }),

      toggleMascot: () =>
        set((state) => ({ mascotVisible: !state.mascotVisible })),
    }),
    {
      name: 'ui-storage',
      // ✅ Safe to persist UI preferences (no sensitive data)
    }
  )
);
```

---

### 3.3 React Query Configuration

**Query Client Setup** (`app/providers.tsx`):

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Query Keys** (`lib/api/queryKeys.ts`):

```typescript
// Centralized query key factory
export const queryKeys = {
  // User
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', userId] as const,

  // Materials
  materials: ['materials'] as const,
  material: (id: string) => ['materials', id] as const,
  materialChunks: (id: string) => ['materials', id, 'chunks'] as const,

  // Questions
  questions: ['questions'] as const,
  question: (id: string) => ['questions', id] as const,
  questionsByTopic: (topic: string) => ['questions', 'topic', topic] as const,

  // Progress
  progress: ['progress'] as const,
  progressByTopic: (topic: string) => ['progress', 'topic', topic] as const,
  analytics: ['progress', 'analytics'] as const,

  // Due reviews
  dueReviews: ['due-reviews'] as const,
};
```

**Example Query Hook** (`lib/hooks/useProgress.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/lib/api/progress';
import { queryKeys } from '@/lib/api/queryKeys';

export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: () => progressApi.getProgress(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProgressByTopic(topic: string) {
  return useQuery({
    queryKey: queryKeys.progressByTopic(topic),
    queryFn: () => progressApi.getProgressByTopic(topic),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecordProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressApi.recordProgress,
    onSuccess: () => {
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueReviews });
    },
    // Optimistic update
    onMutate: async (newProgress) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.progress });
      const previous = queryClient.getQueryData(queryKeys.progress);
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.progress, (old: any) => ({
        ...old,
        ...newProgress
      }));
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.progress, context?.previous);
    },
  });
}
```

---

## 4. Authentication & Security

### 4.1 Security Architecture

**No Tokens in localStorage** ✅
- Access token: In-memory only (Zustand, no persist)
- Refresh token: HttpOnly cookie (JavaScript cannot access)
- Automatic token refresh before expiry
- Token rotation on each refresh

**Token Flow**:

```
1. Login → Backend returns:
   - access_token (15 min, in response body)
   - refresh_token (7 days, HttpOnly cookie)

2. Frontend stores access_token in memory (Zustand)

3. API requests include: Authorization: Bearer {access_token}

4. Before access_token expires (13 min):
   → Auto refresh (background)
   → New access_token returned
   → New refresh_token in HttpOnly cookie

5. On page reload:
   → Access token lost (in-memory)
   → Call /api/auth/refresh
   → Get new access_token
   → HttpOnly cookie sent automatically
```

---

### 4.2 Authentication Hook

**File**: `lib/hooks/useAuth.ts`

```typescript
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useTokenRefresh } from './useTokenRefresh';

export function useAuth() {
  const router = useRouter();
  const { accessToken, user, setAccessToken, setUser, logout: clearAuth } = useAuthStore();

  // Auto-refresh token
  useTokenRefresh();

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      // Store access token in memory
      setAccessToken(response.access_token);
      setUser(response.user);

      // Refresh token is already in HttpOnly cookie (set by backend)
      router.push('/dashboard');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authApi.register({ email, password, name });

      setAccessToken(response.access_token);
      setUser(response.user);

      router.push('/dashboard');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Call backend to invalidate refresh token
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear client state
      clearAuth();
      router.push('/login');
    }
  };

  const refreshAccessToken = async () => {
    try {
      // HttpOnly cookie sent automatically
      const response = await authApi.refresh();

      // Update access token in memory
      setAccessToken(response.access_token);

      return true;
    } catch (error) {
      // Refresh failed → logout
      clearAuth();
      router.push('/login');
      return false;
    }
  };

  return {
    user,
    isAuthenticated: !!accessToken && !!user,
    login,
    register,
    logout,
    refreshAccessToken,
  };
}
```

---

### 4.3 Automatic Token Refresh

**File**: `lib/hooks/useTokenRefresh.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { jwtDecode } from 'jwt-decode';

export function useTokenRefresh() {
  const { accessToken, setAccessToken, logout } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    try {
      // Decode token to get expiry
      const decoded = jwtDecode<{ exp: number }>(accessToken);
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Refresh 2 minutes before expiry
      const refreshAt = expiresAt - (2 * 60 * 1000);
      const timeUntilRefresh = refreshAt - now;

      if (timeUntilRefresh > 0) {
        // Schedule refresh
        refreshTimerRef.current = setTimeout(async () => {
          try {
            const response = await authApi.refresh();
            setAccessToken(response.access_token);
            console.log('Token refreshed successfully');
          } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
          }
        }, timeUntilRefresh);
      } else {
        // Token already expired, refresh now
        authApi.refresh()
          .then(response => setAccessToken(response.access_token))
          .catch(() => logout());
      }
    } catch (error) {
      console.error('Token decode error:', error);
      logout();
    }

    // Cleanup
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [accessToken, setAccessToken, logout]);
}
```

---

### 4.4 API Client with Interceptors

**File**: `lib/api/client.ts`

```typescript
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { config } from '@/lib/config';

// Create axios instance
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Send HttpOnly cookies
});

// Request interceptor: Add access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${config.apiUrl}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        // Update token in store
        useAuthStore.getState().setAccessToken(access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed → logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 4.5 Protected Route Component

**File**: `components/auth/ProtectedRoute.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, refreshAccessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated) {
        // Try to refresh token (from HttpOnly cookie)
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
          // No valid session, redirect to login
          router.push('/login');
        }
      }
    };

    initAuth();
  }, [isAuthenticated, refreshAccessToken, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
```

**Usage in Layout**:

```typescript
// app/(dashboard)/layout.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
Page (Server Component)
├── Layout (Server Component)
│   ├── Header (Client Component)
│   ├── Sidebar (Client Component)
│   └── Content Area (Server Component)
│       ├── Dashboard Cards (Client Component)
│       ├── Quiz Interface (Client Component)
│       └── Mascot (Client Component)
```

**Rules**:
- Default to Server Components
- Use Client Components for interactivity
- Minimize Client Component bundle size
- Pass serializable props only

---

### 5.2 Component Patterns

**Server Component** (Default):

```typescript
// app/dashboard/page.tsx
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DueReviews } from '@/components/dashboard/DueReviews';

// ✅ Server Component - fetch data at render time
export default async function DashboardPage() {
  // Data fetching on server
  const stats = await getStats();
  const reviews = await getDueReviews();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>

      {/* Pass data to client components */}
      <DashboardStats stats={stats} />
      <DueReviews reviews={reviews} />
    </div>
  );
}
```

**Client Component** (Interactive):

```typescript
'use client';

// components/dashboard/DashboardStats.tsx
import { Card } from '@/components/ui/card';
import { PixelBadge } from '@/components/shared/PixelBadge';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  stats: {
    xp: number;
    level: number;
    streak: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* XP Card with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-pink-50 border-2 border-pink-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-bold text-gray-900">Experience</h3>
            <PixelBadge type="star" />
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.xp} XP</p>
        </Card>
      </motion.div>

      {/* Similar for Level and Streak */}
    </div>
  );
}
```

---

### 5.3 Composition Patterns

**Container/Presenter Pattern**:

```typescript
// Container (data fetching)
'use client';

import { useQuery } from '@tanstack/react-query';
import { QuizListPresenter } from './QuizListPresenter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export function QuizListContainer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quizzes'],
    queryFn: fetchQuizzes,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <QuizListPresenter quizzes={data} />;
}

// Presenter (pure rendering)
interface QuizListPresenterProps {
  quizzes: Quiz[];
}

export function QuizListPresenter({ quizzes }: QuizListPresenterProps) {
  return (
    <div className="space-y-4">
      {quizzes.map(quiz => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
```

**Compound Component Pattern** (Complex UI):

```typescript
// components/quiz/QuestionCard.tsx
import { createContext, useContext } from 'react';

// Context
const QuestionContext = createContext<Question | null>(null);

// Root component
export function QuestionCard({ question, children }: { question: Question; children: React.ReactNode }) {
  return (
    <QuestionContext.Provider value={question}>
      <div className="bg-white border-4 border-gray-900 rounded-xl p-8">
        {children}
      </div>
    </QuestionContext.Provider>
  );
}

// Sub-components
QuestionCard.Vignette = function Vignette() {
  const question = useContext(QuestionContext);
  return <p className="text-xl font-bold text-gray-900 mb-6">{question?.vignette}</p>;
};

QuestionCard.Options = function Options({ onSelect }: { onSelect: (index: number) => void }) {
  const question = useContext(QuestionContext);
  return (
    <div className="space-y-3">
      {question?.options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="w-full text-left p-4 border-2 border-gray-300 rounded-lg hover:border-accent-pink"
        >
          <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
          {option}
        </button>
      ))}
    </div>
  );
};

// Usage
<QuestionCard question={currentQuestion}>
  <QuestionCard.Vignette />
  <QuestionCard.Options onSelect={handleAnswer} />
</QuestionCard>
```

---

### 5.4 Shared Component Library

**Button Variants** (shadcn/ui style):

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary CTA - Bold Kawaii
        primary: 'bg-accent-pink text-white border-2 border-pink-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] active:translate-y-[1px]',

        // Secondary - Soft Brutalist
        secondary: 'bg-white text-gray-900 border-2 border-gray-300 hover:border-accent-pink hover:text-accent-pink',

        // Pixel - Gamification
        pixel: 'bg-pixel-yellow text-gray-900 border-2 border-yellow-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-pixel text-xs',

        // Ghost
        ghost: 'hover:bg-pink-50 hover:text-accent-pink',

        // Link
        link: 'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// Usage
<Button variant="primary" size="lg">Start Learning</Button>
<Button variant="pixel">CLAIM REWARD</Button>
```

---

## 6. Data Fetching & Caching

### 6.1 React Query Patterns

**Paginated Queries**:

```typescript
// lib/hooks/useMaterials.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';

export function useMaterialsInfinite() {
  return useInfiniteQuery({
    queryKey: ['materials', 'infinite'],
    queryFn: ({ pageParam = 0 }) => materialsApi.getMaterials({
      skip: pageParam,
      limit: 20
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
}

// Usage in component
function MaterialsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMaterialsInfinite();

  return (
    <>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </>
  );
}
```

**Dependent Queries**:

```typescript
export function useMaterialWithChunks(materialId: string) {
  // First, get material
  const { data: material } = useQuery({
    queryKey: queryKeys.material(materialId),
    queryFn: () => materialsApi.getMaterial(materialId),
  });

  // Then, get chunks (only if material exists)
  const { data: chunks } = useQuery({
    queryKey: queryKeys.materialChunks(materialId),
    queryFn: () => materialsApi.getChunks(materialId),
    enabled: !!material, // ✅ Only run if material exists
  });

  return { material, chunks };
}
```

**Optimistic Updates**:

```typescript
export function useUploadMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialsApi.uploadMaterial,

    // Optimistic update
    onMutate: async (file) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.materials });

      const previous = queryClient.getQueryData(queryKeys.materials);

      // Add optimistic material to cache
      queryClient.setQueryData(queryKeys.materials, (old: Material[]) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          filename: file.name,
          status: 'uploading',
          size: file.size,
        },
      ]);

      return { previous };
    },

    // Success
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
    },

    // Error rollback
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKeys.materials, context?.previous);
    },
  });
}
```

---

### 6.2 Caching Strategy

**Cache Hierarchy**:

```typescript
// Long cache (rarely changes)
queryKey: ['user', userId],
staleTime: 1000 * 60 * 30, // 30 minutes
gcTime: 1000 * 60 * 60,    // 1 hour

// Medium cache (changes occasionally)
queryKey: ['materials'],
staleTime: 1000 * 60 * 5,  // 5 minutes
gcTime: 1000 * 60 * 30,    // 30 minutes

// Short cache (changes frequently)
queryKey: ['due-reviews'],
staleTime: 1000 * 60 * 1,  // 1 minute
gcTime: 1000 * 60 * 5,     // 5 minutes

// No cache (real-time)
queryKey: ['quiz', 'active'],
staleTime: 0,
gcTime: 0,
```

---

## 7. Real-time Features

### 7.1 WebSocket Architecture

**WebSocket Hook** (`lib/hooks/useWebSocket.ts`):

```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { config } from '@/lib/config';

interface UseWebSocketOptions {
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    // Create socket connection
    const socket = io(config.wsUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      options.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('message', (data) => {
      options.onMessage?.(data);
    });

    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(err);
      options.onError?.(err);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  };

  const subscribe = (event: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const unsubscribe = (event: string, handler?: (data: any) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    isConnected,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}
```

---

### 7.2 AI Coach Chat Component

**File**: `components/chat/ChatWindow.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { MessageBubble } from './MessageBubble';
import { StreamingResponse } from './StreamingResponse';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { PixelMascot } from '@/components/shared/PixelMascot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, sendMessage, subscribe, unsubscribe } = useWebSocket({
    onConnect: () => console.log('Chat connected'),
    onDisconnect: () => console.log('Chat disconnected'),
  });

  useEffect(() => {
    // Subscribe to chat events
    const handleStreamStart = () => {
      setIsTyping(true);
      setStreamingContent('');
    };

    const handleStreamChunk = (data: { chunk: string }) => {
      setStreamingContent(prev => prev + data.chunk);
    };

    const handleStreamEnd = (data: { message: string }) => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
      setStreamingContent('');
    };

    subscribe('chat:stream:start', handleStreamStart);
    subscribe('chat:stream:chunk', handleStreamChunk);
    subscribe('chat:stream:end', handleStreamEnd);

    return () => {
      unsubscribe('chat:stream:start');
      unsubscribe('chat:stream:chunk');
      unsubscribe('chat:stream:end');
    };
  }, [subscribe, unsubscribe]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to backend
    sendMessage('chat:message', { content });
  };

  return (
    <div className="flex flex-col h-full bg-white border-4 border-gray-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b-2 border-gray-300">
        <PixelMascot mood="thinking" className="w-10 h-10" />
        <div>
          <h3 className="font-bold text-gray-900">AI Coach</h3>
          <p className="text-xs text-gray-600">
            {isConnected ? 'Online' : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming response */}
        {streamingContent && (
          <StreamingResponse content={streamingContent} />
        )}

        {/* Typing indicator */}
        {isTyping && !streamingContent && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!isConnected || isTyping}
      />
    </div>
  );
}
```

**Streaming Response Component**:

```typescript
// components/chat/StreamingResponse.tsx
'use client';

import { motion } from 'framer-motion';
import { marked } from 'marked';

interface StreamingResponseProps {
  content: string;
}

export function StreamingResponse({ content }: StreamingResponseProps) {
  // Parse markdown
  const html = marked(content);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3"
    >
      {/* Mascot avatar */}
      <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
        <span className="text-xl">🤖</span>
      </div>

      {/* Message */}
      <div className="flex-1 bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {/* Blinking cursor */}
        <span className="inline-block w-2 h-4 bg-accent-pink animate-pulse ml-1" />
      </div>
    </motion.div>
  );
}
```

---

## 8. Routing & Navigation

### 8.1 App Router Structure

```typescript
app/
├── (auth)/                    # Auth routes (no dashboard layout)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx             # Minimal layout
│
├── (dashboard)/               # Protected routes (with sidebar)
│   ├── dashboard/page.tsx
│   ├── study/[sessionId]/page.tsx
│   ├── quiz/[quizId]/page.tsx
│   ├── materials/page.tsx
│   ├── progress/page.tsx
│   └── layout.tsx             # Full dashboard layout
│
├── layout.tsx                 # Root layout
└── page.tsx                   # Landing page
```

**Route Groups Benefits**:
- Different layouts without affecting URLs
- Organize routes logically
- Share layouts between related pages

---

### 8.2 Dynamic Routes

**Study Session** (`app/(dashboard)/study/[sessionId]/page.tsx`):

```typescript
interface PageProps {
  params: { sessionId: string };
  searchParams: { topic?: string };
}

export default async function StudySessionPage({ params, searchParams }: PageProps) {
  // Fetch session data on server
  const session = await getSession(params.sessionId);

  if (!session) {
    notFound(); // Show 404 page
  }

  return (
    <div>
      <h1>{session.topic}</h1>
      {/* Session content */}
    </div>
  );
}
```

---

### 8.3 Navigation Component

**File**: `components/layout/Navigation.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Study', href: '/study', icon: BookOpen },
  { name: 'Quiz', href: '/quiz', icon: Brain },
  { name: 'Materials', href: '/materials', icon: FileText },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
              isActive
                ? 'bg-accent-pink text-white font-semibold'
                : 'text-gray-700 hover:bg-pink-50 hover:text-accent-pink'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## 9. Form Handling

### 9.1 Form Architecture

**React Hook Form + Zod**:

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

**Schema Definition** (`lib/schemas/auth.ts`):

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

---

### 9.2 Form Component

**File**: `components/auth/LoginForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useState } from 'react';

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);

    const result = await login(data.email, data.password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
```

---

### 9.3 File Upload Form

**File**: `components/materials/FileUploader.tsx`

```typescript
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { queryKeys } from '@/lib/api/queryKeys';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export function FileUploader() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => materialsApi.uploadMaterial(file, {
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? (progressEvent.loaded / progressEvent.total) * 100
          : 0;
        setUploadProgress(Math.round(progress));
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large (max 50MB)');
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, DOCX, or TXT files.');
      return;
    }

    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
          isDragActive && 'border-accent-pink bg-pink-50',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive && 'border-gray-300 hover:border-accent-pink hover:bg-pink-50'
        )}
      >
        <input {...getInputProps()} />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

        {isDragActive ? (
          <p className="text-lg font-semibold text-accent-pink">
            Drop your file here
          </p>
        ) : (
          <>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Drag & drop your study material
            </p>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse (PDF, DOCX, TXT)
            </p>
            <Button variant="secondary">
              Browse Files
            </Button>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploadMutation.isPending && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-pink" />
              <span className="font-semibold text-gray-900">Uploading...</span>
            </div>
            <span className="text-sm text-gray-600">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Success message */}
      {uploadMutation.isSuccess && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-semibold">
            ✓ File uploaded successfully!
          </p>
        </div>
      )}

      {/* Error message */}
      {uploadMutation.isError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">
            Error: {uploadMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 10. Performance Optimization

### 10.1 Image Optimization

**Next.js Image Component**:

```typescript
import Image from 'next/image';

// Optimized image loading
<Image
  src="/pixel-art/mascot/happy.png"
  alt="Happy mascot"
  width={64}
  height={64}
  className="pixelated"
  priority={false}  // Lazy load by default
  placeholder="blur"  // Show blur while loading
/>
```

**CSS for Pixel Art**:

```css
/* styles/globals.css */
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

---

### 10.2 Code Splitting

**Dynamic Imports**:

```typescript
import dynamic from 'next/dynamic';

// Heavy components loaded on demand
const SkillTreeCanvas = dynamic(() => import('@/components/skill-tree/SkillTreeCanvas'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Client-side only
});

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  loading: () => <Skeleton className="h-64" />,
});

// Usage
export default function LearningMapPage() {
  return (
    <div>
      <h1>Learning Path</h1>
      <SkillTreeCanvas />
    </div>
  );
}
```

---

### 10.3 Memoization

**React.memo** for expensive renders:

```typescript
import { memo } from 'react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (index: number) => void;
}

export const QuestionCard = memo(function QuestionCard({
  question,
  onAnswer
}: QuestionCardProps) {
  return (
    <div className="bg-white border-4 border-gray-900 rounded-xl p-8">
      <h2>{question.vignette}</h2>
      {/* Expensive render logic */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.question.id === nextProps.question.id;
});
```

**useMemo** for expensive calculations:

```typescript
import { useMemo } from 'react';

function QuizSummary({ answers, questions }: QuizSummaryProps) {
  // Expensive calculation - only recompute when dependencies change
  const analytics = useMemo(() => {
    return calculateDetailedAnalytics(answers, questions);
  }, [answers, questions]);

  return (
    <div>
      <p>Score: {analytics.score}%</p>
      <p>Time: {analytics.averageTime}s</p>
    </div>
  );
}
```

**useCallback** for stable functions:

```typescript
import { useCallback } from 'react';

function QuizInterface() {
  // Stable callback reference
  const handleAnswer = useCallback((index: number) => {
    recordAnswer(index);
  }, []); // No dependencies - function never changes

  return (
    <QuestionCard
      question={currentQuestion}
      onAnswer={handleAnswer}  // Same reference on every render
    />
  );
}
```

---

### 10.4 Bundle Analysis

**Install analyzer**:

```bash
pnpm add -D @next/bundle-analyzer
```

**Configure** (`next.config.js`):

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... other config
});
```

**Analyze**:

```bash
ANALYZE=true pnpm build
```

---

## 11. Styling Architecture

### 11.1 Tailwind Configuration

**File**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kawaii Pastels
        'kawaii-pink': '#FFE5EC',
        'kawaii-blue': '#E0F4FF',
        'kawaii-green': '#E8F8E8',
        'kawaii-lavender': '#F0E8FF',
        'kawaii-peach': '#FFF0E5',
        'kawaii-mint': '#E5FFF0',

        // Accent Colors
        'accent-pink': '#FF6B9D',
        'accent-blue': '#4A90E2',
        'accent-purple': '#9B59B6',
        'accent-coral': '#FF7675',
        'accent-teal': '#00B894',

        // Pixel Palette
        'pixel-pink': '#FF77A9',
        'pixel-yellow': '#FFD93D',
        'pixel-green': '#6BCF7F',
        'pixel-red': '#FF6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      borderRadius: {
        'sm': '0.375rem',  // 6px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.5rem',   // 24px
      },
      boxShadow: {
        'brutalist': '8px 8px 0px 0px rgba(0,0,0,1)',
        'brutalist-sm': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutalist-pink': '4px 4px 0px 0px rgba(255,107,157,0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

---

### 11.2 Global Styles

**File**: `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Font imports */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  /* Root variables */
  :root {
    --background: #ffffff;
    --foreground: #1a1a1a;
  }

  /* Base styles */
  * {
    @apply border-gray-300;
  }

  body {
    @apply bg-white text-gray-900 font-sans;
  }

  /* Pixel art rendering */
  .pixelated {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
}

@layer components {
  /* Brutalist card shadow */
  .shadow-brutalist {
    box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
  }

  .shadow-brutalist-sm {
    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
  }

  /* Kawaii glow effect */
  .glow-pink {
    box-shadow: 0 0 20px rgba(255,107,157,0.3);
  }
}

@layer utilities {
  /* Hide scrollbar */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Glassmorphism */
  .glass {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }
}

/* Animations */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  background: #d1d1d1;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: #FF6B9D;
}
```

---

## 12. TypeScript Patterns

### 12.1 Type Definitions

**File**: `src/types/index.ts`

```typescript
// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  currentStreak: number;
  maxStreak: number;
  dailyGoalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Material types
export interface Material {
  id: string;
  userId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  title: string;
  description?: string;
  topic?: string;
  tags?: string[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  chunkCount: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Question types
export interface Question {
  id: string;
  materialId?: string;
  vignette: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nbme';
  qualityScore: number;
  timesAnswered: number;
  timesCorrect: number;
  createdAt: string;
}

// Progress types
export interface Progress {
  id: string;
  userId: string;
  questionId: string;
  answeredAt: string;
  isCorrect: boolean;
  confidenceRating: number;
  timeTakenSeconds: number;
  xpEarned: number;
  sm2Interval: number;
  sm2EasinessFactor: number;
  sm2Repetition: number;
  nextReviewDate: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
```

---

### 12.2 Utility Types

```typescript
// Make all properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Extract nested type
export type Await<T> = T extends Promise<infer U> ? U : T;

// Component props with children
export type WithChildren<T = {}> = T & { children: React.ReactNode };

// Component props with className
export type WithClassName<T = {}> = T & { className?: string };
```

---

### 12.3 Generic Hooks

```typescript
// Generic fetch hook
export function useFetch<T>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn: fetcher,
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });
}

// Generic mutation hook
export function useMutate<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      options?.invalidateQueries?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    onError: options?.onError,
  });
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests (Vitest)

**File**: `__tests__/unit/utils/format.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatDuration, formatXP } from '@/lib/utils/format';

describe('Format Utils', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes correctly', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('formats hours correctly', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s');
    });
  });

  describe('formatXP', () => {
    it('formats small numbers', () => {
      expect(formatXP(500)).toBe('500 XP');
    });

    it('formats large numbers with K', () => {
      expect(formatXP(5000)).toBe('5K XP');
    });
  });
});
```

**Component Test**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

---

### 13.2 E2E Tests (Playwright)

**File**: `__tests__/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can log in successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Should see user name
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

**Quiz Flow Test**:

```typescript
test.describe('Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('user can complete a quiz', async ({ page }) => {
    // Navigate to quiz
    await page.click('text=Quiz');
    await expect(page).toHaveURL('**/quiz');

    // Start quiz
    await page.click('text=Start Quiz');

    // Answer all questions
    for (let i = 0; i < 10; i++) {
      // Select first option
      await page.click('button:has-text("A.")');

      // Rate confidence
      await page.click('button:has-text("3")');

      // Next question (or submit on last)
      if (i < 9) {
        await page.click('text=Next Question');
      } else {
        await page.click('text=Submit Quiz');
      }
    }

    // Should see results
    await expect(page.locator('text=Quiz Complete')).toBeVisible();
    await expect(page.locator('text=/Score: \\d+\\/10/')).toBeVisible();
  });
});
```

---

## 14. Implementation Roadmap

### 14.1 Phase 0-1: Foundation (Weeks 1-4)

**Week 1-2: Project Setup**
- [ ] Initialize Next.js 15 project with App Router
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up Tailwind CSS with custom config
- [ ] Install dependencies (React Query, Zustand, etc.)
- [ ] Create directory structure
- [ ] Set up environment variables

**Week 3-4: Core Architecture**
- [ ] Implement auth store (Zustand, no persist)
- [ ] Create API client with interceptors
- [ ] Set up React Query with providers
- [ ] Build login/register pages
- [ ] Implement HttpOnly cookie auth flow
- [ ] Create protected route wrapper
- [ ] Build dashboard layout (header, sidebar)

---

### 14.2 Phase 2-3: Core Features (Weeks 5-10)

**Week 5-6: Materials Management**
- [ ] Build file upload component with drag-and-drop
- [ ] Implement upload progress tracking
- [ ] Create materials list with filters
- [ ] Add processing status indicators
- [ ] Build material detail page

**Week 7-8: AI Coach Chat**
- [ ] Implement WebSocket hook
- [ ] Build chat window UI
- [ ] Create streaming response component
- [ ] Add typing indicators
- [ ] Implement message history
- [ ] Add pixel mascot with moods

**Week 9-10: Study Sessions**
- [ ] Build study session page
- [ ] Create content card components
- [ ] Implement session progress tracking
- [ ] Add related topics sidebar

---

### 14.3 Phase 4-5: Quiz & Spaced Repetition (Weeks 11-15)

**Week 11-12: Quiz Interface**
- [ ] Create quiz store (Zustand)
- [ ] Build question card component
- [ ] Implement option selection UI
- [ ] Add confidence rating slider
- [ ] Create timer component
- [ ] Build quiz summary page

**Week 13-14: Spaced Repetition**
- [ ] Implement due reviews dashboard
- [ ] Create review session UI
- [ ] Add SM-2 algorithm client-side calculations
- [ ] Build retention graph component

**Week 15: Progress Analytics**
- [ ] Create analytics dashboard
- [ ] Implement charts (Recharts)
- [ ] Build topic mastery heatmap
- [ ] Add performance over time graph

---

### 14.4 Phase 6: Gamification (Weeks 16-18)

**Week 16: XP & Leveling**
- [ ] Build XP bar component with animations
- [ ] Create level badge component
- [ ] Implement level-up modal
- [ ] Add XP earning animations

**Week 17: Streaks & Achievements**
- [ ] Build streak counter with fire icon
- [ ] Create achievement card component
- [ ] Implement achievement unlock modal
- [ ] Add achievement showcase

**Week 18: Pixel Art Assets**
- [ ] Design pixel art mascot (5 moods)
- [ ] Create pixel art badges (star, trophy, fire)
- [ ] Build pixel asset library
- [ ] Implement mascot mood system

---

### 14.5 Phase 7-8: Polish & Deploy (Weeks 19-22)

**Week 19-20: Performance Optimization**
- [ ] Bundle analysis and code splitting
- [ ] Image optimization (Next.js Image)
- [ ] Memoization of expensive components
- [ ] Lazy loading for heavy components
- [ ] Preload critical resources

**Week 21: Testing**
- [ ] Write unit tests for utilities
- [ ] Write component tests (Vitest + RTL)
- [ ] Write E2E tests (Playwright)
- [ ] Manual QA testing

**Week 22: Deployment**
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Set up monitoring (Sentry)
- [ ] Performance monitoring (Web Vitals)

---

## Conclusion

This frontend architecture provides:

✅ **Security-First**: No tokens in localStorage, automatic refresh, HttpOnly cookies
✅ **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
✅ **Scalable State**: Three-layer state model (server/global/local)
✅ **Real-time**: WebSocket integration for AI coach
✅ **Performance**: Server Components, code splitting, memoization
✅ **Type-Safe**: Full TypeScript coverage with strict mode
✅ **Testable**: Unit, integration, and E2E tests
✅ **Accessible**: WCAG compliance, keyboard navigation
✅ **Delightful UX**: Soft Kawaii Brutalist UI, smooth animations

**Next Steps**:
1. Review this architecture with team
2. Set up development environment
3. Begin Phase 0-1 implementation
4. Iterate based on learnings

---

**Related Documents**:
- [TECH_SPEC.md](/Users/kyin/Projects/Studyin/TECH_SPEC.md) - Technical specifications
- [PRD.md](/Users/kyin/Projects/Studyin/PRD.md) - Product requirements
- [DESIGN_SYSTEM.md](/Users/kyin/Projects/Studyin/DESIGN_SYSTEM.md) - Visual design system
- [SECURITY_QUICK_FIXES.md](/Users/kyin/Projects/Studyin/SECURITY_QUICK_FIXES.md) - Security implementation

**Living Document**: Update this architecture as patterns evolve and new requirements emerge.
