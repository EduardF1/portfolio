/**
 * Fix stock photo `takenAt` dates so they cluster correctly with
 * the original (camera) photos in the same trip.
 *
 * clusterTrips() in src/lib/trips-pure.ts starts a NEW cluster
 * whenever consecutive photos of the same country are separated by
 * more than MAX_GAP_DAYS = 3 days. Stock photos were back-filled with
 * a hardcoded midpoint date (e.g. "2024-09-15T12:00:00Z") that can
 * end up more than 3 days away from the actual trip photos, causing
 * a country's photos to split across two slugs.
 *
 * Strategy: for each stock photo (stock: true) that has takenAt,
 * find the earliest original (non-stock) photo for the same country
 * in the same trip directory and set the stock photo's takenAt to
 * 5 minutes before that anchor — guaranteeing they are sorted
 * immediately before the originals and land in the same cluster.
 *
 * The same logic is applied to old-style pexels placeholder entries
 * (src contains "pexels") that have hasGps + place.country but are
 * missing takenAt entirely; these were invisible to clusterTrips.
 *
 * Run: node scripts/fix-stock-photo-dates.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATALOGUE_PATH = join(__dirname, "photo-catalogue.json");

const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf-8"));

/** First two path components form the trip directory key. */
function tripDir(src) {
  const parts = src.split("/");
  return parts.slice(0, 2).join("/");
}

/** Return ISO string 5 minutes before the given ISO string. */
function fiveMinutesBefore(isoString) {
  const d = new Date(isoString);
  d.setTime(d.getTime() - 5 * 60 * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// Build a lookup: tripDir + country → earliest original (non-stock) takenAt
// "original" = has takenAt AND hasGps AND place.country AND stock !== true
const anchorMap = new Map(); // key: "tripDir|country" → earliest takenAt string

for (const entry of catalogue) {
  if (!entry.takenAt) continue;
  if (!entry.hasGps || !entry.place?.country) continue;
  if (entry.stock) continue; // skip stock entries in this pass

  const key = `${tripDir(entry.src)}|${entry.place.country}`;
  const existing = anchorMap.get(key);
  if (!existing || entry.takenAt < existing) {
    anchorMap.set(key, entry.takenAt);
  }
}

const MAX_GAP_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

let fixedCount = 0;
let activatedCount = 0;

for (const entry of catalogue) {
  const country = entry.place?.country;
  if (!country || !entry.hasGps) continue;

  const key = `${tripDir(entry.src)}|${country}`;
  const anchor = anchorMap.get(key);
  if (!anchor) continue; // no original photos found for this trip+country

  const targetDate = fiveMinutesBefore(anchor);

  if (entry.stock && entry.takenAt) {
    // Fix existing stock photo date if it's more than 1 day from anchor.
    const gap = Math.abs(
      new Date(entry.takenAt).getTime() - new Date(anchor).getTime(),
    );
    if (gap > MAX_GAP_MS) {
      console.log(
        `  fixing stock date: ${entry.src.split("/").pop()}`,
        `\n    ${entry.takenAt} → ${targetDate}`,
        `(gap was ${(gap / 86400000).toFixed(1)} days)`,
      );
      entry.takenAt = targetDate;
      fixedCount++;
    }
  } else if (!entry.takenAt && entry.src.includes("pexels") && !entry.stock) {
    // Activate old-style placeholder: give it a date + stock flag.
    console.log(
      `  activating placeholder: ${entry.src.split("/").pop()}`,
      `\n    takenAt → ${targetDate}`,
    );
    entry.takenAt = targetDate;
    entry.stock = true;
    activatedCount++;
  }
}

writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2) + "\n");

console.log(`\nStock photo date fix complete:`);
console.log(`  Adjusted existing stock dates: ${fixedCount}`);
console.log(`  Activated placeholder entries: ${activatedCount}`);
