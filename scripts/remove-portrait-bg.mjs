#!/usr/bin/env node
// Strips the dark-green studio background from public/images/hero/portrait.png
// using a hue-based chroma key. The studio backdrop is in a tight green
// band (~70-160° on the hue wheel) with low saturation/brightness; the
// subject's skin/hair/shirt sit well outside that band, so a hue test
// + soft alpha ramp on a narrow border around the threshold gives a
// clean cut without an ML model.
//
// Tradeoff vs rembg/U2Net: ~50× faster, no model download, no native
// deps. Risk: if a subject pixel happens to fall inside the green
// hue band (e.g. a green tie) it would be made transparent. The
// current portrait has none.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'public/images/hero/portrait.png');
const DEST = SOURCE; // overwrite

// Tuning — measured empirically against the studio backdrop on
// portrait.png. Values are 0–360 hue, 0–1 saturation, 0–1 lightness.
const HUE_MIN = 90;   // lower edge of the green band
const HUE_MAX = 175;  // upper edge (avoid yellow + cyan)
const MIN_SAT = 0.10; // very desaturated greens (near-grey) are likely subject
const MAX_LIGHT = 0.45; // dark backdrop only — bright greens (e.g. shirt) are kept
// Soft edge: pixels within `EDGE_DEG` of the hue band get partial alpha
const EDGE_DEG = 10;

function rgbToHsl(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h = (h * 60 + 360) % 360;
  }
  return [h, s, l];
}

function alphaForPixel(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < MIN_SAT) return 255;
  if (l > MAX_LIGHT) return 255;
  // Distance to the hue band (0 = inside band)
  let d = 0;
  if (h < HUE_MIN) d = HUE_MIN - h;
  else if (h > HUE_MAX) d = h - HUE_MAX;
  if (d === 0) return 0;            // fully transparent — solid backdrop
  if (d >= EDGE_DEG) return 255;    // fully opaque — well outside band
  // Soft edge: linear ramp from transparent to opaque
  return Math.round(255 * (d / EDGE_DEG));
}

async function main() {
  const meta = await sharp(SOURCE).metadata();
  console.log('source:', meta.width + 'x' + meta.height, meta.format, meta.channels + 'ch');

  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const out = Buffer.from(data); // RGBA

  let stripped = 0;
  for (let i = 0; i < out.length; i += 4) {
    const a = alphaForPixel(out[i], out[i + 1], out[i + 2]);
    out[i + 3] = a;
    if (a === 0) stripped++;
  }
  const total = (out.length / 4);
  console.log('stripped', stripped, '/', total, 'pixels (' + ((stripped / total) * 100).toFixed(1) + '%)');

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(DEST + '.tmp');
  await fs.rename(DEST + '.tmp', DEST);
  console.log('wrote:', path.relative(ROOT, DEST));
}

main().catch((e) => { console.error(e); process.exit(1); });
