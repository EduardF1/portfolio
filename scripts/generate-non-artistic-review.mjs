#!/usr/bin/env node
/**
 * Generate the non-artistic-flagged review doc and stage moves.
 *
 * Inputs:
 *   - scripts/.non-artistic-scan.ndjson  (output of classify-non-artistic.py)
 *
 * Actions:
 *   1. For every record with decision === "review-remove":
 *        a. Move the JPG with `git mv` from public/photos/trips/<slug>/<file>.jpg
 *           to scripts/.flagged-non-artistic/<slug>/<file>.jpg.
 *        b. Generate a 400px-wide thumbnail at
 *           scripts/.flagged-non-artistic/.thumbs/<slug>__<file>.jpg.
 *   2. Write docs/non-artistic-flagged.md with one section per category and
 *      one row per flagged photo (top label, score, thumbnail, restore cmd).
 *
 * Usage:
 *   node scripts/generate-non-artistic-review.mjs \
 *        --scan scripts/.non-artistic-scan.ndjson \
 *        --out docs/non-artistic-flagged.md
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import process from "node:process";

import sharp from "sharp";

const REPO_ROOT = process.cwd();
const TRIPS_ROOT = join(REPO_ROOT, "public", "photos");
const FLAGGED_ROOT = join(REPO_ROOT, "scripts", ".flagged-non-artistic");
const THUMBS_ROOT = join(FLAGGED_ROOT, ".thumbs");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    scan: "scripts/.non-artistic-scan.ndjson",
    out: "docs/non-artistic-flagged.md",
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scan") out.scan = args[++i];
    else if (args[i] === "--out") out.out = args[++i];
  }
  return out;
}

function readScan(path) {
  const raw = readFileSync(path, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function gitMv(from, to) {
  ensureDir(dirname(to));
  execFileSync("git", ["mv", from, to], { stdio: "inherit" });
}

async function makeThumb(srcAbs, thumbAbs) {
  ensureDir(dirname(thumbAbs));
  await sharp(srcAbs)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(thumbAbs);
}

function categoryFromLabel(label) {
  if (label.includes("gas pump")) return "Gas pump / fuel station";
  if (label.includes("parking lot")) return "Parking lot / parked cars";
  if (label.includes("store front")) return "Store front / shopping centre";
  if (label.includes("road sign") || label.includes("street sign"))
    return "Road sign / street sign";
  if (label.includes("trash bin")) return "Trash bin / dumpster";
  if (label.includes("hotel lobby") || label.includes("indoor mundane"))
    return "Mundane indoor (hotel lobby etc.)";
  if (label.includes("transit") || label.includes("train platform"))
    return "Transit station / platform";
  if (label.includes("receipt") || label.includes("document"))
    return "Receipt / document";
  return "Other non-artistic";
}

async function main() {
  const opts = parseArgs();
  const scanPath = resolve(REPO_ROOT, opts.scan);
  const outPath = resolve(REPO_ROOT, opts.out);

  if (!existsSync(scanPath)) {
    console.error(`scan file not found: ${scanPath}`);
    process.exit(2);
  }

  const records = readScan(scanPath);
  const flagged = records.filter((r) => r.decision === "review-remove");
  console.log(
    `loaded ${records.length} records; ${flagged.length} flagged review-remove`,
  );

  ensureDir(FLAGGED_ROOT);
  ensureDir(THUMBS_ROOT);

  // Group by category for the report
  const byCategory = new Map();

  for (const rec of flagged) {
    const srcRel = rec.src; // e.g. "trips/2018-03-israel/IMG_xxx.jpg"
    const srcAbs = join(TRIPS_ROOT, srcRel);

    if (!existsSync(srcAbs)) {
      console.warn(`skip missing file: ${srcRel}`);
      continue;
    }

    const flaggedRel = join("scripts", ".flagged-non-artistic", srcRel);
    const flaggedAbs = join(REPO_ROOT, flaggedRel);

    // git mv the original
    const srcGitRel = posix.join("public", "photos", srcRel);
    const dstGitRel = flaggedRel.split(/\\|\//).join("/");
    gitMv(srcGitRel, dstGitRel);

    // Thumbnail (we use the moved file as source)
    const thumbName = srcRel.replace(/\//g, "__");
    const thumbAbs = join(THUMBS_ROOT, thumbName);
    await makeThumb(flaggedAbs, thumbAbs);

    const cat = categoryFromLabel(rec.topLabel);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push({
      src: srcRel,
      flaggedRel: dstGitRel,
      thumbRel: posix.join(
        "..",
        "scripts",
        ".flagged-non-artistic",
        ".thumbs",
        thumbName,
      ),
      topLabel: rec.topLabel,
      topScore: rec.topScore,
      category: cat,
    });
  }

  // Sort categories alphabetically; within each, sort by score desc.
  const categories = [...byCategory.keys()].sort();
  for (const cat of categories) {
    byCategory.get(cat).sort((a, b) => b.topScore - a.topScore);
  }

  const totalFlagged = flagged.length;
  const lines = [];
  lines.push("# Non-artistic photos flagged for removal (CLIP zero-shot)");
  lines.push("");
  lines.push(
    "Generated by `scripts/classify-non-artistic.py` + " +
      "`scripts/generate-non-artistic-review.mjs`. Photos here have already " +
      "been **moved** from `public/photos/trips/` to " +
      "`scripts/.flagged-non-artistic/` via `git mv`. The catalogue entries " +
      "in `scripts/photo-catalogue.json` are intentionally **left intact** " +
      "until Eduard signs off — `validate-photos.mjs` will report them as " +
      "`missingFiles`. That is expected.",
  );
  lines.push("");
  lines.push("## How to review");
  lines.push("");
  lines.push(
    "Tick the box to **confirm removal** (file stays in " +
      "`scripts/.flagged-non-artistic/`; a follow-up commit will delete " +
      "the catalogue entry too). Untick to **restore** — run the listed " +
      "`git mv` to put the file back, then drop the row from this doc.",
  );
  lines.push("");
  lines.push(`- Total flagged: **${totalFlagged}**`);
  lines.push(`- Categories: ${categories.length}`);
  lines.push("");
  lines.push("## Counts by category");
  lines.push("");
  lines.push("| Category | Count |");
  lines.push("| --- | ---: |");
  for (const cat of categories) {
    lines.push(`| ${cat} | ${byCategory.get(cat).length} |`);
  }
  lines.push("");

  // Top 5 highest confidence overall
  const topFive = [...flagged]
    .sort((a, b) => b.topScore - a.topScore)
    .slice(0, 5);
  lines.push("## Top 5 highest-confidence flags");
  lines.push("");
  lines.push("Eduard: review these first.");
  lines.push("");
  lines.push("| Rank | src | Top label | Score |");
  lines.push("| ---: | --- | --- | ---: |");
  topFive.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | \`${r.src}\` | ${r.topLabel} | ${r.topScore.toFixed(3)} |`,
    );
  });
  lines.push("");

  for (const cat of categories) {
    const items = byCategory.get(cat);
    lines.push(`## ${cat} (${items.length})`);
    lines.push("");
    for (const it of items) {
      const restoreCmd = `git mv ${it.flaggedRel} public/photos/${it.src}`;
      lines.push(`### \`${it.src}\``);
      lines.push("");
      lines.push(`- Top label: **${it.topLabel}**`);
      lines.push(`- Score: ${it.topScore.toFixed(3)}`);
      lines.push(`- Thumbnail: ![thumb](${it.thumbRel})`);
      lines.push(`- [ ] confirm remove`);
      lines.push(
        "- Restore: \\\n" + `  \`${restoreCmd}\``,
      );
      lines.push("");
    }
  }

  ensureDir(dirname(outPath));
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
