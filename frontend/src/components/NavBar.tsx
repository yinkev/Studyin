import { Button } from '@/components/ui/button';
import { LayoutDashboard, Upload, MessageSquare, BarChart3, Stethoscope } from 'lucide-react';
import { ModernXPBar } from '@/components/dashboard/ModernXPBar';
import { ModernStreakCard } from '@/components/dashboard/ModernStreakCard';
import { LevelCard } from '@/components/dashboard/LevelCard';

export type View = 'dashboard' | 'upload' | 'chat' | 'analytics' | 'quiz' | 'firstpass' | 'review' | 'questions' | 'settings';

interface NavBarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  stats: {
    level: number;
    currentXP: number;
    targetXP: number;
    streak: number;
    bestStreak?: number;
    lastCheckIn?: string | null;
    masteryPercent?: number;
    goalMinutes?: number;
  };
  dueCount?: number;
}

export function NavBar({ currentView, onNavigate, stats, dueCount = 0 }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-20 border-b border-border/50 bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-3">
              <span className="size-12 flex items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                <Stethoscope className="w-6 h-6 text-primary" />
              </span>
              <div>
                <p className="text-brutalist text-lg leading-none text-foreground">StudyIn</p>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Medical Learning Companion
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onNavigate('dashboard')}
              className="gap-2 text-sm"
              data-testid="nav-dashboard"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'quiz' ? 'default' : 'ghost'}
              onClick={() => onNavigate('quiz')}
              className="gap-2 text-sm"
              data-testid="nav-quiz"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Practice
            </Button>
            <Button
              variant={currentView === 'quiz' ? 'ghost' : 'ghost'}
              onClick={() => onNavigate('questions' as any)}
              className="gap-2 text-sm"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Bank
            </Button>
            <Button
              variant={currentView === 'analytics' ? 'default' : 'ghost'}
              onClick={() => onNavigate('analytics')}
              className="gap-2 text-sm"
              data-testid="nav-analytics"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Analytics
            </Button>
            <Button
              variant={currentView === 'review' ? 'default' : 'ghost'}
              onClick={() => onNavigate('review')}
              className="gap-2 text-sm"
              data-testid="nav-review"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Review
              {dueCount > 0 && (
                <span className="ml-2 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold">
                  {dueCount}
                </span>
              )}
            </Button>
            <Button
              variant={currentView === 'upload' ? 'default' : 'ghost'}
              onClick={() => onNavigate('upload')}
              className="gap-2 text-sm"
              data-testid="nav-upload"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload
            </Button>
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => onNavigate('chat')}
              className="gap-2 text-sm"
              data-testid="nav-chat"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Chat
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <LevelCard
            level={stats.level}
            masteryPercent={stats.masteryPercent ?? Math.min((stats.currentXP / Math.max(stats.targetXP,1)) * 100, 100)}
            className="px-4 py-4 glass"
          />
          <ModernXPBar
            level={stats.level}
            currentXP={stats.currentXP}
            targetXP={stats.targetXP}
            className="px-4 py-4 glass"
          />
          <ModernStreakCard
            streak={stats.streak}
            bestStreak={stats.bestStreak ?? stats.streak}
            lastCheckIn={stats.lastCheckIn}
            className="px-4 py-4"
          />
        </div>
      </div>
    </nav>
  );
}
