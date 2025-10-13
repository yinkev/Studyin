import { Button } from '@/components/ui/button';
import { LayoutDashboard, Upload, MessageSquare, BarChart3 } from 'lucide-react';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { LevelBadge } from '@/components/gamification/LevelBadge';

export type View = 'dashboard' | 'upload' | 'chat' | 'analytics';

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
}

export function NavBar({ currentView, onNavigate, stats }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-20 border-b border-border/50 bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-3">
              <span className="kawaii-icon size-12 text-2xl" aria-hidden="true">
                🌸
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
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'analytics' ? 'default' : 'ghost'}
              onClick={() => onNavigate('analytics')}
              className="gap-2 text-sm"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Analytics
            </Button>
            <Button
              variant={currentView === 'upload' ? 'default' : 'ghost'}
              onClick={() => onNavigate('upload')}
              className="gap-2 text-sm"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload
            </Button>
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => onNavigate('chat')}
              className="gap-2 text-sm"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Chat
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <LevelBadge
            level={stats.level}
            masteryPercent={stats.masteryPercent ?? Math.min((stats.currentXP / stats.targetXP) * 100, 100)}
            title="Resident"
            className="px-4 py-4"
          />
          <XPBar
            level={stats.level}
            currentXP={stats.currentXP}
            targetXP={stats.targetXP}
            label="Today's focus XP"
            className="px-4 py-4"
          />
          <StreakCounter
            variant="compact"
            streak={stats.streak}
            bestStreak={stats.bestStreak}
            lastCheckIn={stats.lastCheckIn}
            goalMinutes={stats.goalMinutes}
            className="px-4 py-4"
          />
        </div>
      </div>
    </nav>
  );
}
