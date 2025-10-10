# Design System - Soft Kawaii Brutalist UI

> **Living Document**: Complete visual design system with Soft Kawaii Brutalist aesthetic and subtle pixel accents

Last Updated: 2025-10-09

---

## Design Philosophy: Soft Kawaii Brutalism

### The Paradox (矛盾美学)

**Brutalism** (粗野主义):
- Raw, honest, functional
- Strong geometric forms
- High contrast
- Unpolished edges
- Bold typography
- Information density

**Soft Kawaii** (柔和可爱):
- Gentle, approachable, comforting
- Rounded forms
- Pastel colors
- Playful elements
- Whimsical details
- Emotional warmth

**The Synthesis** (综合):
```
Brutalist Structure + Kawaii Soul = Soft Kawaii Brutalism

Hard Edges + Soft Colors = Approachable Power
Dense Information + Playful Accents = Focused Joy
Raw Honesty + Gentle Warmth = Comfortable Truth
```

**Why This Works for Medical Learning**:
- **Brutalist**: Medical content is serious, dense, structured → honest presentation
- **Kawaii**: Studying is stressful → emotional comfort needed
- **Pixel Accents**: Nostalgia + achievement gamification → engagement

---

## Core Visual Principles

### 1. **结构粗野，表面柔软** (Brutal Structure, Soft Surface)

**Brutalist Foundation**:
- Clean geometric layouts (grids, blocks)
- Clear information hierarchy
- Honest functionality (buttons look like buttons)
- No skeuomorphism
- Explicit boundaries

**Kawaii Softening**:
- Rounded corners (subtle, not extreme)
- Pastel color palette
- Gentle shadows (not harsh)
- Smooth transitions
- Breathing space

**Example**:
```tsx
// Brutal structure
<section className="grid grid-cols-12 gap-0">
  {/* Honest grid, no tricks */}

  // Soft surface
  <Card className="rounded-2xl bg-pink-50/80 border-2 border-pink-200">
    {/* Pastel colors, rounded corners */}
  </Card>
</section>
```

---

### 2. **高对比度内容，低对比度装饰** (High Contrast Content, Low Contrast Decoration)

**High Contrast** (Medical Content):
- Black text on white background (WCAG AAA)
- Bold headings for scan-ability
- Clear code blocks
- Distinct interactive elements

**Low Contrast** (UI Chrome):
- Pastel backgrounds
- Soft borders
- Gentle highlights
- Muted decorative elements

**Example**:
```tsx
// Medical content: HIGH contrast
<article className="bg-white">
  <h1 className="text-gray-900 font-bold">
    Myocardial Infarction Pathophysiology
  </h1>
  <p className="text-gray-800 leading-relaxed">
    {/* Black on white, high contrast */}
  </p>
</article>

// UI chrome: LOW contrast
<aside className="bg-pink-50 border-pink-100">
  <p className="text-pink-600">
    {/* Pastel on pastel, soft */}
  </p>
</aside>
```

---

### 3. **功能主义布局，情感化点缀** (Functionalist Layout, Emotional Accents)

**Functionalist Layout**:
- Bento grid layouts (Brutalist blocks)
- Clear zones (content, navigation, actions)
- Logical flow (F-pattern, Z-pattern)
- No unnecessary decoration

**Emotional Accents**:
- Pixel art mascot in corner
- Subtle pixel badges
- Gentle hover animations
- Encouraging micro-copy
- Delightful empty states

---

## Color Palette

### Primary Colors (柔和粉彩)

**Soft Pastels - Main UI Chrome**:
```css
--kawaii-pink:     #FFE5EC;    /* Soft pink backgrounds */
--kawaii-blue:     #E0F4FF;    /* Soft blue sections */
--kawaii-green:    #E8F8E8;    /* Success states */
--kawaii-lavender: #F0E8FF;    /* Special highlights */
--kawaii-peach:    #FFF0E5;    /* Warm accents */
--kawaii-mint:     #E5FFF0;    /* Fresh sections */
```

