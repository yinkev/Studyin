# Follow The Money — Game Mechanics

Mario Party–inspired shell game where players track a money bag through animated shuffles, built with React + TypeScript, HeroUI, and Anime.js. This document specifies the full game flow, difficulty levels, deterministic shuffle, scoring, UX/a11y/performance targets, and edge‑case handling.

Sources of truth used in this spec:
- Difficulty types and config: `lib/games/follow-the-money/types.ts`
- Design context: `docs/FOLLOW_THE_MONEY_DESIGN.md`
- XP system integration: `components/XPProvider.tsx`, `lib/xp-system.ts`, `lib/hooks/useXPSystem.tsx`

## 1) Game Flow (Setup → Shuffle → Select → Reward)

State machine aligns to `GamePhase` in `lib/games/follow-the-money/types.ts`.

1. Setup
   - Show N shells (based on difficulty). Money starts at a visible shell (highlighted/ping).
   - Seed is chosen/resolved before round start (see §3), then initial money position is derived from the seed.
   - CTA: “Start Shuffle” (keyboard: Enter/Space). Phase → `shuffling`.

2. Shuffle
   - Generate a deterministic `ShuffleSwap[]` of length K from the seed and difficulty (see §3).
   - Animate adjacent swaps using Anime.js transforms only (translate, scale for emphasis). No pointer input during this phase. Phase → `selecting` when `currentShuffleIndex === K`.

3. Select
   - Enable input (mouse/touch/keyboard). One selection allowed.
   - On select, lock input and move phase → `revealing`.

4. Reward
   - Reveal correct shell; play success/fail animation and SFX.
   - Compute XP with streak/speed bonuses (see §4), call `awardXPWithFeedback`.
   - Emit `GameResult` with telemetry metadata (seed, difficulty, correct/selected indices, streak, xp). Phase → `complete`.

Common guards
- Prevent early selection during `shuffling`.
- Disable double‑click/double‑tap.
- If focus/visibility changes mid‑shuffle, pause animations and resume on return.

Example reducer events (pseudo‑TypeScript)

```ts
dispatch({ type: 'START_GAME', difficulty, seed })
dispatch({ type: 'START_SHUFFLING', shuffleSequence })
// ...K times → dispatch({ type: 'ADVANCE_SHUFFLE' })
dispatch({ type: 'COMPLETE_SHUFFLING' })
dispatch({ type: 'SELECT_SHELL', shellIndex })
dispatch({ type: 'REVEAL_RESULT', isCorrect, xpGained })
```

## 2) Difficulty Levels

Authoritative values live in `DIFFICULTY_CONFIGS` (do not hard‑code elsewhere):

| Level  | Shells | Shuffles | Speed (ms/swap) | Base XP |
|--------|--------|----------|-----------------|---------|
| easy   | 3      | 3        | 1000            | 50      |
| medium | 4      | 5        | 700             | 100     |
| hard   | 5      | 8        | 500             | 200     |
| expert | 5      | 12       | 300             | 500     |

Notes
- Animation duration per swap should closely track `speed` with easing: `easeInOutSine` or `linear` for fairness. Total round time ≈ `shuffles * speed + pauses`.
- Expert may add misdirection (brief decoy scale/tilt), but must not violate determinism or readability.

## 3) Deterministic Shuffle (Seeded)

Requirements
- Deterministic across devices/browsers for the same `{seed, difficulty}`.
- Adjacent‑only swaps on a circular layout (indices wrap), to keep tracking readable.
- No immediate no‑op reversal: avoid generating `a↔b` followed immediately by the same `a↔b` in the opposite direction.
- Avoid swapping a shell with itself.
- Produce exactly `shuffles` swaps.

Seed
- `seed` is a string; derive a stable 32‑bit PRNG state from it.
- Use a small, fast PRNG (e.g., Mulberry32 or SFC32). Example below uses Mulberry32.

Code example (library sketch)

