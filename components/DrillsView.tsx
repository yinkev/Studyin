'use client';

import { useMemo, useState } from 'react';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/radix/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/radix/tooltip';

export function DrillsView({ analytics }: { analytics: AnalyticsSummary | null }) {
  const [activeDrill, setActiveDrill] = useState<string | null>(null);

  const drills = useMemo(() => analytics?.elg_per_min ?? [], [analytics]);

  if (!analytics || drills.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-slate-600">
        No personalized drills yet. Capture more practice attempts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drills.map((rec) => {
        const efficiency = rec.estimated_minutes > 0 ? rec.projected_mastery_gain / rec.estimated_minutes : rec.projected_mastery_gain;
        const efficiencyPercent = Math.min(100, Math.round(efficiency * 100));
        return (
          <Dialog
            key={rec.item_id}
            open={activeDrill === rec.item_id}
            onOpenChange={(open) => setActiveDrill(open ? rec.item_id : null)}
          >
            <div className="rounded border border-slate-200 bg-white p-4 transition hover:border-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">{rec.item_id}</h3>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        {rec.reason}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left text-xs text-slate-600">
                      High leverage drill based on TTM deficits and recent accuracy trends.
                    </TooltipContent>
                  </Tooltip>
                  <button
                    onClick={() => setActiveDrill(rec.item_id)}
                    className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View details
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-600">LOs: {rec.lo_ids.join(', ')}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Projected mastery gain</span>
                  <span>{(rec.projected_mastery_gain * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Estimated time</span>
                  <span>{rec.estimated_minutes.toFixed(2)} min</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Current success rate</span>
                  <span>{(rec.success_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100" aria-hidden="true">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${efficiencyPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{rec.item_id}</DialogTitle>
                <DialogDescription>
                  Prioritize this drill to close spacing or mastery gaps efficiently.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Why it matters:</span> {rec.reason} — estimated mastery gain
                  {(rec.projected_mastery_gain * 100).toFixed(1)}% in {rec.estimated_minutes.toFixed(2)} minutes with a {(
                    rec.success_rate * 100
                  ).toFixed(0)}% recent accuracy rate.
                </p>
                <p>
                  <span className="font-semibold">Focus LOs:</span> {rec.lo_ids.join(', ')}
                </p>
                <p>
                  Export the form and lock evidence before sharing with learners. Keyboard shortcut: Esc to close.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}
