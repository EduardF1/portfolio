// Wave 4 — additional thin-city Pexels backfill: Vlora, Hirtshals, Skagen,
// Aarhus, Prague, Brno, Saranda, Ghent. Same schema as prior waves.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

const MID = {
  "2018-04-sweden": "2018-04-21T12:00:00Z",
  "2019-07-belgium": "2019-07-30T12:00:00Z",
  "2022-08-denmark": "2022-08-18T12:00:00Z",
  "2022-10-denmark": "2022-10-15T12:00:00Z",
  "2024-09-albania-saranda": "2024-09-15T12:00:00Z",
  "2025-04-czechia-poland-slovakia-austria": "2025-04-15T12:00:00Z",
  "2026-03-balkans-roadtrip": "2026-03-20T12:00:00Z",
};

const PLACES = {
  vlora: {
    gps: { lat: 40.4686, lon: 19.4914 },
    place: { city: "Vlora", country: "Albania", display: "Vlora, Albania" },
  },
  hirtshals: {
    gps: { lat: 57.5905, lon: 9.9647 },
    place: { city: "Hirtshals", country: "Denmark", display: "Hirtshals, Denmark" },
  },
  skagen: {
    gps: { lat: 57.7253, lon: 10.5839 },
    place: { city: "Skagen", country: "Denmark", display: "Skagen, Denmark" },
  },
  aarhus: {
    gps: { lat: 56.1629, lon: 10.2039 },
    place: { city: "Aarhus", country: "Denmark", display: "Aarhus, Denmark" },
  },
  prague: {
    gps: { lat: 50.0755, lon: 14.4378 },
    place: { city: "Prague", country: "Czechia", display: "Prague, Czechia" },
  },
  brno: {
    gps: { lat: 49.1951, lon: 16.6068 },
    place: { city: "Brno", country: "Czechia", display: "Brno, Czechia" },
  },
  saranda: {
    gps: { lat: 39.8756, lon: 20.0050 },
    place: { city: "Saranda", country: "Albania", display: "Saranda, Albania" },
  },
  ghent: {
    gps: { lat: 51.0500, lon: 3.7300 },
    place: { city: "Ghent", country: "Belgium", display: "Ghent, Belgium" },
  },
};

