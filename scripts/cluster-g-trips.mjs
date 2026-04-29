#!/usr/bin/env node
/**
 * Cluster photos within each G:\Poze\<YYYY>\ year-bucket into semantically-named
 * trip subfolders.
 *
 * Source: G:\Poze\<YYYY>\*.jpg (year root only — no recursion into nested
 *         trip subfolders that may already exist).
 * Target: G:\Poze\<YYYY>\<City> <YY>\*.jpg (trip-named subfolder, e.g.
 *         "Hamburg 22", "Milan 24"). Multi-city/region trips: "<Primary>
 *         + <Region> trip" (kept rare; default is short single-city form).
 *
 * Clustering rule (mirrors src/lib/cluster-trips.ts spirit, adapted for
 * date+GPS proximity per the brief):
 *   Two photos belong to the same trip when:
 *     1. takenAt gap ≤ 36 h, AND
 *     2. GPS within 200 km box centred on the running cluster mean
 *        (skipped when no GPS is available — date-only fallback).
 *
 * Naming: cluster gets its name from the top-occurring city (Nominatim
 * reverse-geocode of the GPS centroid) plus " <YY>" year shorthand. When no
 * GPS / no city resolves, the cluster falls back to a date-range slug (e.g.
 * "2018-03 trip"). Singletons (clusters with 1 photo) are left at the year
 * root rather than forced into a folder.
 *
 * Move-only (fs.renameSync — atomic on the same volume). No deletes.
 * Reversible via the log file at scripts/.g-trip-cluster.log.
 *
 * Usage:
 *   node scripts/cluster-g-trips.mjs            # apply
 *   node scripts/cluster-g-trips.mjs --dry-run  # plan only, no FS writes
 *   node scripts/cluster-g-trips.mjs --year=2018  # restrict to one year
 *
 * Constraints:
 *   - Skip P13 sensitive folders entirely (CV+CL, Driving license, ID,
 *     Passport, Residence permit, Browser, X, Instagram, Screenshots, etc.).
 *   - Skip top-level helper folders: WhatsApp-by-year/, .duplicates/,
 *     .review-for-delete/, Screenshots/.
 *   - Reuse scripts/.photo-classify/P-locations/ Nominatim cache; only hit
 *     network on cache miss.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'G:\\Poze';
const LOG_PATH = path.join(__dirname, '.g-trip-cluster.log');
const NOMINATIM_CACHE_DIR = path.join(
  __dirname,
  '.photo-classify',
  'P-locations',
);

const dryRun = process.argv.includes('--dry-run');
const yearArg = (() => {
  const m = process.argv.find((a) => a.startsWith('--year='));
  return m ? parseInt(m.slice('--year='.length), 10) : null;
})();

// Year-bucket folder pattern: 4-digit year between 1990 and 2030 (sanity range).
const YEAR_RE = /^(199\d|20[0-3]\d)$/;

// P13 / helper folders to skip when discovering year buckets.
const SKIP_TOP_LEVEL = new Set([
  'WhatsApp-by-year',
  '.duplicates',
  '.review-for-delete',
  'Screenshots',
  'Browser',
  'X',
  'Instagram',
  'CV + CL photos',
  'Driving license photos',
  'ID Photos',
  'Passport photos',
  'Residence permit photos',
  'Ha_Photos',
  'Hamburg_Photos',
  'Poze Huawei',
  'Poze_A5_landscape',
  'backup thumbnails',
  'faber-feedback',
  'New folder',
  'CV + CL Photos',
  'CV+CL photos',
]);

// Filename → camera-encoded date helper. Many photos lack EXIF, but the
// camera filename embeds YYYYMMDD which we can use as a fallback. Returns
// epoch-ms or null.
const FILENAME_DATE_PATTERNS = [
  /IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
  /IMG(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
  /VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
];

function dateFromFilename(filename) {
  for (const re of FILENAME_DATE_PATTERNS) {
    const m = re.exec(filename);
    if (!m) continue;
    const [, y, mo, d, h, mi, s] = m;
    const t = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

// Parse "YYYY:MM:DD HH:MM:SS" from EXIF DateTimeOriginal → epoch-ms.
function parseExifDate(str) {
  if (!str || typeof str !== 'string') return null;
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(str);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const t = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  if (Number.isNaN(t)) return null;
  return t;
}

function listYearFolders() {
  const entries = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true });
  const folders = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (SKIP_TOP_LEVEL.has(e.name)) continue;
    if (!YEAR_RE.test(e.name)) continue;
    if (yearArg !== null && Number(e.name) !== yearArg) continue;
    folders.push(e.name);
  }
  return folders.sort();
}

function listJpgFiles(yearDir) {
  const entries = fs.readdirSync(yearDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .filter((e) => /\.jpe?g$/i.test(e.name))
    .map((e) => e.name);
}

/**
 * Run exiftool once over the year folder (root only) and return a Map of
 * filename → { takenAt: epochMs|null, lat: number|null, lon: number|null }.
 */
