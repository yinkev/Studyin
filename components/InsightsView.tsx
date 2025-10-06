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
    <div className="duo-card p-6">
      <h2 className="text-xl font-semibold text-gray-900">Mastery Insights</h2>
      <ul className="mt-4 space-y-2">
        {masteryScores.map((item) => (
          <li key={item.lo_id} className="flex justify-between">
            <span>{item.lo_id}</span>
            <span>{Math.round(item.score * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
