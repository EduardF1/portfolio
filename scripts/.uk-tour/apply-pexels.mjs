// Expand UK trip coverage: rename `2023-07-london` folder to
// `2023-07-uk-tour`, then add Pexels material for Edinburgh, York,
// Oxford, and Bath. End state: 5 UK cities × 5 photos each = 25 stock
// photos; existing 6 London Pexels photos are migrated (folder rename +
// catalogue `src` rewrite) so the country card surfaces ≥ 4 cities each
// with ≥ 5 photos as required.
//
// Eduard's own-camera material in the UK GPS bbox is just two airport
// coffee shots from Edinburgh airport (G:\Photos\2023\Edinburgh 23\).
// Visual quality too thin for a portfolio gallery; trip is Pexels-only,
// matching the existing London approach (PR #94).
//
// All five cities cluster as a single trip via `src/lib/trips.ts`
// (country-YYYY-MM rule + ≤ 3-day gap): `united-kingdom-2023-07`.
//
// Schema mirrors scripts/.london-trip/apply-pexels.mjs (PR #94).
// Idempotent: skips downloads when target file already exists; skips
// catalogue dupes by `src`.

import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  statSync,
  renameSync,
  readdirSync,
  rmdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

const NEW_TRIP_FOLDER = "2023-07-uk-tour";
const OLD_LONDON_FOLDER = "2023-07-london";

// Spread takenAt across the trip span so all five city clusters fall
// within the 3-day gap rule used by clusterTrips() — single trip slug.
// Eduard's actual Edinburgh airport shots are 2023-07-06 07:18; the
// trip likely ran 6–10 July.
const TAKEN_AT = {
  edinburgh: "2023-07-06T12:00:00Z",
  york: "2023-07-07T12:00:00Z",
  london: "2023-07-08T12:00:00Z", // matches existing London entries
  oxford: "2023-07-09T12:00:00Z",
  bath: "2023-07-10T12:00:00Z",
};

const PLACES = {
  edinburgh: {
    gps: { lat: 55.9533, lon: -3.1883 },
    place: { city: "Edinburgh", country: "United Kingdom", display: "Edinburgh, United Kingdom" },
  },
  york: {
    gps: { lat: 53.9591, lon: -1.0815 },
    place: { city: "York", country: "United Kingdom", display: "York, United Kingdom" },
  },
  london: {
    gps: { lat: 51.5074, lon: -0.1278 },
    place: { city: "London", country: "United Kingdom", display: "London, United Kingdom" },
  },
  oxford: {
    gps: { lat: 51.752, lon: -1.2577 },
    place: { city: "Oxford", country: "United Kingdom", display: "Oxford, United Kingdom" },
  },
  bath: {
    gps: { lat: 51.3811, lon: -2.359 },
    place: { city: "Bath", country: "United Kingdom", display: "Bath, United Kingdom" },
  },
};

