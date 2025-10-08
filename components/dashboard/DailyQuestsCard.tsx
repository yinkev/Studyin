'use client';

import { BentoCard } from '../layout/BentoCard';

interface Quest {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

interface DailyQuestsCardProps {
  quests: Quest[];
  isLoading?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

export function DailyQuestsCard({ quests, isLoading = false, size = 'lg' }: DailyQuestsCardProps) {
  return (
    <BentoCard size={size}>
      <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card interactive-card">
        <div className="flex gap-3 items-center mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--brand-primary-alpha-10)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-text-high">Daily Quests</p>
            <p className="text-xs text-text-med">Complete to earn bonus XP!</p>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-20 w-full rounded-xl bento-skeleton" aria-hidden></div>
              <div className="h-20 w-full rounded-xl bento-skeleton" aria-hidden></div>
            </>
          ) : quests.length > 0 ? (
            quests.map((quest) => (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-all ${
                  quest.completed
                    ? 'bg-semantic-success/10 border-semantic-success/30'
                    : 'bg-surface-bg3/60 border-border-subtle hover:border-border-med'
                }`}
                role="group"
                aria-label={`${quest.name} quest`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-text-high">
                        {quest.name}
                      </p>
                      {quest.completed && (
                        <span className="clinical-badge badge-success text-xs" aria-label="Quest complete">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-med">{quest.description}</p>
                  </div>
                  <span className="clinical-badge badge-warning ml-2" aria-label={`Reward ${quest.xpReward} XP`}>
                    +{quest.xpReward} XP
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1" aria-label="Quest progress">
                    <md-linear-progress
                      value={Math.max(0, Math.min(1, (quest.progress / Math.max(1, quest.target))))}
                    ></md-linear-progress>
                  </div>
                  <span className="text-xs font-semibold text-text-med whitespace-nowrap tabular-nums">
                    {quest.progress}/{quest.target}
                  </span>
                  {quest.completed ? (
                    <span className="text-semantic-success text-sm" aria-hidden>✔️</span>
                  ) : (
                    <a href={`/study?quest=${encodeURIComponent(quest.id)}`} className="no-underline">
                      <md-filled-tonal-button aria-label={`Start ${quest.name}`}>
                        Start 5-min drill
                      </md-filled-tonal-button>
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-med">
              <p className="text-sm">No daily quests available. Start studying!</p>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
