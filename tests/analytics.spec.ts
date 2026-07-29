import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The tracker's *enabled* half.
 *
 * Every other spec runs against the suite's own build, which deliberately has
 * no website ID — that build is what proves the tracker stays off in
 * development (`build-output.spec.ts`, "omits the tracker when no website ID
 * is configured"). It can say nothing about what ships when the ID *is* set,
 * which is the configuration real visitors get.
 *
 * So this builds a second time with an ID, into its own directory so the
 * preview server keeps serving the untouched one.
 *
 * Serial, and therefore single-worker: `fullyParallel` would otherwise run
 * `beforeAll` once per worker and fire concurrent builds at the same output
 * directory. One build, one worker, three assertions against it.
 */
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const WEBSITE_ID = '00000000-0000-4000-8000-000000000000';

// Inside the project, not os.tmpdir(): Astro moves build assets with a rename,
// which fails across filesystems, and macOS puts the temp dir on another
// volume. `test-results/` is already gitignored and holds Playwright's own
// artifacts, so it is cleaned up either way.
const OUT_DIR = 'test-results/tracked-build';

test.describe('tracker, built the way production builds it', () => {
  let html: string;

  test.beforeAll(() => {
    execFileSync('npx', ['astro', 'build', '--outDir', OUT_DIR], {
      env: { ...process.env, PUBLIC_UMAMI_WEBSITE_ID: WEBSITE_ID },
      stdio: 'pipe',
    });
    html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
  });

  test.afterAll(() => {
    rmSync(OUT_DIR, { recursive: true, force: true });
  });

  test('ships the tracker once the website ID is configured', () => {
    expect(html).toContain('https://cloud.umami.is/script.js');
    expect(html).toContain(`data-website-id="${WEBSITE_ID}"`);
  });

  /**
   * The tracker reads this attribute as `w('performance') === 'true'` — an
   * exact string comparison. `data-performance="1"`, or the bare attribute
   * HTML would otherwise treat as true, both leave Core Web Vitals collection
   * silently off, and nothing about the page looks wrong when that happens.
   * There is no signal short of an empty Performance page weeks later.
   */
  test('enables Core Web Vitals collection with the exact literal "true"', () => {
    expect(html).toContain('data-performance="true"');
  });

  // The collector lives inside the tracker script itself, so turning it on
  // must not pull in a second request or a `web-vitals` bundle. This is the
  // property that lets the site keep shipping no JavaScript of its own.
  test('adds no extra script to collect them', () => {
    const external = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
    expect(external).toEqual(['https://cloud.umami.is/script.js']);
  });
});