// Each pick verified via WebFetch against its Pexels page (photographer
// name + profile slug + landmark match confirmed).
const PICKS = [
  // ---------- Edinburgh ----------
  {
    placeKey: "edinburgh", id: 28086723, slug: "edinburgh-castle-rock-fortress",
    photographer: "Mario Spencer",
    photographerUrl: "https://www.pexels.com/@spencphoto/",
    pageUrl: "https://www.pexels.com/photo/edinburgh-castle-28086723/",
  },
  {
    placeKey: "edinburgh", id: 29080624, slug: "edinburgh-calton-hill-historic-view",
    photographer: "Clément Proust",
    photographerUrl: "https://www.pexels.com/@clement-proust-363898785/",
    pageUrl: "https://www.pexels.com/photo/historic-calton-hill-view-of-edinburgh-29080624/",
  },
  {
    placeKey: "edinburgh", id: 36943996, slug: "edinburgh-calton-hill-monument-sunset",
    photographer: "Andrea Gambirasio",
    photographerUrl: "https://www.pexels.com/@andrea-gambirasio-2152990668/",
    pageUrl: "https://www.pexels.com/photo/sunset-view-of-edinburgh-with-calton-hill-monument-36943996/",
  },
  {
    placeKey: "edinburgh", id: 37091097, slug: "edinburgh-royal-mile-old-town",
    photographer: "Oleksiy Konstantinidi",
    photographerUrl: "https://www.pexels.com/@oleksiy-konstantinidi-2147541276/",
    pageUrl: "https://www.pexels.com/photo/crowded-edinburgh-street-with-historic-architecture-37091097/",
  },
  {
    placeKey: "edinburgh", id: 32800590, slug: "edinburgh-holyrood-palace-architecture",
    photographer: "Leon Hellegers",
    photographerUrl: "https://www.pexels.com/@leonhellegers/",
    pageUrl: "https://www.pexels.com/photo/historic-architecture-at-holyrood-palace-32800590/",
  },

  // ---------- York ----------
  {
    placeKey: "york", id: 18381495, slug: "york-minster-gothic-cathedral",
    photographer: "Jordi De Roeck",
    photographerUrl: "https://www.pexels.com/@jordi-de-roeck-335496790/",
    pageUrl: "https://www.pexels.com/photo/old-gothic-cathedral-against-blue-sky-18381495/",
  },
  {
    placeKey: "york", id: 35729114, slug: "york-minster-cathedral-view",
    photographer: "Igor Passchier",
    photographerUrl: "https://www.pexels.com/@igor-passchier-111147847/",
    pageUrl: "https://www.pexels.com/photo/stunning-view-of-york-minster-cathedral-35729114/",
  },
  {
    placeKey: "york", id: 33622985, slug: "york-shambles-historic-street",
    photographer: "Oliver Schröder",
    photographerUrl: "https://www.pexels.com/@olivers/",
    pageUrl: "https://www.pexels.com/photo/bustling-street-scene-in-york-s-historic-shambles-33622985/",
  },
  {
    placeKey: "york", id: 33554280, slug: "york-cobblestone-old-town",
    photographer: "Airam Dato-on",
    photographerUrl: "https://www.pexels.com/@airamdphoto/",
    pageUrl: "https://www.pexels.com/photo/historic-cobblestone-street-in-york-city-center-33554280/",
  },
  {
    placeKey: "york", id: 35729116, slug: "york-tudor-building-historic",
    photographer: "Igor Passchier",
    photographerUrl: "https://www.pexels.com/@igor-passchier-111147847/",
    pageUrl: "https://www.pexels.com/photo/historic-tudor-building-in-york-england-35729116/",
  },

  // ---------- Oxford ----------
  {
    placeKey: "oxford", id: 1796720, slug: "oxford-radcliffe-camera-aerial",
    photographer: "Chait Goli",
    photographerUrl: "https://www.pexels.com/@chaitaastic/",
    pageUrl: "https://www.pexels.com/photo/concrete-building-1796720/",
  },
  {
    placeKey: "oxford", id: 16009515, slug: "oxford-bodleian-library-facade",
    photographer: "Shaun Iwasawa",
    photographerUrl: "https://www.pexels.com/@shaun-iwasawa-464780865/",
    pageUrl:
      "https://www.pexels.com/photo/oxford-university-u-k-august-5-2019-an-outside-shot-of-bodleian-library-at-oxford-university-on-a-sunny-day-with-partly-cloudy-skie-16009515/",
  },
  {
    placeKey: "oxford", id: 10510959, slug: "oxford-christ-church-college",
    photographer: "Anna Kozlova",
    photographerUrl: "https://www.pexels.com/@anna-kozlova-132622441/",
    pageUrl: "https://www.pexels.com/photo/christ-church-in-oxford-england-10510959/",
  },
  {
    placeKey: "oxford", id: 35620480, slug: "oxford-natural-history-museum-dusk",
    photographer: "Peter Morch",
    photographerUrl: "https://www.pexels.com/@peter-morch-2157759396/",
    pageUrl:
      "https://www.pexels.com/photo/oxford-university-museum-of-natural-history-at-dusk-35620480/",
  },
  {
    placeKey: "oxford", id: 35491214, slug: "oxford-gothic-architecture",
    photographer: "Peter Morch",
    photographerUrl: "https://www.pexels.com/@peter-morch-2157759396/",
    pageUrl: "https://www.pexels.com/photo/historic-gothic-architecture-in-oxford-uk-35491214/",
  },

  // ---------- Bath ----------
  {
    placeKey: "bath", id: 29184552, slug: "bath-abbey-roman-baths-view",
    photographer: "Stephan Leuzinger",
    photographerUrl: "https://www.pexels.com/@stephan/",
    pageUrl: "https://www.pexels.com/photo/stunning-view-of-bath-abbey-and-roman-baths-29184552/",
  },
  {
    placeKey: "bath", id: 18222697, slug: "bath-pulteney-bridge-river-avon",
    photographer: "Eren Cebeci",
    photographerUrl: "https://www.pexels.com/@erencebeci/",
    pageUrl: "https://www.pexels.com/photo/pulteney-bridge-in-bath-in-england-18222697/",
  },
  {
    placeKey: "bath", id: 28978507, slug: "bath-abbey-somerset",
    photographer: "Sami Abdullah",
    photographerUrl: "https://www.pexels.com/@onbab/",
    pageUrl: "https://www.pexels.com/photo/historic-bath-abbey-in-somerset-england-28978507/",
  },
  {
    placeKey: "bath", id: 13020675, slug: "bath-roman-baths-abbey-gothic",
    photographer: "Marvin Sacdalan",
    photographerUrl: "https://www.pexels.com/@marvin-sacdalan-276316567/",
    pageUrl: "https://www.pexels.com/photo/people-visiting-gothic-cathedral-13020675/",
  },
  {
    placeKey: "bath", id: 29184548, slug: "bath-abbey-roman-baths-sunlight",
    photographer: "Stephan Leuzinger",
    photographerUrl: "https://www.pexels.com/@stephan/",
    pageUrl: "https://www.pexels.com/photo/historic-bath-abbey-and-roman-baths-in-sunlight-29184548/",
  },
];

