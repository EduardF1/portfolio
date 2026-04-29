#!/usr/bin/env node
/**
 * Master G:\ deduplication — broader-scope sweep across all photo-bearing
 * roots on G:\ (per docs/g-other-folders-scout.md), unified with the
 * already-indexed G:\Poze\ tree.
 *
 * Phase 1 (hashing) runs in PowerShell — see scripts/hash-g-roots.ps1.
 * That script emits per-file dHash records to
 *   scripts/.photo-classify/g-master-dedup/hashes-new.ndjson
 * and reuses
 *   scripts/.photo-classify/P8-redo/hashes.ndjson
 * for the already-hashed G:\Poze\ tree.
 *
 * Phase 2 (this script):
 *   1. Load all hash records from both NDJSONs.
 *   2. Skip P13 sensitive folders, .duplicates\, .review-for-delete\,
 *      Screenshots\, Recycle Bin, duplicates-to_be_deleted\.
 *   3. Group by perceptual similarity:
 *        - Bucket by exact dHash (Hamming = 0) ⇒ same image guaranteed.
 *        - Then pairwise-merge buckets via Hamming ≤ 8 union-find.
 *      Optionally confirm cross-folder near-matches with SHA-256 on the
 *      top-1 representative + the candidate (lightweight).
 *   4. For each group with ≥2 members, pick a keeper:
 *        a) inside G:\Poze\<year>\<cluster>\ (already-organized cluster)
 *        b) inside G:\Poze\<year>\ (year bucket)
 *        c) inside G:\Poze\WhatsApp-by-year\<year>\
 *        d) inside G:\Poze\ root
 *        e) inside G:\Video\WhatsApp_Images\
 *        f) anywhere else by file-mtime descending
 *      Tie-break by larger pixel area, then larger size, then earliest
 *      mtime (matches the prior P8-redo keep heuristic).
 *   5. Move every non-keeper to G:\duplicates-to_be_deleted\<original-
 *      relative-path> preserving the source drive layout.
 *      Strict: move-only (rename on the same volume; copy+unlink on
 *      EXDEV). Never delete. Collisions get a -2, -3, ... suffix.
 *
 * Outputs:
 *   scripts/.g-master-dedup.log          (TSV, one line per move/skip)
 *   scripts/.g-master-dedup.summary.json (run summary)
 *   docs/g-master-dedup-applied.md       (human-readable report; emitted
 *                                          by the wrapper, not this script)
 *
 * Usage:
 *   node scripts/master-dedup-g.mjs --dry-run          # plan only
 *   node scripts/master-dedup-g.mjs                    # apply
 *   node scripts/master-dedup-g.mjs --max-moves 1000   # cap
 *   node scripts/master-dedup-g.mjs --threshold 8      # default Hamming
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HASH_FILES = [
  path.join(__dirname, '.photo-classify', 'P8-redo', 'hashes.ndjson'),
  path.join(__dirname, '.photo-classify', 'g-master-dedup', 'hashes-new.ndjson'),
];
const QUARANTINE_ROOT = 'G:\\duplicates-to_be_deleted';
const LOG_PATH = path.join(__dirname, '.g-master-dedup.log');
const SUMMARY_PATH = path.join(__dirname, '.g-master-dedup.summary.json');

const SENSITIVE_PREFIXES = [
  'g:\\poze\\cv + cl photos\\',
  'g:\\poze\\driving license photos\\',
  'g:\\poze\\id photos\\',
  'g:\\poze\\passport photos\\',
  'g:\\poze\\residence permit photos\\',
  'g:\\poze\\camera roll iphone backup\\',
  'g:\\whatsapp\\',
  'g:\\important documents\\',
];
const SENSITIVE_WILDCARD_PREFIXES = [
  'g:\\citizenship',
  'g:\\backup nc',
];
// Folder-name skips — case-insensitive name match anywhere in path.
const SKIP_DIR_NAMES = new Set([
  '.duplicates',
  '.review-for-delete',
  'screenshots',
  'duplicates-to_be_deleted',
  '$recycle.bin',
  'system volume information',
  'recycle bin',
]);

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const maxMovesArg = argv.indexOf('--max-moves');
const maxMoves = maxMovesArg >= 0 && argv[maxMovesArg + 1]
  ? parseInt(argv[maxMovesArg + 1], 10)
  : Infinity;
const thresholdArg = argv.indexOf('--threshold');
// Default Hamming threshold: 0 (exact-dHash match only).
//
// Rationale: at the 60k+ photo scale of this G:\ master sweep — across
// G:\Poze\, G:\Video\WhatsApp_Images\, G:\WD_EXT_HDD\, and
// G:\backup media telefon\ — Hamming threshold ≥ 2 produces transitive
// cascades that merge unrelated photos via chains of similar-but-different
// 8x8 dHashes (verified empirically at 8/4/2). PR #61 used threshold=8 on
// G:\Poze\-only and caught lighting/recompression variants safely. Re-running
// at threshold=8 here produced 3,500-member groups containing genuinely
// different photos.
//
// Threshold=0 catches:
//   - Byte-identical duplicates (same content, same dHash)
//   - Re-encoded copies that preserve dHash (most JPEG re-saves at same dim)
//   - Cross-folder copies (the primary goal of this pass)
// Lost: lighting/recompression variants whose dHash drifts 1-8 bits — those
// were a small fraction in PR #61 and are best handled by a future
// targeted-cluster review, not a global pass.
//
// Override with --threshold N to allow Hamming-near-match (cascade-protected
// by MAX_GROUP_SIZE inside buildGroups).
const THRESHOLD = thresholdArg >= 0 && argv[thresholdArg + 1]
  ? parseInt(argv[thresholdArg + 1], 10)
  : 0;
const PHOTO_CAP = 100_000;

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

function isInSkipDir(p) {
  // Check every segment of the path against SKIP_DIR_NAMES.
  const parts = normalize(p).split('\\');
  for (const part of parts) {
    if (SKIP_DIR_NAMES.has(part)) return true;
  }
  return false;
}

function shortHash(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
}

// ---- Keeper priority -------------------------------------------------------

const POZE_YEAR_RE = /^g:\\poze\\(\d{4})\\/i;
// G:\Poze\<year>\<cluster>\... — cluster present if ≥3 segments after Poze\<year>\
function keeperRank(p) {
  const n = normalize(p);
  const yearMatch = n.match(/^g:\\poze\\(\d{4})\\(.+)$/);
  if (yearMatch) {
    const after = yearMatch[2];
    // Count remaining segments. If after has at least one '\', we're inside a cluster.
    if (after.includes('\\')) {
      // (a) inside G:\Poze\<year>\<cluster>\
      return 0;
    }
    // (b) inside G:\Poze\<year>\ at the leaf
    return 1;
  }
  if (n.startsWith('g:\\poze\\whatsapp-by-year\\')) {
    // (c) WhatsApp-by-year (still organized)
    return 2;
  }
  if (n.startsWith('g:\\poze\\') && !n.includes('\\.')) {
    // (d) G:\Poze\ root or other Poze subfolder (not .duplicates / .review-for-delete)
    return 3;
  }
  if (n.startsWith('g:\\video\\whatsapp_images\\')) {
    // (e) Video WhatsApp archive
    return 4;
  }
  // (f) anywhere else
  return 5;
}

// Pixel area for tiebreak
function pixelArea(rec) {
  return (rec.width || 0) * (rec.height || 0);
}

function pickKeeper(members) {
  // Sort by (rank asc, mtime desc, area desc, size desc)
  const sorted = [...members].sort((a, b) => {
    const ra = keeperRank(a.path);
    const rb = keeperRank(b.path);
    if (ra !== rb) return ra - rb;
    // Within rank 5 (anywhere else), prefer mtime desc (newest first per spec).
    if (ra === 5) {
      const ma = new Date(a.mtime).getTime() || 0;
      const mb = new Date(b.mtime).getTime() || 0;
      if (ma !== mb) return mb - ma;
    } else {
      // For organized buckets, prefer earliest mtime (more original).
      const ma = new Date(a.mtime).getTime() || Infinity;
      const mb = new Date(b.mtime).getTime() || Infinity;
      if (ma !== mb) return ma - mb;
    }
    const aa = pixelArea(a);
    const ab = pixelArea(b);
    if (aa !== ab) return ab - aa;
    return (b.size || 0) - (a.size || 0);
  });
  return sorted[0];
}

// ---- Logging ---------------------------------------------------------------

let logStream = null;
function openLog() {
  if (dryRun) return;
  const isNew = !fs.existsSync(LOG_PATH);
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'a', encoding: 'utf8' });
  if (isNew) {
    logStream.write(
      `# g-master-dedup log — TSV: timestamp\tevent\tgroup_id\told_path\tnew_path\treason\n`,
    );
  }
}
function writeLog(line) {
  if (dryRun || !logStream) return;
  logStream.write(line + '\n');
}

function ensureDir(dir) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

// ---- Hamming popcount on 64-bit hashes via two 32-bit halves --------------

function hamming64(aHi, aLo, bHi, bLo) {
  return popcount32((aHi ^ bHi) >>> 0) + popcount32((aLo ^ bLo) >>> 0);
}

function parseHash(hex) {
  // 16 hex chars → two 32-bit words
  const hi = parseInt(hex.slice(0, 8), 16) >>> 0;
  const lo = parseInt(hex.slice(8, 16), 16) >>> 0;
  return [hi, lo];
}

// ---- Phase A: load hashes --------------------------------------------------

async function loadHashes() {
  const byPath = new Map(); // normalized path -> record
  for (const file of HASH_FILES) {
    if (!fs.existsSync(file)) {
      console.warn(`[master-dedup] WARN: hash file missing: ${file}`);
      continue;
    }
    console.log(`[master-dedup] loading ${file}`);
    const stream = fs.createReadStream(file, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let n = 0;
    for await (const line of rl) {
      const t = line.trim();
      if (!t) continue;
      let r;
      try { r = JSON.parse(t); } catch { continue; }
      if (!r.path || !r.hash) continue;
      const key = normalize(r.path);
      // Last-write-wins so the new ndjson can override stale entries.
      byPath.set(key, r);
      n++;
    }
    console.log(`[master-dedup]   ${n} records from ${path.basename(file)}`);
  }
  return [...byPath.values()];
}

// ---- Phase B: filter eligible records --------------------------------------

// Hamming-distance filter heuristics — to prevent the all-zeros / very-low-entropy
// dHash bucket from absorbing hundreds of unrelated thumbnails into one mega-group.
//   - small images (< 600 px on the smaller axis) are usually social-media exports
//     or thumbnails where the 8x8 dHash signal degrades; cascading near-matches
//     across hundreds of such images merges unrelated content. Match by exact
//     dHash only for these.
//   - extreme-entropy dHashes (popcount ≤ 4 or ≥ 60) → exact-match-only.
//
// Rationale tuning: at 600px+ on the short axis the dHash captures real
// photographic structure; below that, recompression noise dominates. Tested
// empirically against the 60k+ G:\ index; lower thresholds produced
// 150-member chains of unrelated boxing portraits / Messenger downloads.
const MIN_DIM_FOR_NEAR_MATCH = 600;
const POPCOUNT_LO = 4;
const POPCOUNT_HI = 60;

function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >>> 24;
}

function popcount64(hex) {
  const hi = parseInt(hex.slice(0, 8), 16) >>> 0;
  const lo = parseInt(hex.slice(8, 16), 16) >>> 0;
  return popcount32(hi) + popcount32(lo);
}

function isExactOnly(rec) {
  const w = rec.width || 0;
  const h = rec.height || 0;
  if (Math.min(w, h) < MIN_DIM_FOR_NEAR_MATCH) return true;
  const pc = popcount64(rec.hash);
  if (pc <= POPCOUNT_LO || pc >= POPCOUNT_HI) return true;
  return false;
}

function filterEligible(records, stats) {
  const eligible = [];
  for (const r of records) {
    if (!fs.existsSync(r.path)) {
      stats.filtered.missing++;
      continue;
    }
    if (isSensitive(r.path)) {
      stats.filtered.sensitive++;
      continue;
    }
    if (isInSkipDir(r.path)) {
      stats.filtered.skipDir++;
      continue;
    }
    r._exactOnly = isExactOnly(r);
    if (r._exactOnly) stats.filtered.exactOnly++;
    eligible.push(r);
  }
  return eligible;
}

// ---- Phase C: union-find grouping by Hamming distance ----------------------

class DSU {
  constructor(n) {
    this.parent = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

function sha256Of(filePath) {
  try {
    const h = crypto.createHash('sha256');
    const buf = fs.readFileSync(filePath);
    h.update(buf);
    return h.digest('hex');
  } catch {
    return null;
  }
}

function buildGroups(records, threshold) {
  // Index: distinct hash → array of record indices
  const distinctMap = new Map();
  for (let i = 0; i < records.length; i++) {
    const h = records[i].hash;
    if (!distinctMap.has(h)) distinctMap.set(h, []);
    distinctMap.get(h).push(i);
  }
  const distinctHashes = [...distinctMap.keys()];
  const nDistinct = distinctHashes.length;
  console.log(`[master-dedup] eligible photos: ${records.length}`);
  console.log(`[master-dedup] distinct dHashes: ${nDistinct}`);

  // For pairwise (near-match) Hamming, only consider distinct hashes that
  // contain at least one "near-match-eligible" record (size ≥ 256, normal
  // popcount). Hashes whose every member is exact-only get bucketed-by-
  // exact only. This prevents the all-zeros / icon-bucket problem from
  // collapsing hundreds of unrelated thumbnails into one mega-group.
  const eligibleForNearMatch = []; // indices into distinctHashes that have ≥1 normal member
  for (let i = 0; i < nDistinct; i++) {
    const arr = distinctMap.get(distinctHashes[i]);
    let anyNormal = false;
    for (const idx of arr) {
      if (!records[idx]._exactOnly) { anyNormal = true; break; }
    }
    if (anyNormal) eligibleForNearMatch.push(i);
  }
  const nNear = eligibleForNearMatch.length;
  console.log(`[master-dedup] hashes eligible for Hamming-near-match: ${nNear} of ${nDistinct} (rest = exact-only)`);

  // Pre-parse uint64 halves for each distinct hash.
  const hi = new Uint32Array(nDistinct);
  const lo = new Uint32Array(nDistinct);
  for (let i = 0; i < nDistinct; i++) {
    const [h, l] = parseHash(distinctHashes[i]);
    hi[i] = h; lo[i] = l;
  }

  const dsu = new DSU(records.length);
  // Bucket-by-exact: union all members of an exact-hash bucket.
  // Caveat for low-entropy / tiny-image hashes (the all-zeros bucket and
  // friends): the dHash signal collapses for such images and unrelated
  // thumbnails can land in the same exact-hash bucket. So when an exact-hash
  // bucket has ≥ 3 members AND every member is exact-only, sub-bucket by
  // SHA-256 of the file content before unioning. Real duplicates stay
  // grouped; coincidental dHash collisions split apart.
  let sha256Computed = 0;
  let sha256Subbuckets = 0;
  for (const [hashHex, arr] of distinctMap.entries()) {
    if (arr.length < 2) continue;
    const allExactOnly = arr.every(i => records[i]._exactOnly);
    if (allExactOnly && arr.length >= 3) {
      // SHA-256 sub-bucket
      const bySha = new Map();
      for (const idx of arr) {
        const sha = sha256Of(records[idx].path);
        sha256Computed++;
        const k = sha || ('null:' + idx);
        if (!bySha.has(k)) bySha.set(k, []);
        bySha.get(k).push(idx);
      }
      for (const sub of bySha.values()) {
        if (sub.length < 2) continue;
        sha256Subbuckets++;
        for (let i = 1; i < sub.length; i++) dsu.union(sub[0], sub[i]);
      }
    } else {
      for (let i = 1; i < arr.length; i++) dsu.union(arr[0], arr[i]);
    }
  }
  console.log(`[master-dedup] sha256 verified low-entropy buckets: ${sha256Computed} hashes computed, ${sha256Subbuckets} SHA-confirmed sub-buckets`);

  // Reps for the near-match sweep: the first record-index in each eligible bucket.
  const repIdxNear = new Int32Array(nNear);
  for (let k = 0; k < nNear; k++) {
    const di = eligibleForNearMatch[k];
    repIdxNear[k] = distinctMap.get(distinctHashes[di])[0];
  }

  // Pairwise Hamming sweep with cascade protection: cap each merged group at
  // MAX_GROUP_SIZE. If unioning two reps would push the merged group past this
  // limit, skip the union. This preserves legitimate small near-match clusters
  // (lighting / recompression variants) while preventing the chain-merge
  // explosion seen at threshold=8 across 60k photos (where one DSLR photo can
  // get transitively connected to thousands of low-detail thumbnails).
  const MAX_GROUP_SIZE = 150;

  // Track group sizes per DSU root.
  const groupSize = new Int32Array(records.length);
  for (let i = 0; i < records.length; i++) groupSize[i] = 1;
  // After exact-bucket unions, recompute sizes from the DSU roots.
  for (let i = 0; i < records.length; i++) {
    const r = dsu.find(i);
    if (r !== i) groupSize[r]++;
  }
  // (groupSize at non-root indices is now stale — only root counts are valid.)

  console.log(`[master-dedup] pairwise sweep across ${nNear} hashes (threshold=${threshold}, max-group=${MAX_GROUP_SIZE})...`);
  let pairUnions = 0;
  let pairUnionsSkippedOverflow = 0;
  const progressEvery = Math.max(500, Math.floor(nNear / 50));
  for (let aIdx = 0; aIdx < nNear; aIdx++) {
    if (aIdx % progressEvery === 0 && aIdx > 0) {
      console.log(`[master-dedup]   pairwise ${aIdx}/${nNear}  (unions=${pairUnions} overflow-skip=${pairUnionsSkippedOverflow})`);
    }
    const a = eligibleForNearMatch[aIdx];
    const ah = hi[a], al = lo[a];
    for (let bIdx = aIdx + 1; bIdx < nNear; bIdx++) {
      const b = eligibleForNearMatch[bIdx];
      const xh = (ah ^ hi[b]) >>> 0;
      const xl = (al ^ lo[b]) >>> 0;
      let c = popcount32(xh);
      if (c > threshold) continue;
      c += popcount32(xl);
      if (c <= threshold) {
        const ra = dsu.find(repIdxNear[aIdx]);
        const rb = dsu.find(repIdxNear[bIdx]);
        if (ra === rb) continue;
        const merged = groupSize[ra] + groupSize[rb];
        if (merged > MAX_GROUP_SIZE) {
          pairUnionsSkippedOverflow++;
          continue;
        }
        dsu.union(ra, rb);
        const newRoot = dsu.find(ra);
        groupSize[newRoot] = merged;
        pairUnions++;
      }
    }
  }
  console.log(`[master-dedup] pairwise unions: ${pairUnions} (overflow-skipped: ${pairUnionsSkippedOverflow})`);

  // Collect groups (≥ 2 members)
  const groupMap = new Map(); // root-idx → array of record indices
  for (let i = 0; i < records.length; i++) {
    const r = dsu.find(i);
    if (!groupMap.has(r)) groupMap.set(r, []);
    groupMap.get(r).push(i);
  }
  const groups = [];
  let gid = 0;
  for (const idxArr of groupMap.values()) {
    if (idxArr.length < 2) continue;
    gid++;
    groups.push({
      group_id: gid,
      members: idxArr.map(i => records[i]),
    });
  }
  console.log(`[master-dedup] duplicate groups (≥2): ${groups.length}`);
  return groups;
}

// ---- Phase D: move non-keepers to quarantine -------------------------------

function moveOne(src, groupId, stats) {
  // Compute destination path inside QUARANTINE_ROOT, preserving the drive
  // layout from the colon onward. Example:
  //   src = "G:\Poze\2024\IMG.jpg"
  //   dst = "G:\duplicates-to_be_deleted\Poze\2024\IMG.jpg"
  // (Drive letter is stripped; the remainder of the absolute path is mirrored.)
  const driveSplit = src.match(/^([a-zA-Z]):[\\/]?(.*)$/);
  if (!driveSplit) {
    stats.moveFailed++;
    writeLog(`${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t-\tunparseable-path`);
    return false;
  }
  const rel = driveSplit[2].replace(/\//g, '\\');
  let dest = path.join(QUARANTINE_ROOT, rel);
  let suffixed = false;
  let suffixN = 1;
  while (fs.existsSync(dest)) {
    suffixN++;
    const ext = path.extname(rel);
    const base = rel.slice(0, rel.length - ext.length);
    dest = path.join(QUARANTINE_ROOT, `${base}-${suffixN}${ext}`);
    suffixed = true;
    if (suffixN > 50) {
      stats.moveFailed++;
      writeLog(`${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t${dest}\tcollision-overflow`);
      return false;
    }
  }
  try {
    ensureDir(path.dirname(dest));
    if (!dryRun) fs.renameSync(src, dest);
    stats.moved++;
    if (suffixed) stats.collisionsSuffixed++;
    writeLog(`${new Date().toISOString()}\tMOVE${suffixed ? '_SUFFIXED' : ''}\t${groupId}\t${src}\t${dest}\t-`);
    return true;
  } catch (err) {
    if (err.code === 'EXDEV') {
      try {
        if (!dryRun) {
          fs.copyFileSync(src, dest);
          fs.unlinkSync(src);
        }
        stats.moved++;
        if (suffixed) stats.collisionsSuffixed++;
        writeLog(`${new Date().toISOString()}\tMOVE_EXDEV${suffixed ? '_SUFFIXED' : ''}\t${groupId}\t${src}\t${dest}\t-`);
        return true;
      } catch (err2) {
        stats.moveFailed++;
        writeLog(`${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t${dest}\texdev-fallback:${err2.code || err2.message}`);
        return false;
      }
    }
    stats.moveFailed++;
    writeLog(`${new Date().toISOString()}\tFAIL\t${groupId}\t${src}\t${dest}\t${err.code || err.message}`);
    return false;
  }
}

// ---- Phase E: classify root for stats --------------------------------------

function classifyRoot(p) {
  const n = normalize(p);
  if (n.startsWith('g:\\poze\\whatsapp-by-year\\')) return 'G:\\Poze\\WhatsApp-by-year';
  if (n.match(/^g:\\poze\\\d{4}\\/)) return 'G:\\Poze\\<year>';
  if (n.startsWith('g:\\poze\\')) return 'G:\\Poze (other)';
  if (n.startsWith('g:\\video\\whatsapp_images\\')) return 'G:\\Video\\WhatsApp_Images';
  if (n.startsWith('g:\\wd_ext_hdd\\')) return 'G:\\WD_EXT_HDD';
  if (n.startsWith('g:\\backup media telefon\\')) return 'G:\\backup media telefon';
  // Strip to drive root for "other"
  const m = n.match(/^([a-z]):\\([^\\]+)/);
  return m ? `${m[1].toUpperCase()}:\\${m[2]}` : 'unknown';
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const startedAt = new Date();
  console.log(`[master-dedup] start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves} threshold=${THRESHOLD}`);

  openLog();
  writeLog(`# run start ${startedAt.toISOString()} dryRun=${dryRun} maxMoves=${maxMoves} threshold=${THRESHOLD}`);

  const records = await loadHashes();
  if (records.length > PHOTO_CAP) {
    console.error(`[master-dedup] FATAL: ${records.length} > photo cap ${PHOTO_CAP}`);
    process.exit(2);
  }

  const stats = {
    dryRun,
    threshold: THRESHOLD,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    durationMs: 0,
    recordsLoaded: records.length,
    filtered: { missing: 0, sensitive: 0, skipDir: 0, exactOnly: 0 },
    eligible: 0,
    distinctHashes: 0,
    groupsTotal: 0,
    membersTotal: 0,
    moved: 0,
    moveFailed: 0,
    collisionsSuffixed: 0,
    skip: { 'max-moves': 0 },
    byRootMoved: {},
    byRootKept: {},
    crossFolderGroups: 0,
    crossFolderMoves: [],   // sample
    topGroups: [],
  };

  const eligible = filterEligible(records, stats);
  stats.eligible = eligible.length;

  const groups = buildGroups(eligible, THRESHOLD);
  stats.groupsTotal = groups.length;
  stats.membersTotal = groups.reduce((s, g) => s + g.members.length, 0);

  // Track "cross-folder" groups: members come from ≥ 2 different roots.
  const enrichedGroups = groups.map(g => {
    const keeper = pickKeeper(g.members);
    const others = g.members.filter(m => m.path !== keeper.path);
    const roots = new Set(g.members.map(m => classifyRoot(m.path)));
    return {
      group_id: g.group_id,
      keeper,
      others,
      member_count: g.members.length,
      moved_count: 0,
      roots: [...roots],
      crossFolder: roots.size >= 2,
    };
  });

  // Process groups, biggest first so the cap (if any) bites the
  // largest clusters first — that's where the most win is.
  enrichedGroups.sort((a, b) => b.member_count - a.member_count);

  let stopped = false;
  for (const g of enrichedGroups) {
    if (stats.moved >= maxMoves) {
      if (!stopped) {
        writeLog(`# max-moves reached at moved=${stats.moved}`);
        stopped = true;
      }
      stats.skip['max-moves'] += g.others.length;
      continue;
    }
    const keeperRoot = classifyRoot(g.keeper.path);
    stats.byRootKept[keeperRoot] = (stats.byRootKept[keeperRoot] || 0) + 1;
    if (g.crossFolder) stats.crossFolderGroups++;

    let crossSampleSaved = false;
    for (const m of g.others) {
      if (stats.moved >= maxMoves) {
        stats.skip['max-moves']++;
        continue;
      }
      if (!fs.existsSync(m.path)) {
        writeLog(`${new Date().toISOString()}\tSKIP\t${g.group_id}\t${m.path}\t-\tsource-missing-at-move-time`);
        continue;
      }
      // Defensive sensitive check — should already be filtered, but never re-touch.
      if (isSensitive(m.path) || isInSkipDir(m.path)) {
        writeLog(`${new Date().toISOString()}\tSKIP\t${g.group_id}\t${m.path}\t-\tsensitive-or-skip-dir`);
        continue;
      }
      const ok = moveOne(m.path, g.group_id, stats);
      if (ok) {
        g.moved_count++;
        const mvRoot = classifyRoot(m.path);
        stats.byRootMoved[mvRoot] = (stats.byRootMoved[mvRoot] || 0) + 1;
        if (g.crossFolder && !crossSampleSaved && stats.crossFolderMoves.length < 50) {
          stats.crossFolderMoves.push({
            group_id: g.group_id,
            kept: g.keeper.path,
            kept_root: keeperRoot,
            moved: m.path,
            moved_root: mvRoot,
          });
          crossSampleSaved = true;
        }
      }
    }
  }

  // Top 10 dup groups by moved_count
  stats.topGroups = enrichedGroups
    .filter(g => g.moved_count > 0 || g.member_count >= 5)
    .sort((a, b) => b.moved_count - a.moved_count || b.member_count - a.member_count)
    .slice(0, 10)
    .map(g => ({
      group_id: g.group_id,
      member_count: g.member_count,
      moved_count: g.moved_count,
      keeper: g.keeper.path,
      keeper_root: classifyRoot(g.keeper.path),
      cross_folder: g.crossFolder,
      roots: g.roots,
    }));

  const finishedAt = new Date();
  stats.finishedAt = finishedAt.toISOString();
  stats.durationMs = finishedAt - startedAt;

  writeLog(`# run end ${finishedAt.toISOString()} moved=${stats.moved} groups=${stats.groupsTotal}`);
  if (logStream) logStream.end();

  console.log(JSON.stringify(stats, null, 2));

  if (!dryRun) {
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(stats, null, 2), 'utf8');
  }

  return stats;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