**Saturated Accents - CTAs & Important Elements**:
```css
--accent-pink:     #FF6B9D;    /* Primary CTA */
--accent-blue:     #4A90E2;    /* Secondary actions */
--accent-purple:   #9B59B6;    /* Premium features */
--accent-coral:    #FF7675;    /* Warnings */
--accent-teal:     #00B894;    /* Success confirmations */
```

**Brutalist Grays - Content & Structure**:
```css
--gray-900: #1A1A1A;    /* Primary text */
--gray-800: #2D2D2D;    /* Secondary text */
--gray-700: #4A4A4A;    /* Tertiary text */
--gray-300: #D1D1D1;    /* Borders */
--gray-100: #F5F5F5;    /* Subtle backgrounds */
--white:    #FFFFFF;    /* Content areas */
```

**Pixel Art Palette - 8-bit Nostalgia**:
```css
--pixel-pink:   #FF77A9;    /* Mascot primary */
--pixel-yellow: #FFD93D;    /* Badges, stars */
--pixel-blue:   #6BCF7F;    /* XP bars */
--pixel-red:    #FF6B6B;    /* Hearts, streaks */
```

---

### Color Usage Rules

**Rule 1: Content-First Contrast**
```tsx
// ✅ GOOD: High contrast for medical content
<article className="bg-white text-gray-900 border-2 border-gray-300">
  <h2 className="font-bold text-2xl">Medical Content</h2>
  <p className="text-gray-800">High contrast, readable</p>
</article>

// ❌ BAD: Low contrast for important content
<article className="bg-pink-50 text-pink-300">
  <p>Hard to read medical content</p>
</article>
```

**Rule 2: Pastel Backgrounds, Bold Accents**
```tsx
// ✅ GOOD: Soft background, bold CTA
<section className="bg-lavender-50 p-8">
  <button className="bg-accent-pink text-white font-bold px-6 py-3 rounded-lg">
    Start Learning
  </button>
</section>

// ❌ BAD: Everything bold or everything pastel
<section className="bg-accent-pink p-8">  {/* Too aggressive */}
  <button className="bg-pink-100">Weak CTA</button>
</section>
```

**Rule 3: Pixel Accents, Not Pixel Everything**
```tsx
// ✅ GOOD: Subtle pixel accents
<div className="bg-white p-6 rounded-xl">
  <h3>Your Progress</h3>
  <PixelBadge className="w-8 h-8" />  {/* Small accent */}
</div>

// ❌ BAD: Pixel overload
<div className="pixel-border pixel-bg pixel-everything">
  {/* Too much pixel art */}
</div>
```

---

## Typography

### Font Families

**Content - Medical Text** (Sans-serif, high readability):
```css
--font-content: 'Inter', -apple-system, system-ui, sans-serif;
/* Clean, modern, highly readable for medical content */
```

**Headings - Brutalist Bold** (Geometric sans-serif):
```css
--font-heading: 'DM Sans', 'Inter', sans-serif;
/* Strong, geometric, brutalist feel */
```

**Code - Monospace**:
```css
--font-code: 'JetBrains Mono', 'Fira Code', monospace;
/* For code blocks, medical formulas */
```

**Pixel - Decorative ONLY** (8-bit, limited use):
```css
--font-pixel: 'Press Start 2P', monospace;
/* ONLY for: badges, achievements, mascot speech */
/* NEVER for: medical content, important UI text */
```

---

### Type Scale (Brutalist Hierarchy)

```css
/* Large, bold, clear hierarchy */
--text-xs:   0.75rem;   /* 12px - Labels, captions */
--text-sm:   0.875rem;  /* 14px - Secondary text */
--text-base: 1rem;      /* 16px - Body text */
--text-lg:   1.125rem;  /* 18px - Emphasized text */
--text-xl:   1.25rem;   /* 20px - Small headings */
--text-2xl:  1.5rem;    /* 24px - Section headings */
--text-3xl:  1.875rem;  /* 30px - Page headings */
--text-4xl:  2.25rem;   /* 36px - Hero headings */
--text-5xl:  3rem;      /* 48px - Display text */
```

