#!/usr/bin/env node
/**
 * Reorganize camera-source media in G:\Photos\ root into per-year subfolders.
 *
 * Camera-source filename patterns (root-only, non-recursive):
 *   - IMG_YYYYMMDD_HHMMSS*.<ext>          (Huawei / Pixel)        → year from chars 5-8
 *   - IMG-YYYYMMDD-WAxxxx.<ext>           SKIP (done in PR #57)
 *   - IMGYYYYMMDDHHMMSS.<ext>             (OnePlus, no separators) → year from chars 4-7
 *   - <13-digit>.<ext>                    (epoch ms — Pixel)       → year from epoch
 *   - <10-digit>_<n>.<ext>                (epoch seconds + idx)    → year from epoch
 *   - IMG_NNNN.<ext>                      (older Canon, no date)   → EXIF DateTimeOriginal
 *   - Screenshot_*                        SKIP (not photographic)
 *
 * Accepted extensions: .jpg .jpeg .png .heic (case-insensitive).
 *
 * Target: G:\Photos\<YYYY>\<filename>.
 * Move-only via fs.renameSync (atomic on the same volume). NO deletes.
 *
 * Usage:
 *   node scripts/reorg-g-camera.mjs            # apply
 *   node scripts/reorg-g-camera.mjs --dry-run  # plan only, no FS writes
 *
 * Constraints (P13 + spec):
 *   - Reads G:\Photos\ root only, never recurses.
 *   - Skips P13 sensitive subfolders entirely (we don't enumerate them).
 *   - Also leaves alone: G:\Photos\WhatsApp-by-year\, .duplicates\, .review-for-delete\,
 *     existing per-year buckets, and `Poze Huawei\`.
 *   - Files where year cannot be derived (no filename signal AND no EXIF) stay at root.
 *   - Same-name destination collision → append -2, -3, ... suffix and log.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'G:\\Photos';
const LOG_PATH = path.join(__dirname, '.g-camera-reorg.log');
const EXIFTOOL = 'C:\\Users\\Eduard\\AppData\\Local\\Programs\\ExifTool\\exiftool.exe';

const dryRun = process.argv.includes('--dry-run');

// Year sanity bounds. Cameras predate 2005 in some hardware, but Eduard's
// archive realistically falls inside this window.
const MIN_YEAR = 2005;
const MAX_YEAR = 2030;

// ---- Patterns ----

// IMG_YYYYMMDD_HHMMSS… anything after, then ext.
const RE_IMG_DATE_UNDERSCORE = /^IMG_(\d{4})(\d{2})(\d{2})_\d{6}.*\.(jpe?g|png|heic)$/i;
// IMGYYYYMMDDHHMMSS (no separator).
const RE_IMG_DATE_NOSEP = /^IMG(\d{4})(\d{2})(\d{2})\d{6}.*\.(jpe?g|png|heic)$/i;
// 13-digit epoch ms.
const RE_EPOCH_MS = /^(\d{13})\.(jpe?g|png|heic)$/i;
// 10-digit epoch seconds with _<n> suffix.
const RE_EPOCH_S_IDX = /^(\d{10})_\d+\.(jpe?g|png|heic)$/i;
// IMG_NNNN (4 digits) — no date in name, EXIF needed.
const RE_IMG_4DIGIT = /^IMG_\d{4}\.(jpe?g|png|heic)$/i;
// Already-done WhatsApp pattern → SKIP marker.
const RE_WHATSAPP = /^IMG-\d{8}-WA\d+/i;
// Screenshots → SKIP marker.
const RE_SCREENSHOT = /^Screenshot[_ ]/i;

// Cache exif results just in case duplicates appear.
const exifCache = new Map();

function yearFromEpoch(epochValue, isMs) {
  const ms = isMs ? epochValue : epochValue * 1000;
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  return y;
}

function readExifYear(absPath) {
  if (exifCache.has(absPath)) return exifCache.get(absPath);
  let year = null;
  let reason = null;
  try {
    const out = execFileSync(
      EXIFTOOL,
      ['-j', '-DateTimeOriginal', '-CreateDate', '-ModifyDate', absPath],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    );
    const parsed = JSON.parse(out);
    const rec = Array.isArray(parsed) && parsed.length ? parsed[0] : null;
    const candidates = [
      rec && rec.DateTimeOriginal,
      rec && rec.CreateDate,
      rec && rec.ModifyDate,
    ];
    for (const c of candidates) {
      if (typeof c !== 'string') continue;
      const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(c);
      if (!m) continue;
      const y = parseInt(m[1], 10);
      if (y >= MIN_YEAR && y <= MAX_YEAR) {
        year = y;
        break;
      }
    }
    if (year === null) reason = 'exif-no-date';
  } catch (err) {
    reason = `exif-fail:${err.code || err.message || 'unknown'}`;
  }
  const result = year !== null ? { year } : { year: null, reason: reason || 'exif-empty' };
  exifCache.set(absPath, result);
  return result;
}

function classify(filename, absPath) {
  if (RE_WHATSAPP.test(filename)) {
    return { kind: 'skip', reason: 'whatsapp-already-bucketed' };
  }
  if (RE_SCREENSHOT.test(filename)) {
    return { kind: 'skip', reason: 'screenshot' };
  }

  let m = RE_IMG_DATE_UNDERSCORE.exec(filename);
  if (m) {
    const y = parseInt(m[1], 10);
    if (y >= MIN_YEAR && y <= MAX_YEAR) {
      return { kind: 'move', year: y, source: 'filename:img_date_underscore' };
    }
    return { kind: 'skip', reason: 'year-out-of-range' };
  }

  m = RE_IMG_DATE_NOSEP.exec(filename);
  if (m) {
    const y = parseInt(m[1], 10);
    if (y >= MIN_YEAR && y <= MAX_YEAR) {
      return { kind: 'move', year: y, source: 'filename:img_date_nosep' };
    }
    return { kind: 'skip', reason: 'year-out-of-range' };
  }

  m = RE_EPOCH_MS.exec(filename);
  if (m) {
    const y = yearFromEpoch(parseInt(m[1], 10), true);
    if (y !== null) return { kind: 'move', year: y, source: 'filename:epoch_ms' };
    return { kind: 'skip', reason: 'epoch-out-of-range' };
  }

  m = RE_EPOCH_S_IDX.exec(filename);
  if (m) {
    const y = yearFromEpoch(parseInt(m[1], 10), false);
    if (y !== null) return { kind: 'move', year: y, source: 'filename:epoch_s_idx' };
    return { kind: 'skip', reason: 'epoch-out-of-range' };
  }

  if (RE_IMG_4DIGIT.test(filename)) {
    const r = readExifYear(absPath);
    if (r.year !== null) return { kind: 'move', year: r.year, source: 'exif:img_4digit' };
    return { kind: 'skip', reason: r.reason || 'exif-unavailable' };
  }

  // No filename signal at all → out of scope (spec says SKIP).
  return { kind: 'skip', reason: 'no-camera-pattern' };
}

function listRoot() {
  return fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(line) {
  if (dryRun) return;
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

function pickAvailableTarget(yearDir, filename) {
  const direct = path.join(yearDir, filename);
  if (!fs.existsSync(direct)) return { newPath: direct, suffix: 0 };
  const ext = path.extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  for (let i = 2; i <= 99; i += 1) {
    const candidate = path.join(yearDir, `${stem}-${i}${ext}`);
    if (!fs.existsSync(candidate)) return { newPath: candidate, suffix: i };
  }
  return null;
}

function main() {
  const startedAt = new Date();
  console.log(`[reorg-g-camera] start ${startedAt.toISOString()} dryRun=${dryRun}`);
  console.log(`[reorg-g-camera] source=${SOURCE_ROOT}`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[reorg-g-camera] FATAL: ${SOURCE_ROOT} does not exist`);
    process.exit(1);
  }

  if (!dryRun) {
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(
        LOG_PATH,
        `# g-camera-reorg log — TSV: timestamp\told_path\tnew_path\tfilename\tyear\tsource\tcollision_suffix\n`,
        'utf8',
      );
    }
    appendLog(`# run start ${startedAt.toISOString()}`);
  }

  const entries = listRoot();
  console.log(`[reorg-g-camera] root files=${entries.length}`);

  const counts = new Map();
  const skipReasons = new Map();
  const moved = [];
  const skipped = [];
  const collisions = [];
  const failed = [];

  let processed = 0;
  for (const filename of entries) {
    processed += 1;
    if (processed % 1000 === 0) {
      console.log(`[reorg-g-camera] progress ${processed}/${entries.length}`);
    }

    const oldPath = path.join(SOURCE_ROOT, filename);
    const cls = classify(filename, oldPath);

    if (cls.kind === 'skip') {
      skipped.push({ filename, reason: cls.reason });
      skipReasons.set(cls.reason, (skipReasons.get(cls.reason) || 0) + 1);
      continue;
    }

    const yearDir = path.join(SOURCE_ROOT, String(cls.year));
    const pick = pickAvailableTarget(yearDir, filename);
    if (!pick) {
      failed.push({ filename, reason: 'too-many-collisions', oldPath });
      appendLog(`# FAIL too-many-collisions\t${oldPath}\t${yearDir}\t${filename}`);
      continue;
    }
    const { newPath, suffix } = pick;

    try {
      ensureDir(yearDir);
      if (!dryRun) {
        fs.renameSync(oldPath, newPath);
      }
      moved.push({ filename, year: cls.year, oldPath, newPath, source: cls.source, suffix });
      counts.set(cls.year, (counts.get(cls.year) || 0) + 1);
      if (suffix > 0) {
        collisions.push({ filename, oldPath, newPath, suffix });
      }
      appendLog(
        `${new Date().toISOString()}\t${oldPath}\t${newPath}\t${filename}\t${cls.year}\t${cls.source}\t${suffix}`,
      );
    } catch (err) {
      failed.push({ filename, reason: err.code || err.message, oldPath, newPath });
      appendLog(`# FAIL ${err.code || 'ERR'}\t${oldPath}\t${newPath}\t${err.message}`);
    }
  }

  const finishedAt = new Date();
  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    rootFiles: entries.length,
    moved: moved.length,
    skipped: skipped.length,
    collisionsRenamed: collisions.length,
    failed: failed.length,
    perYear: Object.fromEntries(
      [...counts.entries()].sort((a, b) => a[0] - b[0]),
    ),
    skipReasons: Object.fromEntries(
      [...skipReasons.entries()].sort((a, b) => b[1] - a[1]),
    ),
    failedDetail: failed,
    collisionsDetail: collisions,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    appendLog(
      `# run end ${finishedAt.toISOString()} moved=${moved.length} skipped=${skipped.length} failed=${failed.length} collisions=${collisions.length}`,
    );
  }

  return summary;
}

main();
