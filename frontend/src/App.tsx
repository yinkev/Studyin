import { useState, lazy, Suspense } from 'react';
import { NavBar, type View } from '@/components/NavBar';
import { Dashboard } from '@/pages/Dashboard';
import { useChatSession } from '@/hooks/useChatSession';
import { Toaster } from 'sonner';

// Lazy load heavy views to reduce initial bundle size
const UploadView = lazy(() => import('@/pages/UploadView').then(m => ({ default: m.UploadView })));
const ChatView = lazy(() => import('@/pages/ChatView').then(m => ({ default: m.ChatView })));
const AnalyticsView = lazy(() => import('@/pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })));

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

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  // No placeholders: initialize with zeros and let real analytics populate later
  const [gamificationStats] = useState(() => ({
    level: 1,
    currentXP: 0,
    targetXP: 0,
    streak: 0,
    bestStreak: 0,
    lastCheckIn: null as string | null,
    masteryPercent: 0,
    goalMinutes: 0,
  }));

  const chatSession = useChatSession({ autoReconnect: false, autoConnect: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar currentView={currentView} onNavigate={setCurrentView} stats={gamificationStats} />

      <main className="flex-1">
        <Suspense fallback={<ViewLoader />}>
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} stats={gamificationStats} />}
          {currentView === 'analytics' && <AnalyticsView onNavigate={setCurrentView} />}
          {currentView === 'upload' && <UploadView onNavigate={setCurrentView} />}
          {currentView === 'chat' && <ChatView {...chatSession} onNavigate={setCurrentView} />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
