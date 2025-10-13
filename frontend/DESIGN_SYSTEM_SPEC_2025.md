# Design System Specification 2025
## Medical Education Learning Platform - Space/Cosmic Theme (No Gradients)

**Version**: 1.0
**Last Updated**: 2025-10-13
**Tech Stack**: React 19, Motion, Tailwind CSS 4.1.14, shadcn/ui, OKLCH color space

---

## Design Philosophy

### Core Principles
1. **No Gradients Rule**: All designs use solid colors only - depth achieved through layering, glassmorphism, and shadow elevation
2. **Space/Cosmic Theme**: Dark backgrounds with luminous accent colors, creating a focused learning environment
3. **Psychology-Driven**: Flow state optimization, intrinsic motivation, cognitive load management
4. **Medical Context**: Professional yet approachable for medical students
5. **Accessibility First**: WCAG AA minimum, keyboard navigation, ARIA labels, reduced motion support

### Design Inspiration Synthesis
Combining the best elements from three reference designs:
- **Image 1**: Space explorer theme, sidebar navigation, achievement badges, milestone timeline
- **Image 2**: Daily habits, circular progress rings, community features, achievement modals
- **Image 3**: Neuro-friendly summaries, milestone path visualization, soft pastel accents on dark

---

## Color System (OKLCH - Solid Colors Only)

### Dark Theme Foundation

#### Background Colors (Space Theme)
```css
/* Primary backgrounds - deep space */
--space-dark: oklch(0.15 0.02 265);           /* Deep navy-purple */
--space-darker: oklch(0.12 0.02 265);         /* Darker variant */
--space-darkest: oklch(0.08 0.02 265);        /* Almost black */

/* Surface colors - elevated panels */
--surface-elevated-1: oklch(0.18 0.03 265);   /* First elevation */
--surface-elevated-2: oklch(0.22 0.03 265);   /* Second elevation */
--surface-elevated-3: oklch(0.26 0.03 265);   /* Third elevation */

/* Glassmorphism surfaces */
--glass-dark: oklch(0.20 0.02 265 / 0.7);     /* Semi-transparent glass */
--glass-border: oklch(0.40 0.05 265 / 0.2);   /* Glass edge borders */
```

#### Accent Colors (Cosmic Energy)
```css
/* Primary - Cosmic Purple (knowledge, mastery) */
--cosmic-purple: oklch(0.60 0.20 280);        /* Bright purple */
--cosmic-purple-dim: oklch(0.50 0.18 280);    /* Dimmed variant */
--cosmic-purple-bright: oklch(0.70 0.22 280); /* Extra bright */

/* Secondary - Star Blue (progress, XP) */
--star-blue: oklch(0.65 0.15 240);            /* Bright blue */
--star-blue-dim: oklch(0.55 0.13 240);        /* Dimmed variant */
--star-blue-bright: oklch(0.75 0.17 240);     /* Extra bright */

/* Tertiary - Nebula Teal (flow state, achievements) */
--nebula-teal: oklch(0.68 0.14 200);          /* Teal-cyan */
--nebula-teal-dim: oklch(0.58 0.12 200);      /* Dimmed variant */
--nebula-teal-bright: oklch(0.78 0.16 200);   /* Extra bright */

/* Quaternary - Aurora Pink (streaks, rewards) */
--aurora-pink: oklch(0.72 0.18 340);          /* Soft pink */
--aurora-pink-dim: oklch(0.62 0.16 340);      /* Dimmed variant */
--aurora-pink-bright: oklch(0.82 0.20 340);   /* Extra bright */
```

#### Semantic Colors
```css
/* Success - Green (completed, correct answers) */
--success: oklch(0.65 0.15 150);              /* Bright green */
--success-dim: oklch(0.55 0.13 150);          /* Dimmed */
--success-bg: oklch(0.30 0.08 150 / 0.15);    /* Background tint */

/* Warning - Amber (at-risk streaks, review needed) */
--warning: oklch(0.75 0.15 80);               /* Bright amber */
--warning-dim: oklch(0.65 0.13 80);           /* Dimmed */
--warning-bg: oklch(0.35 0.08 80 / 0.15);     /* Background tint */

/* Danger - Red (incorrect, errors, critical) */
--danger: oklch(0.60 0.20 20);                /* Bright red */
--danger-dim: oklch(0.50 0.18 20);            /* Dimmed */
--danger-bg: oklch(0.30 0.10 20 / 0.15);      /* Background tint */

/* Info - Cyan (tips, information) */
--info: oklch(0.70 0.12 210);                 /* Bright cyan */
--info-dim: oklch(0.60 0.10 210);             /* Dimmed */
--info-bg: oklch(0.35 0.06 210 / 0.15);       /* Background tint */
```

#### Text Colors
```css
/* Text hierarchy */
--text-primary: oklch(0.95 0.02 265);         /* Almost white */
--text-secondary: oklch(0.75 0.04 265);       /* Muted white */
--text-tertiary: oklch(0.55 0.05 265);        /* Dim gray-purple */
--text-disabled: oklch(0.35 0.05 265);        /* Very dim */

/* Text on colored backgrounds */
--text-on-purple: oklch(1.0 0 0);             /* White on purple */
--text-on-blue: oklch(1.0 0 0);               /* White on blue */
--text-on-teal: oklch(0.12 0.02 265);         /* Dark on teal */
--text-on-pink: oklch(0.12 0.02 265);         /* Dark on pink */
```

