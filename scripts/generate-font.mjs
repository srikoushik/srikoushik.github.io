/**
 * Subsets Newsreader to what this site actually sets, writing
 * `src/assets/newsreader-latin-subset.woff2` and the manifest beside it.
 *
 * Run `npm run generate:font` after changing the copy in src/content/site.ts.
 * `tests/build-output.spec.ts` fails if a page renders a character the subset
 * does not carry, so a missed run surfaces as a red test rather than as a
 * fallback glyph in the middle of a word.
 *
 * The upstream latin file is 132 KB, and on a page whose only other request is
 * the document itself, that is essentially the whole download. Almost none of
 * it is reachable: it carries the full Latin-1 range plus the entire 200-800
 * weight range and Newsreader's whole 6-72 optical-size axis, against a design
 * that sets English prose in three weights between 10px and 44px.
 *
 * Three things come out, in descending order of what they save:
 *
 *   - narrowing `wght` to 400-600 (the three weights Tailwind emits here)
 *   - dropping unreachable glyphs
 *   - narrowing `opsz` to 10-44, the design's smallest eyebrow to its
 *     largest name
 *
 * Together: 132 KB -> ~51 KB, with both variation axes intact. Worth being
 * precise about why the axes stay, because pinning `opsz` would more than
 * halve the result again — to ~22 KB — and that is exactly the trade
 * src/styles/global.css already refuses. Newsreader's opsz axis is why the
 * 44px name is not set in letterforms cut for body copy, and the browser
 * drives it from the font size for free. ~29 KB is the price of that, and it
 * is the same reason the heavier `opsz.css` was chosen over `wght.css`
 * upstream. Note that subsetting beats that discarded option outright: 51 KB
 * with optical sizing against 58 KB without.
 */
import { readFile, writeFile } from 'node:fs/promises';
import subsetFont from 'subset-font';
import { site } from '../src/content/site.ts';

const SOURCE =
  'node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2';
const OUTPUT = 'src/assets/newsreader-latin-subset.woff2';
const MANIFEST = 'src/assets/newsreader-latin-subset.json';

/**
 * Every weight Tailwind emits from these templates (`font-medium`,
 * `font-semibold`, and the 400 the base layer leaves alone), and the range of
 * `text-[Npx]` the design uses. Both are asserted against the built CSS by
 * `tests/build-output.spec.ts` so widening the design without widening these
 * cannot pass silently.
 */
const WEIGHT = { min: 400, max: 600 };
const OPTICAL_SIZE = { min: 10, max: 44 };

/**
 * Printable ASCII regardless of whether today's copy uses every character.
 * The alternative is a subset that changes shape with each edit to a
 * paragraph, where adding a `%` to a sentence silently costs a glyph. It is a
 * rounding error next to the variation data — the whole 95-character range
 * costs less than narrowing `opsz` saves.
 */
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

/**
 * Typographic punctuation the templates reach for directly rather than
 * through site.ts, plus the non-breaking space, which is invisible in source
 * and so the easiest of these to lose.
 */
const PUNCTUATION = [...' ‘’“”–—…'];

/** Every string anywhere in the content tree, however deeply nested. */
function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const characters = new Set([...ASCII, ...PUNCTUATION, ...strings(site).join('')]);

// Sorted so the manifest diffs legibly when the copy changes.
const codepoints = [...characters].map((c) => c.codePointAt(0)).sort((a, b) => a - b);
const text = codepoints.map((c) => String.fromCodePoint(c)).join('');

const source = await readFile(SOURCE);
const subset = await subsetFont(source, text, {
  targetFormat: 'woff2',
  variationAxes: { wght: WEIGHT, opsz: OPTICAL_SIZE },
});

await writeFile(OUTPUT, subset);
await writeFile(
  MANIFEST,
  `${JSON.stringify({ codepoints, weight: WEIGHT, opticalSize: OPTICAL_SIZE }, null, 2)}\n`,
);

const saved = Math.round((1 - subset.length / source.length) * 100);
console.log(
  `${OUTPUT}: ${source.length} -> ${subset.length} bytes (-${saved}%), ` +
    `${codepoints.length} characters, wght ${WEIGHT.min}-${WEIGHT.max}, ` +
    `opsz ${OPTICAL_SIZE.min}-${OPTICAL_SIZE.max}`,
);
