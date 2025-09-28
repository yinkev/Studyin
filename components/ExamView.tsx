'use client';

import { useCallback, useMemo, useState } from 'react';
import type { StudyItem } from '../lib/getItems';

interface ExamViewProps {
  items: StudyItem[];
  length?: number;
}

type Choice = 'A' | 'B' | 'C' | 'D' | 'E';

export function ExamView({ items, length = 10 }: ExamViewProps) {
  const form = useMemo(() => items.slice(0, Math.min(length, items.length)), [items, length]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const current = form[index];
  const letters = ['A', 'B', 'C', 'D', 'E'] as const;

  const select = useCallback(
    (choice: Choice) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [current.id]: choice }));
    },
    [current?.id, submitted]
  );

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, form.length - 1)), [form.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    for (const item of form) {
      if (answers[item.id] === item.key) correct += 1;
    }
    return { correct, total: form.length };
  }, [submitted, form, answers]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Exam Mode</h1>
          <p className="text-sm text-slate-500">Evidence locked · Feedback on submit</p>
        </div>
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Submit
          </button>
        ) : (
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Score: {score?.correct}/{score?.total}
          </div>
        )}
      </header>

      <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>#{index + 1} of {form.length}</span>
          <span className="font-mono text-xs text-slate-400">{current.id}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{current.stem}</h2>

        <div className="space-y-3">
          {letters.map((letter, idx) => {
            const choice = current.choices[letter];
            if (!choice) return null;
            const selected = answers[current.id] === letter;
            const klass = selected ? 'border-slate-400 bg-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300';
            const disabled = submitted; // no changes after submit
            return (
              <button
                key={letter}
                disabled={disabled}
                onClick={() => select(letter)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${klass}`}
              >
                <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{idx + 1}</span>
                <p className="font-medium">{letter}. {choice}</p>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Correct answer: <span className="font-semibold">{current.key}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
          <div className="space-x-2">
            <button onClick={prev} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">← Prev</button>
            <button onClick={next} className="rounded border border-slate-200 px-3 py-1 hover:border-slate-300">Next →</button>
          </div>
          <span className="text-slate-400">Evidence locked</span>
        </div>
      </article>
    </div>
  );
}

