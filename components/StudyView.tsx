'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';
import type { OptimisticLearnerStateUpdate } from '../lib/client/useLearnerState';
import type { LearnerState } from '../lib/server/study-state';

interface StudyViewProps {
  items: StudyItem[];
  analytics: AnalyticsSummary | null;
  learnerId: string;
  learnerState: LearnerState;
  onLearnerStateChange: (state: LearnerState) => void;
  optimisticLearnerStateUpdate: OptimisticLearnerStateUpdate;
  invalidateLearnerState: () => Promise<void>;
}

interface ChoiceFeedback {
  selected?: 'A' | 'B' | 'C' | 'D' | 'E';
  correctShown: boolean;
}

interface PersistLearnerStateVariables {
  nextState: LearnerState;
  snapshot: LearnerState;
}

function getWhyThisNext(itemId: string, itemLOs: string[], analytics: AnalyticsSummary | null): string {
  if (!analytics) return 'Focus on mastery — keep practicing.';
  const overdue = (analytics.ttm_per_lo || []).filter((t) => itemLOs.includes(t.lo_id) && t.overdue);
  if (overdue.length > 0) {
    return `Spacing overdue: ${overdue.map((o) => o.lo_id).join(', ')}`;
  }
  const deficits = (analytics.ttm_per_lo || [])
    .filter((t) => itemLOs.includes(t.lo_id))
    .sort((a, b) => b.projected_minutes_to_mastery - a.projected_minutes_to_mastery);
  if (deficits.length > 0 && deficits[0].projected_minutes_to_mastery > 0) {
    const top = deficits[0];
    return `Mastery deficit in ${top.lo_id}: ~${top.projected_minutes_to_mastery} min to target`;
  }
  if (analytics.elg_per_min.length > 0) {
    const match = analytics.elg_per_min.find((e) => e.item_id === itemId) || analytics.elg_per_min[0];
    return `${match.reason}. Δ ${(match.projected_mastery_gain * 100).toFixed(0)}% in ${match.estimated_minutes.toFixed(1)} min.`;
  }
  return 'Keep momentum — balanced practice.';
}

function updateLearnerStateAfterAttempt(
  state: LearnerState,
  item: StudyItem,
  correct: boolean
): LearnerState {
  const now = Date.now();
  const existingItem = state.items[item.id] ?? { attempts: 0, correct: 0 };
  const itemAttempts = [...(existingItem.recentAttempts ?? []), now].slice(-20);

  const updatedItems: LearnerState['items'] = {
    ...state.items,
    [item.id]: {
      attempts: (existingItem.attempts ?? 0) + 1,
      correct: (existingItem.correct ?? 0) + (correct ? 1 : 0),
      lastAttemptTs: now,
      recentAttempts: itemAttempts
    }
  };

  const updatedLos: LearnerState['los'] = { ...state.los };
  for (const lo of item.los ?? []) {
    const existingLo = updatedLos[lo] ?? { attempts: 0, correct: 0 };
    const recentSes = [...(existingLo.recentSes ?? []), now].slice(-20);
    updatedLos[lo] = {
      attempts: (existingLo.attempts ?? 0) + 1,
      correct: (existingLo.correct ?? 0) + (correct ? 1 : 0),
      recentSes,
      consecutiveCorrect: correct ? (existingLo.consecutiveCorrect ?? 0) + 1 : 0,
      scheduledAt: existingLo.scheduledAt
    };
  }

  return {
    ...state,
    updatedAt: new Date().toISOString(),
    items: updatedItems,
    los: updatedLos
  };
}

async function persistLearnerState({ nextState }: PersistLearnerStateVariables) {
  const response = await fetch('/api/learner-state', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId: nextState.learnerId, learnerState: nextState })
  });
  if (!response.ok) {
    throw new Error('Failed to persist learner state');
  }
  const payload = (await response.json()) as { learnerState: LearnerState };
  return payload.learnerState;
}