const PICKS = [
  // --- Albania | Vlora (1 -> 5) ---
  {
    tripFolder: "2024-09-albania-saranda", id: 33558513, slug: "vlora-aerial-cityscape",
    photographer: "Sabina Kallari", photographerUrl: "https://www.pexels.com/@sabinakallari/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-vlore-cityscape-and-coastline-33558513/",
    placeKey: "vlora",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 34092849, slug: "vlora-coastline-aerial",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-vlore-coastline-in-albania-34092849/",
    placeKey: "vlora",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 14615853, slug: "vlora-independence-monument",
    photographer: "Valter Zhara", photographerUrl: "https://www.pexels.com/@valter-zhara-164968736/",
    pageUrl: "https://www.pexels.com/photo/monument-with-red-flag-and-red-star-in-albania-14615853/",
    placeKey: "vlora",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 28238159, slug: "vlora-sunny-beach",
    photographer: "Arlind D", photographerUrl: "https://www.pexels.com/@arlindphotography/",
    pageUrl: "https://www.pexels.com/photo/sea-sunny-beach-sand-28238159/",
    placeKey: "vlora",
  },

  // --- Denmark | Hirtshals (1 -> 4) — 3 picks (lighthouse, dunes) ---
  {
    tripFolder: "2022-08-denmark", id: 8297881, slug: "hirtshals-lighthouse-grass",
    photographer: "Nico Becker", photographerUrl: "https://www.pexels.com/@nicobecker/",
    pageUrl: "https://www.pexels.com/photo/white-lighthouse-on-green-grass-field-near-the-sea-8297881/",
    placeKey: "hirtshals",
  },
  {
    tripFolder: "2022-08-denmark", id: 29474953, slug: "hirtshals-lighthouse-dramatic-sky",
    photographer: "Joerg Mangelsen", photographerUrl: "https://www.pexels.com/@joerg-mangelsen-337913024/",
    pageUrl: "https://www.pexels.com/photo/iconic-hirtshals-lighthouse-under-dramatic-sky-29474953/",
    placeKey: "hirtshals",
  },
  {
    tripFolder: "2022-08-denmark", id: 29475120, slug: "hirtshals-north-sea-dunes",
    photographer: "Joerg Mangelsen", photographerUrl: "https://www.pexels.com/@joerg-mangelsen-337913024/",
    pageUrl: "https://www.pexels.com/photo/dramatic-north-sea-coastline-in-hirtshals-denmark-29475120/",
    placeKey: "hirtshals",
  },

  // --- Denmark | Skagen (2 -> 5) — 3 picks ---
  {
    tripFolder: "2022-08-denmark", id: 34458165, slug: "skagen-lighthouse-spring",
    photographer: "Christian Himmel", photographerUrl: "https://www.pexels.com/@christian-himmel-2152826153/",
    pageUrl: "https://www.pexels.com/photo/lighthouse-at-skagen-denmark-in-spring-34458165/",
    placeKey: "skagen",
  },
  {
    tripFolder: "2022-08-denmark", id: 33843477, slug: "skagen-sand-dunes",
    photographer: "Tommes Frites", photographerUrl: "https://www.pexels.com/@tommes-frites-1141358642/",
    pageUrl: "https://www.pexels.com/photo/scenic-sand-dunes-at-skagen-denmark-33843477/",
    placeKey: "skagen",
  },
  {
    tripFolder: "2022-08-denmark", id: 34551617, slug: "skagen-coastline-lighthouse",
    photographer: "Christian Himmel", photographerUrl: "https://www.pexels.com/@christian-himmel-2152826153/",
    pageUrl: "https://www.pexels.com/photo/majestic-lighthouse-on-danish-coastline-34551617/",
    placeKey: "skagen",
  },

  // --- Denmark | Aarhus (2 -> 4) — 2 picks ---
  {
    tripFolder: "2022-10-denmark", id: 15796451, slug: "aarhus-cathedral-tower-harbor",
    photographer: "Deyaar Rumi", photographerUrl: "https://www.pexels.com/@deyaar-rumi-427064673/",
    pageUrl: "https://www.pexels.com/photo/tower-of-cathedral-in-aarhus-15796451/",
    placeKey: "aarhus",
  },
  {
    tripFolder: "2022-10-denmark", id: 16375882, slug: "aarhus-seafront-night",
    photographer: "Deyaar Rumi", photographerUrl: "https://www.pexels.com/@deyaar-rumi-427064673/",
    pageUrl: "https://www.pexels.com/photo/buildings-on-sea-shore-in-aarhus-at-night-16375882/",
    placeKey: "aarhus",
  },

  // --- Czechia | Prague (2 -> 5) — 3 picks ---
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 29542814, slug: "prague-castle-autumn",
    photographer: "Jules Clark", photographerUrl: "https://www.pexels.com/@jules-clark-624979041/",
    pageUrl: "https://www.pexels.com/photo/stunning-view-of-prague-castle-in-autumn-29542814/",
    placeKey: "prague",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 18682115, slug: "prague-castle-evening",
    photographer: "Oguz Karademir", photographerUrl: "https://www.pexels.com/@oguz-karademir-591747508/",
    pageUrl: "https://www.pexels.com/photo/prague-castle-in-evening-18682115/",
    placeKey: "prague",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 33768098, slug: "prague-castle-vltava",
    photographer: "Tea with Jesus By Mirna", photographerUrl: "https://www.pexels.com/@izmir/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-prague-castle-and-vltava-river-33768098/",
    placeKey: "prague",
  },

  // --- Czechia | Brno (2 -> 5) — 3 picks ---
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 29536421, slug: "brno-spilberk-castle-twilight",
    photographer: "Helena Jankovičová Kováčová", photographerUrl: "https://www.pexels.com/@helen1/",
    pageUrl: "https://www.pexels.com/photo/cityscape-of-brno-with-spilberk-castle-tower-29536421/",
    placeKey: "brno",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 37294826, slug: "brno-saint-peter-paul-cathedral",
    photographer: "Leonhard Niederwimmer", photographerUrl: "https://www.pexels.com/@leonhard-niederwimmer-2156971331/",
    pageUrl: "https://www.pexels.com/photo/saint-peter-and-paul-cathedral-in-brno-czechia-37294826/",
    placeKey: "brno",
  },
  {
    tripFolder: "2025-04-czechia-poland-slovakia-austria", id: 15411756, slug: "brno-namesti-svobody-square",
    photographer: "Ivan Dražić", photographerUrl: "https://www.pexels.com/@ivan-drazic-20457695/",
    pageUrl: "https://www.pexels.com/photo/buildings-by-the-namesti-svobody-square-in-brno-czech-republic-15411756/",
    placeKey: "brno",
  },

  // --- Albania | Saranda (2 -> 5) — 3 picks ---
  {
    tripFolder: "2024-09-albania-saranda", id: 34092450, slug: "saranda-harbour-sunset-aerial",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/scenic-sunset-over-sarande-harbour-albania-34092450/",
    placeKey: "saranda",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 33067852, slug: "saranda-coastal-sunset",
    photographer: "Arlind D", photographerUrl: "https://www.pexels.com/@arlindphotography/",
    pageUrl: "https://www.pexels.com/photo/stunning-coastal-view-of-sarande-at-sunset-33067852/",
    placeKey: "saranda",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 33067851, slug: "saranda-lekursi-castle-evening",
    photographer: "Arlind D", photographerUrl: "https://www.pexels.com/@arlindphotography/",
    pageUrl: "https://www.pexels.com/photo/sarande-coastal-view-with-lekursi-castle-in-albania-33067851/",
    placeKey: "saranda",
  },

  // --- Belgium | Ghent (2 -> 5) — 3 picks ---
  {
    tripFolder: "2019-07-belgium", id: 18926431, slug: "ghent-gravensteen-castle",
    photographer: "Milan", photographerUrl: "https://www.pexels.com/@milan-743755762/",
    pageUrl: "https://www.pexels.com/photo/medieval-gravensteen-castle-in-ghent-18926431/",
    placeKey: "ghent",
  },
  {
    tripFolder: "2019-07-belgium", id: 32578935, slug: "ghent-st-bavo-cathedral-aerial",
    photographer: "Vladislav Anchuk", photographerUrl: "https://www.pexels.com/@anchukk/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-st-bavo-s-cathedral-in-ghent-belgium-32578935/",
    placeKey: "ghent",
  },
  {
    tripFolder: "2019-07-belgium", id: 18358613, slug: "ghent-graslei-quay-canal",
    photographer: "Mayumi Maciel", photographerUrl: "https://www.pexels.com/@mayumi-maciel-686681543/",
    pageUrl: "https://www.pexels.com/photo/graslei-quay-in-ghent-18358613/",
    placeKey: "ghent",
  },
];

