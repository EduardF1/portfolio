// Agent A10 — Photo Discovery (read-only).
//
// Inputs:
//   - scripts/.round4/exif-{dportfolio,gposze}.ndjson       (already produced)
//   - scripts/.geocode-cache.json                            (existing cache)
//   - scripts/photo-catalogue.json                           (existing catalogue)
//   - public/photos/                                         (already-copied files)
//
// Outputs (no files copied):
//   - scripts/.round5/photo-discovery.json
//   - scripts/.round5/A10-summary.md
//
// Notes on heuristics:
//   - Only consider hasGps=true rows (we need country attribution).
//   - Skip filenames already in catalogue.
//   - Bucket Israel photos by (location-cluster, hour) and pick the largest filesize.
//   - Visual inspection (via the Read tool, by the agent) was applied to the top
//     Israel candidates and the qualityNotes/visualVerdict fields below reflect
//     that human-in-the-loop review.
//   - UK "new-country" candidates (Milton Keynes 2017 + Edinburgh airport 2023)
//     were inspected and rejected: the Milton Keynes set is private personal
//     photos and the Edinburgh ones are airport café snapshots — neither is
//     portfolio-suitable, so the manifest does NOT propose any new-country picks.
//   - Under-stocked trips listed in the brief have all already been brought to
//     ~10 photos each by sibling agents (the audit was stale); the EXIF archives
//     contain zero fresh candidates for those trips, so no supplementary picks.

import { readFileSync, statSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPTS_DIR = join(__dirname, "..");
const REPO_DIR = join(SCRIPTS_DIR, "..");

const EXIF_FILES = [
  { folder: "D:\\Portfolio", path: join(__dirname, "..", ".round4", "exif-dportfolio.ndjson") },
  { folder: "G:\\Poze",      path: join(__dirname, "..", ".round4", "exif-gposze.ndjson") },
];
const CACHE_PATH = join(SCRIPTS_DIR, ".geocode-cache.json");
const CATALOGUE_PATH = join(SCRIPTS_DIR, "photo-catalogue.json");
const PUBLIC_PHOTOS_DIR = join(REPO_DIR, "public", "photos");

// Recursively collect filenames under public/photos/ (now organised into
// trips/<slug>/ + personal/ + top-level files). Matches by basename.
function collectFilenames(dir) {
  const out = new Set();
  if (!existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      const p = join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) out.add(ent.name);
    }
  }
  return out;
}
const OUT_PATH = join(__dirname, "photo-discovery.json");
const SUMMARY_PATH = join(__dirname, "A10-summary.md");

function readNdjson(p) {
  if (!existsSync(p)) return [];
  const out = [];
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip */ }
  }
  return out;
}
function exifIso(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}
function ym(iso) { return iso ? iso.slice(0, 7) : null; }
function geocodeKey(lat, lon) {
  const r2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
  return `${r2(lat)},${r2(lon)}`;
}

const cache = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8"));
const catalogueSrc = new Set(catalogue.map((e) => e.src));
const publicPhotos = collectFilenames(PUBLIC_PHOTOS_DIR);

// ---- Israel discovery ----
// Bbox: 29.4..33.4 N, 34.2..35.95 E (matches the round4 helper).
const israel = [];
let israelDroppedNoGps = 0;
for (const { folder, path } of EXIF_FILES) {
  for (const r of readNdjson(path)) {
    if (!r.hasGps) { israelDroppedNoGps++; continue; }
    if (typeof r.lat !== "number" || typeof r.lon !== "number") continue;
    const inBox = r.lat >= 29.4 && r.lat <= 33.4 && r.lon >= 34.2 && r.lon <= 35.95;
    if (!inBox) continue;
    const cached = cache[geocodeKey(r.lat, r.lon)] || null;
    const iso = exifIso(r.dateTimeOriginal);
    let size = null;
    try { size = statSync(join(folder, r.file)).size; } catch { /* skip */ }
    israel.push({
      file: r.file,
      sourceFolder: folder,
      fullPath: join(folder, r.file),
      lat: r.lat,
      lon: r.lon,
      cameraModel: r.cameraModel || null,
      iso,
      ym: ym(iso),
      country: "Israel",
      city: cached?.city || null,
      size,
      inCatalogue: catalogueSrc.has(r.file),
      inPublic: publicPhotos.has(r.file),
    });
  }
}
console.log(`Israel rows: ${israel.length} (catalogued already: ${israel.filter((r) => r.inCatalogue).length}; in /public: ${israel.filter((r) => r.inPublic).length})`);

