import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://automated-blogger.vercel.app',
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [mdx(), sitemap()],
  vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
    },
  },
});
