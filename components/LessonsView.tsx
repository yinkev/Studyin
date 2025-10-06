'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LessonDoc } from '../lib/getLessons';
import { Card, CardContent, CardHeader, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { submitLessonEvent } from '../app/study/actions';

interface LessonsViewProps {
  lessons: LessonDoc[];
  learnerId: string;
  sessionId: string;
  onPractice?: (loId: string) => void;
}

export function LessonsView({ lessons, learnerId, sessionId, onPractice }: LessonsViewProps) {
  const [idx, setIdx] = useState(0);
  const current = lessons[idx];
  const beats = current?.animation_timeline ?? [];
  const [beatIndex, setBeatIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const nav = useMemo(
    () => ({
      nextLesson: () => {
        setIdx((i) => (i + 1) % Math.max(lessons.length, 1));
        setBeatIndex(0);
        setStartTime(Date.now());
      },
      prevLesson: () => {
        setIdx((i) => (i - 1 + Math.max(lessons.length, 1)) % Math.max(lessons.length, 1));
        setBeatIndex(0);
        setStartTime(Date.now());
      },
      nextBeat: () => setBeatIndex((b) => Math.min(b + 1, Math.max(beats.length - 1, 0))),
      prevBeat: () => setBeatIndex((b) => Math.max(b - 1, 0))
    }),
    [beats.length, lessons.length]
  );

  useEffect(() => {
    if (!current) return;

    const payload = {
      app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
      session_id: sessionId,
      user_id: learnerId,
      lo_id: current.lo_id,
      card_id: current.id,
      action: beatIndex === 0 ? 'reveal' : 'seek',
      ts: Date.now(),
      dwell_ms: Date.now() - startTime
    } as const;

    submitLessonEvent(payload).catch((err) => {
      console.error('Failed to submit lesson event', err);
    });
  }, [current, beatIndex, learnerId, sessionId, startTime]);

  if (!lessons.length) {
    return (
      <div className="duo-card px-6 py-12 text-center text-gray-700">
        <p>No lessons found. Place files under <code>content/lessons/&lt;module&gt;/*.lesson.json</code>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Lesson blueprint</p>
          <h2 className="text-xl font-semibold text-gray-900">{current.title}</h2>
          <p className="text-sm text-gray-600">LO: {current.lo_id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={nav.prevLesson} aria-label="Previous lesson" className="btn-ghost">
            Prev
          </Button>
          <Button variant="outline" onClick={nav.nextLesson} aria-label="Next lesson" className="btn-ghost">
            Next
          </Button>
          {onPractice && (
            <Button
              onClick={() => onPractice(current.lo_id)}
              aria-label="Practice this learning objective"
              className="duo-button text-white"
            >
              Practice this LO
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>High-yield</CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
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
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              {current.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex items-center justify-between text-gray-900">
          <span>Timeline</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={nav.prevBeat} disabled={beatIndex === 0} className="border-gray-300 text-gray-800 hover:bg-gray-50">
              ◀
            </Button>
            <span className="text-xs text-slate-400">
              Step {beats.length ? beatIndex + 1 : 0} / {beats.length}
            </span>
            <Button
              variant="outline"
              onClick={nav.nextBeat}
              disabled={beatIndex >= Math.max(beats.length - 1, 0)}
              className="border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              ▶
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {beats.length ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">Narration: </span>
                {beats[beatIndex]?.narration ?? '—'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Visual: </span>
                {beats[beatIndex]?.visual ?? '—'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No timeline beats defined.</p>
          )}
        </CardContent>
        <CardFooter>Use Left/Right keys to step through beats.</CardFooter>
      </Card>
    </div>
  );
}
