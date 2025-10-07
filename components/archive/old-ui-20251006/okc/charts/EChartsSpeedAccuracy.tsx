'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { EChartsBase } from './EChartsBase';

export function EChartsSpeedAccuracy({ analytics, height, onReady }: { analytics: AnalyticsSummary | null; height?: number; onReady?: (api: any) => void }) {
  const sa = analytics?.speed_accuracy ?? { fast_wrong: 0, slow_wrong: 0, fast_right: 0, slow_right: 0 };
  const categories = ['Fast', 'Slow'];
  const right = [sa.fast_right, sa.slow_right];
  const wrong = [sa.fast_wrong, sa.slow_wrong];
  return (
    <EChartsBase
      data={{ categories, right, wrong }}
      height={height}
      onReady={onReady}
      buildOption={(d: any, theme) => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Right', 'Wrong'] },
        grid: { left: 8, right: 8, bottom: 8, containLabel: true },
        xAxis: [{ type: 'category', data: d.categories, axisTick:{show:false}, axisLine:{show:false} }],
        yAxis: [{ type: 'value', splitLine:{ lineStyle:{ color: theme.grid, type:'dashed' } } }],
        series: [
          { name:'Right', type:'bar', stack:'total', data:d.right, itemStyle:{ color: theme.okcFeather }, barWidth:22 },
          { name:'Wrong', type:'bar', stack:'total', data:d.wrong, itemStyle:{ color: theme.okcCardinal }, barWidth:22 }
        ]
      })}
    />
  );
}
