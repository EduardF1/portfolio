#!/usr/bin/env node
/**
 * Reorganize the residual loose files at G:\Photos\ root into per-year buckets,
 * AND re-cluster the year-root singletons into existing year-cluster folders.
 *
 * Successor to scripts/reorg-g-camera.mjs (PR #?? camera reorg) — picks up
 * the 9,084 root files that didn't match the camera-pattern regex AND the
 * 523 year-root singletons that didn't cluster.
 *
 * --- Phase 1 ---
 * For each photo-extension file at G:\Photos\ root:
 *   1. Try EXIF DateTimeOriginal/CreateDate → year (high confidence).
 *   2. Try filename year regex (19xx|20xx anywhere) → year (high confidence).
 *   3. Try epoch-ms in filename (≥10-digit numeric prefix) → year (high confidence).
 *   4. Fallback: file mtime → year (low confidence, sent to Unsorted/).
 * High-confidence files move to G:\Photos\<year>\<filename>.
 * Low-confidence (mtime-only) files move to G:\Photos\Unsorted\<filename>.
 *
 * --- Phase 2 ---
 * After Phase 1, walk each G:\Photos\<year>\ year root, find files NOT inside
 * a <Cluster>\ subfolder (singletons). For each singleton:
 *   - Read EXIF DateTimeOriginal + GPS.
 *   - Find an existing cluster in the same year whose date range covers ±1 day
 *     AND whose GPS bbox covers ±200 km.
 *   - If a match: move singleton into the cluster.
 *   - Otherwise: leave at year root (genuinely orphan).
 *
 * Move-only via fs.renameSync (atomic same-volume). NO deletes.
 *
 * Usage:
 *   node scripts/reorg-g-photos-root-extended.mjs            # apply both phases
 *   node scripts/reorg-g-photos-root-extended.mjs --dry-run  # plan only
 *   node scripts/reorg-g-photos-root-extended.mjs --phase=1  # phase 1 only
 *   node scripts/reorg-g-photos-root-extended.mjs --phase=2  # phase 2 only
 *
 * Constraints:
 *   - Skip P13 sensitive folders (CV+CL, Driving license, ID, Passport, Residence).
 *   - Don't touch .duplicates\, .review-for-delete\, Screenshots\, WhatsApp-by-year\.
 *   - Don't touch G:\duplicates-to_be_deleted\ (off-tree).
 *   - Cap moves at 15,000 (sanity).
 *   - Photo extensions only: .jpg .jpeg .png .heic .raw .dng .bmp .gif .webp.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'G:\\Photos';
const UNSORTED_DIR = path.join(SOURCE_ROOT, 'Unsorted');
const LOG_PATH = path.join(__dirname, '.g-photos-root-extended.log');
const EXIFTOOL = 'C:\\Users\\Eduard\\AppData\\Local\\Programs\\ExifTool\\exiftool.exe';

const dryRun = process.argv.includes('--dry-run');
const phaseArg = (() => {
  const m = process.argv.find((a) => a.startsWith('--phase='));
  return m ? parseInt(m.slice('--phase='.length), 10) : 0; // 0 = both
})();

const MIN_YEAR = 2005;
const MAX_YEAR = 2030;
const MOVE_CAP = 15000;

// Photo extensions accepted (case-insensitive).
const PHOTO_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.raw', '.dng', '.bmp', '.gif', '.webp',
]);

// Top-level folders to skip when iterating root (Phase 1 should not move INTO
// these; Phase 2 should not iterate them as year folders).
const SKIP_TOP_LEVEL = new Set([
  'WhatsApp-by-year',
  '.duplicates',
  '.review-for-delete',
  'Screenshots',
  'Browser',
  'X',
  'Instagram',
  'CV + CL photos',
  'CV + CL Photos',
  'CV+CL photos',
  'Driving license photos',
  'ID Photos',
  'Passport photos',
  'Residence permit photos',
  'Ha_Photos',
  'Hamburg_Photos',
  'Poze Huawei',
  'Poze_A5_landscape',
  'backup thumbnails',
  'faber-feedback',
  'New folder',
  'Unsorted',
]);

const YEAR_RE = /^(199\d|20[0-3]\d)$/;

// ---- Helpers ----

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(line) {
  if (dryRun) return;
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

function pickAvailableTarget(destDir, filename) {
  const direct = path.join(destDir, filename);
  if (!fs.existsSync(direct)) return { newPath: direct, suffix: 0 };
  const ext = path.extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  for (let i = 2; i <= 99; i += 1) {
    const candidate = path.join(destDir, `${stem}-${i}${ext}`);
    if (!fs.existsSync(candidate)) return { newPath: candidate, suffix: i };
  }
  return null;
}

function yearFromEpoch(epochValue, isMs) {
  const ms = isMs ? epochValue : epochValue * 1000;
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  return y;
}

function parseExifDate(str) {
  if (!str || typeof str !== 'string') return null;
  const m = /^(\d{4}):(\d{2}):(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?/.exec(str);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const t = Date.UTC(+y, +mo - 1, +d, +(h || 0), +(mi || 0), +(s || 0));
  if (Number.isNaN(t)) return null;
  return t;
}

// Cache for batch-read EXIF results: filename → {year, takenAt, lat, lon}.
const exifBatchCache = new Map();

// Read EXIF for the entire root NON-recursively in one exiftool call. Excludes
// subfolders by passing each file individually via stdin '-@' style isn't worth
// the complexity — we use a simpler approach: pass the directory + -i to ignore
// all subdirs. exiftool actually doesn't recurse by default, so we just pass
// the directory.
function preloadRootExif(rootDir) {
  console.log(`[exif] batch-loading root EXIF from ${rootDir}...`);
  const t0 = Date.now();
  // exiftool by default does NOT recurse — passing a directory reads only its
  // top-level files. We restrict to photo extensions to skip the .nomedia /
  // .database_uuid type files.
  const result = spawnSync(
    EXIFTOOL,
    [
      '-DateTimeOriginal',
      '-CreateDate',
      '-ModifyDate',
      '-GPSLatitude',
      '-GPSLongitude',
      '-n',
      '-j',
      '-q',
      '-fast2',
      '-ext', 'jpg',
      '-ext', 'jpeg',
      '-ext', 'png',
      '-ext', 'heic',
      '-ext', 'raw',
      '-ext', 'dng',
      '-ext', 'bmp',
      '-ext', 'gif',
      '-ext', 'webp',
      rootDir,
    ],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, windowsHide: true },
  );
  if (result.status !== 0 && !result.stdout) {
    console.error(`[exif] batch read failed: ${result.stderr?.slice(0, 500)}`);
    return;
  }
  const json = result.stdout?.trim() || '[]';
  let arr;
  try { arr = JSON.parse(json); } catch (err) {
    console.error(`[exif] JSON parse failed: ${err.message}`);
    return;
  }
  for (const row of arr) {
    if (!row.SourceFile) continue;
    const filename = path.basename(row.SourceFile);
    let year = null;
    let takenAt = null;
    for (const key of ['DateTimeOriginal', 'CreateDate', 'ModifyDate']) {
      const v = row[key];
      const t = parseExifDate(v);
      if (t !== null) {
        const y = new Date(t).getUTCFullYear();
        if (y >= MIN_YEAR && y <= MAX_YEAR) {
          year = y;
          takenAt = t;
          break;
        }
      }
    }
    const lat = typeof row.GPSLatitude === 'number' ? row.GPSLatitude : null;
    const lon = typeof row.GPSLongitude === 'number' ? row.GPSLongitude : null;
    exifBatchCache.set(filename, { year, takenAt, lat, lon });
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[exif] loaded EXIF for ${exifBatchCache.size} root files in ${dt}s`);
}

function readExifSingle(absPath) {
  const filename = path.basename(absPath);
  if (exifBatchCache.has(filename)) return exifBatchCache.get(filename);
  // Fallback: per-file exec (only used if not pre-loaded).
  try {
    const out = execFileSync(
      EXIFTOOL,
      ['-j', '-n', '-DateTimeOriginal', '-CreateDate', '-ModifyDate',
        '-GPSLatitude', '-GPSLongitude', absPath],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    const parsed = JSON.parse(out);
    const rec = Array.isArray(parsed) && parsed.length ? parsed[0] : null;
    if (!rec) return { year: null, takenAt: null, lat: null, lon: null };
    let year = null;
    let takenAt = null;
    for (const key of ['DateTimeOriginal', 'CreateDate', 'ModifyDate']) {
      const v = rec[key];
      const t = parseExifDate(v);
      if (t !== null) {
        const y = new Date(t).getUTCFullYear();
        if (y >= MIN_YEAR && y <= MAX_YEAR) {
          year = y;
          takenAt = t;
          break;
        }
      }
    }
    const lat = typeof rec.GPSLatitude === 'number' ? rec.GPSLatitude : null;
    const lon = typeof rec.GPSLongitude === 'number' ? rec.GPSLongitude : null;
    return { year, takenAt, lat, lon };
  } catch {
    return { year: null, takenAt: null, lat: null, lon: null };
  }
}

// Batch-read EXIF for an entire directory (non-recursive). Returns Map<filename, {takenAt,lat,lon}>.
function readExifBatch(dir) {
  const result = spawnSync(
    EXIFTOOL,
    [
      '-DateTimeOriginal',
      '-CreateDate',
      '-GPSLatitude',
      '-GPSLongitude',
      '-n',
      '-j',
      '-q',
      '-fast2',
      dir,
    ],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true },
  );
  if (result.status !== 0 && !result.stdout) return new Map();
  const json = result.stdout?.trim() || '[]';
  let arr;
  try { arr = JSON.parse(json); } catch { return new Map(); }
  const map = new Map();
  for (const row of arr) {
    if (!row.SourceFile) continue;
    const filename = path.basename(row.SourceFile);
    const takenAt = parseExifDate(row.DateTimeOriginal) || parseExifDate(row.CreateDate);
    const lat = typeof row.GPSLatitude === 'number' ? row.GPSLatitude : null;
    const lon = typeof row.GPSLongitude === 'number' ? row.GPSLongitude : null;
    map.set(filename, { takenAt, lat, lon });
  }
  return map;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---- Phase 1 classification ----

// Strict "year somewhere in name" — but only if surrounded by non-digits (so we
// don't grab the middle of a 13-digit epoch). Returns first plausible year.
function yearFromFilename(filename) {
  // Try pattern: year preceded/followed by non-digit (or string-edge).
  const re = /(?:^|[^\d])(19\d{2}|20[0-3]\d)(?:[^\d]|$)/g;
  let m;
  while ((m = re.exec(filename)) !== null) {
    const y = parseInt(m[1], 10);
    if (y >= MIN_YEAR && y <= MAX_YEAR) return y;
  }
  return null;
}

// 10-13 digit numeric prefix → epoch (s or ms).
function yearFromEpochPrefix(filename) {
  // Strip any leading dot (e.g. ".0.jpg" — not numeric prefix).
  const m = /^(\d{10,13})(?:[._-]|$)/.exec(filename);
  if (!m) return null;
  const digits = m[1];
  if (digits.length === 13) return yearFromEpoch(parseInt(digits, 10), true);
  if (digits.length === 10) return yearFromEpoch(parseInt(digits, 10), false);
  // 11-12 digit weird lengths: try as ms (likely truncated/non-standard).
  return yearFromEpoch(parseInt(digits, 10), true);
}

function classifyRootFile(filename, absPath) {
  const ext = path.extname(filename).toLowerCase();
  if (!PHOTO_EXTS.has(ext)) {
    return { kind: 'skip', reason: 'non-photo-ext' };
  }

  // 1. EXIF DateTimeOriginal (high confidence).
  const exif = readExifSingle(absPath);
  if (exif.year !== null) {
    return { kind: 'move', year: exif.year, source: 'exif', confidence: 'high' };
  }

  // 2. Filename year regex (high confidence).
  const fnYear = yearFromFilename(filename);
  if (fnYear !== null) {
    return { kind: 'move', year: fnYear, source: 'filename', confidence: 'high' };
  }

  // 3. Epoch-ms prefix (high confidence).
  const epYear = yearFromEpochPrefix(filename);
  if (epYear !== null) {
    return { kind: 'move', year: epYear, source: 'epoch', confidence: 'high' };
  }

  // 4. mtime fallback (low confidence — Unsorted).
  try {
    const st = fs.statSync(absPath);
    const y = new Date(st.mtimeMs).getUTCFullYear();
    if (y >= MIN_YEAR && y <= MAX_YEAR) {
      return { kind: 'unsorted', year: y, source: 'mtime', confidence: 'low' };
    }
  } catch {
    // fall through
  }

  return { kind: 'skip', reason: 'no-year-signal' };
}

// ---- Phase 1 main ----

function runPhase1() {
  console.log(`[phase1] start dryRun=${dryRun}`);
  // Batch-load EXIF for the entire root in one exiftool call (fast).
  preloadRootExif(SOURCE_ROOT);

  const entries = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  console.log(`[phase1] root files=${entries.length}`);

  const counts = new Map();
  const skipReasons = new Map();
  const moved = [];
  const unsorted = [];
  const skipped = [];
  const failed = [];

  let processed = 0;
  let totalMoves = 0;
  for (const filename of entries) {
    processed += 1;
    if (processed % 500 === 0) {
      console.log(`[phase1] progress ${processed}/${entries.length} moved=${moved.length} unsorted=${unsorted.length}`);
    }
    if (totalMoves >= MOVE_CAP) {
      console.warn(`[phase1] MOVE CAP reached (${MOVE_CAP}) — stopping`);
      break;
    }

    const oldPath = path.join(SOURCE_ROOT, filename);
    const cls = classifyRootFile(filename, oldPath);

    if (cls.kind === 'skip') {
      skipped.push({ filename, reason: cls.reason });
      skipReasons.set(cls.reason, (skipReasons.get(cls.reason) || 0) + 1);
      continue;
    }

    const destDir = cls.kind === 'unsorted'
      ? UNSORTED_DIR
      : path.join(SOURCE_ROOT, String(cls.year));
    const pick = pickAvailableTarget(destDir, filename);
    if (!pick) {
      failed.push({ filename, reason: 'too-many-collisions' });
      appendLog(`# FAIL too-many-collisions\t${oldPath}`);
      continue;
    }
    const { newPath, suffix } = pick;

    try {
      ensureDir(destDir);
      if (!dryRun) fs.renameSync(oldPath, newPath);
      if (cls.kind === 'unsorted') {
        unsorted.push({ filename, year: cls.year, source: cls.source });
      } else {
        moved.push({ filename, year: cls.year, source: cls.source, suffix });
        counts.set(cls.year, (counts.get(cls.year) || 0) + 1);
      }
      totalMoves += 1;
      appendLog(
        `${new Date().toISOString()}\tphase1\t${cls.kind}\t${oldPath}\t${newPath}\t${cls.year}\t${cls.source}\t${cls.confidence}\t${suffix}`,
      );
    } catch (err) {
      failed.push({ filename, reason: err.code || err.message });
      appendLog(`# FAIL phase1 ${err.code || 'ERR'}\t${oldPath}\t${err.message}`);
    }
  }

  return {
    rootFilesSeen: entries.length,
    moved: moved.length,
    unsorted: unsorted.length,
    skipped: skipped.length,
    failed: failed.length,
    perYear: Object.fromEntries([...counts.entries()].sort((a, b) => a[0] - b[0])),
    skipReasons: Object.fromEntries(
      [...skipReasons.entries()].sort((a, b) => b[1] - a[1]),
    ),
  };
}

// ---- Phase 2: re-cluster year-root singletons ----

function runPhase2() {
  console.log(`[phase2] start dryRun=${dryRun}`);

  const yearFolders = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && YEAR_RE.test(d.name) && !SKIP_TOP_LEVEL.has(d.name))
    .map((d) => d.name)
    .sort();

  const absorbedByCluster = new Map();
  const orphanedByYear = new Map();
  let absorbed = 0;
  let orphaned = 0;
  let totalSingletons = 0;
  let failed = 0;

  for (const year of yearFolders) {
    const yearDir = path.join(SOURCE_ROOT, year);

    // Identify singletons (files at year root, NOT inside any subfolder).
    const items = fs.readdirSync(yearDir, { withFileTypes: true });
    const singletonNames = items
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => PHOTO_EXTS.has(path.extname(n).toLowerCase()));
    const clusterNames = items
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (singletonNames.length === 0 || clusterNames.length === 0) {
      if (singletonNames.length > 0) {
        orphanedByYear.set(year, (orphanedByYear.get(year) || 0) + singletonNames.length);
        orphaned += singletonNames.length;
        totalSingletons += singletonNames.length;
      }
      continue;
    }

    totalSingletons += singletonNames.length;
    console.log(`[phase2] ${year}: ${singletonNames.length} singletons, ${clusterNames.length} clusters`);

    // Read EXIF for ALL files in year (root + clusters) — gives us cluster date/GPS bounds.
    // We do this by reading each cluster folder + the year root.
    const clusterStats = new Map(); // clusterName → { minDate, maxDate, latMin, latMax, lonMin, lonMax }

    for (const cl of clusterNames) {
      const clDir = path.join(yearDir, cl);
      const exifMap = readExifBatch(clDir);
      let minDate = null, maxDate = null;
      let latMin = null, latMax = null, lonMin = null, lonMax = null;
      let n = 0, gpsN = 0;
      for (const [, info] of exifMap) {
        if (info.takenAt !== null) {
          if (minDate === null || info.takenAt < minDate) minDate = info.takenAt;
          if (maxDate === null || info.takenAt > maxDate) maxDate = info.takenAt;
        }
        if (info.lat !== null && info.lon !== null) {
          if (latMin === null || info.lat < latMin) latMin = info.lat;
          if (latMax === null || info.lat > latMax) latMax = info.lat;
          if (lonMin === null || info.lon < lonMin) lonMin = info.lon;
          if (lonMax === null || info.lon > lonMax) lonMax = info.lon;
          gpsN += 1;
        }
        n += 1;
      }
      if (n > 0) {
        clusterStats.set(cl, { minDate, maxDate, latMin, latMax, lonMin, lonMax, gpsN, n });
      }
    }

    // Read EXIF for each singleton + try to match.
    const singletonExifMap = readExifBatch(yearDir);

    for (const filename of singletonNames) {
      const sInfo = singletonExifMap.get(filename) || { takenAt: null, lat: null, lon: null };
      const oldPath = path.join(yearDir, filename);

      // Find best matching cluster.
      let best = null;
      for (const [clName, cs] of clusterStats) {
        // Date match: ±1 day from cluster date range.
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        let dateOk = false;
        if (sInfo.takenAt !== null && cs.minDate !== null && cs.maxDate !== null) {
          if (sInfo.takenAt >= cs.minDate - ONE_DAY_MS && sInfo.takenAt <= cs.maxDate + ONE_DAY_MS) {
            dateOk = true;
          }
        }
        if (!dateOk) continue;

        // GPS match: within 200 km of cluster bbox center, OR cluster has no GPS.
        let gpsOk = false;
        if (sInfo.lat !== null && sInfo.lon !== null && cs.latMin !== null) {
          const cLat = (cs.latMin + cs.latMax) / 2;
          const cLon = (cs.lonMin + cs.lonMax) / 2;
          const km = haversineKm(cLat, cLon, sInfo.lat, sInfo.lon);
          if (km <= 200) gpsOk = true;
        } else if (cs.latMin === null) {
          // Neither has GPS — date-only match.
          gpsOk = sInfo.lat === null;
        } else if (sInfo.lat === null) {
          // Singleton has no GPS — accept if date matches a tight cluster.
          gpsOk = true;
        }

        if (gpsOk) {
          // Prefer smaller date-distance.
          const midDate = cs.minDate !== null ? (cs.minDate + cs.maxDate) / 2 : null;
          const distMs = (midDate !== null && sInfo.takenAt !== null)
            ? Math.abs(sInfo.takenAt - midDate)
            : Number.MAX_SAFE_INTEGER;
          if (best === null || distMs < best.distMs) {
            best = { clName, distMs };
          }
        }
      }

      if (best === null) {
        orphanedByYear.set(year, (orphanedByYear.get(year) || 0) + 1);
        orphaned += 1;
        continue;
      }

      // Move singleton into the best cluster.
      const clDir = path.join(yearDir, best.clName);
      const pick = pickAvailableTarget(clDir, filename);
      if (!pick) {
        failed += 1;
        appendLog(`# FAIL phase2 too-many-collisions\t${oldPath}\t${best.clName}`);
        continue;
      }
      const { newPath, suffix } = pick;
      try {
        ensureDir(clDir);
        if (!dryRun) fs.renameSync(oldPath, newPath);
        absorbed += 1;
        const tripKey = `${year}\\${best.clName}`;
        absorbedByCluster.set(tripKey, (absorbedByCluster.get(tripKey) || 0) + 1);
        appendLog(
          `${new Date().toISOString()}\tphase2\tabsorb\t${oldPath}\t${newPath}\t${tripKey}\t${suffix}`,
        );
      } catch (err) {
        failed += 1;
        appendLog(`# FAIL phase2 ${err.code || 'ERR'}\t${oldPath}\t${newPath}\t${err.message}`);
      }
    }
  }

  return {
    totalSingletons,
    absorbed,
    orphaned,
    failed,
    absorbedByCluster: Object.fromEntries(
      [...absorbedByCluster.entries()].sort((a, b) => b[1] - a[1]),
    ),
    orphanedByYear: Object.fromEntries(
      [...orphanedByYear.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    ),
  };
}

function main() {
  const startedAt = new Date();
  console.log(`[reorg-g-photos-root-extended] start ${startedAt.toISOString()} dryRun=${dryRun} phase=${phaseArg || 'both'}`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[reorg] FATAL: ${SOURCE_ROOT} does not exist`);
    process.exit(1);
  }
  if (!fs.existsSync(EXIFTOOL)) {
    console.error(`[reorg] FATAL: exiftool not found at ${EXIFTOOL}`);
    process.exit(1);
  }

  if (!dryRun) {
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(
        LOG_PATH,
        `# g-photos-root-extended log — TSV: timestamp\tphase\tkind\told_path\tnew_path\t...\n`,
        'utf8',
      );
    }
    appendLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun} phase=${phaseArg || 'both'}`);
  }

  let phase1Summary = null;
  let phase2Summary = null;

  if (phaseArg === 0 || phaseArg === 1) {
    phase1Summary = runPhase1();
  }
  if (phaseArg === 0 || phaseArg === 2) {
    phase2Summary = runPhase2();
  }

  const finishedAt = new Date();
  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    phase1: phase1Summary,
    phase2: phase2Summary,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    appendLog(`# run end ${finishedAt.toISOString()} ${JSON.stringify({
      p1Moved: phase1Summary?.moved,
      p1Unsorted: phase1Summary?.unsorted,
      p2Absorbed: phase2Summary?.absorbed,
      p2Orphaned: phase2Summary?.orphaned,
    })}`);
  }

  return summary;
}

main();
