'use client';

import { useMemo, useState } from 'react';
import { animate } from 'motion/react';
import GlowCard from '../../../components/atoms/GlowCard';
import type { StateSnapshot } from '../../../lib/persistence/stateLog';

interface TimeMachineClientProps {
  learnerId: string;
  snapshots: StateSnapshot[];
}

export function TimeMachineClient({ learnerId, snapshots }: TimeMachineClientProps) {
  const [index, setIndex] = useState(snapshots.length ? snapshots.length - 1 : 0);

  const active = snapshots[index] ?? null;
  const renderJson = useMemo(() => {
    if (!active) return '{}';
    const clone = structuredClone(active.state);
    return JSON.stringify(clone, null, 2);
  }, [active]);

  return (
    <div className="space-y-6">
      <GlowCard className="border border-white/20 bg-white/10 p-6 text-white">
        <h1 className="text-3xl font-bold">Time Machine — {learnerId}</h1>
        <p className="text-slate-200">
          Slide through learner state revisions captured by the adaptive engine. Snapshots append on every state update.
        </p>
        {snapshots.length > 0 ? (
          <div className="mt-6 space-y-4">
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="w-full accent-sky-400"
            />
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{snapshots[0].recordedAt}</span>
              <span>{snapshots[snapshots.length - 1].recordedAt}</span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">No snapshots recorded yet.</p>
        )}
      </GlowCard>

      {active && (
        <GlowCard className="border border-white/10 bg-black/70 p-6 font-mono text-sm text-sky-100">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>Snapshot</span>
            <span>{active.recordedAt}</span>
          </div>
          <pre
            className="mt-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap text-left"
            ref={(element) => {
              if (!element) return;
              // @ts-expect-error Motion runtime accepts CSS color keyframes; types lag behind
              animate(element, { backgroundColor: ['rgba(14,165,233,0.05)', 'rgba(15,23,42,0.6)'] }, { duration: 0.8, easing: [0.19, 1, 0.22, 1] });
            }}
          >
            {renderJson}
          </pre>
        </GlowCard>
      )}
    </div>
  );
}

export default TimeMachineClient;
