> ## Archived README (For Historical Context)
> 
> *The original README is preserved below for historical context. The information above reflects the current state of the MVP.*
> 
> # Studyin Module Arcade (Skeleton)
> 
> Deterministic, evidence-first scaffold for Studyin modules. It ships with an OMS-1 upper-limb sample bank today, but the prompts, CI, and agents are module-agnostic so you can retarget new systems without retooling.
> 
> UI stack: Next.js App Router + Tailwind CSS 4 (via `@tailwindcss/postcss`) + OKC (Duolingo‑inspired) design. Heavy visuals via anime.js (micro‑motion), ECharts (charts), Splide (carousels), and Three.js (3D viewer). React Flow powers the custom graphs.
> 
> ## Quick Start
> 
> ```bash
> npm install
> npm run validate:items   # Validate sample bank (A–E gate)
> npm run analyze          # Generate public/analytics/latest.json
> npm run jobs:refit       # (manual) Run weekly Rasch/GPCM refit summary (writes data/refit-summaries)
> npm test                 # Run engine smoke tests (Vitest)
> # Optional: npm test -- --include=tests/e2e-js/** to execute Playwright smoke tests (default Vitest run excludes tests/e2e-js/**)
> 
> # Dev server (auto opens http://localhost:3000)
> npm run dev
> ```
> 
> Requirements: Node 20.14.x LTS (set via `.nvmrc`). Install Git LFS for evidence assets.
