import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { QuestionMasteryResponse } from '@/lib/api/analytics';
import { TrendingUp, Target } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface QuestionMasteryRadarProps {
  data: QuestionMasteryResponse;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function QuestionMasteryRadar({ data, className = '' }: QuestionMasteryRadarProps) {
  const option = useMemo<EChartsOption>(() => {
    // Prepare radar indicators (axes) - up to 8 topic types
    const indicators = data.topic_mastery.map((topic) => ({
      name: topic.topic_name,
      max: 100,
    }));

    // User's mastery scores
    const userScores = data.topic_mastery.map((topic) => topic.mastery_score);

    // Benchmark scores (75% across all topics)
    const benchmarkScores = data.topic_mastery.map(() => data.benchmark_mastery * 100);

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
          if (params.componentSubType !== 'radar') return '';

          const seriesName = params.seriesName;
          const values = params.value;
          const topics = data.topic_mastery;

          let content = `<div style="font-family: 'Space Grotesk', sans-serif;">
            <div style="font-weight: 600; margin-bottom: 8px; color: ${
              seriesName === 'Your Mastery' ? 'hsl(247, 90%, 66%)' : 'hsl(158, 66%, 68%)'
            };">${seriesName}</div>`;

          topics.forEach((topic, idx) => {
            if (values[idx] !== undefined) {
              content += `<div style="margin-bottom: 4px; display: flex; justify-content: space-between; gap: 16px;">
                <span>${topic.topic_name}:</span>
                <strong>${values[idx].toFixed(1)}%</strong>
              </div>`;
            }
          });

          content += '</div>';
          return content;
        },
      },
      legend: {
        data: ['Your Mastery', 'Benchmark (75%)'],
        top: 20,
        right: 20,
        orient: 'vertical',
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: 'hsl(233, 58%, 12%)',
        },
        itemWidth: 20,
        itemHeight: 10,
        itemGap: 12,
      },
      radar: {
        indicator: indicators,
        radius: '65%',
        center: ['50%', '55%'],
        startAngle: 90,
        splitNumber: 4,
        shape: 'polygon',
        axisName: {
          formatter: (value?: string) => {
            // Truncate long topic names
            if (!value) return '';
            return value.length > 20 ? value.substring(0, 18) + '...' : value;
          },
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'hsl(233, 58%, 12%)',
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(247, 246, 255, 0.2)',
              'rgba(247, 246, 255, 0.4)',
              'rgba(247, 246, 255, 0.6)',
              'rgba(247, 246, 255, 0.8)',
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'hsl(227, 31%, 84%)',
            width: 2,
          },
        },
        splitLine: {
          lineStyle: {
            color: 'hsl(227, 31%, 84%)',
            width: 1,
          },
        },
      },
      series: [
        {
          name: 'Your Mastery',
          type: 'radar',
          data: [
            {
              value: userScores,
              name: 'Your Mastery',
              areaStyle: {
                color: {
                  type: 'radial',
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    { offset: 0, color: 'hsla(247, 90%, 66%, 0.5)' },
                    { offset: 1, color: 'hsla(247, 90%, 66%, 0.1)' },
                  ],
                },
              },
              lineStyle: {
                color: 'hsl(247, 90%, 66%)',
                width: 3,
              },
              itemStyle: {
                color: 'hsl(247, 90%, 66%)',
                borderWidth: 3,
                borderColor: '#fff',
              },
              emphasis: {
                lineStyle: {
                  width: 4,
                },
                areaStyle: {
                  color: {
                    type: 'radial',
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: 'hsla(247, 90%, 66%, 0.7)' },
                      { offset: 1, color: 'hsla(247, 90%, 66%, 0.2)' },
                    ],
                  },
                },
              },
            },
          ],
        },
        {
          name: 'Benchmark (75%)',
          type: 'radar',
          data: [
            {
              value: benchmarkScores,
              name: 'Benchmark (75%)',
              lineStyle: {
                color: 'hsl(158, 66%, 68%)',
                width: 2,
                type: 'dashed',
              },
              itemStyle: {
                color: 'hsl(158, 66%, 68%)',
                borderWidth: 0,
              },
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
        },
      ],
    };
  }, [data]);

  // Calculate stats for the header
  const aboveBenchmark = data.topic_mastery.filter(
    (topic) => topic.mastery_score >= data.benchmark_mastery * 100
  ).length;
  const totalTopics = data.topic_mastery.length;
  const overallMasteryPercent = data.overall_mastery * 100;

  if (data.topic_mastery.length === 0) {
    return (
      <div className={`soft-card pixel-border flex min-h-[500px] items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="kawaii-icon mb-4 text-4xl" aria-hidden="true">
            🎯
          </span>
          <p className="text-brutalist text-base text-muted-foreground">No mastery data yet</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Answer questions across different topics to build your mastery profile!
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
              🎯
            </span>
            <h3 className="text-brutalist text-lg text-foreground">Question Type Mastery</h3>
          </div>
          <span className="font-pixel text-[0.55rem] tracking-[0.28em] text-muted-foreground">
            RADAR
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your mastery across different question types compared to the 75% benchmark.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="px-6 py-4 bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
              <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall Mastery</p>
              <p className="text-brutalist text-lg text-foreground">
                {overallMasteryPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/20">
              <Target className="size-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Above Benchmark</p>
              <p className="text-brutalist text-lg text-foreground">
                {aboveBenchmark}/{totalTopics}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary/20">
              <span className="text-lg" aria-hidden="true">📊</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Topics Tracked</p>
              <p className="text-brutalist text-lg text-foreground">{totalTopics}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="px-4 py-6">
        <ReactECharts
          option={option}
          style={{ height: '480px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Topic Details */}
      <div className="px-6 py-4 border-t border-border/50">
        <h4 className="text-brutalist text-sm text-foreground mb-3">Topic Breakdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.topic_mastery.map((topic, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 mr-3">
                <p className="text-xs font-medium text-foreground">{topic.topic_name}</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {topic.questions_answered} questions • {(topic.correct_rate * 100).toFixed(1)}% correct
                </p>
              </div>
              <div className={`font-pixel text-[0.6rem] tracking-wider px-2 py-1 rounded ${
                topic.mastery_score >= data.benchmark_mastery * 100
                  ? 'bg-accent/20 text-accent'
                  : 'bg-secondary/20 text-secondary'
              }`}>
                {topic.mastery_score.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
