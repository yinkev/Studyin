'use client';

interface MasteryScore {
  lo_id: string;
  score: number;
}

interface InsightsViewProps {
  masteryScores: MasteryScore[];
}

export function InsightsView({ masteryScores }: InsightsViewProps) {
  return (
    <div className="rounded-2xl border border-text-low/15 bg-surface-bg0/70 p-6 text-text-high">
      <h2 className="text-xl font-semibold">Mastery Insights</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {masteryScores.map((item) => (
          <li key={item.lo_id} className="flex justify-between">
            <span className="text-text-high">{item.lo_id}</span>
            <span className="text-text-med">{Math.round(item.score * 100)}%</span>
          </li>
        ))}
        {masteryScores.length === 0 && (
          <li className="text-text-med">No mastery data available yet.</li>
        )}
      </ul>
    </div>
  );
}
