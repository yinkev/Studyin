'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';
import type { OptimisticLearnerStateUpdate } from '../lib/client/useLearnerState';
  optimisticLearnerStateUpdate: OptimisticLearnerStateUpdate;
  invalidateLearnerState: () => Promise<void>;
// (no-op)

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
  const [showWhy, setShowWhy] = useState(false);
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
export function StudyView({
  items,
  analytics,
  learnerId,
  learnerState,
  onLearnerStateChange,
  optimisticLearnerStateUpdate,
  invalidateLearnerState
}: StudyViewProps) {
  const studyAttemptMutation = useMutation<
    Awaited<ReturnType<typeof submitStudyAttempt>>,
    Error,
    Parameters<typeof submitStudyAttempt>[0],
    { previous: LearnerState }
  >({
    mutationFn: submitStudyAttempt,
    onMutate: async (variables) => {
      const snapshot = await optimisticLearnerStateUpdate((current) => {
        const now = Date.now();
        const existing = current.items[variables.itemId] ?? {
          attempts: 0,
          correct: 0,
          recentAttempts: [] as number[]
        };
        const attempts = (existing.recentAttempts ?? []).slice(-20);
        attempts.push(now);
        return {
          ...current,
          updatedAt: new Date().toISOString(),
          items: {
            ...current.items,
            [variables.itemId]: {
              attempts: (existing.attempts ?? 0) + 1,
              correct: (existing.correct ?? 0) + (variables.correct ? 1 : 0),
              lastAttemptTs: now,
              recentAttempts: attempts.slice(-20)
            }
          }
        } satisfies LearnerState;
      });
      return { previous: snapshot };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        onLearnerStateChange(context.previous);
      }
      console.error('submitStudyAttempt failed', error);
    },
    onSuccess: (result) => {
      if (result?.learnerState) {
        onLearnerStateChange(result.learnerState);
      }
    },
    onSettled: () => {
      void invalidateLearnerState();
    }
  });
  const isPending = studyAttemptMutation.isPending;
      if (!current || feedback.correctShown || isPending) return;
      studyAttemptMutation.mutate({
        learnerId,
        sessionId,
        itemId: current.id,
        loIds: current.los ?? [],
        difficulty: current.difficulty,
        choice,
        correct: choice === current.key,
        durationMs,
        openedEvidence: evidenceOpen,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION
    [current, evidenceOpen, feedback.correctShown, isPending, learnerId, questionStart, sessionId, studyAttemptMutation]
    if (isPending) return;
  }, [isPending, items.length]);
    if (isPending) return;
  }, [isPending, items.length]);
  }, [current, handleNext, handlePrev, isPending, letters, submitAttempt]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>No study items available. Add <code>*.item.json</code> under <code>content/banks/&lt;module&gt;</code> or set `SCOPE_DIRS`.</p>
      </div>
    );
  }

    <div className="space-y-6 px-4 py-6" aria-busy={isPending}>
  const selected = feedback.selected;
  const isCorrect = selected && selected === current.key;

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Practice</h1>
          <p className="text-sm text-gray-600">Keyboard: 1–5 answer · N/P arrows for navigation · E toggle evidence</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowWhy((v) => !v)} className="flex max-w-xs flex-col gap-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-800 shadow transition hover:bg-gray-50">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Why this next</span>
            <span className="line-clamp-2 text-sm">{whyNext}</span>
          </button>
          {showWhy && (
            <div className="absolute right-0 z-10 mt-2 w-96 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-xl">
              <h3 className="text-sm font-semibold">Focus rationale</h3>
              <p className="text-sm">{whyNext}</p>
              <p className="text-xs text-gray-500">Keyboard: E toggles evidence.</p>
            </div>
          )}
        </div>
      </header>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-5 duo-card p-6">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                #{index + 1} / {items.length}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-700">
                Difficulty {current.difficulty}
              </span>
              {current.los.map((lo) => (
                <span key={lo} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                  {lo}
                </span>
              ))}
            </div>
            <span className="font-mono text-[11px] text-gray-500">{current.id}</span>
          </div>
          <div className="h-1 w-full rounded bg-gray-200 overflow-hidden">
            <div className="h-1 duo-progress" style={{ width: `${Math.round(((index + 1) / items.length) * 100)}%` }} />
          </div>
          <h2 className="text-xl font-semibold leading-relaxed text-gray-900">{current.stem}</h2>

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
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:translate-y-0.5 ${
                    isSelected
                      ? isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mt-1 okc-pill-ghost">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium">{letter}. {choice}</p>
                    {feedback.correctShown && letter === current.key && (
                      <p className="text-sm text-emerald-700">{current.rationale_correct}</p>
                    )}
                    {feedback.correctShown && isSelected && letter !== current.key && (
                      <p className="text-sm text-rose-700">
                        {current.rationale_distractors?.[letter] ?? 'Review the underlying anatomy.'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-gray-600">
            <div className="space-x-2">
              <button onClick={handlePrev} className="btn-ghost">← Prev</button>
              <button onClick={handleNext} className="btn-ghost">Next →</button>
            </div>
            {feedback.correctShown && (
              <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4 duo-card p-5">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Evidence</h3>
            <button onClick={() => setEvidenceOpen((v)=>!v)} className="text-[10px] uppercase tracking-wide text-gray-600 hover:text-gray-800">
              {evidenceOpen ? 'Close (E)' : 'View (E)'}
            </button>
          </header>
          <div className="space-y-2 text-xs text-gray-700">
            <p>{current.evidence?.citation ?? 'Evidence crop pending review.'}</p>
            <p>
              Source: {current.evidence?.file ?? 'source PDF'}
              {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
            </p>
          </div>
          {evidenceOpen && (
            <div className="space-y-3">
              {current.evidence?.dataUri ? (
                <figure className="space-y-3">
                  <img src={current.evidence.dataUri} alt={current.evidence.citation ?? current.id} className="w-full rounded-lg border border-gray-200 object-contain" loading="lazy" />
                  <figcaption className="text-xs text-gray-500">
                    {current.evidence?.file ?? 'source.pdf'}
                    {current.evidence?.page ? ` · Page ${current.evidence.page}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-700">
                  Evidence crop not available. Refer to {current.evidence?.file ?? 'source PDF'}
                  {current.evidence?.page ? ` (page ${current.evidence.page})` : ''}.
                </p>
              )}
              {current.evidence?.source_url && (
                <a href={current.evidence.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-800 hover:bg-gray-50">View source URL</a>
              )}
            </div>
          )}
        </aside>
      </article>
    </div>
  );
}
            <div className="flex items-center gap-3">
              {isPending && <span className="text-xs text-emerald-700 animate-pulse">Saving attempt…</span>}
              {feedback.correctShown && current && (
                <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
                </span>
              )}
            </div>
