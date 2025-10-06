'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import anime from 'animejs';
import type { InteractiveLesson, LessonAnimationBeat, LessonMultipleChoiceBlock } from '../lib/types/lesson';
import { submitStudyAttempt } from '../app/study/actions';
import { StudyAttemptInputSchema } from '../core/types/events';
import TimelineBeatCard from './molecules/TimelineBeatCard';
import LessonMetaPanel from './organisms/LessonMetaPanel';
import GlowCard from './atoms/GlowCard';

interface InteractiveLessonViewerProps {
  lesson: InteractiveLesson;
  learnerId?: string;
  onLessonComplete?: () => void;
}

type AnswerState = 'idle' | 'locked' | 'correct' | 'incorrect';

function normalizeChoiceId(id: string): 'A' | 'B' | 'C' | 'D' | 'E' {
  const upper = id.trim().toUpperCase();
  if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D' || upper === 'E') {
    return upper;
  }
  return 'A';
}

export default function InteractiveLessonViewer({ lesson, learnerId = 'local-dev', onLessonComplete }: InteractiveLessonViewerProps) {
  const timeline = lesson.animation_timeline ?? [];
  const mcqs = useMemo(
    () => lesson.content.filter((block): block is LessonMultipleChoiceBlock => block.type === 'multiple_choice_question'),
    [lesson.content]
  );
  const hasTimeline = timeline.length > 0;

  const [activeBeat, setActiveBeat] = useState<LessonAnimationBeat | null>(hasTimeline ? timeline[0] : null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');

  useEffect(() => {
    if (!hasTimeline) return;
    const controls = anime({
      targets: '#timeline-progress-bar',
      width: [`${(activeIndex / timeline.length) * 100}%`, `${((activeIndex + 1) / timeline.length) * 100}%`],
      easing: 'easeOutExpo',
      duration: 600
    });
    return () => {
      controls.pause();
    };
  }, [activeIndex, hasTimeline, timeline.length]);

  useEffect(() => {
    if (!hasTimeline) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % timeline.length;
        setActiveBeat(timeline[nextIndex]);
        return nextIndex;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [hasTimeline, timeline]);

  const currentQuestion = mcqs[activeIndex] ?? mcqs[0];

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      setSelectedChoice(choiceId);
      anime({
        targets: `#choice-${choiceId}`,
        scale: [1, 1.04],
        duration: 220,
        easing: 'easeOutQuad',
        direction: 'alternate'
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || !selectedChoice) return;
    const correct = selectedChoice === currentQuestion.correctChoice;
    setAnswerState('locked');

    const payload = StudyAttemptInputSchema.parse({
      learnerId,
      sessionId: `session-${learnerId}`,
      appVersion: 'dev-ui',
      itemId: currentQuestion.id,
      loIds: [currentQuestion.learningObjective ?? lesson.lo_id].filter(Boolean),
      difficulty: 'medium',
      choice: normalizeChoiceId(selectedChoice),
      correct,
      openedEvidence: false,
      durationMs: 15_000
    });

    await submitStudyAttempt(payload);

    setAnswerState(correct ? 'correct' : 'incorrect');
    anime({
      targets: '#mcq-feedback',
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 520,
      easing: 'easeOutExpo'
    });
  }, [currentQuestion, learnerId, lesson.lo_id, selectedChoice]);

  const handleContinue = useCallback(() => {
    setAnswerState('idle');
    setSelectedChoice(null);
    if (activeIndex < mcqs.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (onLessonComplete) {
      onLessonComplete();
    }
  }, [activeIndex, mcqs.length, onLessonComplete]);

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        {hasTimeline && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-full bg-slate-200/50">
              <div id="timeline-progress-bar" className="h-2 w-0 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {timeline.map((beat, index) => (
                <TimelineBeatCard
                  key={beat.beat}
                  beat={beat}
                  index={index}
                  isActive={activeIndex === index}
                  onActivate={setActiveBeat}
                />
              ))}
            </div>
          </div>
        )}

        {currentQuestion && (
          <GlowCard className="border border-white/20 bg-white/80 p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-wide text-slate-500">Confidence Probe</div>
              <div className="rounded-full bg-slate-900/80 px-4 py-1 text-xs font-semibold text-slate-100">
                LO · {currentQuestion.learningObjective ?? lesson.lo_id}
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">{currentQuestion.stem}</h2>
            <div className="mt-6 grid gap-3">
              {currentQuestion.choices.map((choice) => {
                const isSelected = selectedChoice === choice.id;
                const isCorrect = answerState !== 'idle' && choice.id === currentQuestion.correctChoice;
                const isIncorrect = answerState === 'incorrect' && isSelected && !isCorrect;
                return (
                  <button
                    key={choice.id}
                    id={`choice-${choice.id}`}
                    onClick={() => handleChoiceSelect(choice.id)}
                    disabled={answerState !== 'idle'}
                    className={`rounded-2xl border-2 px-5 py-4 text-left text-lg transition ${
                      isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.2)]'
                        : isIncorrect
                        ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-[0_12px_30px_rgba(244,63,94,0.2)]'
                        : isSelected
                        ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-[0_12px_30px_rgba(56,189,248,0.18)]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-slate-50'
                    }`}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleSubmit}
                disabled={!selectedChoice || answerState !== 'idle'}
                className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-6 py-3 text-white shadow-lg transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reveal
              </button>
              {answerState !== 'idle' && (
                <button onClick={handleContinue} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                  Next
                </button>
              )}
            </div>
            {answerState !== 'idle' && (
              <div id="mcq-feedback" className="mt-4 rounded-2xl bg-slate-900/80 px-6 py-4 text-slate-100">
                {answerState === 'correct' ? '🔥 Nailed it! Mastery confirmed.' : 'Let’s revisit—Sparky logged this for another pass.'}
              </div>
            )}
          </GlowCard>
        )}

        {!currentQuestion && !hasTimeline && (
          <GlowCard className="border border-dashed border-white/20 bg-white/70 p-12 text-center text-slate-600">
            This lesson does not yet contain interactive cards. Upload new content or trigger the worker to populate questions.
          </GlowCard>
        )}
      </div>

      <LessonMetaPanel lesson={lesson} />
    </div>
  );
}
