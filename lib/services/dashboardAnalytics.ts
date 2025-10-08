/**
 * Dashboard Analytics Service
 *
 * Computes dashboard metrics from learner state and session data.
 * Bridges the gap between IRT/Rasch model data and user-facing gamification.
 */

import { LearnerState } from '../server/study-state';
import { getLevelProgress } from '../xp-system';

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

  // Enhanced Gamification Features
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    completed: boolean;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    icon: string;
  }>;

  quests: {
    daily: Array<{
      id: string;
      name: string;
      description: string;
      progress: number;
      target: number;
      xpReward: number;
      completed: boolean;
    }>;
    weekly: Array<{
      id: string;
      name: string;
      description: string;
      progress: number;
      target: number;
      xpReward: number;
      completed: boolean;
    }>;
  };

  // Learning insights
  learningTrend: 'improving' | 'stable' | 'declining';
  recommendedFocus: string;
  strengths: string[];
  weaknesses: string[];
}

// Removed legacy computeAccuracy helper (unused)

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
      // Fallback: display LO id until a registry provides human-readable titles
      name: loId,
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
  const recentTopics = computeRecentTopics(state.items);

  // Generate achievements
  const achievements = generateAchievements(questionsAnswered, accuracy, gamification.streak, levelProgress.level);

  // Generate quests
  const quests = generateQuests(questionsAnswered, accuracy, gamification.streak);

  // Analyze learning trends
  const { learningTrend, recommendedFocus, strengths, weaknesses } = analyzeLearningTrends(
    questionsAnswered,
    accuracy,
    lastWeekActivity
  );

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

    // Enhanced Features
    achievements,
    quests,
    learningTrend,
    recommendedFocus,
    strengths,
    weaknesses,
  };
}

/**
 * Generate achievements based on user progress
 */
function generateAchievements(
  questionsAnswered: number,
  accuracy: number,
  streak: number,
  level: number
): Array<{
  id: string;
  name: string;
  description: string;
  progress: number;
  completed: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
}> {
  return [
    {
      id: 'first-100',
      name: 'Century Club',
      description: 'Answer 100 questions',
      progress: Math.min(questionsAnswered, 100),
      completed: questionsAnswered >= 100,
      tier: 'bronze',
      icon: '🎯',
    },
    {
      id: 'accuracy-master',
      name: 'Accuracy Master',
      description: 'Maintain 90%+ accuracy',
      progress: accuracy >= 90 ? 100 : Math.min((accuracy / 90) * 100, 100),
      completed: accuracy >= 90 && questionsAnswered >= 50,
      tier: 'gold',
      icon: '🎖️',
    },
    {
      id: 'streak-warrior',
      name: 'Streak Warrior',
      description: 'Maintain a 7-day study streak',
      progress: Math.min((streak / 7) * 100, 100),
      completed: streak >= 7,
      tier: 'silver',
      icon: '🔥',
    },
    {
      id: 'level-10',
      name: 'Rising Star',
      description: 'Reach Level 10',
      progress: Math.min((level / 10) * 100, 100),
      completed: level >= 10,
      tier: 'platinum',
      icon: '⭐',
    },
    {
      id: 'perfect-session',
      name: 'Perfectionist',
      description: 'Complete a session with 100% accuracy',
      progress: accuracy === 100 ? 100 : 0,
      completed: accuracy === 100 && questionsAnswered >= 10,
      tier: 'gold',
      icon: '💎',
    },
    {
      id: 'marathon',
      name: 'Marathon Runner',
      description: 'Answer 1000 questions',
      progress: Math.min((questionsAnswered / 1000) * 100, 100),
      completed: questionsAnswered >= 1000,
      tier: 'platinum',
      icon: '🏃',
    },
  ];
}

/**
 * Generate daily and weekly quests
 */
