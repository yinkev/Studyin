import { promises as fs } from 'fs';
import path from 'path';

const ANALYTICS_PATH = path.join(process.cwd(), 'public', 'analytics', 'latest.json');

export interface AnalyticsSummary {
  schema_version: string;
  generated_at: string;
  has_events: boolean;
  totals: {
    attempts: number;
    learners: number;
  };
  ttm_per_lo: Array<{
    lo_id: string;
    attempts: number;
    current_accuracy: number;
    projected_minutes_to_mastery: number;
    overdue: boolean;
  }>;
  elg_per_min: Array<{
    item_id: string;
    lo_ids: string[];
    projected_mastery_gain: number;
    estimated_minutes: number;
    reason: string;
  }>;
  confusion_edges: Array<{
    lo_id: string;
    item_id: string;
    choice: string;
    count: number;
  }>;
  speed_accuracy: {
    fast_wrong: number;
    slow_wrong: number;
    fast_right: number;
    slow_right: number;
  };
  nfd_summary: Array<{
    item_id: string;
    choice: string;
    pick_rate: number;
    attempts: number;
  }>;
  item_recommendations: Array<{
    item_id: string;
    lo_ids: string[];
    attempts: number;
    accuracy: number;
    avg_duration_seconds: number;
    last_attempt_ts: number | null;
    projected_minutes_to_mastery: number;
    overdue_lo_ids: string[];
    reason: string;
    reason_type: 'spacing' | 'mastery_deficit' | 'elg' | 'recency' | 'accuracy' | 'momentum';
    score: number;
    elg_rank: number | null;
  }>;
}

export async function loadAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  try {
    const raw = await fs.readFile(ANALYTICS_PATH, 'utf8');
    return JSON.parse(raw) as AnalyticsSummary;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
