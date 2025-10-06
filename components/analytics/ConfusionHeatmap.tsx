'use client';

/**
 * Confusion Heatmap — MAX GRAPHICS MODE
 * ECharts heatmap showing distractor pick rates
 * Click to open evidence modal with item details
 */

import { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface ConfusionData {
  loId: string;
  itemId: string;
  choice: string;
  count: number;
  pickRate: number;
}

interface ConfusionHeatmapProps {
  analytics: AnalyticsSummary | null;
  height?: number;
}

export function ConfusionHeatmap({
  analytics,
  height = 450,
}: ConfusionHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [selectedCell, setSelectedCell] = useState<ConfusionData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Prepare confusion data
  const confusionData: ConfusionData[] = (analytics?.confusion_edges || []).map((edge) => ({
    loId: edge.lo_id,
    itemId: edge.item_id,
    choice: edge.choice,
    count: edge.count,
    pickRate: 0, // Will calculate below
  }));

  // Calculate pick rates per item
  const itemCounts: Record<string, number> = {};
  confusionData.forEach((d) => {
    itemCounts[d.itemId] = (itemCounts[d.itemId] || 0) + d.count;
  });
  confusionData.forEach((d) => {
    d.pickRate = itemCounts[d.itemId] > 0 ? d.count / itemCounts[d.itemId] : 0;
  });

  // Sort by pick rate (most confusing first)
  confusionData.sort((a, b) => b.pickRate - a.pickRate);

  // Get top 15 items for heatmap
  const topItems = confusionData.slice(0, 15);

  // Prepare heatmap matrix
  const items = Array.from(new Set(topItems.map((d) => d.itemId)));
  const choices = ['A', 'B', 'C', 'D', 'E'];

  const heatmapData = items.flatMap((item, itemIndex) =>
    choices.map((choice, choiceIndex) => {
      const dataPoint = topItems.find((d) => d.itemId === item && d.choice === choice);
      return [choiceIndex, itemIndex, dataPoint?.pickRate ? dataPoint.pickRate * 100 : 0];
    })
  );

  useEffect(() => {
    if (!chartRef.current || heatmapData.length === 0) return;

    const chart = echarts.init(chartRef.current, 'dark');
    chartInstanceRef.current = chart;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [choiceIndex, itemIndex, pickRate] = params.value;
          const item = items[itemIndex];
          const choice = choices[choiceIndex];
          const dataPoint = topItems.find((d) => d.itemId === item && d.choice === choice);
          return `
            <div style="font-size: 13px;">
              <strong>${item}</strong><br/>
              Choice: ${choice}<br/>
              Pick rate: ${pickRate.toFixed(1)}%<br/>
              Count: ${dataPoint?.count || 0}
            </div>
          `;
        },
      },
      grid: {
        left: '18%',
        right: '10%',
        top: '5%',
        bottom: '12%',
      },
      xAxis: {
        type: 'category',
        data: choices,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 13,
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
          },
        },
      },
      yAxis: {
        type: 'category',
        data: items,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
          },
        },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: '#94a3b8',
        },
        inRange: {
          color: ['#1CB0F6', '#58CC02', '#FFC800', '#FF4B4B'],
        },
      },
      series: [
        {
          name: 'Pick Rate',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            color: '#ffffff',
            fontSize: 10,
            formatter: (params: any) => {
              const pickRate = params.value[2];
              return pickRate > 0 ? `${pickRate.toFixed(0)}%` : '';
            },
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
        const [choiceIndex, itemIndex] = params.value;
        const item = items[itemIndex];
        const choice = choices[choiceIndex];
        const dataPoint = topItems.find((d) => d.itemId === item && d.choice === choice);
        if (dataPoint && dataPoint.pickRate > 0) {
          setSelectedCell(dataPoint);
          setModalOpen(true);
        }
      }
    });

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [heatmapData, items, choices, topItems]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedCell(null), 300);
  };

  if (confusionData.length === 0) {
    return (
      <div className="glow-card p-8 flex items-center justify-center text-center" style={{ height }}>
        <div>
          <div className="text-4xl mb-3">🎯</div>
          <div className="text-slate-400 text-sm">No confusion data yet. Answer questions to populate.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glow-card p-6 rounded-3xl">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Confusion Heatmap</h3>
          <p className="text-sm text-slate-400">Distractor pick rates by item</p>
        </div>

        <div ref={chartRef} style={{ width: '100%', height }} />

        {/* Top Confusions */}
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm font-semibold text-white mb-3">🔥 Top Confusions</div>
          <div className="space-y-2 text-xs text-slate-300">
            {topItems.slice(0, 3).map((d, i) => (
              <div key={i}>
                <span className="font-semibold">{d.itemId}</span> → Choice {d.choice}:{' '}
                <span className="text-yellow-400">{(d.pickRate * 100).toFixed(1)}% pick rate</span>
                {' '}({d.count} times)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Modal */}
      {modalOpen && selectedCell && (
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
                <h2 className="text-3xl font-black gradient-text">Confusion Analysis</h2>
                <p className="text-sm text-slate-400 mt-1 font-mono">{selectedCell.itemId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Distractor Choice</div>
                <div className="text-4xl font-black text-yellow-400">{selectedCell.choice}</div>
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Pick Rate</div>
                <div className="text-4xl font-black text-red-400">{(selectedCell.pickRate * 100).toFixed(1)}%</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Times Selected</div>
                <div className="text-4xl font-black text-purple-400">{selectedCell.count}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Learning Objective</div>
                <div className="text-lg font-black text-blue-400">{selectedCell.loId}</div>
              </div>
            </div>

            {/* Analysis */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 mb-4">
              <div className="text-sm font-semibold text-white mb-3">🔍 Why This Matters</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>
                  • This distractor was selected <strong>{(selectedCell.pickRate * 100).toFixed(0)}%</strong> of the time
                </div>
                <div>
                  • High pick rate suggests this is a <strong>plausible alternative</strong>
                </div>
                <div>
                  • May indicate conceptual confusion or poor item design
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-white mb-3">💡 Next Steps</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>✅ Review evidence materials for this LO</div>
                <div>✅ Check distractor rationale in item metadata</div>
                <div>✅ Consider flagging item for revision if pick rate {'>'} 40%</div>
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
