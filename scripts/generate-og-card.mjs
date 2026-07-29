/**
 * Regenerates the Open Graph share card (`public/og-card.jpg`, via
 * `site.ogImage`).
 *
 * Run `npm run generate:og` after changing the portrait or the copy in
 * src/content/site.ts. Name, tagline, dimensions and image paths all come
 * from that module — Node ≥ 22.18 imports the TypeScript file directly
 * (native type stripping, which the `engines` floor guarantees) — so the
 * card can never drift from the metadata that describes it.
 */
import sharp from 'sharp';
import { site } from '../src/content/site.ts';

const WIDTH = site.ogImageWidth;
const HEIGHT = site.ogImageHeight;

// sRGB stand-ins for the light-theme oklch tokens (same values theme-color
// uses in BaseLayout).
const PAPER = '#f9f6f2';
const INK = '#453f38';
const INK_SOFT = '#7b7267';
const INK_FAINT = '#a29a8f';

// The card's visible URL. No page renders it, so it lives here rather than
// in site.ts — keep it matching `site` in astro.config.mjs.
const HOSTNAME = 'srikoushik.github.io';

const PORTRAIT = { size: 400, left: 110, top: (HEIGHT - 400) / 2 };

// Greedy word wrap. Budget 22 is chosen, not arbitrary: it breaks the
// current identity after "and" ("I design systems and / build teams that
// ship"), which reads better than breaking the verb from its object, while
// leaving room for a longer tagline to spill to a third line at y=436 —
// still clear of the URL at y=546. A fourth line would collide, and that
// is a hard failure below rather than a silently broken card.
function wrap(text, budget = 22) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const current = lines[lines.length - 1];
    if (current && `${current} ${word}`.length > budget) lines.push(word);
    else lines[lines.length - 1] = current ? `${current} ${word}` : word;
  }
  return lines;
}

const taglineLines = wrap(site.identity);
if (taglineLines.length > 3) {
  throw new Error(
    `identity wraps to ${taglineLines.length} lines; the card has room for 3. ` +
      'Shorten site.identity or rework the layout.',
  );
}

// The copy goes into SVG markup, so it must be escaped like any other
// interpolated string.
const escapeXml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Circular crop of the square portrait, done in sharp rather than in the
// SVG so librsvg never has to handle a raster clip path.
const portrait = await sharp(`public${site.personImage}`)
  .resize(PORTRAIT.size, PORTRAIT.size)
  .composite([
    {
      input: Buffer.from(
        `<svg width="${PORTRAIT.size}" height="${PORTRAIT.size}">
           <circle cx="${PORTRAIT.size / 2}" cy="${PORTRAIT.size / 2}" r="${PORTRAIT.size / 2}" fill="#000"/>
         </svg>`,
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const cx = PORTRAIT.left + PORTRAIT.size / 2;
const cy = PORTRAIT.top + PORTRAIT.size / 2;

const tagline = taglineLines
  .map(
    (line, i) =>
      `<text x="582" y="${348 + i * 44}" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="${INK_SOFT}">${escapeXml(line)}</text>`,
  )
  .join('\n  ');

const card = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="soften" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  <!-- the portrait's float shadow, cast down and slightly right -->
  <circle cx="${cx + 6}" cy="${cy + 26}" r="${PORTRAIT.size / 2 - 14}" fill="${INK}" opacity="0.22" filter="url(#soften)"/>
  <text x="580" y="282" font-family="Georgia, 'Times New Roman', serif" font-size="96" fill="${INK}">${escapeXml(site.name)}</text>
  ${tagline}
  <text x="582" y="546" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="${INK_FAINT}">${HOSTNAME}</text>
</svg>`;

await sharp(Buffer.from(card))
  .composite([{ input: portrait, left: PORTRAIT.left, top: PORTRAIT.top }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(`public${site.ogImage}`);

console.log(`wrote public${site.ogImage}`);
