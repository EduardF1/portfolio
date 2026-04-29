// Wave 2 — additional Pexels backfill for thin cities still under 5 after
// wave 1. Same schema as wave 1.

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
  "2020-02-denmark": "2020-02-19T12:00:00Z",
  "2023-04-italy": "2023-04-03T12:00:00Z",
  "2024-09-albania-saranda": "2024-09-15T12:00:00Z",
};

const PLACES = {
  bruges: {
    gps: { lat: 51.2093, lon: 3.2247 },
    place: { city: "Bruges", country: "Belgium", display: "Bruges, Belgium" },
  },
  vejle: {
    gps: { lat: 55.7090, lon: 9.5360 },
    place: { city: "Vejle", country: "Denmark", display: "Vejle, Denmark" },
  },
  bergamo: {
    gps: { lat: 45.6983, lon: 9.6773 },
    place: { city: "Bergamo", country: "Italy", display: "Bergamo, Italy" },
  },
  berat: {
    gps: { lat: 40.7058, lon: 19.9522 },
    place: { city: "Berat", country: "Albania", display: "Berat, Albania" },
  },
  gjirokastra: {
    gps: { lat: 40.0758, lon: 20.1389 },
    place: { city: "Gjirokastra", country: "Albania", display: "Gjirokastra, Albania" },
  },
  durres: {
    gps: { lat: 41.3231, lon: 19.4414 },
    place: { city: "Durrës", country: "Albania", display: "Durrës, Albania" },
  },
  malmo_alt: {
    gps: { lat: 55.6050, lon: 13.0038 },
    place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  },
};