#### Border Colors
```css
--border-subtle: oklch(0.30 0.03 265 / 0.3);  /* Very subtle */
--border-default: oklch(0.40 0.05 265 / 0.5); /* Default borders */
--border-strong: oklch(0.50 0.08 265 / 0.8);  /* Strong emphasis */
--border-accent: oklch(0.60 0.12 280 / 0.6);  /* Accent purple */
```

### Color Usage Guidelines

#### NO GRADIENTS - Depth Through Layering
Instead of gradients, create visual depth using:
1. **Multiple solid color layers** with different opacities
2. **Shadow elevation system** (see Shadows section)
3. **Glassmorphism** with backdrop-filter
4. **Border glow effects** (solid color with blur)

#### Example: Card Depth Without Gradients
```css
/* BAD - Uses gradient */
background: linear-gradient(135deg, purple, pink);

/* GOOD - Solid colors with layering */
background: var(--surface-elevated-1);
border: 1px solid var(--glass-border);
box-shadow:
  0 8px 32px oklch(0.08 0.02 265 / 0.4),
  inset 0 1px 0 oklch(0.40 0.05 265 / 0.15);
backdrop-filter: blur(16px);
```

---

## Typography System

### Font Families
```css
--font-display: 'Space Grotesk', system-ui, sans-serif;  /* Headings, hero text */
--font-body: 'Inter', system-ui, sans-serif;             /* Body text, UI */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;   /* Code, technical */
--font-pixel: 'Press Start 2P', monospace;               /* Easter eggs, retro */
```

### Type Scale (Fluid Typography)
```css
/* Headings */
--text-9xl: clamp(4.5rem, 8vw + 1rem, 7rem);     /* Hero titles */
--text-8xl: clamp(4rem, 7vw + 1rem, 6rem);       /* Page titles */
--text-7xl: clamp(3.5rem, 6vw + 1rem, 5rem);     /* Major sections */
--text-6xl: clamp(3rem, 5vw + 0.5rem, 4rem);     /* Section headers */
--text-5xl: clamp(2.5rem, 4vw + 0.5rem, 3.5rem); /* Card headers */
--text-4xl: clamp(2rem, 3vw + 0.5rem, 3rem);     /* Subheaders */
--text-3xl: clamp(1.75rem, 2.5vw + 0.5rem, 2.5rem); /* Small headers */
--text-2xl: clamp(1.5rem, 2vw + 0.25rem, 2rem);  /* Lead text */
--text-xl: clamp(1.25rem, 1.5vw + 0.25rem, 1.75rem); /* Large body */

/* Body text */
--text-lg: 1.125rem;   /* 18px - Large body */
--text-base: 1rem;     /* 16px - Default body */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions */
--text-2xs: 0.625rem;  /* 10px - Labels */
```

### Font Weights
```css
--font-thin: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### Line Heights
```css
--leading-tight: 1.15;   /* Headings */
--leading-snug: 1.35;    /* Compact text */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.75; /* Reading text */
--leading-loose: 2.0;    /* Spaced text */
```

### Letter Spacing
```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

---

## Spacing System

### Scale (rem-based for accessibility)
```css
--space-3xs: 0.125rem;  /* 2px */
--space-2xs: 0.25rem;   /* 4px */
--space-xs: 0.5rem;     /* 8px */
--space-sm: 0.75rem;    /* 12px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
--space-4xl: 6rem;      /* 96px */
--space-5xl: 8rem;      /* 128px */
```

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
--container-max: 1920px;  /* Dashboard max width */
```

### Bento Grid Gaps
```css
--bento-gap-mobile: var(--space-md);   /* 16px on mobile */
--bento-gap-tablet: var(--space-lg);   /* 24px on tablet */
--bento-gap-desktop: var(--space-xl);  /* 32px on desktop */
```

---

## Border Radius System

### Radius Scale
```css
--radius-none: 0;
--radius-sm: 0.375rem;    /* 6px - Tight corners */
--radius-md: 0.5rem;      /* 8px - Default */
--radius-lg: 0.75rem;     /* 12px - Cards */
--radius-xl: 1rem;        /* 16px - Large cards */
--radius-2xl: 1.5rem;     /* 24px - Feature cards */
--radius-3xl: 2rem;       /* 32px - Hero cards */
--radius-full: 9999px;    /* Pill shapes */
```

### Component Specific
```css
--radius-button: var(--radius-md);
--radius-input: var(--radius-md);
--radius-card: var(--radius-xl);
--radius-modal: var(--radius-2xl);
--radius-badge: var(--radius-full);
```

---

## Shadow System (NO GRADIENTS - Solid Color Shadows)

### Elevation Levels
```css
/* Level 0 - Flat */
--shadow-none: none;

/* Level 1 - Subtle lift */
--shadow-sm:
  0 1px 2px oklch(0.08 0.02 265 / 0.1);

/* Level 2 - Default cards */
--shadow-md:
  0 4px 6px oklch(0.08 0.02 265 / 0.15),
  0 2px 4px oklch(0.08 0.02 265 / 0.1);

/* Level 3 - Elevated cards */
--shadow-lg:
  0 10px 15px oklch(0.08 0.02 265 / 0.2),
  0 4px 6px oklch(0.08 0.02 265 / 0.15);

/* Level 4 - Floating elements */
--shadow-xl:
  0 20px 25px oklch(0.08 0.02 265 / 0.25),
  0 8px 10px oklch(0.08 0.02 265 / 0.15);

