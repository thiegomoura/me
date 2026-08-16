import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://www.thiego.dev',
    output: 'static',
    build: {
        format: 'directory',
    },
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'viewport',
    },
});
