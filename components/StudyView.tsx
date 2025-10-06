'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';
import type { LearnerState } from '../lib/server/study-state';
import type { CandidateItem } from '../lib/study-engine';
import { buildWhyThisNext, difficultyToBeta, scoreCandidates } from '../lib/study-engine';
import { WhyThisNextPill } from './pills/WhyThisNextPill';
import { masteryProbability } from 'lib/engine/shims/rasch';
import { submitStudyAttempt } from '../app/study/actions';
import type { OptimisticLearnerStateUpdate } from '../lib/client/useLearnerState';

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

interface RagResult {
  itemId: string;
  loIds: string[];
  text: string;
  score: number;
  similarity: number;
  decay: number;
}

const ANSWER_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function fallbackWhyThisNext(itemId: string, itemLOs: string[], analytics: AnalyticsSummary | null): string {
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

function fallbackLoEstimate(loIds: string[], analytics: AnalyticsSummary | null) {
  if (!analytics) return { thetaHat: 0, se: 0.45 };
  const entries = (analytics.ttm_per_lo || []).filter((row) => loIds.includes(row.lo_id));
  if (!entries.length) return { thetaHat: 0, se: 0.45 };
  const avgAccuracy = entries.reduce((sum, row) => sum + (row.current_accuracy ?? 0.5), 0) / entries.length;
  const totalAttempts = entries.reduce((sum, row) => sum + (row.attempts ?? 0), 0);
  const thetaHat = (avgAccuracy - 0.5) * 2;
  const se = Math.max(0.22, 0.6 - Math.min(totalAttempts / 40, 0.35));
  return { thetaHat, se };
}

function blueprintMultiplier(loIds: string[], analytics: AnalyticsSummary | null) {
  if (!analytics) return 1;
  const entries = (analytics.ttm_per_lo || []).filter((row) => loIds.includes(row.lo_id));
  if (!entries.length) return 1;
  const overdue = entries.some((row) => row.overdue);
  const deficit = entries.some((row) => (row.projected_minutes_to_mastery ?? 0) > 0);
  const boost = deficit ? 0.15 : 0;
  const overdueBoost = overdue ? 0.15 : 0;
  return Number((1 + boost + overdueBoost).toFixed(2));
}

function medianSeconds(itemId: string, analytics: AnalyticsSummary | null): number {
  const match = analytics?.elg_per_min?.find((entry) => entry.item_id === itemId);
  if (match) return Math.max(30, match.estimated_minutes * 60);
  return 90;
}

function deriveAbility(loIds: string[], learnerState: LearnerState, analytics: AnalyticsSummary | null) {
  const states = loIds
    .map((loId) => learnerState.los[loId])
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
  if (states.length) {
    const thetaHat = states.reduce((sum, state) => sum + (state.thetaHat ?? 0), 0) / states.length;
    const se = states.reduce((sum, state) => sum + (state.se ?? 0.6), 0) / states.length;
    return { thetaHat, se: Math.max(0.18, se) };
  }
  return fallbackLoEstimate(loIds, analytics);
}

function defaultLoState(): LearnerState['los'][string] {
  return {
    thetaHat: 0,
    se: 0.8,
    itemsAttempted: 0,
    recentSes: [],
    priorMu: 0,
    priorSigma: 0.8
  };
}

function updateLearnerStateAfterAttempt(
  state: LearnerState,
  item: StudyItem,
  correct: boolean
): LearnerState {
  const now = Date.now();
  const items: LearnerState['items'] = { ...state.items };
  const currentItem = items[item.id] ?? { attempts: 0, correct: 0, recentAttempts: [] as number[] };
  const updatedItem = {
    attempts: (currentItem.attempts ?? 0) + 1,
    correct: (currentItem.correct ?? 0) + (correct ? 1 : 0),
    lastAttemptTs: now,
    recentAttempts: [...(currentItem.recentAttempts ?? []), now].slice(-20)
  };
  items[item.id] = updatedItem;

  const los: LearnerState['los'] = { ...state.los };
  for (const loId of item.los ?? []) {
    const current = los[loId] ?? defaultLoState();
    los[loId] = {
      ...current,
      itemsAttempted: (current.itemsAttempted ?? 0) + 1,
      recentSes: [...(current.recentSes ?? []), current.se ?? 0.6].slice(-10)
    };
  }

  return {
    ...state,
    updatedAt: new Date().toISOString(),
    items,
    los
  };
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
  const whyPopoverRef = useRef<HTMLDivElement | null>(null);
  const whyButtonRef = useRef<HTMLButtonElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [questionStart, setQuestionStart] = useState(() => Date.now());
  const [ragCache, setRagCache] = useState<Record<string, RagResult | null>>({});
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);

  const current = items[index];
  const ragResult = current ? ragCache[current.id] ?? null : null;

  const { whyNext, whySignals, ttmTitle } = useMemo(() => {
    if (!current) return 'Focus on mastery — keep practicing.';
    const loIds = current.los ?? [];
    const { thetaHat, se } = deriveAbility(loIds, learnerState, analytics);
    const stats = learnerState.items[current.id];
    const now = Date.now();
    const recent = stats?.recentAttempts ?? [];
    const last24h = recent.filter((ts) => now - ts <= 24 * 60 * 60 * 1000).length;
    const last7d = recent.filter((ts) => now - ts <= 7 * 24 * 60 * 60 * 1000).length;
    const hoursSinceLast = stats?.lastAttemptTs ? (now - stats.lastAttemptTs) / (1000 * 60 * 60) : 999;
    const attempts = stats?.attempts ?? 0;
    const correct = stats?.correct ?? 0;
    const meanScore = attempts ? correct / attempts : Math.max(0.25, thetaHat * 0.5 + 0.5);

    const exposure: CandidateItem['exposure'] = {
      last24h,
      last7d,
      hoursSinceLast,
      meanScore,
      se: Math.max(0.15, se)
    };
    const fatigueScalar = Math.max(0.6, 1 - index * 0.05);
    const candidate: CandidateItem = {
      id: current.id,
      loIds,
      difficulty: difficultyToBeta(current.difficulty),
      thresholds: undefined,
      medianTimeSeconds: medianSeconds(current.id, analytics),
      blueprintMultiplier: blueprintMultiplier(loIds, analytics),
      exposure,
      fatigueScalar
    };
    const [score] = scoreCandidates({ thetaHat, items: [candidate] });
    if (!score || score.exposureMultiplier === 0) {
      // Build a minimal TTM tooltip if analytics exist
      const title = (analytics?.ttm_per_lo || [])
        .filter((row) => loIds.includes(row.lo_id))
        .map((row) => `${row.lo_id}: ${Number(row.projected_minutes_to_mastery ?? 0).toFixed(2)}m${row.overdue ? ' (overdue)' : ''}`)
        .join(' · ');
      return { whyNext: fallbackWhyThisNext(current.id, loIds, analytics), whySignals: null as any, ttmTitle: title || undefined };
    }
    const masteryProb = masteryProbability(thetaHat, se);
    const whyText = buildWhyThisNext(score, { thetaHat, se, masteryProb });
    const signals = {
      info: score.info,
      blueprintMult: score.blueprintMultiplier,
      exposureMult: score.exposureMultiplier,
      fatigue: score.fatigueScalar,
      medianSec: score.medianTimeSeconds,
      thetaHat,
      se,
      masteryProb,
      loIds,
      itemId: current.id
    };
    const title = (analytics?.ttm_per_lo || [])
      .filter((row) => loIds.includes(row.lo_id))
      .map((row) => `${row.lo_id}: ${Number(row.projected_minutes_to_mastery ?? 0).toFixed(2)}m${row.overdue ? ' (overdue)' : ''}`)
      .join(' · ');
    return { whyNext: whyText, whySignals: signals, ttmTitle: title || undefined };
  }, [analytics, current, index, learnerState]);

  const letters = ANSWER_LETTERS;
  const selected = feedback.selected;
  const isCorrect = Boolean(selected && current && selected === current.key);
  const busy = isSaving || isPending;

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

  useEffect(() => {
    if (!current) return;
    if (ragCache[current.id] !== undefined) {
      setRagError(null);
      return;
    }
    const itemId = current.id;
    const loIds = current.los ?? [];
    const query = current.stem?.slice(0, 200) ?? '';
    const params = new URLSearchParams({ q: query, k: '1' });
    if (loIds.length) {
      params.set('lo', loIds.join(','));
    }

    const controller = new AbortController();
    let cancelled = false;
    setRagLoading(true);
    setRagError(null);

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const top = data?.results?.[0];
        setRagCache((prev) => ({
          ...prev,
          [itemId]: top
            ? {
                itemId: top.item_id ?? itemId,
                loIds: top.lo_ids ?? [],
                text: top.text ?? '',
                score: Number(top.score ?? 0),
                similarity: Number(top.similarity ?? 0),
                decay: Number(top.decay ?? 0)
              }
            : null
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setRagError(err instanceof Error ? err.message : 'Temporal search failed');
      })
      .finally(() => {
        if (!cancelled) {
          setRagLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [current, ragCache]);

  const submitAttempt = useCallback(
    (choice: (typeof letters)[number]) => {
      if (!current || feedback.correctShown || busy) return;
      const correct = choice === current.key;
      const durationMs = Date.now() - questionStart;
      setFeedback({ selected: choice, correctShown: true });
      setError(null);
      setIsSaving(true);

      let revertState: LearnerState | null = null;
      let optimisticState: LearnerState | null = null;

      optimisticLearnerStateUpdate((draft) => {
        revertState = draft;
        const next = updateLearnerStateAfterAttempt(draft, current, correct);
        optimisticState = next;
        return next;
      })
        .then((snapshot) => {
          revertState = snapshot;
          startTransition(() => {
            (async () => {
              try {
                const enginePayload = whySignals
                  ? {
                      notes: whyNext,
                      selector: {
                        ...(whySignals.loIds.length ? { lo_ids: whySignals.loIds } : {}),
                        item_id: current.id,
                        info: Number.isFinite(whySignals.info) ? whySignals.info : undefined,
                        blueprint_multiplier: Number.isFinite(whySignals.blueprintMult) ? whySignals.blueprintMult : undefined,
                        exposure_multiplier: Number.isFinite(whySignals.exposureMult) ? whySignals.exposureMult : undefined,
                        fatigue_scalar: Number.isFinite(whySignals.fatigue) ? whySignals.fatigue : undefined,
                        median_seconds: Number.isFinite(whySignals.medianSec) ? whySignals.medianSec : undefined,
                        theta_hat: Number.isFinite(whySignals.thetaHat) ? whySignals.thetaHat : undefined,
                        se: Number.isFinite(whySignals.se) ? whySignals.se : undefined,
                        mastery_probability: Number.isFinite(whySignals.masteryProb) ? whySignals.masteryProb : undefined,
                        reason: whyNext
                      }
                    }
                  : whyNext
                    ? {
                        notes: whyNext
                      }
                    : undefined;
                const result = await submitStudyAttempt({
                  learnerId,
                  sessionId,
                  itemId: current.id,
                  loIds: current.los ?? [],
                  difficulty: current.difficulty,
                  choice,
                  correct,
                  durationMs,
                  openedEvidence: evidenceOpen,
                  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
                  engine: enginePayload
                });
                if (result?.learnerState) {
                  onLearnerStateChange(result.learnerState);
                } else if (optimisticState) {
                  onLearnerStateChange(optimisticState);
                }
              } catch (err) {
                console.error('submitStudyAttempt failed', err);
                if (revertState) {
                  onLearnerStateChange(revertState);
                }
                setError('We could not sync your progress. Retrying shortly…');
                setFeedback((prev) => ({ ...prev, correctShown: true }));
              } finally {
                setIsSaving(false);
                void invalidateLearnerState();
              }
            })();
          });
        })
        .catch((err) => {
          console.error('Failed to optimistically update learner state', err);
          setIsSaving(false);
          setFeedback({ correctShown: false });
          setError('Something went wrong updating your progress. Try again.');
        });
    },
    [busy, current, evidenceOpen, feedback.correctShown, invalidateLearnerState, learnerId, onLearnerStateChange, optimisticLearnerStateUpdate, questionStart, sessionId, whySignals, whyNext]
  );

  const handleNext = useCallback(() => {
    if (!items.length || busy) return;
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setShowWhy(false);
    setQuestionStart(Date.now());
    setIndex((prev) => (prev + 1) % items.length);
  }, [busy, items.length]);

  const handlePrev = useCallback(() => {
    if (!items.length || busy) return;
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setShowWhy(false);
    setQuestionStart(Date.now());
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [busy, items.length]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!current) return;
      if (busy) {
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
          submitAttempt(choice);
        }
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [busy, current, handleNext, handlePrev, letters, showWhy, submitAttempt]);

  useEffect(() => {
    if (!showWhy) return;

    const clickListener = (event: MouseEvent) => {
      if (!whyPopoverRef.current || whyPopoverRef.current.contains(event.target as Node)) {
        return;
      }
      setShowWhy(false);
    };

    document.addEventListener('mousedown', clickListener);
    return () => {
      document.removeEventListener('mousedown', clickListener);
    };
  }, [showWhy]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>
          No study items available. Add <code>*.item.json</code> under <code>content/banks/&lt;module&gt;</code> or set `SCOPE_DIRS`.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6" aria-busy={busy} data-learner-id={learnerId}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Practice</h1>
          <p className="text-sm text-gray-600">Keyboard: 1–5 answer · N/P arrows for navigation · E toggle evidence</p>
          <p className="text-xs text-gray-500">Progress synced {lastSyncLabel}</p>
        </div>
        <div className="relative">
          <button
            ref={whyButtonRef}
            onClick={() => setShowWhy((v) => !v)}
            className="flex max-w-xs flex-col gap-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-800 shadow transition hover:bg-gray-50"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Why this next</span>
            {whySignals ? (
              <WhyThisNextPill
                signals={whySignals}
                title={ttmTitle}
                onClick={() => setShowWhy((v) => !v)}
              />
            ) : (
              <span className="line-clamp-2 text-sm">{whyNext}</span>
            )}
          </button>
          {showWhy && (
            <div
              ref={whyPopoverRef}
              className="absolute right-0 z-10 mt-2 w-96 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-xl"
            >
              <h3 className="text-sm font-semibold">Focus rationale</h3>
              <p className="text-sm">{whyNext}</p>
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                <p className="font-semibold uppercase tracking-wide text-[10px]">Temporal search signal</p>
                {ragLoading ? (
                  <p className="mt-1 text-indigo-700">Looking up supporting evidence…</p>
                ) : ragError ? (
                  <p className="mt-1 text-rose-600">{ragError}</p>
                ) : ragResult ? (
                  ragResult.text ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-indigo-900">{ragResult.text}</p>
                      <p className="text-indigo-600">
                        Score {ragResult.score.toFixed(3)} · similarity {ragResult.similarity.toFixed(3)} · decay {ragResult.decay.toFixed(3)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-indigo-700">No matching evidence surfaced yet for this prompt.</p>
                  )
                ) : (
                  <p className="mt-1 text-indigo-700">No matching evidence surfaced yet for this prompt.</p>
                )}
              </div>
              <p className="text-xs text-gray-500">Keyboard: E toggles evidence.</p>
              <button
                type="button"
                className="mt-2 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  setShowWhy(false);
                }}
              >
                Close
              </button>
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
          <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
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
              return (
                <button
                  key={letter}
                  onClick={() => submitAttempt(letter)}
                  disabled={feedback.correctShown || busy}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:translate-y-0.5 ${
                    isSelected
                      ? isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  } ${busy ? 'opacity-70' : ''}`}
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
              <button onClick={handlePrev} className="btn-ghost" disabled={busy}>
                ← Prev
              </button>
              <button onClick={handleNext} className="btn-ghost" disabled={busy}>
                Next →
              </button>
            </div>
            <div className="flex items-center gap-3">
              {(isSaving || isPending) && (
                <span className="text-xs text-emerald-700 animate-pulse">Saving attempt…</span>
              )}
              {feedback.correctShown && current && (
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
              disabled={busy}
            >
              {evidenceOpen ? 'Close (E)' : 'View (E)'}
            </button>
          </header>
          {evidenceOpen ? (
            <div className="space-y-2 text-sm text-gray-800">
              <p className="font-medium">{current.evidence?.citation ?? 'Evidence citation unavailable yet.'}</p>
              {current.evidence?.cropPath && (
                <img
                  src={current.evidence?.dataUri ?? current.evidence.cropPath}
                  alt="Evidence crop"
                  className="w-full rounded-lg border border-gray-200 bg-white object-contain"
                />
              )}
            </div>
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
