import { test, expect } from '@playwright/test';

/**
 * Guards the properties that make this site cheap to load. These are easy to
 * regress silently — one `client:load` directive would ship a React runtime
 * to a page that is otherwise pure text.
 */

// The stylesheet is around 15 KB uncompressed. 20 KB leaves room for a few
// more utilities without leaving room for a regression: at the old 30 KB the
// budget had nearly 2x headroom and would not have caught anything.
const CSS_BUDGET_BYTES = 20 * 1024;

/** Every route that ships to users. Link and analytics rules apply to all. */
const ROUTES = ['/', '/about'];

test('ships no framework JavaScript', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  // Inline scripts (theme resolver, toggle) do not issue requests. Anything
  // fetched here is a bundle, which this page should never need.
  expect(scripts, `unexpected script requests: ${scripts.join(', ')}`).toHaveLength(0);
});

test('keeps CSS within budget', async ({ page, request }) => {
  await page.goto('/');

  const hrefs = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href));

  let total = 0;
  for (const href of hrefs) {
    total += Buffer.byteLength((await (await request.get(href)).text()));
  }

  expect(total, `stylesheets total ${total} bytes uncompressed`).toBeLessThan(CSS_BUDGET_BYTES);
});

for (const route of ROUTES) {
  test(`gives every tracked link on ${route} a unique, valid Umami event name`, async ({
    page,
  }) => {
    await page.goto(route);

    const events = await page
      .locator('[data-umami-event]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-umami-event')!));

    expect(events.length).toBeGreaterThan(0);
    // Umami caps event names at 50 characters.
    for (const event of events) expect(event.length).toBeLessThanOrEqual(50);
    // Sharing a name across links would merge two placements into one statistic.
    expect(new Set(events).size, `duplicate event names: ${events.join(', ')}`).toBe(events.length);
  });
}

// The same destination appears on both routes (LinkedIn as a profile on the
// home card, as "Projects" in the About footer). Reusing one event name would
// make it impossible to tell which placement a reader actually used.
test('does not reuse an event name across routes', async ({ page }) => {
  const seen = new Map<string, string>();

  for (const route of ROUTES) {
    await page.goto(route);
    const events = await page
      .locator('[data-umami-event]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-umami-event')!));

    for (const event of events) {
      expect(seen.get(event), `"${event}" is used on both ${seen.get(event)} and ${route}`)
        .toBeUndefined();
      seen.set(event, route);
    }
  }
});

test('omits the tracker when no website ID is configured', async ({ request }) => {
  // The test build runs without PUBLIC_UMAMI_WEBSITE_ID, standing in for a
  // local development build — which must never report traffic.
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('cloud.umami.is');
});

for (const route of ROUTES) {
  test(`opens outbound links on ${route} safely`, async ({ page }) => {
    await page.goto(route);

    const links = page.locator('a[href^="http"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rel = await links.nth(i).getAttribute('rel');
      expect(rel, `link ${i} is missing rel`).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
}

// The font is the whole visual identity here, so a late or unhinted download
// is a visibly unstyled page. Guards the preload hint and the `swap` policy.
test('preloads the latin font subset', async ({ page, request }) => {
  await page.goto('/');

  const preload = page.locator('link[rel="preload"][as="font"]');
  await expect(preload).toHaveCount(1);

  const href = await preload.getAttribute('href');
  expect(href).toMatch(/newsreader-latin-.*\.woff2$/);
  expect((await request.get(href!)).status()).toBe(200);

  const css = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href));
  const sheets = await Promise.all(css.map(async (url) => (await request.get(url)).text()));
  // Matched loosely because the built CSS is minified (`font-display:swap`).
  expect(sheets.join('')).toMatch(/font-display:\s*swap/);
});
