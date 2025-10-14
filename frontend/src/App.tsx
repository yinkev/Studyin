import { useState, lazy, Suspense } from 'react';
import { NavBar, type View } from '@/components/NavBar';
import { ModernDashboard } from '@/pages/ModernDashboard';
import { useChatSession } from '@/hooks/useChatSession';
import { Toaster } from 'sonner';

// Lazy load heavy views to reduce initial bundle size
const UploadView = lazy(() => import('@/pages/UploadView').then(m => ({ default: m.UploadView })));
const ChatView = lazy(() => import('@/pages/ChatView').then(m => ({ default: m.ChatView })));
const AnalyticsView = lazy(() => import('@/pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const SettingsView = lazy(() => import('@/pages/SettingsView').then(m => ({ default: m.SettingsView })));
const QuizView = lazy(() => import('@/pages/QuizView').then(m => ({ default: m.QuizView })));
const FirstPassView = lazy(() => import('@/pages/FirstPassView').then(m => ({ default: m.FirstPassView })));
const ReviewView = lazy(() => import('@/pages/ReviewView').then(m => ({ default: m.ReviewView })));
const QuestionBankView = lazy(() => import('@/pages/QuestionBankView').then(m => ({ default: m.QuestionBankView })));

// Loading fallback component
function ViewLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="soft-card pixel-border px-8 py-6">
        <p className="text-brutalist text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function resolveInitialView(): View {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  const q = (params.get('view') || window.location.hash.replace('#', '') || '').toLowerCase();
  if (q === 'chat' || q === 'upload' || q === 'analytics' || q === 'dashboard' || q === 'settings' || q === 'quiz' || q === 'firstpass' || q === 'review' || q === 'questions') return q as View;
  return 'dashboard';
}

function App() {
  const [currentView, setCurrentView] = useState<View>(resolveInitialView());
  // No placeholders: initialize with zeros and let real analytics populate later
  const [gamificationStats, setGamificationStats] = useState(() => ({
    level: 1,
    currentXP: 0,
    targetXP: 0,
    streak: 0,
    bestStreak: 0,
    lastCheckIn: null as string | null,
    masteryPercent: 0,
    goalMinutes: 0,
  }));
  const [dueCount, setDueCount] = useState(0);

  const chatSession = useChatSession({ autoReconnect: false, autoConnect: false });

  // Fetch dynamic stats (gamification + reviews) once on mount
  // Keep simple and light to avoid adding heavy state management
  // These endpoints are already implemented on the backend
  if (typeof window !== 'undefined') {
    // lazy import to avoid bundling cost until runtime
    import('@/lib/api/analytics').then(async (m) => {
      try {
        const g = await m.getGamificationProgress?.();
        if (g) {
          setGamificationStats((s) => ({
            ...s,
            level: g.current_level ?? s.level,
            currentXP: g.current_xp ?? s.currentXP,
            targetXP: (g.current_level ?? 1) * 100,
            streak: g.streak_history?.at(-1)?.streak ?? s.streak,
          }));
        }
      } catch {}
    });
    import('@/lib/api/reviews').then(async (m) => {
      try {
        const c = await m.getDueCount?.(true);
        setDueCount(Number(c || 0));
      } catch {}
    });
  }

  // Expose view for E2E diagnostics in dev
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__studyin_view = currentView;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__studyin_setView = (v: View) => setCurrentView(v);
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      <Suspense fallback={<ViewLoader />}>
        {currentView === 'dashboard' && (
          <ModernDashboard
            onNavigate={setCurrentView}
            stats={gamificationStats}
          />
        )}
        {currentView !== 'dashboard' && (
          <div className="min-h-screen flex flex-col">
            <NavBar currentView={currentView} onNavigate={setCurrentView} stats={gamificationStats} dueCount={dueCount} />
            <main className="flex-1">
              {currentView === 'analytics' && <AnalyticsView onNavigate={setCurrentView} />}
              {currentView === 'upload' && <UploadView onNavigate={setCurrentView} />}
              {currentView === 'chat' && <ChatView {...chatSession} onNavigate={setCurrentView} />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'quiz' && <QuizView onNavigate={setCurrentView} />}
              {currentView === 'firstpass' && <FirstPassView onNavigate={setCurrentView} />}
              {currentView === 'review' && <ReviewView onNavigate={setCurrentView} />}
              {currentView === 'questions' && <QuestionBankView onNavigate={setCurrentView} />}
            </main>
          </div>
        )}
      </Suspense>
    </>
  );
}

export default App;
