'use client';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/radix/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/radix/tooltip';
import { Button } from './ui/button';
import { VisuallyHidden } from './ui/radix/visually-hidden';

export function DrillsView({ analytics }: { analytics: AnalyticsSummary | null }) {
  if (!analytics || analytics.elg_per_min.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-slate-600">
        No personalized drills yet. Capture more practice attempts.
      </div>
    );
  }
  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {analytics.elg_per_min.map((rec) => (
          <Dialog key={rec.item_id}>
            <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900">{rec.item_id}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xs uppercase tracking-wide text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Signals
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left">
                    {rec.reason}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-sm text-slate-600">LOs: {rec.lo_ids.join(', ')}</p>
              <p className="text-xs text-slate-500">
                Δ mastery {rec.projected_mastery_gain.toFixed(2)} in {rec.estimated_minutes.toFixed(2)} min
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Confusion edges tracked · Keyboard: Enter to open details</span>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Details
                  </Button>
                </DialogTrigger>
              </div>
              <VisuallyHidden>
                <span>Press Enter or Space on the Details button to open drill evidence.</span>
              </VisuallyHidden>
            </article>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Drill details for {rec.item_id}</DialogTitle>
                <DialogDescription>
                  Personalized drill targeting {rec.lo_ids.length} learning objective{rec.lo_ids.length === 1 ? '' : 's'}.
                </DialogDescription>
              </DialogHeader>
              <dl className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Reason</dt>
                  <dd className="text-right text-slate-600">{rec.reason}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Projected mastery gain</dt>
                  <dd className="text-right text-slate-600">{rec.projected_mastery_gain.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Estimated minutes</dt>
                  <dd className="text-right text-slate-600">{rec.estimated_minutes.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium">Learning objectives</dt>
                  <dd className="text-slate-600">{rec.lo_ids.join(', ')}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-400">Keyboard: Escape closes this dialog.</p>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </TooltipProvider>
  );
}

