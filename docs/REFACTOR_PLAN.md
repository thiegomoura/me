# Portfolio Refactor — Plan

Status: draft · Owner: Thiego · Last updated: 2026-08-16

## TL;DR

- Migrate the site from "plain HTML + Bootstrap 4 + jQuery + Bootstrap 5 bundle" to a **single, modern SSG**.
- **Recommended SSG: Astro.** Reasoning in §3.
- Adopt the opencode.ai visual language (monochrome, mono accents, generous whitespace) but keep the senior-backend personality — the goal is "opencode.ai aesthetic, thiego.dev voice".
- End state: 1 framework, 0 jQuery, 0 duplicate CSS, deployable as static files to GitHub Pages.

---

## 1. Current state — what we're paying for

| Concern | Today | Cost |
|---|---|---|
| CSS framework | Bootstrap 4.1.3 (~190KB) | Layout + grid + components |
| JS framework | Bootstrap 4 bundle (slim, ~70KB) | Collapse, dropdown, modal |
| JS framework | jQuery 3.3.1 slim (~70KB) | Bootstrap 4's hard dep |
| JS framework | Bootstrap 5.1.3 bundle (~80KB) | Duplicate of what v4 already provides |
| Total 3rd-party JS | **~220KB** per page | Two Bootstrap trees + jQuery for one mobile nav |
| Custom JS | 5.7KB (`script.js`) | Theme toggle + IntersectionObserver |
| Custom CSS | 24KB | Theme variables + components |
| External requests per page | ~9 (3 CSS + 5 JS) | HTTP overhead on cold cache |

The whole site can run on <30KB total JS (theme toggle + reveal observer) without losing any feature.

---

## 2. Design direction — what we keep, what we change

### Reference: opencode.ai design fingerprint

- **Palette**: 5 shades of gray (`#211E1E` → `#656363` → `#8E8B8B` → `#BCBBBB` → `#CFCECD` → `#DAD9D9` → `#F1ECEC`) + one accent green (`#03B000`) used only for "yes" states.
- **Typography**: One sans-serif (looks like Inter or a Geist variant). Mono is used for stat labels and code.
- **Markers**: `[*]` before list items, `>` after section titles, `Fig 1.` / `Fig 2.` for stat labels. Slightly terminal, slightly academic — works for a backend dev.
- **No card chrome**: content sits in sections divided by hairlines, not in floating cards.
- **Custom SVG illustrations** for hero/stats, no stock photos.

### Translation for thiego.dev

Adopt (per locked decisions):
- **Pure gray scale** (`#211E1E` → `#F1ECEC`) plus a single accent color used **only** for "yes" / success / metric states. Opencode's discipline is its identity; we copy it.
- **No Bootstrap chrome.** No rounded cards everywhere, no blue buttons, no pill badges. Replace with hairline-bordered sections and square buttons.
- **Inter** for body, **JetBrains Mono** for stats, ADR IDs, project numbers, and section labels.
- **`[*]` markers** for skill/feature lists (opencode uses them everywhere). It's a clean way to present "things I know".
- **`>` markers** on section titles (your existing `</ Title >` is close — keep the angle-bracket framing, just smaller and in mono).
- **Generous line height and section padding.** The current site is dense; the new one should breathe.
- **Inline SVG architecture diagrams** (already there in case studies — keep them, they fit the new aesthetic).

Keep:
- Dark/light theme (just re-tokenized against the new palette).
- Reveal-on-scroll behavior.
- Timeline from `data/timeline.json`.

Tone: opencode.ai looks like a precision tool. Your portfolio should look like a precision engineer's notebook — same discipline, your voice. The green is gone from the chrome; the green returns only in `<metric>` blocks (e.g. `−90%` in a metric pill). Everything else is ink.

### Concrete design tokens (proposed)

