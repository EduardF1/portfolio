// usage:
//   node scripts/generate-inpaint-review.mjs --before <dir> --after <dir> --output <md>
//   node scripts/generate-inpaint-review.mjs --before public/photos/trips --after scripts/.inpaint-staging --output docs/inpaint-sweep-results.md
//   node scripts/generate-inpaint-review.mjs --before <dir> --after <dir> --output <md> --thumbs public/photos/_inpaint-thumbs
//
// Builds a side-by-side review document for the people-removal (inpaint) sweep.
// For each photo present in BOTH the before-tree (`public/photos/trips/<slug>/<file>.jpg`)
// AND the after-tree (same relative layout under `scripts/.inpaint-staging/`), it:
//   1. Generates a 600px-wide thumbnail of each via Sharp (writes to --thumbs).
//   2. Emits a Markdown table per trip slug with [filename, before-thumb, after-thumb,
//      accept checkbox, reject checkbox] rows.
//   3. Prepends a top-level summary (total / by-trip counts / decision tally).
//
// Eduard reviews the doc inline — ticks `[x]` next to accept, leaves blanks on rejects,
// then a follow-up agent copies the staged JPGs over the originals for the accepted set.
//
// Conventions follow scripts/build-photo-catalogue.mjs and scripts/build-tech-demos.mjs:
// top-level `parseArgs`, named exports for testability, process.cwd()-relative paths.
//
// ---------------------------------------------------------------------------
// SWEEP HARNESS CONTRACT (consumed by a separate agent that wires the pipeline)
// ---------------------------------------------------------------------------
// Inputs:
//   - `scripts/inpaint-targets.json`            : prescan manifest from a prior agent.
//                                                 Shape: { targets: [{ src, slug, ... }] }.
//   - `public/photos/trips/<slug>/<file>.jpg`   : original photos (READ-ONLY).
//
// Pipeline (run by the harness agent, NOT by this script):
//   for each target in scripts/inpaint-targets.json:
//     python scripts/inpaint-people.py --in <src> --out scripts/.inpaint-staging/<src>
//
// Then this script runs:
//   node scripts/generate-inpaint-review.mjs \
//     --before public/photos/trips \
//     --after  scripts/.inpaint-staging \
//     --output docs/inpaint-sweep-results.md
//
// Eduard reviews docs/inpaint-sweep-results.md in any GitHub-flavoured Markdown viewer
// (thumbnails are linked via relative paths). For each row he ticks `[x]` next to
// "Accept" or leaves both unchecked / ticks "Reject".
//
// Acceptance pass (a future agent): for each accepted row, copy
// scripts/.inpaint-staging/<rel> over public/photos/trips/<rel>, then commit.
// Rejected rows stay in staging for manual fixup or stock-replacement.
//
// Constraints honoured by this script:
//   - READ-ONLY on input photos (the originals + staging set).
//   - Only writes thumbnails into --thumbs and the markdown doc to --output.
//   - Zero new dependencies — Sharp is already available transitively (Next.js).
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DEFAULT_THUMBS = "public/photos/_inpaint-thumbs";
const THUMB_MAX_WIDTH = 600;
const THUMB_QUALITY = 70;
const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Treat the script's parent directory as repo root so relative output paths
// in the markdown stay stable regardless of where the user invoked node from.
const REPO_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

const HELP = `Usage:
  node scripts/generate-inpaint-review.mjs --before <dir> --after <dir> --output <md> [--thumbs <dir>]

Required:
  --before <dir>   Directory containing the original photos. Expected layout:
                   <dir>/<trip-slug>/<filename>.jpg (e.g. public/photos/trips).
  --after  <dir>   Directory containing the inpainted output, mirroring --before
                   (e.g. scripts/.inpaint-staging).
  --output <md>    Markdown file to write (e.g. docs/inpaint-sweep-results.md).

Optional:
  --thumbs <dir>   Where to write 600px-wide thumbnails. Defaults to
                   ${DEFAULT_THUMBS}. The directory is gitignored.
  -h, --help       Show this help.

The review doc emits one table per trip slug. Each row has Accept/Reject
checkboxes Eduard ticks during sign-off. See the SWEEP HARNESS CONTRACT
header in this script for the surrounding pipeline.
`;