export function StudyView({
  items,
  analytics,
  learnerId,
  learnerState,
  onLearnerStateChange,
  optimisticLearnerStateUpdate,
  invalidateLearnerState
}: StudyViewProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<ChoiceFeedback>({ correctShown: false });
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = items[index];
  const whyNext = useMemo(() => getWhyThisNext(current?.id ?? '', current?.los ?? [], analytics), [current?.id, current?.los, analytics]);
  const currentStats = current ? learnerState.items[current.id] : undefined;
  const attempts = currentStats?.attempts ?? 0;
  const accuracy = attempts > 0 ? Math.round(((currentStats?.correct ?? 0) / attempts) * 100) : null;
  const lastSyncLabel = useMemo(() => {
    const parsed = new Date(learnerState.updatedAt);
    if (Number.isNaN(parsed.getTime())) {
      return 'just now';
    }
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [learnerState.updatedAt]);

  const saveMutation = useMutation({
    mutationFn: persistLearnerState,
    retry: 1,
    onSuccess: (serverState) => {
      onLearnerStateChange(serverState);
      setError(null);
    },
    onError: (mutationError, variables) => {
      console.error('Failed to persist learner state', mutationError);
      if (variables?.snapshot) {
        onLearnerStateChange(variables.snapshot);
      }
      setError('We could not sync your progress. Retrying shortly…');
    },
    onSettled: () => {
      void invalidateLearnerState();
    }
  });

  const handleNext = useCallback(() => {
    if (items.length === 0 || saveMutation.isPending) return;
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length, saveMutation.isPending]);

  const handlePrev = useCallback(() => {
    if (items.length === 0 || saveMutation.isPending) return;
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length, saveMutation.isPending]);

  const letters = ['A', 'B', 'C', 'D', 'E'] as const;

  const handleSelect = useCallback(
    (choice: 'A' | 'B' | 'C' | 'D' | 'E') => {
      if (!current || saveMutation.isPending) return;
      setError(null);
      setFeedback({ selected: choice, correctShown: true });
      const correct = choice === current.key;

      let nextState: LearnerState | undefined;
      const updater = (state: LearnerState) => {
        const updated = updateLearnerStateAfterAttempt(state, current, correct);
        nextState = updated;
        return updated;
      };

      optimisticLearnerStateUpdate(updater)
        .then((snapshot) => {
          if (!nextState) return;
          saveMutation.mutate({ nextState, snapshot });
        })
        .catch((err) => {
          console.error('Failed to optimistically update learner state', err);
          setError('Something went wrong updating your progress. Try again.');
          setFeedback({ correctShown: false });
        });
    },
    [current, saveMutation, optimisticLearnerStateUpdate]
  );

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!current) return;
      if (saveMutation.isPending) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
        }
        return;
      }
      const key = event.key;
      if (key === 'ArrowRight' || key === 'n') {
        handleNext();
      } else if (key === 'ArrowLeft' || key === 'p') {
        handlePrev();
      } else if (key === 'e' || key === 'E') {
        setEvidenceOpen((prev) => !prev);
      } else if (/^[1-5]$/.test(key)) {
        const idx = Number(key) - 1;
        const choice = letters[idx];
        if (choice) {
          handleSelect(choice);
        }
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [current, handleNext, handlePrev, handleSelect, letters, saveMutation.isPending]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>
          No study items available. Add <code>*.item.json</code> under <code>content/banks/&lt;module&gt;</code> or set `SCOPE_DIRS`.
        </p>
      </div>
    );
  }

  const selected = feedback.selected;
  const isCorrect = selected && selected === current.key;

  return (
    <div className="space-y-6 px-4 py-6" aria-busy={saveMutation.isPending} data-learner-id={learnerId}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Practice</h1>
          <p className="text-sm text-gray-600">Keyboard: 1–5 answer · N/P arrows for navigation · E toggle evidence</p>
          <p className="text-xs text-gray-500">Progress synced {lastSyncLabel}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowWhy((v) => !v)}
            className="flex max-w-xs flex-col gap-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-800 shadow transition hover:bg-gray-50"
          >
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

      {error && <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

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
          <div className="text-xs text-gray-500">
            Attempts: {attempts}
            {attempts > 0 && typeof accuracy === 'number' ? ` · Accuracy ${accuracy}%` : ''}
          </div>
          <h2 className="text-xl font-semibold leading-relaxed text-gray-900">{current.stem}</h2>

          <div className="space-y-3">
            {letters.map((letter, idx) => {
              const choice = current.choices[letter];
              if (!choice) return null;
              const isSelected = selected === letter;
              const showCorrect = feedback.correctShown && letter === current.key;
              const disabled = saveMutation.isPending;
              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:translate-y-0.5 ${
                    disabled
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                      : isSelected
                        ? isCorrect
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                          : 'border-rose-500 bg-rose-50 text-rose-900'
                        : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                  disabled={disabled}
                >
                  <span className="mt-1 okc-pill-ghost">{idx + 1}</span>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {letter}. {choice}
                    </p>
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
              <button onClick={handlePrev} className="btn-ghost" disabled={saveMutation.isPending}>
                ← Prev
              </button>
              <button onClick={handleNext} className="btn-ghost" disabled={saveMutation.isPending}>
                Next →
              </button>
            </div>
            <div className="flex items-center gap-3">
              {saveMutation.isPending && (
                <span className="text-xs text-emerald-700 animate-pulse">Saving attempt…</span>
              )}
              {feedback.correctShown && (
                <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
                </span>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4 duo-card p-5">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Evidence</h3>
            <button
              onClick={() => setEvidenceOpen((v) => !v)}
              className="text-[10px] uppercase tracking-wide text-gray-600 hover:text-gray-800"
              disabled={saveMutation.isPending}
            >
              {evidenceOpen ? 'Close (E)' : 'View (E)'}
            </button>
          </header>
          {evidenceOpen ? (
            current.evidence?.dataUri ? (
              <figure className="space-y-2">
                <img
                  src={current.evidence.dataUri}
                  alt={current.evidence.citation ?? 'Evidence'}
                  className="w-full rounded-lg border border-gray-200 shadow-sm"
                />
                {current.evidence.citation && (
                  <figcaption className="text-xs text-gray-500">{current.evidence.citation}</figcaption>
                )}
              </figure>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                Evidence crop missing. Check validator output.
              </div>
            )
          ) : (
            <p className="text-sm text-gray-600">
              Evidence locked until you request it. Toggle with keyboard <kbd className="rounded border border-gray-300 bg-gray-100 px-1 text-[10px]">E</kbd>.
            </p>
          )}
        </aside>
      </article>
    </div>
  );
}