/* Level 5 - Modals, overlays */
--shadow-2xl:
  0 25px 50px oklch(0.08 0.02 265 / 0.35),
  0 12px 24px oklch(0.08 0.02 265 / 0.2);
```

### Glow Effects (Accent Shadows)
```css
/* Cosmic glow - purple */
--glow-purple:
  0 0 20px oklch(0.60 0.20 280 / 0.3),
  0 0 40px oklch(0.60 0.20 280 / 0.15);

/* Star glow - blue */
--glow-blue:
  0 0 20px oklch(0.65 0.15 240 / 0.3),
  0 0 40px oklch(0.65 0.15 240 / 0.15);

/* Nebula glow - teal */
--glow-teal:
  0 0 20px oklch(0.68 0.14 200 / 0.3),
  0 0 40px oklch(0.68 0.14 200 / 0.15);

/* Aurora glow - pink */
--glow-pink:
  0 0 20px oklch(0.72 0.18 340 / 0.3),
  0 0 40px oklch(0.72 0.18 340 / 0.15);
```

### Inner Shadows (Depth)
```css
--shadow-inner-subtle:
  inset 0 1px 2px oklch(0.08 0.02 265 / 0.1);

--shadow-inner-strong:
  inset 0 2px 4px oklch(0.08 0.02 265 / 0.2);

--shadow-inner-glow:
  inset 0 1px 0 oklch(0.40 0.05 265 / 0.15);
```

---

## Glassmorphism System

### Glass Card Variants
```css
/* Default glass - semi-transparent with blur */
.glass-default {
  background: oklch(0.20 0.02 265 / 0.7);
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid oklch(0.40 0.05 265 / 0.2);
  box-shadow: var(--shadow-lg);
}

/* Strong glass - more opaque */
.glass-strong {
  background: oklch(0.22 0.02 265 / 0.85);
  backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid oklch(0.40 0.05 265 / 0.3);
  box-shadow: var(--shadow-xl);
}

/* Subtle glass - very transparent */
.glass-subtle {
  background: oklch(0.18 0.02 265 / 0.5);
  backdrop-filter: blur(12px) saturate(1.1);
  border: 1px solid oklch(0.40 0.05 265 / 0.15);
  box-shadow: var(--shadow-md);
}

/* Accent glass - colored tint */
.glass-accent-purple {
  background: oklch(0.25 0.08 280 / 0.6);
  backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid oklch(0.60 0.20 280 / 0.3);
  box-shadow: var(--shadow-lg), var(--glow-purple);
}
```

### Frosted Border Technique (No Gradient Alternative)
```css
.frosted-border {
  position: relative;
  background: var(--surface-elevated-1);
  border-radius: var(--radius-xl);
}

/* Top edge highlight - solid color */
.frosted-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: oklch(0.60 0.08 265 / 0.3);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

/* Glow effect - solid color with blur */
.frosted-border::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: var(--radius-xl);
  background: transparent;
  box-shadow:
    0 0 0 1px oklch(0.40 0.05 265 / 0.2),
    0 0 20px oklch(0.60 0.20 280 / 0.15);
  pointer-events: none;
  z-index: -1;
}
```

---

## Animation System

### Motion Configuration
```typescript
// Motion library spring physics
export const springPresets = {
  // Gentle - UI elements, cards
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    mass: 1
  },

  // Snappy - buttons, interactions
  snappy: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.8
  },

  // Bouncy - success states, achievements
  bouncy: {
    type: 'spring',
    stiffness: 200,
    damping: 10,
    mass: 1.2
  },

  // Slow - large modals, page transitions
  slow: {
    type: 'spring',
    stiffness: 80,
    damping: 20,
    mass: 1.5
  }
};

// Duration-based (fallback for non-spring)
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 700
};

// Easing curves
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.4, 0, 0.6, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55]
};
```

### Animation Patterns

#### 1. Stagger Children (Dashboard Cards)
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,  // 80ms between each child
      delayChildren: 0.1
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.gentle
  }
};
```

#### 2. Hover Micro-interactions
```typescript
// Lift on hover
const hoverLift = {
  whileHover: {
    y: -4,
    scale: 1.02,
    transition: springPresets.snappy
  },
  whileTap: {
    scale: 0.98
  }
};

// Glow on hover (no gradient - use shadow)
const hoverGlow = {
  whileHover: {
    boxShadow: [
      '0 10px 15px oklch(0.08 0.02 265 / 0.2)',
      '0 20px 40px oklch(0.60 0.20 280 / 0.3)'
    ],
    transition: { duration: 0.3 }
  }
};

// Rotate icon
const rotateIcon = {
  whileHover: { rotate: 12 },
  transition: springPresets.snappy
};
```

#### 3. Progress Animations
```typescript
// XP bar fill
const progressFill = {
  initial: { width: 0 },
  animate: { width: '75%' },
  transition: {
    duration: 1.5,
    ease: easings.easeOut,
    delay: 0.2
  }
};

// Circular progress (using conic-gradient alternative)
// Since no gradients allowed, use SVG circle with stroke-dasharray
const circularProgress = (progress: number) => ({
  initial: { strokeDashoffset: 283 },
  animate: {
    strokeDashoffset: 283 - (283 * progress / 100)
  },
  transition: {
    duration: 2,
    ease: easings.easeOut
  }
});
```

#### 4. Achievement Unlocked Modal
```typescript
const achievementModal = {
  initial: {
    scale: 0.5,
    opacity: 0,
    y: -100
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: springPresets.bouncy
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 100,
    transition: springPresets.gentle
  }
};

// Trophy icon animation
const trophyAnimation = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, -5, 5, -5, 0],
    scale: [1, 1.1, 1]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    repeatDelay: 1
  }
};
```