**Usage**:
```tsx
// Brutalist: Large, bold headings
<h1 className="text-4xl font-bold text-gray-900 mb-8">
  Cardiovascular Physiology
</h1>

// Kawaii: Gentle subheadings with soft color
<h2 className="text-2xl font-semibold text-pink-600 mb-4">
  Let's learn about the heart! ♡
</h2>

// Medical content: Readable body text
<p className="text-base text-gray-800 leading-relaxed">
  The cardiac cycle consists of systole and diastole...
</p>

// Pixel accent: Achievement badges
<span className="font-pixel text-xs text-pixel-yellow">
  +50 XP
</span>
```

---

### Font Weight (Clear Hierarchy)

```css
--font-regular: 400;    /* Body text */
--font-medium:  500;    /* Subtle emphasis */
--font-semibold: 600;   /* UI labels */
--font-bold:    700;    /* Headings, CTAs */
--font-black:   900;    /* Hero text (rare) */
```

**Brutalist Rule**: Use bold weights. No timid typography.

---

## Layout & Spacing

### Grid System (Brutalist Bento Boxes)

**Bento Grid Layout**:
```tsx
// Dashboard: Brutalist blocks, soft styling
<div className="grid grid-cols-12 gap-4 p-6">
  {/* XP Card - 4 cols */}
  <Card className="col-span-4 bg-pink-50 border-2 border-pink-200 rounded-2xl p-6">
    <h3 className="font-bold text-gray-900">Your XP</h3>
    <PixelBadge />
  </Card>

  {/* Streak Card - 4 cols */}
  <Card className="col-span-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
    <h3 className="font-bold text-gray-900">Streak</h3>
    <PixelFire />
  </Card>

  {/* Level Card - 4 cols */}
  <Card className="col-span-4 bg-lavender-50 border-2 border-lavender-200 rounded-2xl p-6">
    <h3 className="font-bold text-gray-900">Level</h3>
    <PixelStar />
  </Card>

  {/* Content Area - Full width */}
  <Card className="col-span-12 bg-white border-2 border-gray-300 rounded-2xl p-8">
    {/* High contrast medical content */}
  </Card>
</div>
```

---

### Spacing Scale (8px Base)

```css
--space-1:  0.25rem;  /* 4px  - Tight spacing */
--space-2:  0.5rem;   /* 8px  - Base unit */
--space-3:  0.75rem;  /* 12px - Compact */
--space-4:  1rem;     /* 16px - Default gap */
--space-6:  1.5rem;   /* 24px - Section spacing */
--space-8:  2rem;     /* 32px - Large gaps */
--space-12: 3rem;     /* 48px - Major sections */
--space-16: 4rem;     /* 64px - Page sections */
--space-24: 6rem;     /* 96px - Hero spacing */
```

**Brutalist Principle**: Consistent, mathematical spacing. No arbitrary values.

---

### Border Radius (Gentle, Not Extreme)

```css
--radius-sm:  0.375rem;  /* 6px  - Subtle rounding */
--radius-md:  0.5rem;    /* 8px  - Default */
--radius-lg:  0.75rem;   /* 12px - Cards */
--radius-xl:  1rem;      /* 16px - Larger cards */
--radius-2xl: 1.5rem;    /* 24px - Hero elements */
--radius-full: 9999px;   /* Pills, avatars */
```

**Kawaii Softening**: Rounded, but not bubbly.

```tsx
// ✅ GOOD: Gentle rounding
<Card className="rounded-xl">  {/* 16px - Soft but structured */}

// ❌ BAD: Too round (not brutalist)
<Card className="rounded-[3rem]">  {/* 48px - Too bubbly */}

// ❌ BAD: Sharp corners (not kawaii)
<Card className="rounded-none">  {/* 0px - Too harsh */}
```

