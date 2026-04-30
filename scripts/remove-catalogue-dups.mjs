/**
 * Remove duplicate entries from photo-catalogue.json.
 *
 * Two types of duplicates are handled:
 *   1. Exact same `src` path listed twice → keep first, remove second.
 *   2. Same Pexels photo ID but different filenames → keep the entry
 *      with the most metadata (takenAt + hasGps + stock + caption),
 *      delete the other entry's physical file when it's a different path.
 *
 * Run: node scripts/remove-catalogue-dups.mjs
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATALOGUE_PATH = join(__dirname, "photo-catalogue.json");
const PHOTOS_ROOT = join(__dirname, "..", "public", "photos");

const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf-8"));

/** Extract the numeric Pexels photo ID from a src path. */
function extractPexelsId(src) {
  return (
    src.match(/pexels-[^/]+-(\d+)\.[^.]+$/)?.[1] ??
    src.match(/pexels-photo-(\d+)\.[^.]+$/)?.[1] ??
    null
  );
}

/**
 * Quality score for an entry. Higher = more usable in clustering.
 * takenAt is worth 2 because without it an entry is invisible to clusterTrips.
 */
function quality(entry) {
  let score = 0;
  if (entry.takenAt) score += 2;
  if (entry.hasGps) score += 1;
  if (entry.stock) score += 1;
  if (entry.caption) score += 1;
  return score;
}

// Two index maps:
//   seenBySrc: exact src string → index of kept entry
//   seenById:  pexels ID       → index of kept entry (best quality so far)
const seenBySrc = new Map();
const seenById = new Map();
const toRemove = new Set(); // catalogue indices scheduled for removal

for (let i = 0; i < catalogue.length; i++) {
  const entry = catalogue[i];

  // --- pass 1: exact-src duplicates ---
  if (seenBySrc.has(entry.src)) {
    toRemove.add(i);
    continue; // no need to check pexels ID again
  }
  seenBySrc.set(entry.src, i);

  // --- pass 2: same pexels ID, different filename ---
  const pexelsId = extractPexelsId(entry.src);
  if (!pexelsId) continue;

  if (seenById.has(pexelsId)) {
    const prevIdx = seenById.get(pexelsId);
    // Swap if current entry has strictly better metadata.
    if (quality(entry) > quality(catalogue[prevIdx])) {
      toRemove.add(prevIdx);
      seenById.set(pexelsId, i);
    } else {
      toRemove.add(i);
    }
  } else {
    seenById.set(pexelsId, i);
  }
}

// The srcs we are KEEPING (used to decide whether to delete the physical file).
const keptSrcs = new Set(
  catalogue.filter((_, i) => !toRemove.has(i)).map((e) => e.src),
);

let deletedFiles = 0;
const removedEntries = [];

for (const idx of toRemove) {
  const entry = catalogue[idx];
  removedEntries.push(entry.src);

  // Delete the physical file only when its path is NOT being kept under
  // the same src string (i.e., this is a renamed duplicate, not a
  // repeated catalogue reference to the same file).
  if (!keptSrcs.has(entry.src)) {
    const filePath = join(PHOTOS_ROOT, entry.src);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      deletedFiles++;
      console.log("  deleted file:", entry.src);
    }
  }
}

const cleaned = catalogue.filter((_, i) => !toRemove.has(i));
writeFileSync(CATALOGUE_PATH, JSON.stringify(cleaned, null, 2) + "\n");

console.log(`\nDuplicate removal complete:`);
console.log(`  Catalogue: ${catalogue.length} → ${cleaned.length} entries`);
console.log(`  Removed entries: ${toRemove.size}`);
console.log(`  Deleted files: ${deletedFiles}`);
if (removedEntries.length > 0) {
  console.log("\nRemoved catalogue entries:");
  for (const src of removedEntries) console.log("  -", src);
}
