// scripts/.round5/reorganize-photos.mjs
// One-shot Phase 1+2 reorganization.
// - Removes flagged photos (file + catalogue entry)
// - Adds Israel 2018-04 entries from round4-extension-israel.json
// - Moves remaining files into trips/<trip>/ and personal/ subfolders
// - Rewrites the catalogue with updated `src` paths

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const PHOTOS_DIR = path.join(ROOT, "public", "photos");
const CATALOGUE_PATH = path.join(ROOT, "scripts", "photo-catalogue.json");
const ISRAEL_EXTENSION_PATH = path.join(
  ROOT,
  "scripts",
  "round4-extension-israel.json",
);

// ---- 1. Removal list ---------------------------------------------------
const REMOVALS = new Set([
  // Audit-flagged
  "IMG20240924140117.jpg",
  "IMG20250915172604.jpg",
  "IMG20250915172605.jpg",
  "IMG20250917152449.jpg",
  "IMG20240918172159.jpg",
  "IMG20230826120946.jpg",
  "IMG20250915123223.jpg",
  "sep-2025-gibraltar.jpg",
  "sep-2025-autumn-afternoon.jpg",
  // Eduard's tonight flags (visual scan)
  "IMG20260325110512.jpg", // Slovenia parking lot, plate visible
  "IMG20260325141853.jpg", // Slovenia toll plate
  "IMG20250412231403.jpg", // identifiable third party in hostel
  "IMG20250917213830.jpg", // VELO can on dinner table
  "IMG20250920200717.jpg", // Málaga garage, plate + person
  "IMG20260326205835.jpg", // gas pump + identifiable person
  "IMG20260326205838.jpg", // gas pump duplicate
  "IMG20260324135903.jpg", // Tito/Castro/Che photo (politically charged)
  "IMG20260324144251.jpg", // Tito-themed restaurant decor
  // Near-duplicates
  "IMG20260325161405.jpg",
  "IMG20260325162646_01.jpg",
  "IMG20260324112030.jpg",
  "IMG20260324153622.jpg",
  "IMG20260325113637.jpg",
  "IMG20260325121421.jpg",
  "IMG20260325110858.jpg",
  "IMG20260326165450_01.jpg",
  "IMG20260326165524.jpg",
  "IMG20260326165528.jpg",
  "IMG20260326165531.jpg",
  "IMG20260326165605.jpg",
]);

// ---- 2. Trip-folder routing -------------------------------------------
// Returns the relative subfolder (under public/photos/) for an entry,
// based on its country + YYYY-MM. Returns "personal/" for non-trip
// content. Returns null if we can't decide.
function tripFolderFor(entry) {
  const country = entry.place?.country ?? null;
  const ym = entry.takenAt ? entry.takenAt.slice(0, 7) : null;

  // Curated multi-country trips
  if (ym === "2018-03" && country === "Israel") return "trips/2018-04-israel";
  if (ym === "2025-04") {
    if (
      country === "Austria" ||
      country === "Slovakia" ||
      country === "Poland" ||
      country === "Czechia"
    ) {
      return "trips/2025-04-czechia-poland-slovakia-austria";
    }
  }
  if (ym === "2025-09") {
    if (country === "Spain" || country === "Gibraltar") {
      return "trips/2025-09-andalusia-gibraltar";
    }
  }
  if (
    (ym === "2026-03" || ym === "2026-04") &&
    [
      "Serbia",
      "Slovenia",
      "Croatia",
      "Italy",
      "Austria",
      "Germany",
    ].includes(country)
  ) {
    return "trips/2026-03-balkans-roadtrip";
  }
  if (ym === "2024-09" && country === "Albania") {
    return "trips/2024-09-albania-saranda";
  }
  if (ym === "2023-08" && country === "Romania") {
    return "trips/2023-08-romania";
  }

  // Generic per-trip: trips/YYYY-MM-country-slug
  if (country && ym) {
    const slug = country
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `trips/${ym}-${slug}`;
  }
  return null;
}

// Slug-named files (the renamed "hero" photos referenced from
// /personal/page.tsx) live under personal/.
const SLUG_TO_PERSONAL = new Set([
  "apr-2023-milan.jpg",
  "apr-2025-vienna.jpg",
  "mar-2024-spring-evening.jpg",
  "mar-2026-pula.jpg",
  "mar-2026-recent-trip.jpg",
  "may-2024-late-spring.jpg",
  "nov-2023-autumn.jpg",
  "bvb-yellow-wall-suedtribuene.jpg",
]);

