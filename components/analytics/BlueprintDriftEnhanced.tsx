'use client';

/**
 * Enhanced Blueprint Drift Chart — MAX GRAPHICS MODE
 * Interactive ECharts bar chart with drill-down modal
 * Shows target vs actual LO distribution with deviation alerts
 */

import { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { animate as anime } from "animejs";
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface BlueprintDriftData {
  loId: string;
  loName: string;
  targetPercent: number;
  actualPercent: number;
  deviation: number;
  attempts: number;
}

interface BlueprintDriftEnhancedProps {
  analytics: AnalyticsSummary | null;
  weights: Record<string, number>;
  height?: number;
}

export function BlueprintDriftEnhanced({
  analytics,
  weights,
  height = 400,
}: BlueprintDriftEnhancedProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [selectedLO, setSelectedLO] = useState<BlueprintDriftData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Prepare data
  const driftData: BlueprintDriftData[] = (() => {
    const attempts: Record<string, number> = {};
    (analytics?.ttm_per_lo || []).forEach((d) => {
      attempts[d.lo_id] = d.attempts || 0;
    });

    const total = Object.values(attempts).reduce((a, b) => a + b, 0) || 1;
    const ids = Array.from(new Set([...Object.keys(weights), ...Object.keys(attempts)]));

    return ids.map((id) => {
      const targetPercent = (weights[id] ?? 0) * 100;
      const actualPercent = attempts[id] ? (attempts[id] / total) * 100 : 0;
      const deviation = actualPercent - targetPercent;

      return {
        loId: id,
        loName: id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        targetPercent,
        actualPercent,
        deviation,
        attempts: attempts[id] || 0,
      };
    }).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)); // Sort by deviation magnitude
  })();

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');
    chartInstanceRef.current = chart;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          const data = driftData[dataIndex];
          return `
            <div style="font-size: 13px;">
              <strong>${data.loName}</strong><br/>
              Target: ${data.targetPercent.toFixed(1)}%<br/>
              Actual: ${data.actualPercent.toFixed(1)}%<br/>
              <span style="color: ${data.deviation > 0 ? '#FFC800' : '#1CB0F6'}">
                ${data.deviation > 0 ? '+' : ''}${data.deviation.toFixed(1)}% deviation
              </span><br/>
              Attempts: ${data.attempts}
            </div>
          `;
        },
      },
      legend: {
        data: ['Target %', 'Actual %'],
        textStyle: {
          color: '#94a3b8',
        },
        top: 10,
      },
      grid: {
        left: '12%',
        right: '8%',
        top: '15%',
        bottom: '12%',
      },
      xAxis: {
        type: 'category',
        data: driftData.map((d) => d.loName),
        axisLabel: {
          color: '#94a3b8',
          rotate: 30,
          interval: 0,
          fontSize: 11,
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Percentage',
        nameTextStyle: {
          color: '#94a3b8',
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: '{value}%',
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
      },
      series: [
        {
          name: 'Target %',
          type: 'bar',
          data: driftData.map((d) => d.targetPercent),
          itemStyle: {
            color: '#1CB0F6',
          },
          barGap: '10%',
          label: {
            show: true,
            position: 'top',
            color: '#94a3b8',
            fontSize: 10,
            formatter: '{c}%',
          },
        },
        {
          name: 'Actual %',
          type: 'bar',
          data: driftData.map((d) => ({
            value: d.actualPercent,
            itemStyle: {
              color: Math.abs(d.deviation) > 5 ? '#FFC800' : '#58CC02',
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#94a3b8',
            fontSize: 10,
            formatter: '{c}%',
          },
        },
      ],
    };

    chart.setOption(option);

    // Click handler for drill-down
    chart.on('click', (params: any) => {
      if (params.componentType === 'series') {
        const data = driftData[params.dataIndex];
        setSelectedLO(data);
        setModalOpen(true);
      }
    });

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [driftData]);

  // Modal close handler
  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedLO(null), 300);
  };

  return (
    <>
      <div className="glow-card p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Blueprint Drift</h3>
            <p className="text-sm text-slate-400">Target vs actual LO distribution</p>
          </div>
          <div className="text-xs text-slate-500">Click bars to drill down</div>
        </div>

        <div ref={chartRef} style={{ width: '100%', height }} />

        {/* Deviation alerts */}
        {driftData.filter((d) => Math.abs(d.deviation) > 5).length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-sm text-yellow-400 font-semibold mb-2">⚠️ Drift Alerts</div>
            <div className="space-y-1 text-xs text-slate-300">
              {driftData
                .filter((d) => Math.abs(d.deviation) > 5)
                .slice(0, 3)
                .map((d) => (
                  <div key={d.loId}>
                    <span className="font-semibold">{d.loName}</span>:{' '}
                    {d.deviation > 0 ? 'Over' : 'Under'} by {Math.abs(d.deviation).toFixed(1)}%
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      {modalOpen && selectedLO && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
            onClick={handleCloseModal}
            style={{ animation: 'fadeIn 0.2s ease' }}
          />

          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-dark rounded-3xl border border-white/20 p-8 z-[101]"
            style={{
              boxShadow: '0 24px 96px rgba(0, 0, 0, 0.8)',
              animation: 'scaleIn 0.3s ease',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black gradient-text">{selectedLO.loName}</h2>
                <p className="text-sm text-slate-400 mt-1 font-mono">{selectedLO.loId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Target */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Blueprint Target</div>
                <div className="text-3xl font-black text-blue-400">{selectedLO.targetPercent.toFixed(1)}%</div>
              </div>

              {/* Actual */}
              <div
                className={`bg-gradient-to-br rounded-2xl p-5 border ${
                  Math.abs(selectedLO.deviation) > 5
                    ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                    : 'from-green-500/20 to-emerald-500/20 border-green-500/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">Actual Practice</div>
                <div
                  className={`text-3xl font-black ${
                    Math.abs(selectedLO.deviation) > 5 ? 'text-yellow-400' : 'text-green-400'
                  }`}
                >
                  {selectedLO.actualPercent.toFixed(1)}%
                </div>
              </div>

              {/* Deviation */}
              <div
                className={`bg-gradient-to-br rounded-2xl p-5 border ${
                  selectedLO.deviation > 0
                    ? 'from-orange-500/20 to-red-500/20 border-orange-500/30'
                    : 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">Deviation</div>
                <div
                  className={`text-3xl font-black ${
                    selectedLO.deviation > 0 ? 'text-orange-400' : 'text-cyan-400'
                  }`}
                >
                  {selectedLO.deviation > 0 ? '+' : ''}
                  {selectedLO.deviation.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedLO.deviation > 0 ? 'Overrepresented' : 'Underrepresented'}
                </div>
              </div>

              {/* Attempts */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Total Attempts</div>
                <div className="text-3xl font-black text-purple-400">{selectedLO.attempts}</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-white mb-3">📊 Recommendations</div>
              <div className="space-y-2 text-sm text-slate-300">
                {Math.abs(selectedLO.deviation) > 5 ? (
                  <>
                    <div>
                      • <strong>{selectedLO.deviation > 0 ? 'Reduce' : 'Increase'}</strong> item
                      exposure for this LO
                    </div>
                    <div>
                      • Adjust Thompson Sampling blueprint multiplier to{' '}
                      {selectedLO.deviation > 0 ? '0.5' : '1.5'}
                    </div>
                    <div>• Review item difficulty distribution for this LO</div>
                  </>
                ) : (
                  <div className="text-green-400">✅ LO distribution is within acceptable range (±5%)</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}