/**
 * Parse process argv into a typed options object.
 * @param {string[]} argv
 * @returns {{ before: string | null, after: string | null, output: string | null, thumbs: string, help?: boolean }}
 */
export function parseArgs(argv) {
  /** @type {{ before: string | null, after: string | null, output: string | null, thumbs: string, help?: boolean }} */
  const opts = {
    before: null,
    after: null,
    output: null,
    thumbs: DEFAULT_THUMBS,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--before") opts.before = argv[++i] ?? null;
    else if (a === "--after") opts.after = argv[++i] ?? null;
    else if (a === "--output") opts.output = argv[++i] ?? null;
    else if (a === "--thumbs") opts.thumbs = argv[++i] ?? DEFAULT_THUMBS;
    else if (a === "-h" || a === "--help") opts.help = true;
  }
  return opts;
}

/**
 * Convert any platform path into POSIX form for Markdown links.
 * @param {string} p
 */
export function toPosix(p) {
  return p.split(/[\\/]/).join("/");
}

/**
 * Recursively list `*.jpg|jpeg|png|webp` files under `root`. Returns paths
 * RELATIVE to `root` so they can be matched by name across before/after trees.
 * @param {string} root
 * @returns {string[]}
 */
export function listImages(root) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(root)) return out;
  /** @param {string} dir */
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      // Skip dotfiles / dotdirs — keeps thumbnail caches and OS junk out.
      if (name.startsWith(".")) continue;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        const lower = name.toLowerCase();
        const dot = lower.lastIndexOf(".");
        if (dot >= 0 && SUPPORTED_EXT.has(lower.slice(dot))) {
          out.push(relative(root, full));
        }
      }
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Compute the matching set between `before` and `after` lists. Anything in
 * `after` that is NOT in `before` is reported as "orphan" so Eduard can spot
 * a stale staging file from a previous run.
 *
 * @param {string[]} beforeList
 * @param {string[]} afterList
 * @returns {{ pairs: string[], orphans: string[] }}
 */
export function pairImages(beforeList, afterList) {
  const beforeSet = new Set(beforeList);
  const pairs = afterList.filter((p) => beforeSet.has(p)).sort();
  const orphans = afterList.filter((p) => !beforeSet.has(p)).sort();
  return { pairs, orphans };
}

/**
 * Split a relative path "<slug>/<file>.jpg" or "<slug>/<sub>/<file>.jpg" into
 * `{ slug, filename }` where slug is always the first path segment. If the
 * file is at the root we group it under "(root)".
 *
 * @param {string} rel
 */
export function splitSlug(rel) {
  const norm = toPosix(rel);
  const idx = norm.indexOf("/");
  if (idx < 0) return { slug: "(root)", filename: norm };
  return { slug: norm.slice(0, idx), filename: norm.slice(idx + 1) };
}

/**
 * Group a list of pairs by their first-segment slug. Returns a sorted map.
 * @param {string[]} pairs
 */
export function groupBySlug(pairs) {
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const rel of pairs) {
    const { slug } = splitSlug(rel);
    const list = groups.get(slug) ?? [];
    list.push(rel);
    groups.set(slug, list);
  }
  // Sort slugs and the files inside each slug for deterministic output.
  const sorted = new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
  for (const [k, v] of sorted) sorted.set(k, v.sort());
  return sorted;
}

/**
 * Build a deterministic thumbnail filename. Two photos in different trips can
 * share an `IMG_xxx.jpg` basename, so we prefix with the slug. Suffix marks
 * before vs after.
 *
 * @param {string} rel       Relative path inside the source tree.
 * @param {"before"|"after"} side
 */
