// One-off: fetch a Vejle replacement Pexels photo to swap in for the
// non-artistic IMG_20200126_062752.jpg (warehouse "pallet of meat").
//
// See scripts/.round5/a14-fetch-stock.mjs for the parent pipeline pattern.

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PICK = {
  tripFolder: "2020-02-denmark",
  id: 35135228,
  slug: "vejle-bolgen-waterfront",
  photographer: "Ayco World",
  photographerUrl: "https://www.pexels.com/@ayco-world-108848112/",
  pageUrl:
    "https://www.pexels.com/photo/modern-architectural-waves-by-waterfront-35135228/",
  description:
    "Bølgen (The Wave) modern wave-shaped apartment buildings overlooking the calm Vejle Fjord under a clear blue sky.",
  place: { city: "Vejle", country: "Denmark", display: "Vejle, Denmark" },
};

const file = `pexels-${PICK.slug}-${PICK.id}.jpg`;
const rel = `trips/${PICK.tripFolder}/${file}`;
const abs = join(repoRoot, "public", "photos", "trips", PICK.tripFolder, file);

const url = `https://images.pexels.com/photos/${PICK.id}/pexels-photo-${PICK.id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
console.log(`GET ${url}`);
const res = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  },
});
if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
const buf = Buffer.from(await res.arrayBuffer());
if (buf.length < 10000) {
  throw new Error(`Suspiciously small (${buf.length} bytes)`);
}

mkdirSync(dirname(abs), { recursive: true });
if (existsSync(abs)) {
  console.log(`[skip exists] ${rel}`);
} else {
  const out = await sharp(buf)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`[ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
}

console.log(JSON.stringify({ rel, abs, pick: PICK }, null, 2));
