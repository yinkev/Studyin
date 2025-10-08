# Material Web Components Integration

**Complete Material Design 3 Implementation Guide**

## Overview

Studyin now uses the official **Material Design 3 (MD3)** design system via **Material Web Components** (`@material/web` v2.4.0). This provides authentic MD3 components, theming, and interactions following Google's official specifications from https://m3.material.io

## Tech Stack

- **Components**: `@material/web` v2.4.0 (official Material Web Components)
- **Framework**: Next.js 15 + React 19 RC
- **React 19 Features**: Native web components support (no refs/workarounds needed)
- **Design System**: Material Design 3 (2025)
- **Fonts**: Roboto (MD3 standard) + Nunito (custom brand)
- **Theme**: Dark mode default, light mode supported

## What Was Installed

### 1. Material Web Components (`@material/web`)

```bash
npm install @material/web
```

All MD3 components are now available as web components:
- Buttons (filled, outlined, elevated, tonal, text)
- FABs (floating action buttons)
- Form controls (text fields, checkboxes, switches, radio)
- Progress indicators (linear, circular)
- Chips (assist, filter, input, suggestion)
- Lists, menus, dialogs
- Tabs, dividers, elevation
- Icons, ripples, focus rings

### 2. React 19 RC Upgrade

```bash
npm install react@rc react-dom@rc --legacy-peer-deps
```

**Why React 19?**
- Native web components support (no `ref` workarounds)
- Automatic property vs attribute handling
- Custom events work with `onEventName` props
- Passes all "Custom Elements Everywhere" tests

### 3. TypeScript Declarations

Created `types/material-web.d.ts` with complete type definitions for all Material Web custom elements. TypeScript now recognizes all `<md-*>` components with full prop autocomplete.

## File Structure

```
app/
├── globals-md3.css              # Official MD3 design tokens (colors, typography, elevation, etc.)
└── layout.tsx                   # Loads MaterialWebLoader

components/
└── MaterialWebLoader.tsx        # Client component that imports all Material Web components

types/
└── material-web.d.ts           # TypeScript declarations for web components

app/(dev)/md3-test/
└── page.tsx                    # Material Web components demo/test page
```

## Design Tokens (globals-md3.css)

The design system uses official MD3 CSS custom properties:

### Color System

```css
/* Dark Theme (default) */
--md-sys-color-primary: #A8C7FA
--md-sys-color-on-primary: #062E6F
--md-sys-color-primary-container: #0842A0
--md-sys-color-on-primary-container: #D3E3FD

--md-sys-color-secondary: #BEC6DC
--md-sys-color-tertiary: #DEBCDF
--md-sys-color-error: #FFB4AB

--md-sys-color-surface: #1A1C1E
--md-sys-color-on-surface: #E2E2E5

/* Light Theme */
[data-theme='light'] {
  --md-sys-color-primary: #0B57D0
  --md-sys-color-surface: #F9F9FF
  /* ... */
}
```

### Typography Scale

```css
/* Display */
--md-sys-typescale-display-large-size: 57px
--md-sys-typescale-display-medium-size: 45px
--md-sys-typescale-display-small-size: 36px

/* Headline */
--md-sys-typescale-headline-large-size: 32px
--md-sys-typescale-headline-medium-size: 28px
--md-sys-typescale-headline-small-size: 24px

/* Title */
--md-sys-typescale-title-large-size: 22px
--md-sys-typescale-title-medium-size: 16px
--md-sys-typescale-title-small-size: 14px

/* Body */
--md-sys-typescale-body-large-size: 16px
--md-sys-typescale-body-medium-size: 14px
--md-sys-typescale-body-small-size: 12px

/* Label */
--md-sys-typescale-label-large-size: 14px
--md-sys-typescale-label-medium-size: 12px
--md-sys-typescale-label-small-size: 11px
```

### Elevation & Shape

```css
/* Elevation (shadows) */
--md-sys-elevation-0: none
--md-sys-elevation-1: 0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)
--md-sys-elevation-2: ...
/* ... up to elevation-5 */

/* Shape (border radius) */
--md-sys-shape-corner-none: 0px
--md-sys-shape-corner-extra-small: 4px
--md-sys-shape-corner-small: 8px
--md-sys-shape-corner-medium: 12px
--md-sys-shape-corner-large: 16px
--md-sys-shape-corner-extra-large: 28px
--md-sys-shape-corner-full: 9999px
```

## Using Material Web Components

### In React Components (Client-Side)