```ts
// lib/games/follow-the-money/shuffle.ts
import { ShuffleSwap, DifficultyConfig } from './types';

// Mulberry32 PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple string → 32‑bit hash (xorshift‑style)
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initialMoneyIndex(seed: string, shells: number) {
  const rng = mulberry32(hashSeed(seed));
  return Math.floor(rng() * shells);
}

export function buildShuffleSequence(
  seed: string,
  cfg: DifficultyConfig
): ShuffleSwap[] {
  const rng = mulberry32(hashSeed(seed + `:${cfg.shells}:${cfg.shuffles}`));
  const seq: ShuffleSwap[] = [];
  let lastA = -1, lastB = -1;
  for (let i = 0; i < cfg.shuffles; i++) {
    // pick a starting index and choose left/right neighbor on a ring
    const a = Math.floor(rng() * cfg.shells);
    const dir = rng() < 0.5 ? -1 : 1;
    const b = (a + dir + cfg.shells) % cfg.shells;

    // avoid immediate reversal of the same pair
    const rev1 = a === lastB && b === lastA;
    if (rev1) {
      // flip direction once to break the pattern
      const b2 = (a - dir + cfg.shells) % cfg.shells;
      seq.push({ a, b: b2 });
      lastA = a; lastB = b2;
      continue;
    }

    seq.push({ a, b });
    lastA = a; lastB = b;
  }
  return seq;
}
```

Animation mapping
- Each `ShuffleSwap` becomes a pair of concurrent translate transforms between positions `a` and `b`.
- Use `transform: translate3d(x, y, 0)` with `will-change: transform`. No layout‑thrashing properties.

Determinism tests
- Same `{seed, difficulty}` → identical `initialMoneyIndex` and `buildShuffleSequence` outputs.
- Different seeds yield different sequences with uniform coverage over time.

## 4) Scoring and XP

Base XP per difficulty is sourced from `DIFFICULTY_CONFIGS[difficulty].xpReward`.

In‑round streak bonus (per consecutive correct within this mini‑game)
- Multiplier: `m_streak = 1 + min(0.1 × s, 0.5)` where `s` is in‑game streak before this round. Cap at +50% to avoid runaway growth.

Speed bonus (time from `selecting` enable → selection)
- `t ≤ 2s` → `m_speed = 1.2`
- `2s < t ≤ 5s` → `m_speed = 1.1`
- `t > 5s` → `m_speed = 1.0`

Perfect round bonus
- If correct and `t ≤ 1.0s`, apply `m_perfect = 2.0` instead of `m_speed` (choose the higher of the two). No perfect bonus on incorrect answers.

Formula

```
XP = round(BaseXP × m_streak × max(m_speed, m_perfect))
```

Daily study streak synergy (optional)
- To keep mini‑game rewards predictable, do not stack the global daily streak multiplier by default. If product wants global synergy, compute `XP′ = calculateXPReward(XP, { streak: progress.streak }).amount` before awarding.

Awarding XP (React example)

```tsx
import { useXP } from '@/components/XPProvider';
import { DIFFICULTY_CONFIGS, DifficultyLevel } from '@/lib/games/follow-the-money/types';

function computeRoundXP(
  difficulty: DifficultyLevel,
  inGameStreak: number,
  timeSeconds: number,
  correct: boolean
) {
  const base = DIFFICULTY_CONFIGS[difficulty].xpReward;
  const m_streak = 1 + Math.min(inGameStreak * 0.1, 0.5);
  const m_speed = timeSeconds <= 2 ? 1.2 : timeSeconds <= 5 ? 1.1 : 1.0;
  const m_perf = correct && timeSeconds <= 1.0 ? 2.0 : 1.0;
  const total = Math.round(base * m_streak * Math.max(m_speed, m_perf));
  return { total, reason: `Follow The Money · ${difficulty} · streak x${m_streak.toFixed(1)} · speed ${timeSeconds.toFixed(1)}s` };
}

export function useAwardFollowMoneyXP() {
  const { awardXPWithFeedback /*, progress*/ } = useXP();
  return (difficulty: DifficultyLevel, inGameStreak: number, timeSeconds: number, correct: boolean) => {
    const { total, reason } = computeRoundXP(difficulty, inGameStreak, timeSeconds, correct);
    // Optional: include daily streak multiplier from xp-system
    // const withDaily = calculateXPReward(total, { streak: progress.streak }).amount;
    awardXPWithFeedback(total, reason);
  };
}
```

Win/loss & streaks
- Win: selected shell index equals `moneyPosition`. Increase `streak` by 1, award XP.
- Loss: reset in‑game streak to 0 (does not affect daily streak). Award 0 XP by default.
- Optional pity XP: 5–10 XP on Expert incorrect to soften losses (off by default).

## 5) Feedback and Results

Correct
- Reveal and bounce the winning shell; emit coin particles; play success SFX.
- Toast: “+{XP} XP · {reason}”.

Incorrect
- Shake selected shell; highlight correct shell; subtle “miss” SFX.
- On Expert, allow slow‑motion replay of last 2 swaps (deterministic, same seed) for learning value.

