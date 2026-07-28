// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// `site` is what lets Astro emit absolute URLs, which the canonical tag,
// Open Graph metadata and the sitemap all require.
//
// No `base` is set on purpose: this repo is named `srikoushik.github.io`,
// so GitHub Pages serves it from the domain root rather than a subpath.
export default defineConfig({
  site: 'https://srikoushik.github.io',
  integrations: [sitemap(), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});