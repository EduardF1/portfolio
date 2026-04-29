// Apply visual content cleanup v2 removals.
// Reads scripts/.visual-cleanup-v2.ndjson, for each "remove" decision:
//   1. git mv public/photos/<src> -> scripts/.removed-non-artistic/<src> (without "trips/" prefix)
//   2. drop catalogue entry from scripts/photo-catalogue.json
//   3. drop attribution row from docs/photo-attributions.md (if Pexels)
// Writes scripts/.visual-cleanup-v2-apply.log with details.
//
// CAP at 50 removals (sanity).

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";

const REMOVALS_CAP = 50;
const NDJSON_PATH = "scripts/.visual-cleanup-v2.ndjson";
const CATALOGUE_PATH = "scripts/photo-catalogue.json";
const ATTRIB_PATH = "docs/photo-attributions.md";
const REMOVED_ROOT = "scripts/.removed-non-artistic";
const PHOTOS_ROOT = "public/photos";
const LOG_PATH = "scripts/.visual-cleanup-v2-apply.log";

function gitMv(from, to) {
  execFileSync("git", ["mv", from, to], { stdio: "inherit" });
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

const records = readFileSync(NDJSON_PATH, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim().length > 0)
  .map((l) => JSON.parse(l));

const removals = records
  .filter((r) => r.decision === "remove")
  .sort((a, b) => b.topScore - a.topScore);

console.log(`removals queued: ${removals.length}`);

if (removals.length > REMOVALS_CAP) {
  console.error(
    `removals (${removals.length}) exceed cap ${REMOVALS_CAP}; aborting`
  );
  process.exit(2);
}

const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8"));
const removeSet = new Set(removals.map((r) => r.src));
const beforeCount = catalogue.length;
const newCatalogue = catalogue.filter((e) => !removeSet.has(e.src));
const droppedCatalogue = beforeCount - newCatalogue.length;
console.log(`catalogue entries: ${beforeCount} -> ${newCatalogue.length} (-${droppedCatalogue})`);

const log = [];

// Move files
for (const r of removals) {
  // r.src = "trips/2024-09-albania-saranda/IMG20240924140038.jpg"
  // public/photos/<src> -> scripts/.removed-non-artistic/<src minus 'trips/' prefix>
  const fromRel = posix.join(PHOTOS_ROOT, r.src);
  // Strip leading "trips/" so the removed tree mirrors the original layout under removed-root.
  const stripped = r.src.startsWith("trips/") ? r.src.slice("trips/".length) : r.src;
  const toRel = posix.join(REMOVED_ROOT, stripped);

  ensureDir(dirname(toRel));

  if (!existsSync(fromRel)) {
    console.warn(`MISSING source ${fromRel}, skipping`);
    log.push(`MISSING ${fromRel}`);
    continue;
  }

  if (existsSync(toRel)) {
    console.warn(`destination already exists ${toRel}, skipping move`);
    log.push(`EXISTS  ${toRel}`);
    continue;
  }

  console.log(`mv  ${fromRel} -> ${toRel}  (top=${r.topScore} ${r.topLabel})`);
  gitMv(fromRel, toRel);
  log.push(
    `MOVED ${fromRel} -> ${toRel}  top=${r.topScore} label="${r.topLabel}"`
  );
}

// Update catalogue
writeFileSync(
  CATALOGUE_PATH,
  JSON.stringify(newCatalogue, null, 2) + "\n",
  "utf8"
);
log.push(`CATALOGUE entries ${beforeCount} -> ${newCatalogue.length}`);

// Update attributions for Pexels removals only
const pexelsRemovals = removals.filter((r) => r.isPexels);
if (pexelsRemovals.length > 0) {
  const attribPaths = new Set(
    pexelsRemovals.map((r) => `public/photos/${r.src}`)
  );
  const lines = readFileSync(ATTRIB_PATH, "utf8").split(/\r?\n/);
  const kept = [];
  let dropped = 0;
  for (const line of lines) {
    let drop = false;
    for (const p of attribPaths) {
      if (line.includes("`" + p + "`")) {
        drop = true;
        break;
      }
    }
    if (drop) {
      dropped += 1;
      log.push(`ATTRIB drop: ${line.slice(0, 120)}`);
    } else {
      kept.push(line);
    }
  }
  writeFileSync(ATTRIB_PATH, kept.join("\n"), "utf8");
  console.log(`attributions: dropped ${dropped} rows for ${pexelsRemovals.length} pexels removals`);
  if (dropped !== pexelsRemovals.length) {
    console.warn(
      `WARN attribution row count mismatch (dropped=${dropped}, expected=${pexelsRemovals.length})`
    );
  }
}

writeFileSync(LOG_PATH, log.join("\n") + "\n", "utf8");
console.log(`done. log -> ${LOG_PATH}`);
