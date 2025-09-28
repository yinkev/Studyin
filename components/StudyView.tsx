'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';

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
  const [showEvidence, setShowEvidence] = useState(true);

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
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setFeedback({ correctShown: false });
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
        setShowEvidence((prev) => !prev);
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
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {whyNext}
        </div>
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
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    isSelected
                      ? isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-rose-400 bg-rose-50 text-rose-900'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{letter}. {choice}</p>
                    {feedback.correctShown && letter === current.key && (
                      <p className="mt-1 text-sm text-emerald-700">{current.rationale_correct}</p>
                    )}
                    {feedback.correctShown && isSelected && letter !== current.key && (
                      <p className="mt-1 text-sm text-rose-700">
                        {current.rationale_distractors?.[letter] ?? 'Review the underlying anatomy.'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

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
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Evidence</h3>
            <button
              onClick={() => setShowEvidence((prev) => !prev)}
              className="text-xs uppercase tracking-wide text-slate-500 hover:text-slate-700"
            >
              {showEvidence ? 'Hide (E)' : 'Show (E)'}
            </button>
          </header>

          {showEvidence ? (
            current.evidence?.dataUri ? (
              <figure className="space-y-2">
                <img
                  src={current.evidence.dataUri}
                  alt={current.evidence.citation ?? current.id}
                  className="w-full rounded-md border border-slate-200 object-contain"
                />
                <figcaption className="text-xs text-slate-500">
                  {current.evidence.citation ?? 'Private study material'}
                </figcaption>
              </figure>
            ) : (
              <p className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                Evidence crop not available. Refer to {current.evidence?.file ?? 'source PDF'} (page {current.evidence?.page}).
              </p>
            )
          ) : (
            <p className="text-xs text-slate-500">Evidence hidden.</p>
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
        </aside>
      </article>
    </div>
  );
}
