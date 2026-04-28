// Patch — fetch the missing 17225672 photo (PNG-only variant) and append catalogue entry.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const pick = {
  tripFolder: "2018-04-sweden",
  id: 17225672,
  slug: "malmo-turning-torso-fog",
  photographer: "Ira",
  photographerUrl: "https://www.pexels.com/@ira-2300811/",
  pageUrl:
    "https://www.pexels.com/photo/apartments-in-front-of-the-fog-shrouded-turning-torso-skyscraper-17225672/",
  description:
    "Foggy view of Malmö's Turning Torso skyscraper framed by residential apartment buildings in mist.",
  place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
};

const file = `pexels-${pick.slug}-${pick.id}.jpg`;
const rel = `trips/${pick.tripFolder}/${file}`;
const abs = join(repoRoot, "public", "photos", "trips", pick.tripFolder, file);

mkdirSync(dirname(abs), { recursive: true });

if (!existsSync(abs)) {
  // Pexels stored this asset as PNG; pull PNG then re-encode to JPEG.
  const url = `https://images.pexels.com/photos/17225672/pexels-photo-17225672.png?auto=compress&cs=tinysrgb&w=2400`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`[ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
}

// Append catalogue entry.
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));
if (!existingSrc.has(rel)) {
  catalogue.push({
    src: rel,
    takenAt: null,
    hasGps: false,
    place: pick.place,
    source: {
      type: "stock",
      provider: "Pexels",
      url: pick.pageUrl,
      photographer: pick.photographer,
      photographerUrl: pick.photographerUrl,
      license: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
    },
  });
  writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
  console.log(`Appended catalogue entry for ${rel}.`);
} else {
  console.log("Catalogue entry already present.");
}
