// Apply Pexels stock for Hungary/Germany cities backfill task.
//
// Per the task brief:
// - Munich (München) — own-camera coverage is Dachau-only (5 entries already
//   added by build-entries.mjs). Pexels fill provides actual Munich-centre
//   imagery (Marienplatz, Frauenkirche, New Town Hall) so the city renders on
//   /travel as a distinct stop.
// - Nuremberg — 1 own-camera drive-through shot. Pexels top-up brings count to 5.
// - Budapest — 3 own-camera (Vecsés-area airport-suburb cluster). Pexels top-up
//   shows actual Budapest landmarks (Parliament, Chain Bridge, Fisherman's
//   Bastion) so the page is recognisable.
// - Szeged, Szarvas, Keszthely, Gyula — zero own-camera evidence. 3 Pexels
//   each, mounted under a new trip slug `2024-08-hungary-roadtrip` (date-
//   derived per Eduard's brief — "may have visited on a separate trip with own
//   car").
//
// Same schema as scripts/.round5/apply-pexels-thin-trip.mjs:
//   hasGps:true, cameraModel:"Pexels stock", gps:{centroid}, takenAt:midpoint,
//   stock:true, source:{type:"stock", provider:"Pexels", ...}
//
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

// Per-trip midpoint timestamps (ISO UTC). Balkan trip uses the actual day the
// city was visited (Mar 14-15 for Budapest, Mar 28 for Munich/Nuremberg). The
// fictional Hungary roadtrip uses a plausible August 2024 mid-summer date —
// this slug is a placeholder for whenever Eduard tags the actual visit.
const BALKAN_BUDAPEST_MIDPOINT = "2026-03-14T18:00:00Z";
const BALKAN_MAR28_MIDPOINT = "2026-03-28T16:00:00Z";
const HU_ROADTRIP_MIDPOINT = "2024-08-15T12:00:00Z";

