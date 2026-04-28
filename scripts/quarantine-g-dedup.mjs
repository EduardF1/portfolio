#!/usr/bin/env node
/**
 * Quarantine perceptual-dedup demote candidates on G:\Poze\.
 *
 * Reads scripts/.photo-classify/P8-redo/dedup.ndjson (one JSON record per group)
 * and moves every "demote" file (members[1..]) into a parallel
 * G:\Poze\.duplicates\<original-relative-path> tree. The "keeper" (members[0])
 * stays where it is.
 *
 * REVERSIBLE: every move is logged TSV-style to scripts/.g-dedup-quarantine.log
 * and a recovery one-liner is emitted in docs/g-dedup-quarantine-applied.md so a
 * future operator can put any file back.
 *
 * STRICT CONSTRAINTS:
 *   - Move only, never delete.
 *   - Skip every file under any P13 sensitive folder.
 *   - Skip D:\Portfolio\poze\ entirely (D-side handling is out of scope).
 *   - On destination collision (rare cross-folder filename clashes), append a
 *     short content hash suffix and log it.
 *   - On missing source, skip + log.
 *
 * Usage:
 *   node scripts/quarantine-g-dedup.mjs                      # apply
 *   node scripts/quarantine-g-dedup.mjs --dry-run            # plan only
 *   node scripts/quarantine-g-dedup.mjs --max-moves 500      # cap the run
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = 'G:\\Poze';
const QUARANTINE_ROOT = path.join(SOURCE_ROOT, '.duplicates');
const INPUT = path.join(__dirname, '.photo-classify', 'P8-redo', 'dedup.ndjson');
const LOG_PATH = path.join(__dirname, '.g-dedup-quarantine.log');

// P13 sensitive blocklist — case-insensitive prefix match on the normalized path.
// Wildcards `*` are explicit in the spec; we expand them via case-insensitive
// substring/prefix predicates.
const SENSITIVE_PREFIXES = [
  // Exact prefixes (case-insensitive)
  'g:\\poze\\cv + cl photos\\',
  'g:\\poze\\driving license photos\\',
  'g:\\poze\\id photos\\',
  'g:\\poze\\passport photos\\',
  'g:\\poze\\residence permit photos\\',
  'g:\\poze\\camera roll iphone backup\\',
  'g:\\whatsapp\\',
  'g:\\important documents\\',
];
// Wildcard prefixes — match any path that *starts with* the stem.
const SENSITIVE_WILDCARD_PREFIXES = [
  'g:\\citizenship', // covers G:\Citizenship\, G:\Citizenship_Application\, etc.
  'g:\\backup nc', // covers G:\backup NC\, G:\backup NC1\, G:\backup NC1\..., etc.
];
// D-side carve-out — do not touch this run.
const D_PORTFOLIO_PREFIX = 'd:\\portfolio\\poze\\';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const maxMovesArg = argv.indexOf('--max-moves');
const maxMoves = maxMovesArg >= 0 && argv[maxMovesArg + 1]
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

function classifySkip(p) {
  const n = normalize(p);
  if (n.startsWith(D_PORTFOLIO_PREFIX)) return 'd-portfolio';
  if (isSensitive(p)) return 'sensitive-blocklist';
  // Out-of-scope: anything not under G:\Poze\ — defensive, dedup.ndjson is G:\Poze
  // only, but be safe.
  if (!n.startsWith('g:\\poze\\')) return 'out-of-scope-root';
  // Don't re-quarantine files already inside the quarantine tree.
  if (n.startsWith('g:\\poze\\.duplicates\\')) return 'already-quarantined';
  return null;
}

function shortHash(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
}

// If a missing keeper looks like a WhatsApp filename that the prior reorg
// relocated into WhatsApp-by-year/<YYYY>/, return the new path; else null.
const WHATSAPP_KEEPER_RE = /^IMG-(\d{4})\d{4}-WA\d+\.jpe?g$/i;
function looksLikeWhatsAppRelocated(keeperPath) {
  const base = path.basename(keeperPath);
  const m = WHATSAPP_KEEPER_RE.exec(base);
  if (!m) return null;
  const year = m[1];
  const candidate = path.join(SOURCE_ROOT, 'WhatsApp-by-year', year, base);
  return fs.existsSync(candidate) ? candidate : null;
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
      `# g-dedup-quarantine log — TSV: timestamp\tevent\tgroup_id\told_path\tnew_path\treason\n`,
    );
  }
}
function writeLog(line) {
  if (dryRun || !logStream) return;
  logStream.write(line + '\n');
}

async function main() {
  const startedAt = new Date();
  console.log(`[quarantine-g-dedup] start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`);
  console.log(`[quarantine-g-dedup] input=${INPUT}`);
  console.log(`[quarantine-g-dedup] quarantine=${QUARANTINE_ROOT}`);

  if (!fs.existsSync(INPUT)) {
    console.error(`[quarantine-g-dedup] FATAL: ${INPUT} not found`);
    process.exit(1);
  }
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`[quarantine-g-dedup] FATAL: ${SOURCE_ROOT} not found`);
    process.exit(1);
  }

  openLog();
  writeLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves}`);

  const stream = fs.createReadStream(INPUT, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const stats = {
    groupsTotal: 0,
    groupsWithMissingKeeper: [],
    demotesTotal: 0,
    moved: 0,
    skip: {
      'sensitive-blocklist': 0,
      'd-portfolio': 0,
      'out-of-scope-root': 0,
      'already-quarantined': 0,
      'source-missing': 0,
      'collision-suffixed': 0, // these still moved, separate counter below
      'move-failed': 0,
      'max-moves-reached': 0,
    },
    collisionsSuffixed: 0,
    perGroupMoves: new Map(), // group_id -> moved count (after filters)
    perGroupTotal: new Map(), // group_id -> total demote count (raw)
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
    stats.groupsTotal++;
    const groupId = rec.group_id;
    const members = Array.isArray(rec.members) ? rec.members : [];
    if (members.length < 2) continue;
    const keeper = members[0];
    const demotes = members.slice(1);
    stats.perGroupTotal.set(groupId, demotes.length);

    // SPEC: if the keeper itself is inside a P13 sensitive folder, skip the
    // entire group. This protects clusters like the 4,031-image CV/CL DSLR
    // group whose keeper is in `G:\Poze\CV + CL photos\` but whose demotes
    // leak into G:\Poze root.
    if (keeper && isSensitive(keeper)) {
      for (const src of demotes) {
        stats.demotesTotal++;
        stats.skip['sensitive-blocklist']++;
        writeLog(
          `${new Date().toISOString()}\tSKIP\t${groupId}\t${src}\t-\tkeeper-sensitive`,
        );
      }
      continue;
    }

    // Data-integrity flag: keeper missing on disk. The prior WhatsApp reorg
    // moved keepers into WhatsApp-by-year/<YYYY>/ — those are not real data
    // loss, just stale paths in dedup.ndjson. Detect & exclude them from the
    // alarm list.
    if (keeper && !fs.existsSync(keeper)) {
      const relocated = looksLikeWhatsAppRelocated(keeper);
      if (relocated) {
        stats.groupsWithMissingKeeper.push({
          group_id: groupId,
          keeper,
          relocated,
          benign: true,
        });
      } else {
        stats.groupsWithMissingKeeper.push({ group_id: groupId, keeper });
      }
      writeLog(
        `${new Date().toISOString()}\tKEEPER_MISSING\t${groupId}\t${keeper}\t${relocated || '-'}\t-`,
      );
    }

    for (const src of demotes) {
      stats.demotesTotal++;

      if (stats.moved >= maxMoves) {
        if (!stopped) {
          writeLog(`# max-moves-reached at moved=${stats.moved}`);
          stopped = true;
        }
        stats.skip['max-moves-reached']++;
        continue;
      }

      const skipReason = classifySkip(src);
      if (skipReason) {
        stats.skip[skipReason] = (stats.skip[skipReason] || 0) + 1;
        writeLog(`${new Date().toISOString()}\tSKIP\t${groupId}\t${src}\t-\t${skipReason}`);
        continue;
      }

      if (!fs.existsSync(src)) {
        stats.skip['source-missing']++;
        writeLog(`${new Date().toISOString()}\tSKIP\t${groupId}\t${src}\t-\tsource-missing`);
        continue;
      }

      // Compute destination — preserve the path inside G:\Poze\ under the
      // .duplicates root.
      const rel = path.relative(SOURCE_ROOT, src); // e.g. "Sub\file.jpg" or "file.jpg"
      let dest = path.join(QUARANTINE_ROOT, rel);
      let suffixed = false;
      if (fs.existsSync(dest)) {
        // Collision — append short hash of original full path before extension.
        const ext = path.extname(dest);
        const base = dest.slice(0, dest.length - ext.length);
        dest = `${base}.${shortHash(src)}${ext}`;
        suffixed = true;
      }

      try {
        ensureDir(path.dirname(dest));
        if (!dryRun) {
          // renameSync is atomic on the same volume (both src and dest are on G:).
          fs.renameSync(src, dest);
        }
        stats.moved++;
        if (suffixed) stats.collisionsSuffixed++;
        stats.perGroupMoves.set(groupId, (stats.perGroupMoves.get(groupId) || 0) + 1);
        writeLog(
          `${new Date().toISOString()}\tMOVE${suffixed ? '_SUFFIXED' : ''}\t${groupId}\t${src}\t${dest}\t-`,
        );
      } catch (err) {
        // EXDEV (cross-device) — fall back to copy+unlink.
        if (err.code === 'EXDEV') {
          try {
            if (!dryRun) {
              fs.copyFileSync(src, dest);
              fs.unlinkSync(src);
            }
            stats.moved++;
            if (suffixed) stats.collisionsSuffixed++;
            stats.perGroupMoves.set(groupId, (stats.perGroupMoves.get(groupId) || 0) + 1);
            writeLog(
              `${new Date().toISOString()}\tMOVE_EXDEV${suffixed ? '_SUFFIXED' : ''}\t${groupId}\t${src}\t${dest}\t-`,
            );
            continue;
          } catch (err2) {
            stats.skip['move-failed']++;
            writeLog(
              `${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t${dest}\texdev-fallback:${err2.code || err2.message}`,
            );
            continue;
          }
        }
        stats.skip['move-failed']++;
        writeLog(
          `${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t${dest}\t${err.code || err.message}`,
        );
      }
    }
  }

  const finishedAt = new Date();
  writeLog(
    `# run end ${finishedAt.toISOString()} moved=${stats.moved} demotesTotal=${stats.demotesTotal} groups=${stats.groupsTotal}`,
  );
  if (logStream) logStream.end();

  // Build top-N moved groups (count of files moved).
  const topMoved = [...stats.perGroupMoves.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([group_id, moved]) => ({ group_id, moved }));

  const summary = {
    dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    groupsTotal: stats.groupsTotal,
    demotesTotal: stats.demotesTotal,
    moved: stats.moved,
    collisionsSuffixed: stats.collisionsSuffixed,
    skip: stats.skip,
    keeperMissingCount: stats.groupsWithMissingKeeper.length,
    keeperMissingBenignWhatsApp: stats.groupsWithMissingKeeper.filter((x) => x.benign).length,
    keeperMissingReal: stats.groupsWithMissingKeeper.filter((x) => !x.benign),
    keeperMissingSample: stats.groupsWithMissingKeeper.slice(0, 10),
    topMovedGroups: topMoved,
  };

  console.log(JSON.stringify(summary, null, 2));

  // Persist the summary alongside the log so the doc step can read it.
  if (!dryRun) {
    const summaryPath = path.join(__dirname, '.g-dedup-quarantine.summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  }

  return summary;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
