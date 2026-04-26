// usage:
//   node scripts/build-photo-catalogue.mjs                       # dry-run, prints summary
//   node scripts/build-photo-catalogue.mjs --write               # refresh photo-catalogue.json
//   node scripts/build-photo-catalogue.mjs --folder 'D:\Portfolio' --write
//   node scripts/build-photo-catalogue.mjs --no-geocode --write  # skip Nominatim entirely
//
// For each *.jpg in the source folder, reads EXIF (DateTimeOriginal, GPS, Camera model) via
// the sibling PowerShell helper `extract-exif.ps1`. Photos with GPS are reverse-geocoded
// against OpenStreetMap Nominatim at ≤1 req/sec, with results cached on disk. The final
// catalogue is written to `scripts/photo-catalogue.json`.
//
// PowerShell is used purely to read EXIF GPS bytes — pure-Node JPEG parsing would work too,
// this just leans on the platform.
//
// Conventions match scripts/sync-gh-descriptions.mjs: top-level parseArgs, named exports
// for testability, process.cwd()-relative paths.
//
// Nominatim usage policy: send a real User-Agent, cap at 1 req/sec, cache results.
// https://operations.osmfoundation.org/policies/nominatim/

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_FOLDER = "D:\\Portfolio";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT = "EduardFischer.dev portfolio batch-geocoder/1.0";
const NOMINATIM_MIN_INTERVAL_MS = 1100; // 1 req/sec + 100ms safety

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Convert degrees-minutes-seconds rationals (numerator/denominator pairs) to a signed decimal.
 * @param {{ degNum: number, degDen: number, minNum: number, minDen: number, secNum: number, secDen: number, ref: "N"|"S"|"E"|"W"|string }} r
 * @returns {number}
 */
export function dmsToDecimal(r) {
  const safe = (n, d) => (d === 0 ? 0 : n / d);
  const deg = safe(r.degNum, r.degDen);
  const min = safe(r.minNum, r.minDen);
  const sec = safe(r.secNum, r.secDen);
  let dec = deg + min / 60 + sec / 3600;
  if (r.ref === "S" || r.ref === "W") dec = -dec;
  return dec;
}

/**
 * Round a decimal coordinate to 5 places (~1.1 m at the equator) for cache keys.
 * Cache hits remain stable across re-runs while still distinguishing actual locations.
 * @param {number} n
 */
export function roundCoord(n) {
  return Math.round(n * 1e5) / 1e5;
}

/**
 * Build a cache key from lat/lon, rounded to 2 decimal places (~1.1 km).
 * Nominatim with `zoom=10` returns city-level results, so two photos within ~1 km
 * always share the same place — sharing the cache key cuts API calls considerably.
 * @param {number} lat
 * @param {number} lon
 */
export function geocodeCacheKey(lat, lon) {
  const r2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
  return `${r2(lat)},${r2(lon)}`;
}

/**
 * Convert a Nominatim "reverse" response into a compact `{ city, country, display }`
 * shape suitable for captions. Falls back gracefully when fields are missing.
 * @param {any} body
 * @returns {{ city: string | null, country: string | null, display: string }}
 */
export function parseNominatimResponse(body) {
  if (!body || typeof body !== "object") {
    return { city: null, country: null, display: "Unknown location" };
  }
  const addr = body.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.municipality ||
    addr.suburb ||
    addr.county ||
    addr.state ||
    null;
  const country = addr.country || null;
  let display;
  if (city && country) display = `${city}, ${country}`;
  else if (country) display = country;
  else if (typeof body.display_name === "string" && body.display_name.length > 0) {
    // Trim Nominatim's verbose display_name to "first, last" — first part + country.
    const parts = body.display_name.split(",").map((s) => s.trim());
    if (parts.length >= 2) display = `${parts[0]}, ${parts[parts.length - 1]}`;
    else display = parts[0];
  } else {
    display = "Unknown location";
  }
  return { city, country, display };
}

/**
 * Convert "YYYY:MM:DD HH:MM:SS" (EXIF DateTimeOriginal) to ISO 8601 UTC.
 * EXIF dates are local time without zone; we tag them as Z because the catalogue
 * is consumed for display only. If precise zone matters, store both.
 * @param {string | null | undefined} s
 */
export function exifDateToIso(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}Z`;
}

/**
 * Build a final catalogue entry from raw EXIF + an optional geocoded place.
 * @param {{ file: string, hasGps: boolean, lat?: number | null, lon?: number | null, dateTimeOriginal?: string | null, cameraModel?: string | null }} exif
 * @param {{ city: string | null, country: string | null, display: string } | null} place
 */
export function buildCatalogueEntry(exif, place) {
  /** @type {any} */
  const entry = {
    src: exif.file,
    takenAt: exifDateToIso(exif.dateTimeOriginal),
    hasGps: Boolean(exif.hasGps),
  };
  if (exif.cameraModel) entry.cameraModel = exif.cameraModel;
  if (exif.hasGps && typeof exif.lat === "number" && typeof exif.lon === "number") {
    entry.gps = { lat: roundCoord(exif.lat), lon: roundCoord(exif.lon) };
    if (place) entry.place = place;
  }
  return entry;
}

/**
 * Parse process argv into a typed options object.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  /** @type {{ write: boolean, folder: string, geocode: boolean, limit: number, help?: boolean }} */
  const opts = {
    write: false,
    folder: DEFAULT_FOLDER,
    geocode: true,
    limit: Number.POSITIVE_INFINITY,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write") opts.write = true;
    else if (a === "--folder") opts.folder = argv[++i];
    else if (a === "--no-geocode") opts.geocode = false;
    else if (a === "--limit") {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (a === "-h" || a === "--help") {
      opts.help = true;
    }
  }
  return opts;
}

const HELP = `Usage:
  node scripts/build-photo-catalogue.mjs [--write] [--folder 'D:\\Portfolio'] [--no-geocode] [--limit N]

