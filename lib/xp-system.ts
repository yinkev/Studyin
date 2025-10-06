/**
 * XP/Level System - MAX GRAPHICS
 *
 * Gamification system for tracking user progress
 * - Level progression (exponential XP curve)
 * - XP rewards for actions
 * - Level-up animations and effects
 */

export interface UserProgress {
  level: number;
  currentXP: number;
  totalXP: number;
  streak: number;
  lastStudyDate: string | null;
}

export interface XPReward {
  amount: number;
  reason: string;
  multiplier?: number;
}

/**
 * XP required for each level (exponential growth)
 * Formula: baseXP * (level ^ 1.5)
 */
export function getXPForLevel(level: number): number {
  const baseXP = 1000;
  return Math.floor(baseXP * Math.pow(level, 1.5));
}

/**
 * Calculate total XP required to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;

  while (xpNeeded <= totalXP) {
    level++;
    xpNeeded += getXPForLevel(level - 1);
  }

  return level - 1;
}

/**
 * Calculate XP progress within current level
 */
export function getLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  percentComplete: number;
} {
  const level = getLevelFromXP(totalXP);
  const xpForPreviousLevels = getTotalXPForLevel(level);
  const currentXP = totalXP - xpForPreviousLevels;
  const xpToNextLevel = getXPForLevel(level);
  const percentComplete = (currentXP / xpToNextLevel) * 100;

  return {
    level,
    currentXP,
    xpToNextLevel,
    percentComplete,
  };
}

/**
 * XP Reward Tiers
 */
export const XP_REWARDS = {
  // Study actions
  QUESTION_CORRECT: 10,
  QUESTION_CORRECT_FAST: 15, // <10s
  QUESTION_CORRECT_PERFECT: 20, // <5s
  QUESTION_INCORRECT: 2, // Still reward for trying
  LESSON_COMPLETE: 100,
  LESSON_PERFECT: 200, // 100% accuracy

  // Upload actions
  UPLOAD_SUCCESS: 50,
  FIRST_UPLOAD: 100,

  // Streaks
  STREAK_DAY: 20,
  STREAK_WEEK: 150,
  STREAK_MONTH: 1000,

  // Mastery
  TOPIC_MASTERED: 500,
  FIRST_MASTERY: 1000,
} as const;

/**
 * Calculate XP reward with multipliers
 */
export function calculateXPReward(
  baseReward: number,
  multipliers: {
    streak?: number;
    accuracy?: number;
    speed?: number;
  } = {}
): XPReward {
  let amount = baseReward;
  let totalMultiplier = 1;

  // Streak multiplier (1.1x per day, max 2x at 10 days)
  if (multipliers.streak) {
    const streakBonus = Math.min(multipliers.streak * 0.1, 1);
    totalMultiplier += streakBonus;
  }

  // Accuracy multiplier (up to 1.5x at 100%)
  if (multipliers.accuracy) {
    const accuracyBonus = (multipliers.accuracy / 100) * 0.5;
    totalMultiplier += accuracyBonus;
  }

  // Speed multiplier (1.2x for fast answers)
  if (multipliers.speed && multipliers.speed < 10) {
    totalMultiplier += 0.2;
  }

  amount = Math.floor(baseReward * totalMultiplier);

  return {
    amount,
    reason: buildRewardReason(baseReward, multipliers),
    multiplier: totalMultiplier,
  };
}

function buildRewardReason(baseReward: number, multipliers: any): string {
  const parts = [`+${baseReward} XP`];

  if (multipliers.streak) {
    parts.push(`🔥 Streak x${(1 + Math.min(multipliers.streak * 0.1, 1)).toFixed(1)}`);
  }
  if (multipliers.accuracy && multipliers.accuracy >= 90) {
    parts.push(`⚡ High Accuracy`);
  }
  if (multipliers.speed && multipliers.speed < 10) {
    parts.push(`💨 Speed Bonus`);
  }

  return parts.join(' · ');
}

/**
 * Update streak (call daily)
 */
export function updateStreak(lastStudyDate: string | null, currentDate: Date = new Date()): {
  streak: number;
  isNewStreak: boolean;
  streakBroken: boolean;
} {
  if (!lastStudyDate) {
    return { streak: 1, isNewStreak: true, streakBroken: false };
  }

  const last = new Date(lastStudyDate);
  const today = new Date(currentDate);

  // Reset time to midnight for comparison
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day - no change
    return { streak: 0, isNewStreak: false, streakBroken: false };
  } else if (daysDiff === 1) {
    // Next day - continue streak
    return { streak: 1, isNewStreak: true, streakBroken: false };
  } else {
    // Streak broken
    return { streak: 1, isNewStreak: true, streakBroken: true };
  }
}

/**
 * Default progress for new users
 */
export const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  streak: 0,
  lastStudyDate: null,
};

/**
 * Level titles (cosmetic)
 */
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Medical Grandmaster';
  if (level >= 75) return 'Clinical Expert';
  if (level >= 50) return 'Attending Physician';
  if (level >= 30) return 'Senior Resident';
  if (level >= 20) return 'Junior Resident';
  if (level >= 10) return 'Medical Student';
  if (level >= 5) return 'Apprentice';
  return 'Novice';
}