// ---------- Phase 1: rename the trip folder ----------
const oldTripDir = join(repoRoot, "public", "photos", "trips", OLD_LONDON_FOLDER);
const newTripDir = join(repoRoot, "public", "photos", "trips", NEW_TRIP_FOLDER);
mkdirSync(newTripDir, { recursive: true });

if (existsSync(oldTripDir)) {
  const items = readdirSync(oldTripDir);
  for (const name of items) {
    const from = join(oldTripDir, name);
    const to = join(newTripDir, name);
    if (existsSync(to)) {
      console.log(`  [skip rename] ${name} already at new location`);
      continue;
    }
    renameSync(from, to);
    console.log(`  [rename] ${OLD_LONDON_FOLDER}/${name} -> ${NEW_TRIP_FOLDER}/${name}`);
  }
  // Remove the now-empty source folder.
  if (readdirSync(oldTripDir).length === 0) {
    rmdirSync(oldTripDir);
    console.log(`  [rmdir] removed empty ${OLD_LONDON_FOLDER}/`);
  }
}

// ---------- Phase 2: download + resize new picks ----------
function targetPath(pick) {
  const file = `pexels-${pick.slug}-${pick.id}.jpg`;
  return {
    file,
    rel: `trips/${NEW_TRIP_FOLDER}/${file}`,
    abs: join(newTripDir, file),
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

console.log(`\nProcessing ${PICKS.length} candidates…`);
for (const pick of PICKS) {
  try {
    const r = await processOne(pick);
    results.push(r);
  } catch (err) {
    console.error(`  [FAIL] ${pick.placeKey}/${pick.slug}-${pick.id}: ${err.message}`);
    failures.push({ pick, error: err.message });
  }
}

console.log(
  `\nDownloads: ${results.length} processed (${results.filter((r) => r.skipped).length} skipped existing), ${failures.length} failures.`,
);

// ---------- Phase 3: rewrite catalogue (rename + append) ----------
const cataloguePath = join(repoRoot, "scripts", "photo-catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));

let renamed = 0;
for (const e of catalogue) {
  if (typeof e.src === "string" && e.src.startsWith(`trips/${OLD_LONDON_FOLDER}/`)) {
    e.src = e.src.replace(`trips/${OLD_LONDON_FOLDER}/`, `trips/${NEW_TRIP_FOLDER}/`);
    renamed += 1;
  }
}
console.log(`Catalogue: rewrote ${renamed} src paths to ${NEW_TRIP_FOLDER}/.`);

const existingSrc = new Set(catalogue.map((e) => e.src));

const newEntries = [];
for (const r of results) {
  const src = r.rel;
  if (existingSrc.has(src)) continue;
  const placeData = PLACES[r.pick.placeKey];
  if (!placeData) {
    throw new Error(`Unknown placeKey: ${r.pick.placeKey} (pick ${r.pick.id})`);
  }
  newEntries.push({
    src,
    takenAt: TAKEN_AT[r.pick.placeKey],
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
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

// ---------- Phase 4: rewrite docs/photo-attributions.md ----------
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
let attribRaw = readFileSync(attribPath, "utf8");

// 4a. rewrite the existing London paths.
const oldPath = `public/photos/trips/${OLD_LONDON_FOLDER}/`;
const newPath = `public/photos/trips/${NEW_TRIP_FOLDER}/`;
const before = attribRaw.length;
attribRaw = attribRaw.split(oldPath).join(newPath);
console.log(`Attributions: rewrote London paths (delta ${attribRaw.length - before} chars).`);

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
  const placeDisplay = PLACES[r.pick.placeKey].place.display;
  newRows.push(
    `| \`public/photos/${r.rel}\` | ${placeDisplay} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
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
console.log(`Appended ${newRows.length} attribution rows; new total: ${newTotal}.`);

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
        placeKey: r.pick.placeKey,
      })),
      failures: failures.map((f) => ({ id: f.pick.id, placeKey: f.pick.placeKey, error: f.error })),
      londonRenames: renamed,
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
