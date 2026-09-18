/**
 * Rasterises the brand mark into every PNG the manifest, the TWA and iOS need.
 *
 *   node scripts/generate-icons.mjs
 *
 * Source of truth is `public/brand/mark.svg` (the mother-and-child symbol).
 * The wordmark is deliberately excluded: at 48px in a launcher it is an
 * illegible smudge, and Android/iOS already render the app name underneath.
 *
 * Two families are produced:
 *   - `icon-*`     transparent, mark in brand plum — for the web manifest
 *   - `maskable-*` opaque plum plate, mark knocked out in white, inset to the
 *                  40% safe radius so Android's adaptive mask cannot clip it
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = join(root, 'public', 'brand');
const iconsDir = join(root, 'public', 'icons');

/** Logo plum — keep in sync with `--afrat-brand` in globals.css. */
const BRAND = '#AA4C7A';
const BRAND_RGB = { r: 0xaa, g: 0x4c, b: 0x7a, alpha: 1 };
const WHITE = '#FFFFFF';

const TARGETS = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-192.png', size: 192, maskable: true },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
  { name: 'play-store-512.png', size: 512, maskable: true },
];

/**
 * Splash icons for the TWA. Bubblewrap generates its own from `iconUrl`, but
 * having them on disk makes the Android resources reproducible.
 */
const SPLASH = [
  { name: 'splash-192.png', size: 192 },
  { name: 'splash-384.png', size: 384 },
  { name: 'splash-512.png', size: 512 },
];

const markSvg = await readFile(join(brandDir, 'mark.svg'), 'utf8');

/** The mark ships with `fill="currentColor"`; bake a literal colour for raster. */
function tinted(color) {
  return Buffer.from(markSvg.replaceAll('currentColor', color));
}

async function renderMark({ color, box }) {
  return sharp(tinted(color), { density: 1200 })
    .resize(box, box, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function compose({ size, maskable, outPath }) {
  // Maskable icons must survive a circular crop: Android may remove ~20% per
  // edge, so the mark sits inside a 60% box on an opaque plate.
  const box = Math.round(size * (maskable ? 0.56 : 0.86));
  const offset = Math.round((size - box) / 2);

  const mark = await renderMark({ color: maskable ? WHITE : BRAND, box });

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? BRAND_RGB : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

await mkdir(iconsDir, { recursive: true });

for (const { name, size, maskable } of TARGETS) {
  await compose({ size, maskable, outPath: join(iconsDir, name) });
  process.stdout.write(`✓ ${name} (${size}×${size}${maskable ? ', maskable' : ''})\n`);
}

for (const { name, size } of SPLASH) {
  await compose({ size, maskable: true, outPath: join(iconsDir, name) });
  process.stdout.write(`✓ ${name} (${size}×${size}, splash)\n`);
}

// Favicon: the browser tab is small and light, so the transparent variant on
// the page background reads better than a plum plate.
const favicon = await renderMark({ color: BRAND, box: 32 });
await sharp({
  create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: favicon, top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(join(iconsDir, 'favicon-32.png'));
process.stdout.write('✓ favicon-32.png (32×32)\n');

// `icon.svg` is what the manifest points at for the scalable entry.
await writeFile(join(iconsDir, 'icon.svg'), markSvg.replaceAll('currentColor', BRAND));
process.stdout.write('✓ icon.svg (vector, brand colour)\n');
