import { defineCollection, z } from 'astro:content';

const caseStudies = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        tag: z.string(),
        subtitle: z.string(),
        period: z.string(),
        context: z.string(),
        metric: z.object({
            value: z.string(),
            label: z.string(),
        }),
        stack: z.array(z.string()),
        diagram: z.enum(['sync', 'perf', 'platform']).optional(),
        order: z.number().default(100),
    }),
});

const articles = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
    }),
});

export const collections = {
    'case-studies': caseStudies,
    articles,
};
