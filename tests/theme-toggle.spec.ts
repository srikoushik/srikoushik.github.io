import { test, expect, type Page } from '@playwright/test';

const TOGGLE = '[data-theme-toggle]';

/** The user's literal choice, as persisted. Absent means "system". */
type Preference = 'light' | 'dark' | 'system';

async function seedPreference(page: Page, preference: Preference | null) {
  await page.addInitScript((value) => {
    if (value === null) window.localStorage.removeItem('theme');
    else window.localStorage.setItem('theme', value as string);
  }, preference);
}

/**
 * Records the readyState at the exact moment the theme class is applied.
 *
 * Hooks `DOMTokenList.toggle` rather than using a MutationObserver: observer
 * callbacks are microtasks, so by the time one runs the parser may have moved
 * on and readyState would no longer reflect when the change actually happened.
 * This hook is synchronous and therefore precise.
 *
 * If `dark` is applied while readyState is "loading", it landed during head
 * parsing — before the body existed, and so before any frame was painted.
 */
async function recordThemeApplication(page: Page) {
  await page.addInitScript(() => {
    const log: { dark: boolean; readyState: string }[] = [];
    (window as never as Record<string, unknown>).__themeLog = log;

    const original = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function (token: string, force?: boolean) {
      const result = original.call(this, token, force);
      if (token === 'dark') {
        log.push({ dark: result, readyState: document.readyState });
      }
      return result;
    };
  });
}

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

const storedPreference = (page: Page) =>
  page.evaluate(() => window.localStorage.getItem('theme'));

test.describe('theme toggle', () => {
  test('cycles light -> dark -> system', async ({ page }) => {
    await seedPreference(page, 'light');
    await page.goto('/');

    const toggle = page.locator(TOGGLE);
    await expect(toggle).toBeVisible();
    expect(await storedPreference(page)).toBe('light');

    await toggle.click();
    expect(await storedPreference(page)).toBe('dark');
    expect(await isDark(page)).toBe(true);

    await toggle.click();
    expect(await storedPreference(page)).toBe('system');
  });

  // Deliberately does not use seedPreference: addInitScript re-runs on every
  // navigation, so seeding would wipe the stored value on reload — which is
  // precisely what this test needs to survive.
  test('persists an explicit choice across reloads', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator(TOGGLE);
    for (let i = 0; i < 3 && (await storedPreference(page)) !== 'dark'; i++) {
      await toggle.click();
    }
    expect(await storedPreference(page)).toBe('dark');

    await page.reload();
    expect(await isDark(page)).toBe(true);
    expect(await storedPreference(page)).toBe('dark');
  });

  test('applies the theme during head parsing, before first paint', async ({ page }) => {
    await seedPreference(page, 'dark');
    await recordThemeApplication(page);
    await page.goto('/');

    const log = await page.evaluate(
      () => (window as never as Record<string, unknown>).__themeLog as { dark: boolean; readyState: string }[],
    );

    const firstDark = log.find((entry) => entry.dark);
    expect(firstDark, 'dark class was never applied').toBeTruthy();
    // "loading" means the parser had not finished the document — i.e. the
    // class landed before the body rendered, so no light frame is painted.
    expect(firstDark!.readyState).toBe('loading');
  });

  test('honours the OS preference when no choice is stored', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await seedPreference(page, null);
    await page.goto('/');

    expect(await isDark(page)).toBe(true);
    // The control must report the literal choice ("system"), not the
    // resolved theme — otherwise "system" collapses into "dark".
    await expect(page.locator(TOGGLE)).toHaveAttribute('data-preference', 'system');

    await context.close();
  });

  test('follows live OS changes only while the preference is system', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await seedPreference(page, 'system');
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // The media-change event is asynchronous, so these assertions must retry.
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/dark/);

    // With an explicit choice, the OS must no longer win.
    await seedPreference(page, 'light');
    await page.reload();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await context.close();
  });

  test('is keyboard operable and exposes its state', async ({ page }) => {
    await seedPreference(page, 'light');
    await page.goto('/');

    const toggle = page.locator(TOGGLE);
    await expect(toggle).toHaveAttribute('aria-label', /theme/i);

    await toggle.focus();
    await expect(toggle).toBeFocused();

    await page.keyboard.press('Enter');
    expect(await storedPreference(page)).toBe('dark');

    await page.keyboard.press('Space');
    expect(await storedPreference(page)).toBe('system');
  });

  test('survives localStorage being unavailable', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // Simulates Safari private browsing / storage-blocked contexts.
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('storage blocked', 'SecurityError');
      };
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => ({ getItem: blocked, setItem: blocked, removeItem: blocked }),
      });
    });

    await page.goto('/');
    const toggle = page.locator(TOGGLE);
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(toggle).toBeVisible();
    expect(errors, `unexpected page errors: ${errors.join(', ')}`).toHaveLength(0);
  });
});
