import { test, expect, type Page } from '@playwright/test';

const ORIGIN = 'https://srikoushik.github.io';

const contentOf = (page: Page, selector: string) =>
  page.locator(selector).getAttribute('content');

test.describe('metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('emits a complete, non-empty head', async ({ page }) => {
    await expect(page).toHaveTitle(/\S/);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:url"]',
      'meta[property="og:image"]',
      'meta[property="og:image:type"]',
      'meta[property="og:image:width"]',
      'meta[property="og:image:height"]',
      'meta[property="og:image:alt"]',
      'meta[property="og:locale"]',
      'meta[name="twitter:card"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:alt"]',
    ]) {
      expect(await contentOf(page, selector), `${selector} is empty`).toBeTruthy();
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  // The dimensions and the card type are a pair: a 1200x630 image behind a
  // square `summary` card crops badly, and `summary_large_image` behind a
  // square image letterboxes. They must move together.
  test('ships the wide share card with honest dimensions', async ({ page }) => {
    await page.goto('/');
    expect(await contentOf(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(await contentOf(page, 'meta[property="og:image:width"]')).toBe('1200');
    expect(await contentOf(page, 'meta[property="og:image:height"]')).toBe('630');
  });

  // Direct regression test for the previous site, which shipped a relative
  // og:image and therefore rendered link previews without an image.
  test('uses absolute URLs for canonical and og:image', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogImage = await contentOf(page, 'meta[property="og:image"]');

    expect(canonical).toMatch(new RegExp(`^${ORIGIN}`));
    expect(ogImage).toMatch(new RegExp(`^${ORIGIN}`));
  });

  test('keeps the Search Console verification tag', async ({ page }) => {
    expect(await contentOf(page, 'meta[name="google-site-verification"]')).toBeTruthy();
  });

  test('does not accidentally block indexing', async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  // rel="me" completes the bidirectional identity check that Mastodon and
  // IndieWeb verification look for; it only belongs on profile roots.
  test('marks profile links as the same identity', async ({ page }) => {
    for (const href of ['linkedin.com/in/srikoushik', 'github.com/srikoushik']) {
      const rel = await page.locator(`a[href*="${href}"]`).first().getAttribute('rel');
      expect(rel).toMatch(/\bme\b/);
      expect(rel).toContain('noopener');
    }
  });
});

test.describe('structured data', () => {
  test('is valid ProfilePage markup describing a Person', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(raw, 'no JSON-LD block found').toBeTruthy();

    const data = JSON.parse(raw!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('ProfilePage');
    expect(data.mainEntity['@type']).toBe('Person');
    expect(data.mainEntity.name).toBeTruthy();
    // Sourced from the tech stack, so this only breaks if site.ts does.
    expect(data.mainEntity.knowsAbout).toContain('TypeScript');
  });

  test('sameAs matches the links actually visible on the page', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const sameAs: string[] = JSON.parse(raw!).mainEntity.sameAs;

    expect(sameAs.some((url) => url.includes('linkedin.com'))).toBe(true);
    expect(sameAs.some((url) => url.includes('github.com'))).toBe(true);

    // Structured data disagreeing with the rendered page is worse than none.
    const visible = await page.locator('a[href^="http"]').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    );
    for (const url of sameAs) {
      expect(visible, `${url} is in sameAs but not linked on the page`).toContain(url);
    }
  });
});

test.describe('crawlability and semantics', () => {
  test('declares its language and a single h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders its content into static HTML', async ({ request }) => {
    // Fetched without a browser: whatever a crawler sees must already be here.
    const html = await (await request.get('/')).text();
    expect(html).toContain('Koushik');
    expect(html).toContain('I design systems and build teams that ship');
    expect(html).not.toContain('<div id="app"></div>');
  });

  // The prose moved to its own route rather than staying a client-side view
  // swap, so the part of the site with actual content has to be reachable
  // and indexable on its own.
  test('serves the About prose as a crawlable route', async ({ request }) => {
    const response = await request.get('/about');
    expect(response.status()).toBe(200);

    const html = await response.text();
    expect(html).toContain('As an engineer, I design and build systems');
    expect(html).toContain('Tech stack');
    expect(html).toContain('PostgreSQL');
    expect(html).not.toContain('name="robots"');
  });

  test('lists both routes in the sitemap', async ({ request }) => {
    const index = await (await request.get('/sitemap-index.xml')).text();

    // The `<loc>` is the production URL. Requesting it verbatim would leave
    // the preview server and test the live site instead of this build, so
    // only the path is reused.
    const path = new URL(index.match(/<loc>([^<]+sitemap-0\.xml)<\/loc>/)![1]).pathname;
    const sitemap = await (await request.get(path)).text();

    expect(sitemap).toMatch(new RegExp(`<loc>${ORIGIN}/</loc>`));
    expect(sitemap).toContain(`${ORIGIN}/about`);
  });

  test('serves a noindex 404 page', async ({ page }) => {
    const response = await page.goto('/does-not-exist', { waitUntil: 'commit' });
    // The dev preview server returns 404; GitHub Pages serves 404.html too.
    expect(response?.status()).toBe(404);
    // The status alone does not keep it out of the index — the page has to
    // say so itself, which is the whole reason 404.astro passes `noindex`.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
    // A canonical says "index this URL" — the opposite of noindex. Neither
    // it nor the structured-data block belongs on a page that must stay out.
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('exposes a sitemap and robots.txt', async ({ request }) => {
    expect((await request.get('/sitemap-index.xml')).status()).toBe(200);

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap:');
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m);
  });
});

test.describe('layout stability and responsiveness', () => {
  test('reserves the avatar box with explicit dimensions and alt text', async ({ page }) => {
    await page.goto('/');
    const avatar = page.locator('img').first();
    await expect(avatar).toHaveAttribute('width', /\d+/);
    await expect(avatar).toHaveAttribute('height', /\d+/);
    expect(await avatar.getAttribute('alt')).toBeTruthy();
  });

  test('does not scroll horizontally at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, 'page scrolls horizontally at 320px').toBe(false);
  });
});
