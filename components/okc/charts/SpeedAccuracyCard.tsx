'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { ChartWithDetails } from './ChartWithDetails';
import { EChartsSpeedAccuracy } from './EChartsSpeedAccuracy';

export function SpeedAccuracyCard({ analytics }: { analytics: AnalyticsSummary | null }) {
  return (
    <ChartWithDetails title="Speed vs accuracy" render={(h, onReady) => <EChartsSpeedAccuracy analytics={analytics} height={h} onReady={onReady} />} />
  );
}
