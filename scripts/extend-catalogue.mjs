// One-shot helper for the photo-catalogue-extension task.
// Reads .gposze-exif.ndjson (output of extract-exif-list.ps1 on G:\Poze candidates),
// filters to photos in trip date windows + with GPS + not already in catalogue,
// reverse-geocodes them via the existing geocode cache (and Nominatim if missed),
// and appends matches into scripts/photo-catalogue.json.
//
// Trips and date windows ±3 days are hardcoded for this task (see TRIP_WINDOWS).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCatalogueEntry,
  exifDateToIso,
  geocodeCacheKey,
  parseNominatimResponse,
  roundCoord,
} from "./build-photo-catalogue.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT = "EduardFischer.dev portfolio batch-geocoder/1.0";
const NOMINATIM_MIN_INTERVAL_MS = 1100;

// [country, ymKey, startISO, endISO]  — windows are inclusive and ±3 days from
// the existing trip extremes (computed from photo-catalogue.json on 2026-04-27).
const TRIP_WINDOWS = [
  ["Serbia", "2026-03", "2026-03-21T00:00:00Z", "2026-03-27T23:59:59Z"],
  ["Slovenia", "2026-03", "2026-03-22T00:00:00Z", "2026-03-28T23:59:59Z"],
  ["Croatia", "2026-03", "2026-03-22T00:00:00Z", "2026-03-28T23:59:59Z"],
  ["Italy", "2026-03", "2026-03-22T00:00:00Z", "2026-03-29T23:59:59Z"],
  ["Austria", "2026-03", "2026-03-23T00:00:00Z", "2026-03-29T23:59:59Z"],
  ["Germany", "2026-03", "2026-03-24T00:00:00Z", "2026-03-30T23:59:59Z"],
  ["Gibraltar", "2025-09", "2025-09-12T00:00:00Z", "2025-09-18T23:59:59Z"],
  ["Spain", "2025-09", "2025-09-14T00:00:00Z", "2025-09-20T23:59:59Z"],
  ["Austria", "2025-04", "2025-04-10T00:00:00Z", "2025-04-16T23:59:59Z"],
  ["Slovakia", "2025-04", "2025-04-11T00:00:00Z", "2025-04-20T23:59:59Z"],
  ["Poland", "2025-04", "2025-04-13T00:00:00Z", "2025-04-26T23:59:59Z"],
  ["Czechia", "2025-04", "2025-04-23T00:00:00Z", "2025-04-29T23:59:59Z"],
];

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for ${lat},${lon}`);
  const body = await res.json();
  return parseNominatimResponse(body);
}

const ndjsonPath = join(__dirname, ".gposze-exif.ndjson");
const cataloguePath = join(__dirname, "photo-catalogue.json");
const cachePath = join(__dirname, ".geocode-cache.json");

const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const existingSrc = new Set(catalogue.map((e) => e.src));

// Read EXIF rows.
const rows = [];
for (const line of readFileSync(ndjsonPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t) continue;
  try {
    rows.push(JSON.parse(t));
  } catch {
    // skip
  }
}

console.log(`Loaded ${rows.length} EXIF rows from G:\\Poze candidates.`);

// Filter to GPS-bearing rows with parseable dates that fall in any trip window
// AND aren't already catalogued.
const inWindow = (iso, sIso, eIso) => iso >= sIso && iso <= eIso;

const candidates = []; // { row, iso, matchingWindows: [{country, ym}] }
for (const r of rows) {
  if (!r.hasGps || typeof r.lat !== "number" || typeof r.lon !== "number") continue;
  if (existingSrc.has(r.file)) continue;
  const iso = exifDateToIso(r.dateTimeOriginal);
  if (!iso) continue;
  const matches = TRIP_WINDOWS.filter(([, , s, e]) => inWindow(iso, s, e));
  if (matches.length === 0) continue;
  candidates.push({
    row: r,
    iso,
    matchingWindows: matches.map(([country, ym]) => ({ country, ym })),
  });
}

console.log(`${candidates.length} candidates after date+GPS+dedupe filter.`);

// Geocode missing keys (rate-limited).
const uniqueKeys = new Set(candidates.map((c) => geocodeCacheKey(c.row.lat, c.row.lon)));
const missingKeys = [...uniqueKeys].filter((k) => !cache[k]);
console.log(`Geocode: ${uniqueKeys.size} unique keys, ${missingKeys.length} missing.`);

for (const key of missingKeys) {
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
    console.log(`  geocoded ${key} -> ${place.display}`);
  } catch (err) {
    console.warn(`  WARN ${key}: ${err.message}`);
    await sleep(NOMINATIM_MIN_INTERVAL_MS);
  }
}

// Persist cache after geocoding (incrementally not needed — small batch).
writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");

// Decide which candidates land in which trip: the geocoded country must match
// one of the candidate's matchingWindows entries (same ym). Then we cap the
// number of new entries per trip and pick a temporally-spread subset so the
// gallery doesn't get drowned in 300+ photos for a single trip.
//
// Existing-counts -> we top up so each target trip ends with ~10 photos total.
const TARGET_PHOTOS_PER_TRIP = 10;
const existingCounts = new Map();
for (const e of catalogue) {
  if (!e.takenAt || !e.place || !e.place.country) continue;
  const k = `${e.place.country}|${e.takenAt.slice(0, 7)}`;
  existingCounts.set(k, (existingCounts.get(k) || 0) + 1);
}

// Bucket country-matched candidates per trip, sorted by takenAt.
const perTripCandidates = new Map(); // tripKey -> [{c, place, iso}]
for (const c of candidates) {
  const key = geocodeCacheKey(c.row.lat, c.row.lon);
  const place = cache[key];
  if (!place || !place.country) continue;
  const ym = c.iso.slice(0, 7);
  const tripKey = `${place.country}|${ym}`;
  const matched = c.matchingWindows.find(
    (m) => m.country === place.country && m.ym === ym,
  );
  if (!matched) continue;
  let arr = perTripCandidates.get(tripKey);
  if (!arr) {
    arr = [];
    perTripCandidates.set(tripKey, arr);
  }
  arr.push({ c, place });
}

// Evenly-spaced pick of N items from a chronologically-sorted array.
function evenSpread(arr, n) {
  if (arr.length <= n) return arr.slice();
  const step = (arr.length - 1) / (n - 1);
  const idxs = new Set();
  for (let i = 0; i < n; i++) idxs.add(Math.round(i * step));
  return [...idxs].sort((a, b) => a - b).map((i) => arr[i]);
}

const newEntries = [];
const perTrip = new Map();
for (const [tripKey, arr] of perTripCandidates) {
  arr.sort((a, b) => a.c.iso.localeCompare(b.c.iso));
  const have = existingCounts.get(tripKey) || 0;
  const need = Math.max(0, TARGET_PHOTOS_PER_TRIP - have);
  if (need === 0) continue;
  const picked = evenSpread(arr, need);
  for (const { c, place } of picked) {
    const exif = {
      file: c.row.file,
      hasGps: true,
      lat: c.row.lat,
      lon: c.row.lon,
      dateTimeOriginal: c.row.dateTimeOriginal,
      cameraModel: c.row.cameraModel,
    };
    newEntries.push(buildCatalogueEntry(exif, place));
    perTrip.set(tripKey, (perTrip.get(tripKey) || 0) + 1);
  }
}

console.log(`\nSelected ${newEntries.length} new entries (target ${TARGET_PHOTOS_PER_TRIP}/trip).`);
for (const [k, n] of [...perTrip.entries()].sort()) {
  const have = existingCounts.get(k) || 0;
  console.log(`  ${k}: had ${have}, +${n} = ${have + n}`);
}

// Append + write.
const merged = [...catalogue, ...newEntries];
// Stable sort by takenAt for nicer diffs.
merged.sort((a, b) => (a.takenAt || "").localeCompare(b.takenAt || ""));
writeFileSync(cataloguePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`\nWrote ${cataloguePath} (now ${merged.length} entries).`);

// Also write the new entry filenames so we can copy them next.
writeFileSync(
  join(__dirname, ".new-photo-files.txt"),
  newEntries.map((e) => e.src).join("\n") + "\n",
  "utf8",
);
console.log(`Wrote ${join(__dirname, ".new-photo-files.txt")} for copy step.`);
