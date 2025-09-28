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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Exam Mode</h1>
          <p className="text-sm text-slate-300/90">
            Evidence locked · Feedback on submit
            {blueprintId ? ` · Blueprint ${blueprintId}` : ''}
          </p>
        </div>
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
            Submit
          </button>
        ) : (
          <div className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
            Score: {score?.correct}/{score?.total}
          </div>
        )}
      </header>

      <article className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
        <div className="flex items-center justify-between text-sm text-slate-300/80">
          <span>#{index + 1} of {form.length}</span>
          <span className="font-mono text-xs text-slate-400">{current.id}</span>
        </div>
        <h2 className="text-lg font-semibold text-white">{current.stem}</h2>

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
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${klass}`}
              >
                <span className="mt-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">{idx + 1}</span>
                <p className="font-medium text-white/95">{letter}. {choice}</p>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Correct answer: <span className="font-semibold text-emerald-100">{current.key}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-slate-300/80">
          <div className="space-x-2">
            <button onClick={prev} className="rounded-md border border-white/15 bg-white/5 px-3 py-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">← Prev</button>
            <button onClick={next} className="rounded-md border border-white/15 bg-white/5 px-3 py-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">Next →</button>
          </div>
          <span className="text-slate-400">Evidence locked</span>
        </div>
      </article>
    </div>
  );
}
