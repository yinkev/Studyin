# Design System

Studyin uses **Material Design 3 (Material Web)** components with project tokens for a cohesive, high‑contrast UI. Tailwind utilities may be used for layout and spacing.

## Principles

- Clarity over ornament; motion supports meaning
- Consistent spacing scale and radii
- Dark mode parity; respect prefers‑color‑scheme

## Foundations

- Color: MD3 roles (primary, secondary, tertiary, surface, error)
- Typography: system font stack tuned for legibility
- Elevation: minimal shadows; use surface tint where appropriate
- Radius: 8px default; 12–16px for large surfaces

## Components

- Use Material Web (`@material/web`) for buttons, cards, dialogs, tabs, menus, tooltips, toasts
- Wrap as local components in `components/ui/*` to apply tokens and variants
- Prefer Radix UI primitives (already in deps) for composable patterns where Material lacks coverage

## Theming

- Maintain light/dark palettes; expose CSS custom properties
- Store theme preference locally; no server state for theming
- Avoid layout shift: pre‑inline theme class on server render

## Performance

- Lazy‑load heavy visuals (charts, 3D) per route
- Pre‑size media; include natural width/height to avoid CLS
- Aim for item render time <100 ms (P95)

