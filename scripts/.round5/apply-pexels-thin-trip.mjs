// Apply Pexels thin-trip candidates from `docs/thin-trip-pexels-candidates.md`.
// Downloads each candidate (1920px long-edge), saves to public/photos/trips/<slug>/,
// appends a catalogue entry with stock-marker schema, and appends rows to
// `docs/photo-attributions.md`.
//
// New stock catalogue shape (per task spec):
//   - hasGps: true              (synthesised city centroid)
//   - cameraModel: "Pexels stock"
//   - gps: { lat, lon }         (city centroid)
//   - takenAt: ISO trip midpoint
//   - stock: true               (renderer marker — distinct from existing
//                                stock entries which have hasGps:false and
//                                are filtered out of clustering)
//   - place: { city, country, display }
//   - source: { type:"stock", provider:"Pexels", url, photographer,
//               photographerUrl, license, licenseUrl }
//
// Idempotent: skips downloads when the target file already exists; skips
// catalogue duplicates by `src`.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");

const PEXELS_LICENSE = "Pexels License";
const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

// Per-trip midpoint timestamps (ISO UTC).
const TRIP_MIDPOINT = {
  "2018-03-israel": "2018-03-24T12:00:00Z",
  "2019-07-belgium": "2019-07-30T12:00:00Z",
  "2019-07-luxembourg": "2019-07-30T12:00:00Z",
  "2020-02-denmark": "2020-02-19T12:00:00Z",
  "2022-08-denmark": "2022-08-18T12:00:00Z",
  "2022-12-romania": "2022-12-24T18:00:00Z",
  "2023-04-italy": "2023-04-03T12:00:00Z",
  "2023-07-turkey": "2023-07-14T12:00:00Z",
  "2025-03-romania": "2025-03-29T12:00:00Z",
};

// City centroids (lat, lon, place display).
const PLACES = {
  "rosh-hanikra": {
    gps: { lat: 33.0900, lon: 35.1050 },
    place: { city: "Rosh HaNikra (Mate Asher)", country: "Israel", display: "Rosh HaNikra (Mate Asher), Israel" },
  },
  "galilee": {
    gps: { lat: 32.7900, lon: 35.5800 },
    place: { city: "Sea of Galilee", country: "Israel", display: "Sea of Galilee, Israel" },
  },
  "brussels": {
    gps: { lat: 50.8467, lon: 4.3499 },
    place: { city: "Brussels", country: "Belgium", display: "Brussels, Belgium" },
  },
  "bruges": {
    gps: { lat: 51.2093, lon: 3.2247 },
    place: { city: "Bruges", country: "Belgium", display: "Bruges, Belgium" },
  },
  "luxembourg": {
    gps: { lat: 49.6116, lon: 6.1319 },
    place: { city: "Luxembourg", country: "Luxembourg", display: "Luxembourg, Luxembourg" },
  },
  "horsens": {
    gps: { lat: 55.8607, lon: 9.8503 },
    place: { city: "Horsens", country: "Denmark", display: "Horsens, Denmark" },
  },
  "skagen": {
    gps: { lat: 57.7253, lon: 10.5839 },
    place: { city: "Skagen", country: "Denmark", display: "Skagen, Denmark" },
  },
  "romo": {
    gps: { lat: 55.1494, lon: 8.5436 },
    place: { city: "Rømø", country: "Denmark", display: "Rømø, Denmark" },
  },
  "hirtshals": {
    gps: { lat: 57.5905, lon: 9.9647 },
    place: { city: "Hirtshals", country: "Denmark", display: "Hirtshals, Denmark" },
  },
  "samso": {
    gps: { lat: 55.8728, lon: 10.6105 },
    place: { city: "Samsø", country: "Denmark", display: "Samsø, Denmark" },
  },
  "bucharest": {
    gps: { lat: 44.4268, lon: 26.1025 },
    place: { city: "Bucharest", country: "Romania", display: "Bucharest, Romania" },
  },
  "milan": {
    gps: { lat: 45.4642, lon: 9.1900 },
    place: { city: "Milan", country: "Italy", display: "Milan, Italy" },
  },
  "istanbul": {
    gps: { lat: 41.0082, lon: 28.9784 },
    place: { city: "Istanbul", country: "Turkey", display: "Istanbul, Turkey" },
  },
};

