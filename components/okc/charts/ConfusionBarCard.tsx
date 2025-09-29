'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { ChartWithDetails } from './ChartWithDetails';
import { EChartsConfusionBar } from './EChartsConfusionBar';

export function ConfusionBarCard({ analytics }: { analytics: AnalyticsSummary | null }) {
  return (
    <ChartWithDetails title="Confusion hotspots" render={(h, onReady) => <EChartsConfusionBar analytics={analytics} height={h} onReady={onReady} />} />
  );
}
