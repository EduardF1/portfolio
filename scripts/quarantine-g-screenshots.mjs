#!/usr/bin/env node
/**
 * Quarantine non-camera-photo content from G:\Photos\ root into G:\Photos\Screenshots\.
 *
 * Sweeps **only** the immediate `G:\Photos\` root listing (no recursion). Subfolders
 * created by other agents (year buckets, `Screenshots\`, `WhatsApp-by-year\`,
 * `.duplicates\`, `.review-for-delete\`, P13 sensitive folders, etc.) are
 * **never** entered or touched.
 *
 * Detected categories (first-match-wins on the basename, case-insensitive):
 *   1. screenshot      — `Screenshot_*`, `screenshot*`, `Screen Shot *`, `Captura*`
 *   2. social-whatsapp — `*com.whatsapp*` in basename, `IMG-WA*`, `WhatsApp*` (file)
 *   3. social-instagram — `*com.instagram*`, `OPLUSDRAG*com.instagram*`
 *   4. social-snapchat — `*com.snapchat*`, `Snapchat-*`, `OPLUSDRAG*com.snapchat*`
 *   5. browser-save    — `*.html.png`, `*pinterest*`, `*pinimg*`
 *
 * Move target: `G:\Photos\Screenshots\<basename>` (flat — Screenshots\ has no
 * year-buckets at this time). On destination collision, append `.<sha1-8>`
 * before the extension and log it.
 *
 * REVERSIBLE: every move is logged TSV-style at
 * `scripts/.g-screenshots-quarantine.log`.
 *
 * STRICT CONSTRAINTS:
 *   - Move only, never delete.
 *   - Only files at the immediate `G:\Photos\` root level are candidates.
 *     Anything under a subfolder (year buckets, organized folders, P13
 *     sensitive folders) is skipped by construction (we only `readdir` once).
 *   - On destination collision, suffix with short content hash.
 *   - On move failure, skip + log; never block the rest of the run.
 *
 * Usage:
 *   node scripts/quarantine-g-screenshots.mjs                  # apply
 *   node scripts/quarantine-g-screenshots.mjs --dry-run        # plan only
 *   node scripts/quarantine-g-screenshots.mjs --max-moves 100  # cap the run
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const G_ROOT = 'G:\\Photos';
const QUARANTINE_DIR = path.join(G_ROOT, 'Screenshots');
const LOG_PATH = path.join(__dirname, '.g-screenshots-quarantine.log');
const SUMMARY_PATH = path.join(__dirname, '.g-screenshots-quarantine.summary.json');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const maxMovesArg = argv.indexOf('--max-moves');
const maxMoves =
  maxMovesArg >= 0 && argv[maxMovesArg + 1]
    ? parseInt(argv[maxMovesArg + 1], 10)
    : Infinity;

// First-match-wins on basename. Order matters — Snapchat / Instagram-specific
// patterns must be evaluated before the generic `Screenshot_*` rule, because
// some Android screenshot filenames embed the package name (e.g.
// `Screenshot_20220607_153344_com.snapchat.android.jpg`) — those go to the
// social bucket, not the generic `screenshot` bucket.
const PATTERNS = [
  // Social — package-name-tagged Android screenshots.
  { id: 'social-snapchat', re: /com\.snapchat/i, label: '*com.snapchat* package' },
  { id: 'social-snapchat', re: /^Snapchat-/i, label: 'Snapchat-* exports' },
  { id: 'social-whatsapp', re: /com\.whatsapp/i, label: '*com.whatsapp* package' },
  { id: 'social-whatsapp', re: /^IMG-WA/i, label: 'IMG-WA* (WhatsApp media)' },
  { id: 'social-whatsapp', re: /^WhatsApp/i, label: 'WhatsApp* basename' },
  { id: 'social-instagram', re: /com\.instagram/i, label: '*com.instagram* package' },
  { id: 'social-instagram', re: /^OPLUSDRAG/i, label: 'OPLUSDRAG_* (Oplus drag-and-drop UI capture)' },
  { id: 'social-instagram', re: /^Instagram[-_ ]/i, label: 'Instagram-* basename' },

  // Generic screenshots — must come AFTER the package-tagged rules above.
  { id: 'screenshot', re: /^Screenshot[ _-]/i, label: 'Screenshot_* / Screenshot - *' },
  { id: 'screenshot', re: /^screenshot/i, label: 'screenshot* (lowercase)' },
  { id: 'screenshot', re: /^Screen Shot /i, label: 'Screen Shot * (macOS)' },
  { id: 'screenshot', re: /^Captura/i, label: 'Captura* (Spanish/PT screenshot tool)' },

  // Browser saves not yet quarantined elsewhere.
  { id: 'browser-save', re: /\.html\.png$/i, label: '*.html.png (rendered HTML capture)' },
  { id: 'browser-save', re: /pinterest/i, label: '*pinterest* basename' },
  { id: 'browser-save', re: /pinimg/i, label: '*pinimg* (Pinterest CDN)' },
];

function categorize(basename) {
  for (const pat of PATTERNS) {
    if (pat.re.test(basename)) return { id: pat.id, label: pat.label };
  }
  return null;
}

function shortHash(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
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
      `# g-screenshots-quarantine log — TSV: timestamp\tevent\tcategory\told_path\tnew_path\treason\n`,
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
    `[quarantine-g-screenshots] start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`,
  );
  console.log(`[quarantine-g-screenshots] root=${G_ROOT}`);
  console.log(`[quarantine-g-screenshots] quarantine=${QUARANTINE_DIR}`);

  if (!fs.existsSync(G_ROOT)) {
    console.error(`[quarantine-g-screenshots] FATAL: ${G_ROOT} does not exist`);
    process.exit(1);
  }

  openLog();
  writeLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`);

  // Single non-recursive readdir of G:\Photos\ — only top-level entries are
  // candidates. Subfolders are skipped by construction.
  const entries = fs.readdirSync(G_ROOT, { withFileTypes: true });

  const stats = {
    rootEntries: entries.length,
    rootFiles: 0,
    rootDirsSkipped: 0,
    candidatesIdentified: 0,
    moved: 0,
    movedByCategory: {},
    skip: {
      'destination-is-self': 0,
      'source-missing': 0,
      'move-failed': 0,
      'max-moves-reached': 0,
    },
    skipByCategory: {},
    collisionsSuffixed: 0,
  };

  ensureDir(QUARANTINE_DIR);

  let stopped = false;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      stats.rootDirsSkipped++;
      continue;
    }
    if (!entry.isFile()) continue;
    stats.rootFiles++;

    const basename = entry.name;
    const category = categorize(basename);
    if (!category) continue;

    stats.candidatesIdentified++;
    const src = path.join(G_ROOT, basename);

    // Defensive: if the script ever finds a "Screenshots" file at root,
    // don't move it onto itself.
    if (path.dirname(src).toLowerCase() === QUARANTINE_DIR.toLowerCase()) {
      stats.skip['destination-is-self']++;
      stats.skipByCategory[category.id] = (stats.skipByCategory[category.id] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tSKIP\t${category.id}\t${src}\t-\tdestination-is-self`,
      );
      continue;
    }

    // Max-moves cap.
    if (stats.moved >= maxMoves) {
      if (!stopped) {
        writeLog(`# max-moves-reached at moved=${stats.moved}`);
        stopped = true;
      }
      stats.skip['max-moves-reached']++;
      continue;
    }

    if (!fs.existsSync(src)) {
      stats.skip['source-missing']++;
      stats.skipByCategory[category.id] = (stats.skipByCategory[category.id] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tSKIP\t${category.id}\t${src}\t-\tsource-missing`,
      );
      continue;
    }

    let dest = path.join(QUARANTINE_DIR, basename);
    let suffixed = false;
    if (fs.existsSync(dest)) {
      const ext = path.extname(dest);
      const baseNoExt = dest.slice(0, dest.length - ext.length);
      dest = `${baseNoExt}.${shortHash(src)}${ext}`;
      suffixed = true;
    }

    try {
      ensureDir(path.dirname(dest));
      if (!dryRun) {
        fs.renameSync(src, dest);
      }
      stats.moved++;
      stats.movedByCategory[category.id] = (stats.movedByCategory[category.id] || 0) + 1;
      if (suffixed) stats.collisionsSuffixed++;
      writeLog(
        `${new Date().toISOString()}\tMOVE${suffixed ? '_SUFFIXED' : ''}\t${category.id}\t${src}\t${dest}\t-`,
      );
    } catch (err) {
      if (err.code === 'EXDEV') {
        try {
          if (!dryRun) {
            fs.copyFileSync(src, dest);
            fs.unlinkSync(src);
          }
          stats.moved++;
          stats.movedByCategory[category.id] = (stats.movedByCategory[category.id] || 0) + 1;
          if (suffixed) stats.collisionsSuffixed++;
          writeLog(
            `${new Date().toISOString()}\tMOVE_EXDEV${suffixed ? '_SUFFIXED' : ''}\t${category.id}\t${src}\t${dest}\t-`,
          );
          continue;
        } catch (err2) {
          stats.skip['move-failed']++;
          stats.skipByCategory[category.id] = (stats.skipByCategory[category.id] || 0) + 1;
          writeLog(
            `${new Date().toISOString()}\tFAIL\t${category.id}\t${src}\t${dest}\texdev-fallback:${err2.code || err2.message}`,
          );
          continue;
        }
      }
      stats.skip['move-failed']++;
      stats.skipByCategory[category.id] = (stats.skipByCategory[category.id] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tFAIL\t${category.id}\t${src}\t${dest}\t${err.code || err.message}`,
      );
    }
  }

  const finishedAt = new Date();
  writeLog(
    `# run end ${finishedAt.toISOString()} moved=${stats.moved} candidates=${stats.candidatesIdentified} rootFiles=${stats.rootFiles}`,
  );
  if (logStream) logStream.end();

  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    rootEntries: stats.rootEntries,
    rootFiles: stats.rootFiles,
    rootDirsSkipped: stats.rootDirsSkipped,
    candidatesIdentified: stats.candidatesIdentified,
    moved: stats.moved,
    collisionsSuffixed: stats.collisionsSuffixed,
    movedByCategory: stats.movedByCategory,
    skip: stats.skip,
    skipByCategory: stats.skipByCategory,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!dryRun) {
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
  }

  return summary;
}

main();