#### 5. Streak Fire Animation (No Gradient)
```typescript
// Flame flicker using scale and opacity
const flameFlicker = {
  animate: {
    scale: [1, 1.08, 1.05, 1.1, 1],
    opacity: [1, 0.9, 0.95, 0.88, 1],
    y: [0, -2, -1, -3, 0]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Particle effect (small colored dots)
const particle = {
  initial: {
    y: 0,
    opacity: 1,
    scale: 1
  },
  animate: {
    y: -40,
    opacity: 0,
    scale: 0.3
  },
  transition: {
    duration: 1.5,
    ease: easings.easeOut
  }
};
```

#### 6. Level Up Celebration
```typescript
// Burst effect (expanding circles with solid colors)
const burstRing = (delay: number) => ({
  initial: {
    scale: 0,
    opacity: 1
  },
  animate: {
    scale: 3,
    opacity: 0
  },
  transition: {
    duration: 1.5,
    delay,
    ease: easings.easeOut
  }
});

// Star sparkle (rotate + scale)
const sparkle = {
  animate: {
    rotate: [0, 180, 360],
    scale: [0, 1.2, 0]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    repeatDelay: 0.5
  }
};
```

---

## Component Specifications

### 1. Hero Section (Welcome Back, Explorer!)

#### Layout
- Full width on mobile (1 column)
- 2/3 width on desktop (8/12 columns in Bento grid)
- Height: auto (content-driven)

#### Design Elements
```typescript
interface HeroSectionProps {
  userName: string;
  level: number;
  flowState: 'flow' | 'anxiety' | 'boredom' | 'apathy';
  greeting: string;
}
```

#### Visual Style
- **Background**: `--surface-elevated-1` with glassmorphism
- **Border**: 2px solid `--border-accent` with corner accents
- **Shadow**: `--shadow-lg` + subtle `--glow-purple`
- **Badges**: Flow state indicator (solid color), welcome badge
- **Typography**:
  - Heading: `--text-5xl` with `--font-display`
  - Subtext: `--text-lg` with `--text-secondary`
- **CTA Buttons**: Primary (Add Material), Secondary (AI Coach), Outline (Analytics)

#### Cosmic Accents (No Gradients)
```css
/* Glowing orb accent - solid color with blur */
.hero-accent {
  position: absolute;
  top: 10%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: oklch(0.60 0.20 280 / 0.08);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

/* Star dots - small solid circles */
.star-dot {
  position: absolute;
  width: 3px;
  height: 3px;
  background: oklch(0.90 0.05 240);
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}
```

---

### 2. XP Progress Bar

#### Design (Reference: Image 1 Level Display)
- Horizontal bar with level indicator
- Current XP / Target XP display
- Percentage to next level
- Visual feedback: shine effect (no gradient)

#### Structure
```typescript
interface XPBarProps {
  currentXP: number;
  targetXP: number;
  level: number;
  onLevelUp?: () => void;
}
```

#### Visual Style
```css
/* Container */
.xp-bar-container {
  background: var(--surface-elevated-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
}

/* Progress track */
.xp-track {
  height: 16px;
  background: var(--surface-elevated-2);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

/* Progress fill - solid color */
.xp-fill {
  height: 100%;
  background: var(--star-blue);
  border-radius: var(--radius-full);
  transition: width 1s ease-out;
  position: relative;
}

/* Shine effect WITHOUT gradient */
.xp-shine {
  position: absolute;
  top: 0;
  left: -30%;
  width: 30%;
  height: 100%;
  background: oklch(0.95 0.02 240 / 0.3);
  clip-path: polygon(0 0, 100% 0, 70% 100%, 0 100%);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -30%; }
  50% { left: 110%; }
  100% { left: 110%; }
}
```

#### Level Badge Overlay
```css
.level-badge {
  position: absolute;
  top: 50%;
  left: var(--space-lg);
  transform: translateY(-50%);
  background: var(--cosmic-purple);
  color: var(--text-on-purple);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  box-shadow:
    var(--shadow-md),
    0 0 20px oklch(0.60 0.20 280 / 0.4);
}
```

---

### 3. Circular Progress Rings (Skills, Milestones)

#### Design (Reference: Image 1 Skill Mastery, Image 2 Progress Rings)
- SVG-based circles (no conic-gradient)
- Percentage display in center
- Label below
- Multiple rings can overlap for comparison

#### Structure
```typescript
interface CircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  icon?: ReactNode;
}
```

#### SVG Implementation (No Gradient)
```tsx
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = 'var(--cosmic-purple)',
  label
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-elevated-2)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle - solid color */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />

        {/* Glow effect - separate circle with blur */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth / 2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity="0.3"
          filter="blur(8px)"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>
          {percentage}%
        </span>
      </div>

      {/* Label */}
      <p className="mt-2 text-sm text-secondary">{label}</p>
    </div>
  );
};
```

---

### 4. Streak Counter

#### Design (Reference: Image 1 Achievement Timeline, Image 2 Daily Habits)
- Large flame icon (animated when active)
- Current streak number (prominent)
- Best streak comparison
- At-risk warning (if not studied recently)

#### Structure
```typescript
interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: Date;
  isActive: boolean;
}
```

