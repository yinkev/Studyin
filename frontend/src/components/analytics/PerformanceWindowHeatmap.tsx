import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { PerformanceWindowResponse } from '@/lib/api/analytics';
import { Clock, Lightbulb, TrendingUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PerformanceWindowHeatmapProps {
  data: PerformanceWindowResponse;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ============================================================================
// Component
// ============================================================================

export function PerformanceWindowHeatmap({ data, className = '' }: PerformanceWindowHeatmapProps) {
  const option = useMemo<EChartsOption>(() => {
    // Transform data into heatmap format: [hour, day, performance_score]
    const heatmapData = data.performance_windows.map((window) => [
      window.hour,
      window.day_of_week,
      window.performance_score,
    ]);

    // Find max performance for color scale
    const maxPerformance = Math.max(
      ...data.performance_windows.map((w) => w.performance_score),
      100 // Ensure at least 100 for scale
    );

    return {
      tooltip: {
        position: 'top',
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
          const [hour, dayIdx, score] = params.value;
          const day = DAYS[dayIdx];
          const hourStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

          // Find the window data for additional details
          const windowData = data.performance_windows.find(
            (w) => w.hour === hour && w.day_of_week === dayIdx
          );

          const performanceLabel = score >= 80 ? '🔥 Excellent' : score >= 60 ? '✨ Good' : score >= 40 ? '📊 Average' : '💤 Low';

          return `<div style="font-family: 'Space Grotesk', sans-serif;">
            <div style="font-weight: 600; margin-bottom: 8px;">${day}, ${hourStr}</div>
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${params.color}; border-radius: 50%; margin-right: 6px;"></span>
              Performance: <strong>${score.toFixed(1)}%</strong> ${performanceLabel}
            </div>
            ${windowData ? `
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid hsl(227, 31%, 84%);">
                <div style="font-size: 11px; color: hsl(231, 27%, 38%);">
                  Questions: ${windowData.questions_answered}<br/>
                  Avg Response: ${windowData.avg_response_time_seconds.toFixed(1)}s
                </div>
              </div>
            ` : ''}
          </div>`;
        },
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
        data: HOURS,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(250, 250, 250, 0.1)', 'rgba(250, 250, 250, 0.05)'],
          },
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
          formatter: (value: string | number) => {
            // Show labels for every 3 hours
            const hour = typeof value === 'string' ? parseInt(value) : value;
            if (hour % 3 === 0) {
              return hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
            }
            return '';
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'category',
        data: DAYS,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(250, 250, 250, 0.1)', 'rgba(250, 250, 250, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'hsl(227, 31%, 84%)',
            width: 2,
          },
        },
        axisLabel: {
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: 'hsl(233, 58%, 12%)',
        },
        axisTick: {
          show: false,
        },
      },
      visualMap: {
        min: 0,
        max: maxPerformance,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: 'hsl(231, 27%, 38%)',
        },
        inRange: {
          color: [
            'hsl(358, 78%, 64%)', // Poor - red
            'hsl(45, 86%, 62%)', // Below average - yellow
            'hsl(158, 66%, 68%)', // Good - mint
            'hsl(247, 90%, 66%)', // Excellent - primary
          ],
        },
      },
      series: [
        {
          name: 'Performance',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              borderColor: 'hsl(247, 90%, 66%)',
              borderWidth: 3,
            },
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#fff',
            borderRadius: 4,
          },
        },
      ],
    };
  }, [data.performance_windows]);

  // Find peak performance window
  const peakWindow = data.performance_windows.reduce((max, window) =>
    window.performance_score > max.performance_score ? window : max
  , data.performance_windows[0] || { performance_score: 0, hour: 0, day_of_week: 0 });

  const peakDay = DAYS[peakWindow.day_of_week];
  const peakHour = peakWindow.hour === 0 ? '12 AM' : peakWindow.hour < 12
    ? `${peakWindow.hour} AM`
    : peakWindow.hour === 12
    ? '12 PM'
    : `${peakWindow.hour - 12} PM`;

  if (data.performance_windows.length === 0) {
    return (
      <div className={`soft-card pixel-border flex min-h-[500px] items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="kawaii-icon mb-4 text-4xl" aria-hidden="true">
            🕐
          </span>
          <p className="text-brutalist text-base text-muted-foreground">No performance data yet</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Complete study sessions throughout the week to discover your peak performance times!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`soft-card pixel-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="kawaii-icon text-2xl" aria-hidden="true">
              🕐
            </span>
            <h3 className="text-brutalist text-lg text-foreground">Peak Performance Windows</h3>
          </div>
          <span className="font-pixel text-[0.55rem] tracking-[0.28em] text-muted-foreground">
            HEATMAP
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover when you perform best. Warmer colors indicate higher performance.
        </p>
      </div>

      {/* Peak Stats */}
      <div className="px-6 py-4 bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
              <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peak Time</p>
              <p className="text-brutalist text-sm text-foreground">
                {peakDay}, {peakHour}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/20">
              <Clock className="size-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peak Score</p>
              <p className="text-brutalist text-sm text-foreground">
                {peakWindow.performance_score.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary/20">
              <span className="text-lg" aria-hidden="true">📊</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions Analyzed</p>
              <p className="text-brutalist text-sm text-foreground">
                {data.performance_windows.reduce((sum, w) => sum + w.questions_answered, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="px-4 py-6">
        <ReactECharts
          option={option}
          style={{ height: '420px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Recommendations */}
      {data.recommendations && (
        <div className="px-6 py-5 border-t border-border/50 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
              <Lightbulb className="size-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-brutalist text-base text-foreground mb-1">AI Recommendations</h4>
              <p className="text-xs text-muted-foreground">
                Optimize your study schedule based on your performance patterns
              </p>
            </div>
          </div>

          {/* Peak Windows */}
          {data.recommendations.peak_windows.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Performance Windows:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.recommendations.peak_windows.slice(0, 4).map((window, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-accent/20"
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {window.day} • {window.hour_range}
                      </p>
                    </div>
                    <span className="font-pixel text-[0.55rem] text-accent tracking-wider">
                      {window.performance_score.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Study Times */}
          {data.recommendations.suggested_study_times.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Study Times:</p>
              <div className="flex flex-wrap gap-2">
                {data.recommendations.suggested_study_times.map((time, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary border border-primary/20"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {data.recommendations.insights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Key Insights:</p>
              <ul className="space-y-2">
                {data.recommendations.insights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-foreground"
                  >
                    <span className="text-accent mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
