'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BlueprintConfig } from '../lib/getBlueprint';
import type { StudyItem } from '../lib/getItems';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/radix/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/radix/tooltip';
import { VisuallyHidden } from './ui/radix/visually-hidden';

interface ExamViewProps {
  items: StudyItem[];
  length?: number;
  blueprint?: BlueprintConfig | null;
}

type Choice = 'A' | 'B' | 'C' | 'D' | 'E';

const EXAM_DURATION_MINUTES = 30;
const EXAM_DURATION_MS = EXAM_DURATION_MINUTES * 60 * 1000;

function formatClock(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function ExamView({ items, length = 10, blueprint }: ExamViewProps) {
  const form = useMemo(() => items.slice(0, Math.min(length, items.length)), [items, length]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice | undefined>>({});
  const [submitted, setSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [remainingMs, setRemainingMs] = useState(EXAM_DURATION_MS);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef<boolean>(false);

  const current = form[index];
  const letters = ['A', 'B', 'C', 'D', 'E'] as const;

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    submittedRef.current = true;
    setElapsedMs(Date.now() - startedAtRef.current);
    setSubmitted(true);
    setSummaryOpen(true);
  }, []);

  useEffect(() => {
    startedAtRef.current = Date.now();
    setRemainingMs(EXAM_DURATION_MS);
    timerRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0 && !submittedRef.current) {
          handleSubmit();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [handleSubmit]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  const select = useCallback(
    (choice: Choice) => {
      if (submitted || !current) return;
      setAnswers((prev) => ({ ...prev, [current.id]: choice }));
    },
    [current, submitted]
  );

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, Math.max(form.length - 1, 0))), [form.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!current) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowright' || key === 'n') {
        event.preventDefault();
        next();
      } else if (key === 'arrowleft' || key === 'p') {
        event.preventDefault();
        prev();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSubmit();
      } else if (/^[1-5]$/.test(event.key)) {
        const idx = Number(event.key) - 1;
        const choice = letters[idx];
        if (choice) {
          event.preventDefault();
          select(choice);
        }
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [current, handleSubmit, next, prev, select]);

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    for (const item of form) {
      if (answers[item.id] === item.key) correct += 1;
    }
    const total = form.length || 1;
    return {
      correct,
      total,
      percent: Number(((correct / total) * 100).toFixed(1))
    };
  }, [submitted, form, answers]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value): value is Choice => Boolean(value)).length,
    [answers]
  );

  const blueprintCoverage = useMemo(() => {
    if (!blueprint) return [];
    const counts = new Map<string, number>();
    form.forEach((item) => {
      item.los.forEach((lo) => {
        counts.set(lo, (counts.get(lo) ?? 0) + 1);
      });
    });
    return Object.entries(blueprint.weights).map(([loId, weight]) => {
      const expected = weight * form.length;
      const actual = counts.get(loId) ?? 0;
      const fulfillment = expected > 0 ? Math.min(1, actual / expected) : 1;
      return {
        lo_id: loId,
        expected,
        actual,
        fulfillment
      };
    });
  }, [blueprint, form]);

  const loBreakdown = useMemo(() => {
    if (!submitted) return [];
    const map = new Map<string, { correct: number; total: number }>();
    form.forEach((item) => {
      item.los.forEach((lo) => {
        const entry = map.get(lo) ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (answers[item.id] === item.key) {
          entry.correct += 1;
        }
        map.set(lo, entry);
      });
    });
    return Array.from(map.entries())
      .map(([loId, { correct, total }]) => ({
        lo_id: loId,
        accuracy: total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0,
        total
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [answers, form, submitted]);

  const incorrectItems = useMemo(() => {
    if (!submitted) return [];
    return form.filter((item) => answers[item.id] && answers[item.id] !== item.key);
  }, [answers, form, submitted]);

  const formattedRemaining = useMemo(() => formatClock(remainingMs), [remainingMs]);
  const elapsedClock = useMemo(
    () => formatClock(elapsedMs || EXAM_DURATION_MS - remainingMs),
    [elapsedMs, remainingMs]
  );

  if (form.length === 0 || !current) {
    return <p className="text-slate-600">No exam items available. Add content under <code>content/banks/upper-limb-oms1</code>.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Exam Mode</h1>
          <p className="text-sm text-slate-500">
            Evidence stays locked until you submit. Keyboard: 1-5 to answer · N/P arrows to navigate · Ctrl/⌘+Enter to submit.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span aria-live="polite" aria-atomic="true" className={`font-semibold ${remainingMs <= 60_000 ? 'text-rose-600' : 'text-slate-700'}`}>
              Time left: {formattedRemaining}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Blueprint coverage
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left text-xs text-slate-600">
                {blueprint
                  ? 'Compare blueprint targets to the items you have seen so far.'
                  : 'Blueprint weights unavailable for this module.'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" aria-live="polite">
            {answeredCount}/{form.length} answered
          </div>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Submit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {score ? (
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Score: {score.correct}/{score.total} ({score.percent}%)
                </div>
              ) : null}
              <button
                onClick={() => setSummaryOpen(true)}
                className="rounded border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                View score summary
              </button>
            </div>
          )}
        </div>
      </header>

      {blueprint && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between text-sm">
            <h2 className="font-semibold text-slate-900">Blueprint meter</h2>
            <span className="text-xs text-slate-500">Targets scaled to {form.length} items</span>
          </header>
          <ul className="mt-3 space-y-3">
            {blueprintCoverage.map((entry) => {
              const expectedLabel = entry.expected.toFixed(1);
              const fulfillmentPercent = Math.round(entry.fulfillment * 100);
              return (
                <li key={entry.lo_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{entry.lo_id}</span>
                    <span>
                      {entry.actual} / {expectedLabel}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100" aria-hidden="true">
                    <div
                      className={`h-2 rounded-full ${fulfillmentPercent >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${Math.min(100, fulfillmentPercent)}%` }}
                    />
                  </div>
                  <VisuallyHidden>
                    {`Blueprint coverage for ${entry.lo_id}: ${entry.actual} of ${expectedLabel} items (${Math.min(100, fulfillmentPercent)}%).`}
                  </VisuallyHidden>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Question {index + 1} of {form.length}
          </span>
          <span className="font-mono text-xs text-slate-400">{current.id}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{current.stem}</h2>

        <div className="space-y-3">
          {letters.map((letter, idx) => {
            const choice = current.choices[letter];
            if (!choice) return null;
            const selected = answers[current.id] === letter;
            const correctSelection = submitted && letter === current.key;
            const incorrectSelection = submitted && selected && letter !== current.key;
            const klass = submitted
              ? correctSelection
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                : incorrectSelection
                  ? 'border-rose-400 bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-white text-slate-700'
              : selected
                ? 'border-slate-400 bg-white text-slate-900'
                : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300';
            return (
              <button
                key={letter}
                disabled={submitted}
                onClick={() => select(letter)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${klass}`}
              >
                <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{idx + 1}</span>
                <p className="font-medium">
                  {letter}. {choice}
                </p>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Correct answer: <span className="font-semibold">{current.key}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm text-slate-500">
          <div className="space-x-2">
            <button
              onClick={prev}
              className="rounded border border-slate-200 px-3 py-1 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ← Prev
            </button>
            <button
              onClick={next}
              className="rounded border border-slate-200 px-3 py-1 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Next →
            </button>
          </div>
          <span className="text-slate-400">Evidence locked during attempt</span>
        </div>
      </article>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exam summary</DialogTitle>
            <DialogDescription>
              {submitted && score
                ? `Score ${score.correct}/${score.total} (${score.percent}% accuracy).`
                : 'Submit the exam to view analytics and review guidance.'}
            </DialogDescription>
          </DialogHeader>
          {submitted && score ? (
            <div className="space-y-4">
              <section className="grid gap-4 rounded border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</h3>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {score.correct}/{score.total} · {score.percent}%
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Elapsed time</h3>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{elapsedClock}</p>
                  <p className="text-xs text-slate-500">Timer auto-submits at {EXAM_DURATION_MINUTES} minutes.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incorrect items</h3>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{incorrectItems.length}</p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">Lowest-accuracy LOs</h3>
                {loBreakdown.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">Answer more items to unlock LO feedback.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {loBreakdown.slice(0, 5).map((entry) => (
                      <li
                        key={entry.lo_id}
                        className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">{entry.lo_id}</span>
                        <span className="text-slate-600">{entry.accuracy}% across {entry.total} items</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {incorrectItems.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Review queue</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {incorrectItems.map((item) => (
                      <li key={item.id} className="rounded border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{item.id}</span>
                          <span className="text-xs uppercase tracking-wide text-slate-500">Correct: {item.key}</span>
                        </div>
                        <p className="mt-1 text-slate-600">{item.stem}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Complete the exam to unlock analytics and review guidance.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
