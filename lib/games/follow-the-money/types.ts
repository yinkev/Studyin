/**
 * Follow The Money - Type Definitions
 * Core types and interfaces for the mini-game
 */

/**
 * Difficulty levels with their configurations
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Configuration for each difficulty level
 */
export interface DifficultyConfig {
  /** Number of shells/containers to display */
  shells: number;
  /** Number of shuffle swaps to perform */
  shuffles: number;
  /** Animation speed in milliseconds per swap */
  speed: number;
  /** Base XP reward for winning */
  xpReward: number;
}

/**
 * Complete difficulty configurations
 */
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    shells: 3,
    shuffles: 3,
    speed: 1000,
    xpReward: 50,
  },
  medium: {
    shells: 4,
    shuffles: 5,
    speed: 700,
    xpReward: 100,
  },
  hard: {
    shells: 5,
    shuffles: 8,
    speed: 500,
    xpReward: 200,
  },
  expert: {
    shells: 5,
    shuffles: 12,
    speed: 300,
    xpReward: 500,
  },
};

/**
 * Represents a swap operation between two shells
 */
export interface ShuffleSwap {
  /** Index of first shell */
  a: number;
  /** Index of second shell */
  b: number;
}

/**
 * Game phase states
 */
export type GamePhase =
  | 'setup' // Difficulty selection, showing initial money position
  | 'shuffling' // Shells are being shuffled
  | 'selecting' // Player can select a shell
  | 'revealing' // Showing correct/incorrect result
  | 'complete'; // Game finished, showing results

/**
 * Shell visual states
 */
export type ShellState =
  | 'idle' // Normal state
  | 'shuffling' // Currently animating
  | 'selected' // Player clicked this shell
  | 'revealed-correct' // This shell had the money
  | 'revealed-wrong'; // This shell did not have the money

/**
 * Complete game state
 */
export interface GameState {
  /** Current phase of the game */
  phase: GamePhase;
  /** Selected difficulty level */
  difficulty: DifficultyLevel;
  /** Which shell index currently has the money (0-indexed) */
  moneyPosition: number;
  /** Sequence of shuffle swaps to perform */
  shuffleSequence: ShuffleSwap[];
  /** Current shuffle index being animated */
  currentShuffleIndex: number;
  /** Which shell the player selected (null if not selected yet) */
  playerSelection: number | null;
  /** Whether the player won */
  isCorrect: boolean | null;
  /** Current winning streak (for bonus XP) */
  streak: number;
  /** Total XP earned this session */
  totalXP: number;
  /** Seed used for this game (for determinism) */
  seed: string;
}

/**
 * Actions for game state reducer
 */
export type GameAction =
  | { type: 'START_GAME'; difficulty: DifficultyLevel; seed: string }
  | { type: 'START_SHUFFLING'; shuffleSequence: ShuffleSwap[] }
  | { type: 'ADVANCE_SHUFFLE' }
  | { type: 'COMPLETE_SHUFFLING' }
  | { type: 'SELECT_SHELL'; shellIndex: number }
  | { type: 'REVEAL_RESULT'; isCorrect: boolean; xpGained: number }
  | { type: 'RESET_GAME' }
  | { type: 'CHANGE_DIFFICULTY'; difficulty: DifficultyLevel };

/**
 * Result of a completed game
 */
export interface GameResult {
  /** Was the selection correct? */
  correct: boolean;
  /** Difficulty played */
  difficulty: DifficultyLevel;
  /** XP earned */
  xpGained: number;
  /** Current streak after this game */
  streak: number;
  /** Correct shell index */
  correctShell: number;
  /** Player's selected shell */
  playerShell: number;
  /** Seed used (for replay) */
  seed: string;
}

/**
 * Shell position in 2D space
 */
export interface ShellPosition {
  x: number;
  y: number;
  index: number;
}