---

## Components

### Buttons

**Primary CTA - Bold & Kawaii**:
```tsx
<button className="
  bg-accent-pink
  text-white
  font-bold
  px-6 py-3
  rounded-lg
  border-2 border-pink-600
  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]
  hover:translate-y-[-2px]
  hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]
  transition-all duration-200
  active:translate-y-[1px]
  active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]
">
  Start Learning
</button>
```

**Secondary Button - Soft Brutalism**:
```tsx
<button className="
  bg-white
  text-gray-900
  font-semibold
  px-6 py-3
  rounded-lg
  border-2 border-gray-300
  hover:border-accent-pink
  hover:text-accent-pink
  transition-all duration-200
">
  Review Later
</button>
```

**Pixel Accent Button** (Achievements, Rewards):
```tsx
<button className="
  bg-pixel-yellow
  text-gray-900
  font-pixel
  text-xs
  px-4 py-2
  rounded-md
  border-2 border-yellow-600
  shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]  /* Harsh shadow, 8-bit style */
  hover:translate-y-[-1px]
  active:translate-y-[1px]
">
  CLAIM REWARD
</button>
```

---

### Cards

**Content Card - High Contrast**:
```tsx
<Card className="
  bg-white
  border-2 border-gray-300
  rounded-xl
  p-6
  shadow-sm
  hover:shadow-md
  transition-shadow
">
  {/* Medical content with high contrast */}
  <h3 className="text-2xl font-bold text-gray-900 mb-4">
    Cardiac Physiology
  </h3>
  <p className="text-gray-800 leading-relaxed">
    Medical content here...
  </p>
</Card>
```

**Kawaii Stats Card - Soft Pastels**:
```tsx
<Card className="
  bg-pink-50
  border-2 border-pink-200
  rounded-2xl
  p-6
  relative
  overflow-hidden
">
  {/* Pixel accent in corner */}
  <PixelHeart className="absolute top-2 right-2 w-6 h-6" />

  <h4 className="font-semibold text-pink-600 mb-2">Study Streak</h4>
  <p className="text-3xl font-bold text-gray-900">14 days</p>
  <p className="text-sm text-pink-500 mt-2">Keep it up! ♡</p>
</Card>
```

**Brutalist Dashboard Card**:
```tsx
<Card className="
  bg-gradient-to-br from-white to-gray-50
  border-2 border-gray-900
  rounded-none  /* Brutalist: sharp corners for dashboard sections */
  p-8
  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]  /* Harsh brutalist shadow */
">
  <h2 className="text-3xl font-black text-gray-900 mb-6">
    YOUR PROGRESS
  </h2>
  {/* Dense information display */}
</Card>
```

---

### Badges & Pills

**XP Badge - Pixel Style**:
```tsx
<span className="
  inline-flex items-center gap-1
  bg-pixel-yellow
  text-gray-900
  font-pixel
  text-xs
  px-3 py-1
  rounded-md
  border-2 border-yellow-600
">
  <PixelStar className="w-3 h-3" />
  +50 XP
</span>
```

**Status Pill - Soft Kawaii**:
```tsx
<span className="
  inline-flex items-center gap-1
  bg-pink-100
  text-pink-600
  font-semibold
  text-sm
  px-3 py-1
  rounded-full
">
  ● In Progress
</span>
```

**Level Badge - Bold Brutalist**:
```tsx
<div className="
  bg-accent-purple
  text-white
  font-black
  text-2xl
  w-16 h-16
  rounded-lg
  flex items-center justify-center
  border-4 border-purple-700
  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]
">
  15
</div>
```

---

### Progress Bars

