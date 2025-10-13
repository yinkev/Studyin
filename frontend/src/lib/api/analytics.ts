import { apiClient } from '@/lib/api/client';

// ============================================================================
// Types matching backend Phase 1 analytics schemas
// ============================================================================

export interface TopicMastery {
  topic_name: string;
  mastery_score: number; // 0-100
  questions_answered: number;
  correct_rate: number; // 0-1
}

export interface QuestionMasteryResponse {
  user_id: string;
  topic_mastery: TopicMastery[];
  benchmark_mastery: number; // 75% as decimal
  overall_mastery: number; // User's average mastery across all topics
}

export interface PerformanceWindow {
  day_of_week: number; // 0=Monday, 6=Sunday
  hour: number; // 0-23
  performance_score: number; // 0-100, aggregated performance
  questions_answered: number;
  avg_response_time_seconds: number;
}

export interface PerformanceRecommendation {
  peak_windows: Array<{
    day: string;
    hour_range: string;
    performance_score: number;
  }>;
  suggested_study_times: string[];
  insights: string[];
}

export interface PerformanceWindowResponse {
  user_id: string;
  performance_windows: PerformanceWindow[];
  recommendations: PerformanceRecommendation;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch question type mastery radar data
 * GET /api/analytics/mastery/question-types
 */
export async function getQuestionMastery(): Promise<QuestionMasteryResponse> {
  const response = await apiClient.get<QuestionMasteryResponse>(
    '/api/analytics/mastery/question-types'
  );
  return response.data;
}

/**
 * Fetch performance window heatmap data
 * GET /api/analytics/performance/windows
 */
export async function getPerformanceWindows(): Promise<PerformanceWindowResponse> {
  const response = await apiClient.get<PerformanceWindowResponse>(
    '/api/analytics/performance/windows'
  );
  return response.data;
}

// Gamification progress (for Navbar tiles)
export interface GamificationProgress {
  current_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  total_achievements: number;
  recent_achievements: any[];
  xp_history: Array<{ date: string; daily_xp: number; total_xp: number }>;
  streak_history: Array<{ date: string; streak: number }>;
}

export async function getGamificationProgress(): Promise<GamificationProgress> {
  const response = await apiClient.get<GamificationProgress>(
    '/api/analytics/gamification/progress'
  );
  return response.data;
}
