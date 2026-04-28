// Build new catalogue entries for the Balkan backfill, then merge them into
// scripts/photo-catalogue.json. The Balkan section is sorted by takenAt ASC.
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "C:/Users/Eduard/Projects/portfolio/.claude/worktrees/agent-a4acf4734c9d674c9";
const CATALOGUE = `${ROOT}/scripts/photo-catalogue.json`;
const CACHE = `${ROOT}/scripts/.geocode-cache.json`;
const PRE_EXIF = "C:/Users/Eduard/AppData/Local/Temp/balkan-pre23-exif.json";
const POST_EXIF = "C:/Users/Eduard/AppData/Local/Temp/post-mar25-exif.json";
const SELECTED = `${ROOT}/scripts/.balkan-backfill/selected.txt`;
const APPLIED_DOC = `${ROOT}/docs/balkan-gps-backfill-applied.md`;

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const r2 = (n) => (Math.round(n * 100) / 100).toFixed(2);

const exifRows = [
  ...JSON.parse(readFileSync(PRE_EXIF, "utf8")),
  ...JSON.parse(readFileSync(POST_EXIF, "utf8")),
];
const cache = JSON.parse(readFileSync(CACHE, "utf8"));
const cat = JSON.parse(readFileSync(CATALOGUE, "utf8"));
const selected = readFileSync(SELECTED, "utf8").trim().split(/\r?\n/).filter(Boolean);

function exifDateToIso(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}Z`;
}

const newEntries = [];
const provenance = [];
for (const fn of selected) {
  const r = exifRows.find((x) => x.SourceFile && x.SourceFile.endsWith("/" + fn));
  if (!r) {
    console.error("MISSING EXIF:", fn);
    continue;
  }
  const lat = r.GPSLatitude;
  const lon = r.GPSLongitude;
  const cell = `${r2(lat)},${r2(lon)}`;
  const place = cache[cell];
  if (!place) {
    console.error("MISSING PLACE:", fn, cell);
    continue;
  }
  const entry = {
    src: `trips/2026-03-balkans-roadtrip/${fn}`,
    takenAt: exifDateToIso(r.DateTimeOriginal),
    hasGps: true,
  };
  // Match the existing catalogue convention: just the Model, not "Make Model"
  // (existing entries use "OnePlus 11 5G", not "OnePlus OnePlus 11 5G").
  if (r.Model) entry.cameraModel = String(r.Model).trim();
  entry.gps = { lat: r5(lat), lon: r5(lon) };
  entry.place = { city: place.city, country: place.country, display: place.display };
  newEntries.push(entry);
  provenance.push({ src: entry.src, takenAt: entry.takenAt, place: place.display, source: "EXIF" });
}

console.log(`Built ${newEntries.length} new entries.`);

// Merge: keep all non-Balkan entries unchanged, replace Balkan section with merged+sorted.
const isBalkan = (e) => e.src && e.src.startsWith("trips/2026-03-balkans-roadtrip/");
const existingBalkan = cat.filter(isBalkan);

// Find first balkan index in original to preserve insertion position.
const firstBalkanIdx = cat.findIndex(isBalkan);
const lastBalkanIdx = cat.length - 1 - [...cat].reverse().findIndex(isBalkan);

// Combine, dedupe by src. The existing 42 entries (Mar 23+ via cataloguer)
// stay untouched; the entries I'm adding/updating (Mar 11-22, Mar 28 17:34+,
// Mar 29 23:46+) will replace any earlier copies of themselves so re-running
// the script picks up bug fixes.
const newSrcs = new Set(newEntries.map((e) => e.src));
const preserved = existingBalkan.filter((e) => !newSrcs.has(e.src));
const merged = [...preserved, ...newEntries];
const added = newEntries.length;
const seen = new Set(merged.map((e) => e.src));
merged.sort((a, b) => (a.takenAt || "") < (b.takenAt || "") ? -1 : 1);

// Re-stitch: keep entries 0..firstBalkanIdx-1, then merged, then entries lastBalkanIdx+1..end
const before = cat.slice(0, firstBalkanIdx);
const after = cat.slice(lastBalkanIdx + 1);
const finalCat = [...before, ...merged, ...after];

writeFileSync(CATALOGUE, JSON.stringify(finalCat, null, 2) + "\n", "utf8");
console.log(`Wrote catalogue. Added ${added}, total balkan entries now ${merged.length}, total catalogue entries ${finalCat.length}.`);

// Write applied doc
const lines = [
  "# Balkan trip GPS backfill — applied entries",
  "",
  "Applied 2026-04-28 by `feat/balkan-trip-gps-backfill`. Backfills the previously",
  "uncatalogued outbound leg (Aarhus -> Bucharest) plus the Mar 28 Nuremberg/Kassel",
  "stops on the return. All photos in this batch carry real EXIF GPS — no",
  "itinerary-synthesised coordinates were needed.",
  "",
  "Provenance tag:",
  "",
  "- `[EXIF]`  — coordinates pulled directly from the photo's EXIF GPS.",
  "- `[ITINERARY]` — coordinates synthesised from the day's expected city centroid (none in this batch).",
  "",
  `Total new entries: ${added}.`,
  "",
  "| takenAt | src | place | provenance |",
  "| --- | --- | --- | --- |",
];
for (const p of provenance) {
  if (!seen.has(p.src)) continue;
  lines.push(`| ${p.takenAt} | ${p.src} | ${p.place} | [EXIF] |`);
}
writeFileSync(APPLIED_DOC, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${APPLIED_DOC}`);
