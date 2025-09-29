Tailwind v4 Compliance Runbook

- Baseline
  - Ensure `tailwindcss@^4` and `@tailwindcss/postcss@^4` in `devDependencies` (package.json).
  - Use PostCSS plugin only: `postcss.config.cjs:1` should contain `{"@tailwindcss/postcss": {}}`.
  - Replace legacy directives with `@import` in CSS and move plugins to CSS via `@plugin`.

- Repo changes (applied)
  - postcss: postcss.config.cjs — removed `autoprefixer` (Tailwind v4 handles this via its plugin).
  - css: app/globals.css — replaced `@tailwind base/components/utilities` with `@import "tailwindcss";` and added `@plugin "@tailwindcss/typography";` + `@plugin "tailwindcss-animate";`.
  - css: app/globals.css — added `@source` globs for `app`, `components`, and `lib`.
  - config: removed `tailwind.config.cjs` (v4 no longer needs it when using `@theme/@utility/@plugin`).

- Theme & utilities
  - Define theme in CSS with `@theme` and use `--color-*` variables. Example in `app/globals.css:26`.
  - For custom utilities or components, prefer `@utility` over `@layer`.

- Deprecation checks (quick scan)
  - No occurrences in app code of `flex-shrink-*`, `flex-grow-*`, `bg-opacity-*`, `decoration-(slice|clone)`, or `overflow-ellipsis`.
  - Static prototype files under `OKComputer_UI Redesign Blueprint/` are excluded from builds.

- Build verification
  - `npm run build` passes with Next.js 15.
  - `npm test` and `npm run validate:items` are green.

- References
  - Tailwind v4 upgrade guide (use `@tailwindcss/upgrade` and `@tailwindcss/postcss`).
  - `@plugin` directive for legacy plugins like `@tailwindcss/typography`.

