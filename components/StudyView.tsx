'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { AnalyticsSummary, StudyItem } from '../lib/getItems';
import type { LearnerState } from '../lib/server/study-state';
import type { CandidateItem } from '../lib/study-engine';
import { buildWhyThisNext, difficultyToBeta, scoreCandidates } from '../lib/study-engine';
import { masteryProbability } from '../scripts/lib/rasch.mjs';
import { submitStudyAttempt } from '../app/study/actions';

interface StudyViewProps {
  items: StudyItem[];
  analytics: AnalyticsSummary | null;
  learnerId: string;
  learnerState: LearnerState;
  onLearnerStateChange: (state: LearnerState) => void;
}

interface ChoiceFeedback {
  selected?: 'A' | 'B' | 'C' | 'D' | 'E';
  correctShown: boolean;
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

export function StudyView({ items, analytics, learnerId, learnerState, onLearnerStateChange }: StudyViewProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<ChoiceFeedback>({ correctShown: false });
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [questionStart, setQuestionStart] = useState(() => Date.now());

  const current = items[index];

  const whyNext = useMemo(() => {
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
      return fallbackWhyThisNext(current.id, loIds, analytics);
    }
    const masteryProb = masteryProbability(thetaHat, se);
    return buildWhyThisNext(score, { thetaHat, se, masteryProb });
  }, [analytics, current, index, learnerState]);

  const letters = ANSWER_LETTERS;
  const selected = feedback.selected;
  const isCorrect = selected && current && selected === current.key;

  const submitAttempt = useCallback(
    (choice: (typeof letters)[number]) => {
      if (!current || feedback.correctShown) return;
      const durationMs = Date.now() - questionStart;
      setFeedback({ selected: choice, correctShown: true });
      startTransition(async () => {
        try {
          const result = await submitStudyAttempt({
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
          });
          if (result?.learnerState) {
            onLearnerStateChange(result.learnerState);
          }
        } catch (error) {
          console.error('submitStudyAttempt failed', error);
        }
      });
    },
    [current, evidenceOpen, feedback.correctShown, learnerId, questionStart, sessionId, onLearnerStateChange]
  );

  const handleNext = useCallback(() => {
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setShowWhy(false);
    setQuestionStart(Date.now());
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setFeedback({ correctShown: false });
    setEvidenceOpen(false);
    setShowWhy(false);
    setQuestionStart(Date.now());
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
        const choice = letters[idx];
        submitAttempt(choice);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [current, handleNext, handlePrev, letters, submitAttempt]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>No study items available. Add <code>*.item.json</code> under <code>content/banks/&lt;module&gt;</code> or set `SCOPE_DIRS`.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Practice</h1>
          <p className="text-sm text-gray-600">Keyboard: 1–5 answer · N/P arrows for navigation · E toggle evidence</p>
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
                  disabled={feedback.correctShown || isPending}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:translate-y-0.5 ${
                    isSelected
                      ? isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  } ${isPending ? 'opacity-70' : ''}`}
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
              <button onClick={handlePrev} className="btn-ghost" disabled={isPending}>
                ← Prev
              </button>
              <button onClick={handleNext} className="btn-ghost" disabled={isPending}>
                Next →
              </button>
            </div>
            {feedback.correctShown && current && (
              <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isCorrect ? 'Correct' : `Correct answer: ${current.key}`}
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4 duo-card p-5">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Evidence</h3>
            <button
              onClick={() => setEvidenceOpen((v) => !v)}
              className="text-[10px] uppercase tracking-wide text-gray-600 hover:text-gray-800"
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
            <p className="text-sm text-gray-600">Evidence is locked in exams—toggle above during study.</p>
          )}
        </aside>
      </article>
    </div>
  );
}
