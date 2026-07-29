import { test, expect } from '@playwright/test';

/**
 * The design draws the card and the About view as two states of one screen.
 * They ship as two routes, so the things the prototype got for free from
 * shared component state — theme, continuity, a way back — have to survive a
 * real page load. That is what these cover.
 */

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

test.describe('card to About and back', () => {
  test('navigates between the two views', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(
      page.getByText('I’ve spent over a decade designing systems'),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Koushik');
  });

  // The prototype kept the theme in component state, which a route change
  // would have discarded. Persisted preference plus the head resolver is what
  // replaces that — if either breaks, About loads in the wrong theme.
  test('carries the theme across the navigation, without a flash', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('[data-theme-toggle]');
    for (let i = 0; i < 3; i++) {
      if ((await toggle.getAttribute('data-preference')) === 'dark') break;
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('data-preference', 'dark');

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute(
      'data-preference',
      'dark',
    );
  });

  test('reaches About directly, not only through the card', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Koushik');
    await expect(page.getByText('Tech stack')).toBeVisible();
  });
});

test.describe('responsive treatment', () => {
  // The design gives the same links two forms: full-width bordered rows on a
  // phone, inline rules on desktop. The mobile form exists to be tappable, so
  // its height is the part worth asserting.
  test('renders link rows as 48px tap targets on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    for (const name of ['About', 'LinkedIn', 'GitHub']) {
      const box = await page.getByRole('link', { name: new RegExp(name) }).boundingBox();
      expect(box!.height, `${name} row is under the tap-target minimum`).toBeGreaterThanOrEqual(48);
    }

    // 44px is the tap-target minimum the control has to clear on touch.
    const toggle = await page.locator('[data-theme-toggle]').boundingBox();
    expect(toggle!.height).toBeGreaterThanOrEqual(44);
  });

  test('drops the boxes for inline links on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    const about = page.getByRole('link', { name: 'About' });
    const box = await about.boundingBox();
    // An inline link hugs its text; a bordered row spans the column.
    expect(box!.width).toBeLessThan(120);

    const borders = await about.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bottom: cs.borderBottomWidth, top: cs.borderTopWidth, radius: cs.borderRadius };
    });
    expect(borders).toEqual({ bottom: '1px', top: '0px', radius: '0px' });
  });

  // About rests at the same ink as the outbound links on desktop, so it has to
  // highlight like them. It shipped hovering to `foreground/70`, which over
  // either page background composited to within a few percent of that resting
  // ink — the colour did change, just not visibly. Comparing against a
  // neighbour rather than a literal keeps this about the design rule.
  test('highlights About on hover, in both themes', async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      // The colour transition would otherwise be read mid-flight.
      await page.addStyleTag({ content: '* { transition: none !important }' });

      const about = page.getByRole('link', { name: 'About' });
      const neighbour = page.getByRole('link', { name: /LinkedIn/ });
      const ink = (link: typeof about) =>
        link.evaluate((el) => getComputedStyle(el).color);

      const resting = await ink(about);
      await about.hover();
      const hovered = await ink(about);
      expect(hovered, `About does not visibly change on hover in ${scheme}`).not.toBe(resting);

      await neighbour.hover();
      expect(hovered, `About highlights to a different ink than its neighbours in ${scheme}`).toBe(
        await ink(neighbour),
      );
    }
  });

  // Regressed once already, back when the control was built on a class-variant
  // helper: the helper concatenated rather than merged, so a base variant's
  // corner radius won and the control rendered as a rounded square. The helper
  // is gone, but the shape is still worth pinning — it is the one control on
  // the page and a square one looks broken.
  test('keeps the theme control circular', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');

    const toggle = page.locator('[data-theme-toggle]');
    const shape = await toggle.evaluate((el) => {
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return { radius: parseFloat(cs.borderRadius), width: box.width, height: box.height };
    });

    expect(shape.width).toBe(shape.height);
    expect(shape.radius).toBeGreaterThanOrEqual(shape.width / 2);
  });
});

test.describe('typography', () => {
  test('sets the page in Newsreader, optically sized', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const heading = page.getByRole('heading', { level: 1 });
    const styles = await heading.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { family: cs.fontFamily, sizing: cs.fontOpticalSizing, size: cs.fontSize };
    });

    expect(styles.family).toContain('Newsreader');
    // Without this the 44px name renders in letterforms cut for 16px body copy.
    expect(styles.sizing).toBe('auto');
    expect(styles.size).toBe('44px');

    const loaded = await page.evaluate(() =>
      document.fonts.check('500 44px "Newsreader Variable"'),
    );
    expect(loaded, 'Newsreader did not load').toBe(true);
  });
});
