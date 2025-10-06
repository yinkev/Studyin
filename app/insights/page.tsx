import { promises as fs } from 'fs';
import path from 'path';
import { InsightsView } from '../../components/InsightsView';

interface AnalyticsData {
  mastery_per_lo: Record<string, number>;
}

export default async function InsightsPage() {
  const filePath = path.join(process.cwd(), 'public', 'analytics', 'latest.json');
  let masteryScores: { lo_id: string; score: number }[] = [];

  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    const analytics: AnalyticsData = JSON.parse(rawData);
    masteryScores = Object.entries(analytics.mastery_per_lo).map(([lo_id, score]) => ({
      lo_id,
      score,
    }));
  } catch (error) {
    console.error('Error reading analytics data:', error);
  }

  return <InsightsView masteryScores={masteryScores} />;
}
