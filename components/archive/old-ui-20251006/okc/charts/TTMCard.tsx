'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { ChartWithDetails } from './ChartWithDetails';
import { EChartsTTM } from './EChartsTTM';

export function TTMCard({ analytics }: { analytics: AnalyticsSummary | null }) {
  return (
    <ChartWithDetails title="Mastery · TTM" render={(h, onReady) => <EChartsTTM analytics={analytics} height={h} onReady={onReady} />} />
  );
}
