// usage:
//   node scripts/enrich-photo-captions.mjs            # dry-run, prints summary
//   node scripts/enrich-photo-captions.mjs --write    # write captions back to catalogue
//
// Backfills the optional `caption` field on every entry in
// scripts/photo-catalogue.json. Existing fields are preserved verbatim;
// only `caption` is added (or refreshed when --force is passed).
//
// Caption format:
//   - Pexels stock: "Landmark · City, Country · Month Year"
//                   (Month Year is omitted when takenAt is null)
//   - Personal:     "City, Country · Month Year"
//
// See scripts/photo-captions.mjs for the pure derivation logic and
// scripts/photo-captions.test.mjs for the unit tests.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { derivePhotoCaption } from "./photo-captions.mjs";

const CATALOGUE_PATH = join(process.cwd(), "scripts", "photo-catalogue.json");

function parseArgs(argv) {
  const args = { write: false, force: false };
  for (const a of argv.slice(2)) {
    if (a === "--write") args.write = true;
    else if (a === "--force") args.force = true;
    else if (a === "-h" || a === "--help") args.help = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(
      "usage: node scripts/enrich-photo-captions.mjs [--write] [--force]",
    );
    process.exit(0);
  }

  const raw = readFileSync(CATALOGUE_PATH, "utf-8");
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries)) {
    throw new Error("photo-catalogue.json must be a JSON array");
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let unable = 0;
  const samples = [];

  for (const entry of entries) {
    const had = typeof entry.caption === "string" && entry.caption.length > 0;
    if (had && !args.force) {
      skipped++;
      continue;
    }
    const caption = derivePhotoCaption(entry);
    if (!caption) {
      unable++;
      continue;
    }
    if (had) {
      if (entry.caption !== caption) updated++;
      else skipped++;
    } else {
      added++;
    }
    entry.caption = caption;
    if (samples.length < 8 && !had) {
      samples.push({ src: entry.src, caption });
    }
  }

  console.log(`catalogue entries: ${entries.length}`);
  console.log(`captions added:    ${added}`);
  console.log(`captions updated:  ${updated}`);
  console.log(`captions skipped:  ${skipped}`);
  console.log(`unable to derive:  ${unable}`);
  if (samples.length > 0) {
    console.log("\nSample new captions:");
    for (const s of samples) {
      console.log(`  ${s.src}`);
      console.log(`    → ${s.caption}`);
    }
  }

  if (args.write) {
    // Preserve trailing newline + 2-space indent to match the existing
    // catalogue file's formatting.
    const out = JSON.stringify(entries, null, 2) + "\n";
    writeFileSync(CATALOGUE_PATH, out);
    console.log(`\nwrote ${CATALOGUE_PATH}`);
  } else {
    console.log("\n(dry run — pass --write to persist)");
  }
}

main();