// City centroids (lat, lon — geocode-cache-key compatible) and place display.
const PLACES = {
  budapest: {
    gps: { lat: 47.4979, lon: 19.0402 },
    place: { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" },
  },
  munich: {
    gps: { lat: 48.1351, lon: 11.5820 },
    place: { city: "Munich", country: "Germany", display: "Munich, Germany" },
  },
  nuremberg: {
    gps: { lat: 49.4521, lon: 11.0767 },
    place: { city: "Nuremberg", country: "Germany", display: "Nuremberg, Germany" },
  },
  szeged: {
    gps: { lat: 46.2530, lon: 20.1414 },
    place: { city: "Szeged", country: "Hungary", display: "Szeged, Hungary" },
  },
  szarvas: {
    gps: { lat: 46.8678, lon: 20.5536 },
    place: { city: "Szarvas", country: "Hungary", display: "Szarvas, Hungary" },
  },
  keszthely: {
    gps: { lat: 46.7706, lon: 17.2432 },
    place: { city: "Keszthely", country: "Hungary", display: "Keszthely, Hungary" },
  },
  gyula: {
    gps: { lat: 46.6486, lon: 21.2828 },
    place: { city: "Gyula", country: "Hungary", display: "Gyula, Hungary" },
  },
};

// All picks (verified per-photo via WebFetch on each Pexels page — photographer
// name, profile slug, and location confirmed).
const PICKS = [
  // --- Munich (Pexels-only — own coverage is Dachau-suburb only) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 13762982, slug: "munich-marienplatz-aerial",
    photographer: "Prakhyath DESHPANDE", photographerUrl: "https://www.pexels.com/@desh/",
    pageUrl: "https://www.pexels.com/photo/13762982/",
    placeKey: "munich", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 28733346, slug: "munich-marienplatz-frauenkirche",
    photographer: "Ilia Bronskiy", photographerUrl: "https://www.pexels.com/@ilia-bronskiy-1137858493/",
    pageUrl: "https://www.pexels.com/photo/28733346/",
    placeKey: "munich", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 4213371, slug: "munich-new-town-hall-dusk",
    photographer: "Anastasia Shuraeva", photographerUrl: "https://www.pexels.com/@anastasia-shuraeva/",
    pageUrl: "https://www.pexels.com/photo/4213371/",
    placeKey: "munich", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 29651753, slug: "munich-frauenkirche-towers",
    photographer: "Omar Ramadan", photographerUrl: "https://www.pexels.com/@omar-ramadan-1739260/",
    pageUrl: "https://www.pexels.com/photo/29651753/",
    placeKey: "munich", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 33361059, slug: "munich-marienplatz-sunset",
    photographer: "Ravjot Singh", photographerUrl: "https://www.pexels.com/@mustang/",
    pageUrl: "https://www.pexels.com/photo/33361059/",
    placeKey: "munich", takenAt: BALKAN_MAR28_MIDPOINT,
  },

  // --- Nuremberg (top-up — 1 own + 4 Pexels) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 36359707, slug: "nuremberg-historic-bridge",
    photographer: "Alyona Nagel", photographerUrl: "https://www.pexels.com/@alyona-nagel-1468385055/",
    pageUrl: "https://www.pexels.com/photo/36359707/",
    placeKey: "nuremberg", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 36864163, slug: "nuremberg-pegnitz-timber-houses",
    photographer: "Travel Photographer", photographerUrl: "https://www.pexels.com/@travel-photographer-127255675/",
    pageUrl: "https://www.pexels.com/photo/36864163/",
    placeKey: "nuremberg", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 32472110, slug: "nuremberg-skyline",
    photographer: "Ravjot Singh", photographerUrl: "https://www.pexels.com/@mustang/",
    pageUrl: "https://www.pexels.com/photo/32472110/",
    placeKey: "nuremberg", takenAt: BALKAN_MAR28_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 34270730, slug: "nuremberg-aerial-church-tower",
    photographer: "0xd1ma", photographerUrl: "https://www.pexels.com/@0xd1ma-2150011827/",
    pageUrl: "https://www.pexels.com/photo/34270730/",
    placeKey: "nuremberg", takenAt: BALKAN_MAR28_MIDPOINT,
  },

  // --- Budapest (top-up — 3 own + 3 Pexels) ---
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 15381620, slug: "budapest-parliament-night",
    photographer: "Dimitris Penidis", photographerUrl: "https://www.pexels.com/@dimitris-penidis-439677039/",
    pageUrl: "https://www.pexels.com/photo/15381620/",
    placeKey: "budapest", takenAt: BALKAN_BUDAPEST_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 36849758, slug: "budapest-chain-bridge-buda-castle",
    photographer: "Lajos Kristóf Kántor", photographerUrl: "https://www.pexels.com/@lajos-kristof-kantor-2158796893/",
    pageUrl: "https://www.pexels.com/photo/36849758/",
    placeKey: "budapest", takenAt: BALKAN_BUDAPEST_MIDPOINT,
  },
  {
    tripFolder: "2026-03-balkans-roadtrip", id: 37243201, slug: "budapest-fishermans-bastion-sunset",
    photographer: "Talha Kılıç", photographerUrl: "https://www.pexels.com/@talha-kilic-517654077/",
    pageUrl: "https://www.pexels.com/photo/37243201/",
    placeKey: "budapest", takenAt: BALKAN_BUDAPEST_MIDPOINT,
  },

  // --- Szeged (Pexels-only) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 31727189, slug: "szeged-cathedral-golden-hour",
    photographer: "Liza Sigareva", photographerUrl: "https://www.pexels.com/@liza-sigareva-2149951107/",
    pageUrl: "https://www.pexels.com/photo/31727189/",
    placeKey: "szeged", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 12467094, slug: "szeged-cathedral-spires-dramatic",
    photographer: "Molnár Tamás Photography", photographerUrl: "https://www.pexels.com/@molnartamasphotography/",
    pageUrl: "https://www.pexels.com/photo/12467094/",
    placeKey: "szeged", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 34457222, slug: "szeged-new-synagogue",
    photographer: "Umair Ali Asad", photographerUrl: "https://www.pexels.com/@umair-ali-asad-315697493/",
    pageUrl: "https://www.pexels.com/photo/34457222/",
    placeKey: "szeged", takenAt: HU_ROADTRIP_MIDPOINT,
  },

  // --- Keszthely (Pexels-only) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 13101101, slug: "keszthely-pier-balaton",
    photographer: "Nikolett Emmert", photographerUrl: "https://www.pexels.com/@nikiemmert/",
    pageUrl: "https://www.pexels.com/photo/13101101/",
    placeKey: "keszthely", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 19509512, slug: "keszthely-festetics-palace-gardens",
    photographer: "Anikó Liptai", photographerUrl: "https://www.pexels.com/@aniko-liptai-842186932/",
    pageUrl: "https://www.pexels.com/photo/19509512/",
    placeKey: "keszthely", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 14738310, slug: "keszthely-festetics-palace-baroque",
    photographer: "Ivan Dražić", photographerUrl: "https://www.pexels.com/@ivan-drazic-20457695/",
    pageUrl: "https://www.pexels.com/photo/14738310/",
    placeKey: "keszthely", takenAt: HU_ROADTRIP_MIDPOINT,
  },

  // --- Gyula (Pexels-only — limited Pexels coverage; 1 castle + 2 Hungarian
  //     Plain regional photos representative of the Békés-county landscape) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 10104803, slug: "gyula-castle-autumn-reflection",
    photographer: "Nora", photographerUrl: "https://www.pexels.com/@sznori/",
    pageUrl: "https://www.pexels.com/photo/10104803/",
    placeKey: "gyula", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 27074971, slug: "gyula-hungarian-grey-cattle",
    photographer: "Péter Borkó", photographerUrl: "https://www.pexels.com/@stokeron/",
    pageUrl: "https://www.pexels.com/photo/27074971/",
    placeKey: "gyula", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 23963002, slug: "gyula-grey-steppe-cattle-pasture",
    photographer: "Ágnes Léber", photographerUrl: "https://www.pexels.com/@agnes-leber-1272629812/",
    pageUrl: "https://www.pexels.com/photo/23963002/",
    placeKey: "gyula", takenAt: HU_ROADTRIP_MIDPOINT,
  },

  // --- Szarvas (Pexels-only — limited; 3 Hungarian-Plain regional photos
  //     representing the Békés/Körös-river landscape Szarvas sits within) ---
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 27724022, slug: "szarvas-tranquil-river-greenery",
    photographer: "Molnár Tamás Photography", photographerUrl: "https://www.pexels.com/@molnartamasphotography/",
    pageUrl: "https://www.pexels.com/photo/27724022/",
    placeKey: "szarvas", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 32577825, slug: "szarvas-misty-green-fields",
    photographer: "Barnabas Davoti", photographerUrl: "https://www.pexels.com/@barnabas-davoti-31615494/",
    pageUrl: "https://www.pexels.com/photo/32577825/",
    placeKey: "szarvas", takenAt: HU_ROADTRIP_MIDPOINT,
  },
  {
    tripFolder: "2024-08-hungary-roadtrip", id: 13456593, slug: "szarvas-aerial-farmland",
    photographer: "Barnabas Davoti", photographerUrl: "https://www.pexels.com/@barnabas-davoti-31615494/",
    pageUrl: "https://www.pexels.com/photo/13456593/",
    placeKey: "szarvas", takenAt: HU_ROADTRIP_MIDPOINT,
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

const merged = [...catalogue, ...newEntries];
// Stable sort by takenAt for nicer diffs.
merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
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
