import { cn } from '@/lib/utils';

export interface LevelBadgeProps {
  level: number;
  title?: string;
  masteryPercent?: number;
  className?: string;
}

export function LevelBadge({ level, title = 'Scholar', masteryPercent = 0, className }: LevelBadgeProps) {
  const sanitizedPercent = Math.max(0, Math.min(100, masteryPercent));

  return (
    <div
      className={cn(
        'soft-card pixel-border flex items-center gap-4 glass',
        'px-5 py-4',
        className
      )}
      aria-label={`Level ${level} badge`}
    >
      <div className="kawaii-icon size-12 text-2xl" aria-hidden="true">
        🩺
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-baseline gap-3 text-foreground">
          <span className="font-pixel text-3xl leading-none text-primary">{level}</span>
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full bg-accent transition-all duration-500 ease-soft-bounce"
            style={{ width: `${sanitizedPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Mastery progress: {sanitizedPercent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default LevelBadge;
