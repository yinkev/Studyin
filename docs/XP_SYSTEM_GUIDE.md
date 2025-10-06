# XP System Architecture & Usage Guide

**Version**: 1.0.0
**Date**: 2025-10-06
**Status**: ✅ Core Implementation Complete

## Overview

The XP (Experience Points) system is a gamification layer that rewards user actions with points, tracks level progression, and provides visual feedback through animations and notifications.

## Architecture

### Core Components

```
lib/xp-system.ts          → Core logic (XP calculation, level progression)
lib/hooks/useXPSystem.tsx → React hook (state management + localStorage)
components/XPProvider.tsx → Global context (visual feedback integration)
```

### Data Flow

```
User Action
    ↓
awardXPWithFeedback(amount, reason)
    ↓
useXPSystem.awardXP(amount)
    ↓
Calculate new XP/level
    ↓
Update localStorage
    ↓
Trigger visual feedback
    ├→ XPGainToast (slide-in notification)
    └→ LevelUpBurst (confetti + badge animation)
```

## Core Logic (`lib/xp-system.ts`)

### XP Curve

**Formula**: `baseXP * (level ^ 1.5)`

```typescript
export function getXPForLevel(level: number): number {
  const baseXP = 1000;
  return Math.floor(baseXP * Math.pow(level, 1.5));
}
```

**Example Progression**:
- Level 1 → 2: 1,000 XP
- Level 2 → 3: 2,828 XP
- Level 5 → 6: 11,180 XP
- Level 10 → 11: 31,623 XP
- Level 50 → 51: 353,553 XP

### Data Structures

#### UserProgress
```typescript
export interface UserProgress {
  level: number;            // Current level (starts at 1)
  currentXP: number;        // XP toward next level
  totalXP: number;          // Lifetime XP earned
  streak: number;           // Consecutive study days
  lastStudyDate: string | null; // Last study session date
}
```

#### LevelInfo
```typescript
export interface LevelInfo {
  level: number;            // Current level
  currentXP: number;        // XP in current level
  xpForCurrentLevel: number; // Total XP needed for current level
  xpForNextLevel: number;   // Total XP needed for next level
  xpToNextLevel: number;    // Remaining XP to next level
  percentComplete: number;  // Progress % (0-100)
  title: string;            // Level title (e.g., "Resident")
}
```

### XP Rewards

```typescript
export const XP_REWARDS = {
  QUESTION_CORRECT: 10,         // Correct answer
  QUESTION_CORRECT_FAST: 15,    // Correct answer under 5s
  LESSON_COMPLETE: 100,         // Finish a lesson
  LESSON_PERFECT: 200,          // 100% accuracy on lesson
  STREAK_WEEK: 150,             // 7-day study streak
  TOPIC_MASTERED: 500,          // Master a topic (90%+ accuracy)
} as const;
```

### Level Titles

```typescript
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Medical Grandmaster';
  if (level >= 75) return 'Clinical Expert';
  if (level >= 50) return 'Attending Physician';
  if (level >= 25) return 'Senior Resident';
  if (level >= 10) return 'Resident';
  return 'Novice';
}
```

## React Hook (`lib/hooks/useXPSystem.tsx`)

### Usage

```typescript
import { useXPSystem } from '../lib/hooks/useXPSystem';

function MyComponent() {
  const {
    progress,      // UserProgress object
    levelInfo,     // LevelInfo object
    isLoading,     // Boolean (loading from localStorage)
    awardXP,       // Function to award XP
    resetProgress, // Function to reset all progress
    updateStreakDaily, // Function to update daily streak
  } = useXPSystem();

  // Award XP
  const handleCorrectAnswer = () => {
    const result = awardXP(10, 'Correct answer!');
    if (result.leveledUp) {
      console.log(`Level up! New level: ${result.newLevel}`);
    }
  };

  return (
    <div>
      <p>Level: {levelInfo.level}</p>
      <p>XP: {levelInfo.currentXP} / {levelInfo.xpToNextLevel}</p>
      <p>Title: {levelInfo.title}</p>
    </div>
  );
}
```

### Return Values

#### `progress: UserProgress`
Current user progress (level, XP, streak)

#### `levelInfo: LevelInfo`
Calculated level information (XP requirements, progress %)

#### `isLoading: boolean`
True while loading from localStorage (prevents hydration mismatch)

#### `awardXP(amount: number, reason?: string): AwardXPResult`
Awards XP and returns result:
```typescript
interface AwardXPResult {
  leveledUp: boolean;      // Did user level up?
  newLevel?: number;       // New level if leveled up
  newLevelInfo: LevelInfo; // Updated level info
}
```

