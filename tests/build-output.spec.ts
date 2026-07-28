import { test, expect } from '@playwright/test';

/**
 * Guards the properties that make this site cheap to load. These are easy to
 * regress silently — one `client:load` directive would ship a React runtime
 * to a page that is otherwise pure text.
 */

const CSS_BUDGET_BYTES = 30 * 1024;

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

test('gives every outbound link a unique, valid Umami event name', async ({ page }) => {
  await page.goto('/');

  const events = await page
    .locator('[data-umami-event]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-umami-event')!));

  expect(events.length).toBeGreaterThan(0);
  // Umami caps event names at 50 characters.
  for (const event of events) expect(event.length).toBeLessThanOrEqual(50);
  // Sharing a name across links would merge two placements into one statistic.
  expect(new Set(events).size, `duplicate event names: ${events.join(', ')}`).toBe(events.length);
});

test('omits the tracker when no website ID is configured', async ({ request }) => {
  // The test build runs without PUBLIC_UMAMI_WEBSITE_ID, standing in for a
  // local development build — which must never report traffic.
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('cloud.umami.is');
});

test('opens outbound links safely', async ({ page }) => {
  await page.goto('/');

  const links = page.locator('a[href^="http"]');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const rel = await links.nth(i).getAttribute('rel');
    expect(rel, `link ${i} is missing rel`).toContain('noopener');
    expect(rel).toContain('noreferrer');
  }
});