function readExifBatch(yearDir) {
  const result = spawnSync(
    'exiftool',
    [
      '-DateTimeOriginal',
      '-GPSLatitude',
      '-GPSLongitude',
      '-n',
      '-j',
      '-q',
      '-fast2',
      '-ext',
      'jpg',
      yearDir,
    ],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  if (result.status !== 0 && !result.stdout) {
    console.error(
      `[cluster-g-trips] exiftool failed for ${yearDir}: ${result.stderr}`,
    );
    return new Map();
  }
  const json = result.stdout?.trim() || '[]';
  let arr;
  try {
    arr = JSON.parse(json);
  } catch (err) {
    console.error(
      `[cluster-g-trips] exiftool JSON parse failed for ${yearDir}: ${err.message}`,
    );
    return new Map();
  }
  const map = new Map();
  for (const row of arr) {
    if (!row.SourceFile) continue;
    const filename = path.basename(row.SourceFile);
    const takenAt = parseExifDate(row.DateTimeOriginal);
    const lat =
      typeof row.GPSLatitude === 'number' ? row.GPSLatitude : null;
    const lon =
      typeof row.GPSLongitude === 'number' ? row.GPSLongitude : null;
    map.set(filename, { takenAt, lat, lon });
  }
  return map;
}

// Haversine distance in km — used when checking 200 km box.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const TRIP_GAP_MS = 36 * 60 * 60 * 1000; // 36 h
const TRIP_GPS_BOX_KM = 200;

/**
 * Cluster photos within a single year. Photos must be sorted by takenAt.
 */
function clusterPhotos(items) {
  const clusters = [];
  let current = null;
  for (const item of items) {
    if (!current) {
      current = newCluster(item);
      clusters.push(current);
      continue;
    }
    const gap = item.takenAt - current.lastTakenAt;
    let inBox = true;
    if (
      typeof item.lat === 'number' &&
      typeof item.lon === 'number' &&
      typeof current.meanLat === 'number' &&
      typeof current.meanLon === 'number'
    ) {
      const km = haversineKm(
        current.meanLat,
        current.meanLon,
        item.lat,
        item.lon,
      );
      inBox = km <= TRIP_GPS_BOX_KM;
    }
    if (gap <= TRIP_GAP_MS && inBox) {
      current.items.push(item);
      current.lastTakenAt = item.takenAt;
      if (typeof item.lat === 'number' && typeof item.lon === 'number') {
        current.gpsCount += 1;
        current.gpsLatSum += item.lat;
        current.gpsLonSum += item.lon;
        current.meanLat = current.gpsLatSum / current.gpsCount;
        current.meanLon = current.gpsLonSum / current.gpsCount;
      }
    } else {
      current = newCluster(item);
      clusters.push(current);
    }
  }
  return clusters;
}

function newCluster(item) {
  const c = {
    items: [item],
    lastTakenAt: item.takenAt,
    gpsCount: 0,
    gpsLatSum: 0,
    gpsLonSum: 0,
    meanLat: null,
    meanLon: null,
  };
  if (typeof item.lat === 'number' && typeof item.lon === 'number') {
    c.gpsCount = 1;
    c.gpsLatSum = item.lat;
    c.gpsLonSum = item.lon;
    c.meanLat = item.lat;
    c.meanLon = item.lon;
  }
  return c;
}

// Round GPS to 2 decimals for cache key (~1.1 km precision — plenty for city resolution).
function gpsCacheKey(lat, lon) {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function ensureNominatimCacheDir() {
  if (!fs.existsSync(NOMINATIM_CACHE_DIR)) {
    if (!dryRun) {
      fs.mkdirSync(NOMINATIM_CACHE_DIR, { recursive: true });
    }
  }
}

function readNominatimCache(lat, lon) {
  const key = gpsCacheKey(lat, lon);
  const fp = path.join(NOMINATIM_CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeNominatimCache(lat, lon, payload) {
  if (dryRun) return;
  ensureNominatimCacheDir();
  const key = gpsCacheKey(lat, lon);
  const fp = path.join(NOMINATIM_CACHE_DIR, `${key}.json`);
  try {
    fs.writeFileSync(fp, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn(
      `[cluster-g-trips] cache write failed for ${key}: ${err.message}`,
    );
  }
}

const networkStats = { calls: 0, hits: 0, rateLimited: 0, lookupHits: 0 };

let lastNominatimAt = 0;

/**
 * GPS bounding-box lookup table for known cities/regions Eduard has
 * photographed. Faster and offline-reliable; bypasses Nominatim's
 * aggressive rate-limiting on bulk reverse-geocode requests.
 *
 * Each entry: { name, latMin, latMax, lonMin, lonMax }. Boxes are sized
 * generously (city + suburbs ≈ 0.3-0.6 deg) to catch outskirts.
 */
const CITY_BOXES = [
  // Romania
  { name: 'Bucharest', latMin: 44.3, latMax: 44.55, lonMin: 25.95, lonMax: 26.25 },
  { name: 'Brasov', latMin: 45.55, latMax: 45.75, lonMin: 25.5, lonMax: 25.75 },
  { name: 'Sibiu', latMin: 45.75, latMax: 45.85, lonMin: 24.0, lonMax: 24.2 },
  { name: 'Cluj', latMin: 46.7, latMax: 46.85, lonMin: 23.5, lonMax: 23.7 },
  { name: 'Timisoara', latMin: 45.7, latMax: 45.8, lonMin: 21.15, lonMax: 21.3 },
  { name: 'Constanta', latMin: 44.1, latMax: 44.25, lonMin: 28.55, lonMax: 28.75 },
  { name: 'Iasi', latMin: 47.1, latMax: 47.25, lonMin: 27.5, lonMax: 27.7 },
  { name: 'Sinaia', latMin: 45.32, latMax: 45.4, lonMin: 25.5, lonMax: 25.6 },
  { name: 'Brașov region', latMin: 45.4, latMax: 45.6, lonMin: 25.3, lonMax: 25.6 },
  // Denmark
  { name: 'Copenhagen', latMin: 55.55, latMax: 55.8, lonMin: 12.4, lonMax: 12.7 },
  { name: 'Aarhus', latMin: 56.1, latMax: 56.25, lonMin: 10.1, lonMax: 10.3 },
  { name: 'Kolding', latMin: 55.45, latMax: 55.55, lonMin: 9.4, lonMax: 9.55 },
  { name: 'Vejle', latMin: 55.65, latMax: 55.75, lonMin: 9.45, lonMax: 9.6 },
  { name: 'Esbjerg', latMin: 55.45, latMax: 55.55, lonMin: 8.4, lonMax: 8.55 },
  { name: 'Odense', latMin: 55.35, latMax: 55.45, lonMin: 10.35, lonMax: 10.5 },
  // Germany
  { name: 'Hamburg', latMin: 53.45, latMax: 53.65, lonMin: 9.85, lonMax: 10.2 },
  { name: 'Berlin', latMin: 52.4, latMax: 52.6, lonMin: 13.25, lonMax: 13.55 },
  { name: 'Munich', latMin: 48.05, latMax: 48.25, lonMin: 11.45, lonMax: 11.7 },
  { name: 'Frankfurt', latMin: 50.05, latMax: 50.2, lonMin: 8.6, lonMax: 8.8 },
  { name: 'Dortmund', latMin: 51.45, latMax: 51.6, lonMin: 7.4, lonMax: 7.6 },
  { name: 'Düsseldorf', latMin: 51.15, latMax: 51.3, lonMin: 6.7, lonMax: 6.85 },
  { name: 'Cologne', latMin: 50.85, latMax: 51.0, lonMin: 6.85, lonMax: 7.05 },
  { name: 'Stuttgart', latMin: 48.7, latMax: 48.85, lonMin: 9.1, lonMax: 9.3 },
  { name: 'Leipzig', latMin: 51.25, latMax: 51.4, lonMin: 12.3, lonMax: 12.45 },
  { name: 'Nuremberg', latMin: 49.4, latMax: 49.5, lonMin: 11.0, lonMax: 11.15 },
  // Italy
  { name: 'Milan', latMin: 45.4, latMax: 45.55, lonMin: 9.1, lonMax: 9.3 },
  { name: 'Rome', latMin: 41.8, latMax: 42.0, lonMin: 12.4, lonMax: 12.6 },
  { name: 'Florence', latMin: 43.7, latMax: 43.85, lonMin: 11.2, lonMax: 11.35 },
  { name: 'Venice', latMin: 45.4, latMax: 45.5, lonMin: 12.3, lonMax: 12.4 },
  { name: 'Naples', latMin: 40.8, latMax: 40.9, lonMin: 14.2, lonMax: 14.35 },
  { name: 'Trieste', latMin: 45.6, latMax: 45.7, lonMin: 13.7, lonMax: 13.85 },
  { name: 'Bologna', latMin: 44.45, latMax: 44.55, lonMin: 11.3, lonMax: 11.4 },
  { name: 'Pisa', latMin: 43.65, latMax: 43.75, lonMin: 10.35, lonMax: 10.45 },
  // Austria
  { name: 'Vienna', latMin: 48.1, latMax: 48.3, lonMin: 16.2, lonMax: 16.5 },
  { name: 'Salzburg', latMin: 47.75, latMax: 47.85, lonMin: 13.0, lonMax: 13.1 },
  { name: 'Innsbruck', latMin: 47.2, latMax: 47.3, lonMin: 11.35, lonMax: 11.45 },
  { name: 'Graz', latMin: 47.0, latMax: 47.1, lonMin: 15.4, lonMax: 15.5 },
  // Czechia
  { name: 'Prague', latMin: 50.0, latMax: 50.15, lonMin: 14.3, lonMax: 14.55 },
  { name: 'Brno', latMin: 49.15, latMax: 49.25, lonMin: 16.55, lonMax: 16.7 },
  // Poland
  { name: 'Krakow', latMin: 50.0, latMax: 50.1, lonMin: 19.85, lonMax: 20.05 },
  { name: 'Warsaw', latMin: 52.15, latMax: 52.3, lonMin: 20.95, lonMax: 21.1 },
  { name: 'Wroclaw', latMin: 51.05, latMax: 51.15, lonMin: 16.95, lonMax: 17.1 },
  { name: 'Tatra', latMin: 49.2, latMax: 49.35, lonMin: 19.85, lonMax: 20.1 },
  // Slovakia
  { name: 'Bratislava', latMin: 48.1, latMax: 48.2, lonMin: 17.05, lonMax: 17.2 },
  // Hungary
  { name: 'Budapest', latMin: 47.4, latMax: 47.6, lonMin: 18.95, lonMax: 19.15 },
  // Greece
  { name: 'Athens', latMin: 37.95, latMax: 38.05, lonMin: 23.7, lonMax: 23.85 },
  { name: 'Thessaloniki', latMin: 40.6, latMax: 40.7, lonMin: 22.9, lonMax: 23.05 },
  { name: 'Crete', latMin: 35.0, latMax: 35.7, lonMin: 23.5, lonMax: 26.3 },
  { name: 'Rhodes', latMin: 36.0, latMax: 36.5, lonMin: 27.9, lonMax: 28.3 },
  // Turkey
  { name: 'Istanbul', latMin: 40.95, latMax: 41.15, lonMin: 28.85, lonMax: 29.15 },
  { name: 'Antalya', latMin: 36.85, latMax: 36.95, lonMin: 30.65, lonMax: 30.85 },
  // Israel
  { name: 'Tel Aviv', latMin: 32.0, latMax: 32.15, lonMin: 34.7, lonMax: 34.85 },
  { name: 'Jerusalem', latMin: 31.7, latMax: 31.85, lonMin: 35.15, lonMax: 35.3 },
  // Croatia
  { name: 'Pula', latMin: 44.85, latMax: 44.92, lonMin: 13.83, lonMax: 13.92 },
  { name: 'Zagreb', latMin: 45.75, latMax: 45.85, lonMin: 15.9, lonMax: 16.05 },
  { name: 'Split', latMin: 43.5, latMax: 43.55, lonMin: 16.4, lonMax: 16.5 },
  { name: 'Dubrovnik', latMin: 42.6, latMax: 42.7, lonMin: 18.05, lonMax: 18.15 },
  { name: 'Rijeka', latMin: 45.3, latMax: 45.35, lonMin: 14.4, lonMax: 14.5 },
  // Slovenia
  { name: 'Ljubljana', latMin: 46.0, latMax: 46.1, lonMin: 14.45, lonMax: 14.6 },
  // Serbia / Balkans
  { name: 'Belgrade', latMin: 44.75, latMax: 44.85, lonMin: 20.4, lonMax: 20.55 },
  { name: 'Novi Sad', latMin: 45.2, latMax: 45.3, lonMin: 19.8, lonMax: 19.9 },
  // Bulgaria
  { name: 'Sofia', latMin: 42.65, latMax: 42.75, lonMin: 23.25, lonMax: 23.4 },
  // Albania
  { name: 'Tirana', latMin: 41.3, latMax: 41.4, lonMin: 19.75, lonMax: 19.9 },
  { name: 'Saranda', latMin: 39.85, latMax: 39.92, lonMin: 19.95, lonMax: 20.05 },
  // Sweden
  { name: 'Stockholm', latMin: 59.25, latMax: 59.45, lonMin: 17.85, lonMax: 18.2 },
  { name: 'Malmö', latMin: 55.55, latMax: 55.65, lonMin: 12.95, lonMax: 13.1 },
  { name: 'Gothenburg', latMin: 57.65, latMax: 57.75, lonMin: 11.9, lonMax: 12.05 },
  // Finland
  { name: 'Helsinki', latMin: 60.1, latMax: 60.25, lonMin: 24.85, lonMax: 25.05 },
  // Belgium
  { name: 'Brussels', latMin: 50.8, latMax: 50.9, lonMin: 4.3, lonMax: 4.45 },
  { name: 'Antwerp', latMin: 51.2, latMax: 51.3, lonMin: 4.35, lonMax: 4.45 },
  { name: 'Bruges', latMin: 51.2, latMax: 51.25, lonMin: 3.2, lonMax: 3.3 },
  // Luxembourg
  { name: 'Luxembourg', latMin: 49.55, latMax: 49.65, lonMin: 6.1, lonMax: 6.2 },
  // Spain
  { name: 'Madrid', latMin: 40.35, latMax: 40.5, lonMin: -3.75, lonMax: -3.6 },
  { name: 'Barcelona', latMin: 41.35, latMax: 41.45, lonMin: 2.1, lonMax: 2.25 },
  { name: 'Seville', latMin: 37.35, latMax: 37.45, lonMin: -6.05, lonMax: -5.9 },
  { name: 'Granada', latMin: 37.15, latMax: 37.2, lonMin: -3.65, lonMax: -3.55 },
  { name: 'Malaga', latMin: 36.7, latMax: 36.75, lonMin: -4.5, lonMax: -4.4 },
  { name: 'Gibraltar', latMin: 36.1, latMax: 36.17, lonMin: -5.37, lonMax: -5.33 },
  // UK
  { name: 'London', latMin: 51.4, latMax: 51.6, lonMin: -0.3, lonMax: 0.1 },
  // Netherlands
  { name: 'Amsterdam', latMin: 52.3, latMax: 52.4, lonMin: 4.85, lonMax: 5.0 },
  // Norway
  { name: 'Oslo', latMin: 59.85, latMax: 59.95, lonMin: 10.7, lonMax: 10.85 },
];

/**
 * Country fallback when no city box matches. Coarse country-level boxes —
 * only used when Nominatim fails AND the GPS is outside any known city.
 */
const COUNTRY_BOXES = [
  { name: 'Romania', latMin: 43.5, latMax: 48.3, lonMin: 20.2, lonMax: 29.8 },
  { name: 'Denmark', latMin: 54.5, latMax: 57.8, lonMin: 8.0, lonMax: 13.0 },
  { name: 'Germany', latMin: 47.2, latMax: 55.1, lonMin: 5.8, lonMax: 15.1 },
  { name: 'Italy', latMin: 36.5, latMax: 47.1, lonMin: 6.6, lonMax: 18.5 },
  { name: 'Austria', latMin: 46.3, latMax: 49.0, lonMin: 9.5, lonMax: 17.2 },
  { name: 'Czechia', latMin: 48.5, latMax: 51.1, lonMin: 12.0, lonMax: 18.9 },
  { name: 'Poland', latMin: 49.0, latMax: 54.9, lonMin: 14.1, lonMax: 24.1 },
  { name: 'Slovakia', latMin: 47.7, latMax: 49.6, lonMin: 16.8, lonMax: 22.6 },
  { name: 'Hungary', latMin: 45.7, latMax: 48.6, lonMin: 16.1, lonMax: 22.9 },
  { name: 'Greece', latMin: 34.8, latMax: 41.8, lonMin: 19.4, lonMax: 28.3 },
  { name: 'Turkey', latMin: 35.8, latMax: 42.1, lonMin: 25.6, lonMax: 44.8 },
  { name: 'Israel', latMin: 29.5, latMax: 33.4, lonMin: 34.3, lonMax: 35.9 },
  { name: 'Croatia', latMin: 42.4, latMax: 46.6, lonMin: 13.4, lonMax: 19.5 },
  { name: 'Slovenia', latMin: 45.4, latMax: 46.9, lonMin: 13.4, lonMax: 16.6 },
  { name: 'Serbia', latMin: 42.2, latMax: 46.2, lonMin: 18.8, lonMax: 23.0 },
  { name: 'Bulgaria', latMin: 41.2, latMax: 44.2, lonMin: 22.4, lonMax: 28.6 },
  { name: 'Albania', latMin: 39.6, latMax: 42.7, lonMin: 19.3, lonMax: 21.1 },
  { name: 'Sweden', latMin: 55.3, latMax: 69.1, lonMin: 11.0, lonMax: 24.2 },
  { name: 'Finland', latMin: 59.8, latMax: 70.1, lonMin: 20.5, lonMax: 31.6 },
  { name: 'Belgium', latMin: 49.5, latMax: 51.6, lonMin: 2.5, lonMax: 6.4 },
  { name: 'Luxembourg', latMin: 49.4, latMax: 50.2, lonMin: 5.7, lonMax: 6.5 },
  { name: 'Spain', latMin: 36.0, latMax: 43.8, lonMin: -9.4, lonMax: 3.4 },
  { name: 'France', latMin: 41.3, latMax: 51.1, lonMin: -4.8, lonMax: 8.3 },
  { name: 'UK', latMin: 49.9, latMax: 60.9, lonMin: -8.6, lonMax: 1.8 },
  { name: 'Netherlands', latMin: 50.7, latMax: 53.6, lonMin: 3.3, lonMax: 7.3 },
  { name: 'Norway', latMin: 57.9, latMax: 71.3, lonMin: 4.5, lonMax: 31.1 },
];

function lookupGpsBox(lat, lon, boxes) {
  for (const b of boxes) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
      return b.name;
    }
  }
  return null;
}

/**
 * Resolve (lat, lon) → city/region name. Strategy:
 *   1. Look up in CITY_BOXES (deterministic, instant, offline).
 *   2. Look up in COUNTRY_BOXES (fallback for known countries).
 *   3. Hit Nominatim (cached or live) as last resort.
 *
 * Returns the resolved name, or null if everything fails.
 */
async function resolveLocationName(lat, lon) {
  const city = lookupGpsBox(lat, lon, CITY_BOXES);
  if (city) {
    networkStats.lookupHits += 1;
    return city;
  }
  const country = lookupGpsBox(lat, lon, COUNTRY_BOXES);
  if (country) {
    networkStats.lookupHits += 1;
    return country;
  }
  // Last resort: try Nominatim (which may 429).
  const payload = await reverseGeocode(lat, lon);
  return cityFromNominatim(payload);
}

/**
 * Reverse-geocode (lat, lon) → city name via Nominatim. Cache hit returns
 * cached payload; cache miss hits the network with a polite 1.5 s gap
 * between live calls (Nominatim's TOS = 1 req/s; we back off generously).
 * On 429 we wait 30 s and retry once.
 */
async function reverseGeocode(lat, lon) {
  const cached = readNominatimCache(lat, lon);
  if (cached) {
    networkStats.hits += 1;
    return cached;
  }
  networkStats.calls += 1;
  // Throttle: ensure ≥1.5 s between live network calls.
  const elapsed = Date.now() - lastNominatimAt;
  if (elapsed < 1500) {
    await new Promise((res) => setTimeout(res, 1500 - elapsed));
  }
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}` +
    `&format=jsonv2&zoom=10&accept-language=en`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    lastNominatimAt = Date.now();
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent':
            'EduardFischer.dev-photo-cluster/1.0 (fischer_eduard@yahoo.com)',
        },
      });
      if (resp.status === 429) {
        networkStats.rateLimited += 1;
        if (attempt === 0) {
          // Back off and retry once.
          await new Promise((res) => setTimeout(res, 30000));
          continue;
        }
        console.warn(
          `[cluster-g-trips] nominatim 429 (after retry) for ${lat},${lon}`,
        );
        return null;
      }
      if (!resp.ok) {
        console.warn(
          `[cluster-g-trips] nominatim ${resp.status} for ${lat},${lon}`,
        );
        return null;
      }
      const json = await resp.json();
      writeNominatimCache(lat, lon, json);
      return json;
    } catch (err) {
      console.warn(`[cluster-g-trips] nominatim error: ${err.message}`);
      return null;
    }
  }
  return null;
}

function cityFromNominatim(payload) {
  if (!payload || !payload.address) return null;
  const a = payload.address;
  return (
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    a.state ||
    a.country ||
    null
  );
}

/**
 * Sanitize a name for filesystem use. Strip diacritics, keep ASCII letters,
 * digits, spaces, and the "+" separator.
 */
function sanitizeFolderName(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s+\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveClusterName(cluster, year, primaryCity) {
  const yy = String(year).slice(-2);
  if (primaryCity) {
    return `${sanitizeFolderName(primaryCity)} ${yy}`;
  }
  // No city resolved (no GPS, network failure, or 429). Derive a date-range
  // slug from the cluster's first/last photo. Format:
  //   - same-day cluster:    "YYYY-MM-DD trip"
  //   - multi-day cluster:   "YYYY-MM-DD..DD trip"
  //   - cross-month cluster: "YYYY-MM-DD..MM-DD trip"
  // This avoids the collision-after-disambiguation rendering ugly "(MM-2)"
  // suffixes when several no-GPS clusters fall in the same month.
  const first = new Date(cluster.items[0].takenAt);
  const last = new Date(cluster.items[cluster.items.length - 1].takenAt);
  const yyyy = first.getUTCFullYear();
  const mo1 = String(first.getUTCMonth() + 1).padStart(2, '0');
  const d1 = String(first.getUTCDate()).padStart(2, '0');
  const mo2 = String(last.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(last.getUTCDate()).padStart(2, '0');
  if (mo1 === mo2 && d1 === d2) return `${yyyy}-${mo1}-${d1} trip`;
  if (mo1 === mo2) return `${yyyy}-${mo1}-${d1}..${d2} trip`;
  return `${yyyy}-${mo1}-${d1}..${mo2}-${d2} trip`;
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(line) {
  if (dryRun) return;
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

async function main() {
  const startedAt = new Date();
  console.log(
    `[cluster-g-trips] start ${startedAt.toISOString()} dryRun=${dryRun}` +
      (yearArg !== null ? ` yearOnly=${yearArg}` : ''),
  );

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(
      `[cluster-g-trips] FATAL: ${SOURCE_ROOT} does not exist`,
    );
    process.exit(1);
  }

  if (!dryRun) {
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(
        LOG_PATH,
        `# g-trip-cluster log — TSV: timestamp\told_path\tnew_path\tcluster_name\tyear\n`,
        'utf8',
      );
    }
    appendLog(`# run start ${startedAt.toISOString()}`);
  }

  const years = listYearFolders();
  console.log(`[cluster-g-trips] year folders: ${years.join(', ') || '(none)'}`);

  const yearReports = [];
  let totalMoved = 0;
  let totalClusters = 0;
  let totalSingletons = 0;

  for (const year of years) {
    const yearDir = path.join(SOURCE_ROOT, year);
    const filenames = listJpgFiles(yearDir);
    console.log(
      `[cluster-g-trips] ${year}: ${filenames.length} jpg files at root`,
    );
    if (filenames.length === 0) {
      yearReports.push({ year, files: 0, clusters: [], singletons: 0 });
      continue;
    }

    const exif = readExifBatch(yearDir);
    const items = [];
    for (const fn of filenames) {
      const e = exif.get(fn) || { takenAt: null, lat: null, lon: null };
      const takenAt = e.takenAt ?? dateFromFilename(fn);
      if (!takenAt) continue;
      items.push({
        filename: fn,
        takenAt,
        lat: e.lat,
        lon: e.lon,
      });
    }
    items.sort((a, b) => a.takenAt - b.takenAt);

    const clusters = clusterPhotos(items);

    const clusterReports = [];
    for (const c of clusters) {
      if (c.items.length < 2) {
        clusterReports.push({
          name: null,
          singleton: true,
          photoCount: 1,
          firstAt: c.items[0].takenAt,
          lastAt: c.items[0].takenAt,
          centroidLat: c.meanLat,
          centroidLon: c.meanLon,
          city: null,
          items: c.items,
        });
        continue;
      }
      let city = null;
      if (typeof c.meanLat === 'number' && typeof c.meanLon === 'number') {
        city = await resolveLocationName(c.meanLat, c.meanLon);
      }
      const name = deriveClusterName(c, year, city);
      clusterReports.push({
        name,
        singleton: false,
        photoCount: c.items.length,
        firstAt: c.items[0].takenAt,
        lastAt: c.items[c.items.length - 1].takenAt,
        centroidLat: c.meanLat,
        centroidLon: c.meanLon,
        city,
        items: c.items,
      });
    }

    let movedThisYear = 0;
    let singletonsThisYear = 0;
    const usedFolderNames = new Set();
    for (const cr of clusterReports) {
      if (cr.singleton) {
        singletonsThisYear += 1;
        continue;
      }
      let folderName = cr.name;
      if (usedFolderNames.has(folderName)) {
        const mo = new Date(cr.firstAt).getUTCMonth() + 1;
        folderName = `${cr.name} (${String(mo).padStart(2, '0')})`;
        let dedup = 2;
        while (usedFolderNames.has(folderName)) {
          folderName = `${cr.name} (${String(mo).padStart(2, '0')}-${dedup})`;
          dedup += 1;
        }
      }
      usedFolderNames.add(folderName);
      cr.appliedName = folderName;

      const targetDir = path.join(yearDir, folderName);
      ensureDir(targetDir);
      appendLog(
        `# CLUSTER ${year}\t${folderName}\tphotos=${cr.photoCount}\tcity=${cr.city ?? '-'}\tcentroid=${cr.centroidLat ?? '-'},${cr.centroidLon ?? '-'}\tfirst=${new Date(cr.firstAt).toISOString()}\tlast=${new Date(cr.lastAt).toISOString()}`,
      );
      for (const item of cr.items) {
        const oldPath = path.join(yearDir, item.filename);
        const newPath = path.join(targetDir, item.filename);
        if (fs.existsSync(newPath)) {
          appendLog(`# SKIP target-exists\t${oldPath}\t${newPath}`);
          continue;
        }
        try {
          if (!dryRun) fs.renameSync(oldPath, newPath);
          appendLog(
            `${new Date().toISOString()}\t${oldPath}\t${newPath}\t${folderName}\t${year}`,
          );
          movedThisYear += 1;
        } catch (err) {
          appendLog(
            `# FAIL ${err.code || 'ERR'}\t${oldPath}\t${newPath}\t${err.message}`,
          );
        }
      }
    }

    totalMoved += movedThisYear;
    totalClusters += clusterReports.filter((c) => !c.singleton).length;
    totalSingletons += singletonsThisYear;

    yearReports.push({
      year,
      files: filenames.length,
      moved: movedThisYear,
      singletons: singletonsThisYear,
      clusters: clusterReports
        .filter((c) => !c.singleton)
        .map((c) => ({
          name: c.appliedName ?? c.name,
          photoCount: c.photoCount,
          firstAt: new Date(c.firstAt).toISOString(),
          lastAt: new Date(c.lastAt).toISOString(),
          centroidLat: c.centroidLat,
          centroidLon: c.centroidLon,
          city: c.city,
        })),
    });
  }

  const finishedAt = new Date();
  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    totalClusters,
    totalMoved,
    totalSingletons,
    gpsBoxLookupHits: networkStats.lookupHits,
    nominatimCacheHits: networkStats.hits,
    nominatimNetworkCalls: networkStats.calls,
    nominatimRateLimited: networkStats.rateLimited,
    perYear: yearReports,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    appendLog(
      `# run end ${finishedAt.toISOString()} clusters=${totalClusters} moved=${totalMoved} singletons=${totalSingletons} boxLookups=${networkStats.lookupHits} cacheHits=${networkStats.hits} netCalls=${networkStats.calls} rateLimited=${networkStats.rateLimited}`,
    );
    const summaryPath = path.join(__dirname, '.g-trip-cluster.summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  }

  return summary;
}

main().catch((err) => {
  console.error('[cluster-g-trips] FATAL', err);
  process.exit(1);
});
