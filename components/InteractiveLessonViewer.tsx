'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { animate as anime } from "animejs";
import type { InteractiveLesson, LessonAnimationBeat, LessonMultipleChoiceBlock } from '../lib/types/lesson';
import { submitStudyAttempt } from '../app/study/actions';
import { StudyAttemptInputSchema } from '../core/types/events';
import type { StudyAttemptInput } from '../core/types/events';
import TimelineBeatCard from './molecules/TimelineBeatCard';
import LessonMetaPanel from './organisms/LessonMetaPanel';
import GlowCard from './atoms/GlowCard';
import { WhyThisNextPill, type EngineSignals } from './study/WhyThisNextPill';
import { KeyboardShortcutsOverlay } from './study/KeyboardShortcutsOverlay';
import { EvidencePanel, type EvidenceData } from './study/EvidencePanel';
import { MasteryBurst, StarBurst } from './effects/MasteryBurst';
import { AbilityTrackerGraph, type AbilityDataPoint } from './study/AbilityTrackerGraph';
import { useXP } from './XPProvider';
import { XP_REWARDS } from '../lib/xp-system';

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

  // New state for PHASE 2 components
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(false);
  const [masteryBurstTrigger, setMasteryBurstTrigger] = useState(false);
  const [starBurstTrigger, setStarBurstTrigger] = useState(false);
  const [burstOrigin, setBurstOrigin] = useState({ x: 0, y: 0 });
  const [abilityData, setAbilityData] = useState<AbilityDataPoint[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const responseStartTime = useRef<number>(Date.now());

  const { awardXPWithFeedback } = useXP();
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  useEffect(() => {
    if (!hasTimeline) return;
    const controls = anime({
      targets: '#timeline-progress-bar',
      width: [`${(activeIndex / timeline.length) * 100}%`, `${((activeIndex + 1) / timeline.length) * 100}%`],
      ease: 'easeOutExpo',
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
        ease: 'easeOutQuad',
        direction: 'alternate'
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || !selectedChoice) return;
    const correct = selectedChoice === currentQuestion.correctChoice;
    setAnswerState('locked');

    const durationMs = Date.now() - responseStartTime.current;

    const primaryLo = currentQuestion.learningObjective ?? lesson.lo_id;
    const payload = StudyAttemptInputSchema.parse({
      learnerId,
      sessionId: `session-${learnerId}`,
      appVersion: 'dev-ui',
      itemId: currentQuestion.id,
      loIds: [primaryLo] as [string, ...string[]],
      difficulty: 'medium',
      choice: normalizeChoiceId(selectedChoice),
      correct,
      openedEvidence: evidencePanelOpen,
      durationMs
    }) as StudyAttemptInput;

    await submitStudyAttempt(payload);

    setAnswerState(correct ? 'correct' : 'incorrect');

    setTotalAnswered(prev => prev + 1);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      const isFast = durationMs < 5000;
      const xpAmount = isFast ? XP_REWARDS.QUESTION_CORRECT_FAST : XP_REWARDS.QUESTION_CORRECT;
      const reason = isFast ? 'Fast & Correct! ⚡' : 'Correct! ✓';
      awardXPWithFeedback(xpAmount, reason);
    }

    // Update ability tracker data (mock Rasch update for demo)
    const prevTheta = abilityData.length > 0 ? abilityData[abilityData.length - 1].theta : 0.0;
    const prevSE = abilityData.length > 0 ? abilityData[abilityData.length - 1].se : 0.8;
    const newTheta = correct ? prevTheta + 0.15 : prevTheta - 0.10; // Simplified EAP update
    const newSE = Math.max(0.15, prevSE * 0.92); // SE reduces with more responses

    setAbilityData((prev) => [
      ...prev,
      {
        itemNumber: prev.length + 1,
        theta: newTheta,
        se: newSE,
        correct,
        timestamp: Date.now(),
      },
    ]);

    // Trigger mastery burst on correct answer
    if (correct) {
      const buttonElement = document.querySelector(`#choice-${selectedChoice}`);
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        setBurstOrigin({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
      setMasteryBurstTrigger(true);
      setTimeout(() => setMasteryBurstTrigger(false), 100);

      // Trigger star burst if high mastery
      if (newSE < 0.25 && newTheta > 0.5) {
        setTimeout(() => {
          setStarBurstTrigger(true);
          setTimeout(() => setStarBurstTrigger(false), 100);
        }, 400);
      }
    }

    anime({
      targets: '#mcq-feedback',
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 520,
      ease: 'easeOutExpo'
    });
  }, [currentQuestion, learnerId, lesson.lo_id, selectedChoice, evidencePanelOpen, abilityData]);

  const handleContinue = useCallback(() => {
    setAnswerState('idle');
    setSelectedChoice(null);
    responseStartTime.current = Date.now(); // Reset timer for next question
    if (activeIndex < mcqs.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (onLessonComplete) {
      const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0;
      const isPerfect = accuracy === 1.0;
      const xpAmount = isPerfect ? XP_REWARDS.LESSON_PERFECT : XP_REWARDS.LESSON_COMPLETE;
      const reason = isPerfect
        ? `Perfect Lesson! 🎯 ${correctAnswers}/${totalAnswered}`
        : `Lesson Complete! 📚 ${correctAnswers}/${totalAnswered}`;
      awardXPWithFeedback(xpAmount, reason);
      onLessonComplete();
    }
  }, [activeIndex, mcqs.length, onLessonComplete, correctAnswers, totalAnswered, awardXPWithFeedback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if shortcuts overlay is open or evidence panel is open
      if (showShortcuts || evidencePanelOpen) return;

      // Number keys 1-5 to select answers (A-E)
      if (['1', '2', '3', '4', '5'].includes(e.key) && answerState === 'idle' && currentQuestion) {
        e.preventDefault();
        const choiceIndex = parseInt(e.key, 10) - 1;
        if (currentQuestion.choices[choiceIndex]) {
          handleChoiceSelect(currentQuestion.choices[choiceIndex].id);
        }
      }

      // Enter to submit or continue
      if (e.key === 'Enter') {
        e.preventDefault();
        if (answerState === 'idle' && selectedChoice) {
          handleSubmit();
        } else if (answerState !== 'idle') {
          handleContinue();
        }
      }

      // E to toggle evidence panel
      if (e.key === 'e' || e.key === 'E') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setEvidencePanelOpen((prev) => !prev);
        }
      }

      // Arrow right for next question (when answered)
      if (e.key === 'ArrowRight' && answerState !== 'idle') {
        e.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerState, selectedChoice, currentQuestion, handleSubmit, handleContinue, handleChoiceSelect, showShortcuts, evidencePanelOpen]);

  // Mock engine signals for "Why this next" pill
  const engineSignals: EngineSignals = {
    theta: abilityData.length > 0 ? abilityData[abilityData.length - 1].theta : 0.0,
    se: abilityData.length > 0 ? abilityData[abilityData.length - 1].se : 0.8,
    masteryProb: abilityData.length > 0
      ? Math.max(0, Math.min(1, (abilityData[abilityData.length - 1].theta + 2) / 4))
      : 0.5,
    blueprintGap: -0.03, // Mock: 3% under target
    urgency: 1.0 + Math.max(0, (5 - 3)) / 7, // Mock: 5 days since last
    daysSinceLast: 5,
    itemInfo: 0.42, // Mock Fisher info
    reason: 'max_utility',
    loId: currentQuestion?.learningObjective ?? lesson.lo_id,
    loName: lesson.title,
  };

  // Mock evidence data (would come from Gemini OCR in production)
  const evidenceData: EvidenceData | null = lesson.source_file || lesson.sourceFile
    ? {
        sourceFile: lesson.source_file || lesson.sourceFile || 'Unknown source',
        loId: lesson.lo_id,
        slides: [
          {
            slideNumber: 1,
            title: lesson.title,
            text: lesson.summary,
            diagrams: lesson.high_yield.slice(0, 3).map((item, i) => ({
              label: `Key Point ${i + 1}`,
              description: item,
            })),
          },
        ],
      }
    : null;

  return (
    <>
      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcutsOverlay
        initialVisible={false}
        onVisibilityChange={setShowShortcuts}
      />

      {/* Evidence panel */}
      <EvidencePanel
        evidence={evidenceData}
        isOpen={evidencePanelOpen}
        onClose={() => setEvidencePanelOpen(false)}
        onEvidenceViewed={(slideNum) => console.log(`Evidence viewed: slide ${slideNum}`)}
      />

      {/* Mastery burst effects */}
      <MasteryBurst
        trigger={masteryBurstTrigger}
        origin={burstOrigin}
        intensity="high"
      />
      <StarBurst
        trigger={starBurstTrigger}
        origin={burstOrigin}
      />

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          {/* "Why this next" pill */}
          {currentQuestion && (
            <WhyThisNextPill signals={engineSignals} />
          )}

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
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedChoice || answerState !== 'idle'}
                  className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-6 py-3 text-white shadow-lg transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reveal
                </button>
                <button
                  onClick={() => setEvidencePanelOpen(true)}
                  className="rounded-2xl border-2 border-slate-300 px-4 py-3 text-slate-700 hover:border-sky-400 hover:bg-sky-50 transition-colors"
                  title="View evidence (E)"
                >
                  📚 Evidence
                </button>
              </div>
              {answerState !== 'idle' && (
                <button onClick={handleContinue} className="px-4 py-2 rounded-xl bg-slate-900/10 text-slate-700 font-semibold hover:bg-slate-900/20 transition-colors">
                  Next →
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

      <div className="space-y-6">
        <LessonMetaPanel lesson={lesson} />

        {/* Ability Tracker Graph */}
        {abilityData.length > 0 && (
          <AbilityTrackerGraph
            loId={lesson.lo_id}
            loName={lesson.title}
            dataPoints={abilityData}
            height={280}
            autoScroll={true}
          />
        )}

        {/* Keyboard shortcuts hint */}
        <GlowCard className="p-4 text-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div className="text-sm text-slate-300">
            Press <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono mx-1">?</kbd> for keyboard shortcuts
          </div>
        </GlowCard>
      </div>
    </div>
    </>
  );
}