**XP Bar - Soft Gradient with Pixel Accent**:
```tsx
<div className="w-full">
  {/* Label */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-semibold text-gray-700">
      Level 15
    </span>
    <span className="font-pixel text-xs text-pixel-yellow">
      750 / 1000 XP
    </span>
  </div>

  {/* Bar container - Brutalist structure */}
  <div className="
    w-full h-6
    bg-gray-200
    rounded-full
    border-2 border-gray-300
    overflow-hidden
  ">
    {/* Fill - Kawaii gradient */}
    <div
      className="
        h-full
        bg-gradient-to-r from-accent-pink to-accent-purple
        transition-all duration-500 ease-out
        relative
      "
      style={{ width: '75%' }}
    >
      {/* Pixel shine effect */}
      <div className="
        absolute inset-0
        bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)]
        animate-shimmer
      " />
    </div>
  </div>
</div>
```

---

### Skill Tree Nodes

**Unlocked Node - Pixel Art**:
```tsx
<div className="relative group">
  {/* Brutalist container */}
  <div className="
    w-20 h-20
    bg-white
    border-4 border-green-500
    rounded-xl
    flex items-center justify-center
    shadow-[4px_4px_0px_0px_rgba(34,197,94,0.3)]
    cursor-pointer
    hover:scale-110
    transition-transform
  ">
    {/* Pixel icon */}
    <PixelCheckmark className="w-10 h-10 text-green-500" />
  </div>

  {/* Kawaii label */}
  <p className="
    text-xs text-center mt-2
    font-semibold text-green-600
  ">
    Completed
  </p>
</div>
```

**Locked Node - Grayed Out**:
```tsx
<div className="relative opacity-50 cursor-not-allowed">
  <div className="
    w-20 h-20
    bg-gray-100
    border-4 border-gray-300
    rounded-xl
    flex items-center justify-center
  ">
    <PixelLock className="w-10 h-10 text-gray-400" />
  </div>
  <p className="text-xs text-center mt-2 text-gray-500">
    Locked
  </p>
</div>
```

---

### Mascot / Avatar

**AI Coach Mascot - Pixel Art Character**:
```tsx
<div className="relative">
  {/* Mascot container - Kawaii background */}
  <div className="
    w-32 h-32
    bg-pink-50
    rounded-2xl
    border-2 border-pink-200
    flex items-center justify-center
    p-4
  ">
    {/* Pixel art mascot (16x16 sprite scaled up) */}
    <PixelMascot
      mood="happy"  // happy, thinking, celebrating
      className="w-24 h-24 pixelated"  // CSS: image-rendering: pixelated
    />
  </div>

  {/* Speech bubble - Brutalist */}
  <div className="
    absolute -right-4 top-0
    bg-white
    border-2 border-gray-900
    rounded-lg
    p-3
    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
    max-w-xs
  ">
    <p className="text-sm font-medium text-gray-900">
      Great job! You're making progress!
    </p>
  </div>
</div>
```

---

### Modal / Dialog

**Brutalist Structure, Soft Content**:
```tsx
<Dialog>
  {/* Overlay - Soft */}
  <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm" />

  {/* Modal - Brutalist card */}
  <div className="
    fixed top-1/2 left-1/2
    -translate-x-1/2 -translate-y-1/2
    bg-white
    border-4 border-gray-900
    rounded-xl
    shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
    p-8
    max-w-lg w-full
  ">
    {/* Header - Bold */}
    <h2 className="text-3xl font-black text-gray-900 mb-6">
      Achievement Unlocked!
    </h2>

    {/* Content - Kawaii */}
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
      <PixelTrophy className="w-16 h-16 mx-auto mb-3" />
      <p className="text-center font-pixel text-sm text-yellow-700">
        FIRST STREAK!
      </p>
      <p className="text-center text-sm text-gray-700 mt-2">
        You studied 7 days in a row!
      </p>
    </div>

    {/* CTA */}
    <button className="w-full bg-accent-pink text-white font-bold py-3 rounded-lg">
      Awesome!
    </button>
  </div>
</Dialog>
```

---

## Pixel Art Guidelines

### When to Use Pixel Art

