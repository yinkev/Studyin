'use client';

import { BentoCard } from '../layout/BentoCard';
import { getLevelTitle } from '@/lib/xp-system';

interface ProgressCardProps {
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  percentToNextLevel: number;
  streak: number;
  size?: 'md' | 'lg' | 'xl';
}

export function ProgressCard({
  level,
  totalXP,
  currentXP,
  xpToNextLevel,
  percentToNextLevel,
  streak,
  size = 'lg',
}: ProgressCardProps) {
  const levelTitle = getLevelTitle(level);

  return (
    <BentoCard size={size} accent="primary" className="bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
      <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card interactive-card flex flex-col h-full justify-between" aria-label="Progress overview">
        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-text-med font-medium uppercase tracking-wider mb-2">
                Your Progress
              </p>
              <h2 className="text-4xl font-extrabold text-text-high mb-1 tabular-nums">
                Level {level}
              </h2>
              <p className="text-sm text-text-med font-medium">
                {levelTitle}
              </p>
            </div>

            {streak > 0 && (
              <div
                className="clinical-card rounded-full w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-clinical-md"
                style={{ background: 'linear-gradient(135deg, #fee2e2, #fef3c7)' }}
                role="status"
                aria-label={`${streak} day${streak > 1 ? 's' : ''} streak`}
                title={`${streak} day${streak > 1 ? 's' : ''} in a row!`}
              >
                <div className="text-center">
                  <p className="text-2xl" aria-hidden>🔥</p>
                  <p className="text-xs font-bold text-semantic-danger tabular-nums">
                    {streak}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="clinical-card p-4 mb-4"
               style={{ background: 'linear-gradient(135deg, var(--brand-primary-alpha-10), var(--brand-secondary-alpha-10))' }}>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-text-high tabular-nums">
                  {totalXP.toLocaleString()}
                </p>
                <p className="text-xs text-text-med font-medium mt-1">
                  Total XP
                </p>
              </div>
              <div className="w-px h-12 bg-border-default"></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-text-high">
                    Level {level} → {level + 1}
                  </span>
                  <span className="text-xs font-medium text-text-med tabular-nums">
                    {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()}
                  </span>
                </div>
                <div aria-label="XP progress toward next level" className="flex items-center gap-2">
                  <div className="flex-1">
                    <md-linear-progress
                      value={Math.max(0, Math.min(1, percentToNextLevel / 100))}
                    ></md-linear-progress>
                  </div>
                  <span className="text-xs font-semibold text-text-med tabular-nums" aria-hidden>
                    {Math.round(percentToNextLevel)}%
                  </span>
                </div>
                {streak > 0 && (
                  <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--semantic-warning)' }}>
                    Don’t lose your {streak}-day streak!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="clinical-card p-3 text-center">
            <p className="text-xl font-bold text-text-high tabular-nums">{level}</p>
            <p className="text-xs text-text-med">Level</p>
          </div>
          <div className="clinical-card p-3 text-center">
            <p className="text-xl font-bold text-text-high tabular-nums">{Math.round(percentToNextLevel)}%</p>
            <p className="text-xs text-text-med">Progress</p>
          </div>
          <div className="clinical-card p-3 text-center">
            <p className="text-xl font-bold text-text-high tabular-nums">{streak}</p>
            <p className="text-xs text-text-med">Streak</p>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