function generateQuests(
  questionsAnswered: number,
  accuracy: number,
  streak: number
): {
  daily: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
    completed: boolean;
  }>;
  weekly: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
    completed: boolean;
  }>;
} {
  // Daily quests reset each day
  const todayAttempts = Math.min(questionsAnswered, 20); // Mock - would track today's attempts

  return {
    daily: [
      {
        id: 'daily-practice',
        name: 'Daily Practice',
        description: 'Answer 20 questions today',
        progress: todayAttempts,
        target: 20,
        xpReward: 100,
        completed: todayAttempts >= 20,
      },
      {
        id: 'daily-accuracy',
        name: 'Accuracy Challenge',
        description: 'Maintain 85%+ accuracy today',
        progress: accuracy >= 85 ? 1 : 0,
        target: 1,
        xpReward: 150,
        completed: accuracy >= 85 && questionsAnswered >= 10,
      },
      {
        id: 'daily-speed',
        name: 'Speed Run',
        description: 'Complete 10 questions in under 5 minutes',
        progress: 0, // Would track from timing data
        target: 1,
        xpReward: 120,
        completed: false,
      },
    ],
    weekly: [
      {
        id: 'weekly-consistency',
        name: 'Perfect Week',
        description: 'Study every day this week',
        progress: Math.min(streak, 7),
        target: 7,
        xpReward: 1000,
        completed: streak >= 7,
      },
      {
        id: 'weekly-volume',
        name: 'Power User',
        description: 'Answer 150 questions this week',
        progress: Math.min(questionsAnswered, 150), // Mock - would track weekly
        target: 150,
        xpReward: 500,
        completed: questionsAnswered >= 150,
      },
      {
        id: 'weekly-mastery',
        name: 'Master 3 Topics',
        description: 'Achieve mastery on 3 learning objectives',
        progress: 0, // Would track mastery milestones
        target: 3,
        xpReward: 800,
        completed: false,
      },
    ],
  };
}

/**
 * Analyze learning trends
 */
function analyzeLearningTrends(
  questionsAnswered: number,
  accuracy: number,
  lastWeekActivity: number[]
): {
  learningTrend: 'improving' | 'stable' | 'declining';
  recommendedFocus: string;
  strengths: string[];
  weaknesses: string[];
} {
  // Determine trend from activity pattern
  const recentActivity = lastWeekActivity.slice(-3).reduce((a, b) => a + b, 0);
  const olderActivity = lastWeekActivity.slice(0, 3).reduce((a, b) => a + b, 0);

  let learningTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentActivity > olderActivity * 1.2) {
    learningTrend = 'improving';
  } else if (recentActivity < olderActivity * 0.8) {
    learningTrend = 'declining';
  }

  // Generate recommendations
  let recommendedFocus = 'Keep up the great work!';
  if (accuracy < 70) {
    recommendedFocus = 'Focus on understanding concepts before speed. Review explanations carefully.';
  } else if (accuracy >= 90) {
    recommendedFocus = 'Excellent accuracy! Consider challenging yourself with harder topics.';
  } else if (learningTrend === 'declining') {
    recommendedFocus = 'Your activity is declining. Set aside 15 minutes today to rebuild momentum.';
  }

  // Identify strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (accuracy >= 85) strengths.push('High accuracy');
  if (questionsAnswered >= 100) strengths.push('Consistent practice');
  if (recentActivity > 20) strengths.push('Active learner');

  if (accuracy < 70) weaknesses.push('Accuracy needs improvement');
  if (recentActivity < 5) weaknesses.push('Low recent activity');
  if (lastWeekActivity.filter(d => d === 0).length > 3) weaknesses.push('Inconsistent study pattern');

  return {
    learningTrend,
    recommendedFocus,
    strengths,
    weaknesses,
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
  achievements: [],
  quests: {
    daily: [],
    weekly: [],
  },
  learningTrend: 'stable',
  recommendedFocus: 'Start your learning journey!',
  strengths: [],
  weaknesses: [],
};
