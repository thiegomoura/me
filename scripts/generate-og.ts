/**
 * Generates Open Graph images for every case study and article at build time.
 * Output: public/og/<slug>.png (1200x630)
 *
 * Run as a prebuild step: `tsx scripts/generate-og.ts` before `astro build`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FONT_REGULAR = fs.readFileSync(
    path.join(ROOT, 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff'),
);
const FONT_BOLD = fs.readFileSync(
    path.join(ROOT, 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'),
);

const OUT_DIR = path.join(ROOT, 'public', 'og');
fs.mkdirSync(OUT_DIR, { recursive: true });

interface CaseStudyFrontmatter {
    title: string;
    tag: string;
    subtitle: string;
    period: string;
    context: string;
    metric: { value: string; label: string };
    stack: string[];
}

interface ArticleFrontmatter {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
}

async function renderCaseStudy(fm: CaseStudyFrontmatter) {
    const tagUpper = fm.tag.toUpperCase();

    return html`
        <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0e1014;color:#f8fafc;padding:72px 80px;font-family:Inter;">
            <div style="display:flex;align-items:center;gap:14px;">
                <span style="color:#34d399;font-size:24px;">></span>
                <span style="color:#5a606b;font-size:22px;letter-spacing:0.18em;font-weight:600;">${tagUpper}</span>
            </div>
            <div style="display:flex;flex-direction:column;margin-top:64px;flex-grow:1;justify-content:center;">
                <div style="font-size:78px;font-weight:700;letter-spacing:-0.035em;line-height:1.05;">${fm.title}</div>
                <div style="font-size:26px;color:#9aa0aa;margin-top:32px;line-height:1.5;max-width:980px;">${fm.subtitle}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <div style="display:flex;align-items:baseline;gap:14px;background:#34d399;color:#0e1014;padding:14px 22px;">
                    <span style="font-size:30px;font-weight:700;">${fm.metric.value}</span>
                    <span style="font-size:20px;font-weight:500;opacity:0.78;">${fm.metric.label}</span>
                </div>
                <div style="font-size:22px;color:#9aa0aa;font-weight:500;">${fm.context} · ${fm.period}</div>
            </div>
        </div>
    `;
}

async function renderArticle(fm: ArticleFrontmatter) {
    const date = fm.pubDate.toISOString().slice(0, 10);
    const tagLine = fm.tags
        .slice(0, 3)
        .map((t) => `#${t}`)
        .join(' ');

    return html`
        <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0e1014;color:#f8fafc;padding:72px 80px;font-family:Inter;">
            <div style="display:flex;align-items:center;gap:14px;">
                <span style="color:#34d399;font-size:24px;">></span>
                <span style="color:#5a606b;font-size:22px;letter-spacing:0.18em;font-weight:600;">ARTICLE</span>
            </div>
            <div style="display:flex;flex-direction:column;margin-top:64px;flex-grow:1;justify-content:center;">
                <div style="font-size:78px;font-weight:700;letter-spacing:-0.035em;line-height:1.05;">${fm.title}</div>
                <div style="font-size:26px;color:#9aa0aa;margin-top:32px;line-height:1.5;max-width:980px;">${fm.description}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <div style="font-size:22px;color:#5a606b;">${date}${tagLine ? '  ·  ' + tagLine : ''}</div>
                <div style="font-size:22px;color:#9aa0aa;font-weight:500;">thiego.dev</div>
            </div>
        </div>
    `;
}

async function renderPng(svg: string): Promise<Buffer> {
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 },
        font: { loadSystemFonts: false },
    });
    return resvg.render().asPng();
}

async function processCaseStudies(): Promise<string[]> {
    const dir = path.join(ROOT, 'src/content/case-studies');
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    const out: string[] = [];

    for (const file of files) {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
        const { data } = matter(raw);
        const fm = data as CaseStudyFrontmatter;
        const slug = file.replace(/\.md$/, '');

        const markup = await renderCaseStudy(fm);
        const svg = await satori(markup, {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: FONT_REGULAR, weight: 400, style: 'normal' },
                { name: 'Inter', data: FONT_BOLD, weight: 700, style: 'normal' },
            ],
        });

        const png = await renderPng(svg);
        const outPath = path.join(OUT_DIR, `case-study-${slug}.png`);
        fs.writeFileSync(outPath, png);
        out.push(`case-study-${slug}.png`);
    }

    return out;
}

async function processArticles(): Promise<string[]> {
    const dir = path.join(ROOT, 'src/content/articles');
    if (!fs.existsSync(dir)) return [];

    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('.'));

    const out: string[] = [];

    for (const file of files) {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
        const { data } = matter(raw);
        const fm = data as ArticleFrontmatter;

        if ((fm as any).draft) continue;

        const slug = file.replace(/\.md$/, '');
        const markup = await renderArticle(fm);
        const svg = await satori(markup, {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: FONT_REGULAR, weight: 400, style: 'normal' },
                { name: 'Inter', data: FONT_BOLD, weight: 700, style: 'normal' },
            ],
        });

        const png = await renderPng(svg);
        const outPath = path.join(OUT_DIR, `article-${slug}.png`);
        fs.writeFileSync(outPath, png);
        out.push(`article-${slug}.png`);
    }

    return out;
}

async function processDefault(): Promise<string> {
    const markup = html`
        <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0e1014;color:#f8fafc;padding:80px;font-family:Inter;">
            <div style="display:flex;align-items:center;gap:14px;">
                <span style="color:#34d399;font-size:24px;">></span>
                <span style="color:#5a606b;font-size:22px;letter-spacing:0.18em;font-weight:600;">BACKEND ENGINEER</span>
            </div>
            <div style="display:flex;flex-direction:column;margin-top:64px;flex-grow:1;justify-content:center;">
                <div style="font-size:96px;font-weight:700;letter-spacing:-0.04em;line-height:1;">Thiego Moura</div>
                <div style="font-size:32px;color:#9aa0aa;margin-top:32px;line-height:1.4;max-width:980px;">Backend systems that handle millions of requests without paging me at 3 AM.</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <div style="display:flex;align-items:baseline;gap:14px;background:#34d399;color:#0e1014;padding:14px 22px;">
                    <span style="font-size:30px;font-weight:700;">5+ years</span>
                    <span style="font-size:20px;font-weight:500;opacity:0.78;">30+ APIs · 99.95% SLA</span>
                </div>
                <div style="font-size:22px;color:#9aa0aa;font-weight:500;">Node.js · Nest.js · TypeScript · AWS · Azure</div>
            </div>
        </div>
    `;

    const svg = await satori(markup, {
        width: 1200,
        height: 630,
        fonts: [
            { name: 'Inter', data: FONT_REGULAR, weight: 400, style: 'normal' },
            { name: 'Inter', data: FONT_BOLD, weight: 700, style: 'normal' },
        ],
    });

    const png = await renderPng(svg);
    const outPath = path.join(OUT_DIR, 'default.png');
    fs.writeFileSync(outPath, png);
    return 'default.png';
}

async function main() {
    const start = Date.now();
    const def = await processDefault();
    const cases = await processCaseStudies();
    const articles = await processArticles();

    const total = 1 + cases.length + articles.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`[og] generated ${total} images in ${elapsed}s`);
    for (const f of [def, ...cases, ...articles]) {
        console.log(`[og]   ${f}`);
    }
}

main().catch((err) => {
    console.error('[og] failed:', err);
    process.exit(1);
});