#### `resetProgress(): void`
Resets all progress to default (Level 1, 0 XP, 0 streak)

#### `updateStreakDaily(): void`
Call once per day when user studies to increment streak

### Persistence

All progress is automatically persisted to localStorage under key `studyin-xp-progress`.

**Storage format**:
```json
{
  "level": 5,
  "currentXP": 2500,
  "totalXP": 25000,
  "streak": 14,
  "lastStudyDate": "2025-10-06"
}
```

## Global Provider (`components/XPProvider.tsx`)

### Setup

Wrap your app with `XPProvider` in `app/providers.tsx`:

```typescript
import { XPProvider } from '../components/XPProvider';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <XPProvider>{children}</XPProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Usage

```typescript
import { useXP } from '../components/XPProvider';

function MyComponent() {
  const {
    progress,
    levelInfo,
    awardXPWithFeedback, // ← Use this for visual feedback!
    resetProgress,
    updateStreakDaily,
  } = useXP();

  const handleAction = () => {
    // Awards XP + shows toast + level up animation
    awardXPWithFeedback(10, 'Correct answer!');
  };
}
```

### Visual Feedback

#### XP Toast (`XPGainToast.tsx`)
- Slides in from top-right
- Shows "+X XP" with optional reason
- Pulsing glow effect
- Auto-dismisses after 2 seconds

#### Level Up Animation (`LevelUpBurst.tsx`)
- Full-screen confetti explosion (50 particles)
- Flash effect
- Rotating level badge (0° → 360°)
- Floating "LEVEL UP!" text
- Auto-dismisses after 3 seconds

## Integration Examples

### Study Session

```typescript
import { useXP } from '../components/XPProvider';
import { XP_REWARDS } from '../lib/xp-system';

function StudySession() {
  const { awardXPWithFeedback } = useXP();

  const handleAnswerSubmit = (isCorrect: boolean, timeMs: number) => {
    if (isCorrect) {
      const isFast = timeMs < 5000;
      const xp = isFast
        ? XP_REWARDS.QUESTION_CORRECT_FAST
        : XP_REWARDS.QUESTION_CORRECT;
      const reason = isFast ? 'Fast & Correct!' : 'Correct!';

      awardXPWithFeedback(xp, reason);
    }
  };

  const handleLessonComplete = (accuracy: number) => {
    const isPerfect = accuracy >= 1.0;
    const xp = isPerfect
      ? XP_REWARDS.LESSON_PERFECT
      : XP_REWARDS.LESSON_COMPLETE;
    const reason = isPerfect ? 'Perfect Lesson!' : 'Lesson Complete!';

    awardXPWithFeedback(xp, reason);
  };

  return <div>...</div>;
}
```

### Daily Streak

```typescript
import { useXP } from '../components/XPProvider';
import { XP_REWARDS } from '../lib/xp-system';

function DailyStreakTracker() {
  const { progress, updateStreakDaily, awardXPWithFeedback } = useXP();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (progress.lastStudyDate !== today) {
      updateStreakDaily();

      // Award bonus XP for week streak
      if ((progress.streak + 1) % 7 === 0) {
        awardXPWithFeedback(XP_REWARDS.STREAK_WEEK, '7-Day Streak!');
      }
    }
  }, []);

  return (
    <div>
      <span>🔥 {progress.streak} days</span>
    </div>
  );
}
```

### Topic Mastery

```typescript
import { useXP } from '../components/XPProvider';
import { XP_REWARDS } from '../lib/xp-system';

function TopicTracker() {
  const { awardXPWithFeedback } = useXP();

  const checkMastery = (topicId: string, accuracy: number) => {
    if (accuracy >= 0.9) {
      awardXPWithFeedback(XP_REWARDS.TOPIC_MASTERED, 'Topic Mastered!');
      console.log(`Mastered: ${topicId}`);
    }
  };

  return <div>...</div>;
}
```

## Development Tools

### XP Dev Panel (`components/dev/XPDevPanel.tsx`)

Located in bottom-left corner (only in development mode).

**Features**:
- View current stats (level, XP, streak)
- Quick action buttons:
  - +10 XP (Correct!)
  - +15 XP (Fast!)
  - +100 XP (Complete!)
  - +200 XP (Perfect!)
- 🚀 Trigger Level Up button
- 🔄 Reset Progress button

**Usage**:
```tsx
import { XPDevPanel } from '../components/dev/XPDevPanel';

// In your layout
<AppShell>
  {children}
  <XPDevPanel /> {/* Auto-hides in production */}
</AppShell>
```

### Testing

```typescript
// In browser console
localStorage.getItem('studyin-xp-progress')