export function thumbnailName(rel, side) {
  const flat = toPosix(rel).replace(/[\\/]/g, "__");
  const dot = flat.lastIndexOf(".");
  const stem = dot >= 0 ? flat.slice(0, dot) : flat;
  return `${stem}.${side}.jpg`;
}

// ---------------------------------------------------------------------------
// I/O glue (Sharp + filesystem)
// ---------------------------------------------------------------------------

/**
 * Resize `inputPath` to a JPEG at most THUMB_MAX_WIDTH px wide and write it to
 * `outputPath`. Skips work if the destination already exists and is newer than
 * the source — keeps repeat runs fast.
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<{ written: boolean, skipped: boolean }>}
 */
export async function generateThumbnail(inputPath, outputPath) {
  if (!existsSync(inputPath)) {
    throw new Error(`Source image missing: ${inputPath}`);
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  if (existsSync(outputPath)) {
    const inMtime = statSync(inputPath).mtimeMs;
    const outMtime = statSync(outputPath).mtimeMs;
    if (outMtime >= inMtime) return { written: false, skipped: true };
  }
  await sharp(inputPath)
    .rotate() // honour EXIF orientation so portraits don't render sideways.
    .resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
    .toFile(outputPath);
  return { written: true, skipped: false };
}

/**
 * Render the markdown report.
 *
 * @param {{
 *   pairs: string[],
 *   orphans: string[],
 *   thumbsRel: string,
 *   beforeRoot: string,
 *   afterRoot: string,
 *   outputDir: string,
 * }} ctx
 * @returns {string}
 */
export function renderMarkdown(ctx) {
  const { pairs, orphans, thumbsRel, beforeRoot, afterRoot, outputDir } = ctx;
  const groups = groupBySlug(pairs);
  const lines = [];

  lines.push("# Inpaint Sweep — Review");
  lines.push("");
  lines.push("People-removal review for the inpaint sweep across `public/photos/trips/`.");
  lines.push("Tick `[x]` for **Accept**, leave both blank or tick **Reject**, then hand back to the agent.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total inpainted pairs: **${pairs.length}**`);
  lines.push(`- Trips touched: **${groups.size}**`);
  lines.push(`- Orphaned staging files (no matching original): **${orphans.length}**`);
  lines.push(`- Before tree: \`${toPosix(beforeRoot)}\``);
  lines.push(`- After tree: \`${toPosix(afterRoot)}\``);
  // The default thumbs dir is gitignored; custom locations may not be.
  const thumbsNote = toPosix(thumbsRel) === DEFAULT_THUMBS ? " (gitignored)" : "";
  lines.push(`- Thumbnail cache: \`${toPosix(thumbsRel)}\`${thumbsNote}`);
  lines.push("");
  if (groups.size > 0) {
    lines.push("### Per-trip counts");
    lines.push("");
    lines.push("| Trip slug | Photos in this sweep |");
    lines.push("|---|---:|");
    for (const [slug, list] of groups) {
      lines.push(`| \`${slug}\` | ${list.length} |`);
    }
    lines.push("");
  }
  lines.push("### Decision tally (auto-counted from this doc)");
  lines.push("");
  lines.push("After ticking, run `grep -c '\\[x\\] Accept' <doc>` and `grep -c '\\[x\\] Reject' <doc>`");
  lines.push("to confirm the totals match what you expect before the apply step.");
  lines.push("");

  if (orphans.length > 0) {
    lines.push("## Orphaned staging files");
    lines.push("");
    lines.push("These files exist under the after-tree but have no matching original in the");
    lines.push("before-tree. Likely leftovers from a previous sweep. Investigate before merging.");
    lines.push("");
    for (const o of orphans) {
      lines.push(`- \`${toPosix(o)}\``);
    }
    lines.push("");
  }

  lines.push("## Pairs by trip");
  lines.push("");

  for (const [slug, list] of groups) {
    lines.push(`### ${slug}`);
    lines.push("");
    lines.push("| Filename | Before | After | Sign-off |");
    lines.push("|---|---|---|---|");
    for (const rel of list) {
      const { filename } = splitSlug(rel);
      const beforeThumb = posix.join(
        toRelFromOutputDir(outputDir, join(thumbsRel, thumbnailName(rel, "before"))),
      );
      const afterThumb = posix.join(
        toRelFromOutputDir(outputDir, join(thumbsRel, thumbnailName(rel, "after"))),
      );
      const accept = "`[ ]` Accept";
      const reject = "`[ ]` Reject";
      lines.push(
        `| \`${filename}\` | ![before](${beforeThumb}) | ![after](${afterThumb}) | ${accept}<br>${reject} |`,
      );
    }
    lines.push("");
  }

  if (groups.size === 0) {
    lines.push("_No pairs found — either the staging tree is empty or the before/after roots don't match._");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Compute a POSIX relative path from the directory of the output markdown to a
 * target file. Used so embedded images render in any GitHub-flavoured
 * Markdown previewer regardless of where the doc lives.
 *
 * @param {string} outputDir   Absolute or repo-rooted directory of the .md file.
 * @param {string} target      Repo-rooted path to the asset.
 */
export function toRelFromOutputDir(outputDir, target) {
  const rel = relative(outputDir, target);
  return toPosix(rel);
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

/**
 * Run the whole pipeline.
 * @param {ReturnType<typeof parseArgs>} opts
 */
export async function run(opts) {
  if (opts.help || !opts.before || !opts.after || !opts.output) {
    process.stdout.write(HELP);
    if (opts.help) return { ok: true, helped: true };
    process.stderr.write("\nERROR: --before, --after, --output are all required.\n");
    process.exit(1);
  }
  const beforeRoot = resolve(REPO_ROOT, opts.before);
  const afterRoot = resolve(REPO_ROOT, opts.after);
  const thumbsAbs = resolve(REPO_ROOT, opts.thumbs);
  const outputAbs = resolve(REPO_ROOT, opts.output);
  const outputDir = dirname(outputAbs);

  if (!existsSync(beforeRoot)) {
    process.stderr.write(`ERROR: --before path does not exist: ${beforeRoot}\n`);
    process.exit(1);
  }
  if (!existsSync(afterRoot)) {
    process.stderr.write(`ERROR: --after path does not exist: ${afterRoot}\n`);
    process.exit(1);
  }

  const beforeList = listImages(beforeRoot);
  const afterList = listImages(afterRoot);
  const { pairs, orphans } = pairImages(beforeList, afterList);

  console.log(`Found ${pairs.length} pair(s), ${orphans.length} orphan(s).`);

  let written = 0;
  let skipped = 0;
  for (const rel of pairs) {
    const beforeIn = join(beforeRoot, rel);
    const afterIn = join(afterRoot, rel);
    const beforeOut = join(thumbsAbs, thumbnailName(rel, "before"));
    const afterOut = join(thumbsAbs, thumbnailName(rel, "after"));
    const r1 = await generateThumbnail(beforeIn, beforeOut);
    const r2 = await generateThumbnail(afterIn, afterOut);
    written += Number(r1.written) + Number(r2.written);
    skipped += Number(r1.skipped) + Number(r2.skipped);
  }
  console.log(`Thumbnails: ${written} written, ${skipped} skipped (already up-to-date).`);

  const markdown = renderMarkdown({
    pairs,
    orphans,
    thumbsRel: opts.thumbs,
    beforeRoot: opts.before,
    afterRoot: opts.after,
    outputDir,
  });
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputAbs, markdown, "utf8");
  console.log(`Wrote review doc -> ${toPosix(relative(REPO_ROOT, outputAbs))}`);
  return { ok: true, pairs: pairs.length, orphans: orphans.length, written, skipped };
}

// Only execute when invoked directly (not when imported by tests).
const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  run(parseArgs(process.argv.slice(2))).catch((err) => {
    process.stderr.write(`ERROR: ${err?.message ?? err}\n`);
    process.exit(1);
  });
}
