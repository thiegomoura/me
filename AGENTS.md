# AGENTS.md

Personal portfolio site for [thiego.dev](https://www.thiego.dev) — static HTML/CSS/JS, served via GitHub Pages.

## Setup commands

There is no build step, package manager, or test runner in this repo. Pick one of:

- **Local preview (no tool):** open `index.html` directly in a browser.
- **Local preview (recommended):** `python3 -m http.server 8000` from the repo root, then visit `http://localhost:8000`.
- **Any static server** (`npx serve`, `caddy file-server`, etc.) works — there is nothing to install.

## Project layout

- `index.html` — landing page (hero, about, experience timeline, contact)
- `projects.html` — projects showcase
- `timer.html` — standalone timer page (uses `js/script.js`)
- `styles.css` — single global stylesheet (Bootstrap 4.1.3 loaded from CDN)
- `js/script.js` — vanilla JS (theme toggle, reveal-on-scroll observer, timer logic)
- `data/timeline.json` — experience timeline data loaded by `index.html`
- `curriculo.json` — resume payload (currently empty — reserved)
- `img/` — site logos and project screenshots
- `docs/` — reserved for long-form docs (currently empty)
- `CNAME` — GitHub Pages custom domain (`www.thiego.dev`)
- `.editorconfig` — formatting rules (4-space indent, CRLF, UTF-8)

## Code style

- **EditorConfig is the source of truth** (`.editorconfig`): 4-space indent, CRLF line endings, UTF-8, no final-newline insertion, no trim-trailing. Respect it.
- **HTML/CSS/JS are vanilla** — no TypeScript, no Prettier, no ESLint, no bundler. Match surrounding patterns instead of introducing tooling.
- **Bootstrap 4.1.3 + Bootstrap Icons** are loaded via CDN in `<head>`; reuse their classes/grid where they already exist rather than re-implementing.
- **JS is small (~200 lines) and dependency-free** — keep it that way. New logic goes in `js/script.js` unless it is page-specific, in which case inline it.
- **Run before committing:** open the affected HTML page in a browser and verify the change visually. There is no automated check.

## PR & commit conventions

- Default branch is `master` (also the GitHub Pages publish branch — do not force-push).
- `dev` and `php` branches exist for ongoing work; create feature branches from `master`.
- Commit messages follow **Conventional Commits** — observed prefixes in history: `feat:`, `chore:`, `docs:`, `refactor:`. Keep them lowercase, imperative, scoped.
- Open PRs against `master` once the page renders correctly locally.
- Publishing is automatic on merge to `master` (GitHub Pages reads `CNAME`).

## Security

- **No secrets, no API keys, no env files.** This is a public static site — keep it that way.
- `.gitignore` does not exist yet; do not commit build artifacts, `node_modules/`, or local server caches if you add tooling.
- External CDN assets use Subresource Integrity (SRI) hashes where loaded — preserve them when bumping versions.
