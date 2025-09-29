'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { EChartsBase } from './EChartsBase';

export function EChartsConfusionBar({ analytics, height, onReady }: { analytics: AnalyticsSummary | null; height?: number; onReady?: (api: any) => void }) {
  const edges = analytics?.confusion_edges ?? [];
  const counts = new Map<string, number>();
  for (const e of edges) {
    const key = e.lo_id || e.item_id;
    counts.set(key, (counts.get(key) ?? 0) + e.count);
  }
  const rows = Array.from(counts.entries()).map(([key, count]) => ({ key, count })).sort((a,b)=>b.count-a.count).slice(0,12);
  return (
    <EChartsBase
      data={rows}
      height={height}
      onReady={onReady}
      buildOption={(data: any[], theme) => ({
        tooltip: { trigger: 'axis' },
        grid: { left: 8, right: 8, bottom: 8, containLabel: true },
        xAxis: { type: 'value', splitLine:{ lineStyle:{ color: theme.grid, type:'dashed' } }, axisLine:{show:false}, axisTick:{show:false} },
        yAxis: { type: 'category', data: data.map((r)=>r.key), axisLine:{show:false}, axisTick:{show:false} },
        series: [{ type:'bar', data:data.map((r)=>r.count), itemStyle:{ color: theme.okcMacaw }, barWidth:14 }]
      })}
    />
  );
}