**✅ Use Pixel Art For**:
- Mascot character
- Achievement badges
- XP/reward indicators
- Skill tree icons
- Decorative accents
- Celebration animations
- Empty state illustrations

**❌ NEVER Use Pixel Art For**:
- Medical content text
- Important UI labels
- Navigation text
- Form inputs
- Error messages
- Critical information

---

### Pixel Art Specifications

**Resolution**: 16x16, 24x24, 32x32 base (scale up with CSS)

**Palette**: Limited 8-bit palette
```css
--pixel-palette: [
  #FF77A9,  /* Pink */
  #FFD93D,  /* Yellow */
  #6BCF7F,  /* Green */
  #FF6B6B,  /* Red */
  #4A90E2,  /* Blue */
  #000000,  /* Black outlines */
  #FFFFFF   /* White highlights */
];
```

**Style**: Clean, simple, readable
- Thick outlines (2px at base resolution)
- Limited colors (3-5 per sprite)
- Clear silhouette
- Expressive, kawaii faces

**Rendering**:
```css
.pixel-art {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

---

### Pixel Art Examples

**Mascot Moods**:
- 😊 Happy (default): Smiling, open eyes
- 🤔 Thinking: Hand on chin, looking up
- 🎉 Celebrating: Arms up, sparkles
- 😴 Sleeping: Closed eyes, Zzz
- 💪 Encouraging: Flexing, determined face

**Badges**:
- ⭐ Star: Yellow, sparkle
- 🏆 Trophy: Gold, shine
- 🔥 Flame: Red-orange, animated
- ❤️ Heart: Pink-red, pulse
- ⚡ Lightning: Yellow, energy

**Skill Tree Icons**:
- 📚 Book: Learning
- 🧠 Brain: Mastery
- 💉 Syringe: Clinical
- 🔬 Microscope: Lab
- 🩺 Stethoscope: Physical exam

---

## Animations & Interactions

### Micro-interactions (Gentle, Delightful)

**Hover - Soft Lift**:
```css
.card {
  transition: all 0.2s ease-out;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

**Click - Tactile Feedback**:
```css
.button:active {
  transform: scale(0.98) translateY(2px);
}
```

**Achievement Unlock - Celebration**:
```tsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 20
  }}
>
  <PixelBadge />
</motion.div>
```

**XP Bar Fill - Satisfying**:
```tsx
<motion.div
  className="xp-fill"
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{
    duration: 1,
    ease: [0.16, 1, 0.3, 1]  // Custom ease for satisfaction
  }}
/>
```

**Mascot Wave - Cute**:
```tsx
<motion.div
  animate={{
    rotate: [0, 14, -8, 14, -4, 10, 0],
    transition: { duration: 1, repeat: Infinity, repeatDelay: 3 }
  }}
>
  <PixelHand />
</motion.div>
```

---

### Loading States (Encouraging, Not Frustrating)

**Spinner - Soft Kawaii**:
```tsx
<div className="flex flex-col items-center gap-4">
  {/* Pixel spinner */}
  <PixelSpinner className="w-12 h-12 animate-spin" />

  {/* Encouraging message */}
  <p className="text-sm text-pink-600 font-medium">
    Loading your progress...
  </p>
</div>
```

**Skeleton - Brutalist Structure**:
```tsx
<div className="space-y-4">
  {/* Brutalist skeleton blocks */}
  <div className="h-12 bg-gray-200 rounded-lg animate-pulse border-2 border-gray-300" />
  <div className="h-12 bg-gray-200 rounded-lg animate-pulse border-2 border-gray-300" />
  <div className="h-12 bg-gray-200 rounded-lg animate-pulse border-2 border-gray-300" />
</div>
```

---

### Transitions (Smooth, Not Jarring)

**Page Transitions**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {children}
</motion.div>
```

**Stagger Children - Dashboard Cards**:
```tsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {cards.map(card => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      <Card />
    </motion.div>
  ))}
