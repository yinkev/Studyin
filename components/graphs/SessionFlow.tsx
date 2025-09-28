'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

interface AttemptNode {
  session_id: string;
  item_id: string;
  correct: boolean;
  ts_submit: number;
}

interface SessionFlowProps {
  attempts: AttemptNode[];
}

export function SessionFlow({ attempts }: SessionFlowProps) {
  if (!attempts.length) {
    return <p className="text-sm text-slate-500">No recent attempts.</p>;
  }
  const sessions = new Map<string, AttemptNode[]>();
  attempts.forEach((attempt) => {
    const list = sessions.get(attempt.session_id) ?? [];
    list.push(attempt);
    sessions.set(attempt.session_id, list);
  });

  const { nodes, edges } = useMemo(() => {
    const nodesArray: any[] = [];
    const edgesArray: any[] = [];
    let sessionIndex = 0;
    sessions.forEach((list, sessionId) => {
      const sorted = list.slice().sort((a, b) => a.ts_submit - b.ts_submit);
      sorted.forEach((attempt, index) => {
        const nodeId = `${sessionId}-${index}`;
        nodesArray.push({
          id: nodeId,
          position: { x: index * 160, y: sessionIndex * 120 },
          data: { label: `${attempt.item_id}\n${attempt.correct ? '✅' : '❌'}` },
          style: {
            border: `2px solid ${attempt.correct ? '#22c55e' : '#ef4444'}`,
            background: '#fff'
          }
        });
        if (index > 0) {
          edgesArray.push({
            id: `${sessionId}-${index - 1}->${nodeId}`,
            source: `${sessionId}-${index - 1}`,
            target: nodeId,
            label: new Date(attempt.ts_submit).toLocaleTimeString(),
            animated: true
          });
        }
      });
      sessionIndex += 1;
    });
    return { nodes: nodesArray, edges: edgesArray };
  }, [attempts]);

  return (
    <div className="h-80 w-full rounded-lg border border-slate-200 bg-white shadow-sm">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} style={{ fontFamily: 'Inter, system-ui' }}>
        <Background gap={24} color="#f1f5f9" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
