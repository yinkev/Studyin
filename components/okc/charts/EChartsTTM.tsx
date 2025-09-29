'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { EChartsBase } from './EChartsBase';

export function EChartsTTM({ analytics, height, onReady }: { analytics: AnalyticsSummary | null; height?: number; onReady?: (api: any) => void }) {
  const rows = (analytics?.ttm_per_lo ?? [])
    .slice()
    .sort((a, b) => b.projected_minutes_to_mastery - a.projected_minutes_to_mastery)
    .slice(0, 12);
  return (
    <EChartsBase
      data={rows}
      height={height}
      onReady={onReady}
      buildOption={(data: any[], theme) => ({
        tooltip: { trigger: 'axis' },
        grid: { left: 8, right: 8, bottom: 8, containLabel: true },
        xAxis: { type: 'value', axisLine:{show:false}, axisTick:{show:false}, splitLine:{ lineStyle:{ color: theme.grid, type:'dashed' } } },
        yAxis: { type: 'category', data: data.map((d)=>d.lo_id), axisLine:{show:false}, axisTick:{show:false} },
        series: [{ type: 'bar', data: data.map((d)=>d.projected_minutes_to_mastery), barWidth: 14, itemStyle:{ color: theme.okcFeather }, label:{ show:true, position:'right', color: theme.text, formatter:'{c}m' } }]
      })}
    />
  );
}
