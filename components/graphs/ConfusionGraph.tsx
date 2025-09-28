'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

interface ConfusionGraphProps {
  analytics: AnalyticsSummary | null;
}

const layoutOffsets = {
  loX: 0,
  itemX: 300,
  ySpacing: 120
};

export function ConfusionGraph({ analytics }: ConfusionGraphProps) {
  const data = analytics?.confusion_edges ?? [];
  const hasData = data.length > 0;

  const { nodes, edges } = useMemo(() => {
    const loNodes = new Map<string, number>();
    const itemNodes = new Map<string, number>();
    const nodesArray: any[] = [];
    const edgesArray: any[] = [];

    let loIndex = 0;
    let itemIndex = 0;

    data.forEach((edge) => {
      if (!loNodes.has(edge.lo_id)) {
        const y = loIndex * layoutOffsets.ySpacing;
        loNodes.set(edge.lo_id, y);
        nodesArray.push({
          id: `lo-${edge.lo_id}`,
          position: { x: layoutOffsets.loX, y },
          data: { label: edge.lo_id },
          type: 'default'
        });
        loIndex += 1;
      }
      if (!itemNodes.has(edge.item_id)) {
        const y = itemIndex * layoutOffsets.ySpacing;
        itemNodes.set(edge.item_id, y);
        nodesArray.push({
          id: `item-${edge.item_id}`,
          position: { x: layoutOffsets.itemX, y },
          data: { label: edge.item_id },
          type: 'default'
        });
        itemIndex += 1;
      }
      const loY = loNodes.get(edge.lo_id) ?? 0;
      const itemY = itemNodes.get(edge.item_id) ?? 0;
      edgesArray.push({
        id: `${edge.lo_id}->${edge.item_id}-${edge.choice}`,
        source: `lo-${edge.lo_id}`,
        target: `item-${edge.item_id}`,
        label: `${edge.choice} (${edge.count})`,
        animated: true,
        style: {
          strokeWidth: Math.min(6, 1 + edge.count),
          stroke: '#ef4444'
        },
        markerEnd: {
          type: 'arrowclosed'
        }
      });
    });

    return { nodes: nodesArray, edges: edgesArray };
  }, [data]);

  if (!hasData) {
    return <p className="text-sm text-slate-500">No confusion edges yet. Collect more attempts.</p>;
  }

  return (
    <div className="h-96 w-full rounded-lg border border-slate-200 bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }} proOptions={{ hideAttribution: true }}>
        <Background gap={24} color="#e2e8f0" />
        <MiniMap pannable zoomable nodeStrokeColor="#0f172a" nodeColor="#e2e8f0" nodeBorderRadius={4} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