// Set custom level
localStorage.setItem('studyin-xp-progress', JSON.stringify({
  level: 50,
  currentXP: 5000,
  totalXP: 500000,
  streak: 30,
  lastStudyDate: '2025-10-06'
}));

// Clear progress
localStorage.removeItem('studyin-xp-progress');
location.reload();
```

## Configuration

### Adjust XP Curve

Edit `lib/xp-system.ts`:

```typescript
export function getXPForLevel(level: number): number {
  const baseXP = 1000;      // ← Change base XP
  const exponent = 1.5;     // ← Change curve (1.0 = linear, 2.0 = quadratic)
  return Math.floor(baseXP * Math.pow(level, exponent));
}
```

### Adjust Rewards

Edit `XP_REWARDS` in `lib/xp-system.ts`:

```typescript
export const XP_REWARDS = {
  QUESTION_CORRECT: 10,         // ← Increase/decrease
  QUESTION_CORRECT_FAST: 15,
  LESSON_COMPLETE: 100,
  LESSON_PERFECT: 200,
  STREAK_WEEK: 150,
  TOPIC_MASTERED: 500,
} as const;
```

### Adjust Level Titles

Edit `getLevelTitle()` in `lib/xp-system.ts`:

```typescript
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Custom Title';
  // ... add more tiers
}
```

### Adjust Animation Duration

Edit `LevelUpBurst.tsx`:
```typescript
const timeout = setTimeout(() => {
  // ... fade out
}, 3000); // ← Change duration (ms)
```

Edit `XPGainToast.tsx`:
```typescript
const timeout = setTimeout(() => {
  // ... slide out
}, duration); // Default: 2000ms
```

## Performance Considerations

### localStorage Limits
- 5-10 MB typical limit per domain
- XP data is ~200 bytes
- No pagination needed for XP system

### Animation Performance
- Uses GPU-accelerated transforms
- Checks `prefers-reduced-motion`
- Confetti particles use `onComplete` cleanup

### Re-render Optimization
- XP context uses React.memo where needed
- localStorage writes are debounced via useEffect
- Level calculations are pure functions (no side effects)

## Troubleshooting

### XP not persisting
1. Check localStorage is enabled in browser
2. Verify XPProvider wraps entire app
3. Check browser dev tools → Application → Local Storage

### Level up animation not triggering
1. Verify `awardXPWithFeedback` is used (not `awardXP`)
2. Check browser console for errors
3. Test with "🚀 Trigger Level Up" button in dev panel

### Animations laggy
1. Check CPU usage (Activity Monitor/Task Manager)
2. Reduce confetti particle count in `LevelUpBurst.tsx`
3. Check `prefers-reduced-motion` setting

### Level calculations incorrect
1. Verify XP curve function in `lib/xp-system.ts`
2. Check `totalXP` vs `currentXP` logic
3. Test with known values: Level 1 = 1000 XP, Level 2 = 2828 XP

## Future Enhancements

### Phase 2
- [ ] Achievement badges system
- [ ] XP multipliers (streak bonuses)
- [ ] Leaderboards (weekly/monthly)
- [ ] XP history graph
- [ ] Custom level titles

### Phase 3
- [ ] Sound effects for XP/level up
- [ ] Particle color customization
- [ ] XP boost power-ups
- [ ] Seasonal XP events
- [ ] Social XP sharing

## API Reference

### Core Functions

#### `getXPForLevel(level: number): number`
Returns total XP required to reach a level.

#### `getLevelProgress(totalXP: number): LevelInfo`
Calculates current level and progress from total XP.

#### `getLevelTitle(level: number): string`
Returns title for a given level.

### Hook Functions

#### `useXPSystem(): UseXPSystemReturn`
Main hook for XP system.

#### `useXP(): XPContextValue`
Context hook with visual feedback (use this in components).

### Component Props

#### `LevelUpBurst`
```typescript
interface LevelUpBurstProps {
  level: number;           // New level achieved
  onComplete?: () => void; // Callback when animation ends
}
```

#### `XPGainToast`
```typescript
interface XPGainToastProps {
  amount: number;          // XP amount gained
  reason?: string;         // Optional reason text
  onDismiss?: () => void;  // Callback when dismissed
  duration?: number;       // Duration in ms (default: 2000)
}
```

## Resources

- [React Context Docs](https://react.dev/reference/react/useContext)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [anime.js v4 Docs](https://animejs.com/documentation/)

## Credits

**Design**: Gamification with INFJ principles
**Implementation**: React Context + localStorage
**Animations**: anime.js v4
**Testing**: Playwright
**Date**: 2025-10-06
