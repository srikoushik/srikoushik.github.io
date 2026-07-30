import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Encodes an image from `src/assets` as a WebP data URI at build time.
 *
 * The portrait is the one thing on either page that cannot be painted from
 * the HTML response alone. Measured against the live site, fetching it costs
 * a round trip the rest of the page does not pay — ~35ms against a warm
 * Fastly edge and ~280ms against a cold one — and for that window the reader
 * sees an empty circle where a face belongs. Astro's `<Image>` cannot avoid
 * this: it emits a file and a `src`, so there is always a second request.
 *
 * Inlining trades that request for bytes in the document, and at this size
 * the trade is close to free. The 2x home portrait is 8.1 KB as a separate
 * WebP; the same pixels base64'd are ~10.4 KB. ~2 KB buys the elimination of
 * the request, and with it the pop-in — the portrait is simply present in the
 * first paint, because it arrives inside the markup that describes it.
 *
 * This only holds while the images stay small. A hero photograph inlined the
 * same way would push tens of kilobytes into a document that cannot be cached
 * for longer than GitHub Pages' `max-age=600`, and would be the wrong call.
 *
 * Encoding is deliberate rather than delegated so the quality matches what
 * Astro's service was already emitting (~80) — this is a latency change, not
 * a visual one.
 */

/**
 * Resolved against the working directory rather than `import.meta.url`: this
 * module is bundled before it runs, so `import.meta.url` points at a chunk in
 * the build output, not at `src/lib`. Both `astro dev` and `astro build` run
 * from the project root.
 */
const ASSETS = path.join(process.cwd(), 'src', 'assets');

/**
 * Encoding a 512px JPEG costs ~50ms, and both pages ask for the portrait. The
 * cache keeps that off the critical path of `astro dev`'s per-request renders,
 * where the same module instance is reused across requests. Promises rather
 * than buffers are stored so concurrent callers share one encode.
 *
 * Checked against the source's mtime: the module outlives a file change under
 * `astro dev`, so a cache that only keyed on the arguments would serve the old
 * crop until the server was restarted. One `stat` per call is the price of
 * noticing, and it is nothing next to the encode it gates.
 */
const encoded = new Map<string, { mtimeMs: number; promise: Promise<string> }>();

/**
 * Returns a `data:image/webp;base64,...` URI for `name`, square-cropped to
 * `size` pixels. Pass the intended 2x pixel size — the density is expressed by
 * rendering it into a smaller CSS box, so no `srcset` is needed and there is
 * nothing for the browser to choose between.
 */
export async function inlineImage(name: string, size: number, quality = 80): Promise<string> {
  const file = path.join(ASSETS, name);
  const { mtimeMs } = await stat(file);
  const key = `${name}|${size}|${quality}`;

  let entry = encoded.get(key);
  if (!entry || entry.mtimeMs !== mtimeMs) {
    entry = { mtimeMs, promise: encode(file, size, quality) };
    encoded.set(key, entry);
  }

  return entry.promise;
}

async function encode(file: string, size: number, quality: number): Promise<string> {
  const source = await readFile(file);

  const webp = await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality, effort: 6 })
    .toBuffer();

  return `data:image/webp;base64,${webp.toString('base64')}`;
}
