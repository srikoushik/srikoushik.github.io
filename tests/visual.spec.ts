import { test, expect } from '@playwright/test';

/**
 * Pixel comparison of every page, in both themes, at a phone and a desktop
 * width — what the other specs cannot see. They assert measured properties
 * (tap targets, no reflow, colours matching the stylesheet); this catches a
 * change that keeps every measurement but still looks different.
 *
 * Baselines live in `visual.spec.ts-snapshots/` and are rendered on the CI
 * runner, because font rasterisation differs by OS: a macOS screenshot never
 * matches a Linux one pixel for pixel. So these run on Linux only. To accept
 * an intended change, run the "Update screenshots" workflow on the branch and
 * commit the PNGs it uploads.
 */

test.skip(
  process.platform !== 'linux',
  'Baselines are rendered on Linux CI; run the "Update screenshots" workflow to refresh them.',
);

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/about/', name: 'about' },
];
const THEMES = ['light', 'dark'] as const;
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${route.name} looks the same in ${theme} at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        // An explicit choice, so the shot does not depend on the runner's OS
        // colour scheme.
        await page.addInitScript((value) => window.localStorage.setItem('theme', value), theme);
        await page.goto(route.path);
        // The page is entirely type: a shot taken before Newsreader swaps in
        // would capture the fallback face.
        await page.evaluate(() => document.fonts.ready);

        await expect(page).toHaveScreenshot(`${route.name}-${theme}-${viewport.name}.png`, {
          fullPage: true,
        });
      });
    }
  }
}
