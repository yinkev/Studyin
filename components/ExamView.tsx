'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StudyItem } from '../lib/getItems';

interface BlueprintMeterTarget {
  loId: string;
  label: string;
  target: number;
  weight: number;
}

interface ExamBlueprint {
  id: string;
  targets: BlueprintMeterTarget[];
}

interface ExamViewProps {
  items: StudyItem[];
  length?: number;
  blueprint?: ExamBlueprint;
  secondsPerItem?: number;
}

type Choice = 'A' | 'B' | 'C' | 'D' | 'E';

export function ExamView({ items, length = 10, blueprint, secondsPerItem = 90 }: ExamViewProps) {
  const form = useMemo(() => items.slice(0, Math.min(length, items.length)), [items, length]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice | undefined>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  const current = form[index] ?? null;
  const letters = ['A', 'B', 'C', 'D', 'E'] as const;

  const totalDuration = useMemo(() => {
    if (!form.length) return 0;
    return Math.max(0, form.length * secondsPerItem);
  }, [form.length, secondsPerItem]);
  const [remaining, setRemaining] = useState(totalDuration);

  useEffect(() => {
    setRemaining(totalDuration);
    setTimeExpired(false);
  }, [totalDuration]);

  useEffect(() => {
    if (submitted || totalDuration <= 0) return;
    const interval = window.setInterval(() => {
      setRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [submitted, totalDuration]);

  useEffect(() => {
    if (!submitted && totalDuration > 0 && remaining === 0) {
      setTimeExpired(true);
      setSubmitted(true);
    }
  }, [remaining, submitted, totalDuration]);

  const currentId = current?.id;

  const select = useCallback(
    (choice: Choice) => {
      if (submitted || !currentId) return;
      setAnswers((prev) => ({ ...prev, [currentId]: choice }));
    },
    [currentId, submitted]
  );

  const next = useCallback(() => {
    if (!form.length) return;
    setIndex((i) => Math.min(i + 1, Math.max(form.length - 1, 0)));
  }, [form.length]);
  const prev = useCallback(() => {
    if (!form.length) return;
    setIndex((i) => Math.max(i - 1, 0));
  }, [form.length]);

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    for (const item of form) {
      if (answers[item.id] === item.key) correct += 1;
    }
    return { correct, total: form.length };
  }, [submitted, form, answers]);

  const answeredCount = useMemo(
    () => form.filter((item) => answers[item.id] !== undefined).length,
    [answers, form]
  );

  const servedCount = useMemo(() => {
    if (!form.length) return 0;
    return submitted ? form.length : Math.min(index + 1, form.length);
  }, [form.length, index, submitted]);

  const coverageByLo = useMemo(() => {
    if (!blueprint) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const target of blueprint.targets) {
      counts.set(target.loId, 0);
    }
    const served = form.slice(0, servedCount);
    for (const item of served) {
      for (const lo of item.los) {
        if (counts.has(lo)) {
          counts.set(lo, (counts.get(lo) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [blueprint, form, servedCount]);

  const formattedTime = useMemo(() => {
    const safeRemaining = Math.max(0, remaining);
    const minutes = Math.floor(safeRemaining / 60);
    const seconds = safeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remaining]);

  if (!form.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No items available for this exam form.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Exam Mode</h1>
          <p className="text-sm text-slate-500">Evidence locked · Feedback on submit</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          {totalDuration > 0 && (
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
                remaining <= totalDuration * 0.1
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className="font-mono text-base leading-none">{formattedTime}</span>
              <span className="text-xs uppercase tracking-wide text-slate-400">Remaining</span>
            </div>
          )}
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Submit
            </button>
          ) : (
            <div className="flex flex-col items-start gap-1 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:flex-row sm:items-center">
              <span>
                Score: {score?.correct}/{score?.total}
              </span>
              {timeExpired && (
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-600 sm:ml-2">
                  Auto-submitted
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {submitted && timeExpired && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Time expired — your answers were saved and submitted automatically.
        </div>
      )}

      {blueprint && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Blueprint coverage</p>
              <p className="text-xs text-slate-400">{blueprint.id}</p>
            </div>
            <div className="text-xs text-slate-500">
              Served {servedCount}/{form.length} · Answered {answeredCount}
            </div>
          </div>
          <div className="space-y-3">
            {blueprint.targets.map((target) => {
              const delivered = coverageByLo.get(target.loId) ?? 0;
              const progress = target.target ? Math.min(delivered / target.target, 1) : 0;
              const percent = Math.round(progress * 100);
              return (
                <div key={target.loId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{target.label}</span>
                    <span>
                      {delivered}/{target.target}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            #{index + 1} of {form.length}
          </span>
          <span className="font-mono text-xs text-slate-400">{current?.id}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{current?.stem}</h2>

        <div className="space-y-3">
          {current &&
            letters.map((letter, idx) => {
              const choice = current.choices[letter];
              if (!choice) return null;
              const selected = answers[current.id] === letter;
              const klass = selected
                ? 'border-slate-400 bg-white'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300';
              const disabled = submitted; // no changes after submit
              return (
                <button
                  key={letter}
                  disabled={disabled}
                  onClick={() => select(letter)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${klass}`}
                >
                  <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {idx + 1}
                  </span>
                  <p className="font-medium">
                    {letter}. {choice}
                  </p>
                </button>
              );
            })}
        </div>

        {submitted && current && (
          <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Correct answer: <span className="font-semibold">{current.key}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
          <div className="space-x-2">
            <button onClick={prev} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">
              ← Prev
            </button>
            <button onClick={next} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">
              Next →
            </button>
          </div>
          <span className="text-slate-400">Evidence locked</span>
        </div>
      </article>
    </div>
  );
}
