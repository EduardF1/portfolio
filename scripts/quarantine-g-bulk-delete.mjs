#!/usr/bin/env node
/**
 * Quarantine PR #36 bulk-delete candidates on G:\Poze\ + D:\Portfolio\poze\.
 *
 * Reads scripts/.photo-classify/P-orphans/scan.ndjson (one JSON record per file,
 * 75,719 records) and re-derives the 3,754 "high-confidence non-content"
 * candidates flagged in `docs/photo-orphans-triage.md` §6.2:
 *
 *   Folder-level cuts (848):
 *     - <root>\Browser\   (G + D mirrors)
 *     - <root>\X\         (G + D mirrors)
 *
 *   Filename patterns inside <root> flat dump (2,906):
 *     1.  ^\d{10}_                  Facebook photo IDs        (~2,072)
 *     2.  ^received_                Messenger receive          (~246)
 *     3.  ^[0-9a-f]{32}\.           browser cache hex hash     (~232)
 *     4.  ^image-0-02-04-           Telegram-style web saves   (~196)
 *     5.  ^FB_IMG_                  FB save (REVIEW class — excluded; sign-off says delete-class only)
 *     6.  ^images \(\d+\)           browser download series    (~58)
 *     7.  ^logo[_.]                 UI assets                  (~26)
 *     8.  ^download                 browser downloads          (~20)
 *     9.  ^_a_t_m_e_g_a             Doxygen call-graph         (~12)
 *     10. ^\d+__\d+\.png            hash PNGs                  (~8)
 *     11. ^Snapchat-                Snapchat exports           (~4)
 *     12. ^MSGR_PHOTO_              Messenger upload artifact  (~2)
 *     13. ^photo-[0-9a-f-]+         Unsplash CDN slug          (~2)
 *     14. ^unnamed-                 Mail attachments           (~2)
 *     15. ^icon\.                   UI asset                   (~2)
 *
 * Per file: move to <root>\.review-for-delete\<original-relative-path> preserving
 * directory structure. <root> = G:\Poze (for G-side) or D:\Portfolio\poze (for
 * D-side).
 *
 * REVERSIBLE: every move is logged TSV-style to scripts/.g-bulk-delete-quarantine.log.
 * Recovery one-liner emitted in docs/g-bulk-delete-quarantine-applied.md.
 *
 * STRICT CONSTRAINTS:
 *   - Move only, never delete.
 *   - Skip every file under any P13 sensitive folder (G + D).
 *   - Skip G:\Poze\WhatsApp-by-year\ (PR #57 reorg target).
 *   - Skip <root>\.duplicates\ (PR #61 quarantine tree).
 *   - Skip <root>\.review-for-delete\ (this script's own quarantine tree).
 *   - On destination collision, append a short content hash suffix and log it.
 *   - On missing source, skip + log.
 *
 * Usage:
 *   node scripts/quarantine-g-bulk-delete.mjs                      # apply
 *   node scripts/quarantine-g-bulk-delete.mjs --dry-run            # plan only
 *   node scripts/quarantine-g-bulk-delete.mjs --max-moves 500      # cap the run
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const G_ROOT = 'G:\\Poze';
const D_ROOT = 'D:\\Portfolio\\poze';
const QUARANTINE_DIRNAME = '.review-for-delete';
const INPUT = path.join(__dirname, '.photo-classify', 'P-orphans', 'scan.ndjson');
const LOG_PATH = path.join(__dirname, '.g-bulk-delete-quarantine.log');
const SUMMARY_PATH = path.join(__dirname, '.g-bulk-delete-quarantine.summary.json');

// P13 sensitive blocklist — case-insensitive prefix match on the normalized path.
// G + D side equivalents.
const SENSITIVE_PREFIXES = [
  // G side
  'g:\\poze\\cv + cl photos\\',
  'g:\\poze\\driving license photos\\',
  'g:\\poze\\id photos\\',
  'g:\\poze\\passport photos\\',
  'g:\\poze\\residence permit photos\\',
  'g:\\poze\\camera roll iphone backup\\',
  'g:\\whatsapp\\',
  'g:\\important documents\\',
  // D side equivalents
  'd:\\portfolio\\poze\\cv + cl photos\\',
  'd:\\portfolio\\poze\\driving license photos\\',
  'd:\\portfolio\\poze\\id photos\\',
  'd:\\portfolio\\poze\\passport photos\\',
  'd:\\portfolio\\poze\\residence permit photos\\',
  'd:\\portfolio\\important documents\\',
];
// Wildcard prefixes — match any path that starts with the stem.
const SENSITIVE_WILDCARD_PREFIXES = [
  'g:\\citizenship', // G:\Citizenship\, G:\Citizenship_Application\, etc.
  'g:\\backup nc', // G:\backup NC\, G:\backup NC1\, ...
];

// Carve-out: PR #57 WhatsApp-by-year reorg + PR #61 .duplicates + this script's own tree.
const CARVE_OUT_PREFIXES = [
  'g:\\poze\\whatsapp-by-year\\',
  'g:\\poze\\.duplicates\\',
  'g:\\poze\\.review-for-delete\\',
  'd:\\portfolio\\poze\\.duplicates\\',
  'd:\\portfolio\\poze\\.review-for-delete\\',
];

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const maxMovesArg = argv.indexOf('--max-moves');
const maxMoves =
  maxMovesArg >= 0 && argv[maxMovesArg + 1]
    ? parseInt(argv[maxMovesArg + 1], 10)
    : Infinity;

function normalize(p) {
  return String(p).replace(/\//g, '\\').toLowerCase();
}

function isSensitive(p) {
  const n = normalize(p);
  for (const pref of SENSITIVE_PREFIXES) {
    if (n.startsWith(pref)) return true;
  }
  for (const stem of SENSITIVE_WILDCARD_PREFIXES) {
    if (n.startsWith(stem)) return true;
  }
  return false;
}

function isCarveOut(p) {
  const n = normalize(p);
  for (const pref of CARVE_OUT_PREFIXES) {
    if (n.startsWith(pref)) return true;
  }
  return false;
}

// Returns G_ROOT or D_ROOT given a path, or null if neither.
function rootFor(p) {
  const n = normalize(p);
  if (n.startsWith('g:\\poze\\')) return G_ROOT;
  if (n.startsWith('d:\\portfolio\\poze\\')) return D_ROOT;
  return null;
}

// Folder-level cuts: any file inside Browser\ or X\ (immediate child of root, case-insensitive).
function folderCategory(p) {
  const n = normalize(p);
  // Match \Browser\ as a path segment under root.
  // For G:\Poze\Browser\foo.jpg → contains '\poze\browser\'
  // For D:\Portfolio\poze\Browser\foo.jpg → contains '\poze\browser\'
  if (n.includes('\\poze\\browser\\')) return 'folder:Browser';
  if (n.includes('\\poze\\x\\')) return 'folder:X';
  return null;
}

// Filename patterns — only fire on basenames in the <root> flat dump (folder_hint === '<root>').
// Order matters: first-match-wins.
const FILENAME_PATTERNS = [
  { id: 'fb-photo-id', re: /^\d{10}_/i, label: 'Facebook photo IDs (^<10digit>_)' },
  { id: 'received', re: /^received_/i, label: 'Messenger received_*' },
  { id: 'hex-hash', re: /^[0-9a-f]{32}\./i, label: 'Hex hash 32-char filename' },
  { id: 'image-tg', re: /^image-0-02-04-/i, label: 'Telegram-style image-0-02-04-*' },
  { id: 'images-N', re: /^images \(\d+\)\./i, label: 'images (N) browser download' },
  { id: 'logo', re: /^logo[_.]/i, label: 'logo_*.png UI asset' },
  { id: 'download', re: /^download[ ._(]/i, label: 'download*.{jpg,png}' },
  { id: 'doxygen-rtos', re: /^_a_t_m_e_g_a/i, label: 'Doxygen call-graph _a_t_m_e_g_a*' },
  { id: 'hash-png', re: /^\d+__\d+\.png$/i, label: 'N__N.png hash PNGs' },
  { id: 'snapchat', re: /^Snapchat-/i, label: 'Snapchat-*.jpg' },
  { id: 'msgr-photo', re: /^MSGR_PHOTO_/i, label: 'MSGR_PHOTO_FOR_UPLOAD_*' },
  { id: 'unsplash-slug', re: /^photo-[0-9a-f]+-/i, label: 'photo-<unsplash-id>-*.jpg' },
  { id: 'unnamed', re: /^unnamed-/i, label: 'unnamed-*.jpg' },
  { id: 'icon', re: /^icon\./i, label: 'icon.png UI asset' },
];

function patternCategory(record) {
  // Filename patterns only apply to <root> flat-dump rows per the doc.
  if (record.folder_hint !== '<root>') return null;
  const base = path.basename(record.path);
  for (const pat of FILENAME_PATTERNS) {
    if (pat.re.test(base)) return `pattern:${pat.id}`;
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
      `# g-bulk-delete-quarantine log — TSV: timestamp\tevent\tcategory\told_path\tnew_path\treason\n`,
    );
  }
}
function writeLog(line) {
  if (dryRun || !logStream) return;
  logStream.write(line + '\n');
}

async function main() {
  const startedAt = new Date();
  console.log(
    `[quarantine-g-bulk-delete] start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`,
  );
  console.log(`[quarantine-g-bulk-delete] input=${INPUT}`);

  if (!fs.existsSync(INPUT)) {
    console.error(`[quarantine-g-bulk-delete] FATAL: ${INPUT} not found`);
    process.exit(1);
  }

  openLog();
  writeLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`);

  const stream = fs.createReadStream(INPUT, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const stats = {
    recordsScanned: 0,
    candidatesIdentified: 0,
    moved: 0,
    movedByCategory: {},
    skip: {
      'sensitive-blocklist': 0,
      'carve-out': 0,
      'out-of-scope-root': 0,
      'source-missing': 0,
      'move-failed': 0,
      'max-moves-reached': 0,
    },
    skipByCategory: {},
    collisionsSuffixed: 0,
  };

  let stopped = false;

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch (err) {
      writeLog(`# parse-fail\t-\t-\t-\t${err.message}`);
      continue;
    }
    stats.recordsScanned++;

    // Classify: folder-level cut, then pattern (first-match-wins on category overall).
    const category = folderCategory(rec.path) || patternCategory(rec);
    if (!category) continue;

    stats.candidatesIdentified++;
    const src = rec.path;

    // Out-of-scope root check (defensive).
    const root = rootFor(src);
    if (!root) {
      stats.skip['out-of-scope-root']++;
      stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tSKIP\t${category}\t${src}\t-\tout-of-scope-root`,
      );
      continue;
    }

    // Sensitive blocklist.
    if (isSensitive(src)) {
      stats.skip['sensitive-blocklist']++;
      stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tSKIP\t${category}\t${src}\t-\tsensitive-blocklist`,
      );
      continue;
    }

    // Carve-outs: WhatsApp-by-year, .duplicates, .review-for-delete.
    if (isCarveOut(src)) {
      stats.skip['carve-out']++;
      stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
      writeLog(`${new Date().toISOString()}\tSKIP\t${category}\t${src}\t-\tcarve-out`);
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
      stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tSKIP\t${category}\t${src}\t-\tsource-missing`,
      );
      continue;
    }

    const rel = path.relative(root, src);
    let dest = path.join(root, QUARANTINE_DIRNAME, rel);
    let suffixed = false;
    if (fs.existsSync(dest)) {
      const ext = path.extname(dest);
      const base = dest.slice(0, dest.length - ext.length);
      dest = `${base}.${shortHash(src)}${ext}`;
      suffixed = true;
    }

    try {
      ensureDir(path.dirname(dest));
      if (!dryRun) {
        fs.renameSync(src, dest);
      }
      stats.moved++;
      stats.movedByCategory[category] = (stats.movedByCategory[category] || 0) + 1;
      if (suffixed) stats.collisionsSuffixed++;
      writeLog(
        `${new Date().toISOString()}\tMOVE${suffixed ? '_SUFFIXED' : ''}\t${category}\t${src}\t${dest}\t-`,
      );
    } catch (err) {
      if (err.code === 'EXDEV') {
        try {
          if (!dryRun) {
            fs.copyFileSync(src, dest);
            fs.unlinkSync(src);
          }
          stats.moved++;
          stats.movedByCategory[category] = (stats.movedByCategory[category] || 0) + 1;
          if (suffixed) stats.collisionsSuffixed++;
          writeLog(
            `${new Date().toISOString()}\tMOVE_EXDEV${suffixed ? '_SUFFIXED' : ''}\t${category}\t${src}\t${dest}\t-`,
          );
          continue;
        } catch (err2) {
          stats.skip['move-failed']++;
          stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
          writeLog(
            `${new Date().toISOString()}\tFAIL\t${category}\t${src}\t${dest}\texdev-fallback:${err2.code || err2.message}`,
          );
          continue;
        }
      }
      stats.skip['move-failed']++;
      stats.skipByCategory[category] = (stats.skipByCategory[category] || 0) + 1;
      writeLog(
        `${new Date().toISOString()}\tFAIL\t${category}\t${src}\t${dest}\t${err.code || err.message}`,
      );
    }
  }

  const finishedAt = new Date();
  writeLog(
    `# run end ${finishedAt.toISOString()} moved=${stats.moved} candidates=${stats.candidatesIdentified} scanned=${stats.recordsScanned}`,
  );
  if (logStream) logStream.end();

  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    recordsScanned: stats.recordsScanned,
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
