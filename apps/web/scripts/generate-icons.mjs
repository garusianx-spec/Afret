/**
 * Rasterises the brand SVG into every PNG the manifest, the TWA and iOS need.
 *
 *   node scripts/generate-icons.mjs
 *
 * Maskable variants get extra padding so Android's adaptive-icon mask (which
 * can crop up to 20% on each edge) never clips the mark.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'icons');

const BACKGROUND = { r: 0x7a, g: 0x36, b: 0xd9, alpha: 1 };

const TARGETS = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-192.png', size: 192, maskable: true },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  // Play Store listing icon for the TWA/Bubblewrap build.
  { name: 'play-store-512.png', size: 512, maskable: false },
];

const source = await readFile(join(iconsDir, 'icon.svg'));
await mkdir(iconsDir, { recursive: true });

for (const { name, size, maskable } of TARGETS) {
  // 20% safe-zone inset on each side for maskable icons.
  const inner = maskable ? Math.round(size * 0.6) : size;
  const pad = Math.round((size - inner) / 2);

  const rendered = await sharp(source, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? BACKGROUND : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: rendered, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(join(iconsDir, name));

  process.stdout.write(`✓ ${name} (${size}×${size}${maskable ? ', maskable' : ''})\n`);
}
