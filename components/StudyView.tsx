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
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>No study items available. Add <code>*.item.json</code> under <code>content/banks/&lt;module&gt;</code> or set `SCOPE_DIRS`.</p>
      </div>
    );
  }

  const letters = ['A', 'B', 'C', 'D', 'E'] as const;
  const selected = feedback.selected;
  const isCorrect = selected && selected === current.key;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Practice</h1>
          <p className="text-sm text-slate-300">Keyboard: 1–5 answer · N/P arrows for navigation · E toggle evidence</p>
        </div>
        <Popover>
          <PopoverTrigger className="flex max-w-xs flex-col gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-left text-sm text-slate-100 shadow-lg shadow-slate-900/20 transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-300">Why this next</span>
            <span className="line-clamp-2 text-sm text-white/90">{whyNext}</span>
          </PopoverTrigger>
          <PopoverContent className="w-96 space-y-2 border-white/20 bg-slate-900/90 text-slate-100">
            <h3 className="text-sm font-semibold text-white">Focus rationale</h3>
            <p className="text-sm text-slate-200">{whyNext}</p>
            <p className="text-xs text-slate-400">Keyboard: Enter/Space to open · Escape to close.</p>
          </PopoverContent>
        </Popover>
      </header>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/50 p-6 shadow-xl shadow-slate-900/20">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>
              #{index + 1} · Difficulty {current.difficulty} · LOs: {current.los.join(', ')}
            </span>
            <span className="font-mono text-[11px] text-slate-500">{current.id}</span>
          </div>
          <h2 className="text-xl font-semibold leading-relaxed text-white">{current.stem}</h2>

          <div className="space-y-3">
            {letters.map((letter, idx) => {
              const choice = current.choices[letter];
              if (!choice) return null;
              const isSelected = selected === letter;
              const showCorrect = feedback.correctShown && letter === current.key;
              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? isCorrect
                        ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                        : 'border-rose-500/70 bg-rose-500/10 text-rose-100'
                      : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <span className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium">{letter}. {choice}</p>
                    {feedback.correctShown && letter === current.key && (
                      <p className="text-sm text-emerald-200/90">{current.rationale_correct}</p>
                    )}
                    {feedback.correctShown && isSelected && letter !== current.key && (
                      <p className="text-sm text-rose-200/90">
                        {current.rationale_distractors?.[letter] ?? 'Review the underlying anatomy.'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-slate-300">
            <div className="space-x-2">
              <button onClick={handlePrev} className="rounded-lg border border-white/20 px-3 py-1 text-slate-200 hover:border-white/40">
                ← Prev
              </button>
              <button onClick={handleNext} className="rounded-lg border border-white/20 px-3 py-1 text-slate-200 hover:border-white/40">
                Next →
              </button>
            </div>
            {feedback.correctShown && (
              <span className={`font-semibold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5 shadow-xl shadow-slate-900/20">
          <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Evidence</h3>
              <DialogTrigger asChild>
                <button className="text-[10px] uppercase tracking-[0.3em] text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
                  {evidenceOpen ? 'Close (E)' : 'View (E)'}
                </button>
              </DialogTrigger>
            </header>
            <div className="space-y-2 text-xs text-slate-300">
              <p>{current.evidence?.citation ?? 'Evidence crop pending review.'}</p>
              <p>
                Source: {current.evidence?.file ?? 'source PDF'}
                {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
              </p>
            </div>
            <DialogContent className="border-white/20 bg-slate-900/90 text-slate-100">
              <DialogHeader>
                <DialogTitle>Evidence for {current.id}</DialogTitle>
                <DialogDescription className="text-slate-300">
                  {current.evidence?.citation ?? 'Review the attached primary source.'}
                </DialogDescription>
              </DialogHeader>
              {current.evidence?.dataUri ? (
                <figure className="space-y-3">
                  <img
                    src={current.evidence.dataUri}
                    alt={current.evidence.citation ?? current.id}
                    className="w-full rounded-lg border border-white/10 object-contain"
                    loading="lazy"
                  />
                  <figcaption className="text-xs text-slate-400">
                    {current.evidence?.file ?? 'source.pdf'}
                    {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <p className="rounded-lg border border-dashed border-white/20 bg-white/5 p-3 text-sm text-slate-200">
                  Evidence crop not available. Refer to {current.evidence?.file ?? 'source PDF'}
                  {current.evidence?.page ? ` (page ${current.evidence.page})` : ''}.
                </p>
              )}
              {current.evidence?.source_url && (
                <a
                  href={current.evidence.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-white/40"
                >
                  View source URL
                </a>
              )}
              <p className="text-xs text-slate-500">Keyboard: Press Escape to close. Shortcut E toggles this dialog.</p>
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
