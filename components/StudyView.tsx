'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';
import { Popover, PopoverContent, PopoverTrigger } from './ui/radix/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/radix/dialog';
import { VisuallyHidden } from './ui/radix/visually-hidden';
import { RadioGroup, RadioGroupItem } from './ui/radix/radio-group';
import { cn } from './ui/utils';

interface StudyViewProps {
  items: StudyItem[];
  analytics: AnalyticsSummary | null;
}

interface ChoiceFeedback {
  selected?: 'A' | 'B' | 'C' | 'D' | 'E';
  correctShown: boolean;
}

function getWhyThisNext(itemId: string, itemLOs: string[], analytics: AnalyticsSummary | null): string {
  if (!analytics) return 'Focus on mastery — keep practicing.';
  // Spacing: if any LO is overdue
  const overdue = (analytics.ttm_per_lo || []).filter((t) => itemLOs.includes(t.lo_id) && t.overdue);
  if (overdue.length > 0) {
    return `Spacing overdue: ${overdue.map((o) => o.lo_id).join(', ')}`;
  }
  // Mastery deficit: highest projected minutes among item LOs
  const deficits = (analytics.ttm_per_lo || [])
    .filter((t) => itemLOs.includes(t.lo_id))
    .sort((a, b) => b.projected_minutes_to_mastery - a.projected_minutes_to_mastery);
  if (deficits.length > 0 && deficits[0].projected_minutes_to_mastery > 0) {
    const top = deficits[0];
    return `Mastery deficit in ${top.lo_id}: ~${top.projected_minutes_to_mastery} min to target`;
  }
  // ELG/min fallback
  if (analytics.elg_per_min.length > 0) {
    const match = analytics.elg_per_min.find((e) => e.item_id === itemId) || analytics.elg_per_min[0];
    return `${match.reason}. Δ ${(match.projected_mastery_gain * 100).toFixed(0)}% in ${match.estimated_minutes.toFixed(1)} min.`;
  }
  return 'Keep momentum — balanced practice.';
}

