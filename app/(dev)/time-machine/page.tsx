import { promises as fs } from 'fs';
import path from 'path';
import { loadStateSnapshots } from '../../../lib/persistence/stateLog';
import TimeMachineClient from './TimeMachineClient';
import GlowCard from '../../../components/atoms/GlowCard';

async function listLearners(): Promise<string[]> {
  const dir = process.env.STATE_LOG_DIR ?? path.join(process.cwd(), 'data', 'state', 'snapshots');
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((entry) => entry.endsWith('.ndjson')).map((entry) => entry.replace(/\.ndjson$/, ''));
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export default async function TimeMachinePage() {
  const learners = await listLearners();
  if (!learners.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <GlowCard className="border border-white/10 bg-white/5 p-12 text-center text-white">
            <h1 className="text-3xl font-bold">Time Machine</h1>
            <p className="mt-3 text-slate-200">No learner snapshots yet. Trigger a study attempt to populate history.</p>
          </GlowCard>
        </div>
      </div>
    );
  }

  const learnerId = learners[0];
  const snapshots = await loadStateSnapshots(learnerId, 120);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <TimeMachineClient learnerId={learnerId} snapshots={snapshots} />
      </div>
    </div>
  );
}
