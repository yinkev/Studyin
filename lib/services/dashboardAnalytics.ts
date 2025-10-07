/**
 * Dashboard Analytics Service
 *
 * Computes dashboard metrics from learner state and session data.
 * Bridges the gap between IRT/Rasch model data and user-facing gamification.
 */

import { LearnerState, LearnerGamification, LearnerAnalytics } from '../server/study-state';
import { getLevelFromXP, getLevelProgress } from '../xp-system';

export interface DashboardMetrics {
  // Gamification
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  percentToNextLevel: number;
  totalXP: number;
  streak: number;
  lastStudyDate: string | null;

  // Analytics
  totalStudyTime: number; // in hours
  totalStudyTimeMs: number; // in milliseconds
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number; // 0-100
  lastWeekActivity: number[];
  sessionsCompleted: number;

  // Recent Activity (for dashboard cards)
  recentTopics: Array<{
    loId: string;
    name: string;
    questionsAnswered: number;
    accuracy: number;
  }>;
}

/**
 * Compute overall accuracy from learner state items
 */
function computeAccuracy(items: LearnerState['items']): number {
  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const item of Object.values(items)) {
    totalAttempts += item.attempts;
    totalCorrect += item.correct;
  }

  if (totalAttempts === 0) return 0;
  return (totalCorrect / totalAttempts) * 100;
}

/**
 * Get recent activity for last 7 days
 */
function computeLastWeekActivity(items: LearnerState['items']): number[] {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const activity = new Array(7).fill(0);

  for (const item of Object.values(items)) {
    if (item.recentAttempts) {
      for (const timestamp of item.recentAttempts) {
        const daysAgo = Math.floor((now - timestamp) / oneDayMs);
        if (daysAgo >= 0 && daysAgo < 7) {
          activity[6 - daysAgo]++;
        }
      }
    }
  }

  return activity;
}

/**
 * Get recent topics with activity
 */
function computeRecentTopics(
  los: LearnerState['los'],
  items: LearnerState['items']
): Array<{
  loId: string;
  name: string;
  questionsAnswered: number;
  accuracy: number;
}> {
  const topics = new Map<string, { total: number; correct: number }>();

  // Aggregate by LO
  for (const [itemId, item] of Object.entries(items)) {
    // Try to extract LO from item ID (assuming format like "lo-123-item-456")
    const loMatch = itemId.match(/^([^-]+-[^-]+)/);
    const loId = loMatch ? loMatch[1] : 'unknown';

    const existing = topics.get(loId) ?? { total: 0, correct: 0 };
    existing.total += item.attempts;
    existing.correct += item.correct;
    topics.set(loId, existing);
  }

  // Convert to array and calculate accuracy
  const result = Array.from(topics.entries())
    .map(([loId, stats]) => ({
      loId,
      name: loId, // TODO: Look up actual name from LO registry
      questionsAnswered: stats.total,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.questionsAnswered - a.questionsAnswered)
    .slice(0, 5);

  return result;
}

/**
 * Main function: Compute all dashboard metrics from learner state
 */
export function computeDashboardMetrics(state: LearnerState): DashboardMetrics {
  // Gamification data
  const gamification = state.gamification ?? {
    level: 1,
    totalXP: 0,
    currentXP: 0,
    streak: 0,
    lastStudyDate: null,
  };

  const levelProgress = getLevelProgress(gamification.totalXP);

  // Analytics data
  const analytics = state.analytics ?? {
    totalStudyTimeMs: 0,
    questionsAnswered: 0,
    questionsCorrect: 0,
    lastWeekActivity: new Array(7).fill(0),
    sessionsCompleted: 0,
  };

  // Compute from items if analytics not available
  let questionsAnswered = analytics.questionsAnswered;
  let questionsCorrect = analytics.questionsCorrect;
  let lastWeekActivity = analytics.lastWeekActivity;

  if (questionsAnswered === 0) {
    // Fallback: compute from items
    for (const item of Object.values(state.items)) {
      questionsAnswered += item.attempts;
      questionsCorrect += item.correct;
    }
    lastWeekActivity = computeLastWeekActivity(state.items);
  }

  const accuracy = questionsAnswered > 0 ? (questionsCorrect / questionsAnswered) * 100 : 0;
  const recentTopics = computeRecentTopics(state.los, state.items);

  return {
    // Gamification
    level: levelProgress.level,
    currentXP: levelProgress.currentXP,
    xpToNextLevel: levelProgress.xpToNextLevel,
    percentToNextLevel: levelProgress.percentComplete,
    totalXP: gamification.totalXP,
    streak: gamification.streak,
    lastStudyDate: gamification.lastStudyDate,

    // Analytics
    totalStudyTime: analytics.totalStudyTimeMs / (1000 * 60 * 60), // Convert to hours
    totalStudyTimeMs: analytics.totalStudyTimeMs,
    questionsAnswered,
    questionsCorrect,
    accuracy,
    lastWeekActivity,
    sessionsCompleted: analytics.sessionsCompleted,

    // Recent Activity
    recentTopics,
  };
}

/**
 * Fetch and compute dashboard metrics for a learner
 */
export async function fetchDashboardMetrics(learnerId: string): Promise<DashboardMetrics> {
  const response = await fetch(`/api/learner-state?learnerId=${encodeURIComponent(learnerId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch learner state');
  }

  const data = await response.json();
  const state = data.learnerState as LearnerState;

  return computeDashboardMetrics(state);
}

/**
 * Default metrics for new users
 */
export const DEFAULT_DASHBOARD_METRICS: DashboardMetrics = {
  level: 1,
  currentXP: 0,
  xpToNextLevel: 1000,
  percentToNextLevel: 0,
  totalXP: 0,
  streak: 0,
  lastStudyDate: null,
  totalStudyTime: 0,
  totalStudyTimeMs: 0,
  questionsAnswered: 0,
  questionsCorrect: 0,
  accuracy: 0,
  lastWeekActivity: [0, 0, 0, 0, 0, 0, 0],
  sessionsCompleted: 0,
  recentTopics: [],
};
