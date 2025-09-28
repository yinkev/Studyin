'use client';

import { useMemo, useState } from 'react';
import type { LessonDoc } from '../lib/getLessons';
import { Card, CardContent, CardHeader, CardFooter } from './ui/card';
import { Button } from './ui/button';

interface LessonsViewProps {
  lessons: LessonDoc[];
  onPractice?: (loId: string) => void;
}

export function LessonsView({ lessons, onPractice }: LessonsViewProps) {
  const [idx, setIdx] = useState(0);
  const current = lessons[idx];
  const beats = current?.animation_timeline ?? [];
  const [beatIndex, setBeatIndex] = useState(0);

  const nav = useMemo(
    () => ({
      nextLesson: () => setIdx((i) => (i + 1) % Math.max(lessons.length, 1)),
      prevLesson: () => setIdx((i) => (i - 1 + Math.max(lessons.length, 1)) % Math.max(lessons.length, 1)),
      nextBeat: () => setBeatIndex((b) => Math.min(b + 1, Math.max(beats.length - 1, 0))),
      prevBeat: () => setBeatIndex((b) => Math.max(b - 1, 0))
    }),
    [beats.length, lessons.length]
  );

  if (!lessons.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-200">
        <p>No lessons found. Place files under <code>content/lessons/&lt;module&gt;/*.lesson.json</code>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lesson blueprint</p>
          <h2 className="text-xl font-semibold text-white">{current.title}</h2>
          <p className="text-sm text-slate-300">LO: {current.lo_id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={nav.prevLesson} aria-label="Previous lesson" className="border-white/30 text-slate-100 hover:bg-white/10">
            Prev
          </Button>
          <Button variant="outline" onClick={nav.nextLesson} aria-label="Next lesson" className="border-white/30 text-slate-100 hover:bg-white/10">
            Next
          </Button>
          {onPractice && (
            <Button
              onClick={() => onPractice(current.lo_id)}
              aria-label="Practice this learning objective"
              className="bg-white text-slate-900 hover:bg-slate-200"
            >
              Practice this LO
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>High-yield</CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-100/90">
            {(current.high_yield ?? []).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {current.pitfalls?.length ? (
        <Card>
          <CardHeader>Pitfalls</CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-100/80">
              {current.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex items-center justify-between text-white">
          <span>Timeline</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={nav.prevBeat} disabled={beatIndex === 0} className="border-white/30 text-slate-100 hover:bg-white/10">
              ◀
            </Button>
            <span className="text-xs text-slate-400">
              Step {beats.length ? beatIndex + 1 : 0} / {beats.length}
            </span>
            <Button
              variant="outline"
              onClick={nav.nextBeat}
              disabled={beatIndex >= Math.max(beats.length - 1, 0)}
              className="border-white/30 text-slate-100 hover:bg-white/10"
            >
              ▶
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {beats.length ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-100/90">
                <span className="font-semibold">Narration: </span>
                {beats[beatIndex]?.narration ?? '—'}
              </p>
              <p className="text-sm text-slate-300/90">
                <span className="font-semibold text-slate-100">Visual: </span>
                {beats[beatIndex]?.visual ?? '—'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-300">No timeline beats defined.</p>
          )}
        </CardContent>
        <CardFooter>Use Left/Right keys to step through beats.</CardFooter>
      </Card>
    </div>
  );
}
