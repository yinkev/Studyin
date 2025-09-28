'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface BlueprintFlowProps {
  analytics: AnalyticsSummary | null;
  weights: Record<string, number>;
}

export function BlueprintFlow({ analytics, weights }: BlueprintFlowProps) {
  const ttmMap = new Map<string, number>();
  (analytics?.ttm_per_lo ?? []).forEach((entry) => {
    ttmMap.set(entry.lo_id, entry.attempts ?? 0);
  });
  const totalAttempts = Array.from(ttmMap.values()).reduce((sum, val) => sum + val, 0) || 1;

  const { nodes, edges } = useMemo(() => {
    const entries = Object.entries(weights);
    const nodesArray: any[] = [
      {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { label: 'Blueprint' },
        type: 'input'
      }
    ];
    const edgesArray: any[] = [];
    entries.forEach(([lo, weight], index) => {
      const attempts = ttmMap.get(lo) ?? 0;
      const practiceShare = attempts / totalAttempts;
      const delta = practiceShare - weight;
      const color = delta >= 0 ? '#0f766e' : '#b91c1c';
      nodesArray.push({
        id: `lo-${lo}`,
        position: { x: 240, y: index * 120 + 40 },
        data: {
          label: `${lo}\nTarget ${(weight * 100).toFixed(1)}% · Practice ${(practiceShare * 100).toFixed(1)}%`
        },
        style: {
          border: `2px solid ${color}`,
          background: '#fff'
        }
      });
      edgesArray.push({
        id: `edge-${lo}`,
        source: 'root',
        target: `lo-${lo}`,
        label: delta >= 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`,
        style: {
          stroke: color
        }
      });
    });
    return { nodes: nodesArray, edges: edgesArray };
  }, [weights, ttmMap, totalAttempts]);

  if (!Object.keys(weights).length) {
    return <p className="text-sm text-slate-300/80">Blueprint not configured.</p>;
  }

  return (
    <div className="h-80 w-full rounded-xl border border-white/10 bg-white/5 shadow">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} style={{ fontFamily: 'Inter, system-ui' }}>
        <Background gap={24} color="#334155" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
