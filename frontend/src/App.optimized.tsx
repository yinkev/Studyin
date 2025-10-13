import { useState, lazy, Suspense } from 'react';
import { NavBar, type View } from '@/components/NavBar';
import { Dashboard } from '@/pages/Dashboard';
import { Toaster } from 'sonner';

// Lazy load heavy views - ChatView has WebSocket overhead
const UploadView = lazy(() => import('@/pages/UploadView').then(m => ({ default: m.UploadView })));
const ChatView = lazy(() => import('@/pages/ChatView').then(m => ({ default: m.ChatView })));

// Lazy load the chat session hook only when needed
const useChatSessionLazy = () => {
  const module = require('@/hooks/useChatSession');
  return module.useChatSession();
};

// Simple loading fallback that matches your design
function ViewLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [chatSession, setChatSession] = useState<any>(null);
  const [gamificationStats] = useState(() => ({
    level: 3,
    currentXP: 1240,
    targetXP: 1800,
    streak: 9,
    bestStreak: 15,
    lastCheckIn: new Date().toISOString(),
    masteryPercent: 62,
    goalMinutes: 45,
  }));

  // Initialize chat session only when navigating to chat
  const handleNavigate = (view: View) => {
    if (view === 'chat' && !chatSession) {
      setChatSession(useChatSessionLazy());
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar currentView={currentView} onNavigate={handleNavigate} stats={gamificationStats} />

      <main className="flex-1">
        <Suspense fallback={<ViewLoader />}>
          {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} stats={gamificationStats} />}
          {currentView === 'upload' && <UploadView onNavigate={handleNavigate} />}
          {currentView === 'chat' && chatSession && (
            <ChatView {...chatSession} onNavigate={handleNavigate} />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
