'use client';

/**
 * Ability Tracker Graph — Real-time θ̂ visualization
 * Updates after each response with anime.js transitions
 * Shows ability estimate, SE bands, and mastery threshold
 */

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";

export interface AbilityDataPoint {
  /** Item number (x-axis) */
  itemNumber: number;
  /** Ability estimate θ̂ */
  theta: number;
  /** Standard error */
  se: number;
  /** Whether response was correct */
  correct: boolean;
  /** Timestamp */
  timestamp: number;
}

interface AbilityTrackerGraphProps {
  /** Learning objective ID */
  loId: string;
  /** Learning objective name */
  loName: string;
  /** Historical data points */
  dataPoints: AbilityDataPoint[];
  /** Mastery threshold (default 0.0) */
  masteryThreshold?: number;
  /** Height in pixels */
  height?: number;
  /** Auto-scroll to latest data */
  autoScroll?: boolean;
}

export function AbilityTrackerGraph({
  loId,
  loName,
  dataPoints,
  masteryThreshold = 0.0,
  height = 280,
  autoScroll = true,
}: AbilityTrackerGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any | null>(null);
  const echartsRef = useRef<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!chartRef.current) return;
      // Lazy-load echarts on the client only
      const echarts = echartsRef.current ?? (await import('echarts'));
      echartsRef.current = echarts;
      if (cancelled) return;
      const chart = echarts.init(chartRef.current, 'dark');
      chartInstanceRef.current = chart;
    };
    void init();
    return () => {
      cancelled = true;
      try { chartInstanceRef.current?.dispose(); } catch {}
      chartInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstanceRef.current || dataPoints.length === 0) return;

    const chart = chartInstanceRef.current;

    // Prepare data
    const xData = dataPoints.map((d) => d.itemNumber);
    const thetaData = dataPoints.map((d) => d.theta);
    const upperBand = dataPoints.map((d) => d.theta + d.se);
    const lowerBand = dataPoints.map((d) => d.theta - d.se);

    // Calculate mastery probability for latest point
    const latest = dataPoints[dataPoints.length - 1];
    const masteryProb = latest ? normalCDF((latest.theta - masteryThreshold) / latest.se) : 0;

    const option: any = {
      backgroundColor: 'transparent',
      grid: {
        left: '12%',
        right: '8%',
        top: '15%',
        bottom: '15%',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#283b56',
          },
        },
        formatter: (params: any) => {
          const point = dataPoints[params[0].dataIndex];
          return `
            <div style="font-size: 12px;">
              <strong>Item ${point.itemNumber}</strong><br/>
              θ̂: ${point.theta.toFixed(3)}<br/>
              SE: ${point.se.toFixed(3)}<br/>
              Result: ${point.correct ? '✅ Correct' : '❌ Incorrect'}<br/>
              <span style="color: ${masteryProb >= 0.85 ? '#58CC02' : '#FFC800'}">
                Mastery: ${Math.round(masteryProb * 100)}%
              </span>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: xData,
        name: 'Item Number',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        axisLabel: {
          color: '#94a3b8',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Ability θ̂',
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: '{value}',
        },
        splitLine: {
          lineStyle: {
            color: '#334155',
            type: 'dashed',
          },
        },
      },
      series: [
        // SE Upper Band
        {
          name: 'SE Upper',
          type: 'line',
          data: upperBand,
          lineStyle: {
            opacity: 0,
          },
          symbol: 'none',
          stack: 'confidence-band',
          silent: true,
        },
        // SE Lower Band (fill area)
        {
          name: 'SE Lower',
          type: 'line',
          data: lowerBand,
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            color: echartsRef.current?.graphic
              ? new echartsRef.current.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(28, 176, 246, 0.3)' },
                  { offset: 1, color: 'rgba(28, 176, 246, 0.05)' },
                ])
              : undefined,
          },
          symbol: 'none',
          stack: 'confidence-band',
          silent: true,
        },
        // Mastery threshold line
        {
          name: 'Mastery Threshold',
          type: 'line',
          data: xData.map(() => masteryThreshold),
          lineStyle: {
            color: '#58CC02',
            type: 'dashed',
            width: 2,
          },
          symbol: 'none',
          silent: true,
        },
        // θ̂ line
        {
          name: 'Ability θ̂',
          type: 'line',
          data: thetaData,
          smooth: true,
          lineStyle: {
            color: '#1CB0F6',
            width: 3,
          },
          itemStyle: {
            color: (params: any) => {
              const point = dataPoints[params.dataIndex];
              return point.correct ? '#58CC02' : '#FF4B4B';
            },
          },
          symbol: 'circle',
          symbolSize: 8,
          emphasis: {
            scale: 1.5,
          },
        },
      ],
    };

    chart.setOption(option, true);

    // Auto-scroll to latest if enabled
    if (autoScroll && dataPoints.length > 10) {
      chart.dispatchAction({
        type: 'dataZoom',
        start: Math.max(0, ((dataPoints.length - 10) / dataPoints.length) * 100),
        end: 100,
      });
    }

    // Animate entrance
    const el = containerRef.current;
    if (el) {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        anime({
          targets: el,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          ease: 'easeOutExpo',
        });
      } else {
        el.style.opacity = '1';
      }
    }
  }, [dataPoints, masteryThreshold, autoScroll]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dataPoints.length === 0) {
    return (
      <div
        className="glow-card p-8 flex items-center justify-center text-center"
        style={{ height }}
      >
        <div>
          <div className="text-4xl mb-3">📊</div>
          <div className="text-slate-400 text-sm">Start answering questions to see your ability graph</div>
        </div>
      </div>
    );
  }

  const latest = dataPoints[dataPoints.length - 1];
  const masteryProb = normalCDF((latest.theta - masteryThreshold) / latest.se);
  const isMastered = masteryProb >= 0.85;

  return (
    <div ref={containerRef} className="glow-card p-6 rounded-3xl" style={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Ability Tracker</h3>
          <div className="text-xs text-slate-400 font-mono">{loId}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Current θ̂</div>
          <div className="text-2xl font-black text-blue-400">{latest.theta.toFixed(2)}</div>
          <div className="text-xs text-slate-500">SE: {latest.se.toFixed(3)}</div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ width: '100%', height }} />

      {/* Status Badge */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">{dataPoints.length} items attempted</div>
        <div
          className={`px-4 py-2 rounded-full font-bold text-sm ${
            isMastered
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
          }`}
        >
          {isMastered ? '🏆 Mastered' : `🎯 ${Math.round(masteryProb * 100)}% Mastery`}
        </div>
      </div>
    </div>
  );
}

// Helper: Standard normal CDF approximation
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
