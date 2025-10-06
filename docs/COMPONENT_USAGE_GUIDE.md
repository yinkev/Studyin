# MAX GRAPHICS Component Usage Guide

**Version**: 1.0.0
**Date**: 2025-10-06

## Overview

This guide documents all MAX GRAPHICS UI components, their props, usage examples, and styling guidelines.

## Table of Contents

1. [Layout Components](#layout-components)
2. [Effect Components](#effect-components)
3. [Dev Components](#dev-components)
4. [CSS Effect Classes](#css-effect-classes)
5. [Animation Patterns](#animation-patterns)

---

## Layout Components

### AppShell

**File**: `components/layout/AppShell.tsx`

Full application shell with 3-column hybrid layout (Mission Control + Skill Tree + Telemetry).

#### Props

```typescript
interface AppShellProps {
  children: ReactNode;
  hideContext?: boolean;  // Hide right telemetry panel
  hideNav?: boolean;      // Hide left mission/tree panel
}
```

#### Usage

```tsx
import { AppShell } from './components/layout/AppShell';

<AppShell>
  <YourPageContent />
</AppShell>

// Hide panels
<AppShell hideContext hideNav>
  <FullWidthContent />
</AppShell>
```

#### Features

- ✅ Animated XP bar in header
- ✅ Rotating level badge
- ✅ Streak counter with fire emoji
- ✅ Collapsible sidebars
- ✅ Mission/Skill Tree toggle
- ✅ Live telemetry stats
- ✅ Theme toggle
- ✅ Floating mascot animation

---

## Effect Components

### LevelUpBurst

**File**: `components/effects/LevelUpBurst.tsx`

Full-screen celebration animation when user levels up.

#### Props

```typescript
interface LevelUpBurstProps {
  level: number;           // New level achieved
  onComplete?: () => void; // Callback when animation ends
}
```

#### Usage

```tsx
import LevelUpBurst from './components/effects/LevelUpBurst';

const [showLevelUp, setShowLevelUp] = useState(false);
const [newLevel, setNewLevel] = useState(0);

// Trigger level up
const handleLevelUp = (level: number) => {
  setNewLevel(level);
  setShowLevelUp(true);
};

{showLevelUp && (
  <LevelUpBurst
    level={newLevel}
    onComplete={() => setShowLevelUp(false)}
  />
)}
```

#### Features

- ✅ 50 confetti particles radiating outward
- ✅ Flash effect on container
- ✅ Rotating level badge (0° → 360°, elastic easing)
- ✅ Floating "LEVEL UP!" text
- ✅ Auto-dismisses after 3 seconds

#### Animation Details

- **Duration**: 3000ms total
- **Confetti**: 1500-2000ms per particle
- **Badge rotation**: 1000ms with `outElastic` easing
- **Flash**: 200ms fade-in
- **XP text**: 800ms slide-up with 500ms delay

---

### XPGainToast

**File**: `components/effects/XPGainToast.tsx`

Animated toast notification showing XP gained.

#### Props

```typescript
interface XPGainToastProps {
  amount: number;          // XP amount
  reason?: string;         // Optional reason text
  onDismiss?: () => void;  // Callback when dismissed
  duration?: number;       // Duration in ms (default: 2000)
}
```

#### Usage

```tsx
import XPGainToast from './components/effects/XPGainToast';

const [notifications, setNotifications] = useState<XPNotification[]>([]);

// Add notification
const showXPGain = (amount: number, reason?: string) => {
  const id = Date.now();
  setNotifications(prev => [...prev, { id, amount, reason }]);
};

// Remove notification
const removeNotification = (id: number) => {
  setNotifications(prev => prev.filter(n => n.id !== id));
};

{notifications.map(notif => (
  <XPGainToast
    key={notif.id}
    amount={notif.amount}
    reason={notif.reason}
    onDismiss={() => removeNotification(notif.id)}
    duration={2000}
  />
))}
```

#### Features

- ✅ Slides in from right with `outBack` easing
- ✅ Pulsing glow effect
- ✅ Shows "+X XP" with tabular numbers
- ✅ Optional reason text
- ✅ Auto-dismisses after duration

#### Positioning

- **Location**: Top-right corner (top: 5rem, right: 1rem)
- **Z-index**: 50
- **Multiple toasts**: Stack vertically (manage manually)

---

### ConfettiBurst

**File**: `components/effects/ConfettiBurst.tsx`

Confetti particle explosion from a specific origin point.

#### Props

```typescript
interface ConfettiBurstProps {
  trigger: boolean;        // Set to true to trigger burst
  origin: { x: number; y: number };  // Screen coordinates
  particleCount?: number;  // Default: 60
}
```

#### Usage

```tsx
import { ConfettiBurst } from './components/effects/ConfettiBurst';

const [confettiTrigger, setConfettiTrigger] = useState(false);
const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });

const handleClick = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setConfettiOrigin({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
  setConfettiTrigger(true);
  setTimeout(() => setConfettiTrigger(false), 100);
};

<button onClick={handleClick}>Click me!</button>

<ConfettiBurst
  trigger={confettiTrigger}
  origin={confettiOrigin}
  particleCount={60}
/>
```

#### Features

- ✅ Particles shoot outward in all directions
- ✅ Random colors (cyan, purple, green, yellow, red)
- ✅ Fade and scale down
- ✅ Auto-cleanup when complete

---

### MasteryBurst

**File**: `components/effects/MasteryBurst.tsx`

Similar to LevelUpBurst but for achieving mastery in a topic.

#### Props

```typescript
interface MasteryBurstProps {
  topic: string;           // Topic name
  onComplete?: () => void;
}
```

#### Usage

```tsx
import MasteryBurst from './components/effects/MasteryBurst';

const [showMastery, setShowMastery] = useState(false);
const [masteredTopic, setMasteredTopic] = useState('');

const handleMastery = (topic: string) => {
  setMasteredTopic(topic);
  setShowMastery(true);
};

{showMastery && (
  <MasteryBurst
    topic={masteredTopic}
    onComplete={() => setShowMastery(false)}
  />
)}
```

---

## Dev Components

### XPDevPanel

**File**: `components/dev/XPDevPanel.tsx`

Development panel for testing XP system. Only visible in development mode.

#### Props

None (auto-detects `process.env.NODE_ENV`)

#### Usage

```tsx
import XPDevPanel from './components/dev/XPDevPanel';

// In your layout (automatically hides in production)
<AppShell>
  {children}
  <XPDevPanel />
</AppShell>
```

#### Features

- ✅ Toggle button in bottom-left corner
- ✅ Current stats display (level, XP, streak)
- ✅ Quick action buttons (+10, +15, +100, +200 XP)
- ✅ "🚀 Trigger Level Up" button
- ✅ "🔄 Reset Progress" button with confirmation

---

## CSS Effect Classes

Located in `app/globals.css`

### Glowing Text

```css
.glow-text-cyan    /* Cyan glowing text */
.glow-text-purple  /* Purple glowing text */
.glow-text-green   /* Green glowing text */

.holographic       /* Rainbow gradient text */
.accent-trust      /* Cyan accent color */
.accent-mastery    /* Purple accent color */
.accent-analysis   /* Green accent color */
```

**Usage**:
```tsx
<h1 className="glow-text-cyan">Glowing Title</h1>
<span className="holographic">Rainbow Text</span>
```

### Borders & Shadows

```css
.glow-border         /* Strong glowing border */
.glow-border-subtle  /* Subtle glowing border */
.shadow-glow-cyan    /* Cyan box shadow */
.shadow-glow-purple  /* Purple box shadow */
```

**Usage**:
```tsx
<div className="glow-border p-4">Glowing box</div>
```

### Glass Morphism

```css
.glass-max    /* Maximum blur glass effect */
.glass-subtle /* Subtle glass effect */
```

**Usage**:
```tsx
<div className="glass-max p-6 rounded-lg">
  Glass card content
</div>
```

### Cards & Containers

```css
.mission-card    /* Card with hover effects */
.duo-card        /* Two-tone card */
.level-badge     /* Rotating level badge */
```

**Usage**:
```tsx
<div className="mission-card p-4 rounded-lg">
  <h3>Mission Title</h3>
  <p>Mission description</p>
</div>
```

### Progress & Indicators

```css
.xp-bar           /* Animated XP progress bar */
.progress-glow    /* Glowing progress bar */
```

**Usage**:
```tsx
<div className="h-2 bg-tertiary/10 rounded-full">
  <div className="xp-bar h-full" style={{ width: '75%' }} />
</div>
```

### Buttons

```css
.neon-button    /* Glowing button */
```

**Usage**:
```tsx
<button className="neon-button px-4 py-2 rounded-lg">
  Click Me
</button>
```

### Overlays

```css
.scanlines    /* CRT scanline overlay */
.shimmer      /* Moving shimmer effect */
```

**Usage**:
```tsx
<div className="scanlines">
  <YourContent />
</div>
```

### Animations

```css
.animate-pulse-glow   /* Pulsing glow */
.animate-shimmer      /* Shimmer effect */
.animate-float        /* Subtle floating */
.animate-spin-slow    /* Slow rotation */
```

**Usage**:
```tsx
<div className="animate-pulse-glow">✨</div>
<div className="animate-float">🎮</div>
```

---

## Animation Patterns

### Basic anime.js Usage

```typescript
import { animate as anime } from 'animejs';

// Simple animation
anime(element, {
  translateX: { from: 0, to: 100 },
  opacity: { from: 0, to: 1 },
  duration: 300,
  ease: 'outQuad',
});

// From-to animation
anime(element, {
  scale: { from: 0.8, to: 1 },
  rotate: { from: 0, to: 360 },
  duration: 1000,
  ease: 'outElastic',
});

// Keyframe animation
anime(element, {
  scale: [
    { to: 1.2 },
    { to: 1 }
  ],
  duration: 600,
  ease: 'outExpo',
});

// Loop animation
anime(element, {
  translateY: { from: -5, to: 5 },
  alternate: true,
  loop: true,
  duration: 2000,
  ease: 'inOutSine',
});
```

### Common Easing Functions

```typescript
'outQuad'      // Deceleration
'outExpo'      // Sharp deceleration
'outElastic'   // Bounce effect
'outBack'      // Overshoot effect
'inOutSine'    // Smooth in/out
'inOutQuad'    // Quadratic in/out
```

### Performance Best Practices

1. **Use transforms over other properties**
   ```typescript
   // ✅ Good (GPU-accelerated)
   translateX, translateY, scale, rotate, opacity

   // ❌ Avoid (causes reflow)
   left, top, width, height, margin
   ```

2. **Check prefers-reduced-motion**
   ```typescript
   if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
     anime(element, { /* ... */ });
   }
   ```

3. **Clean up animations**
   ```typescript
   useEffect(() => {
     const animation = anime(element, { /* ... */ });
     return () => animation.pause();
   }, []);
   ```

4. **Use will-change for animations**
   ```css
   .animating-element {
     will-change: transform, opacity;
   }
   ```

---

## Color System

### Theme Colors

```typescript
// Dark Mode (Default)
--bg-space: #050814
--bg-primary: #0a0e1a
--bg-secondary: #14162e
--bg-tertiary: #1f2247

--text-primary: #e2e8f0
--text-secondary: #94a3b8
--text-tertiary: #64748b

--accent-trust: #22d3ee        // Cyan
--accent-mastery: #a78bfa      // Purple
--accent-analysis: #34d399     // Green

// Light Mode
--bg-primary: #f8fafc
--bg-secondary: #f1f5f9
--accent-trust: #0891b2
```

### Using Colors

```tsx
// Tailwind classes
<div className="bg-primary text-primary">Content</div>
<div className="bg-secondary text-secondary">Secondary</div>
<span className="accent-trust">Trust text</span>

// CSS variables
<div style={{ backgroundColor: 'var(--bg-primary)' }}>Content</div>
```

---

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Hiding Panels

```tsx
// Hide context panel on mobile
<AppShell hideContext={windowWidth < 1024}>
  {children}
</AppShell>

// Conditionally show telemetry
<div className="hidden xl:block">
  <TelemetryPanel />
</div>
```

---

## Accessibility Considerations

⚠️ **Note**: This project explicitly prioritizes visual excellence over accessibility as per requirements. However, consider these for future iterations:

- Add `aria-label` to icon-only buttons
- Include `role="button"` on clickable divs
- Provide keyboard navigation for interactive elements
- Add `prefers-reduced-motion` checks for animations

---

## Common Patterns

### Pattern 1: Award XP with Visual Feedback

```typescript
import { useXP } from './components/XPProvider';
import { XP_REWARDS } from './lib/xp-system';

function MyComponent() {
  const { awardXPWithFeedback } = useXP();

  const handleAction = () => {
    awardXPWithFeedback(XP_REWARDS.QUESTION_CORRECT, 'Correct answer!');
  };

  return <button onClick={handleAction}>Submit</button>;
}
```

### Pattern 2: Conditional Animation

```typescript
const [shouldAnimate, setShouldAnimate] = useState(false);

useEffect(() => {
  if (shouldAnimate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    anime(element, {
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'outBack',
    });
  }
}, [shouldAnimate]);
```

### Pattern 3: Stacked Notifications

```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);

const addNotification = (content: string) => {
  const id = Date.now();
  setNotifications(prev => [...prev, { id, content }]);
};

{notifications.map((notif, index) => (
  <div
    key={notif.id}
    style={{ top: `${5 + index * 5}rem` }}
    className="fixed right-4 z-50"
  >
    {notif.content}
  </div>
))}
```

---

## Resources

- [anime.js v4 Documentation](https://animejs.com/documentation/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Context Guide](https://react.dev/reference/react/useContext)
- [XP System Guide](./XP_SYSTEM_GUIDE.md)
- [Animation Migration Guide](./ANIMEJS_V4_MIGRATION.md)

---

## Credits

**Design**: MAX GRAPHICS with INFJ principles
**Implementation**: React + Tailwind + anime.js v4
**Date**: 2025-10-06
