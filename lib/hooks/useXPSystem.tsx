'use client';

/**
 * useXPSystem - React Hook for XP/Level Management
 *
 * Manages user progress with localStorage persistence
 * Provides methods to award XP, level up, update streaks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserProgress,
  DEFAULT_PROGRESS,
  getLevelProgress,
  calculateXPReward,
  updateStreak,
  XP_REWARDS,
} from '../xp-system';

const STORAGE_KEY = 'studyin-xp-progress';
// Resolve learner id from localStorage if available (fallback to dev id)
const getLearnerId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('studyin:learnerId') || 'local-dev';
    } catch {
      return 'local-dev';
    }
  }
  return 'local-dev';
};

/**
 * Persist XP progress to API
 */
async function persistToAPI(progress: UserProgress): Promise<void> {
  try {
    await fetch('/api/learner-state', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: getLearnerId(),
        learnerState: {
          gamification: {
            level: progress.level,
            totalXP: progress.totalXP,
            currentXP: progress.currentXP,
            streak: progress.streak,
            lastStudyDate: progress.lastStudyDate,
          },
        },
      }),
    });
  } catch (error) {
    // Fail silently - localStorage is the source of truth
    console.warn('XP persistence to API failed:', error);
  }
}

export interface UseXPSystemReturn {
  // Current state
  progress: UserProgress;
  levelInfo: {
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    percentComplete: number;
  };

  // Actions
  awardXP: (amount: number, _reason?: string) => { leveledUp: boolean; newLevel?: number };
  resetProgress: () => void;
  updateStreakDaily: () => void;

  // Helpers
  isLoading: boolean;
}

export function useXPSystem(): UseXPSystemReturn {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress(parsed);
      }
    } catch (error) {
      console.error('Failed to load XP progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save progress to localStorage and API whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        // Save to localStorage (immediate)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

        // Persist to API (background)
        persistToAPI(progress).catch((error) => {
          console.error('Failed to persist XP to API:', error);
        });
      } catch (error) {
        console.error('Failed to save XP progress:', error);
      }
    }
  }, [progress, isLoading]);

  // Calculate level info from current progress
  const levelInfo = getLevelProgress(progress.totalXP);

  /**
   * Award XP to user
   */
  const awardXP = useCallback(
    (amount: number, _reason?: string): { leveledUp: boolean; newLevel?: number } => {
      let leveledUp = false;
      let newLevel: number | undefined;

      setProgress((prev) => {
        const newTotalXP = prev.totalXP + amount;
        const oldLevelInfo = getLevelProgress(prev.totalXP);
        const newLevelInfo = getLevelProgress(newTotalXP);

        if (newLevelInfo.level > oldLevelInfo.level) {
          leveledUp = true;
          newLevel = newLevelInfo.level;
        }

        return {
          ...prev,
          totalXP: newTotalXP,
          level: newLevelInfo.level,
          currentXP: newLevelInfo.currentXP,
        };
      });

      return { leveledUp, newLevel };
    },
    []
  );

  /**
   * Update streak (call when user studies)
   */
  const updateStreakDaily = useCallback(() => {
    setProgress((prev) => {
      const result = updateStreak(prev.lastStudyDate);

      if (result.streak === 0) {
        // Same day, no change
        return prev;
      }

      const newStreak = result.streakBroken ? 1 : prev.streak + 1;

      // Award streak XP
      if (!result.streakBroken && newStreak > 1) {
        const streakXP = newStreak % 7 === 0 ? XP_REWARDS.STREAK_WEEK : XP_REWARDS.STREAK_DAY;
        const newTotalXP = prev.totalXP + streakXP;
        const newLevelInfo = getLevelProgress(newTotalXP);

        return {
          ...prev,
          totalXP: newTotalXP,
          level: newLevelInfo.level,
          currentXP: newLevelInfo.currentXP,
          streak: newStreak,
          lastStudyDate: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        streak: newStreak,
        lastStudyDate: new Date().toISOString(),
      };
    });
  }, []);

  /**
   * Reset progress (for testing)
   */
  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress,
    levelInfo,
    awardXP,
    resetProgress,
    updateStreakDaily,
    isLoading,
  };
}

/**
 * Helper hook for awarding XP based on study actions
 */
export function useStudyXP() {
  const { awardXP, progress } = useXPSystem();

  const awardQuestionXP = useCallback(
    (correct: boolean, timeSeconds: number) => {
      let baseReward = correct ? XP_REWARDS.QUESTION_CORRECT : XP_REWARDS.QUESTION_INCORRECT;

      if (correct && timeSeconds < 5) {
        baseReward = XP_REWARDS.QUESTION_CORRECT_PERFECT;
      } else if (correct && timeSeconds < 10) {
        baseReward = XP_REWARDS.QUESTION_CORRECT_FAST;
      }

      const reward = calculateXPReward(baseReward, {
        streak: progress.streak,
        speed: timeSeconds,
      });

      return awardXP(reward.amount, reward.reason);
    },
    [awardXP, progress.streak]
  );

  const awardLessonXP = useCallback(
    (accuracy: number) => {
      const baseReward = accuracy >= 100 ? XP_REWARDS.LESSON_PERFECT : XP_REWARDS.LESSON_COMPLETE;

      const reward = calculateXPReward(baseReward, {
        streak: progress.streak,
        accuracy,
      });

      return awardXP(reward.amount, reward.reason);
    },
    [awardXP, progress.streak]
  );

  return {
    awardQuestionXP,
    awardLessonXP,
  };
}
