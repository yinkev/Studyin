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
  reliability: {
    kr20: number | null;
    item_point_biserial: Array<{
      item_id: string;
      attempts: number;
      p_value: number;
      point_biserial: number | null;
    }>;
  };
  retention_summary?: {
    total_reviews: number;
    correct: number;
    incorrect: number;
    success_rate: number;
  };
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