#### Visual States
```css
/* Active streak - fire glowing */
.streak-active {
  background: var(--surface-elevated-1);
  border: 2px solid var(--aurora-pink);
  box-shadow:
    var(--shadow-lg),
    0 0 30px oklch(0.72 0.18 340 / 0.3);
}

/* At-risk streak - warning state */
.streak-at-risk {
  background: var(--surface-elevated-1);
  border: 2px solid var(--warning);
  box-shadow: var(--shadow-md);
}

/* Inactive streak */
.streak-inactive {
  background: var(--surface-elevated-1);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  opacity: 0.7;
}
```

#### Flame Icon States
```tsx
const FlameIcon = ({ isActive }: { isActive: boolean }) => (
  <motion.div
    className={cn(
      "w-16 h-16 rounded-2xl flex items-center justify-center",
      isActive
        ? "bg-aurora-pink-dim/20"
        : "bg-surface-elevated-2"
    )}
    animate={isActive ? {
      y: [0, -4, 0],
      scale: [1, 1.05, 1]
    } : {}}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Flame
      className={cn(
        "w-8 h-8",
        isActive ? "text-aurora-pink" : "text-text-tertiary"
      )}
    />
  </motion.div>
);
```

---

### 5. Achievement Badges Grid

#### Design (Reference: Image 1 Achievement Badges, Image 2 Achievement Unlocked Modal)
- Grid layout (2x3 on mobile, 3x4 on tablet, 4x6 on desktop)
- Badge states: locked, unlocked, in-progress
- Hover effect: tooltip with description
- Click: opens achievement detail modal

#### Structure
```typescript
interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  state: 'locked' | 'in-progress' | 'unlocked';
  progress?: number;  // 0-100 for in-progress
  unlockedDate?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

#### Badge Visual Styles
```css
/* Base badge */
.achievement-badge {
  aspect-ratio: 1;
  border-radius: var(--radius-xl);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

/* Locked state */
.badge-locked {
  background: var(--surface-elevated-2);
  border: 1px solid var(--border-subtle);
  opacity: 0.5;
}

.badge-locked .badge-icon {
  filter: grayscale(100%);
  opacity: 0.3;
}

/* In-progress state */
.badge-in-progress {
  background: var(--surface-elevated-1);
  border: 2px solid var(--warning);
  box-shadow:
    var(--shadow-md),
    0 0 20px oklch(0.75 0.15 80 / 0.2);
}

/* Unlocked state by rarity */
.badge-unlocked.common {
  background: var(--surface-elevated-1);
  border: 2px solid var(--success);
  box-shadow: var(--shadow-md), var(--glow-teal);
}

.badge-unlocked.rare {
  background: var(--surface-elevated-1);
  border: 2px solid var(--star-blue);
  box-shadow: var(--shadow-lg), var(--glow-blue);
}

.badge-unlocked.epic {
  background: var(--surface-elevated-1);
  border: 2px solid var(--cosmic-purple);
  box-shadow: var(--shadow-xl), var(--glow-purple);
}

.badge-unlocked.legendary {
  background: var(--surface-elevated-1);
  border: 3px solid var(--aurora-pink);
  box-shadow:
    var(--shadow-2xl),
    var(--glow-pink),
    inset 0 0 20px oklch(0.72 0.18 340 / 0.1);
}

/* Hover effect */
.achievement-badge:hover {
  transform: translateY(-4px) scale(1.05);
}
```

#### Achievement Unlocked Modal
```css
.achievement-modal {
  background: var(--surface-elevated-1);
  border: 2px solid var(--cosmic-purple);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  max-width: 500px;
  box-shadow:
    var(--shadow-2xl),
    var(--glow-purple);
  text-align: center;
}

/* Trophy animation */
.achievement-trophy {
  font-size: 6rem;
  margin-bottom: var(--space-lg);
  animation: trophy-bounce 2s ease-in-out infinite;
}

@keyframes trophy-bounce {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(-5deg);
  }
  75% {
    transform: translateY(-10px) rotate(5deg);
  }
}
```

---

### 6. Milestone Path Visualization

#### Design (Reference: Image 3 Milestone Path)
- Winding path with nodes
- Each node represents a learning milestone
- States: completed, current, locked
- Connecting lines show progression
- Stars/icons mark achievements along path

#### Structure
```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  state: 'completed' | 'current' | 'locked';
  position: number;  // 0-100 along path
  xpRequired: number;
  reward?: string;
}
```

#### SVG Path Implementation
```tsx
const MilestonePath = ({ milestones }: { milestones: Milestone[] }) => {
  // Generate winding path coordinates
  const pathCoordinates = useMemo(() => {
    // Create S-curve path from start to end
    return milestones.map((m, i) => ({
      x: 50 + 40 * Math.sin(i * Math.PI / 3),
      y: i * 120
    }));
  }, [milestones]);

  return (
    <svg
      width="100%"
      height={milestones.length * 120}
      className="milestone-path"
    >
      {/* Background path - dotted line */}
      <path
        d={generateSVGPath(pathCoordinates)}
        stroke="var(--border-default)"
        strokeWidth="3"
        strokeDasharray="10 10"
        fill="none"
      />

      {/* Progress path - solid color */}
      <motion.path
        d={generateSVGPath(pathCoordinates)}
        stroke="var(--cosmic-purple)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: getProgressPercentage() / 100 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Glow on progress path */}
      <motion.path
        d={generateSVGPath(pathCoordinates)}
        stroke="var(--cosmic-purple)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        opacity="0.3"
        filter="blur(8px)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: getProgressPercentage() / 100 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Milestone nodes */}
      {pathCoordinates.map((coord, i) => (
        <MilestoneNode
          key={milestones[i].id}
          milestone={milestones[i]}
          x={coord.x}
          y={coord.y}
        />
      ))}
    </svg>
  );
};
```

#### Milestone Node Styles
```css
/* Node circle */
.milestone-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Completed */
.node-completed {
  background: var(--success);
  border: 3px solid var(--success-dim);
  box-shadow:
    var(--shadow-md),
    0 0 20px oklch(0.65 0.15 150 / 0.4);
}

