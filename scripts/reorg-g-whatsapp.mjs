#!/usr/bin/env node
/**
 * Reorganize WhatsApp media in G:\Photos\ root into per-year subfolders.
 *
 * Source: G:\Photos\IMG-YYYYMMDD-WAxxxx.jpg (root only — no subfolder recursion)
 * Target: G:\Photos\WhatsApp-by-year\<YYYY>\IMG-YYYYMMDD-WAxxxx.jpg
 *
 * Move-only (fs.renameSync — atomic on the same volume). No deletes. Reversible
 * via the log file at scripts/.g-whatsapp-reorg.log.
 *
 * Usage:
 *   node scripts/reorg-g-whatsapp.mjs            # apply
 *   node scripts/reorg-g-whatsapp.mjs --dry-run  # plan only, no FS writes
 *
 * Constraints (P13 blocklist + spec):
 *   - Only files in G:\Photos\ root, matching IMG-YYYYMMDD-WAxxxx.jpg.
 *   - Subfolders left untouched (CV+CL, Driving license, ID, Passport, Residence
 *     permit photos, etc.).
 *   - No camera-source files (IMG_YYYYMMDD_HHMMSS.jpg, IMG2026MMDDHHMMSS.jpg, etc.).
 *   - Locked / unmoveable files are skipped and recorded in the unmoved list.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'G:\\Photos';
const TARGET_PARENT = path.join(SOURCE_ROOT, 'WhatsApp-by-year');
const LOG_PATH = path.join(__dirname, '.g-whatsapp-reorg.log');

const dryRun = process.argv.includes('--dry-run');

// Strict pattern: IMG-YYYYMMDD-WA<digits>.jpg (case-insensitive on .jpg, but
// uppercase IMG/WA per WhatsApp convention).
const WHATSAPP_RE = /^IMG-(\d{4})(\d{2})(\d{2})-WA\d+\.jpe?g$/i;

function listRoot() {
  return fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
}

function classify(filename) {
  const m = WHATSAPP_RE.exec(filename);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  // Sanity: real WhatsApp dates fall in 2009..currentYear+1.
  if (year < 2009 || year > 2030) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(line) {
  if (dryRun) return;
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

function main() {
  const startedAt = new Date();
  console.log(`[reorg-g-whatsapp] start ${startedAt.toISOString()} dryRun=${dryRun}`);
  console.log(`[reorg-g-whatsapp] source=${SOURCE_ROOT}`);
  console.log(`[reorg-g-whatsapp] target=${TARGET_PARENT}`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[reorg-g-whatsapp] FATAL: ${SOURCE_ROOT} does not exist`);
    process.exit(1);
  }

  if (!dryRun) {
    // Header for the log so consumers know how to parse it.
    if (!fs.existsSync(LOG_PATH)) {
      fs.writeFileSync(
        LOG_PATH,
        `# g-whatsapp-reorg log — TSV: timestamp\told_path\tnew_path\tfilename\tyear\n`,
        'utf8',
      );
    }
    appendLog(`# run start ${startedAt.toISOString()}`);
  }

  const entries = listRoot();
  console.log(`[reorg-g-whatsapp] root files=${entries.length}`);

  const counts = new Map();
  const moved = [];
  const skipped = [];
  const unmoved = [];

  for (const filename of entries) {
    const cls = classify(filename);
    if (!cls) {
      skipped.push(filename);
      continue;
    }
    const oldPath = path.join(SOURCE_ROOT, filename);
    const yearDir = path.join(TARGET_PARENT, String(cls.year));
    const newPath = path.join(yearDir, filename);

    if (fs.existsSync(newPath)) {
      // Defensive: should not happen on a fresh run, but if it does, skip and log.
      unmoved.push({ filename, reason: 'target-exists', oldPath, newPath });
      appendLog(`# SKIP target-exists\t${oldPath}\t${newPath}`);
      continue;
    }

    try {
      ensureDir(yearDir);
      if (!dryRun) {
        fs.renameSync(oldPath, newPath);
      }
      moved.push({ filename, year: cls.year, oldPath, newPath });
      counts.set(cls.year, (counts.get(cls.year) || 0) + 1);
      appendLog(
        `${new Date().toISOString()}\t${oldPath}\t${newPath}\t${filename}\t${cls.year}`,
      );
    } catch (err) {
      unmoved.push({ filename, reason: err.code || err.message, oldPath, newPath });
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
    skippedNonWhatsApp: skipped.length,
    unmoved: unmoved.length,
    perYear: Object.fromEntries(
      [...counts.entries()].sort((a, b) => a[0] - b[0]),
    ),
    unmovedDetail: unmoved,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    appendLog(
      `# run end ${finishedAt.toISOString()} moved=${moved.length} unmoved=${unmoved.length} skippedNonWhatsApp=${skipped.length}`,
    );
  }

  return summary;
}

main();