// ---- 3. Main ----------------------------------------------------------
async function main() {
  const catalogueRaw = await fs.readFile(CATALOGUE_PATH, "utf-8");
  const catalogue = JSON.parse(catalogueRaw);
  const israelRaw = await fs.readFile(ISRAEL_EXTENSION_PATH, "utf-8");
  const israelEntries = JSON.parse(israelRaw);

  const beforeCount = catalogue.length;

  // Filter out removals
  const filtered = catalogue.filter((e) => !REMOVALS.has(e.src));
  const removedFromCatalogue = beforeCount - filtered.length;

  // Add Israel entries (avoid dupes if already present)
  const existingSrcs = new Set(filtered.map((e) => e.src));
  const israelToAdd = israelEntries.filter((e) => !existingSrcs.has(e.src));
  const merged = [...filtered, ...israelToAdd];

  // Sort chronologically (existing catalogue is roughly chronological)
  merged.sort((a, b) =>
    (a.takenAt ?? "").localeCompare(b.takenAt ?? ""),
  );

  // Determine new src paths and prepare moves
  const moves = []; // { fromAbs, toAbs, oldSrc, newSrc }
  const updated = merged.map((e) => {
    // Strip any existing folder prefix from src so we don't double-move.
    const filename = path.basename(e.src);
    const sub = tripFolderFor(e);
    if (!sub) return e; // leave as-is
    const newSrc = `${sub}/${filename}`;
    if (newSrc === e.src) return e; // already in place
    moves.push({
      fromAbs: path.join(PHOTOS_DIR, filename),
      toAbs: path.join(PHOTOS_DIR, sub, filename),
      oldSrc: e.src,
      newSrc,
    });
    return { ...e, src: newSrc };
  });

  // Slug-named personal-page photos: move to personal/ even though
  // they're not in the catalogue. Discover by scanning loose files.
  const looseFiles = await fs.readdir(PHOTOS_DIR);
  for (const f of looseFiles) {
    if (SLUG_TO_PERSONAL.has(f)) {
      moves.push({
        fromAbs: path.join(PHOTOS_DIR, f),
        toAbs: path.join(PHOTOS_DIR, "personal", f),
        oldSrc: f,
        newSrc: `personal/${f}`,
      });
    }
  }

  // ---- 4. Execute moves -------------------------------------------------
  const moveLog = [];
  for (const m of moves) {
    if (!existsSync(m.fromAbs)) {
      moveLog.push(`SKIP-MISSING ${m.oldSrc} (file does not exist on disk)`);
      continue;
    }
    await fs.mkdir(path.dirname(m.toAbs), { recursive: true });
    await fs.rename(m.fromAbs, m.toAbs);
    moveLog.push(`MOVED ${m.oldSrc} -> ${m.newSrc}`);
  }

  // ---- 5. Execute removals ----------------------------------------------
  const removeLog = [];
  for (const filename of REMOVALS) {
    // Removals always reference original filename (no subfolder).
    const candidates = [
      path.join(PHOTOS_DIR, filename),
      // In case a previous run already moved them into a subfolder, walk
      // recursively. This is defensive.
    ];
    let removed = false;
    for (const c of candidates) {
      if (existsSync(c)) {
        await fs.unlink(c);
        removeLog.push(`REMOVED ${path.relative(PHOTOS_DIR, c)}`);
        removed = true;
        break;
      }
    }
    if (!removed) {
      // Try recursive search
      const found = await findFile(PHOTOS_DIR, filename);
      if (found) {
        await fs.unlink(found);
        removeLog.push(`REMOVED ${path.relative(PHOTOS_DIR, found)}`);
        removed = true;
      }
    }
    if (!removed) removeLog.push(`SKIP-MISSING ${filename}`);
  }

  // ---- 6. Write catalogue ----------------------------------------------
  await fs.writeFile(
    CATALOGUE_PATH,
    JSON.stringify(updated, null, 2) + "\n",
    "utf-8",
  );

  // ---- 7. Report --------------------------------------------------------
  const report = {
    catalogue: {
      before: beforeCount,
      removed: removedFromCatalogue,
      addedIsrael: israelToAdd.length,
      after: updated.length,
    },
    moves: moveLog,
    removals: removeLog,
  };
  console.log(JSON.stringify(report, null, 2));
  await fs.writeFile(
    path.join(ROOT, "scripts", ".round5", "reorganize-report.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );
}

async function findFile(dir, filename) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const sub = await findFile(p, filename);
      if (sub) return sub;
    } else if (ent.name === filename) {
      return p;
    }
  }
  return null;
}

await main();
