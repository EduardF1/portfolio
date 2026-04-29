// Wider-window thin-trip backfill scanner.
//
// For every trip slug in scripts/photo-catalogue.json with < 6 entries:
//   - date window = trip date min/max ± 30 days
//   - GPS bbox    = trip GPS centroid ± 3° (or country bbox fallback)
//
// Source pool: every JPG under G:\Photos\<year>\ (recursively, including the
// trip cluster folders like `2019\Belgium 19 (07)\`) plus G:\Photos\Poze Huawei\.
// Skips: .duplicates, .review-for-delete, Screenshots, WhatsApp-by-year and
// any P13/sensitive folder names.
//
// Reads EXIF via exiftool (-j, recursive). Filters candidates whose
// DateTimeOriginal + GPSLatitude/Longitude fall inside any thin-trip window.
//
// Writes scripts/.thin-trip-wider-shortlist.json — a {slug: [...candidates]}
// payload that scripts/thin-trip-detect.py can consume directly.
//
// READ-ONLY on G:\.
//
// Usage:
//   node scripts/thin-trip-wider-scan.mjs                           # scan + shortlist
//   node scripts/thin-trip-wider-scan.mjs --max-per-trip 25         # cap per slug

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATALOGUE_PATH = join(__dirname, "photo-catalogue.json");
const SHORTLIST_PATH = join(__dirname, ".thin-trip-wider-shortlist.json");
const EXIF_NDJSON = join(__dirname, ".thin-trip-wider-exif.ndjson");
const SCAN_TARGETS = [
  "G:\\Photos\\2016",
  "G:\\Photos\\2017",
  "G:\\Photos\\2018",
  "G:\\Photos\\2019",
  "G:\\Photos\\2020",
  "G:\\Photos\\2021",
  "G:\\Photos\\2022",
  "G:\\Photos\\2023",
  "G:\\Photos\\2024",
  "G:\\Photos\\2025",
  "G:\\Photos\\2026",
  "G:\\Photos\\Poze Huawei",
];
const EXCLUDE_DIR_NAMES = [
  "Screenshots",
  "WhatsApp-by-year",
  ".duplicates",
  ".review-for-delete",
  "P13",
  "sensitive",
];

// Country bbox fallback per slug (for trips with no GPS or sparse GPS).
// Each entry: { south, north, west, east }.
const COUNTRY_BBOX = {
  Albania: { south: 39.6, north: 42.7, west: 19.3, east: 21.1 },
  Belgium: { south: 49.4, north: 51.6, west: 2.5, east: 6.5 },
  Czechia: { south: 48.5, north: 51.1, west: 12.0, east: 19.0 },
  Denmark: { south: 54.5, north: 57.8, west: 8.0, east: 15.5 },
  Finland: { south: 59.5, north: 70.1, west: 19.0, east: 32.0 },
  Germany: { south: 47.2, north: 55.1, west: 5.8, east: 15.1 },
  Gibraltar: { south: 36.0, north: 36.2, west: -5.4, east: -5.3 },
  Greece: { south: 34.8, north: 41.8, west: 19.3, east: 28.2 },
  Israel: { south: 29.4, north: 33.4, west: 34.2, east: 35.9 },
  Italy: { south: 35.4, north: 47.1, west: 6.6, east: 18.6 },
  Luxembourg: { south: 49.4, north: 50.2, west: 5.7, east: 6.6 },
  Poland: { south: 49.0, north: 54.9, west: 14.1, east: 24.2 },
  Romania: { south: 43.6, north: 48.3, west: 20.2, east: 29.7 },
  Slovakia: { south: 47.7, north: 49.6, west: 16.8, east: 22.6 },
  Slovenia: { south: 45.4, north: 46.9, west: 13.4, east: 16.6 },
  Spain: { south: 36.0, north: 43.8, west: -9.4, east: 4.3 },
  Sweden: { south: 55.3, north: 69.1, west: 11.0, east: 24.2 },
  Turkey: { south: 35.8, north: 42.1, west: 26.0, east: 44.8 },
  Austria: { south: 46.4, north: 49.0, west: 9.5, east: 17.2 },
  Croatia: { south: 42.4, north: 46.6, west: 13.5, east: 19.5 },
  Serbia: { south: 42.2, north: 46.2, west: 18.8, east: 23.0 },
};

