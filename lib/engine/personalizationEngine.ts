import {
  selectNextItem,
  buildWhyThisNext,
  difficultyToBeta,
  runEapUpdate,
  rasch,
  STOP_RULES,
  shouldStopLo
} from '../study-engine';
import type { CandidateItem, SelectionResult } from '../study-engine';
import { createDefaultLoState, type LearnerState } from '../server/study-state';
import type {
  IPersonalizationEngine,
  EngineSuggestParams,
  EngineSuggestion,
  EngineUpdateParams,
  EngineUpdateResult,
  EngineStopParams,
  EngineStopDecision
} from './IPersonalizationEngine';

interface EngineConfig {
  name?: string;
  version?: string;
  seed?: number;
}

function cloneLearnerState(state: LearnerState): LearnerState {
  return {
    learnerId: state.learnerId,
    updatedAt: state.updatedAt,
    los: Object.fromEntries(Object.entries(state.los).map(([key, value]) => [key, { ...value }])),
    items: Object.fromEntries(
      Object.entries(state.items).map(([key, value]) => [
        key,
        {
          attempts: value.attempts,
          correct: value.correct,
          lastAttemptTs: value.lastAttemptTs,
          recentAttempts: value.recentAttempts ? value.recentAttempts.slice() : undefined
        }
      ])
    ),
    retention: Object.fromEntries(
      Object.entries(state.retention).map(([key, value]) => [
        key,
        {
          loIds: value.loIds.slice(),
          halfLifeHours: value.halfLifeHours,
          nextReviewMs: value.nextReviewMs,
          lastReviewMs: value.lastReviewMs,
          lapses: value.lapses
        }
      ])
    )
  };
}

export class PersonalizationEngine implements IPersonalizationEngine {
  readonly name: string;
  readonly version: string;
  readonly seed: number;

  constructor(config?: EngineConfig) {
    this.name = config?.name ?? 'studyin-personalization-engine';
    this.version = config?.version ?? '2025.10.06';
    this.seed = config?.seed ?? 1;
  }

  suggestNext(params: EngineSuggestParams): EngineSuggestion | null {
    const { candidates, seed } = params;
    if (!candidates.length) {
      return null;
    }

    const { thetaHat, se } = this.computeGlobalStats(params.state);
    const selection = selectNextItem({
      thetaHat,
      items: candidates,
      seed: seed ?? this.seed
    });

    if (!selection) {
      return null;
    }

    const masteryProb = rasch.masteryProbability(thetaHat, se);
    const rationale = {
      why: buildWhyThisNext(selection.signals, {
        thetaHat,
        se,
        masteryProb
      }),
      thetaHat,
      masteryProb,
      se
    } satisfies Record<string, unknown>;

    return {
      selection,
      rationale
    } satisfies EngineSuggestion;
  }

  update(params: EngineUpdateParams): EngineUpdateResult {
    const { state, loIds, difficulty, correct, timestampMs, itemId } = params;
    const next = cloneLearnerState(state);

    let aggregateTheta = 0;
    let aggregateSe = 0;
    const beta = difficultyToBeta(difficulty);

    for (const loId of loIds) {
      const current = next.los[loId] ?? createDefaultLoState();
      const { thetaHat, se } = runEapUpdate({
        priorMu: current.priorMu ?? current.thetaHat,
        priorSigma: current.priorSigma ?? 0.8,
        response: { k: correct ? 1 : 0, m: 1 },
        difficulty: beta
      });

      aggregateTheta += thetaHat;
      aggregateSe += se;

      next.los[loId] = {
        ...current,
        thetaHat,
        se,
        itemsAttempted: (current.itemsAttempted ?? 0) + 1,
        recentSes: [...(current.recentSes ?? []), se].slice(-10),
        lastProbeDifficulty: beta,
        priorMu: thetaHat,
        priorSigma: Math.max(0.25, se),
        masteryConfirmed:
          current.masteryConfirmed ||
          (Math.abs(thetaHat - beta) <= STOP_RULES.probeWindow &&
            rasch.masteryProbability(thetaHat, se) >= STOP_RULES.masteryProb)
      };
    }

    const currentItem = next.items[itemId] ?? { attempts: 0, correct: 0, recentAttempts: [] as number[] };

    currentItem.attempts += 1;
    if (correct) currentItem.correct += 1;
    currentItem.lastAttemptTs = timestampMs;
    currentItem.recentAttempts = [...(currentItem.recentAttempts ?? []), timestampMs].slice(-20);

    next.items[itemId] = currentItem;
    next.updatedAt = new Date(timestampMs).toISOString();

    const { thetaHat: fallbackTheta, se: fallbackSe } = this.computeGlobalStats(state);
    const count = loIds.length;
    const avgThetaHat = count ? aggregateTheta / count : fallbackTheta;
    const avgSe = count ? Math.max(0.0001, aggregateSe / count) : fallbackSe;
    const masteryProbability = rasch.masteryProbability(avgThetaHat, avgSe);

    return {
      state: next,
      signals: {
        thetaHat: avgThetaHat,
        se: avgSe,
        masteryProbability
      }
    } satisfies EngineUpdateResult;
  }

  shouldStop(params: EngineStopParams): EngineStopDecision {
    const loState = params.state.los[params.loId];
    if (!loState) {
      return {
        shouldStop: false,
        triggers: []
      } satisfies EngineStopDecision;
    }

    const triggers: string[] = [];
    if (loState.itemsAttempted >= STOP_RULES.minItems) {
      if (loState.se <= STOP_RULES.seThreshold) {
        triggers.push('se_threshold');
      }
      if (loState.masteryConfirmed) {
        triggers.push('mastery_confirmed');
      }
      if (loState.recentSes.length >= 5) {
        const deltas = loState.recentSes.slice(-5).map((value, index, array) => {
          if (index === 0) return 0;
          return Math.abs(value - array[index - 1]);
        });
        const avgDelta =
          deltas.reduce((sum, value) => sum + value, 0) /
          (deltas.length > 1 ? deltas.length - 1 : 1);
        if (avgDelta < STOP_RULES.deltaSeThreshold) {
          triggers.push('delta_se_plateau');
        }
      }
      if (
        loState.lastProbeDifficulty !== undefined &&
        Math.abs(loState.thetaHat - loState.lastProbeDifficulty) <= STOP_RULES.probeWindow &&
        rasch.masteryProbability(loState.thetaHat, loState.se) >= STOP_RULES.masteryProb
      ) {
        triggers.push('probe_mastery_window');
      }
    }

    const shouldStopFlag = shouldStopLo(loState);
    return {
      shouldStop: shouldStopFlag,
      triggers: shouldStopFlag ? triggers : []
    } satisfies EngineStopDecision;
  }

  withSeed(seed: number): IPersonalizationEngine {
    return new PersonalizationEngine({ name: this.name, version: this.version, seed });
  }

  private computeGlobalStats(state: LearnerState): { thetaHat: number; se: number } {
    const los = Object.values(state.los);
    if (!los.length) {
      return { thetaHat: 0, se: 0.8 };
    }
    const thetaHat = los.reduce((acc, lo) => acc + (lo.thetaHat ?? 0), 0) / los.length;
    const se = los.reduce((acc, lo) => acc + (lo.se ?? 0.8), 0) / los.length;
    return { thetaHat, se };
  }
}

export function createPersonalizationEngine(config?: EngineConfig): PersonalizationEngine {
  return new PersonalizationEngine(config);
}

export type { CandidateItem, SelectionResult };
