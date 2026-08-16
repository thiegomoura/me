# Content Management Plan

Status: draft · Owner: Thiego · Last updated: 2026-08-16

## TL;DR

Use **Astro Content Collections** — Markdown files in `src/content/case-studies/` and `src/content/articles/`, with a schema-validated frontmatter and a single template that auto-renders every entry. To add a new case study or article: drop a `.md` file. That's it. Build, commit, push, deploys.

This is the right answer for a backend dev who wants to add long-form content (case studies, articles) without touching `.astro` files. The toolchain already supports it; the only work is wiring it up.

---

## Why this over the two options you mentioned

### ❌ One big JSON file

Painful once case studies get long. Your existing ones are 200–500 lines of prose each. A JSON with long string fields is unreadable, un-PR-able, and you'll dread editing it. JSON shines for config/metadata, not for prose.

### ❌ Folder of `.astro` files

You've already seen the cost: 3 case studies = 3 nearly-identical files with hand-typed props. Adding a 4th means copying a file, editing props, writing content inline. No structure forces you to keep them consistent.

### ✅ Markdown files in Content Collections

- One file per case study / article — clean diffs, one PR per item
- Markdown is what you'll write articles in anyway (same format as your blog)
- Frontmatter is **typed** — build fails if you mistype `metric` vs `metirc`
- One detail template handles N items — no copy-paste
- Auto-routing from filename (`offline-first-sync.md` → `/case-study/offline-first-sync/`)
- Sorting, filtering, drafts, RSS, search are all 1-line additions later
- The same shape works for articles — same workflow, same toolchain

---

## File structure

```
src/
  content/
    config.ts                       # Zod schemas
    case-studies/
      offline-first-sync.md
      query-rewrites.md
      serverless-platform.md
    articles/                       # start empty, drop .md files here
  pages/
    case-study/
      [slug].astro                  # ONE detail template, renders any case study
    articles/
      index.astro                   # list of all published articles
      [slug].astro                  # ONE detail template for articles
```

The 3 current `src/pages/case-study-X.astro` files get **replaced** by a single `[slug].astro` template that renders any entry from the collection.

---

## Schema

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const caseStudies = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        tag: z.string(),
        subtitle: z.string(),
        period: z.string(),                  // e.g. "2023", "2021–2023"
        context: z.string(),                 // e.g. "Ioasys"
        metric: z.object({
            value: z.string(),               // e.g. "−90%"
            label: z.string(),               // e.g. "sync defects"
        }),
        stack: z.array(z.string()),
        diagram: z.enum(['sync', 'perf', 'platform']).optional(),
        order: z.number().default(100),      // display order
    }),
});

const articles = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),   // drafts hidden in production
    }),
});

export const collections = {
    'case-studies': caseStudies,
    articles,
};
```

If a frontmatter field is missing or mistyped, the build fails with a precise error pointing at the file and field. No silent typos.

---

## Example case-study file

```md
---
title: "Generic Offline-First Sync Service"
tag: "Backend Platform"
subtitle: "A table-agnostic sync engine that eliminated per-feature custom logic."
period: "2023"
context: "Ioasys"
metric:
  value: "−90%"
  label: "sync defects"
stack: ["Nest.js", "TypeScript", "PostgreSQL", "Azure"]
diagram: "sync"
order: 10
---

## Context

The product had grown into a multi-module application where each new
offline-capable feature required its own sync implementation...

## Problem

- Every offline feature re-implemented deltas, conflict resolution, retry logic.
- Sync bugs were the single largest source of customer-reported issues.
```

Notice: the prose is in Markdown, the metadata is in frontmatter, the SVG diagram is referenced by name (`diagram: "sync"`) and rendered by the template.

---

## Detail page template (one file, all case studies)

```astro
---
// src/pages/case-study/[slug].astro
import { getCollection, render } from 'astro:content';
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro';
import SyncDiagram from '../../components/diagrams/SyncDiagram.astro';
import PerfDiagram from '../../components/diagrams/PerfDiagram.astro';
import PlatformDiagram from '../../components/diagrams/PlatformDiagram.astro';

export async function getStaticPaths() {
    const studies = await getCollection('case-studies');
    return studies.map((study) => ({ params: { slug: study.id }, props: { study } }));
}

const diagrams = { sync: SyncDiagram, perf: PerfDiagram, platform: PlatformDiagram };
const { study } = Astro.props;
const { Content } = await render(study);
const Diagram = study.data.diagram ? diagrams[study.data.diagram] : null;
---
<CaseStudyLayout
    title={study.data.title}
    tag={study.data.tag}
    subtitle={study.data.subtitle}
    meta={[study.data.context, study.data.period, `${study.data.metric.value} ${study.data.metric.label}`]}
>
    {Diagram && <Diagram />}
    <Content />
    <h2>Stack</h2>
    <div class="stack">
        {study.data.stack.map((tech) => <span class="tag">{tech}</span>)}
    </div>
</CaseStudyLayout>
```

Adding a 4th case study = dropping a 4th `.md` file. No template change.

---

## How to add new content (the easy part)

### New case study
```bash
# 1. Create the file
touch src/content/case-studies/my-new-study.md

# 2. Fill in frontmatter (autocomplete from schema in your editor)
# 3. Write prose in Markdown
# 4. Commit + push
git add src/content/case-studies/my-new-study.md
git commit -m "feat(case-study): add my-new-study"
git push
```

Site picks it up on next build. Detail page exists at `/case-study/my-new-study/`. Card appears on `/` and `/projects/`.

### New article
```bash
touch src/content/articles/my-article.md
# write
git add src/content/articles/my-article.md
git commit -m "feat(article): my-article"
git push
```

Detail page at `/articles/my-article/`. Listed on `/articles/`. (Optional: RSS feed later.)

### Drafts

Add `draft: true` to frontmatter. Template filters them out in production builds (local dev still shows them so you can preview).

---

## Migration steps

1. Add `src/content/config.ts` with the schemas above.
2. Move the 3 case study bodies into `src/content/case-studies/*.md`. SVG diagrams become reusable components.
3. Delete `src/pages/case-study-sync.astro`, `case-study-perf.astro`, `case-study-platform.astro`.
4. Create `src/pages/case-study/[slug].astro` (the template).
5. Update `src/pages/index.astro` and `src/pages/projects.astro` to use `getCollection('case-studies')`.
6. Create `src/pages/articles/index.astro` and `src/pages/articles/[slug].astro`.
7. Add `Articles` to `Nav.astro`.
8. Build, smoke-test, commit.

Total: 1 commit, ~2 hours of focused work. Site stays functional at each step.

---

## What you get for free later

Once collections are wired, these become 5-line additions:

- **RSS feed** for articles (`@astrojs/rss`)
- **Tag pages** (`/articles/tag/backend/`)
- **Full-text search** (Pagefind — static, no server)
- **Drafts workflow** (`draft: true` filter)
- **OG image generation** for each case study / article
- **View Transitions** between case study list ↔ detail
- **Estimated reading time** (Astro `reading-time` integration)

None of these is in scope now. But the collection setup unblocks them.

---

## Decision I need from you

**Go with this plan?** It replaces the 3 individual `case-study-X.astro` files with a single dynamic template, introduces 2 new schemas, and adds 1 new section (Articles) ready for you to write into. After this, adding a case study or article is a 2-minute job.

If yes, I execute in 1 commit. If you'd rather keep the 3 hard-coded `.astro` files and only add a JSON sidecar, say so — I can do that, it's just less elegant for long content.
