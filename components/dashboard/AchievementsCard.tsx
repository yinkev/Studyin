'use client';

import { BentoCard } from '../layout/BentoCard';
import { Progress, Tooltip, Skeleton } from '@mantine/core';

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
      <div className="p-6">
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
              <Skeleton key={i} height={96} radius="md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <Tooltip
                key={achievement.id}
                label={
                  <div className="p-2">
                    <p className="font-bold text-sm mb-1">{achievement.name}</p>
                    <p className="text-xs text-text-med mb-2">{achievement.description}</p>
                    <Progress value={achievement.progress} size="sm" />
                    <p className="text-xs mt-1">
                      {Math.round(achievement.progress)}% complete
                    </p>
                  </div>
                }
              >
                <div
                  className={`p-4 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 ${
                    achievement.completed
                      ? 'bg-gradient-to-br from-warning/20 to-semantic-success/20 border-warning/40 shadow-lg'
                      : 'bg-surface-bg3/40 border-border-subtle opacity-60'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className={`text-xs font-bold ${achievement.completed ? 'text-warning' : 'text-text-med'}`}>
                    {achievement.name}
                  </p>
                  {!achievement.completed && (
                    <p className="text-xs text-text-low mt-1 tabular-nums">
                      {Math.round(achievement.progress)}%
                    </p>
                  )}
                </div>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
