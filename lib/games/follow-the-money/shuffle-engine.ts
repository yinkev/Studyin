/**
 * Follow The Money - Shuffle Engine
 * Deterministic shuffle algorithm with seeded PRNG
 * Following spec from docs/follow-the-money/GAME_MECHANICS.md
 */

import type { ShuffleSwap, DifficultyConfig } from './types';

/**
 * Mulberry32 PRNG - fast and simple seeded random number generator
 * Produces deterministic pseudo-random numbers from a 32-bit state
 */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string seed to a stable 32-bit number
 * Using FNV-1a hash algorithm for better distribution
 */
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0; // FNV offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  return h >>> 0;
}

/**
 * Get initial money index from seed
 * Deterministic starting position
 *
 * @param seed - Game seed
 * @param shells - Number of shells
 * @returns Index where money starts (0 to shells-1)
 */
export function initialMoneyIndex(seed: string, shells: number): number {
  const rng = mulberry32(hashSeed(seed));
  return Math.floor(rng() * shells);
}

/**
 * Build deterministic shuffle sequence with adjacent swaps
 * Avoids immediate reversals for better UX
 *
 * @param seed - Game seed
 * @param cfg - Difficulty configuration
 * @returns Array of shell swaps to perform
 */
export function buildShuffleSequence(
  seed: string,
  cfg: DifficultyConfig
): ShuffleSwap[] {
  // Mix seed with difficulty params for unique sequences
  const rng = mulberry32(hashSeed(seed + `:${cfg.shells}:${cfg.shuffles}`));
  const seq: ShuffleSwap[] = [];
  let lastA = -1;
  let lastB = -1;

  for (let i = 0; i < cfg.shuffles; i++) {
    // Pick a starting index
    const a = Math.floor(rng() * cfg.shells);

    // Choose left or right neighbor on a ring
    const dir = rng() < 0.5 ? -1 : 1;
    const b = (a + dir + cfg.shells) % cfg.shells;

    // Avoid immediate reversal of the same pair
    const isReversal = a === lastB && b === lastA;
    if (isReversal) {
      // Flip direction once to break the pattern
      const b2 = (a - dir + cfg.shells) % cfg.shells;
      seq.push({ a, b: b2 });
      lastA = a;
      lastB = b2;
      continue;
    }

    seq.push({ a, b });
    lastA = a;
    lastB = b;
  }

  return seq;
}

/**
 * Generate a unique seed for a new game
 */
export function generateGameSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Track money position through a sequence of shuffles
 *
 * @param initialPosition - Starting shell index
 * @param swaps - Sequence of shuffle swaps
 * @returns Final position of money after all swaps
 */
export function trackMoneyPosition(
  initialPosition: number,
  swaps: ShuffleSwap[]
): number {
  let position = initialPosition;

  for (const swap of swaps) {
    // If money is in one of the swapped shells, update its position
    if (position === swap.a) {
      position = swap.b;
    } else if (position === swap.b) {
      position = swap.a;
    }
  }

  return position;
}

/**
 * Validate that a shuffle sequence is legal
 * - All swaps use valid indices
 * - No swap between same shell
 *
 * @param swaps - Shuffle sequence to validate
 * @param shellCount - Total number of shells
 * @returns True if valid
 */
export function validateShuffleSequence(
  swaps: ShuffleSwap[],
  shellCount: number
): boolean {
  for (const swap of swaps) {
    // Check indices in valid range
    if (swap.a < 0 || swap.a >= shellCount) return false;
    if (swap.b < 0 || swap.b >= shellCount) return false;

    // Check not swapping with itself
    if (swap.a === swap.b) return false;
  }

  return true;
}
