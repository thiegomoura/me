import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
    const articles = await getCollection('articles', ({ data }) => !data.draft);

    return rss({
        title: 'thiego.dev articles',
        description:
            'Notes on backend engineering, distributed systems, and the operational reality of shipping software.',
        site: context.site!,
        items: articles
            .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
            .map((article) => ({
                title: article.data.title,
                description: article.data.description,
                pubDate: article.data.pubDate,
                link: `/articles/${article.id.replace(/\.md$/, '')}/`,
                categories: article.data.tags,
            })),
        customData: '<language>en-us</language>',
        stylesheet: false,
    });
}