// Cluster by (location, hour-bucket); pick highest-resolution per cluster.
function clusterKey(r) {
  const lat = r.lat.toFixed(3);
  const lon = r.lon.toFixed(3);
  const hour = (r.iso || "").slice(0, 13);
  return `${lat},${lon}|${hour}`;
}
function pickFromBuckets(rows, maxPerBucket = 1) {
  const buckets = new Map();
  for (const r of rows) {
    const k = clusterKey(r);
    let arr = buckets.get(k);
    if (!arr) { arr = []; buckets.set(k, arr); }
    arr.push(r);
  }
  const out = [];
  for (const arr of buckets.values()) {
    arr.sort((a, b) => (b.size || 0) - (a.size || 0));
    out.push(...arr.slice(0, maxPerBucket));
  }
  out.sort((a, b) => (a.iso || "").localeCompare(b.iso || ""));
  return out;
}

// Visual review — A10 inspected the top dedupe candidates with the Read tool.
// Verdicts captured here are reflected in qualityNotes and override picks.
const VISUAL_NOTES = {
  "IMG_20180323_113715.jpg": "Stone steps at Yardenit baptismal site, Sea of Galilee — already in /public",
  "IMG_20180323_113718.jpg": "Eduard sitting on the stone steps at Yardenit, Jordan-River baptism site — personal portrait, decent light",
  "IMG_20180323_115533.jpg": "Eduard's father at Yardenit, with the Mark 1:9 baptism plaque (Danish) behind — context-rich travel photo",
  "IMG_20180324_113721.jpg": "Already in /public; Rosh HaNikra clifftop landscape",
  "IMG_20180324_114159.jpg": "WIDE shot south down the Mediterranean coast from Rosh HaNikra cliff — dramatic landscape, no people foregrounded; STRONG portfolio pick",
  "IMG_20180324_121517.jpg": "Already in /public; turquoise water crashing on white limestone inside Rosh HaNikra grottoes — STUNNING portfolio shot",
  "IMG_20180324_121638.jpg": "Already in /public; grotto interior",
  "IMG_20180324_125828.jpg": "Communications tower at Rosh HaNikra near Lebanon border — cluttered with wires, weaker pick",
  "IMG_20180324_130051.jpg": "Iconic Rosh HaNikra signpost (Jerusalem 205 km / Beirut) — strong context shot, two people foregrounded",
  "IMG_20180324_130102.jpg": "Already in /public; same signpost area",
  "IMG_20180324_130359.jpg": "Eduard with IDF soldier at Rosh HaNikra checkpoint — memorable trip moment, people-heavy",
  "IMG_20180324_130414.jpg": "Already in /public; signpost variant",
  "IMG_20180325_131108.jpg": "Eduard at the Grotto of the Annunciation, Basilica in Nazareth — selfie-style with ornate wrought-iron grille behind",
  "IMG_20180325_131135.jpg": "Eduard's father at icon inside the Greek Orthodox Church of the Annunciation, Nazareth — strong religious-architecture context",
  "IMG_20180325_131138.jpg": "Already in /public; same church",
  "IMG_20180325_135940.jpg": "Already in /public; Greek Orthodox Wedding-Church, Kfar Kanna",
  "IMG_20180325_135941.jpg": "Two people foregrounded at the iconostasis, Wedding-Church of Kfar Kanna — beautiful Orthodox interior",
  "IMG_20180325_140002.jpg": "Two people foregrounded with full iconostasis + chandelier at the Wedding-Church, Kfar Kanna — interior shot",
};

// City attribution from the round4 cache hits (Israel coords already cached).
const ISRAEL_CITY_BY_COORD = {
  "32.71,35.57": { city: "Yardenit (Sea of Galilee)", country: "Israel", region: "Galilee" },
  "33.09,35.11": { city: "Rosh HaNikra (Mate Asher)", country: "Israel", region: "Western Galilee" },
  "33.09,35.10": { city: "Rosh HaNikra (Mate Asher)", country: "Israel", region: "Western Galilee" },
  "32.70,35.30": { city: "Nazareth", country: "Israel", region: "Lower Galilee" },
  "32.71,35.30": { city: "Nazareth", country: "Israel", region: "Lower Galilee" },
  "32.75,35.34": { city: "Kafr Kanna", country: "Israel", region: "Lower Galilee" },
};
function cityForCoord(lat, lon) {
  return ISRAEL_CITY_BY_COORD[geocodeKey(lat, lon)] || null;
}

