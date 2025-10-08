# UI Component Library

Reusable components extracted from `/nova` design prototype. These can be imported into any page for consistent, world-class UI/UX.

## Components

### 1. DarkModeToggle

Beautiful S-tier dark mode toggle with gradient pill design.

**Usage:**
```tsx
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';

const [darkMode, setDarkMode] = useState(false);

<DarkModeToggle darkMode={darkMode} onToggle={setDarkMode} />
```

**Features:**
- Gradient background (yellow in light, blue in dark)
- Labeled "Light" / "Dark" with matching icons
- Glowing borders and shadows
- Smooth hover scale animation
- Fully accessible (aria-label)

---

### 2. AppHeader

Professional navigation header with icons, dark mode toggle, and user info.

**Usage:**
```tsx
import { AppHeader } from '@/components/ui/AppHeader';

const [darkMode, setDarkMode] = useState(false);

<AppHeader
  darkMode={darkMode}
  onDarkModeToggle={setDarkMode}
  currentPage="study"
  userLevel={7}
  userXP={2450}
  notificationCount={3}
/>
```

**Features:**
- Clean logo with gradient and shadow
- Icon-based navigation (Study, Upload, Analytics, Dashboard)
- Integrated dark mode toggle
- User level/XP display
- Notification badge on avatar
- Responsive and accessible

**Props:**
- `darkMode` (boolean) - Dark mode state
- `onDarkModeToggle` (function) - Dark mode toggle handler
- `currentPage` ('study' | 'upload' | 'analytics' | 'dashboard') - Active page
- `userLevel` (number) - User's current level
- `userXP` (number) - User's XP points
- `notificationCount` (number) - Number of unread notifications

---

### 3. WhyThisQuestionCard

User-friendly explanation card replacing cryptic IRT statistics.

**Usage:**
```tsx
import { WhyThisQuestionCard } from '@/components/ui/WhyThisQuestionCard';

<WhyThisQuestionCard
  darkMode={darkMode}
  abilityLevel={0.67}
  mastery={0.82}
  informationValue={1.45}
  blueprintWeight={1.2}
/>
```

**Features:**
- Plain English explanations instead of raw stats
- Three key benefits:
  - Perfect for your level
  - High learning value
  - Aligned with your goals
- Modal with detailed math explanation
- Color-coded cards with icons
- Smooth transitions

**Props:**
- `darkMode` (boolean) - Theme mode
- `abilityLevel` (number) - IRT theta estimate
- `mastery` (number) - Overall mastery (0-1)
- `informationValue` (number) - Fisher information
- `blueprintWeight` (number) - Blueprint multiplier

---

## Integration with Existing Pages

### Integrate into /study

Replace the current header in `/study` with `AppHeader`:

```tsx
// app/study/page.tsx
import { AppHeader } from '@/components/ui/AppHeader';

// In your component
const [darkMode, setDarkMode] = useState(false);

return (
  <div>
    <AppHeader
      darkMode={darkMode}
      onDarkModeToggle={setDarkMode}
      currentPage="study"
    />
    {/* Rest of study page */}
  </div>
);
```

### Integrate into InteractiveLessonViewer

Replace `WhyThisNextPill` with `WhyThisQuestionCard`:

```tsx
// components/InteractiveLessonViewer.tsx
import { WhyThisQuestionCard } from '@/components/ui/WhyThisQuestionCard';

// In your component, replace WhyThisNextPill with:
<WhyThisQuestionCard
  darkMode={darkMode}
  abilityLevel={engineSignals.theta}
  mastery={engineSignals.mastery}
  informationValue={engineSignals.info}
  blueprintWeight={1.2}
/>
```

---

## Theme System

All components use a consistent theme object:

```tsx
const theme = darkMode ? {
  // Dark mode colors
  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
  headerBg: 'rgba(15, 23, 42, 0.8)',
  cardBg: 'rgba(30, 41, 59, 0.6)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
} : {
  // Light mode colors
  background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)',
  headerBg: 'rgba(255, 255, 255, 0.9)',
  cardBg: 'rgba(248, 250, 252, 0.95)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
};
```

---

## Dependencies

All components are built on Material Web (MD3):
- `@material/web` — Material Design 3 web components (buttons, dialog, progress)
- React 19 + Next.js 15
- Our thin wrappers in `components/ui/{MD3Button,MD3Card,MD3Progress}.tsx`

---

## Best Practices

1. **Keep /nova as design playground** - Test new UI ideas there first
2. **Extract proven patterns** - Only move components here when they're perfected
3. **Maintain consistency** - Use these components across all pages
4. **Dark mode everywhere** - All components support dark mode out of the box

---

## Next Steps

### Immediate Integration (Easy Wins):
1. Add `AppHeader` to `/study` page
2. Replace `WhyThisNextPill` with `WhyThisQuestionCard` in InteractiveLessonViewer
3. Use `ThemeProvider` (already wired) for light/dark; MD3 tokens switch via `data-theme`

### Future Components to Extract:
- Answer choice cards with feedback
- Confidence rating stars
- Submit button with states
- Question card wrapper
- Celebration effects

---

## Example: Full Integration

```tsx
'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { WhyThisQuestionCard } from '@/components/ui/WhyThisQuestionCard';

export default function StudyPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen transition-all duration-500" style={{
      background: darkMode
        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)'
        : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)',
    }}>
      <AppHeader
        darkMode={darkMode}
        onDarkModeToggle={setDarkMode}
        currentPage="study"
        userLevel={7}
        userXP={2450}
        notificationCount={3}
      />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Your study content */}

        <WhyThisQuestionCard
          darkMode={darkMode}
          abilityLevel={0.67}
          mastery={0.82}
          informationValue={1.45}
          blueprintWeight={1.2}
        />
      </main>
    </div>
  );
}
```

That's it! You now have a professional component library ready to use across your app. 🚀