/* Current */
.node-current {
  background: var(--cosmic-purple);
  border: 4px solid var(--cosmic-purple-bright);
  box-shadow:
    var(--shadow-lg),
    var(--glow-purple);
  animation: pulse-node 2s ease-in-out infinite;
}

@keyframes pulse-node {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      var(--shadow-lg),
      0 0 20px oklch(0.60 0.20 280 / 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow:
      var(--shadow-xl),
      0 0 40px oklch(0.60 0.20 280 / 0.5);
  }
}

/* Locked */
.node-locked {
  background: var(--surface-elevated-2);
  border: 2px solid var(--border-subtle);
  opacity: 0.5;
}
```

---

### 7. Daily Quest Cards

#### Design (Reference: Image 2 Daily Quests & Habits)
- Card-based layout
- Quest title, description, XP reward
- Progress bar (if multi-step)
- Complete/claim button
- Visual feedback on completion

#### Structure
```typescript
interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'special';
  progress: number;  // 0-100
  maxProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: Date;
}
```

#### Quest Card Styles
```css
.quest-card {
  background: var(--surface-elevated-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

/* Quest type indicator - top border accent */
.quest-daily::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--star-blue);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.quest-weekly::before {
  background: var(--cosmic-purple);
}

.quest-special::before {
  background: var(--aurora-pink);
}

/* Completed state */
.quest-completed {
  border-color: var(--success);
  box-shadow:
    var(--shadow-lg),
    0 0 20px oklch(0.65 0.15 150 / 0.25);
}

.quest-completed::after {
  content: '✓';
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  background: var(--success);
  color: var(--text-on-purple);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
}
```

---

### 8. Study Timer Card

#### Design (Reference: Image 3 Today's Focus)
- Prominent time display
- Start/pause/stop controls
- Focus mode toggle
- Break timer integration
- Session history

#### Structure
```typescript
interface TimerState {
  mode: 'focus' | 'break' | 'idle';
  timeRemaining: number;  // seconds
  totalFocusToday: number;  // seconds
  goalMinutes: number;
  currentSession: {
    startTime: Date;
    elapsed: number;
  } | null;
}
```

#### Timer Display
```css
.timer-display {
  background: var(--surface-elevated-1);
  border: 2px solid var(--border-accent);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Time readout */
.timer-time {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  color: var(--cosmic-purple);
  text-shadow: 0 0 30px oklch(0.60 0.20 280 / 0.3);
  letter-spacing: 0.1em;
}

/* Focus mode active */
.timer-focus-active {
  border-color: var(--nebula-teal);
  box-shadow:
    var(--shadow-xl),
    var(--glow-teal);
}

.timer-focus-active .timer-time {
  color: var(--nebula-teal);
}

/* Pulsing background effect during focus */
.focus-pulse {
  position: absolute;
  inset: 0;
  background: oklch(0.68 0.14 200 / 0.05);
  animation: focus-breathe 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes focus-breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.02); }
}
```

---

### 9. Neuro-Friendly Summary Cards

#### Design (Reference: Image 3 Neuro-friendly summary)
- Bite-sized information
- High contrast text
- Ample whitespace
- Clear hierarchy
- Calming colors

#### Structure
```typescript
interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
  };
}
```

#### Card Styles
```css
.summary-card {
  background: var(--surface-elevated-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  box-shadow: var(--shadow-md);
}

/* Icon container */
.summary-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon.blue {
  background: oklch(0.65 0.15 240 / 0.15);
  color: var(--star-blue);
}

.summary-icon.purple {
  background: oklch(0.60 0.20 280 / 0.15);
  color: var(--cosmic-purple);
}

.summary-icon.teal {
  background: oklch(0.68 0.14 200 / 0.15);
  color: var(--nebula-teal);
}

.summary-icon.pink {
  background: oklch(0.72 0.18 340 / 0.15);
  color: var(--aurora-pink);
}

/* Content */
.summary-content {
  flex: 1;
}

.summary-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-black);
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.summary-title {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: var(--font-semibold);
}

/* Trend indicator */
.summary-trend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  margin-top: var(--space-xs);
}

.trend-up {
  color: var(--success);
}

.trend-down {
  color: var(--danger);
}

.trend-neutral {
  color: var(--text-tertiary);
}
```

---

## Layout System

### Bento Grid Architecture

#### Grid Configuration
```css
/* Mobile: 1 column */
@media (min-width: 0) {
  .bento-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--bento-gap-mobile);
  }
}

/* Tablet: 6 columns */
@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: var(--bento-gap-tablet);
  }
}