// Map trip slug -> country names (last token after date). Belgium is direct.
function slugCountries(slug) {
  // Strip leading YYYY-MM-
  const tail = slug.replace(/^\d{4}-\d{2}-/, "");
  // Split by `-` and Title-Case
  const parts = tail.split("-");
  const norm = (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  const known = new Set([
    "albania", "belgium", "czechia", "denmark", "finland",
    "germany", "gibraltar", "greece", "israel", "italy",
    "luxembourg", "poland", "romania", "slovakia", "slovenia",
    "spain", "sweden", "turkey", "austria", "croatia", "serbia",
  ]);
  return parts.filter((p) => known.has(p.toLowerCase())).map(norm);
}

function exifDateToIso(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}Z`;
}

function addDaysISO(iso, days) {
  const t = new Date(iso).getTime() + days * 86400000;
  return new Date(t).toISOString();
}

function parseArgs(argv) {
  const opts = { maxPerTrip: 30, refresh: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max-per-trip") opts.maxPerTrip = Number(argv[++i]);
    else if (a === "--refresh") opts.refresh = true;
  }
  return opts;
}

function buildTripWindows(catalogue) {
  const trips = {};
  for (const e of catalogue) {
    const m = e.src.match(/^trips\/([^/]+)\//);
    if (!m) continue;
    const slug = m[1];
    if (!trips[slug]) trips[slug] = { count: 0, dates: [], gpss: [], srcs: new Set() };
    trips[slug].count++;
    if (e.takenAt) trips[slug].dates.push(e.takenAt);
    if (e.gps && typeof e.gps.lat === "number") trips[slug].gpss.push(e.gps);
    trips[slug].srcs.add(e.src);
  }
  // Build window per trip below the 5-photo floor.
  const result = {};
  for (const [slug, info] of Object.entries(trips)) {
    if (info.count >= 5) continue;
    if (info.dates.length === 0) continue;
    const sorted = info.dates.slice().sort();
    const dateMin = sorted[0];
    const dateMax = sorted[sorted.length - 1];
    const startISO = addDaysISO(dateMin, -30);
    const endISO = addDaysISO(dateMax, 30);

    let bbox = null;
    if (info.gpss.length > 0) {
      const lat = info.gpss.reduce((a, b) => a + b.lat, 0) / info.gpss.length;
      const lon = info.gpss.reduce((a, b) => a + b.lon, 0) / info.gpss.length;
      bbox = { south: lat - 3, north: lat + 3, west: lon - 3, east: lon + 3 };
    }
    // Fall back to country bbox(es).
    const countries = slugCountries(slug);
    const countryBoxes = countries.map((c) => COUNTRY_BBOX[c]).filter(Boolean);

    result[slug] = {
      have: info.count,
      gap: 5 - info.count,
      windowStart: startISO,
      windowEnd: endISO,
      bbox,
      countryBoxes,
      countries,
      cataloguedSrcs: [...info.srcs],
    };
  }
  return result;
}

function inBBox(lat, lon, bbox) {
  if (!bbox) return false;
  return lat >= bbox.south && lat <= bbox.north && lon >= bbox.west && lon <= bbox.east;
}

function runExifRecursive(target) {
  // exiftool -r: recurse. We exclude dirs by feeding multiple -i flags.
  // -ext jpg +jpeg
  // -j (json), -n (no formatted output), -fast2 to skip MakerNotes for speed.
  const args = [
    "-j",
    "-n",
    "-fast2",
    "-r",
    "-q",
    "-ext", "jpg",
    "-ext", "jpeg",
    "-DateTimeOriginal",
    "-GPSLatitude",
    "-GPSLongitude",
    "-Model",
  ];
  for (const ex of EXCLUDE_DIR_NAMES) {
    args.push("-i");
    args.push(ex);
  }
  args.push(target);
  // Run, but handle the case where output is too big for stdout buffering.
  const res = spawnSync("exiftool", args, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  return res.stdout || "[]";
}

function ensureExifDump() {
  if (existsSync(EXIF_NDJSON)) {
    console.log(`Reusing existing EXIF dump: ${EXIF_NDJSON}`);
    return;
  }
  console.log("Running exiftool over G:\\Photos\\... (this can take several minutes)");
  const out = [];
  for (const target of SCAN_TARGETS) {
    if (!existsSync(target)) {
      console.log(`  skip (missing): ${target}`);
      continue;
    }
    console.log(`  scanning ${target}`);
    const json = runExifRecursive(target);
    let arr;
    try {
      arr = JSON.parse(json);
    } catch (e) {
      console.log(`    parse-fail (${e.message}); fallback to streaming`);
      // Skip - move on.
      continue;
    }
    for (const row of arr) {
      out.push(row);
    }
    console.log(`    +${arr.length} entries (running total ${out.length})`);
  }
  writeFileSync(
    EXIF_NDJSON,
    out.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf8",
  );
  console.log(`Wrote ${out.length} EXIF rows to ${EXIF_NDJSON}`);
}

function loadExif() {
  const rows = [];
  for (const line of readFileSync(EXIF_NDJSON, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch {}
  }
  return rows;
}

function buildShortlist(opts) {
  const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8"));
  const tripWindows = buildTripWindows(catalogue);
  console.log(`\nThin trips needing backfill (count < 6):`);
  for (const [slug, w] of Object.entries(tripWindows)) {
    console.log(
      `  ${slug}: have ${w.have}, gap ${w.gap}, window ${w.windowStart.slice(0, 10)}..${w.windowEnd.slice(0, 10)}, bbox=${w.bbox ? "yes" : "country-fallback:" + w.countries.join("/")}`,
    );
  }

  // Build catalogued-basenames set (we dedupe by filename, since other trips
  // may have already imported a particular basename).
  const cataloguedBasenames = new Set();
  for (const e of catalogue) {
    const bn = e.src.split("/").pop();
    if (bn) cataloguedBasenames.add(bn.toLowerCase());
  }

  const rows = loadExif();
  console.log(`\nLoaded ${rows.length} EXIF rows.`);

  // Per-slug candidate buckets.
  const candidates = {};
  for (const slug of Object.keys(tripWindows)) candidates[slug] = [];

  let dropNoDate = 0, dropNoGps = 0, dropDupe = 0, dropNoMatch = 0;
  for (const r of rows) {
    const dto = r.DateTimeOriginal;
    if (!dto || typeof dto !== "string") { dropNoDate++; continue; }
    const iso = exifDateToIso(dto);
    if (!iso) { dropNoDate++; continue; }
    const lat = typeof r.GPSLatitude === "number" ? r.GPSLatitude : null;
    const lon = typeof r.GPSLongitude === "number" ? r.GPSLongitude : null;
    if (lat == null || lon == null) { dropNoGps++; continue; }

    const src = r.SourceFile;
    if (!src) continue;
    const basename = src.split(/[\\/]/).pop();
    if (cataloguedBasenames.has(basename.toLowerCase())) { dropDupe++; continue; }

    let matched = false;
    for (const [slug, w] of Object.entries(tripWindows)) {
      if (iso < w.windowStart || iso > w.windowEnd) continue;
      const inMain = w.bbox && inBBox(lat, lon, w.bbox);
      const inCountry = w.countryBoxes.some((b) => inBBox(lat, lon, b));
      if (!inMain && !inCountry) continue;
      candidates[slug].push({
        src: src.replaceAll("/", "\\"),
        file: basename,
        iso,
        lat,
        lon,
        cameraModel: r.Model || null,
      });
      matched = true;
    }
    if (!matched) dropNoMatch++;
  }

  console.log(`\nFilter stats:`);
  console.log(`  rows examined: ${rows.length}`);
  console.log(`  drop no-date:  ${dropNoDate}`);
  console.log(`  drop no-gps:   ${dropNoGps}`);
  console.log(`  drop dupe-bn:  ${dropDupe}`);
  console.log(`  drop no-match: ${dropNoMatch}`);

  // Per slug: dedupe near-time near-GPS, sort temporally, cap.
  const cleaned = {};
  for (const [slug, arr] of Object.entries(candidates)) {
    arr.sort((a, b) => a.iso.localeCompare(b.iso));
    const seen = new Set();
    const uniq = [];
    for (const c of arr) {
      const minute = c.iso.slice(0, 16); // 60s bucket
      const latKey = c.lat.toFixed(4);
      const lonKey = c.lon.toFixed(4);
      const k = `${minute}|${latKey}|${lonKey}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(c);
    }
    // Even spread
    const cap = Math.min(uniq.length, opts.maxPerTrip);
    if (uniq.length <= cap) {
      cleaned[slug] = uniq;
    } else {
      const step = (uniq.length - 1) / (cap - 1);
      const idxs = new Set();
      for (let i = 0; i < cap; i++) idxs.add(Math.round(i * step));
      cleaned[slug] = [...idxs].sort((a, b) => a - b).map((i) => uniq[i]);
    }
    console.log(`  ${slug}: ${arr.length} raw -> ${uniq.length} unique -> ${cleaned[slug].length} sampled`);
  }

  writeFileSync(SHORTLIST_PATH, JSON.stringify(cleaned, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${SHORTLIST_PATH}`);
}

const opts = parseArgs(process.argv.slice(2));
ensureExifDump();
buildShortlist(opts);
