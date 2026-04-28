import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'C:/Users/Eduard/AppData/Local/Temp/a25-thumbs';
fs.mkdirSync(outDir, { recursive: true });

const files = process.argv.slice(2);
for (const src of files) {
  const base = path.basename(src);
  const stem = base.replace(/\.(jpg|jpeg|png|heic|webp)$/i, '');
  const out = path.join(outDir, stem + '.jpg');
  try {
    await sharp(src)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(out);
    console.log('OK', out);
  } catch (e) {
    console.error('FAIL', src, e.message);
  }
}
