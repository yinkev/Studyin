/**
 * Follow The Money - Game State Management
 * Redux-style reducer for game state
 * Following spec from docs/follow-the-money/GAME_MECHANICS.md
 */

import type {
  GameState,
  GameAction,
  DifficultyLevel,
} from './types';
import { DIFFICULTY_CONFIGS } from './types';
import {
  buildShuffleSequence,
  initialMoneyIndex,
  trackMoneyPosition,
} from './shuffle-engine';
import { computeRoundXP, calculateNewStreak } from './scoring';

/**
 * Initial game state
 */
export function createInitialState(): GameState {
  return {
    phase: 'setup',
    difficulty: 'easy',
    moneyPosition: 0,
    shuffleSequence: [],
    currentShuffleIndex: 0,
    playerSelection: null,
    isCorrect: null,
    streak: 0,
    totalXP: 0,
    seed: '',
  };
}

/**
 * Game state reducer
 * Handles all game state transitions
 */
export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { difficulty, seed } = action;
      const config = DIFFICULTY_CONFIGS[difficulty];

      return {
        ...state,
        phase: 'setup',
        difficulty,
        seed,
        moneyPosition: initialMoneyIndex(seed, config.shells),
        shuffleSequence: [],
        currentShuffleIndex: 0,
        playerSelection: null,
        isCorrect: null,
      };
    }

    case 'START_SHUFFLING': {
      const { shuffleSequence } = action;

      return {
        ...state,
        phase: 'shuffling',
        shuffleSequence,
        currentShuffleIndex: 0,
      };
    }

    case 'ADVANCE_SHUFFLE': {
      return {
        ...state,
        currentShuffleIndex: state.currentShuffleIndex + 1,
      };
    }

    case 'COMPLETE_SHUFFLING': {
      // Calculate final money position after all swaps
      const finalPosition = trackMoneyPosition(
        state.moneyPosition,
        state.shuffleSequence
      );

      return {
        ...state,
        phase: 'selecting',
        moneyPosition: finalPosition,
      };
    }

    case 'SELECT_SHELL': {
      const { shellIndex } = action;

      // Ignore if not in selecting phase
      if (state.phase !== 'selecting') {
        return state;
      }

      return {
        ...state,
        phase: 'revealing',
        playerSelection: shellIndex,
      };
    }

    case 'REVEAL_RESULT': {
      const { isCorrect, xpGained } = action;

      return {
        ...state,
        phase: 'complete',
        isCorrect,
        streak: calculateNewStreak(state.streak, isCorrect),
        totalXP: state.totalXP + xpGained,
      };
    }

    case 'RESET_GAME': {
      return {
        ...createInitialState(),
        difficulty: state.difficulty,
        streak: state.streak,
        totalXP: state.totalXP,
      };
    }

    case 'CHANGE_DIFFICULTY': {
      const { difficulty } = action;

      return {
        ...state,
        difficulty,
        phase: 'setup',
      };
    }

    default:
      return state;
  }
}

/**
 * Helper to start a new game with all initialization
 */
export function startNewGame(
  state: GameState,
  difficulty: DifficultyLevel,
  seed: string
): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Initialize money position and generate shuffle sequence
  const moneyPos = initialMoneyIndex(seed, config.shells);
  const sequence = buildShuffleSequence(seed, config);

  return {
    ...state,
    phase: 'shuffling',
    difficulty,
    seed,
    moneyPosition: moneyPos,
    shuffleSequence: sequence,
    currentShuffleIndex: 0,
    playerSelection: null,
    isCorrect: null,
  };
}

/**
 * Helper to process a player's selection
 */
export function processSelection(
  state: GameState,
  shellIndex: number,
  timeSeconds: number
): {
  newState: GameState;
  xpGained: number;
  reason: string;
} {
  if (state.phase !== 'selecting') {
    return {
      newState: state,
      xpGained: 0,
      reason: 'Invalid selection phase',
    };
  }

  const isCorrect = shellIndex === state.moneyPosition;
  const { total, reason } = computeRoundXP(
    state.difficulty,
    state.streak,
    timeSeconds,
    isCorrect
  );

  const newState: GameState = {
    ...state,
    phase: 'complete',
    playerSelection: shellIndex,
    isCorrect,
    streak: calculateNewStreak(state.streak, isCorrect),
    totalXP: state.totalXP + total,
  };

  return {
    newState,
    xpGained: total,
    reason,
  };
}
