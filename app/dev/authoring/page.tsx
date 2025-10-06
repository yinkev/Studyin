'use client';

import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node as FlowNode
} from 'reactflow';
import 'reactflow/dist/style.css';

const DEV_ENABLED =
  process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' || process.env.NEXT_PUBLIC_DEV_TOOLS === '1';

const initialNodes: FlowNode[] = [
  { id: '1', position: { x: 0, y: 40 }, data: { label: 'Intro' }, type: 'input' },
  { id: '2', position: { x: 220, y: -40 }, data: { label: 'High-yield' } },
  { id: '3', position: { x: 220, y: 120 }, data: { label: 'Pitfall' } },
  { id: '4', position: { x: 440, y: 40 }, data: { label: 'Evidence' }, type: 'output' }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' }
];

export default function AuthoringWorkbenchPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [label, setLabel] = useState('New Beat');
  const [jsonPreview, setJsonPreview] = useState('');

  const moduleEnabled = DEV_ENABLED;

  useEffect(() => {
    const timeline = nodes.map((node, index) => ({
      beat: index + 1,
      label: node.data?.label ?? `Node ${index + 1}`
    }));
    setJsonPreview(JSON.stringify(timeline, null, 2));
  }, [nodes]);

  const handleAddNode = () => {
    const id = (nodes.length + 1).toString();
    setNodes((nds) => nds.concat({
      id,
      position: { x: 120 * (nds.length + 1), y: 80 },
      data: { label }
    }));
    setLabel('New Beat');
  };

  const handleConnect = (connection: Edge | any) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  if (!moduleEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="max-w-xl text-center space-y-4 p-8 bg-slate-800/80 rounded-xl border border-slate-700">
          <h1 className="text-2xl font-bold">Authoring workbench disabled</h1>
          <p className="text-sm">
            Set <code>NEXT_PUBLIC_DEV_UPLOAD=1</code> (or <code>NEXT_PUBLIC_DEV_TOOLS=1</code>) in <code>.env.local</code> to enable development tooling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Authoring</p>
          <h1 className="text-3xl font-extrabold">LessonSmith Flow Editor</h1>
          <p className="text-sm text-slate-600">
            Drag nodes to reorder beats. Use the form below to add new content blocks. JSON preview updates automatically for
            easy copy-paste into <code>*.lesson.json</code> files.
          </p>
          <p className="text-xs text-slate-500">
            Need retrieval context? Visit the <a className="underline" href="/dev/rag-inspector">RAG Inspector</a> to probe `/api/search` results.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div style={{ width: '100%', height: 420 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
              >
                <MiniMap pannable zoomable />
                <Controls />
                <Background gap={16} size={1} color="#CBD5F5" />
              </ReactFlow>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="font-semibold text-lg">Add timeline beat</h2>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Label
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  placeholder="e.g., Evidence snippet"
                />
              </label>
              <button
                type="button"
                onClick={handleAddNode}
                className="duo-button text-white text-sm px-3 py-2"
              >
                Add beat
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <h2 className="font-semibold text-lg">Timeline JSON preview</h2>
              <pre className="bg-slate-900 text-slate-100 text-xs rounded p-3 overflow-x-auto whitespace-pre-wrap">
{jsonPreview}
              </pre>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
