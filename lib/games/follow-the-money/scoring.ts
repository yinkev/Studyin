/**
 * Follow The Money - Scoring System
 * XP calculation with streak and speed bonuses
 * Following spec from docs/follow-the-money/GAME_MECHANICS.md
 */

import { DIFFICULTY_CONFIGS, type DifficultyLevel } from './types';

/**
 * Compute XP earned for a game round
 *
 * @param difficulty - Difficulty level played
 * @param inGameStreak - Number of consecutive correct answers in this session
 * @param timeSeconds - Time taken from selection enabled to selection made
 * @param correct - Whether the answer was correct
 * @returns Object with total XP and reason string
 */
export function computeRoundXP(
  difficulty: DifficultyLevel,
  inGameStreak: number,
  timeSeconds: number,
  correct: boolean
): { total: number; reason: string } {
  if (!correct) {
    // No XP for incorrect answers (optional pity XP could be added here)
    return {
      total: 0,
      reason: `Follow The Money · ${difficulty} · incorrect`,
    };
  }

  const base = DIFFICULTY_CONFIGS[difficulty].xpReward;

  // Streak multiplier: +10% per streak level, capped at +50%
  const m_streak = 1 + Math.min(inGameStreak * 0.1, 0.5);

  // Speed multiplier based on selection time
  const m_speed =
    timeSeconds <= 2 ? 1.2 : timeSeconds <= 5 ? 1.1 : 1.0;

  // Perfect bonus: 2x multiplier for ultra-fast correct answers
  const m_perfect = correct && timeSeconds <= 1.0 ? 2.0 : 1.0;

  // Use the higher of speed or perfect bonus
  const finalMultiplier = Math.max(m_speed, m_perfect);

  // Calculate total XP
  const total = Math.round(base * m_streak * finalMultiplier);

  // Build descriptive reason
  const streakText =
    inGameStreak > 0 ? ` · streak ×${m_streak.toFixed(1)}` : '';
  const speedText = ` · ${timeSeconds.toFixed(1)}s`;
  const bonusText =
    m_perfect > 1
      ? ' · PERFECT!'
      : m_speed > 1
        ? ` · fast (×${m_speed})`
        : '';

  const reason = `Follow The Money · ${difficulty}${streakText}${speedText}${bonusText}`;

  return { total, reason };
}

/**
 * Calculate streak value after a round
 *
 * @param currentStreak - Current streak value
 * @param correct - Whether the answer was correct
 * @returns New streak value
 */
export function calculateNewStreak(
  currentStreak: number,
  correct: boolean
): number {
  return correct ? currentStreak + 1 : 0;
}

/**
 * Get difficulty multiplier for display purposes
 *
 * @param difficulty - Difficulty level
 * @returns Multiplier value (e.g., 1.0 for easy, 10.0 for expert)
 */
export function getDifficultyMultiplier(difficulty: DifficultyLevel): number {
  const base = DIFFICULTY_CONFIGS[difficulty].xpReward;
  const easyBase = DIFFICULTY_CONFIGS.easy.xpReward;
  return base / easyBase;
}

/**
 * Format XP value for display
 *
 * @param xp - XP value
 * @returns Formatted string (e.g., "+50 XP", "+1,234 XP")
 */
export function formatXP(xp: number): string {
  const formatted = xp.toLocaleString('en-US');
  return xp > 0 ? `+${formatted} XP` : `${formatted} XP`;
}
