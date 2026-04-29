// Build catalogue entries for the Hungary/Germany cities backfill task.
//
// Adds (under trips/2026-03-balkans-roadtrip/):
//   - 3 Budapest entries (Mar 14 evening, Mar 15 night cluster — Vecsés-area
//     coords, displayed as Budapest per the existing rename policy).
//   - 5 Dachau/München entries (Mar 28 daytime — KZ Gedenkstätte cluster).
//   - 1 Nuremberg entry (Mar 28 evening — own camera).
//
// All carry real EXIF GPS — coordinates supplied inline (read once via the
// existing extract-exif pipeline, recorded in scripts/.hu-de-cities/picks.json).
// The Balkan section is sorted by takenAt ASC, matching the existing convention.

import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "C:/Users/Eduard/Projects/portfolio/.claude/worktrees/agent-ae34db8fdc7069ccb";
const CATALOGUE = `${ROOT}/scripts/photo-catalogue.json`;

const r5 = (n) => Math.round(n * 1e5) / 1e5;

// 9 own-camera entries, sourced from /tmp/hu-de-scan/picks.json (and verified
// against G:\Photos with copy-resize.ps1). All Mar 14-28 2026, OnePlus 11 5G.
const newEntries = [
  // --- Budapest cluster (Mar 14 22:22 + Mar 15 00:38, Vecsés airport suburb,
  //     displayed as Budapest per PR #39 policy) ---
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260314222230.jpg",
    takenAt: "2026-03-14T22:22:30Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(47.4125916666667), lon: r5(19.2475583333333) },
    place: { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260315003840.jpg",
    takenAt: "2026-03-15T00:38:40Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(47.4125527777778), lon: r5(19.2475166666667) },
    place: { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260315003841.jpg",
    takenAt: "2026-03-15T00:38:41Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(47.4125527777778), lon: r5(19.2475166666667) },
    place: { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" },
  },
  // --- Dachau / München cluster (Mar 28 12:04 - 15:40 — KZ-Gedenkstätte
  //     Dachau, ~17km NW of Munich centre, within the Munich metro area) ---
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328120403.jpg",
    takenAt: "2026-03-28T12:04:03Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(48.2555833333333), lon: r5(11.4386138888889) },
    place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328120453.jpg",
    takenAt: "2026-03-28T12:04:53Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(48.2555694444444), lon: r5(11.4386194444444) },
    place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328135135.jpg",
    takenAt: "2026-03-28T13:51:35Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(48.268375), lon: r5(11.4667861111111) },
    place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328151221.jpg",
    takenAt: "2026-03-28T15:12:21Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(48.2720805555556), lon: r5(11.4687111111111) },
    place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" },
  },
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328154040.jpg",
    takenAt: "2026-03-28T15:40:40Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(48.2689166666667), lon: r5(11.4670777777778) },
    place: { city: "Dachau", country: "Germany", display: "Dachau, Germany" },
  },
  // --- Nuremberg (Mar 28 17:34, drive-through stop on the way north) ---
  {
    src: "trips/2026-03-balkans-roadtrip/IMG20260328173447_01.jpg",
    takenAt: "2026-03-28T17:34:47Z",
    hasGps: true,
    cameraModel: "OnePlus 11 5G",
    gps: { lat: r5(49.4314583333333), lon: r5(11.1145083333333) },
    place: { city: "Nuremberg", country: "Germany", display: "Nuremberg, Germany" },
  },
];

const cat = JSON.parse(readFileSync(CATALOGUE, "utf8"));

const isBalkan = (e) => e.src && e.src.startsWith("trips/2026-03-balkans-roadtrip/");
const firstBalkanIdx = cat.findIndex(isBalkan);
const lastBalkanIdx = cat.length - 1 - [...cat].reverse().findIndex(isBalkan);
const existingBalkan = cat.slice(firstBalkanIdx, lastBalkanIdx + 1).filter(isBalkan);

// Dedupe by src — re-running this script overwrites prior entries for these 9 files.
const newSrcs = new Set(newEntries.map((e) => e.src));
const preserved = existingBalkan.filter((e) => !newSrcs.has(e.src));
const merged = [...preserved, ...newEntries].sort(
  (a, b) => (a.takenAt || "") < (b.takenAt || "") ? -1 : 1
);

const before = cat.slice(0, firstBalkanIdx);
const after = cat.slice(lastBalkanIdx + 1);
const finalCat = [...before, ...merged, ...after];

writeFileSync(CATALOGUE, JSON.stringify(finalCat, null, 2) + "\n", "utf8");
console.log(
  `Wrote catalogue. Added ${newEntries.length} own-camera entries (Budapest 3, Dachau 5, Nuremberg 1).`
);
console.log(`Balkan section now has ${merged.length} entries; total catalogue ${finalCat.length}.`);
