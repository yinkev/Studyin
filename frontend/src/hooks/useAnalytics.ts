import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

// ============================================================================
// Types matching backend API responses
// ============================================================================

export interface LearningOverview {
  total_sessions: number;
  total_duration_hours: number;
  avg_session_duration_minutes: number;
  materials_viewed: number;
  materials_completed: number;
  completion_rate: number;
  total_xp_earned: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  achievements_earned: number;
  daily_active_days: number;
}

export interface ActivityHeatmap {
  date: string; // ISO date format
  activity_count: number;
  duration_minutes: number;
  xp_earned: number;
}

export interface GamificationProgress {
  current_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  total_achievements: number;
  recent_achievements: Array<{
    id: string;
    earned_at: string;
    [key: string]: any;
  }>;
  xp_history: Array<{
    date: string;
    daily_xp: number;
    total_xp: number;
  }>;
  streak_history: Array<{
    date: string;
    streak: number;
  }>;
}

// ============================================================================
// Custom Hook
// ============================================================================

export interface UseAnalyticsOptions {
  autoFetch?: boolean;
  pollingInterval?: number; // ms, 0 to disable
}

export interface UseAnalyticsReturn {
  // Data
  learningOverview: LearningOverview | null;
  activityHeatmap: ActivityHeatmap[] | null;
  gamificationProgress: GamificationProgress | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Error
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { autoFetch = true, pollingInterval = 0 } = options;

  const [learningOverview, setLearningOverview] = useState<LearningOverview | null>(null);
  const [activityHeatmap, setActivityHeatmap] = useState<ActivityHeatmap[] | null>(null);
  const [gamificationProgress, setGamificationProgress] = useState<GamificationProgress | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        // Fetch all analytics endpoints in parallel
        const [overviewRes, heatmapRes, progressRes] = await Promise.all([
          apiClient.get<LearningOverview>('/api/analytics/learning/overview'),
          apiClient.get<ActivityHeatmap[]>('/api/analytics/learning/heatmap'),
          apiClient.get<GamificationProgress>('/api/analytics/gamification/progress'),
        ]);

        setLearningOverview(overviewRes.data);
        setActivityHeatmap(heatmapRes.data);
        setGamificationProgress(progressRes.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics data';
        setError(message);
        if (!silent) {
          toast.error(message);
        }
        console.error('[useAnalytics] Fetch error:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics(false);
    }
  }, [autoFetch, fetchAnalytics]);

  // Polling
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchAnalytics(true);
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval, fetchAnalytics]);

  return {
    learningOverview,
    activityHeatmap,
    gamificationProgress,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
