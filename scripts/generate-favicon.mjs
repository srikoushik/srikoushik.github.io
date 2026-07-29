/**
 * Regenerates the icon set from the portrait (`site.personImage`):
 * `public/favicon.ico` and `public/apple-touch-icon.png`.
 *
 * Run `npm run generate:favicon` after changing the portrait. Like the share
 * card, the source path comes from src/content/site.ts so the icons cannot
 * drift from the image the pages render.
 *
 * The icons use the portrait's own framing, uncropped, so the tab reads as
 * the same picture as the hero — `public/me.jpg` and the `src/assets/me.jpg`
 * the pages render are the same square crop at different resolutions, and the
 * hero shows it whole. Tightening onto the face would buy detail at 16px at
 * the cost of that match; the match is worth more. The circle is the same
 * reason: `rounded-full` on the pages, a circular crop on the share card.
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { site } from '../src/content/site.ts';
import { circleMask, PAPER } from './lib/design.mjs';

const SOURCE = `public${site.personImage}`;

// The sizes Windows and browsers actually pick between: 16 for the tab, 32
// for the bookmark bar and Retina tabs, 48 for the Windows taskbar.
const ICO_SIZES = [16, 32, 48];

// iOS home screen. It applies its own rounded-square mask and composites
// anything transparent onto black, so this one is drawn on paper rather than
// cut out.
const TOUCH_SIZE = 180;

const portrait = sharp(SOURCE);

/** Circular PNG of the portrait at `size`, on a transparent background. */
const roundel = (size) =>
  portrait
    .clone()
    .resize(size, size)
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png()
    .toBuffer();

/**
 * Packs PNGs into an ICO. sharp cannot write the container, and it is only a
 * 6-byte header plus one 16-byte directory entry per image — Vista onward
 * reads PNG-compressed entries directly, so the frames need no re-encoding.
 */
function ico(images) {
  const HEADER = 6;
  const ENTRY = 16;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // 0 encodes 256
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size: 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const frames = await Promise.all(
  ICO_SIZES.map(async (size) => ({ size, data: await roundel(size) })),
);
await writeFile('public/favicon.ico', ico(frames));

// The touch icon insets the roundel so the circle keeps a paper margin inside
// iOS's own rounded-square mask instead of being shaved by it. `palette`
// quantizes to 256 colours — invisible at 180px, and it takes the file from
// ~45 KB (truecolour) to a third of that.
const INSET = Math.round(TOUCH_SIZE * 0.06);
await sharp({
  create: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    channels: 3,
    background: PAPER,
  },
})
  .composite([
    { input: await roundel(TOUCH_SIZE - INSET * 2), left: INSET, top: INSET },
  ])
  .png({ palette: true })
  .toFile('public/apple-touch-icon.png');

console.log(
  `wrote public/favicon.ico (${ICO_SIZES.join(', ')}) and public/apple-touch-icon.png`,
);
