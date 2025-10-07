NewUI legacy stubs
===================

These lightweight components exist solely so the `/app/dev/design-system`
playground continues to render without importing production modules. They map to
the shared design tokens and wrap simple Tailwind classes; production UI still
uses HeroUI.

If the playground is retired, you can delete `components/newui/**` and update
`app/dev/design-system/page.tsx` accordingly.
