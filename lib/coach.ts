import { LearnerState, InteractiveLesson, Confidence } from '../core/types/mvp';

/**
 * This file contains the core logic for the Personalization Coach.
 */

/**
 * Analyzes the learner's state and suggests the next best lesson to study.
 * 
 * @param state The current state of the learner.
 * @param lessons A list of all available lessons.
 * @returns The suggested lesson or null if no suggestion can be made.
 */
export function getSuggestion(state: LearnerState, lessons: InteractiveLesson[]): InteractiveLesson | null {
  // MVP Logic: Find the least recently studied learning objective.
  // A more advanced implementation would use ability, stability, and time.
  
  if (lessons.length === 0) {
    return null;
  }

  let oldestTimestamp = Infinity;
  let leastRecentLo: string | null = null;

  for (const [lo, loState] of Object.entries(state.knowledgeState)) {
    const timestamp = new Date(loState.lastAnsweredTimestamp).getTime();
    if (timestamp < oldestTimestamp) {
      oldestTimestamp = timestamp;
      leastRecentLo = lo;
    }
  }

  // If we found an LO that has been studied, suggest a lesson containing it.
  if (leastRecentLo) {
    const lesson = lessons.find(l => l.content.some(c => c.type === 'multiple_choice_question' && c.learningObjective === leastRecentLo));
    if (lesson) return lesson;
  }

  // If no LOs have been studied, or if the suggested LO's lesson is missing, just suggest the first lesson.
  return lessons[0] || null;
}

/**
 * Updates the learner's state after a question has been answered.
 * 
 * @param currentState The current state of the learner.
 * @param loId The learning objective of the question.
 * @param questionId The ID of the question answered.
 * @param isCorrect Whether the answer was correct.
 * @param confidence The user's reported confidence level.
 * @returns The new, updated learner state.
 */
export function updateState(
  currentState: LearnerState, 
  loId: string, 
  questionId: string, 
  isCorrect: boolean, 
  confidence: Confidence
): LearnerState {
  const newState = { ...currentState };
  const now = new Date().toISOString();

  if (!newState.knowledgeState[loId]) {
    newState.knowledgeState[loId] = {
      ability: 0.5, // Start at a baseline
      stability: 1, // Start with low stability
      lastAnsweredTimestamp: now,
      history: [],
    };
  }

  const loState = newState.knowledgeState[loId];

  // MVP Logic: Simple ability update.
  // Correct answers increase ability, incorrect answers decrease it.
  // High confidence has a bigger impact.
  const confidenceMultiplier = confidence === 'High' ? 1.5 : (confidence === 'Medium' ? 1 : 0.5);
  const change = isCorrect ? 0.1 * confidenceMultiplier : -0.1 * confidenceMultiplier;
  
  loState.ability = Math.max(0, Math.min(1, loState.ability + change));
  
  // TODO: Implement stability (memory decay) updates based on FSRS principles.
  loState.stability = isCorrect ? loState.stability * 1.5 : loState.stability * 0.75;

  loState.lastAnsweredTimestamp = now;
  loState.history.push({ questionId, isCorrect, confidence, timestamp: now });

  return newState;
}