```css
/* monochrome scale */
--ink-900: #0e1014;   /* background dark */
--ink-800: #16181d;
--ink-700: #1d2025;   /* surface dark */
--ink-600: #262a31;   /* border dark */
--ink-500: #3a3f48;
--ink-400: #5a606b;   /* muted text */
--ink-300: #9aa0aa;   /* default muted */
--ink-200: #c5cad2;
--ink-100: #e6e8ec;   /* surface light */
--ink-050: #f4f5f7;   /* background light */

/* single accent (your green, dialed in) */
--accent: #34d399;    /* default in dark mode, dialed brighter in light */

/* type */
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', 'Berkeley Mono', Menlo, monospace;

/* sizing */
--measure: 64ch;      /* text column */
--gutter: clamp(1.25rem, 2.4vw, 2rem);
```

---

## 3. SSG choice — Astro vs Next.js

**Recommendation: Astro.** Reasoning:

| Axis | Astro | Next.js |
|---|---|---|
| Mental model | HTML + components + optional islands | React app that happens to be static |
| Default JS shipped | 0 KB (zero JS by default) | The React runtime, even for static |
| Output | Plain static HTML/CSS/JS | HTML + JS chunks, hydration cost |
| Markdown | Built-in (`.md` pages, content collections) | Needs a plugin |
| Image optimization | Built-in (`<Image>`) | Needs `next/image` config |
| Sitemap / RSS | Built-in | Needs packages |
| Deploy to GitHub Pages | `dist/` push | `next export` then push (more config, less idiomatic) |
| Bundle for our site (estimated) | ~10–20 KB JS | ~80–120 KB JS minimum |
| Learning curve | Small for your background | Steeper, RSC + App Router |
| When it pays off | Content sites, portfolios, docs | Apps with auth, dashboards, complex state |
| Your existing skills transfer | Yes (HTML/CSS/JS already in your hands) | Mostly — you'd be writing React |

For a portfolio that needs to render 6–7 static pages, a theme toggle, and a reveal observer, **Astro is strictly the better fit.** Next.js is the right call when the site grows into a real app with auth, dashboards, or heavy client-side state. The portfolio isn't going there.

