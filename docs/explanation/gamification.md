# Gamification Rationale

Gamification in Studyin exists to sustain motivation without distorting learning objectives. It reinforces productive behaviors and provides clear, controllable feedback loops.

## Design Goals

- Reward deliberate practice, not guessing
- Encourage healthy streaks without punitive loss
- Keep cosmetic; never override adaptive scheduling

## XP & Levels

- Exponential XP curve (see `lib/xp-system.ts`)
- Rewards for correct answers, speed, and streaks; small XP for attempts to avoid zero‑sum frustration
- Level titles are cosmetic and motivational only

## Achievements

- Session milestones (accuracy, completion)
- Mastery badges when topics reach target `mastery_prob`

## Guardrails

- No loot boxes or gacha mechanics
- XP does not influence item selection or scoring
- Streaks cap to reduce pressure (e.g., ≤2× bonus)