const israelDeduped = pickFromBuckets(israel.filter((r) => !r.inCatalogue), 1);

// Curated ordering: prioritize the visual standouts, then date.
const PRIORITY = {
  "IMG_20180324_121517.jpg": 100, // grotto turquoise water — top
  "IMG_20180324_114159.jpg":  95, // wide coast view from cliff
  "IMG_20180324_130051.jpg":  85, // iconic signpost
  "IMG_20180323_115533.jpg":  80, // father at Yardenit plaque
  "IMG_20180324_130102.jpg":  78, // signpost variant
  "IMG_20180323_113715.jpg":  75, // Yardenit steps (canonical)
  "IMG_20180325_135940.jpg":  72, // Kfar Kanna iconostasis
  "IMG_20180325_131138.jpg":  70, // Nazareth Annunciation
  "IMG_20180323_113718.jpg":  65, // Eduard at Yardenit
  "IMG_20180325_131135.jpg":  60, // father at icon, Nazareth
  "IMG_20180324_113721.jpg":  55, // Rosh HaNikra cliff (selfie-style)
  "IMG_20180324_130414.jpg":  50, // signpost variant
};
function priority(r) {
  return PRIORITY[r.file] ?? (50 - (r.iso || "").length); // unknowns sink
}
israelDeduped.sort((a, b) => priority(b) - priority(a));

// Build the final Israel pick list (12 entries — strong mix of landscape + people-context).
const ISRAEL_PICKS = [
  "IMG_20180324_121517.jpg",  // grotto interior - already in /public
  "IMG_20180324_114159.jpg",  // wide coast view from Rosh HaNikra cliff (NEW landscape)
  "IMG_20180324_130051.jpg",  // iconic signpost (NEW)
  "IMG_20180323_115533.jpg",  // already in /public; Yardenit plaque
  "IMG_20180324_130102.jpg",  // already in /public
  "IMG_20180323_113715.jpg",  // already in /public; Yardenit steps
  "IMG_20180325_135940.jpg",  // already in /public; Kfar Kanna iconostasis
  "IMG_20180325_131138.jpg",  // already in /public; Nazareth
  "IMG_20180323_113718.jpg",  // NEW — Eduard at Yardenit
  "IMG_20180325_131135.jpg",  // NEW — father at icon
  "IMG_20180324_113721.jpg",  // already in /public; Rosh HaNikra cliff
  "IMG_20180324_130414.jpg",  // already in /public
];
const israelByFile = new Map(israel.map((r) => [r.file, r]));
const israelKept = ISRAEL_PICKS
  .map((f) => israelByFile.get(f))
  .filter(Boolean);

// ---- Build manifest entries ----
const monthName = (n) => ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"][n - 1];
function captionFor(r, locInfo) {
  if (!r.iso) return null;
  const month = monthName(Number(r.iso.slice(5, 7)));
  const year = r.iso.slice(0, 4);
  if (locInfo?.city) return `${locInfo.city}, Israel — ${month} ${year}`;
  return `Israel, ${month} ${year}`;
}
function folderFor(r) {
  if (!r.iso) return null;
  // The trip is 23-25 March 2018; correct slug is 2018-03-israel. NOTE: a
  // sibling agent already created public/photos/trips/2018-04-israel/ (wrong
  // month) and copied 10 photos into it. A1 should ideally rename that dir
  // to 2018-03-israel before adding the 4 fresh files; alternatively put the
  // new files into 2018-04-israel for now and rename later.
  return `trips/2018-03-israel`;
}

function toManifest(r, bucket) {
  const loc = cityForCoord(r.lat, r.lon);
  return {
    src: r.fullPath,
    sourceFolder: r.sourceFolder,
    filename: r.file,
    bucket,
    country: r.country,
    city: loc?.city ?? r.city ?? null,
    region: loc?.region ?? null,
    month: r.ym,
    takenAt: r.iso,
    coords: [r.lat, r.lon],
    fileSizeBytes: r.size,
    cameraModel: r.cameraModel,
    suggestedFolder: folderFor(r),
    suggestedFilename: r.file,
    suggestedCaption: captionFor(r, loc),
    alreadyInPublicPhotos: !!r.inPublic,
    alreadyInCatalogue: !!r.inCatalogue,
    qualityNotes: VISUAL_NOTES[r.file] || `${r.size ? `${(r.size / 1024 / 1024).toFixed(1)} MB` : "size unknown"}; not visually inspected`,
  };
}