/* Desktop: 12 columns */
@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(12, 1fr);
    gap: var(--bento-gap-desktop);
  }
}
```

#### Bento Cell Sizes (Example Layout)
```typescript
const bentoLayout = {
  // Hero section
  hero: {
    mobile: 'col-span-1',
    tablet: 'col-span-6',
    desktop: 'col-span-8'
  },

  // Level card
  levelCard: {
    mobile: 'col-span-1',
    tablet: 'col-span-3',
    desktop: 'col-span-4'
  },

  // XP bar
  xpBar: {
    mobile: 'col-span-1',
    tablet: 'col-span-6',
    desktop: 'col-span-7'
  },

  // Streak counter
  streak: {
    mobile: 'col-span-1',
    tablet: 'col-span-3',
    desktop: 'col-span-5'
  },

  // Stats card (small)
  statsSmall: {
    mobile: 'col-span-1',
    tablet: 'col-span-2',
    desktop: 'col-span-3'
  },

  // Stats card (medium)
  statsMedium: {
    mobile: 'col-span-1',
    tablet: 'col-span-3',
    desktop: 'col-span-4'
  },

  // Full width (materials list)
  fullWidth: {
    mobile: 'col-span-1',
    tablet: 'col-span-6',
    desktop: 'col-span-12'
  }
};
```

### Sidebar Navigation (Reference: Image 1)

#### Structure
```typescript
interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number;  // Notification count
}

const mainNavigation: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home />, path: '/' },
  { id: 'progress', label: 'Progress', icon: <BarChart3 />, path: '/progress' },
  { id: 'achievements', label: 'Achievements', icon: <Award />, path: '/achievements' },
  { id: 'social', label: 'Social', icon: <Users />, path: '/social', badge: 3 },
  { id: 'settings', label: 'Settings', icon: <Settings />, path: '/settings' }
];
```

#### Sidebar Styles
```css
.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--surface-elevated-1);
  border-right: 1px solid var(--border-default);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}

/* Mobile: drawer style */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

/* Logo area */
.sidebar-logo {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-md);
}

/* Nav items */
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.sidebar-nav-item:hover {
  background: var(--surface-elevated-2);
  color: var(--text-primary);
  transform: translateX(4px);
}

.sidebar-nav-item.active {
  background: var(--cosmic-purple);
  color: var(--text-on-purple);
  box-shadow:
    var(--shadow-md),
    0 0 20px oklch(0.60 0.20 280 / 0.3);
}

/* Notification badge */
.nav-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}
```

---

## Accessibility Guidelines

### Keyboard Navigation
```typescript
// Ensure all interactive elements are keyboard accessible
const keyboardHandlers = {
  // Tab order
  tabindex: 0,  // For focusable elements

  // Enter/Space for buttons
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  },

  // Arrow keys for navigation
  onKeyDown: (e: KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowUp': moveFocus(-1); break;
      case 'ArrowDown': moveFocus(1); break;
      case 'Home': moveFocus(0); break;
      case 'End': moveFocus(items.length - 1); break;
    }
  }
};
```

### ARIA Labels
```tsx
// Card components
<Card
  role="article"
  aria-label="XP Progress Card"
  aria-describedby="xp-description"
>
  <p id="xp-description" className="sr-only">
    You have 1,250 XP out of 2,000 XP needed for next level
  </p>
  {/* Visual content */}
</Card>

// Progress indicators
<div
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Experience progress"
>
  {/* Visual progress bar */}
</div>

// Buttons
<button
  aria-label="Add new study material"
  aria-describedby="upload-hint"
>
  <BookOpen aria-hidden="true" />
  <span>Add Material</span>
</button>

// Status indicators
<span
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Streak: {streak} days
</span>
```

### Focus Management
```css
/* Custom focus outline - visible and prominent */
:focus-visible {
  outline: 3px solid var(--cosmic-purple);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
  transition: outline-offset 0.2s ease;
}

/* Focus within containers */
.card:focus-within {
  box-shadow:
    var(--shadow-xl),
    0 0 0 3px oklch(0.60 0.20 280 / 0.3);
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: var(--cosmic-purple);
  color: var(--text-on-purple);
  padding: var(--space-md) var(--space-lg);
  z-index: 1000;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 0;
}
```

### Color Contrast
All color combinations meet WCAG AA standards:
- Normal text (16px): Minimum contrast ratio 4.5:1
- Large text (24px+): Minimum contrast ratio 3:1
- UI components: Minimum contrast ratio 3:1

Test all accent colors against backgrounds:
```typescript
// Use contrast checker
const meetsWCAG_AA = (foreground: string, background: string) => {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5;
};

// Example checks
meetsWCAG_AA('oklch(0.60 0.20 280)', 'oklch(0.15 0.02 265)'); // true
meetsWCAG_AA('oklch(0.95 0.02 265)', 'oklch(0.15 0.02 265)'); // true
```

### Reduced Motion
```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Disable complex animations */
  .flame-flicker,
  .trophy-bounce,
  .sparkle {
    animation: none !important;
  }
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up OKLCH color tokens in CSS
- [ ] Configure Tailwind with custom colors
- [ ] Create base glassmorphism utilities
- [ ] Implement shadow system
- [ ] Set up motion spring presets

### Phase 2: Core Components
- [ ] Hero section with cosmic accents
- [ ] XP progress bar with shine effect
- [ ] Level card with circular progress
- [ ] Streak counter with flame animation
- [ ] Flow state indicator

### Phase 3: Advanced Features
- [ ] Achievement badges grid
- [ ] Milestone path visualization
- [ ] Daily quest cards
- [ ] Study timer with focus mode
- [ ] Neuro-friendly summary cards

### Phase 4: Layout & Navigation
- [ ] Bento grid system
- [ ] Sidebar navigation
- [ ] Mobile drawer menu
- [ ] Responsive breakpoints

### Phase 5: Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels and roles
- [ ] Focus management
- [ ] Reduced motion support
- [ ] Screen reader testing