```tsx
'use client';

export default function MyComponent() {
  return (
    <div>
      {/* Buttons */}
      <md-filled-button>Primary Action</md-filled-button>
      <md-outlined-button>Secondary</md-outlined-button>
      <md-text-button>Tertiary</md-text-button>

      {/* FAB */}
      <md-fab label="Add" size="medium" />

      {/* Form Controls */}
      <md-outlined-text-field
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <md-checkbox checked={isChecked} />
      <md-switch selected={isEnabled} />

      {/* Progress */}
      <md-linear-progress value={0.7} />
      <md-circular-progress indeterminate />

      {/* Chips */}
      <md-chip-set>
        <md-filter-chip label="Option 1" selected />
        <md-filter-chip label="Option 2" />
      </md-chip-set>
    </div>
  );
}
```

### Typography Utilities

Use the `.md3-*` utility classes for typography:

```tsx
<h1 className="md3-display-large">Main Title</h1>
<h2 className="md3-headline-medium">Section Header</h2>
<p className="md3-body-large">Body text</p>
<span className="md3-label-large">Label</span>
```

### Color & Surface Utilities

```tsx
{/* Primary colored container */}
<div className="md3-primary md3-shape-medium">
  Primary surface
</div>

{/* Surface container with elevation */}
<div className="md3-surface-container md3-elevation-2 md3-shape-large">
  Elevated card
</div>
```

## Theming

Material Web components automatically use the CSS custom properties defined in `globals-md3.css`. To customize:

### Change Primary Color

```css
:root {
  --md-sys-color-primary: #YOUR_COLOR;
  --md-sys-color-on-primary: #TEXT_ON_PRIMARY;
  --md-sys-color-primary-container: #CONTAINER_COLOR;
  --md-sys-color-on-primary-container: #TEXT_ON_CONTAINER;
}
```

### Customize Individual Components

```css
/* Make all filled buttons square */
:root {
  --md-filled-button-container-shape: 0px;
}

/* Change button container color */
:root {
  --md-filled-button-container-color: var(--md-sys-color-tertiary);
}
```

## React 19 Web Components Features

### Automatic Property Handling

React 19 automatically determines whether to set properties or attributes:

```tsx
{/* Primitives → attributes */}
<md-checkbox checked />
<md-text-field label="Email" type="email" />

{/* Objects → properties (no JSON.stringify needed) */}
<md-select value={selectedValue} />
```

### Custom Events

Custom events work with standard React event handlers:

```tsx
<md-checkbox
  onChange={(e) => {
    console.log('Checked:', e.target.checked);
  }}
/>
```

### Refs Work Directly

No special handling needed for refs:

```tsx
const buttonRef = useRef<HTMLElement>(null);

<md-filled-button ref={buttonRef}>
  Click me
</md-filled-button>
```

## Testing

Test page available at `/md3-test` showing all Material Web components with:
- All button variants
- FABs in different sizes
- Form controls (text fields, checkboxes, switches)
- Progress indicators
- Chips
- Typography scale
- Color system swatches
- Elevation levels

## Resources

- **Material Design 3**: https://m3.material.io
- **Material Web GitHub**: https://github.com/material-components/material-web
- **Material Web Docs**: https://github.com/material-components/material-web/tree/main/docs
- **React 19 Web Components**: https://react.dev/blog/2024/12/05/react-19#support-for-custom-elements

## Migration Notes

### From Old Custom MD3 Components

**Before:**
```tsx
import { MD3Button } from '@/components/md3/MD3Button';

<MD3Button variant="filled">Click me</MD3Button>
```

**After (Material Web):**
```tsx
<md-filled-button>Click me</md-filled-button>
```

### CSS Class Names

**Old custom classes** (if they existed):
```css
.md3-primary, .md3-on-primary, etc.
```

**New official tokens:**
```css
--md-sys-color-primary
--md-sys-color-on-primary
```

Utility classes remain the same for convenience.

## Next Steps

1. **Redesign all routes** using Material Web components
2. **Replace Mantine components** with Material Web equivalents
3. **Add animations** using Framer Motion + MD3 motion tokens
4. **Implement dark/light toggle** using `[data-theme]` attribute
5. **Add icon library** (Material Symbols or Phosphor Icons)
6. **Test accessibility** with screen readers (MD3 components are WCAG AA compliant)
7. **Performance optimization** with lazy loading of Material Web components

## Achievements Unlocked 🏆

- ✅ Material Web Components v2.4.0 installed
- ✅ React 19 RC upgraded (native web components support)
- ✅ Complete MD3 design token system (official colors, typography, elevation, shape)
- ✅ TypeScript declarations for all Material Web components
- ✅ Material Web Loader component created
- ✅ Roboto font integrated (MD3 standard)
- ✅ Dark + Light theme support
- ✅ MD3 test page created and working
- ✅ Dev server running successfully
- ✅ All routes compiling

**Total XP Earned:** 3,150 XP 🎮