</motion.div>
```

---

## Example Screens

### Dashboard - Full Design

```tsx
<div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-lavender-50 p-6">
  {/* Header - Brutalist */}
  <header className="bg-white border-4 border-gray-900 rounded-xl p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <h1 className="text-3xl font-black text-gray-900">
        STUDYIN
      </h1>

      {/* Mascot corner */}
      <div className="flex items-center gap-3">
        <span className="font-pixel text-xs text-pixel-yellow">
          LVL 15
        </span>
        <PixelMascot mood="happy" className="w-12 h-12" />
      </div>
    </div>
  </header>

  {/* Bento grid */}
  <div className="grid grid-cols-12 gap-4">
    {/* XP Card - Kawaii */}
    <Card className="col-span-4 bg-pink-50 border-2 border-pink-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-gray-900">Experience</h3>
        <PixelStar className="w-6 h-6" />
      </div>
      <p className="text-3xl font-black text-gray-900 mb-2">750 XP</p>
      {/* XP bar */}
      <div className="w-full h-2 bg-pink-200 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-gradient-to-r from-accent-pink to-accent-purple" />
      </div>
      <p className="text-xs text-pink-600 mt-2">250 XP to Level 16</p>
    </Card>

    {/* Streak Card - Kawaii */}
    <Card className="col-span-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-gray-900">Streak</h3>
        <PixelFire className="w-6 h-6 animate-pulse" />
      </div>
      <p className="text-3xl font-black text-gray-900 mb-2">14 Days</p>
      <p className="text-sm text-blue-600">Keep it going! 🔥</p>
    </Card>

    {/* Mastery Card - Kawaii */}
    <Card className="col-span-4 bg-lavender-50 border-2 border-lavender-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-gray-900">Mastery</h3>
        <PixelTrophy className="w-6 h-6" />
      </div>
      <p className="text-3xl font-black text-gray-900 mb-2">68%</p>
      <p className="text-sm text-purple-600">Cardiac Physiology</p>
    </Card>

    {/* Main content - Brutalist high contrast */}
    <Card className="col-span-12 bg-white border-4 border-gray-900 rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black text-gray-900 mb-6">
        TODAY'S LEARNING SESSION
      </h2>

      {/* Medical content with high contrast */}
      <div className="prose prose-lg max-w-none">
        <h3 className="font-bold text-gray-900">Myocardial Infarction</h3>
        <p className="text-gray-800 leading-relaxed">
          High contrast, readable medical content goes here...
        </p>
      </div>

      {/* CTA */}
      <button className="mt-6 bg-accent-pink text-white font-bold px-8 py-4 rounded-lg border-2 border-pink-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-transform">
        Continue Learning
      </button>
    </Card>
  </div>
</div>
```

---

### Quiz Interface

```tsx
<div className="min-h-screen bg-white p-6">
  {/* Timer - Brutalist */}
  <div className="bg-gray-900 text-white font-black text-center py-3 rounded-lg mb-6">
    TIME: 02:34
  </div>

  {/* Question Card - High contrast */}
  <Card className="bg-white border-4 border-gray-900 rounded-xl p-8 mb-6">
    <p className="text-sm font-semibold text-gray-600 mb-4">Question 5 of 10</p>

    {/* Question text - High contrast */}
    <h2 className="text-xl font-bold text-gray-900 leading-relaxed mb-6">
      A 45-year-old male presents with sudden onset chest pain radiating to the left arm.
      ECG shows ST-segment elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?
    </h2>

    {/* Options - Brutalist structure, soft interaction */}
    <div className="space-y-3">
      {['A', 'B', 'C', 'D'].map((option) => (
        <button
          key={option}
          className="
            w-full text-left p-4
            border-2 border-gray-300
            rounded-lg
            hover:border-accent-pink
            hover:bg-pink-50
            transition-all
            font-medium text-gray-900
          "
        >
          <span className="font-bold mr-3">{option}.</span>
          Left anterior descending artery
        </button>
      ))}
    </div>
  </Card>

  {/* Actions */}
  <div className="flex gap-4">
    <button className="flex-1 bg-white border-2 border-gray-300 text-gray-900 font-semibold py-3 rounded-lg">
      Mark for Review
    </button>
    <button className="flex-1 bg-accent-pink text-white font-bold py-3 rounded-lg border-2 border-pink-600">
      Submit Answer
    </button>
  </div>

  {/* Mascot encouragement - Pixel accent */}
  <div className="fixed bottom-6 right-6">
    <div className="relative">
      <PixelMascot mood="encouraging" className="w-16 h-16" />
      <div className="absolute -top-2 -left-2 bg-white border-2 border-gray-900 rounded-lg p-2 text-xs font-medium shadow-lg">
        You got this! 💪
      </div>
    </div>
  </div>