You flagged the duplication of Bootstrap 4 + 5 + jQuery. Astro solves that by removing Bootstrap entirely. We replace the grid with CSS Grid (which you don't need a framework for at 6 pages) and the few interactive bits (mobile nav, theme toggle) with ~2KB of vanilla JS in an Astro island.

If you have a reason to prefer Next.js — for example, you want to add a CMS later, or you want to learn React Server Components — say so and I'll write the plan around Next.js. But absent that, **the answer is Astro**.

---

## 4. Migration plan

### Phase 0 — Repo hygiene (1 commit)

- Add `.gitignore` for `node_modules/`, `dist/`, `.astro/`, `.env*`.
- Move `curriculo.json` (currently empty) into a comment in the layout, or remove.
- Move `img/projects/*.png` (Barralcool, Conarc, Rotaract — WordPress era) into `img/_archive/` so we don't ship dead assets. ~400KB.
- Keep `data/timeline.json` — it'll move into `src/data/`.

### Phase 1 — Astro scaffold (1 commit)

```
npx create-astro@latest --template minimal --no-install .
npm install
```

Configure `astro.config.mjs`:
```js
export default defineConfig({
  site: 'https://www.thiego.dev',
  output: 'static',
  build: { format: 'directory' }, // produces /index.html, /case-study-sync/index.html
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
```

Add `package.json` scripts: `dev`, `build`, `preview`.

### Phase 2 — Layouts & components (the meat)

```
src/
  layouts/
    BaseLayout.astro      # <head>, nav, footer, theme provider, global CSS
  components/
    Nav.astro             # nav with active-link logic
    Footer.astro
    Hero.astro            # home hero with stat-boxes
    StatBox.astro         # one stat
    SkillGroup.astro      # one skill card
    ProjectCard.astro     # one case study teaser
    ArchitectureDiagram.astro
    ADR.astro             # one ADR block
    Timeline.astro        # reads src/data/timeline.json
    ThemeToggle.astro     # small client island
    Reveal.astro          # small client island (IntersectionObserver)
  data/
    timeline.json         # moved from data/
  pages/
    index.astro
    projects.astro
    case-study-sync.astro
    case-study-perf.astro
    case-study-platform.astro
    adrs.astro
    timer.astro           # keep as-is or port to a small SPA island
  styles/
    global.css            # the new design tokens + base styles
```

**No client framework needed.** `ThemeToggle.astro` and `Reveal.astro` use `<script>` blocks with `is:inline` and `client:load` semantics. Total client JS budget: < 5KB.

### Phase 3 — Content port

Same content as today, new shell. The case studies, ADRs, and stat numbers carry over unchanged. The main changes are:
- Strip Bootstrap classes, replace with semantic class names that match the new design tokens.
- Inline the SVG architecture diagrams (already done in current case studies).
- Convert all devicon `<img>` tags to inline SVGs (one-time fetch + save to `src/assets/stack/`) — removes 14 external requests and the flash of unstyled icons.

### Phase 4 — Deploy

Two options:

**Option A — manual `dist/` push (simplest)**
```bash
npm run build
git add dist/
git commit -m "build: refresh"
git subtree push --prefix dist origin gh-pages
```
You'd switch GitHub Pages source to `gh-pages` branch (one-time, in repo settings).

**Option B — GitHub Actions (cleaner)**
`.github/workflows/deploy.yml` runs `npm run build` on push to `master` and deploys `dist/` via `actions/deploy-pages@v4`. No manual pushes.

I'd recommend **Option B**. It's the GitHub-native way and matches the "deploy on merge to master" the current setup already implies.

### Phase 5 — Cleanup

- Remove old `index.html`, `projects.html`, `case-study-*.html`, `adrs.html`, `styles.css`, `js/script.js` — the Astro build replaces them all.
- Update `AGENTS.md` to reflect the new toolchain.
- Update `CNAME` handling — Astro with `output: 'static'` and `build.format: 'directory'` doesn't auto-emit a `CNAME`. Add a tiny post-build step (or copy `static/CNAME` → `dist/CNAME`).

---

## 5. Acceptance bar

- [ ] `npm run build` produces `dist/` with `index.html`, all case studies, `adrs/`, `CNAME`, no external CSS/JS framework.
- [ ] Total client JS for the home page ≤ 10KB.
- [ ] No `bootstrap` or `jquery` references anywhere in `dist/`.
- [ ] Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on the home page.
- [ ] Light/dark theme works, persists across reloads, no flash of wrong theme.
- [ ] Timeline loads from `src/data/timeline.json` at build time (no runtime fetch).
- [ ] Mobile nav works without a framework (≤ 30 lines of vanilla JS).
- [ ] All case study SVG diagrams render correctly in light and dark themes.
- [ ] Deploys automatically on push to `master` via GitHub Actions.

---

## 6. Locked decisions

1. **SSG: Astro** ✅
2. **Palette: pure gray scale** (opencode.ai discipline) — green returns only on metric pills and "yes" states ✅
3. **Font: Inter + JetBrains Mono** (via Google Fonts) ✅
4. **Deploy: GitHub Actions** (`.github/workflows/deploy.yml`) ✅
5. **`timer.html`**: not yet decided — flag for follow-up. Keep current file untouched for now, port in a later phase if the user confirms.

Once you give the go-ahead, the migration runs in the 5 phases above. Each phase is a single commit, so the diff is reviewable at every step.

## 7. Next step

Confirm and I start with **Phase 0 (repo hygiene) + Phase 1 (Astro scaffold)** in one commit pair. The full migration is 5 phases; expect ~6–8 hours of focused work split across them, with a working site at the end of each phase so nothing is broken mid-flight.
