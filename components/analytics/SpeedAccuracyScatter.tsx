'use client';

/**
 * Speed vs Accuracy Scatter Plot — MAX GRAPHICS MODE
 * Interactive ECharts scatter with zoom, pan, and quadrant analysis
 * Shows latency vs correctness patterns to identify speed/accuracy tradeoffs
 */

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface SpeedAccuracyScatterProps {
  analytics: AnalyticsSummary | null;
  height?: number;
}

export function SpeedAccuracyScatter({
  analytics,
  height = 500,
}: SpeedAccuracyScatterProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Extract speed/accuracy data
  const speedAccuracy = analytics?.speed_accuracy || {
    fast_wrong: 0,
    slow_wrong: 0,
    fast_right: 0,
    slow_right: 0,
  };

  // Generate synthetic scatter points for visualization
  // In production, this would come from individual attempt logs
  const scatterData = (() => {
    const points: Array<{ speed: number; correct: boolean; value: [number, number] }> = [];

    // Fast & Correct (green)
    for (let i = 0; i < speedAccuracy.fast_right; i++) {
      points.push({
        speed: Math.random() * 30 + 5, // 5-35 seconds
        correct: true,
        value: [Math.random() * 30 + 5, 1],
      });
    }

    // Slow & Correct (blue)
    for (let i = 0; i < speedAccuracy.slow_right; i++) {
      points.push({
        speed: Math.random() * 90 + 35, // 35-125 seconds
        correct: true,
        value: [Math.random() * 90 + 35, 1],
      });
    }

    // Fast & Wrong (yellow)
    for (let i = 0; i < speedAccuracy.fast_wrong; i++) {
      points.push({
        speed: Math.random() * 30 + 5,
        correct: false,
        value: [Math.random() * 30 + 5, 0],
      });
    }

    // Slow & Wrong (red)
    for (let i = 0; i < speedAccuracy.slow_wrong; i++) {
      points.push({
        speed: Math.random() * 90 + 35,
        correct: false,
        value: [Math.random() * 90 + 35, 0],
      });
    }

    return points;
  })();

  // Separate by correct/incorrect
  const correctPoints = scatterData.filter((d) => d.correct).map((d) => d.value);
  const incorrectPoints = scatterData.filter((d) => !d.correct).map((d) => d.value);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');
    chartInstanceRef.current = chart;

    // Median time threshold (35s as example)
    const medianTime = 35;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const [speed, correct] = params.value;
          return `
            <div style="font-size: 13px;">
              <strong>${correct === 1 ? '✅ Correct' : '❌ Incorrect'}</strong><br/>
              Response time: ${speed.toFixed(1)}s<br/>
              Category: ${speed < medianTime ? 'Fast' : 'Slow'} ${correct === 1 ? 'Right' : 'Wrong'}
            </div>
          `;
        },
      },
      grid: {
        left: '12%',
        right: '10%',
        top: '12%',
        bottom: '15%',
      },
      xAxis: {
        type: 'value',
        name: 'Response Time (seconds)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 13,
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: '{value}s',
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        splitLine: {
          lineStyle: {
            color: '#334155',
            type: 'dashed',
          },
        },
        // Vertical line at median
        splitArea: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Correctness',
        min: -0.1,
        max: 1.1,
        interval: 1,
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 13,
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: number) => (value === 1 ? 'Correct' : value === 0 ? 'Incorrect' : ''),
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        // Correct points
        {
          name: 'Correct',
          type: 'scatter',
          data: correctPoints,
          symbolSize: 10,
          itemStyle: {
            color: (params: any) => {
              const speed = params.value[0];
              return speed < medianTime ? '#58CC02' : '#1CB0F6'; // Fast = green, Slow = blue
            },
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: '#58CC02',
            },
          },
        },
        // Incorrect points
        {
          name: 'Incorrect',
          type: 'scatter',
          data: incorrectPoints,
          symbolSize: 10,
          itemStyle: {
            color: (params: any) => {
              const speed = params.value[0];
              return speed < medianTime ? '#FFC800' : '#FF4B4B'; // Fast = yellow, Slow = red
            },
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: '#FF4B4B',
            },
          },
        },
        // Median time vertical line
        {
          name: 'Median Time',
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                xAxis: medianTime,
                lineStyle: {
                  color: '#94a3b8',
                  type: 'dashed',
                  width: 2,
                },
                label: {
                  formatter: 'Median: 35s',
                  position: 'end',
                  color: '#94a3b8',
                },
              },
            ],
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          bottom: 10,
          height: 20,
          borderColor: '#334155',
          fillerColor: 'rgba(88, 204, 2, 0.2)',
          handleStyle: {
            color: '#58CC02',
          },
          textStyle: {
            color: '#94a3b8',
          },
        },
      ],
    };

    chart.setOption(option);

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [scatterData, correctPoints, incorrectPoints]);

  return (
    <div className="glow-card p-6 rounded-3xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">Speed vs Accuracy</h3>
        <p className="text-sm text-slate-400">Response time vs correctness patterns</p>
      </div>

      <div ref={chartRef} style={{ width: '100%', height }} />

      {/* Quadrant Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="text-xs text-slate-400 mb-1">🎯 Fast & Right</div>
          <div className="text-2xl font-black text-green-400">{speedAccuracy.fast_right}</div>
          <div className="text-xs text-slate-500">Optimal performance</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <div className="text-xs text-slate-400 mb-1">🐢 Slow & Right</div>
          <div className="text-2xl font-black text-blue-400">{speedAccuracy.slow_right}</div>
          <div className="text-xs text-slate-500">Careful thinker</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="text-xs text-slate-400 mb-1">⚡ Fast & Wrong</div>
          <div className="text-2xl font-black text-yellow-400">{speedAccuracy.fast_wrong}</div>
          <div className="text-xs text-slate-500">Impulsive errors</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30">
          <div className="text-xs text-slate-400 mb-1">🤔 Slow & Wrong</div>
          <div className="text-2xl font-black text-red-400">{speedAccuracy.slow_wrong}</div>
          <div className="text-xs text-slate-500">Needs review</div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-sm font-semibold text-white mb-2">📊 Insights</div>
        <div className="text-xs text-slate-300 space-y-1">
          <div>
            • <strong>Scroll to zoom</strong> on the chart above
          </div>
          <div>
            • <strong>Drag slider</strong> at bottom to filter time range
          </div>
          <div>
            • <strong>Fast &amp; Right</strong> is the target quadrant (green)
          </div>
          {speedAccuracy.fast_wrong > speedAccuracy.fast_right * 0.5 && (
            <div className="text-yellow-400">
              ⚠️ High impulsive error rate — consider slowing down
            </div>
          )}
          {speedAccuracy.slow_wrong > speedAccuracy.slow_right * 0.3 && (
            <div className="text-red-400">
              ⚠️ Many slow errors — may indicate concept gaps
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
