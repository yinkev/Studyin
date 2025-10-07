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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-text-high">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-high">Exam Mode</h1>
          <p className="text-sm text-text-med">
            Evidence locked · Deferred feedback
            {blueprintId ? ` · Blueprint ${blueprintId}` : ''}
          </p>
        </div>
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            className="rounded-full bg-semantic-danger px-4 py-2 text-sm font-bold text-text-high transition hover:bg-semantic-danger/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger/60"
          >
            Submit
          </button>
        ) : (
          <div className="rounded-full border border-semantic-success/30 bg-semantic-success/10 px-4 py-2 text-sm font-semibold text-semantic-success">
            Score: {score?.correct}/{score?.total}
          </div>
        )}
      </header>

      <article className="space-y-4 rounded-2xl border border-text-low/15 bg-surface-bg0/70 p-6">
        <div className="flex items-center justify-between text-sm text-text-med">
          <span>#{index + 1} of {form.length}</span>
          <span className="font-mono text-xs text-text-low">{current.id}</span>
        </div>
        <h2 className="text-lg font-extrabold text-text-high">{current.stem}</h2>

        <div className="space-y-3">
          {letters.map((letter, idx) => {
            const choice = current.choices[letter];
            if (!choice) return null;
            const selected = answers[current.id] === letter;
            const klass = selected
              ? 'border-brand-light/60 bg-brand-light/10'
              : 'border-text-low/10 bg-surface-bg1/60 hover:border-brand-light hover:bg-surface-bg1/80';
            const disabled = submitted; // no changes after submit
            return (
              <button
                key={letter}
                disabled={disabled}
                onClick={() => select(letter)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-text-high transition hover:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${klass}`}
              >
                <span className="mt-1 okc-pill-ghost">{idx + 1}</span>
                <p className="font-medium">
                  {letter}. {choice}
                </p>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 rounded border border-semantic-success/30 bg-semantic-success/10 p-3 text-sm text-semantic-success">
            Correct answer:{' '}
            <span className="font-semibold text-semantic-success">{current.key}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-text-med">
          <div className="space-x-2">
            <button
              onClick={prev}
              className="rounded-md border border-text-low/15 bg-surface-bg0 px-3 py-1 hover:bg-surface-bg0/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
            >
              ← Prev
            </button>
            <button
              onClick={next}
              className="rounded-md border border-text-low/15 bg-surface-bg0 px-3 py-1 hover:bg-surface-bg0/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
            >
              Next →
            </button>
          </div>
          <span className="text-text-low">Evidence locked</span>
        </div>
      </article>
    </div>
  );
}