export function StudyView({ items, analytics }: StudyViewProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<ChoiceFeedback>({ correctShown: false });
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const current = items[index];
  const whyNext = useMemo(() => getWhyThisNext(current?.id ?? '', current?.los ?? [], analytics), [current?.id, current?.los, analytics]);

  const handleSelect = useCallback(
    (choice: 'A' | 'B' | 'C' | 'D' | 'E') => {
      if (!current) return;
      setFeedback({ selected: choice, correctShown: true });
    },
    [current]
  );

  const handleNext = useCallback(() => {
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!current) return;
      const key = event.key;
      if (key === 'ArrowRight' || key === 'n') {
        handleNext();
      } else if (key === 'ArrowLeft' || key === 'p') {
        handlePrev();
      } else if (key === 'e' || key === 'E') {
        setEvidenceOpen((prev) => !prev);
      } else if (/^[1-5]$/.test(key)) {
        const idx = Number(key) - 1;
        const choice = (['A', 'B', 'C', 'D', 'E'] as const)[idx];
        handleSelect(choice);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [current, handleNext, handlePrev, handleSelect]);

  if (!current) {
    return <p className="text-slate-600">No study items available. Add JSON under <code>content/banks/upper-limb-oms1</code>.</p>;
  }

  const letters = ['A', 'B', 'C', 'D', 'E'] as const;
  const selected = feedback.selected;
  const isCorrect = selected && selected === current.key;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Study Mode</h1>
          <p className="text-sm text-slate-500">
            Keyboard: 1-5 to answer · N/P arrows for next/prev · E toggle evidence
          </p>
        </div>
        <Popover>
          <PopoverTrigger className="flex max-w-xs flex-col gap-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why this next</span>
            <span className="line-clamp-2 text-sm text-slate-700">{whyNext}</span>
          </PopoverTrigger>
          <PopoverContent className="w-96 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Focus rationale</h3>
            <p className="text-sm text-slate-600">{whyNext}</p>
            <p className="text-xs text-slate-400">Keyboard: Activate with Enter/Space, close with Escape.</p>
          </PopoverContent>
        </Popover>
      </header>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              #{index + 1} • Difficulty {current.difficulty} • LOs: {current.los.join(', ')}
            </span>
            <span className="font-mono text-xs text-slate-400">{current.id}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{current.stem}</h2>

          <RadioGroup
            value={selected ?? undefined}
            onValueChange={(value) => handleSelect(value as (typeof letters)[number])}
            aria-label="Study mode answer choices"
          >
            {letters.map((letter, idx) => {
              const choice = current.choices[letter];
              if (!choice) return null;
              const showCorrect = feedback.correctShown && letter === current.key;
              const isSelected = selected === letter;
              const choiceId = `study-${current.id}-${letter}`;
              const baseClasses = 'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none';
              const uncheckedClasses = 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300';
              const correctClasses = 'border-emerald-400 bg-emerald-50 text-emerald-900';
              const incorrectClasses = 'border-rose-400 bg-rose-50 text-rose-900';
              const stateClasses = feedback.correctShown
                ? letter === current.key
                  ? correctClasses
                  : isSelected
                    ? incorrectClasses
                    : uncheckedClasses
                : isSelected
                  ? 'border-slate-300 bg-white text-slate-900'
                  : uncheckedClasses;
              return (
                <div key={letter} className="relative">
                  <RadioGroupItem id={choiceId} value={letter} className="peer sr-only" />
                  <label
                    htmlFor={choiceId}
                    className={cn(
                      baseClasses,
                      stateClasses,
                      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2'
                    )}
                  >
                    <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {letter}. {choice}
                      </p>
                      {feedback.correctShown && letter === current.key && (
                        <p className="mt-1 text-sm text-emerald-700">{current.rationale_correct}</p>
                      )}
                      {feedback.correctShown && isSelected && letter !== current.key && (
                        <p className="mt-1 text-sm text-rose-700">
                          {current.rationale_distractors?.[letter] ?? 'Review the underlying anatomy.'}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </RadioGroup>

          <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
            <div className="space-x-2">
              <button onClick={handlePrev} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">
                ← Prev
              </button>
              <button onClick={handleNext} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">
                Next →
              </button>
            </div>
            {feedback.correctShown && (
              <span className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Evidence</h3>
              <DialogTrigger asChild>
                <button className="text-xs uppercase tracking-wide text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {evidenceOpen ? 'Close (E)' : 'View (E)'}
                </button>
              </DialogTrigger>
            </header>
            <div className="space-y-2 text-xs text-slate-500">
              <p>{current.evidence?.citation ?? 'Evidence crop pending review.'}</p>
              <p>
                Source: {current.evidence?.file ?? 'source PDF'}
                {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
              </p>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Evidence for {current.id}</DialogTitle>
                <DialogDescription>
                  {current.evidence?.citation ?? 'Review the attached primary source.'}
                </DialogDescription>
              </DialogHeader>
              {current.evidence?.dataUri ? (
                <figure className="space-y-3">
                  <img
                    src={current.evidence.dataUri}
                    alt={current.evidence.citation ?? current.id}
                    className="w-full rounded-md border border-slate-200 object-contain"
                    loading="lazy"
                  />
                  <figcaption className="text-xs text-slate-500">
                    {current.evidence?.file ?? 'source.pdf'}
                    {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <p className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  Evidence crop not available. Refer to {current.evidence?.file ?? 'source PDF'}
                  {current.evidence?.page ? ` (page ${current.evidence.page})` : ''}.
                </p>
              )}
              {current.evidence?.source_url && (
                <a
                  href={current.evidence.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
                >
                  View source URL
                </a>
              )}
              <p className="text-xs text-slate-400">Keyboard: Press Escape to close. Shortcut E toggles this dialog.</p>
            </DialogContent>
          </Dialog>
          <VisuallyHidden>
            <span>Press the E key to toggle the evidence dialog.</span>
          </VisuallyHidden>
        </aside>
      </article>
    </div>
  );
}