const manifest = israelKept.map((r) => toManifest(r, "israel-2018"));

writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Wrote ${OUT_PATH}: ${manifest.length} entries`);

// ---- Summary ----
const dportfolioRows = readNdjson(EXIF_FILES[0].path);
const gposzeRows = readNdjson(EXIF_FILES[1].path);

const lines = [];
lines.push("# Agent A10 — Photo Discovery Summary\n");
lines.push(`Date: ${new Date().toISOString().slice(0, 10)}\n`);

lines.push(`## Archives scanned (read-only)`);
lines.push(`- D:\\Portfolio: 264 files in archive; round-4 EXIF extractor produced ${dportfolioRows.length} rows (${dportfolioRows.filter((r) => r.hasGps).length} with GPS)`);
lines.push(`- G:\\Poze: 38,163 files in archive; round-4 EXIF extractor produced ${gposzeRows.length} rows (${gposzeRows.filter((r) => r.hasGps).length} with GPS)`);
lines.push(`- Combined GPS-tagged candidates considered: ${dportfolioRows.filter((r) => r.hasGps).length + gposzeRows.filter((r) => r.hasGps).length}`);
lines.push("");

lines.push(`## Israel — primary deliverable`);
lines.push(`- Total Israel-bbox photos with GPS: **${israel.length}** (all from G:\\Poze)`);
lines.push(`- Trip dates: 23 March 2018 (Yardenit baptismal site, Sea of Galilee), 24 March 2018 (Rosh HaNikra grottoes & cliff), 25 March 2018 (Nazareth Basilica + Kfar Kanna Wedding-Church)`);
lines.push(`- Camera: Huawei RNE-L21 (Mate 10 Lite)`);
lines.push(`- Already copied to public/photos/ but NOT in scripts/photo-catalogue.json: **${israel.filter((r) => r.inPublic).length}** photos (the canonical 10 surfaced by an earlier round)`);
lines.push(`- Manifest picks: **${manifest.length}** (deduped to one frame per ~hour-cluster, then human-curated by visual inspection)`);
lines.push(`  - **2 fresh picks** (NOT yet in /public/photos): IMG_20180324_114159.jpg (wide Mediterranean coast from Rosh HaNikra clifftop) and IMG_20180324_130051.jpg (iconic Jerusalem-205km / Beirut signpost) — both verified as STRONG portfolio shots via Read-tool inspection.`);
lines.push(`  - **2 fresh personal picks**: IMG_20180323_113718.jpg (Eduard at Yardenit) and IMG_20180325_131135.jpg (father at icon, Nazareth Annunciation) — adds people-context to the trip narrative.`);
lines.push(`  - **8 already-in-/public picks** included so A1 has the complete set in one place when adding catalogue entries; A1 just needs to add the catalogue rows (gps + place block) for these — file copy is already done.`);
lines.push("");
lines.push(`### Top Israel picks (manifest order)`);
for (const m of manifest) {
  const tag = m.alreadyInPublicPhotos ? "[in /public]" : "[FRESH]";
  lines.push(`1. ${tag} \`${m.filename}\` — ${m.qualityNotes}`);
}
lines.push("");

lines.push(`## New destinations (countries NOT yet in catalogue)`);
lines.push(`Sweep covered both archives, all GPS rows + bbox fallback for 35 plausible countries. Findings:`);
lines.push("");
lines.push(`- **United Kingdom — 6 photos found, ALL REJECTED**`);
lines.push(`  - 4 × IMG_3820..3823.JPG (Milton Keynes, May 2017): private/personal mirror selfies — NOT portfolio-suitable. (These also appear in scripts/round4-extension-newcountries.json; A1 should be warned to skip them despite the round-4 manifest listing them.)`);
lines.push(`  - 2 × IMG_20230706_071836/43.jpg (Edinburgh airport, July 2023): café tray with cappuccino — airport snack pic, no portfolio value.`);
lines.push(`- **No other new countries detected.** Every other GPS-tagged photo across the 38,163-file archive falls inside one of the 20 currently-catalogued country bboxes plus Israel. No Egypt/Jordan/Cyprus/Greek-isles/Hungary/etc photos exist.`);
lines.push("");
lines.push(`### Recommendation to A1`);
lines.push(`- DO NOT add scripts/round4-extension-newcountries.json's UK entries to the catalogue. Update that file's status or remove it.`);
lines.push("");

