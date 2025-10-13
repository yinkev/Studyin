/**
 * Dashboard API
 * Fetches real-time dashboard data from analytics endpoint
 */

import { apiClient } from './client';
import type { LucideIcon } from 'lucide-react';

export interface DashboardOverview {
  study_minutes_30d: number;
  sessions_30d: number;
  active_days_30d: number;
  accuracy_30d: number;
  xp_earned_30d: number;
  current_streak_days: number;
  longest_streak_days: number;
  avg_mastery_score: number;
  topics_mastered: number;
  topics_weak: number;
  predicted_exam_readiness: number;
}

export interface DashboardHeatmapDay {
  date: string;
  study_minutes: number;
  questions_attempted: number;
  accuracy: number;
  xp_earned: number;
  goal_achieved: boolean;
}

export interface DashboardSession {
  session_id: string;
  started_at: string;
  duration_minutes: number;
  materials_viewed: number;
  questions_attempted: number;
  questions_correct: number;
  xp_earned: number;
}

export interface WeakTopic {
  topic_id: string;
  topic_name: string;
  mastery_score: number;
  questions_attempted: number;
  accuracy: number;
  last_studied: string | null;
}

export interface KnowledgeGap {
  topic_id: string;
  topic_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  gap_score: number;
  priority_score: number;
  estimated_hours: number;
  recommended_materials: string[] | null;
}

export interface DashboardData {
  overview: DashboardOverview;
  heatmap: DashboardHeatmapDay[];
  recent_sessions: DashboardSession[];
  weak_topics: WeakTopic[];
  knowledge_gaps: KnowledgeGap[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>('/api/analytics/dashboard');
  return response.data;
}

/**
 * Transform backend data to frontend component format
 */
export interface SkillData {
  name: string;
  mastery: number;
  color: 'primary' | 'secondary' | 'accent';
}

export interface QuestData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: 'daily' | 'weekly';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  progress: number;
  completed: boolean;
}

export interface AchievementData {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
}

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'locked' | 'current' | 'completed';
  level: number;
  xp: number;
  completedAt?: string;
}

export interface LeaderboardUserData {
  id: string;
  name: string;
  avatar: string | undefined;
  xp: number;
  level: number;
  rank: number;
  trend: 'up' | 'down' | 'same';
}

/**
 * Convert weak topics to skill mastery display
 */
export function transformWeakTopicsToSkills(weakTopics: WeakTopic[]): SkillData[] {
  const colors: Array<'primary' | 'secondary' | 'accent'> = ['primary', 'secondary', 'accent'];

  return weakTopics.slice(0, 6).map((topic, index) => ({
    name: topic.topic_name,
    mastery: Math.round(topic.mastery_score * 100),
    color: colors[index % colors.length]
  }));
}

/**
 * Convert knowledge gaps to quests
 */
export function transformKnowledgeGapsToQuests(gaps: KnowledgeGap[]): QuestData[] {
  // This would need to be enhanced with actual quest tracking
  // For now, we'll show knowledge gaps as recommended study quests
  return gaps.slice(0, 3).map((gap, index) => ({
    id: gap.topic_id,
    title: `Study ${gap.topic_name}`,
    description: `Address ${gap.severity} knowledge gap`,
    icon: null as any, // Will be assigned in component
    type: gap.severity === 'critical' || gap.severity === 'high' ? 'daily' : 'weekly',
    difficulty: gap.severity === 'critical' ? 'hard' : gap.severity === 'high' ? 'medium' : 'easy',
    xpReward: Math.round(gap.estimated_hours * 100),
    progress: 0,
    completed: false
  }));
}
