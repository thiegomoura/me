# AGENTS.md

Personal portfolio site for [thiego.dev](https://www.thiego.dev) — built with Astro 5, deployed to GitHub Pages via GitHub Actions.

## Setup commands

- Install deps: `npm install`
- Start dev:   `npm run dev` (defaults to http://localhost:4321)
- Build:       `npm run build` (output: `dist/`)
- Preview:     `npm run preview` (serves the production build)
- Lint/Typecheck: not configured — TS runs in strict mode via `astro/tsconfigs/strict`

## Project layout

- `astro.config.mjs` — site URL, output: 'static', directory-format builds
- `tsconfig.json` — extends `astro/tsconfigs/strict`
- `src/pages/` — `.astro` routes (`index`, `projects`, `case-study-*`, `adrs`)
- `src/layouts/` — `BaseLayout`, `CaseStudyLayout`
- `src/components/` — `Nav`, `Footer`, `ThemeToggle`, `Hero`, `SkillGroup`, `ProjectCard`, `Timeline`, `ADR`
- `src/scripts/reveal.ts` — IntersectionObserver wrapper for `.reveal` elements
- `src/styles/global.css` — design tokens + base styles
- `src/data/timeline.json` — experience timeline (imported at build time)
- `public/CNAME` — GitHub Pages custom domain (`www.thiego.dev`)
- `public/favicon.ico` — site favicon
- `docs/REFACTOR_PLAN.md` — the 5-phase migration plan

## Code style

- **TypeScript strict** via `astro/tsconfigs/strict`.
- **No client framework.** Theme toggle and reveal observer are vanilla TS/JS in their own components. No React, no Vue, no Tailwind.
- **Design tokens live in `global.css`**, not in components. Use `var(--text)`, `var(--text-muted)`, `var(--text-dim)`, `var(--bg)`, `var(--surface)`, `var(--hairline)`, `var(--accent)`.
- **Mono = `var(--font-mono)`** (JetBrains Mono) for stats, IDs, labels, code, meta.
- **Sans = `var(--font-sans)`** (Inter) for body and headings.
- **Inter + JetBrains Mono** are loaded from Google Fonts in `BaseLayout`.
- **Keep new logic in components**, not inline in pages, unless it's a one-off.
- **Run before committing:** `npm run build` and `npm run preview` to verify the change visually. There is no automated check.

## PR & commit conventions

- Default branch is `master` (also the GitHub Pages publish branch).
- Commit messages follow **Conventional Commits** (`feat:`, `chore:`, `docs:`, `refactor:`, `style:`, `ci:`, `fix:`). Keep them lowercase, imperative, scoped.
- Open PRs against `master`.
- Publishing is automatic on push to `master` via `.github/workflows/deploy.yml`.

## Deploy

- **Trigger:** push to `master` (or manual `workflow_dispatch`).
- **Build:** `npm ci` + `npm run build` on Node 20.
- **Artifact:** `dist/`.
- **Publish:** `actions/deploy-pages@v4` to the `github-pages` environment.
- **Custom domain:** `public/CNAME` is copied into `dist/` and read by GitHub Pages. No DNS work needed unless the domain changes.
- **First-time setup:** repo Settings > Pages > Source must be set to **GitHub Actions** (not "Deploy from a branch"). After that, every push to `master` deploys.

## Security

- **No secrets, no API keys, no env files.** Static site, no server runtime.
- `.gitignore` covers `node_modules/`, `dist/`, `.astro/`, `.env*`.
- The `public/CNAME` is the only public-facing config; don't add tokens there.
