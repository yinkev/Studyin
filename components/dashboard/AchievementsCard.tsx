'use client';

import { BentoCard } from '../layout/BentoCard';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  completed: boolean;
}

interface AchievementsCardProps {
  achievements: Achievement[];
  isLoading?: boolean;
  size?: 'full' | 'xl';
}

export function AchievementsCard({ achievements, isLoading = false, size = 'full' }: AchievementsCardProps) {
  const completedCount = achievements.filter(a => a.completed).length;

  return (
    <BentoCard size={size}>
      <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card interactive-card">
        <div className="flex gap-3 items-center mb-4">
          <div className="p-2.5 rounded-xl bg-warning/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-text-high">Achievements</p>
            <p className="text-xs text-text-med">
              {completedCount} of {achievements.length} unlocked
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bento-skeleton" aria-hidden></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-xl border text-center transition-all ${
                  achievement.completed
                    ? 'bg-gradient-to-br from-warning/20 to-semantic-success/20 border-warning/40 shadow-lg achievement-unlocked'
                    : 'bg-surface-bg3/40 border-border-subtle hover:border-border-med'
                }`}
                role="group"
                aria-label={`${achievement.name} ${achievement.completed ? 'unlocked' : 'locked'}`}
                title={`${achievement.name} — ${achievement.description}`}
              >
                <div className="text-3xl mb-2" aria-hidden>{achievement.icon}</div>
                <p className={`text-xs font-bold ${achievement.completed ? 'text-warning' : 'text-text-med'}`}>
                  {achievement.name}
                </p>

                {!achievement.completed ? (
                  <div className="mt-2" aria-label={`${Math.round(achievement.progress)} percent complete`}>
                    <md-linear-progress value={Math.max(0, Math.min(1, achievement.progress / 100))}></md-linear-progress>
                    <p className="text-xs text-text-low mt-1 tabular-nums">
                      {Math.round(achievement.progress)}%
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    {/* subtle celebratory ripple/elevation handled by CSS */}
                  </div>
                )}
                <md-ripple></md-ripple>
              </div>
            ))}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
