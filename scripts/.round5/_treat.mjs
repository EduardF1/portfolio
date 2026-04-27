// Treatment script for the BVB Yellow Wall photo.
// Crop slightly, modest contrast/saturation lift, output JPEG q85.
// Sharp is bundled with Next.js in this repo (node_modules/sharp).

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const here = path.resolve(process.cwd(), 'scripts/.round5');
const inFile = path.join(here, 'bvb-yellow-wall-raw.jpg');
const outFile = path.join(here, 'bvb-yellow-wall-final.jpg');

const meta = await sharp(inFile).metadata();
console.log('Source:', meta.width + 'x' + meta.height, meta.format);

// Crop plan: source is 980 x 554.
// Trim 20px off top (dead stadium roof) and 30px off bottom (grass ahead of the
// BVB logo crest) to tighten composition on the wall + crest. Keeps full width.
const cropTop = 20;
const cropBottom = 30;
const cropWidth = meta.width;
const cropHeight = meta.height - cropTop - cropBottom; // 554 - 50 = 504

const pipeline = sharp(inFile)
  .extract({ left: 0, top: cropTop, width: cropWidth, height: cropHeight })
  // Long edge is 980px (already <2000), no resize needed.
  // Subtle treatment: lift saturation a touch, gentle contrast, very mild warmth.
  .modulate({
    saturation: 1.10, // +10% saturation pops the yellow
    brightness: 1.02, // +2% brightness lifts the dark stand a hair
  })
  .linear(1.06, -8)    // contrast: slope 1.06, intercept -8 -> deeper blacks, brighter highlights
  .gamma(1.0)
  .sharpen({ sigma: 0.6, m1: 0.5, m2: 1.0 }) // subtle sharpening to recover detail after crop
  .jpeg({ quality: 85, progressive: true, mozjpeg: true });

await pipeline.toFile(outFile);

const outMeta = await sharp(outFile).metadata();
const outStat = fs.statSync(outFile);
console.log('Output:', outMeta.width + 'x' + outMeta.height, '|',
  Math.round(outStat.size / 1024) + ' KB');
