// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// `site` is what lets Astro emit absolute URLs, which the canonical tag,
// Open Graph metadata and the sitemap all require.
//
// No `base` is set on purpose: this repo is named `srikoushik.github.io`,
// so GitHub Pages serves it from the domain root rather than a subpath.
export default defineConfig({
  site: 'https://srikoushik.github.io',
  // No UI framework integration: every page is static markup plus two inline
  // scripts, so there is nothing to hydrate.
  integrations: [sitemap()],

  build: {
    /*
     * The stylesheet is the last render-blocking request on either page, and
     * at ~4.6 KB compressed it is far smaller than the round trip it costs:
     * measured against the live site, a warm Fastly edge answers in ~33ms and
     * a cold one in ~250ms, during which nothing paints. Inlining it drops
     * each page to two requests — the document and the font — and the
     * document alone is then enough to render.
     *
     * `always` rather than the default `auto`, which only inlines below
     * Vite's 4 KB `assetsInlineLimit` and so leaves this one linked.
     *
     * The cost is that the CSS is repeated in each page rather than cached
     * once across both. That would be the wrong trade against a long
     * `max-age`, but GitHub Pages caps every asset here at `max-age=600`, so
     * the shared copy is being re-fetched about as often as the inline one
     * would be. Revisit this if the site ever moves to a host that allows
     * `immutable`, or if the stylesheet outgrows its budget.
     */
    inlineStylesheets: 'always',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});