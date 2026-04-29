#!/usr/bin/env node
/**
 * Reorganize Huawei-era photos from G:\Poze\Poze Huawei\ into per-year buckets
 * at the parent G:\Poze\ level.
 *
 * Source: G:\Poze\Poze Huawei\**\<file>      (recursive — subfolders allowed)
 * Target: G:\Poze\<YYYY>\<filename>          (flat per-year buckets, NOT
 *                                             G:\Poze\Poze Huawei\<year>\)
 *
 * Year detection priority:
 *   1) Filename pattern  IMG_YYYYMMDD_HHMMSS*.jpg / .jpeg / .png
 *   2) Filename pattern  IMG-YYYYMMDD-* (WhatsApp-style, defensive)
 *   3) Filename pattern  YYYYMMDD_HHMMSS* / YYYY-MM-DD*
 *   4) Fallback to EXIF DateTimeOriginal via exiftool, if available
 *
 * Move-only (fs.renameSync — atomic on the same volume). No deletes.
 * Reversible via the log file at scripts/.g-poze-huawei-reorg.log.
 *
 * Usage:
 *   node scripts/reorg-g-poze-huawei.mjs            # apply
 *   node scripts/reorg-g-poze-huawei.mjs --dry-run  # plan only, no FS writes
 *
 * Constraints:
 *   - Move-only, no deletes anywhere.
 *   - Only operate inside G:\Poze\Poze Huawei\ tree; the only writes outside it
 *     are into G:\Poze\<year>\ siblings.
 *   - Skip files where year cannot be determined; they stay in the source
 *     directory and are recorded in the unresolved list.
 *   - On filename collision with an existing target file, append "-huawei-NNN"
 *     suffix before the extension.
 *   - The empty G:\Poze\Poze Huawei\ folder is left in place after the run.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POZE_ROOT = 'G:\\Poze';
const SOURCE_ROOT = path.join(POZE_ROOT, 'Poze Huawei');
const LOG_PATH = path.join(__dirname, '.g-poze-huawei-reorg.log');

const dryRun = process.argv.includes('--dry-run');

// Subfolders inside SOURCE_ROOT that are P13-sensitive and must never be moved.
// (None known to exist today — defensive list. Any subfolder name listed here
// is fully skipped, recursion stops at its boundary.)
const SENSITIVE_SUBDIRS = new Set([
  // e.g. "ID Photos", "Passport photos" — none currently in Poze Huawei but
  // listed defensively in case a future move drops one in here.
  'ID Photos',
  'Passport photos',
  'Driving license photos',
  'Residence permit photos',
  'CV + CL photos',
]);

const PATTERNS = [
  // IMG_20170120_125646.jpg, IMG_20170120_125646_1.jpg, IMG_20170120_125646-edited.png
  {
    name: 'IMG_YYYYMMDD_HHMMSS',
    re: /^IMG[_-](\d{4})(\d{2})(\d{2})[_-]\d{6}/i,
  },
  // YYYYMMDD_HHMMSS.jpg
  {
    name: 'YYYYMMDD_HHMMSS',
    re: /^(\d{4})(\d{2})(\d{2})[_-]\d{6}/,
  },
  // YYYY-MM-DD anywhere at start
  {
    name: 'YYYY-MM-DD',
    re: /^(\d{4})-(\d{2})-(\d{2})/,
  },
  // IMG-YYYYMMDD-WAxxxx.jpg (defensive — WhatsApp drops should already be
  // handled by reorg-g-whatsapp, but a stray one here gets bucketed too)
  {
    name: 'IMG-YYYYMMDD-WA',
    re: /^IMG-(\d{4})(\d{2})(\d{2})-WA\d+/i,
  },
];

function classifyByFilename(filename) {
  for (const p of PATTERNS) {
    const m = p.re.exec(filename);
    if (!m) continue;
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    if (year < 2000 || year > 2030) continue;
    if (month < 1 || month > 12) continue;
    if (day < 1 || day > 31) continue;
    return { year, source: `pattern:${p.name}` };
  }
  return null;
}

let exifAvailable = null;
function checkExifAvailable() {
  if (exifAvailable !== null) return exifAvailable;
  try {
    execFileSync('exiftool', ['-ver'], { stdio: ['ignore', 'pipe', 'ignore'] });
    exifAvailable = true;
  } catch {
    exifAvailable = false;
  }
  return exifAvailable;
}

function classifyByExif(absPath) {
  if (!checkExifAvailable()) return null;
  try {
    const out = execFileSync(
      'exiftool',
      ['-s', '-s', '-s', '-DateTimeOriginal', '-CreateDate', absPath],
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' },
    );
    // EXIF date format: "YYYY:MM:DD HH:MM:SS"
    const m = /^(\d{4}):(\d{2}):(\d{2})/m.exec(out);
    if (!m) return null;
    const year = parseInt(m[1], 10);
    if (year < 2000 || year > 2030) return null;
    return { year, source: 'exif:DateTimeOriginal' };
  } catch {
    return null;
  }
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SENSITIVE_SUBDIRS.has(e.name)) {
        out.push({ kind: 'sensitive-skip', dir, name: e.name });
        continue;
      }
      out.push(...walk(path.join(dir, e.name)));
    } else if (e.isFile()) {
      out.push({ kind: 'file', dir, name: e.name });
    }
  }
  return out;
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(line) {
  if (dryRun) return;
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

function pickNonCollidingTarget(yearDir, filename) {
  const initial = path.join(yearDir, filename);
  if (!fs.existsSync(initial)) return { path: initial, suffix: null };
  const ext = path.extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  for (let i = 1; i <= 999; i += 1) {
    const tag = `-huawei-${String(i).padStart(3, '0')}`;
    const candidate = path.join(yearDir, `${stem}${tag}${ext}`);
    if (!fs.existsSync(candidate)) return { path: candidate, suffix: tag };
  }
  throw new Error(`Could not find non-colliding target for ${filename}`);
}

function main() {
  const startedAt = new Date();
  console.log(`[reorg-g-poze-huawei] start ${startedAt.toISOString()} dryRun=${dryRun}`);
  console.log(`[reorg-g-poze-huawei] source=${SOURCE_ROOT}`);
  console.log(`[reorg-g-poze-huawei] target=${POZE_ROOT}\\<year>\\`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[reorg-g-poze-huawei] FATAL: ${SOURCE_ROOT} does not exist`);
    process.exit(1);
  }

  if (!dryRun) {
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(
        LOG_PATH,
        `# g-poze-huawei-reorg log — TSV: timestamp\told_path\tnew_path\tfilename\tyear\tdetection\n`,
        'utf8',
      );
    }
    appendLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun}`);
  }

  const entries = walk(SOURCE_ROOT);
  const files = entries.filter((e) => e.kind === 'file');
  const sensitiveSkips = entries.filter((e) => e.kind === 'sensitive-skip');
  console.log(`[reorg-g-poze-huawei] discovered files=${files.length} sensitiveSkippedDirs=${sensitiveSkips.length}`);

  const yearCounts = new Map();
  const patternCounts = new Map();
  const moved = [];
  const collisionSuffixed = [];
  const unresolved = [];
  const failed = [];

  for (const f of files) {
    const oldPath = path.join(f.dir, f.name);
    let cls = classifyByFilename(f.name);
    if (!cls) cls = classifyByExif(oldPath);

    if (!cls) {
      unresolved.push({ filename: f.name, oldPath, reason: 'no-year-from-filename-or-exif' });
      appendLog(`# UNRESOLVED no-year\t${oldPath}`);
      continue;
    }

    const yearDir = path.join(POZE_ROOT, String(cls.year));
    let target;
    try {
      target = pickNonCollidingTarget(yearDir, f.name);
    } catch (err) {
      failed.push({ filename: f.name, oldPath, reason: err.message });
      appendLog(`# FAIL collision-exhausted\t${oldPath}\t${err.message}`);
      continue;
    }

    try {
      ensureDir(yearDir);
      if (!dryRun) {
        fs.renameSync(oldPath, target.path);
      }
      moved.push({
        filename: f.name,
        finalName: path.basename(target.path),
        year: cls.year,
        source: cls.source,
        oldPath,
        newPath: target.path,
        collisionSuffix: target.suffix,
      });
      yearCounts.set(cls.year, (yearCounts.get(cls.year) || 0) + 1);
      patternCounts.set(cls.source, (patternCounts.get(cls.source) || 0) + 1);
      if (target.suffix) {
        collisionSuffixed.push({
          original: f.name,
          renamed: path.basename(target.path),
          year: cls.year,
        });
      }
      appendLog(
        `${new Date().toISOString()}\t${oldPath}\t${target.path}\t${f.name}\t${cls.year}\t${cls.source}`,
      );
    } catch (err) {
      failed.push({ filename: f.name, oldPath, reason: err.code || err.message });
      appendLog(`# FAIL ${err.code || 'ERR'}\t${oldPath}\t${target.path}\t${err.message}`);
    }
  }

  const finishedAt = new Date();
  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    sourceRoot: SOURCE_ROOT,
    targetParent: POZE_ROOT,
    discovered: files.length,
    sensitiveSkippedDirs: sensitiveSkips.map((s) => path.join(s.dir, s.name)),
    moved: moved.length,
    unresolved: unresolved.length,
    failed: failed.length,
    collisionSuffixed: collisionSuffixed.length,
    perYear: Object.fromEntries(
      [...yearCounts.entries()].sort((a, b) => a[0] - b[0]),
    ),
    perPattern: Object.fromEntries(
      [...patternCounts.entries()].sort((a, b) => b[1] - a[1]),
    ),
    unresolvedDetail: unresolved,
    failedDetail: failed,
    collisionSuffixedDetail: collisionSuffixed,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    appendLog(
      `# run end ${finishedAt.toISOString()} moved=${moved.length} unresolved=${unresolved.length} failed=${failed.length} collisionSuffixed=${collisionSuffixed.length}`,
    );
  }

  return summary;
}

main();
