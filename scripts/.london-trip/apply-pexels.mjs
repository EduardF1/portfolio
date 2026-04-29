// Apply Pexels stock for the London trip.
//
// Per the task brief: Eduard mentioned he visited London but no own-camera
// material exists in G:\Photos for the city. The 2023 cluster on G:\Photos
// (Edinburgh 23) holds only 2 transit photos at Edinburgh airport — same
// month/year as the assumed London visit, but airport-only and 400 mi away.
// Decision: separate trip slug `2023-07-london`. Six Pexels landmark shots
// fill the gallery to the ≥ 5 floor with a dedicated London page.
//
// Same schema as scripts/.hu-de-cities/apply-pexels.mjs.
// Idempotent: skips downloads when target file already exists; skips catalogue
// dupes by `src`.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

const LONDON_MIDPOINT = "2023-07-08T12:00:00Z";

const PLACES = {
  london: {
    gps: { lat: 51.5074, lon: -0.1278 },
    place: { city: "London", country: "United Kingdom", display: "London, United Kingdom" },
  },
};

// Each pick verified via WebFetch against its Pexels page (photographer name +
// profile slug + landmark match confirmed).
const PICKS = [
  {
    tripFolder: "2023-07-london", id: 575410, slug: "london-tower-bridge-bascules-raised",
    photographer: "SevenStorm JUHASZIMRUS",
    photographerUrl: "https://www.pexels.com/@sevenstormphotography/",
    pageUrl: "https://www.pexels.com/photo/575410/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
  },
  {
    tripFolder: "2023-07-london", id: 14711297, slug: "london-big-ben-clear-sky",
    photographer: "Szymon Shields",
    photographerUrl: "https://www.pexels.com/@szymon-shields-1503561/",
    pageUrl: "https://www.pexels.com/photo/14711297/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
  },
  {
    tripFolder: "2023-07-london", id: 16233863, slug: "london-westminster-bridge-parliament",
    photographer: "Wender Junior Souza Vieira",
    photographerUrl: "https://www.pexels.com/@wender-junior-souza-vieira-9757411/",
    pageUrl: "https://www.pexels.com/photo/16233863/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
  },
  {
    tripFolder: "2023-07-london", id: 16333184, slug: "london-buckingham-palace-facade",
    photographer: "Jatman 0007",
    photographerUrl: "https://www.pexels.com/@jatman-0007-375490484/",
    pageUrl: "https://www.pexels.com/photo/16333184/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
  },
  {
    tripFolder: "2023-07-london", id: 29276670, slug: "london-skyline-from-greenwich",
    photographer: "Vivek Tedla",
    photographerUrl: "https://www.pexels.com/@vivek-tedla-2076460171/",
    pageUrl: "https://www.pexels.com/photo/29276670/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
  },
  {
    tripFolder: "2023-07-london", id: 30754172, slug: "london-shard-tower-bridge-sunset",
    photographer: "Jabez Cutamora",
    photographerUrl: "https://www.pexels.com/@jabzee/",
    pageUrl: "https://www.pexels.com/photo/30754172/",
    placeKey: "london", takenAt: LONDON_MIDPOINT,
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
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
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

// ---------- Append to photo-catalogue.json ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  const placeData = PLACES[r.pick.placeKey];
  if (!placeData) {
    throw new Error(`Unknown placeKey: ${r.pick.placeKey} (pick ${r.pick.tripFolder}/${r.pick.id})`);
  }
  newEntries.push({
    src,
    takenAt: r.pick.takenAt,
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

// Append in insertion order to keep the diff small (existing catalogue is not
// pre-sorted by takenAt — re-sorting would rewrite the whole file).
const merged = [...catalogue, ...newEntries];
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

// ---------- Append rows to docs/photo-attributions.md ----------
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
console.log(`Appended ${newRows.length} attribution rows to ${attribPath}.`);

// ---------- Manifest ----------
const manifestPath = join(__dirname, "apply-pexels-results.json");
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