Results modal (Phase `complete`)
- Show difficulty, correctness, selected vs. correct index, XP awarded, in‑game streak.
- CTA: “Play Again” (same seed → replay mode) and “New Round” (new seed).

## 6) Accessibility

Keyboard
- `Tab` to move focus between shells; `ArrowLeft/Right` to shift focus among shells; `Enter/Space` to select.
- Disable focus during `shuffling` and restore when `selecting` begins; move focus to the first shell automatically with `aria-live` announcement.

ARIA and semantics
- Each shell: `role="button"`, `tabIndex=0`, `aria-pressed` (when selected), `aria-label` like “Shell 2 of 5”.
- Status region: `aria-live="polite"` for phase changes and results; `aria-live="assertive"` only for errors.
- Images have `alt` text; decorative particles use `aria-hidden="true"`.

Reduced motion
- Respect `prefers-reduced-motion`: shorten shuffle count by 50% or switch to stepwise fade highlights; disable parallax/particles.

Focus visibility
- Always show visible focus ring; no outline suppression.

Example (shell button)

```tsx
<button
  role="button"
  tabIndex={phase === 'selecting' ? 0 : -1}
  aria-pressed={isSelected}
  aria-label={`Shell ${i + 1} of ${total}`}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(i)}
  onClick={() => onSelect(i)}
  disabled={phase !== 'selecting'}
  className="focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
/>
```

## 7) Performance Targets

- 60 FPS animations; animate only `transform`/`opacity` with GPU acceleration (`translate3d`, `will-change: transform`).
- Input → visual response < 100 ms even during animations; selection highlight appears immediately while reveal queues.
- Preload and decode sprites before first shuffle; use `HTMLImageElement.decode()`.
- Avoid reflow: use absolute positioning for shells; precompute positions.
- Anime.js options: `autoplay: false`, batch timelines; call `timeline.play()` only once per swap.
- Instrumentation: use `performance.now()` to measure selection latency; log P95 in dev console.

## 8) Edge Cases & Error Handling

- Early input: clicks/keys during `shuffling` are ignored (no focusable elements). Visual affordance shows “Wait…” tooltip.
- Double input: dedupe by guarding on phase and a local `isSelecting` ref.
- Offscreen/resizes: on resize, freeze animations, recompute positions, resume next frame.
- Lost tab focus: pause timeline on `visibilitychange` (hidden), resume on visible.
- PRNG safety: if `seed` is empty or `NaN` hash, fall back to a default seed string and log a warning.
- XP awarding failure (API): `awardXPWithFeedback` persists to localStorage first; API failure is non‑fatal (see `useXPSystem.tsx`).
- Reduced motion: if detected mid‑game, immediately switch to reduced shuffle variant.
- Mobile: ensure hit targets ≥ 44×44 dp; avoid overflow; lock orientation if necessary.

## 9) Implementation Notes (React + Anime.js)

Positions

```ts
// Place shells on a horizontal line or arc (mobile‑first)
const positions = Array.from({ length: cfg.shells }, (_, i) => ({ x: i * gap, y: 0 }));
// For arc: compute polar coordinates with fixed radius; map to x/y.
```

Shuffle animation

```ts
import anime from 'animejs';

function animateSwap(aEl: HTMLElement, bEl: HTMLElement, aPos: {x:number,y:number}, bPos: {x:number,y:number}, dur: number) {
  const t = anime.timeline({ duration: dur, easing: 'easeInOutSine' });
  t.add({ targets: aEl, translateX: bPos.x, translateY: bPos.y }, 0);
  t.add({ targets: bEl, translateX: aPos.x, translateY: aPos.y }, 0);
  return t.finished; // Promise
}
```

## 10) Telemetry (Determinism + Replay)

Log the following on each round completion (dev console for now; later to `/api/learner-state`):
- `seed`, `difficulty`, `initialMoneyIndex`, `shuffleSequence` hash (e.g., `xxhash64`), `selectedIndex`, `correctIndex`, `timeToSelectMs`, `xpAwarded`, `inGameStreakAfter`.

Replay
- Replay mode uses the same seed and difficulty to reconstruct start index and swaps, verifying determinism end‑to‑end.

---

Appendix A — Compatibility Guarantees

- All difficulty constants come from `DIFFICULTY_CONFIGS` in `lib/games/follow-the-money/types.ts`.
- All public types used above are aligned with `DifficultyLevel`, `DifficultyConfig`, `ShuffleSwap`, `GameState`, and `GameResult` from the same file.
- XP integration uses `XPProvider`’s `awardXPWithFeedback(amount, reason?)` and does not create new global state.

