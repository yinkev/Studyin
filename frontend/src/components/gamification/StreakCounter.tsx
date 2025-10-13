import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface StreakCounterProps {
  streak: number;
  bestStreak?: number;
  lastCheckIn?: string | null;
  goalMinutes?: number;
  className?: string;
  variant?: 'default' | 'compact';
}

const STREAK_WINDOW = 7;

export function StreakCounter({
  streak,
  bestStreak,
  lastCheckIn,
  goalMinutes = 45,
  variant = 'default',
  className,
}: StreakCounterProps) {
  const formattedLastCheckIn = useMemo(() => {
    if (!lastCheckIn) {
      return 'No study session yet';
    }

    const date = new Date(lastCheckIn);
    if (Number.isNaN(date.valueOf())) {
      return 'Last session date unavailable';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, [lastCheckIn]);

  const dayTokens = useMemo(() => {
    const cappedStreak = Math.max(streak, 0);
    const completedInWindow = Math.min(cappedStreak, STREAK_WINDOW);
    return Array.from({ length: STREAK_WINDOW }, (_, index) => index < completedInWindow);
  }, [streak]);

  if (variant === 'compact') {
    return (
      <section
        className={cn(
          'soft-card pixel-border flex flex-col gap-4 glass px-4 py-4',
          className
        )}
        aria-label="Study streak summary"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="badge-soft text-[0.55rem] font-semibold tracking-[0.14em] text-secondary-foreground">
            Streak
          </span>
          <span className="font-pixel text-[0.55rem] tracking-[0.3em] text-muted-foreground">
            KEEP GOING
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-end gap-2">
            <p className="font-pixel text-3xl leading-none text-primary">{streak}</p>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              days
            </span>
          </div>
          {bestStreak !== undefined && (
            <span className="text-[0.65rem] text-muted-foreground">Best {bestStreak}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          {dayTokens.map((completed, index) => (
            <span
              key={index}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-sm border border-white/60 bg-white/70',
                completed ? 'text-secondary-foreground' : 'opacity-45'
              )}
              aria-label={`Day ${index + 1} ${completed ? 'complete' : 'pending'}`}
            >
              <span className="font-pixel text-[0.5rem] leading-none">{completed ? '★' : '·'}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-[0.6rem]">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/20 px-2 py-1 font-semibold text-accent-foreground">
            🎯 {goalMinutes} min goal
          </span>
          <span className="text-muted-foreground">{formattedLastCheckIn}</span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'soft-card pixel-border backdrop-blur-xl glass',
        className
      )}
      aria-label="Study streak summary"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="badge-soft text-[0.6rem] font-semibold tracking-[0.18em] text-secondary-foreground">
          Study Streak
        </span>
        <span className="font-pixel text-[0.6rem] tracking-[0.3em] text-muted-foreground">
          HABIT · BUILT
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-end gap-3">
            <p className="font-pixel text-4xl leading-none text-primary">{streak}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              Day streak
            </span>
          </div>
          {bestStreak !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">Best streak: {bestStreak} days</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Last session: {formattedLastCheckIn}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
            🎯 Daily goal {goalMinutes} min
          </span>
          <p className="max-w-[16rem] text-right text-xs text-muted-foreground">
            Consistency beats intensity. Stay playful, skip the punishment loops.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex w-full items-center justify-between gap-1">
          {dayTokens.map((completed, index) => (
            <span
              key={index}
              className={cn(
                'relative flex h-10 flex-1 items-center justify-center rounded-md border border-white/50',
                'bg-white/70 shadow-soft-button transition-all duration-300 ease-soft-bounce',
                completed ? 'text-secondary-foreground' : 'opacity-50'
              )}
              aria-label={`Day ${index + 1} ${completed ? 'complete' : 'pending'}`}
            >
              <span
                className={cn(
                  'font-pixel text-[0.55rem] tracking-[0.2em]',
                  completed ? 'text-secondary-foreground' : 'text-muted-foreground'
                )}
              >
                {completed ? '★' : '·'}
              </span>
              <span
                className={cn(
                  'absolute inset-0 rounded-md border-4 border-transparent',
                  'outline -outline-offset-2 outline-2',
                  completed ? 'outline-secondary/50' : 'outline-transparent'
                )}
                aria-hidden="true"
              />
            </span>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Habit science says keep rewards immediate. Log a session today to protect your streak.
      </p>
    </section>
  );
}

export default StreakCounter;
