'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StudyItem } from '../lib/getItems';
import { RadioGroup, RadioGroupItem } from './ui/radix/radio-group';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/radix/tooltip';
import { VisuallyHidden } from './ui/radix/visually-hidden';

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

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!current) return;
      const key = event.key;
      if (key === 'ArrowRight' || key === 'n' || key === 'N') {
        event.preventDefault();
        next();
      } else if (key === 'ArrowLeft' || key === 'p' || key === 'P') {
        event.preventDefault();
        prev();
      } else if (/^[1-5]$/.test(key)) {
        event.preventDefault();
        const idx = Number(key) - 1;
        const choice = letters[idx];
        if (choice) select(choice);
      } else if ((key === 's' || key === 'S') && !submitted) {
        event.preventDefault();
        setSubmitted(true);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [current, letters, next, prev, select, submitted]);

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    for (const item of form) {
      if (answers[item.id] === item.key) correct += 1;
    }
    return { correct, total: form.length };
  }, [submitted, form, answers]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Exam Mode</h1>
            <p className="text-sm text-slate-500">Evidence locked · Feedback on submit</p>
            <p className="text-xs text-slate-400">Keyboard: 1-5 answer · N/P to navigate · S submit</p>
          </div>
          {!submitted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setSubmitted(true)} className="bg-slate-900 hover:bg-slate-800">
                  Submit
                </Button>
              </TooltipTrigger>
              <TooltipContent>Press S to submit without leaving the keyboard.</TooltipContent>
            </Tooltip>
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

          <RadioGroup
            value={answers[current.id] ?? undefined}
            onValueChange={(value) => select(value as Choice)}
            aria-label="Exam answer choices"
          >
            {letters.map((letter, idx) => {
              const choice = current.choices[letter];
              if (!choice) return null;
              const isSelected = answers[current.id] === letter;
              const choiceId = `exam-${current.id}-${letter}`;
              const baseClasses = 'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none';
              const uncheckedClasses = 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300';
              const selectedClasses = 'border-slate-400 bg-white text-slate-900';
              return (
                <div key={letter} className="relative">
                  <RadioGroupItem
                    id={choiceId}
                    value={letter}
                    className="peer sr-only"
                    disabled={submitted}
                    aria-label={`Answer ${letter}`}
                  />
                  <label
                    htmlFor={choiceId}
                    className={cn(
                      baseClasses,
                      isSelected ? selectedClasses : uncheckedClasses,
                      submitted && !isSelected ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2'
                    )}
                    aria-disabled={submitted}
                  >
                    <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{idx + 1}</span>
                    <p className="font-medium">
                      {letter}. {choice}
                    </p>
                  </label>
                </div>
              );
            })}
          </RadioGroup>

          {submitted && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Correct answer: <span className="font-semibold">{current.key}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={prev}>
                ← Prev
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={next}>
                Next →
              </Button>
            </div>
            <span className="text-slate-400">Evidence locked</span>
          </div>
          <VisuallyHidden>
            <span>Use the S key to submit when ready. Answers lock after submission.</span>
          </VisuallyHidden>
        </article>
      </div>
    </TooltipProvider>
  );
}