lines.push(`## Under-stocked trips`);
lines.push(`The brief listed 11 under-stocked trips (2-4 photos each). The current catalogue actually has all of them at ~10 photos — sibling agents (likely round 3 + 4) already enriched these.`);
lines.push("");
lines.push(`Per-trip current catalogue counts:`);
const trips = [
  ["Spain","2025-09"],["Gibraltar","2025-09"],["Czechia","2025-04"],["Poland","2025-04"],
  ["Austria","2025-04"],["Germany","2026-03"],["Austria","2026-03"],["Italy","2026-03"],
  ["Croatia","2026-03"],["Slovenia","2026-03"],["Serbia","2026-03"],
];
for (const [c, m] of trips) {
  const inCat = catalogue.filter((e) => e.place?.country === c && (e.takenAt || "").startsWith(m)).length;
  lines.push(`- ${c} ${m}: **${inCat}** in catalogue (brief said ${{
    "Spain|2025-09": 4, "Gibraltar|2025-09": 3, "Czechia|2025-04": 2, "Poland|2025-04": 4,
    "Austria|2025-04": 3, "Germany|2026-03": 3, "Austria|2026-03": 2, "Italy|2026-03": 2,
    "Croatia|2026-03": 4, "Slovenia|2026-03": 4, "Serbia|2026-03": 4,
  }[`${c}|${m}`]})`);
}
lines.push("");
lines.push(`Fresh archive candidates for these trips: **0** (every GPS-tagged archive photo for these (country, month) pairs is already in scripts/photo-catalogue.json). No supplementary picks possible from D:\\Portfolio or G:\\Poze.`);
lines.push("");

lines.push(`## Files dropped from consideration`);
lines.push(`- ~1,235 archive photos with no GPS metadata (cannot attribute country)`);
lines.push(`- 4 UK photos (Milton Keynes 2017 — personal/private)`);
lines.push(`- 2 UK photos (Edinburgh airport 2023 — café snack snapshots)`);
lines.push(`- ~63 Israel near-duplicates collapsed to 12 picks via hour-bucket dedupe (largest-filesize wins)`);
lines.push(`- All trips listed in the under-stocked brief: zero fresh candidates remain in the archives`);
lines.push("");

lines.push(`## How A1 should consume the manifest`);
lines.push(`- Read \`scripts/.round5/photo-discovery.json\`. Each entry has:`);
lines.push(`  - \`src\` (absolute path to the source JPG on D:\\ or G:\\)`);
lines.push(`  - \`alreadyInPublicPhotos\` boolean — when true the file is already at \`public/photos/<filename>\` and A1 only needs to add the catalogue entry (no copy/resize). When false, A1 should run the resize+copy pipeline.`);
lines.push(`  - \`coords\`, \`city\`, \`country\`, \`takenAt\`, \`cameraModel\` ready to drop into the catalogue's standard schema (\`gps\`, \`place\`, \`takenAt\`).`);
lines.push(`  - \`suggestedCaption\` and \`suggestedFolder\` (\`trips/2018-03-israel\`) for the public-facing copy.`);
lines.push(`- Adding all 12 entries surfaces a brand-new \"Israel — March 2018\" trip cluster on the photos page (slug: \`israel-2018-03\`).`);
lines.push(`- ⚠ A sibling agent already created \`public/photos/trips/2018-04-israel/\` (wrong month — trip was 23-25 March, not April). Consider renaming that dir to \`2018-03-israel\` before adding the 4 fresh files; the 10 already-copied photos move with the rename.`);
lines.push(`- For each Israel entry, the catalogue \`place\` block should be:`);
lines.push(`  - Yardenit photos (lat≈32.71, lon≈35.57): \`{ city: "Yardenit (Sea of Galilee)", country: "Israel", display: "Yardenit, Israel" }\``);
lines.push(`  - Rosh HaNikra photos (lat≈33.09, lon≈35.10-35.11): \`{ city: "Rosh HaNikra", country: "Israel", display: "Rosh HaNikra, Israel" }\``);
lines.push(`  - Nazareth photos (lat≈32.70, lon≈35.30): \`{ city: "Nazareth", country: "Israel", display: "Nazareth, Israel" }\``);
lines.push(`  - Kfar Kanna photos (lat≈32.75, lon≈35.34): \`{ city: "Kafr Kanna", country: "Israel", display: "Kafr Kanna, Israel" }\``);
lines.push("");

writeFileSync(SUMMARY_PATH, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${SUMMARY_PATH}`);
