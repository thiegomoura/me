/**
 * Estimate reading time for an article.
 * Assumes 200 words per minute (average for technical prose).
 * Strips markdown syntax before counting to avoid inflating the word count.
 */
export function readingTime(markdown: string): number {
    const text = markdown
        .replace(/```[\s\S]*?```/g, ' ')        // fenced code blocks
        .replace(/`[^`]*`/g, ' ')                // inline code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')  // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → keep label only
        .replace(/[#>*_~\-]+/g, ' ')             // markdown syntax
        .replace(/\s+/g, ' ')
        .trim();

    const words = text.split(' ').filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}

export function formatReadingTime(minutes: number): string {
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
}