// All 45 candidates — parsed from docs/thin-trip-pexels-candidates.md.
const PICKS = [
  // 1. 2018-03-israel
  { tripFolder: "2018-03-israel", id: 16294237, slug: "rosh-hanikra-grottoes-aerial",
    photographer: "Sunbeam", photographerUrl: "https://www.pexels.com/@sunbeam-114409506/",
    pageUrl: "https://www.pexels.com/photo/aerial-view-of-the-coastline-near-rosh-hanikra-grottoes-at-the-border-of-israel-and-lebanon-16294237/",
    placeKey: "rosh-hanikra" },
  { tripFolder: "2018-03-israel", id: 36946679, slug: "rosh-hanikra-coastal-arch",
    photographer: "Valentina Besker", photographerUrl: "https://www.pexels.com/@valentina-besker-917936546/",
    pageUrl: "https://www.pexels.com/photo/dramatic-coastal-cliff-with-azure-sea-under-cloudy-sky-36946679/",
    placeKey: "rosh-hanikra" },
  { tripFolder: "2018-03-israel", id: 20172580, slug: "galilee-rocky-shore",
    photographer: "Marta Nogueira", photographerUrl: "https://www.pexels.com/@marta-nogueira-589022975/",
    pageUrl: "https://www.pexels.com/photo/detail-of-rocky-shore-of-sea-of-galilee-in-israel-water-and-blue-sky-landscape-with-hills-in-the-background-20172580/",
    placeKey: "galilee" },
  { tripFolder: "2018-03-israel", id: 33924951, slug: "galilee-green-hills",
    photographer: "Mark Direen", photographerUrl: "https://www.pexels.com/@mark-direen-622749/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-galilee-hills-and-sea-33924951/",
    placeKey: "galilee" },
  { tripFolder: "2018-03-israel", id: 36442700, slug: "galilee-palms-and-hills",
    photographer: "Elenav", photographerUrl: "https://www.pexels.com/@elenav-2011499497/",
    pageUrl: "https://www.pexels.com/photo/scenic-view-of-sea-of-galilee-in-israel-36442700/",
    placeKey: "galilee" },

  // 2. 2019-07-belgium
  { tripFolder: "2019-07-belgium", id: 35035915, slug: "brussels-atomium",
    photographer: "Sertug Enes Çetinkaya", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/35035915/",
    placeKey: "brussels" },
  { tripFolder: "2019-07-belgium", id: 33401014, slug: "brussels-mont-des-arts",
    photographer: "Aleksandre Lomadze", photographerUrl: "https://www.pexels.com/@aleksandre-lomadze-2154684396/",
    pageUrl: "https://www.pexels.com/photo/33401014/",
    placeKey: "brussels" },
  { tripFolder: "2019-07-belgium", id: 2960887, slug: "brussels-cinquantenaire-arch",
    photographer: "Paul Deetman", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/2960887/",
    placeKey: "brussels" },
  { tripFolder: "2019-07-belgium", id: 33506900, slug: "bruges-canal-flowers-boat",
    photographer: "Selim Zengin", photographerUrl: "https://www.pexels.com/@selim-zengin-2155018084/",
    pageUrl: "https://www.pexels.com/photo/33506900/",
    placeKey: "bruges" },
  { tripFolder: "2019-07-belgium", id: 18799641, slug: "bruges-belfry-aerial",
    photographer: "Milan", photographerUrl: "https://www.pexels.com/@milan-743755762/",
    pageUrl: "https://www.pexels.com/photo/18799641/",
    placeKey: "bruges" },

  // 3. 2019-07-luxembourg
  { tripFolder: "2019-07-luxembourg", id: 34161153, slug: "luxembourg-medieval-fortifications",
    photographer: "Irvine", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/34161153/",
    placeKey: "luxembourg" },
  { tripFolder: "2019-07-luxembourg", id: 33083147, slug: "luxembourg-alzette-old-town",
    photographer: "Sara Schlickmann", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/33083147/",
    placeKey: "luxembourg" },
  { tripFolder: "2019-07-luxembourg", id: 29472785, slug: "luxembourg-old-town-aerial",
    photographer: "Marina Zvada", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/29472785/",
    placeKey: "luxembourg" },
  { tripFolder: "2019-07-luxembourg", id: 34127880, slug: "luxembourg-neumunster-abbey",
    photographer: "Toufic Haddad", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/34127880/",
    placeKey: "luxembourg" },
  { tripFolder: "2019-07-luxembourg", id: 27659285, slug: "luxembourg-river-abbey-panorama",
    photographer: "Mehmet Hardal", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/27659285/",
    placeKey: "luxembourg" },

  // 4. 2020-02-denmark
  { tripFolder: "2020-02-denmark", id: 13274317, slug: "horsens-aerial-cityscape-winter",
    photographer: "Gabriel Moshu", photographerUrl: "https://www.pexels.com/@gabriel-moshu-296476472/",
    pageUrl: "https://www.pexels.com/photo/13274317/",
    placeKey: "horsens" },
  { tripFolder: "2020-02-denmark", id: 35287333, slug: "horsens-snow-covered-aerial",
    photographer: "Filia Mariss", photographerUrl: "https://www.pexels.com/@filiamariss/",
    pageUrl: "https://www.pexels.com/photo/35287333/",
    placeKey: "horsens" },
  { tripFolder: "2020-02-denmark", id: 14551738, slug: "horsens-snow-town-river",
    photographer: "Efrem Efre", photographerUrl: "https://www.pexels.com/@efrem-efre-2786187/",
    pageUrl: "https://www.pexels.com/photo/14551738/",
    placeKey: "horsens" },
  { tripFolder: "2020-02-denmark", id: 30748022, slug: "horsens-snow-rooftops",
    photographer: "Jakob Andersson", photographerUrl: "https://www.pexels.com/@jakobandersson/",
    pageUrl: "https://www.pexels.com/photo/30748022/",
    placeKey: "horsens" },
  { tripFolder: "2020-02-denmark", id: 35301741, slug: "horsens-snowy-harbour",
    photographer: "Ayco World", photographerUrl: "https://www.pexels.com/@ayco-world-108848112/",
    pageUrl: "https://www.pexels.com/photo/35301741/",
    placeKey: "horsens" },

  // 5. 2022-08-denmark
  { tripFolder: "2022-08-denmark", id: 12323479, slug: "skagen-dunes-church",
    photographer: "op23", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/12323479/",
    placeKey: "skagen" },
  { tripFolder: "2022-08-denmark", id: 26771998, slug: "romo-beach-dunes",
    photographer: "Wolfgang Weiser", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/26771998/",
    placeKey: "romo" },
  { tripFolder: "2022-08-denmark", id: 26600775, slug: "skagen-lighthouse-sunset",
    photographer: "suju", photographerUrl: "https://www.pexels.com/",
    pageUrl: "https://www.pexels.com/photo/26600775/",
    placeKey: "skagen" },
  { tripFolder: "2022-08-denmark", id: 33830439, slug: "hirtshals-lighthouse-flag",
    photographer: "Tommes Frites", photographerUrl: "https://www.pexels.com/@tommes-frites/",
    pageUrl: "https://www.pexels.com/photo/33830439/",
    placeKey: "hirtshals" },
  { tripFolder: "2022-08-denmark", id: 18134307, slug: "samso-coastline",
    photographer: "Tha Dah Baw", photographerUrl: "https://www.pexels.com/@tha-dah-baw/",
    pageUrl: "https://www.pexels.com/photo/18134307/",
    placeKey: "samso" },

  // 6. 2022-12-romania
  { tripFolder: "2022-12-romania", id: 953626, slug: "bucharest-snow-street-bicycle",
    photographer: "Dave Haas", photographerUrl: "https://www.pexels.com/@dave-haas-347675/",
    pageUrl: "https://www.pexels.com/photo/953626/",
    placeKey: "bucharest" },
  { tripFolder: "2022-12-romania", id: 36210381, slug: "bucharest-snow-palace-trees",
    photographer: "Olaru Dragosh", photographerUrl: "https://www.pexels.com/@olaru-dragosh-328310951/",
    pageUrl: "https://www.pexels.com/photo/36210381/",
    placeKey: "bucharest" },
  { tripFolder: "2022-12-romania", id: 11431969, slug: "bucharest-snowy-evening-street",
    photographer: "lukez0r", photographerUrl: "https://www.pexels.com/@lukez0r/",
    pageUrl: "https://www.pexels.com/photo/11431969/",
    placeKey: "bucharest" },
  { tripFolder: "2022-12-romania", id: 19448896, slug: "bucharest-christmas-market-aerial",
    photographer: "vlasceanu", photographerUrl: "https://www.pexels.com/@vlasceanu/",
    pageUrl: "https://www.pexels.com/photo/19448896/",
    placeKey: "bucharest" },
  { tripFolder: "2022-12-romania", id: 11016776, slug: "bucharest-parliament-day",
    photographer: "Ana-Maria Antonenco", photographerUrl: "https://www.pexels.com/@ana-maria-antonenco-78158389/",
    pageUrl: "https://www.pexels.com/photo/11016776/",
    placeKey: "bucharest" },

  // 7. 2023-04-italy
  { tripFolder: "2023-04-italy", id: 36665795, slug: "milan-magnolia-historic-building",
    photographer: "Tommaso", photographerUrl: "https://www.pexels.com/@tommaso/",
    pageUrl: "https://www.pexels.com/photo/36665795/",
    placeKey: "milan" },
  { tripFolder: "2023-04-italy", id: 36781363, slug: "milan-aerial-alps-backdrop",
    photographer: "Earth Photart", photographerUrl: "https://www.pexels.com/@earth-photart/",
    pageUrl: "https://www.pexels.com/photo/36781363/",
    placeKey: "milan" },
  { tripFolder: "2023-04-italy", id: 31178835, slug: "milan-duomo-sunset-birds",
    photographer: "OnTheCrow", photographerUrl: "https://www.pexels.com/@onthecrow/",
    pageUrl: "https://www.pexels.com/photo/31178835/",
    placeKey: "milan" },
  { tripFolder: "2023-04-italy", id: 33695864, slug: "milan-duomo-blue-sky",
    photographer: "Mihaela Claudia Puscas", photographerUrl: "https://www.pexels.com/@mihaela-claudia-puscas/",
    pageUrl: "https://www.pexels.com/photo/33695864/",
    placeKey: "milan" },
  { tripFolder: "2023-04-italy", id: 36665793, slug: "milan-victorian-magnolia",
    photographer: "Tommaso", photographerUrl: "https://www.pexels.com/@tommaso/",
    pageUrl: "https://www.pexels.com/photo/36665793/",
    placeKey: "milan" },

  // 8. 2023-07-turkey
  { tripFolder: "2023-07-turkey", id: 33522090, slug: "istanbul-blue-mosque-ferries",
    photographer: "Smuldur", photographerUrl: "https://www.pexels.com/@smuldur/",
    pageUrl: "https://www.pexels.com/photo/33522090/",
    placeKey: "istanbul" },
  { tripFolder: "2023-07-turkey", id: 8071157, slug: "istanbul-blue-mosque-aerial",
    photographer: "Yunustug", photographerUrl: "https://www.pexels.com/@yunustug/",
    pageUrl: "https://www.pexels.com/photo/8071157/",
    placeKey: "istanbul" },
  { tripFolder: "2023-07-turkey", id: 28601269, slug: "istanbul-hagia-sophia-aerial",
    photographer: "Ninetysevenyears", photographerUrl: "https://www.pexels.com/@ninetysevenyears/",
    pageUrl: "https://www.pexels.com/photo/28601269/",
    placeKey: "istanbul" },
  { tripFolder: "2023-07-turkey", id: 33702999, slug: "istanbul-bosphorus-summer-day",
    photographer: "Muzin Kahraman", photographerUrl: "https://www.pexels.com/@muzin-kahraman-789215623/",
    pageUrl: "https://www.pexels.com/photo/33702999/",
    placeKey: "istanbul" },
  { tripFolder: "2023-07-turkey", id: 35016386, slug: "istanbul-maidens-tower-sunset",
    photographer: "Hobiphotography", photographerUrl: "https://www.pexels.com/@hobiphotography/",
    pageUrl: "https://www.pexels.com/photo/35016386/",
    placeKey: "istanbul" },

  // 9. 2025-03-romania
  { tripFolder: "2025-03-romania", id: 12623889, slug: "bucharest-athenaeum-front",
    photographer: "Cosmin Chiwu", photographerUrl: "https://www.pexels.com/@cosmin-chiwu/",
    pageUrl: "https://www.pexels.com/photo/12623889/",
    placeKey: "bucharest" },
  { tripFolder: "2025-03-romania", id: 17613733, slug: "bucharest-athenaeum-detail",
    photographer: "Ana-Maria Antonenco", photographerUrl: "https://www.pexels.com/@ana-maria-antonenco-78158389/",
    pageUrl: "https://www.pexels.com/photo/17613733/",
    placeKey: "bucharest" },
  { tripFolder: "2025-03-romania", id: 36895898, slug: "bucharest-athenaeum-stone-frame",
    photographer: "Photographisa RO", photographerUrl: "https://www.pexels.com/@photographisa-ro/",
    pageUrl: "https://www.pexels.com/photo/36895898/",
    placeKey: "bucharest" },
  { tripFolder: "2025-03-romania", id: 27334027, slug: "bucharest-parliament-facade-detail",
    photographer: "Jakub Zerdzicki", photographerUrl: "https://www.pexels.com/@jakub-zerdzicki/",
    pageUrl: "https://www.pexels.com/photo/27334027/",
    placeKey: "bucharest" },
  { tripFolder: "2025-03-romania", id: 36683133, slug: "bucharest-blossoms-historic-building",
    photographer: "Liza Sigareva", photographerUrl: "https://www.pexels.com/@liza-sigareva/",
    pageUrl: "https://www.pexels.com/photo/36683133/",
    placeKey: "bucharest" },
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
  // Pexels CDN — long-edge ≤1920 via auto-compress params (per task spec).
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
  // sharp re-encode: long edge ≤1920, progressive JPEG q=85 mozjpeg, strip metadata.
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

console.log(`\nDownloads: ${results.length} processed (${results.filter((r) => r.skipped).length} skipped existing), ${failures.length} failures.`);

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
  const takenAt = TRIP_MIDPOINT[r.pick.tripFolder];
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
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${newEntries.length} catalogue entries.`);

// ---------- Append rows to docs/photo-attributions.md ----------
const attribPath = join(repoRoot, "docs", "photo-attributions.md");
const attribRaw = readFileSync(attribPath, "utf8");

// Locate the table — split into header (everything up to and including last
// existing data row) and footer (License terms + total). We append the new
// rows right before the blank line separating the table from "## License terms".
const lines = attribRaw.split("\n");
let licenseHeaderIdx = lines.findIndex((l) => l.startsWith("## License terms"));
if (licenseHeaderIdx === -1) {
  throw new Error("Could not find '## License terms' anchor in photo-attributions.md");
}

// Walk back to find the last `|` table row (ignoring blank lines).
let lastRowIdx = licenseHeaderIdx - 1;
while (lastRowIdx > 0 && !lines[lastRowIdx].startsWith("|")) lastRowIdx--;

const newRows = [];
const sortedResults = [...results].sort((a, b) => a.rel.localeCompare(b.rel));
for (const r of sortedResults) {
  newRows.push(
    `| \`public/photos/${r.rel}\` | ${PLACES[r.pick.placeKey].place.display} | [${r.pick.photographer}](${r.pick.photographerUrl}) | Pexels | [link](${r.pick.pageUrl}) |`,
  );
}

// Update "Total stock photos" line if present (last non-blank line of file).
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

// ---------- Persist results manifest ----------
const manifestPath = join(__dirname, "apply-pexels-results.json");
writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      results: results.map((r) => ({ rel: r.rel, bytes: r.bytes, skipped: r.skipped ?? false, id: r.pick.id, tripFolder: r.pick.tripFolder })),
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
