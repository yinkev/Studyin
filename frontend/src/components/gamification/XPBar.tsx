import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface XPBarProps {
  currentXP: number;
  targetXP: number;
  level: number;
  label?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function XPBar({ currentXP, targetXP, level, label = 'XP to next level', className }: XPBarProps) {
  const { progressPercent, xpRemaining, effectiveCurrent } = useMemo(() => {
    const safeTarget = Math.max(targetXP, 1);
    const limitedCurrent = clamp(currentXP, 0, safeTarget);
    const percent = (limitedCurrent / safeTarget) * 100;
    return {
      progressPercent: Number(percent.toFixed(2)),
      xpRemaining: Math.max(safeTarget - limitedCurrent, 0),
      effectiveCurrent: limitedCurrent,
    };
  }, [currentXP, targetXP]);

  const isLevelReady = currentXP >= targetXP;

  return (
    <section
      className={cn(
        'soft-card pixel-border overflow-hidden',
        'bg-gradient-to-br from-white/90 via-white/70 to-primary/10',
        className
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="badge-soft font-pixel text-[0.6rem] tracking-[0.2em] text-primary-foreground">
            Level {level}
          </span>
          <h3 className="text-brutalist text-base text-foreground">XP Progress</h3>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {effectiveCurrent.toLocaleString()} / {Math.max(targetXP, 1).toLocaleString()} XP
          </p>
          <p className="text-xs text-muted-foreground">
            {isLevelReady ? 'Ready to level up!' : `${xpRemaining.toLocaleString()} XP to level up`}
          </p>
        </div>
      </div>

      <div
        className="relative mt-6 h-5 w-full overflow-hidden rounded-full border border-white/60 bg-gradient-to-r from-white to-white/40 shadow-inner"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${Math.round(progressPercent)} percent of goal reached`}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent',
            'shadow-soft-button transition-all duration-500 ease-soft-bounce'
          )}
          style={{ width: `${clamp(progressPercent, 0, 100)}%` }}
        />
        <div
          className="absolute -top-2 size-6 rounded-sm border border-black/10 bg-white font-pixel text-[0.55rem] leading-6 text-center text-foreground shadow-soft-button"
          style={{ left: `calc(${clamp(progressPercent, 0, 100)}% - 0.75rem)` }}
          aria-hidden="true"
        >
          {Math.round(progressPercent)}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-2 font-medium text-foreground">
          <span className="kawaii-icon size-8 text-lg" aria-hidden="true">
            ✨
          </span>
          Daily focus bonus active
        </div>
        <span className="font-pixel text-[0.55rem] tracking-[0.3em] text-accent-foreground">
          KEEP CALM · KEEP LEARNING
        </span>
      </div>
    </section>
  );
}

export default XPBar;
