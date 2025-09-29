'use client';

import { useCallback, useMemo, useState } from 'react';

interface ExamViewProps {
  items: ExamItem[];
  length?: number;
  blueprintId?: string;
}

type Choice = 'A' | 'B' | 'C' | 'D' | 'E';

interface ExamItem {
  id: string;
  stem: string;
  choices: Record<Choice, string>;
  key: Choice;
  los: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export function ExamView({ items, length = 10, blueprintId }: ExamViewProps) {
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
    <div className="space-y-6 px-4 py-10 max-w-6xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Exam Mode</h1>
          <p className="text-sm text-gray-600">
            Evidence locked · Deferred feedback
            {blueprintId ? ` · Blueprint ${blueprintId}` : ''}
          </p>
        </div>
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} className="duo-button px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/80">
            Submit
          </button>
        ) : (
          <div className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Score: {score?.correct}/{score?.total}
          </div>
        )}
      </header>

      <article className="space-y-4 duo-card p-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>#{index + 1} of {form.length}</span>
          <span className="font-mono text-xs text-gray-500">{current.id}</span>
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">{current.stem}</h2>

        <div className="space-y-3">
          {letters.map((letter, idx) => {
            const choice = current.choices[letter];
            if (!choice) return null;
            const selected = answers[current.id] === letter;
            const klass = selected
              ? 'border-white/30 bg-white/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/7';
            const disabled = submitted; // no changes after submit
            return (
              <button
                key={letter}
                disabled={disabled}
                onClick={() => select(letter)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-gray-900 transition hover:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${klass}`}
              >
                <span className="mt-1 okc-pill-ghost">{idx + 1}</span>
                <p className="font-medium">{letter}. {choice}</p>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Correct answer: <span className="font-semibold text-emerald-900">{current.key}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-gray-600">
          <div className="space-x-2">
            <button onClick={prev} className="rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">← Prev</button>
            <button onClick={next} className="rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Next →</button>
          </div>
          <span className="text-gray-500">Evidence locked</span>
        </div>
      </article>
    </div>
  );
}
