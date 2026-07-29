/**
 * Design tokens shared by the scripts/ generators.
 *
 * The colours are sRGB stand-ins for the light-theme oklch tokens in
 * src/styles/global.css — the same conversion BaseLayout's theme-color meta
 * uses. A generator runs in Node and cannot read the stylesheet, so this is
 * the one place scripts write them down. If the palette ever changes:
 * global.css, the theme-color meta, and here — `tests/build-output.spec.ts`
 * samples the painted page and fails if the three drift apart.
 */

export const PAPER = '#f9f6f2';
export const INK = '#453f38';
export const INK_SOFT = '#7b7267';
export const INK_FAINT = '#a29a8f';

/**
 * Circular alpha mask for the portrait roundel. The photo is cut in sharp
 * (`dest-in` blend) rather than in an SVG clip path, so librsvg never has
 * to handle a raster clip.
 */
export const circleMask = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}">
       <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/>
     </svg>`,
  );
