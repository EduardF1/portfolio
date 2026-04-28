// Patch — swap the Brașov Tampa cable car photo (Coca-Cola branding + people in
// foreground violate the spec). Replace with the Black Church aerial twilight shot.
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const REMOVE = ["trips/2022-08-romania/pexels-brasov-tampa-cable-car-15511267.jpg"];

const REPLACE = [
  {
    tripFolder: "2022-08-romania",
    id: 35410900,
    slug: "brasov-black-church-aerial",
    photographer: "Valeria Drozdova",
    photographerUrl: "https://www.pexels.com/@valeria-drozdova-2148646707/",
    pageUrl: "https://www.pexels.com/photo/black-church-aerial-brasov-35410900/",
    description:
      "Aerial photograph of Brașov's Black Church at twilight, Gothic spires emerging from the historic centre.",
    place: { city: "Brașov", country: "Romania", display: "Brașov, Romania" },
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
  return Buffer.from(await res.arrayBuffer());
}

const results = [];
for (const pick of REPLACE) {
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
  results.push({ pick, rel });
}

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const filtered = catalogue.filter((e) => !REMOVE.includes(e.src));
console.log(`Removed ${catalogue.length - filtered.length} stale catalogue entries.`);

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

for (const rel of REMOVE) {
  const abs = join(repoRoot, "public", "photos", rel);
  if (existsSync(abs)) {
    unlinkSync(abs);
    console.log(`[del] ${rel}`);
  }
}