const PICKS = [
  // --- Belgium | Bruges (1 -> 5) — 4 new picks ---
  {
    tripFolder: "2019-07-belgium", id: 34973794, slug: "bruges-belfry-canal-sunny",
    photographer: "Jean-Paul Wettstein", photographerUrl: "https://www.pexels.com/@jean-paul-wettstein-677916508/",
    pageUrl: "https://www.pexels.com/photo/sunny-day-view-of-bruges-belfry-and-canal-34973794/",
    placeKey: "bruges",
  },
  {
    tripFolder: "2019-07-belgium", id: 37149632, slug: "bruges-canal-belfry-tower",
    photographer: "funnyturkishdude", photographerUrl: "https://www.pexels.com/@funnyturkishdude/",
    pageUrl: "https://www.pexels.com/photo/charming-view-of-bruges-canal-and-belfry-tower-37149632/",
    placeKey: "bruges",
  },
  {
    tripFolder: "2019-07-belgium", id: 35855204, slug: "bruges-historic-archways",
    photographer: "Alisa Skripina", photographerUrl: "https://www.pexels.com/@alisa-skripina-2147548092/",
    pageUrl: "https://www.pexels.com/photo/historic-architecture-in-bruges-belgium-35855204/",
    placeKey: "bruges",
  },
  {
    tripFolder: "2019-07-belgium", id: 31948132, slug: "bruges-canal-medieval-tower",
    photographer: "Luc AVE", photographerUrl: "https://www.pexels.com/@laphoto/",
    pageUrl: "https://www.pexels.com/photo/charming-bruges-canal-and-medieval-architecture-31948132/",
    placeKey: "bruges",
  },

  // --- Denmark | Vejle (1 -> 5) — 4 new picks ---
  {
    tripFolder: "2020-02-denmark", id: 6030024, slug: "vejle-harbor-watercrafts",
    photographer: "Lillian Katrine Kofod", photographerUrl: "https://www.pexels.com/@lillian/",
    pageUrl: "https://www.pexels.com/photo/various-watercrafts-on-docking-area-near-city-buildings-6030024/",
    placeKey: "vejle",
  },
  {
    tripFolder: "2020-02-denmark", id: 6030055, slug: "vejle-harbor-moored-boats",
    photographer: "Lillian Katrine Kofod", photographerUrl: "https://www.pexels.com/@lillian/",
    pageUrl: "https://www.pexels.com/photo/white-and-blue-boats-on-body-of-water-near-city-buildings-6030055/",
    placeKey: "vejle",
  },
  {
    tripFolder: "2020-02-denmark", id: 12558423, slug: "vejle-modern-building",
    photographer: "Valentin Onu", photographerUrl: "https://www.pexels.com/@vali741/",
    pageUrl: "https://www.pexels.com/photo/view-of-a-building-in-a-city-12558423/",
    placeKey: "vejle",
  },

  // --- Italy | Bergamo (1 -> 5) — 4 new picks ---
  {
    tripFolder: "2023-04-italy", id: 36696262, slug: "bergamo-torre-civica",
    photographer: "Domenico Adornato", photographerUrl: "https://www.pexels.com/@domenico-adornato-429128288/",
    pageUrl: "https://www.pexels.com/photo/medieval-tower-and-architecture-in-bergamo-italy-36696262/",
    placeKey: "bergamo",
  },
  {
    tripFolder: "2023-04-italy", id: 36371987, slug: "bergamo-porta-san-giacomo",
    photographer: "Jasmin Kaemmerer", photographerUrl: "https://www.pexels.com/@jasmin-kaemmerer-704618493/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-porta-san-giacomo-bergamo-36371987/",
    placeKey: "bergamo",
  },
  {
    tripFolder: "2023-04-italy", id: 28480961, slug: "bergamo-cappella-colleoni",
    photographer: "Yannick", photographerUrl: "https://www.pexels.com/@yannick-739231218/",
    pageUrl: "https://www.pexels.com/photo/stunning-view-of-cappella-colleoni-in-bergamo-italy-28480961/",
    placeKey: "bergamo",
  },
  {
    tripFolder: "2023-04-italy", id: 20169939, slug: "bergamo-basilica-santa-maria",
    photographer: "Ira", photographerUrl: "https://www.pexels.com/@ira-2300811/",
    pageUrl: "https://www.pexels.com/photo/basilica-di-santa-maria-maggiore-in-bergamo-italy-20169939/",
    placeKey: "bergamo",
  },

  // --- Albania | Berat (1 -> 5) — 4 new picks ---
  {
    tripFolder: "2024-09-albania-saranda", id: 32485634, slug: "berat-ottoman-houses",
    photographer: "Sabina Kallari", photographerUrl: "https://www.pexels.com/@sabinakallari/",
    pageUrl: "https://www.pexels.com/photo/historic-ottoman-architecture-in-berat-albania-32485634/",
    placeKey: "berat",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 5987058, slug: "berat-citadel-aerial",
    photographer: "Klidjon Gozhina", photographerUrl: "https://www.pexels.com/@klidjon-gozhina-6927515/",
    pageUrl: "https://www.pexels.com/photo/citadel-of-berat-in-albania-5987058/",
    placeKey: "berat",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 34092317, slug: "berat-ottoman-houses-unesco",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/historic-ottoman-architecture-in-berat-albania-34092317/",
    placeKey: "berat",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 30459671, slug: "berat-aerial-old-town",
    photographer: "Sebastian Wright", photographerUrl: "https://www.pexels.com/@sebastian-wright-2148878306/",
    pageUrl: "https://www.pexels.com/photo/charming-aerial-view-of-historic-berat-albania-30459671/",
    placeKey: "berat",
  },

  // --- Albania | Gjirokastra (1 -> 5) — 4 new picks ---
  {
    tripFolder: "2024-09-albania-saranda", id: 34092479, slug: "gjirokaster-fortress-clock-tower",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/historic-clock-tower-in-gjirokaster-fortress-albania-34092479/",
    placeKey: "gjirokastra",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 11344774, slug: "gjirokaster-fortress-mountains",
    photographer: "Medina Rrokja", photographerUrl: "https://www.pexels.com/@inng/",
    pageUrl: "https://www.pexels.com/photo/gjirokaster-fortress-in-albania-11344774/",
    placeKey: "gjirokastra",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 20761909, slug: "gjirokaster-fortress-cloudy",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/view-of-the-gjirokaster-fortress-in-gjirokaster-albania-20761909/",
    placeKey: "gjirokastra",
  },
  {
    tripFolder: "2024-09-albania-saranda", id: 34092480, slug: "gjirokaster-castle-clock-tower",
    photographer: "Laura Meinhardt", photographerUrl: "https://www.pexels.com/@leefinvrede/",
    pageUrl: "https://www.pexels.com/photo/historic-clock-tower-in-gjirokaster-castle-albania-34092480/",
    placeKey: "gjirokastra",
  },

  // --- Albania | Durrës (4 -> 5) — 1 new pick ---
  {
    tripFolder: "2024-09-albania-saranda", id: 4712330, slug: "durres-beach-aerial-skyline",
    photographer: "Julia Solodovnikova", photographerUrl: "https://www.pexels.com/@julia-solodovnikova-2581492/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-a-beach-4712330/",
    placeKey: "durres",
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
    console.log(`  [skip exists] ${rel} (${(sz / 1024).toFixed(0)} KB)`);
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

console.log(`Processing ${PICKS.length} candidates…`);
for (const pick of PICKS) {
  try {
    const r = await processOne(pick);
    results.push(r);
  } catch (err) {
    console.error(`  [FAIL] ${pick.tripFolder}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(
  `\nDownloads: ${results.length} processed (${results.filter((r) => r.skipped).length} skipped existing), ${failures.length} failures.`,
);

const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  const placeData = PLACES[r.pick.placeKey];
  if (!placeData) {
    throw new Error(`Unknown placeKey: ${r.pick.placeKey}`);
  }
  const takenAt = MID[r.pick.tripFolder];
  if (!takenAt) {
    throw new Error(`No trip midpoint for ${r.pick.tripFolder}`);
  }
  newEntries.push({
    src,
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
if (licenseHeaderIdx === -1) {
  throw new Error("Could not find '## License terms' anchor in photo-attributions.md");
}

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

const manifestPath = join(__dirname, "apply-pexels-wave2-results.json");
writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      results: results.map((r) => ({
        rel: r.rel,
        bytes: r.bytes,
        skipped: r.skipped ?? false,
        id: r.pick.id,
        tripFolder: r.pick.tripFolder,
        placeKey: r.pick.placeKey,
      })),
      failures: failures.map((f) => ({ id: f.pick.id, tripFolder: f.pick.tripFolder, error: f.error })),
      newCatalogueEntries: newEntries.length,
      newAttributionRows: newRows.length,
      totalStockNow: newTotal,
      totalBytes: results.reduce((s, r) => s + (r.bytes || 0), 0),
    },
    null,
    2,
  ),
  "utf8",
);
console.log(`Wrote ${manifestPath}.`);
