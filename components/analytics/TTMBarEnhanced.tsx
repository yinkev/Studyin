'use client';

/**
 * Enhanced TTM Bar Chart — MAX GRAPHICS MODE
 * Time-to-Mastery visualization with item-level drill-down
 * Shows projected minutes to reach mastery (SE ≤ 0.20, mastery_prob ≥ 0.85)
 */

import { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface TTMData {
  loId: string;
  attempts: number;
  currentAccuracy: number;
  projectedMinutes: number;
  overdue: boolean;
}

interface TTMBarEnhancedProps {
  analytics: AnalyticsSummary | null;
  height?: number;
  maxItems?: number;
}

export function TTMBarEnhanced({
  analytics,
  height = 400,
  maxItems = 12,
}: TTMBarEnhancedProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [selectedLO, setSelectedLO] = useState<TTMData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Prepare data
  const ttmData: TTMData[] = (analytics?.ttm_per_lo || [])
    .map((d) => ({
      loId: d.lo_id,
      attempts: d.attempts,
      currentAccuracy: d.current_accuracy,
      projectedMinutes: d.projected_minutes_to_mastery,
      overdue: d.overdue,
    }))
    .sort((a, b) => b.projectedMinutes - a.projectedMinutes)
    .slice(0, maxItems);

  useEffect(() => {
    if (!chartRef.current || ttmData.length === 0) return;

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
          const data = ttmData[dataIndex];
          return `
            <div style="font-size: 13px;">
              <strong>${data.loId}</strong><br/>
              TTM: ${data.projectedMinutes.toFixed(1)} min<br/>
              Accuracy: ${(data.currentAccuracy * 100).toFixed(1)}%<br/>
              Attempts: ${data.attempts}<br/>
              ${data.overdue ? '<span style="color: #FFC800;">⚠️ Overdue</span>' : ''}
            </div>
          `;
        },
      },
      grid: {
        left: '18%',
        right: '12%',
        top: '10%',
        bottom: '10%',
      },
      xAxis: {
        type: 'value',
        name: 'Minutes to Mastery',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#94a3b8',
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: '{value}m',
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#334155',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: ttmData.map((d) => d.loId),
        axisLabel: {
          color: '#94a3b8',
          fontSize: 12,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          data: ttmData.map((d) => ({
            value: d.projectedMinutes,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: d.overdue ? '#FFC800' : '#58CC02' },
                { offset: 1, color: d.overdue ? '#FF4B4B' : '#89E219' },
              ]),
            },
          })),
          barWidth: 20,
          label: {
            show: true,
            position: 'right',
            color: '#94a3b8',
            fontSize: 12,
            formatter: '{c}m',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(88, 204, 2, 0.5)',
            },
          },
        },
      ],
    };

    chart.setOption(option);

    // Click handler
    chart.on('click', (params: any) => {
      if (params.componentType === 'series') {
        const data = ttmData[params.dataIndex];
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
  }, [ttmData]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedLO(null), 300);
  };

  if (ttmData.length === 0) {
    return (
      <div className="glow-card p-8 flex items-center justify-center text-center" style={{ height }}>
        <div>
          <div className="text-4xl mb-3">⏱️</div>
          <div className="text-slate-400 text-sm">No TTM data available yet. Start studying to populate.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glow-card p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Time to Mastery (TTM)</h3>
            <p className="text-sm text-slate-400">Projected minutes to reach mastery threshold</p>
          </div>
          <div className="text-xs text-slate-500">Click bars to drill down</div>
        </div>

        <div ref={chartRef} style={{ width: '100%', height }} />

        {/* Overdue alerts */}
        {ttmData.filter((d) => d.overdue).length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-sm text-yellow-400 font-semibold mb-2">⚠️ Overdue LOs</div>
            <div className="space-y-1 text-xs text-slate-300">
              {ttmData
                .filter((d) => d.overdue)
                .slice(0, 3)
                .map((d) => (
                  <div key={d.loId}>
                    <span className="font-semibold">{d.loId}</span>: {d.projectedMinutes.toFixed(0)}m remaining
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
                <h2 className="text-3xl font-black gradient-text">{selectedLO.loId}</h2>
                <p className="text-sm text-slate-400 mt-1">Time to Mastery Breakdown</p>
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
              {/* TTM */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Projected TTM</div>
                <div className="text-3xl font-black text-green-400">{selectedLO.projectedMinutes.toFixed(1)}m</div>
                <div className="text-xs text-slate-500 mt-1">
                  At current pace ({(selectedLO.currentAccuracy * 100).toFixed(0)}% accuracy)
                </div>
              </div>

              {/* Attempts */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Attempts So Far</div>
                <div className="text-3xl font-black text-blue-400">{selectedLO.attempts}</div>
              </div>

              {/* Accuracy */}
              <div
                className={`bg-gradient-to-br rounded-2xl p-5 border ${
                  selectedLO.currentAccuracy >= 0.7
                    ? 'from-emerald-500/20 to-green-500/20 border-emerald-500/30'
                    : 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">Current Accuracy</div>
                <div
                  className={`text-3xl font-black ${
                    selectedLO.currentAccuracy >= 0.7 ? 'text-emerald-400' : 'text-yellow-400'
                  }`}
                >
                  {(selectedLO.currentAccuracy * 100).toFixed(1)}%
                </div>
              </div>

              {/* Status */}
              <div
                className={`bg-gradient-to-br rounded-2xl p-5 border ${
                  selectedLO.overdue
                    ? 'from-red-500/20 to-orange-500/20 border-red-500/30'
                    : 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className={`text-2xl font-black ${selectedLO.overdue ? 'text-red-400' : 'text-purple-400'}`}>
                  {selectedLO.overdue ? '⚠️ Overdue' : '✅ On Track'}
                </div>
              </div>
            </div>

            {/* Progress Estimate */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 mb-4">
              <div className="text-sm font-semibold text-white mb-3">📈 Mastery Criteria</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>
                  • <strong>SE threshold:</strong> ≤ 0.20 (Rasch standard error)
                </div>
                <div>
                  • <strong>Mastery probability:</strong> ≥ 85% (Φ((θ̂ - θ_cut)/SE))
                </div>
                <div>
                  • <strong>Probe requirement:</strong> Last probe within |θ̂ - b| ≤ 0.3
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-white mb-3">💡 Recommendations</div>
              <div className="space-y-2 text-sm text-slate-300">
                {selectedLO.currentAccuracy < 0.5 ? (
                  <>
                    <div>• Review evidence materials for this LO</div>
                    <div>• Focus on easier items (difficulty b ≈ θ̂ - 0.5)</div>
                    <div>• Increase session time allocation</div>
                  </>
                ) : selectedLO.currentAccuracy < 0.7 ? (
                  <>
                    <div>• Continue current practice pace</div>
                    <div>• Target items with b ≈ θ̂ for max info</div>
                    <div>• Review missed items for patterns</div>
                  </>
                ) : (
                  <>
                    <div>✅ Strong performance! Continue to mastery</div>
                    <div>• Focus on items with high Fisher info</div>
                    <div>• Prepare for retention lane handoff</div>
                  </>
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