function targetPath(pick) {
  const file = `pexels-${pick.slug}-${pick.id}.jpg`;
  return {
    file,
    rel: `trips/${pick.tripFolder}/${file}`,
    abs: join(repoRoot, "public", "photos", "trips", pick.tripFolder, file),
  };
}

async function downloadImage(pick) {
  const url = `https://images.pexels.com/photos/${pick.id}/pexels-photo-${pick.id}.jpeg?auto=compress&cs=tinysrgb&w=1920`;
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
    throw new Error(`Suspiciously small response (${buf.length} bytes) for ${url}`);
  }
  return buf;
}

async function processOne(pick) {
  const { file, rel, abs } = targetPath(pick);
  mkdirSync(dirname(abs), { recursive: true });

  if (existsSync(abs)) {
    const sz = statSync(abs).size;
    return { pick, rel, abs, file, bytes: sz, skipped: true };
  }

  const raw = await downloadImage(pick);
  const out = await sharp(raw)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
  writeFileSync(abs, out);
  console.log(`  [ok] ${rel} (${(out.length / 1024).toFixed(0)} KB)`);
  return { pick, rel, abs, file, bytes: out.length };
}

const results = [];
const failures = [];
for (const pick of PICKS) {
  try {
    results.push(await processOne(pick));
  } catch (err) {
    console.error(`  [FAIL] ${pick.tripFolder}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(`\n${results.length} processed, ${failures.length} failed.`);

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  if (existingSrc.has(r.rel)) continue;
  const placeData = PLACES[r.pick.placeKey];
  const takenAt = MID[r.pick.tripFolder];
  if (!takenAt) throw new Error(`No midpoint for ${r.pick.tripFolder}`);
  newEntries.push({
    src: r.rel,
    takenAt,
    hasGps: true,
    cameraModel: "Pexels stock",
    gps: placeData.gps,
    place: placeData.place,
    stock: true,
    source: {
      type: "stock",
      provider: "Pexels",
      url: r.pick.pageUrl,
      photographer: r.pick.photographer,
      photographerUrl: r.pick.photographerUrl,
      license: PEXELS_LICENSE,
      licenseUrl: PEXELS_LICENSE_URL,
    },
  });
}

const merged = [...catalogue, ...newEntries];
merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");
const lines = attribRaw.split("\n");
const licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
const sortedResults = [...results].sort((a, b) => a.rel.localeCompare(b.rel));
for (const r of sortedResults) {
  newRows.push(
    `| \`public/photos/${r.rel}\` | ${PLACES[r.pick.placeKey].place.display} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
  );
}

let totalIdx = lines.length - 1;
while (totalIdx >= 0 && !lines[totalIdx].startsWith("Total stock photos:")) totalIdx--;

const newTotal = catalogue.filter((e) => e.source?.type === "stock").length + newEntries.length;
const updatedLines = [
  ...lines.slice(0, lastRowIdx + 1),
  ...newRows,
  ...lines.slice(lastRowIdx + 1, totalIdx === -1 ? lines.length : totalIdx),
];
if (totalIdx !== -1) {
  updatedLines.push(`Total stock photos: ${newTotal}`);
  updatedLines.push("");
}

writeFileSync(attribPath, updatedLines.join("\n"), "utf8");
console.log(`Appended ${newRows.length} attribution rows.`);
