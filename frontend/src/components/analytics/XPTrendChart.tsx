import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { GamificationProgress } from '@/hooks/useAnalytics';

// ============================================================================
// Types
// ============================================================================

interface XPTrendChartProps {
  data: GamificationProgress;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function XPTrendChart({ data, className = '' }: XPTrendChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // Sort by date
    const sortedData = [...data.xp_history].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dates = sortedData.map((point) => point.date);
    const dailyXP = sortedData.map((point) => point.daily_xp);
    const cumulativeXP = sortedData.map((point) => point.total_xp);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'hsl(247, 90%, 66%)',
        borderWidth: 2,
        borderRadius: 16,
        padding: [12, 16],
        textStyle: {
          color: 'hsl(233, 58%, 12%)',
          fontSize: 13,
          fontWeight: 500,
        },
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'hsl(247, 90%, 66%)',
            opacity: 0.3,
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const date = params[0].axisValue;
          const daily = params.find((p: any) => p.seriesName === 'Daily XP');
          const cumulative = params.find((p: any) => p.seriesName === 'Total XP');

          return `<div style="font-family: 'Space Grotesk', sans-serif;">
            <div style="font-weight: 600; margin-bottom: 8px;">${date}</div>
            ${daily ? `<div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: hsl(332, 78%, 72%); border-radius: 50%; margin-right: 6px;"></span>
              Daily XP: <strong>${daily.value}</strong>
            </div>` : ''}
            ${cumulative ? `<div>
              <span style="display: inline-block; width: 10px; height: 10px; background: hsl(247, 90%, 66%); border-radius: 50%; margin-right: 6px;"></span>
              Total XP: <strong>${cumulative.value}</strong>
            </div>` : ''}
          </div>`;
        },
      },
      legend: {
        data: ['Daily XP', 'Total XP'],
        top: 10,
        right: 20,
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: 'hsl(233, 58%, 12%)',
        },
        itemWidth: 20,
        itemHeight: 10,
        itemGap: 20,
      },
      grid: {
        left: 60,
        right: 40,
        top: 60,
        bottom: 60,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: 'hsl(227, 31%, 84%)',
            width: 2,
          },
        },
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: 'hsl(231, 27%, 38%)',
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Daily XP',
          position: 'left',
          nameTextStyle: {
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'hsl(332, 78%, 72%)',
            padding: [0, 0, 0, 0],
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(227, 31%, 84%)',
              width: 2,
            },
          },
          axisLabel: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: 'hsl(231, 27%, 38%)',
          },
          splitLine: {
            lineStyle: {
              color: 'hsl(227, 31%, 90%)',
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Total XP',
          position: 'right',
          nameTextStyle: {
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'hsl(247, 90%, 66%)',
            padding: [0, 0, 0, 0],
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(227, 31%, 84%)',
              width: 2,
            },
          },
          axisLabel: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: 'hsl(231, 27%, 38%)',
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: 'Daily XP',
          type: 'bar',
          data: dailyXP,
          yAxisIndex: 0,
          itemStyle: {
            color: 'hsl(332, 78%, 72%)',
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: 'hsl(332, 78%, 62%)',
            },
          },
          barWidth: '60%',
        },
        {
          name: 'Total XP',
          type: 'line',
          data: cumulativeXP,
          yAxisIndex: 1,
          smooth: true,
          lineStyle: {
            color: 'hsl(247, 90%, 66%)',
            width: 3,
          },
          itemStyle: {
            color: 'hsl(247, 90%, 66%)',
            borderWidth: 2,
            borderColor: '#fff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'hsla(247, 90%, 66%, 0.3)' },
                { offset: 1, color: 'hsla(247, 90%, 66%, 0.05)' },
              ],
            },
          },
          emphasis: {
            lineStyle: {
              width: 4,
            },
            itemStyle: {
              borderWidth: 3,
            },
          },
        },
      ],
    };
  }, [data.xp_history]);

  if (data.xp_history.length === 0) {
    return (
      <div className={`soft-card pixel-border flex min-h-[400px] items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="kawaii-icon mb-4 text-4xl" aria-hidden="true">
            📊
          </span>
          <p className="text-brutalist text-base text-muted-foreground">No XP data yet</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Start earning XP to see your progress trend!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`soft-card pixel-border overflow-hidden ${className}`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="kawaii-icon text-2xl" aria-hidden="true">
              📈
            </span>
            <h3 className="text-brutalist text-lg text-foreground">XP Growth Trend</h3>
          </div>
          <span className="font-pixel text-[0.55rem] tracking-[0.28em] text-muted-foreground">
            MOMENTUM
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your daily XP earnings and cumulative progress over time.
        </p>
      </div>

      <div className="px-4 pb-4">
        <ReactECharts
          option={option}
          style={{ height: '360px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