### Phase 6: Polish
- [ ] Micro-interactions
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Success animations

---

## Design Tokens Export

Create `/frontend/src/styles/tokens-2025.css`:

```css
:root {
  /* Colors - Space Theme (NO GRADIENTS) */
  --space-dark: oklch(0.15 0.02 265);
  --space-darker: oklch(0.12 0.02 265);
  --space-darkest: oklch(0.08 0.02 265);
  --surface-elevated-1: oklch(0.18 0.03 265);
  --surface-elevated-2: oklch(0.22 0.03 265);
  --surface-elevated-3: oklch(0.26 0.03 265);
  --glass-dark: oklch(0.20 0.02 265 / 0.7);
  --glass-border: oklch(0.40 0.05 265 / 0.2);

  /* Accents - Cosmic Energy */
  --cosmic-purple: oklch(0.60 0.20 280);
  --cosmic-purple-dim: oklch(0.50 0.18 280);
  --cosmic-purple-bright: oklch(0.70 0.22 280);
  --star-blue: oklch(0.65 0.15 240);
  --star-blue-dim: oklch(0.55 0.13 240);
  --star-blue-bright: oklch(0.75 0.17 240);
  --nebula-teal: oklch(0.68 0.14 200);
  --nebula-teal-dim: oklch(0.58 0.12 200);
  --nebula-teal-bright: oklch(0.78 0.16 200);
  --aurora-pink: oklch(0.72 0.18 340);
  --aurora-pink-dim: oklch(0.62 0.16 340);
  --aurora-pink-bright: oklch(0.82 0.20 340);

  /* Semantic Colors */
  --success: oklch(0.65 0.15 150);
  --success-dim: oklch(0.55 0.13 150);
  --success-bg: oklch(0.30 0.08 150 / 0.15);
  --warning: oklch(0.75 0.15 80);
  --warning-dim: oklch(0.65 0.13 80);
  --warning-bg: oklch(0.35 0.08 80 / 0.15);
  --danger: oklch(0.60 0.20 20);
  --danger-dim: oklch(0.50 0.18 20);
  --danger-bg: oklch(0.30 0.10 20 / 0.15);
  --info: oklch(0.70 0.12 210);
  --info-dim: oklch(0.60 0.10 210);
  --info-bg: oklch(0.35 0.06 210 / 0.15);

  /* Text */
  --text-primary: oklch(0.95 0.02 265);
  --text-secondary: oklch(0.75 0.04 265);
  --text-tertiary: oklch(0.55 0.05 265);
  --text-disabled: oklch(0.35 0.05 265);
  --text-on-purple: oklch(1.0 0 0);
  --text-on-blue: oklch(1.0 0 0);
  --text-on-teal: oklch(0.12 0.02 265);
  --text-on-pink: oklch(0.12 0.02 265);

  /* Borders */
  --border-subtle: oklch(0.30 0.03 265 / 0.3);
  --border-default: oklch(0.40 0.05 265 / 0.5);
  --border-strong: oklch(0.50 0.08 265 / 0.8);
  --border-accent: oklch(0.60 0.12 280 / 0.6);

  /* Shadows (NO GRADIENTS) */
  --shadow-sm: 0 1px 2px oklch(0.08 0.02 265 / 0.1);
  --shadow-md:
    0 4px 6px oklch(0.08 0.02 265 / 0.15),
    0 2px 4px oklch(0.08 0.02 265 / 0.1);
  --shadow-lg:
    0 10px 15px oklch(0.08 0.02 265 / 0.2),
    0 4px 6px oklch(0.08 0.02 265 / 0.15);
  --shadow-xl:
    0 20px 25px oklch(0.08 0.02 265 / 0.25),
    0 8px 10px oklch(0.08 0.02 265 / 0.15);
  --shadow-2xl:
    0 25px 50px oklch(0.08 0.02 265 / 0.35),
    0 12px 24px oklch(0.08 0.02 265 / 0.2);

  /* Glows */
  --glow-purple:
    0 0 20px oklch(0.60 0.20 280 / 0.3),
    0 0 40px oklch(0.60 0.20 280 / 0.15);
  --glow-blue:
    0 0 20px oklch(0.65 0.15 240 / 0.3),
    0 0 40px oklch(0.65 0.15 240 / 0.15);
  --glow-teal:
    0 0 20px oklch(0.68 0.14 200 / 0.3),
    0 0 40px oklch(0.68 0.14 200 / 0.15);
  --glow-pink:
    0 0 20px oklch(0.72 0.18 340 / 0.3),
    0 0 40px oklch(0.72 0.18 340 / 0.15);

  /* Spacing */
  --space-3xs: 0.125rem;
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  --space-4xl: 6rem;
  --space-5xl: 8rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-pixel: 'Press Start 2P', monospace;
}
```

---

## Summary

This design system specification provides a complete foundation for implementing the space/cosmic themed medical education dashboard **without using gradients**. All visual depth is achieved through:

1. **Layered solid colors** with varying opacities
2. **Glassmorphism** with backdrop-filter blur
3. **Shadow elevation system** with multiple shadow layers
4. **Glow effects** using solid colors with blur filters
5. **Border accents** with solid colors and subtle highlights

The system incorporates the best elements from all three reference designs while maintaining consistency, accessibility, and modern UI/UX best practices. All components are specified with implementation details, animation patterns, and responsive behavior.

**Next Steps**: Begin implementation in phases, starting with the design tokens and core components, then building up to advanced features and polish.
