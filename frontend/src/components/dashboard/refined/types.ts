/**
 * Type definitions for refined dashboard components
 */

export interface Skill {
  name: string;
  mastery: number;
  color?: 'primary' | 'accent' | 'success';
  lastPracticed?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  completed: boolean;
  category?: string;
}

export interface ActivityDay {
  date: string;
  count: number;
  level: 'none' | 'low' | 'medium' | 'high';
}
