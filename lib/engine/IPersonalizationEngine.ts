import type { CandidateItem, SelectionResult } from '../study-engine';
import type { LearnerState } from '../server/study-state';
import type { DifficultyCode } from '../study-engine';

export interface EngineSuggestParams {
  learnerId: string;
  sessionId: string;
  state: LearnerState;
  candidates: CandidateItem[];
  seed?: number;
}

export interface EngineSuggestion {
  selection: SelectionResult | null;
  rationale: Record<string, unknown>;
}

export interface EngineUpdateParams {
  learnerId: string;
  state: LearnerState;
  loIds: string[];
  difficulty: DifficultyCode;
  correct: boolean;
  itemId: string;
  timestampMs: number;
}

export interface EngineUpdateResult {
  state: LearnerState;
  signals: {
    thetaHat: number;
    se: number;
    masteryProbability: number;
  };
}

export interface EngineStopParams {
  learnerId: string;
  state: LearnerState;
  loId: string;
}

export interface EngineStopDecision {
  shouldStop: boolean;
  triggers: string[];
}

export interface IPersonalizationEngine {
  readonly name: string;
  readonly version: string;
  readonly seed: number;
  suggestNext(params: EngineSuggestParams): EngineSuggestion | null;
  update(params: EngineUpdateParams): EngineUpdateResult;
  shouldStop(params: EngineStopParams): EngineStopDecision;
  withSeed(seed: number): IPersonalizationEngine;
}
