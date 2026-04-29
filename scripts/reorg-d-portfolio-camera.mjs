#!/usr/bin/env node
/**
 * Reorganize camera-source media in D:\Portfolio\poze\ root into per-year subfolders.
 *
 * Source: D:\Portfolio\poze\<filename> (root only — no subfolder recursion).
 * Target: D:\Portfolio\poze\<YYYY>\<filename>.
 *
 * This is the D-side mirror of the G:\Photos\ year-bucket reorg approach. The
 * G-side WhatsApp reorg (PR #57, scripts/reorg-g-whatsapp.mjs) bucketed the
 * `IMG-YYYYMMDD-WAxxxx.jpg` family into G:\Photos\WhatsApp-by-year\<year>\. This
 * script targets the *camera-source* family (Android Camera, Huawei, Pixel,
 * 13-digit epoch-ms gallery exports) at the D root and lands them directly in
 * D:\Portfolio\poze\<year>\<filename>, per the D-side spec.
 *
 * The D-side WhatsApp pattern (`IMG-YYYYMMDD-WAxxxx.jpg`) is deliberately
 * left at root for now — only the G:\ side received the WhatsApp reorg.
 *
 * Move-only (fs.renameSync — atomic on the same volume). No deletes. Reversible
 * via the log file at scripts/.d-portfolio-camera-reorg.log.
 *
 * Patterns matched (all case-insensitive on extension):
 *   - IMG_YYYYMMDD_HHMMSS[suffix].jpg|jpeg|png|mp4    Android Camera / GCam
 *   - IMGYYYYMMDDHHMMSS[suffix].jpg|jpeg|png          Huawei / older OEMs
 *   - PXL_YYYYMMDD_HHMMSS[suffix].jpg|jpeg|mp4        Pixel
 *   - MVIMG_YYYYMMDD_HHMMSS[suffix].jpg               Motion Photo (Android)
 *   - VID_YYYYMMDD_HHMMSS[suffix].mp4                 Android Camera video
 *   - <13-digit-epoch-ms>.jpg|jpeg|jfif|png|mp4       Android gallery export
 *
 * Out of scope (left at root):
 *   - IMG-YYYYMMDD-WAxxxx.jpg                         WhatsApp (G-side only)
 *   - DSC_NNNN.JPG, ISO-date, freeform names         no embedded date
 *
 * Strict constraints:
 *   - Skip every P13 sensitive subfolder (mirrors quarantine-g-bulk-delete.mjs).
 *   - Skip already-quarantined .review-for-delete\.
 *   - Skip pre-existing year folders if they exist at the root (don't recurse).
 *   - Move-only. No deletes anywhere. No copies (rename only on same volume).
 *
 * Usage:
 *   node scripts/reorg-d-portfolio-camera.mjs              # apply
 *   node scripts/reorg-d-portfolio-camera.mjs --dry-run    # plan only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'D:\\Portfolio\\poze';
const LOG_PATH = path.join(__dirname, '.d-portfolio-camera-reorg.log');
const SUMMARY_PATH = path.join(__dirname, '.d-portfolio-camera-reorg.summary.json');

const dryRun = process.argv.includes('--dry-run');

// Patterns. Each captures Year/Month/Day groups for sanity checking and bucketing.
// All match the BASENAME only (root level — no path separators).
const PATTERNS = [
  {
    id: 'android-camera',
    label: 'IMG_YYYYMMDD_HHMMSS[ms][suffix].jpg|jpeg|png|mp4',
    // Allow optional 3-digit millisecond extension after HHMMSS (Pixel/GCam HDR
    // form: IMG_20221021_103729087_HDR.jpg). Suffix start broadened to include
    // `~` (Windows collision-rename) and `-` in addition to `_` and `(`.
    re: /^IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:\d{3})?(?:[_(~-].*)?\.(jpe?g|png|mp4)$/i,
  },
  {
    id: 'huawei-imgYMDhms',
    label: 'IMGYYYYMMDDHHMMSS[suffix].jpg|jpeg|png',
    re: /^IMG(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:[_(~-].*)?\.(jpe?g|png)$/i,
  },
  {
    id: 'pixel',
    label: 'PXL_YYYYMMDD_HHMMSS[suffix].jpg|jpeg|mp4',
    re: /^PXL_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:[_(].*)?\.(jpe?g|mp4)$/i,
  },
  {
    id: 'motion-photo',
    label: 'MVIMG_YYYYMMDD_HHMMSS[suffix].jpg',
    re: /^MVIMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:[_(].*)?\.jpe?g$/i,
  },
  {
    id: 'android-video',
    label: 'VID_YYYYMMDD_HHMMSS[suffix].mp4',
    re: /^VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:[_(].*)?\.mp4$/i,
  },
  {
    id: 'epoch-ms',
    label: '<13-digit-epoch-ms>.jpg|jpeg|jfif|png|mp4',
    re: /^(\d{13})\.(jpe?g|jfif|png|mp4)$/i,
    epoch: true,
  },
];

// WhatsApp pattern — explicitly skipped per spec (G-only reorg).
const WHATSAPP_RE = /^IMG-\d{8}-WA\d+(?:[_(].*)?\.jpe?g$/i;

// P13 sensitive blocklist + carve-outs. Since we operate on root non-recursively,
// these primarily protect against accidental reads — a root-only scan won't
// descend into them, but we explicitly skip them as defence-in-depth in case
// listRoot ever returns a directory entry we'd misinterpret.
const SENSITIVE_DIRNAMES = new Set([
  'cv + cl photos',
  'driving license photos',
  'id photos',
  'passport photos',
  'residence permit photos',
  'camera roll iphone backup',
  'whatsapp', // D:\Portfolio\poze\Whatsapp\
  'important documents',
]);

const CARVE_OUT_DIRNAMES = new Set([
  '.review-for-delete', // PR #62 quarantine tree — leave alone
  '.duplicates', // PR #61 dedup tree
]);

function listRootFiles() {
  return fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
}

function classify(filename) {
  // Hard skip: WhatsApp pattern stays at root (D-side only, per spec).
  if (WHATSAPP_RE.test(filename)) {
    return { skip: 'whatsapp-pattern' };
  }
  for (const pat of PATTERNS) {
    const m = pat.re.exec(filename);
    if (!m) continue;
    let year, month, day;
    if (pat.epoch) {
      const ms = parseInt(m[1], 10);
      // 13-digit epoch-ms range sanity: 2001-09-09 .. 2286-11-20.
      // Constrain to plausible photo range 2009..currentYear+1.
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return null;
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
    } else {
      year = parseInt(m[1], 10);
      month = parseInt(m[2], 10);
      day = parseInt(m[3], 10);
    }
    // Sanity gates.
    if (year < 2005 || year > 2030) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return { patternId: pat.id, year, month, day };
  }
  return null;
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

let logStream = null;
function openLog() {
  if (dryRun) return;
  const isNew = !fs.existsSync(LOG_PATH);
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'a', encoding: 'utf8' });
  if (isNew) {
    logStream.write(
      `# d-portfolio-camera-reorg log — TSV: timestamp\told_path\tnew_path\tfilename\tyear\tpattern\n`,
    );
  }
}
function writeLog(line) {
  if (dryRun || !logStream) return;
  logStream.write(line + '\n');
}

function main() {
  const startedAt = new Date();
  console.log(
    `[reorg-d-portfolio-camera] start ${startedAt.toISOString()} dryRun=${dryRun}`,
  );
  console.log(`[reorg-d-portfolio-camera] source=${SOURCE_ROOT}`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(
      `[reorg-d-portfolio-camera] FATAL: ${SOURCE_ROOT} does not exist (drive offline?). Aborting.`,
    );
    // Soft exit: write a summary so the doc generator can still report cleanly.
    const summary = {
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      aborted: true,
      reason: 'source-root-missing',
      sourceRoot: SOURCE_ROOT,
    };
    if (!dryRun) {
      fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
    }
    process.exit(2);
  }

  openLog();
  writeLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun}`);

  // Defensive enumeration of subdirs (purely for visibility — listRootFiles
  // already filters to files only).
  const allEntries = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true });
  const subdirs = allEntries.filter((d) => d.isDirectory()).map((d) => d.name);
  const sensitiveDirs = subdirs.filter((d) =>
    SENSITIVE_DIRNAMES.has(d.toLowerCase()),
  );
  const carveOutDirs = subdirs.filter((d) =>
    CARVE_OUT_DIRNAMES.has(d.toLowerCase()),
  );
  console.log(
    `[reorg-d-portfolio-camera] subdirs total=${subdirs.length} sensitive=${sensitiveDirs.length} carveOut=${carveOutDirs.length}`,
  );

  const entries = listRootFiles();
  console.log(`[reorg-d-portfolio-camera] root files=${entries.length}`);

  const counts = new Map();
  const patternCounts = new Map();
  const moved = [];
  const skippedNoMatch = [];
  const skippedWhatsApp = [];
  const unmoved = [];

  for (const filename of entries) {
    const cls = classify(filename);
    if (!cls) {
      skippedNoMatch.push(filename);
      continue;
    }
    if (cls.skip === 'whatsapp-pattern') {
      skippedWhatsApp.push(filename);
      continue;
    }

    const oldPath = path.join(SOURCE_ROOT, filename);
    const yearDir = path.join(SOURCE_ROOT, String(cls.year));
    const newPath = path.join(yearDir, filename);

    // Sanity: never move into a sensitive or carve-out directory. (Year names
    // are 4-digit; the sets above are folder names — no overlap is possible,
    // but we re-check defensively.)
    const yearLower = String(cls.year).toLowerCase();
    if (
      SENSITIVE_DIRNAMES.has(yearLower) ||
      CARVE_OUT_DIRNAMES.has(yearLower)
    ) {
      unmoved.push({
        filename,
        reason: 'target-dir-blocklisted',
        oldPath,
        newPath,
      });
      writeLog(
        `# SKIP target-dir-blocklisted\t${oldPath}\t${newPath}\t${filename}\t${cls.year}\t${cls.patternId}`,
      );
      continue;
    }

    if (fs.existsSync(newPath)) {
      unmoved.push({
        filename,
        reason: 'target-exists',
        oldPath,
        newPath,
      });
      writeLog(
        `# SKIP target-exists\t${oldPath}\t${newPath}\t${filename}\t${cls.year}\t${cls.patternId}`,
      );
      continue;
    }

    try {
      ensureDir(yearDir);
      if (!dryRun) {
        fs.renameSync(oldPath, newPath);
      }
      moved.push({ filename, year: cls.year, patternId: cls.patternId, oldPath, newPath });
      counts.set(cls.year, (counts.get(cls.year) || 0) + 1);
      patternCounts.set(
        cls.patternId,
        (patternCounts.get(cls.patternId) || 0) + 1,
      );
      writeLog(
        `${new Date().toISOString()}\t${oldPath}\t${newPath}\t${filename}\t${cls.year}\t${cls.patternId}`,
      );
    } catch (err) {
      unmoved.push({
        filename,
        reason: err.code || err.message,
        oldPath,
        newPath,
      });
      writeLog(
        `# FAIL ${err.code || 'ERR'}\t${oldPath}\t${newPath}\t${filename}\t${cls.year}\t${cls.patternId}\t${err.message}`,
      );
    }
  }

  const finishedAt = new Date();
  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    sourceRoot: SOURCE_ROOT,
    rootFiles: entries.length,
    rootSubdirsTotal: subdirs.length,
    rootSubdirsSensitive: sensitiveDirs,
    rootSubdirsCarveOut: carveOutDirs,
    moved: moved.length,
    skippedWhatsApp: skippedWhatsApp.length,
    skippedNoMatch: skippedNoMatch.length,
    unmoved: unmoved.length,
    perYear: Object.fromEntries(
      [...counts.entries()].sort((a, b) => a[0] - b[0]),
    ),
    perPattern: Object.fromEntries(
      [...patternCounts.entries()].sort((a, b) => b[1] - a[1]),
    ),
    unmovedDetail: unmoved.slice(0, 50),
    unmovedTotal: unmoved.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  writeLog(
    `# run end ${finishedAt.toISOString()} moved=${moved.length} unmoved=${unmoved.length} skippedWhatsApp=${skippedWhatsApp.length} skippedNoMatch=${skippedNoMatch.length}`,
  );
  if (logStream) logStream.end();

  if (!dryRun) {
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
  }

  return summary;
}

main();
