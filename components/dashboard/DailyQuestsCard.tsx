'use client';

import { BentoCard } from '../layout/BentoCard';
import { Progress, Badge, Skeleton } from '@mantine/core';

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
      <div className="p-6">
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
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
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
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-text-high">
                        {quest.name}
                      </p>
                      {quest.completed && (
                        <Badge size="sm" variant="light" className="bg-semantic-success/20 text-semantic-success text-xs">
                          Complete!
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-med">{quest.description}</p>
                  </div>
                  <Badge size="sm" variant="light" className="bg-warning/10 text-warning ml-2">
                    +{quest.xpReward} XP
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(quest.progress / quest.target) * 100}
                    size="sm"
                    radius="md"
                    className="flex-1"
                    color={quest.completed ? "green" : "blue"}
                  />
                  <span className="text-xs font-semibold text-text-med whitespace-nowrap tabular-nums">
                    {quest.progress}/{quest.target}
                  </span>
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