</div>
```

---

## Implementation Checklist

### Phase 0-1: Foundation
- [ ] Install fonts (Inter, DM Sans, JetBrains Mono, Press Start 2P)
- [ ] Configure Tailwind with custom colors
- [ ] Create base component library (Button, Card, Badge)
- [ ] Implement pixel art rendering (CSS: image-rendering: pixelated)
- [ ] Set up Framer Motion
- [ ] Create design tokens file

### Phase 3-6: Gamification UI
- [ ] Design pixel art mascot (16x16 base, multiple moods)
- [ ] Create pixel art badge library (star, trophy, fire, heart, lightning)
- [ ] Implement XP bar with gradient animation
- [ ] Build skill tree node components
- [ ] Create achievement modal
- [ ] Design empty states with pixel illustrations

### Phase 7: Polish
- [ ] Audit all color contrast (WCAG AAA for content)
- [ ] Ensure pixel art used appropriately (accents only)
- [ ] Test animations on low-end devices
- [ ] Verify dark mode if implemented
- [ ] Accessibility audit (screen readers, keyboard nav)

---

## Design Principles Summary

### The Golden Rules

1. **Brutal Structure, Soft Surface**
   - Hard grids, soft colors
   - Clear hierarchy, gentle transitions

2. **Content-First Contrast**
   - Medical content: HIGH contrast (black on white)
   - UI chrome: LOW contrast (pastels)

3. **Pixel Accents, Not Pixel Overload**
   - Mascot, badges, achievements: Pixel art ✅
   - Important text, medical content: Clean sans-serif ✅
   - Navigation, forms: NEVER pixel fonts ❌

4. **Honest Functionality**
   - Buttons look like buttons (brutalism)
   - Links look like links
   - No hidden interactions

5. **Emotional Warmth**
   - Encouraging copy
   - Playful micro-interactions
   - Gentle animations
   - Mascot companionship

6. **Mathematical Consistency**
   - 8px spacing scale
   - Consistent border radius
   - Type scale hierarchy
   - Grid-based layouts

---

## Inspiration & References

**Brutalism**:
- Concrete architecture (raw, honest)
- Swiss design (grid, hierarchy)
- Terminal UI (functional, clear)

**Kawaii**:
- Sanrio characters (Hello Kitty, etc.)
- Japanese stationery (soft pastels)
- Tamagotchi (pixel pets)

**Synthesis**:
- Notion (clean brutalism + soft colors)
- Duolingo (gamification + friendly)
- Habitica (RPG + pastel UI)

---

## Changelog

### 2025-10-09
- Created comprehensive Soft Kawaii Brutalist UI design system
- Defined color palette (pastels + brutalist grays + pixel accents)
- Specified typography rules (content vs decorative)
- Created component library (buttons, cards, badges, progress bars)
- Defined pixel art guidelines and usage
- Documented animations and micro-interactions
- Created example screens (dashboard, quiz)
- Added implementation checklist

---

**Remember**: This design system is about **balance**. Brutalism provides structure and honesty. Kawaii provides warmth and approachability. Pixel art provides nostalgia and delight. Together, they create a unique, engaging learning environment that reduces anxiety while maintaining professionalism.
