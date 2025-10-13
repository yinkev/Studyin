import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ActivityHeatmap } from '@/hooks/useAnalytics';

// ============================================================================
// Types
// ============================================================================

interface StudyHeatmapProps {
  data: ActivityHeatmap[];
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function StudyHeatmap({ data, className = '' }: StudyHeatmapProps) {
  const option = useMemo<EChartsOption>(() => {
    // Transform activities to heatmap data format
    // ECharts calendar heatmap expects: [[date, value], ...]
    const heatmapData = data.map((activity) => [
      activity.date,
      activity.duration_minutes,
    ]) as [string, number][];

    // Find min/max dates for calendar range
    const dates = data.map((a) => new Date(a.date).getTime()).filter((d) => !isNaN(d));
    const startDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const endDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    // Calculate max minutes for color scale
    const maxMinutes = Math.max(...data.map((a) => a.duration_minutes), 1);

    return {
      tooltip: {
        trigger: 'item',
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
        formatter: (params: any) => {
          const date = params.data[0];
          const minutes = params.data[1];
          return `<div style="font-family: 'Space Grotesk', sans-serif;">
            <div style="font-weight: 600; margin-bottom: 4px;">${date}</div>
            <div style="color: hsl(231, 27%, 38%);">${minutes} minutes studied</div>
          </div>`;
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxMinutes,
        inRange: {
          color: [
            'hsl(222, 64%, 97%)', // Very light (card background)
            'hsl(247, 90%, 90%)', // Light primary
            'hsl(247, 90%, 80%)', // Medium primary
            'hsl(247, 90%, 66%)', // Primary
            'hsl(247, 90%, 55%)', // Dark primary
          ],
        },
      },
      calendar: {
        top: 40,
        left: 40,
        right: 40,
        bottom: 20,
        range: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
        cellSize: ['auto', 18],
        splitLine: {
          show: true,
          lineStyle: {
            color: 'hsl(227, 31%, 84%)',
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderWidth: 3,
          borderColor: 'hsl(222, 60%, 98%)',
          borderRadius: 6,
        },
        yearLabel: {
          show: false,
        },
        monthLabel: {
          nameMap: 'en',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Space Grotesk, sans-serif',
          color: 'hsl(233, 58%, 12%)',
        },
        dayLabel: {
          nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          color: 'hsl(231, 27%, 38%)',
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatmapData,
        },
      ],
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`soft-card pixel-border flex min-h-[320px] items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="kawaii-icon mb-4 text-4xl" aria-hidden="true">
            📅
          </span>
          <p className="text-brutalist text-base text-muted-foreground">No activity data yet</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Start studying to see your activity calendar!
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
              🗓️
            </span>
            <h3 className="text-brutalist text-lg text-foreground">Study Activity Calendar</h3>
          </div>
          <span className="font-pixel text-[0.55rem] tracking-[0.28em] text-muted-foreground">
            CONSISTENCY
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Darker colors indicate longer study sessions. Aim for consistency over intensity.
        </p>
      </div>

      <div className="px-2">
        <ReactECharts
          option={option}
          style={{ height: '280px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
