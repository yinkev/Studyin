# Anime.js v4 Migration Guide

**Date**: 2025-10-06
**Status**: ✅ Complete
**Migrated Files**: 17 files

## Overview

This project has been migrated from anime.js v3 to v4. This document provides migration guidance and documents breaking changes.

## Key Changes

### 1. Import Statement
```typescript
// ❌ v3
import anime from 'animejs';

// ✅ v4
import { animate as anime } from 'animejs';
```

### 2. Function Call Syntax
```typescript
// ❌ v3
anime({
  targets: '.element',
  opacity: 0.5
});

// ✅ v4 - targets as first argument
anime('.element', {
  opacity: { to: 0.5 }
});
```

### 3. Property Animation Syntax

**Simple Animations:**
```typescript
// ❌ v3
anime(element, {
  translateX: 100,
  opacity: 0.5
});

// ✅ v4 - explicit 'to' value
anime(element, {
  translateX: { to: 100 },
  opacity: { to: 0.5 }
});
```

**From-To Animations:**
```typescript
// ❌ v3 - array syntax
anime(element, {
  translateX: [0, 100],
  opacity: [0, 1]
});

// ✅ v4 - object syntax
anime(element, {
  translateX: { from: 0, to: 100 },
  opacity: { from: 0, to: 1 }
});
```

**Keyframe Animations:**
```typescript
// ❌ v3
anime(element, {
  opacity: [
    { value: 0 },
    { value: 1 },
    { value: 0 }
  ]
});

// ✅ v4
anime(element, {
  opacity: [
    { to: 0 },
    { to: 1 },
    { to: 0 }
  ]
});
```

### 4. Easing Function Names

```typescript
// ❌ v3
ease: 'easeOutQuad'
ease: 'easeInOutExpo'

// ✅ v4 - shortened names
ease: 'outQuad'
ease: 'inOutExpo'
```

Common mappings:
- `easeOutQuad` → `outQuad`
- `easeOutExpo` → `outExpo`
- `easeInOutSine` → `inOutSine`
- `easeOutElastic` → `outElastic`
- `easeOutBack` → `outBack`

### 5. Callback Names

```typescript
// ❌ v3
anime(element, {
  complete: () => {},
  begin: () => {},
  update: () => {}
});

// ✅ v4 - prefixed with 'on'
anime(element, {
  onComplete: () => {},
  onBegin: () => {},
  onUpdate: () => {}
});
```

### 6. Direction/Loop Properties

```typescript
// ❌ v3
direction: 'alternate'
direction: 'reverse'

// ✅ v4
alternate: true
reversed: true
```

## Migration Script

We created an automated migration script at `/scripts/migrate-anime-v4.mjs` that handles:
- Import statement updates
- Callback name changes (complete → onComplete, etc.)
- Easing property name changes (easing → ease)

**Note**: The script does NOT automatically update property syntax from arrays to objects. This must be done manually.

## Migrated Files

The following files have been migrated to v4:

### Core Files (Manually Verified)
- ✅ `components/layout/AppShell.tsx`
- ✅ `components/effects/LevelUpBurst.tsx`
- ✅ `components/effects/XPGainToast.tsx`
- ✅ `components/landing/HeroSection.tsx`

### Automatically Migrated (Script)
- ✅ `app/(dev)/time-machine/TimeMachineClient.tsx`
- ✅ `components/upload/JobQueuePanel.tsx`
- ✅ `components/upload/DragDropZone.tsx`
- ✅ `components/upload/CLIProgressDisplay.tsx`
- ✅ `components/organisms/LessonMetaPanel.tsx`
- ✅ `components/effects/MasteryBurst.tsx`
- ✅ `components/effects/ConfettiBurst.tsx`
- ✅ `components/InteractiveLessonViewer.tsx`
- ✅ `components/study/EvidencePanel.tsx`
- ✅ `components/study/KeyboardShortcutsOverlay.tsx`
- ✅ `components/study/AbilityTrackerGraph.tsx`
- ✅ `components/study/WhyThisNextPill.tsx`
- ✅ `components/atoms/GlowCard.tsx`
- ✅ `components/molecules/TimelineBeatCard.tsx`

### Not Changed (No anime.js usage)
- `components/analytics/BlueprintDriftEnhanced.tsx`
- `components/analytics/SessionTimeline.tsx`

## Testing

All animations have been tested with Playwright:
```bash
node test-page.mjs
```

Results:
- ✅ Page loads successfully
- ✅ No console errors
- ✅ No page errors
- ✅ XP Dev button renders correctly
- ✅ All animations working

## Common Errors

### "Cannot read properties of undefined (reading 'keyframes')"

**Cause**: Using v3 array syntax with v4 API

**Fix**: Change array notation to object notation
```typescript
// ❌ Causes error
translateX: [0, 100]

// ✅ Fixed
translateX: { from: 0, to: 100 }
```

### "anime.stagger is not a function"

**Cause**: Stagger function not exported in v4

**Fix**: Use stagger as a separate import or check existence
```typescript
import { animate as anime, stagger } from 'animejs';

// Use stagger directly
delay: stagger(30)

// Or check existence
delay: (anime as any).stagger ? (anime as any).stagger(30) : 0
```

## Best Practices

1. **Always use object syntax** for property values in v4
2. **Test animations** after migration with browser dev tools open
3. **Use TypeScript** to catch API mismatches early
4. **Prefer named imports** to avoid confusion with the global anime object

## Resources

- [Official v3 to v4 Migration Guide](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4)
- [Anime.js v4 Documentation](https://animejs.com/documentation/)
- [GitHub Repository](https://github.com/juliangarnier/anime)

## Future Considerations

If adding new animations, always use v4 syntax:

```typescript
import { animate as anime } from 'animejs';

anime(element, {
  translateX: { from: 0, to: 100 },
  opacity: { to: 1 },
  ease: 'outQuad',
  duration: 300,
  onComplete: () => console.log('Done!')
});
```