Without --write: dry-run. Reads EXIF, prints a summary (total / hasGps / countries),
does not touch photo-catalogue.json or the geocode cache.

With --write: refreshes scripts/photo-catalogue.json and scripts/.geocode-cache.json.
`;

// ---------------------------------------------------------------------------
// I/O glue
// ---------------------------------------------------------------------------

/**
 * Run the PowerShell EXIF extractor and parse its NDJSON output.
 * @param {string} folder
 * @returns {Array<any>}
 */
function readExifFromFolder(folder) {
  const psScript = join(__dirname, "extract-exif.ps1");
  const cachePath = join(__dirname, ".exif-raw.ndjson");
  /** @type {string} */
  let text;
  // Honour an existing cache (the PS sweep is slow on cold cache); refresh by deleting it.
  if (existsSync(cachePath)) {
    text = readFileSync(cachePath, "utf8");
  } else {
    const stdout = execFileSync(
      "pwsh",
      ["-NoProfile", "-File", psScript, "-Folder", folder],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    writeFileSync(cachePath, stdout, "utf8");
    text = stdout;
  }
  /** @type {Array<any>} */
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // Skip malformed lines silently — they show up as missing entries downstream.
    }
  }
  return out;
}

/**
 * Sleep helper for rate limiting.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reverse-geocode a single coord via Nominatim. Returns parsed place.
 * @param {number} lat
 * @param {number} lon
 */
async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Nominatim ${res.status} for ${lat},${lon}`);
  }
  const body = await res.json();
  return parseNominatimResponse(body);
}

/**
 * Drive the whole pipeline.
 * @param {ReturnType<typeof parseArgs>} opts
 */
async function run(opts) {
  const exifRows = readExifFromFolder(opts.folder);
  const cachePath = join(__dirname, ".geocode-cache.json");
  /** @type {Record<string, { city: string | null, country: string | null, display: string }>} */
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};

  const gpsRows = exifRows.filter((r) => r.hasGps && typeof r.lat === "number" && typeof r.lon === "number");
  const uniqueKeys = new Set(gpsRows.map((r) => geocodeCacheKey(r.lat, r.lon)));

  if (opts.geocode) {
    const toFetch = [...uniqueKeys].filter((k) => !cache[k]);
    if (toFetch.length > 0) {
      console.log(`Geocoding ${toFetch.length} unique coordinate(s) (cache hits: ${uniqueKeys.size - toFetch.length})…`);
    } else if (uniqueKeys.size > 0) {
      console.log(`Geocode cache covers all ${uniqueKeys.size} unique coordinate(s); skipping Nominatim.`);
    }
    let processed = 0;
    for (const key of toFetch) {
      if (processed >= opts.limit) break;
      const [latStr, lonStr] = key.split(",");
      const lat = Number(latStr);
      const lon = Number(lonStr);
      try {
        const start = Date.now();
        const place = await reverseGeocode(lat, lon);
        cache[key] = place;
        const elapsed = Date.now() - start;
        if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
          await sleep(NOMINATIM_MIN_INTERVAL_MS - elapsed);
        }
        processed++;
        if (processed % 10 === 0) {
          console.log(`  ${processed}/${toFetch.length} geocoded (last: ${place.display})`);
          // Persist incremental progress so a crash mid-run doesn't lose work.
          writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
        }
      } catch (err) {
        console.warn(`  WARN: ${key} -> ${err && err.message ? err.message : err}`);
        await sleep(NOMINATIM_MIN_INTERVAL_MS);
      }
    }
    if (opts.write) writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
  }

  const catalogue = exifRows.map((r) => {
    const place =
      r.hasGps && typeof r.lat === "number" && typeof r.lon === "number"
        ? cache[geocodeCacheKey(r.lat, r.lon)] || null
        : null;
    return buildCatalogueEntry(r, place);
  });

  const countries = new Set(
    catalogue
      .filter((e) => e.place && e.place.country)
      .map((e) => e.place.country),
  );

  console.log(`\nPhotos: ${catalogue.length}`);
  console.log(`With GPS: ${catalogue.filter((e) => e.hasGps).length}`);
  console.log(`Countries seen: ${countries.size} (${[...countries].sort().join(", ")})`);

  if (opts.write) {
    const outPath = join(__dirname, "photo-catalogue.json");
    writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
    console.log(`\nWrote ${outPath}`);
  } else {
    console.log("\n(dry-run; pass --write to refresh photo-catalogue.json)");
  }
  return 0;
}

// CLI entry point — match the convention from sync-gh-descriptions.mjs.
// Guard against process.argv[1] being undefined (tests / bare-import-via-stdin).
const argv1 = process.argv[1] || "";
const isMain =
  import.meta.url === `file://${argv1}` ||
  import.meta.url === `file:///${argv1.replace(/\\/g, "/")}`;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  run(opts).then(
    (code) => process.exit(code ?? 0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
