// Patch — swap two Bucharest stock photos that had:
//   - 28898468: visible event-banner text ("#RunInBucharest", "Autonom") — violates spec
//   - 28898466: faint "@daria_sky" photographer watermark — violates spec
// Replace with two clean alternatives.

import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const REMOVE = [
  "trips/2022-12-romania/pexels-bucharest-palace-parliament-28898468.jpg",
  "trips/2025-03-romania/pexels-bucharest-charming-street-28898466.jpg",
];

const REPLACE = [
  {
    tripFolder: "2022-12-romania",
    id: 8780208,
    slug: "bucharest-odeon-theatre",
    photographer: "Ana-Maria Antonenco",
    photographerUrl: "https://www.pexels.com/@ana-maria-antonenco-78158389/",
    pageUrl: "https://www.pexels.com/photo/odeon-theatre-bucharest-8780208/",
    description:
      "Odeon Theatre in Bucharest with classical architecture reflected in a puddle on a rainy day.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  {
    tripFolder: "2025-03-romania",
    id: 34528038,
    slug: "bucharest-autumn-historic-facade",
    photographer: "liza sigareva",
    photographerUrl: "https://www.pexels.com/@liza-sigareva-2149951107/",
    pageUrl: "https://www.pexels.com/photo/bucharest-historic-architecture-34528038/",
    description:
      "Historic Bucharest architecture in autumn light, showcasing ornate Eastern European façades.",
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
];

async function downloadImage(id) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`small response (${buf.length} bytes) for ${url}`);
  return buf;
}

async function processOne(pick) {
  const file = `pexels-${pick.slug}-${pick.id}.jpg`;
  const rel = `trips/${pick.tripFolder}/${file}`;
  const abs = join(repoRoot, "public", "photos", "trips", pick.tripFolder, file);
  mkdirSync(dirname(abs), { recursive: true });
  const raw = await downloadImage(pick.id);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`[ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs };
}

const results = [];
for (const pick of REPLACE) {
  results.push(await processOne(pick));
}

// Update catalogue: remove old entries, add new entries.
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const filtered = catalogue.filter((e) => !REMOVE.includes(e.src));
const removedCount = catalogue.length - filtered.length;
console.log(`Removed ${removedCount} stale catalogue entries.`);

for (const r of results) {
  filtered.push({
    src: r.rel,
    takenAt: null,
    hasGps: false,
    place: r.pick.place,
    source: {
      type: "stock",
      provider: "Pexels",
      url: r.pick.pageUrl,
      photographer: r.pick.photographer,
      photographerUrl: r.pick.photographerUrl,
      license: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
    },
  });
}
writeFileSync(cataloguePath, JSON.stringify(filtered, null, 2) + "\n", "utf8");
console.log(`Catalogue now has ${filtered.length} entries.`);

// Delete old image files.
for (const rel of REMOVE) {
  const abs = join(repoRoot, "public", "photos", rel);
  if (existsSync(abs)) {
    unlinkSync(abs);
    console.log(`[del] ${rel}`);
  }
}
