#!/usr/bin/env node
/**
 * Render docs/g-master-dedup-applied.md from the JSON summary written by
 * scripts/master-dedup-g.mjs. Run after the dedup pass.
 *
 * Usage:
 *   node scripts/write-master-dedup-doc.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SUMMARY_PATH = path.join(__dirname, '.g-master-dedup.summary.json');
const DOC_PATH = path.join(REPO_ROOT, 'docs', 'g-master-dedup-applied.md');

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`[write-doc] summary not found: ${SUMMARY_PATH}`);
  process.exit(1);
}

const s = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));

function fmt(n) { return Number(n).toLocaleString('en-US'); }
function pct(n, total) {
  if (!total) return '0%';
  return ((n / total) * 100).toFixed(1) + '%';
}

const movedRows = Object.entries(s.byRootMoved || {})
  .sort((a, b) => b[1] - a[1])
  .map(([root, n]) => `| \`${root}\` | ${fmt(n)} |`)
  .join('\n');

const keptRows = Object.entries(s.byRootKept || {})
  .sort((a, b) => b[1] - a[1])
  .map(([root, n]) => `| \`${root}\` | ${fmt(n)} |`)
  .join('\n');

const topGroups = (s.topGroups || []).slice(0, 10).map((g, i) => {
  const keeperPath = g.keeper.replace(/\|/g, '\\|');
  const cf = g.cross_folder ? 'yes' : 'no';
  const roots = (g.roots || []).map(r => `\`${r}\``).join(', ');
  return `| ${i + 1} | ${g.group_id} | ${fmt(g.member_count)} | ${fmt(g.moved_count)} | ${cf} | ${roots} | \`${keeperPath}\` |`;
}).join('\n');

const crossFolderSamples = (s.crossFolderMoves || []).slice(0, 12).map(m => {
  return `- \`${m.kept_root}\`: \`${m.kept}\`  ←  kept; moved \`${m.moved}\` (\`${m.moved_root}\`)`;
}).join('\n');

const md = `# G:\\ master deduplication — applied ${s.startedAt.slice(0, 10)}

Reversible quarantine of perceptual duplicates across the entire \`G:\\\` drive.
Move-only — no deletes. Builds on PR #61 (which only covered \`G:\\Poze\\\`) by
extending the dedup sweep to every photo-bearing root listed in
\`docs/g-other-folders-scout.md\` and unifying the index across all roots so
cross-folder dupes are caught (e.g. an \`IMG-…WA…\\.jpg\` that lives in both
\`G:\\Poze\\WhatsApp-by-year\\<year>\\\` and \`G:\\Video\\WhatsApp_Images\\\`).

## Run summary

- Hasher: \`scripts/hash-g-roots.ps1\` (WPF dHash 8×8). Grouping threshold: Hamming ≤ ${s.threshold}${s.threshold === 0 ? ' (exact-dHash match)' : ''}.
- Mover: \`scripts/master-dedup-g.mjs\`.
- Inputs:
  - \`scripts/.photo-classify/P8-redo/hashes.ndjson\` (40,460 cached \`G:\\Poze\\\` hashes from PR #61).
  - \`scripts/.photo-classify/g-master-dedup/hashes-new.ndjson\` (newly computed for the broader scope).
- Quarantine target: \`G:\\duplicates-to_be_deleted\\\` (created this run; note the underscore in the spec).
- Log: \`scripts/.g-master-dedup.log\` (TSV).
- Summary JSON: \`scripts/.g-master-dedup.summary.json\`.
- Branch: \`docs/g-master-dedup\`.
- Started: \`${s.startedAt}\`
- Finished: \`${s.finishedAt}\`
- Duration: **${(s.durationMs / 1000).toFixed(1)} s**
- Records loaded: **${fmt(s.recordsLoaded)}**
- Filtered out before grouping: missing=${fmt(s.filtered.missing)} (stale paths from prior reorgs), sensitive=${fmt(s.filtered.sensitive)}, skip-dir=${fmt(s.filtered.skipDir)}.
- Flagged as exact-match-only (small < 600 px short axis, or low-entropy dHash): **${fmt(s.filtered.exactOnly)}** — these still group via SHA-256 sub-buckets but are excluded from Hamming-near-match to avoid the all-zeros icon collision problem.
- Eligible photos grouped: **${fmt(s.eligible)}** (under the 100,000 sanity cap).
- Duplicate groups (≥ 2 members): **${fmt(s.groupsTotal)}**
- Total members across groups: **${fmt(s.membersTotal)}**
- **Moved to quarantine: ${fmt(s.moved)}** (${pct(s.moved, s.membersTotal)} of grouped members).
- Move failures: ${fmt(s.moveFailed)}
- Filename collisions suffixed: ${fmt(s.collisionsSuffixed)}
- Cross-folder duplicate groups: **${fmt(s.crossFolderGroups)}**
- Skipped at move-time (cap, missing, sensitive): ${fmt(s.skip['max-moves'] || 0)}.

## Moved by source root

| Root | Moved |
| --- | ---: |
${movedRows || '| _(none)_ | 0 |'}

## Keepers by destination root

(Where the canonical copy lives after this pass — i.e. the priority winner of each group.)

| Root | Groups kept |
| --- | ---: |
${keptRows || '| _(none)_ | 0 |'}

## Top 10 largest dup groups (by files moved)

| # | group_id | Members | Moved | Cross-folder | Roots present | Keeper |
| - | --: | --: | --: | --- | --- | --- |
${topGroups || '| — | — | — | — | — | — | — |'}

## Cross-folder duplicate samples

When a photo appears in two roots (e.g. \`G:\\Poze\\<year>\\…\` and
\`G:\\Video\\WhatsApp_Images\\…\`), the keeper-priority rule kept the
\`G:\\Poze\\\` copy and quarantined the other. Sample (first 12):

${crossFolderSamples || '_No cross-folder dupes detected this run._'}

## Recovery / undo

Every move is logged in \`scripts/.g-master-dedup.log\` with columns
\`timestamp\\tevent\\tgroup_id\\told_path\\tnew_path\\treason\`. Quarantine is
fully reversible.

To restore one specific file:

\`\`\`powershell
Move-Item -LiteralPath '<new_path>' -Destination '<old_path>'
\`\`\`

To restore everything (PowerShell one-liner — replays the log):

\`\`\`powershell
Get-Content scripts/.g-master-dedup.log |
  Where-Object { $_ -match "^[^#].*\`tMOVE(_SUFFIXED|_EXDEV)?\`t" } |
  ForEach-Object {
    $cols = $_ -split "\`t"
    $old = $cols[3]; $new = $cols[4]
    if (Test-Path -LiteralPath $new) {
      $dir = Split-Path -Parent $old
      if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
      }
      Move-Item -LiteralPath $new -Destination $old
    }
  }
\`\`\`

## Final-delete (Eduard's call, after eyeball pass)

Once you have spot-checked the quarantine and are happy:

\`\`\`powershell
Remove-Item -LiteralPath G:\\duplicates-to_be_deleted -Recurse -Force
\`\`\`

That command is **destructive** and should only be run after a manual
review. Not part of this PR.

## Constraints honoured

- Move-only (no deletes). \`fs.renameSync\` on the same volume; copy + unlink fallback on EXDEV.
- P13 sensitive folders untouched: \`G:\\Citizenship*\`, \`G:\\backup NC*\`,
  \`G:\\Whatsapp\\\` (audio-only WhatsApp archive, separate from the
  Video\\WhatsApp_Images media archive),
  \`G:\\Important Documents\\\`, plus the in-Poze sensitive set
  (\`CV + CL photos\\\`, \`Driving license photos\\\`, \`ID Photos\\\`,
  \`Passport photos\\\`, \`Residence permit photos\\\`, \`Camera Roll iPhone Backup\\\`).
- \`G:\\Poze\\.duplicates\\\` left in place — those were already quarantined by
  PR #61 and are awaiting Eduard's final-delete call separately.
- Skip directories anywhere in the tree: \`.duplicates\\\`,
  \`.review-for-delete\\\`, \`Screenshots\\\`, \`duplicates-to_be_deleted\\\`,
  \`$RECYCLE.BIN\\\`, \`System Volume Information\\\`, \`Recycle Bin\\\`.
- Photo cap: 100,000 (eligible records were ${fmt(s.eligible)} — well under).
- Collisions: appended \`-2\`, \`-3\` … suffix and logged (${fmt(s.collisionsSuffixed)} this run).

## Threshold calibration

PR #61 used Hamming ≤ 8 on \`G:\\Poze\\\` only (40k photos). At the wider 60k+
scope of this pass — adding \`G:\\Video\\WhatsApp_Images\\\` (10k WhatsApp
exports), \`G:\\WD_EXT_HDD\\\` (4k legacy), and \`G:\\backup media telefon\\\`
(5.7k phone backups) — the same threshold cascades transitively across the
denser hash space and merges genuinely different photos via chains of
"close-enough" 8×8 dHashes (verified empirically: a single Spain 16 keeper
absorbed 3,500 unrelated images via chained near-matches).

This pass therefore defaults to **threshold = 0** (exact-dHash match), with
SHA-256 sub-bucketing for low-entropy hashes (tiny / icon images) so true
byte-identical duplicates still group. Hamming-near-match remains available
behind \`--threshold N\` with a 150-member group-size cap as cascade
protection.

## Keeper-priority rule

For each duplicate group, the keeper is selected by the first matching tier:

1. Inside \`G:\\Poze\\<year>\\<cluster>\\…\` (already organized into a trip / cluster folder)
2. Inside \`G:\\Poze\\<year>\\…\` (year bucket, no cluster)
3. Inside \`G:\\Poze\\WhatsApp-by-year\\<year>\\…\`
4. Inside \`G:\\Poze\\\` root or other \`G:\\Poze\\\` subfolder
5. Inside \`G:\\Video\\WhatsApp_Images\\…\` (raw WhatsApp archive)
6. Anywhere else — newest \`mtime\` wins

Tiebreakers within a tier: earliest \`mtime\` (more original) → larger pixel
area → larger file size. The \`anywhere else\` tier flips the mtime sort to
newest-first per Eduard's spec.

## Next steps for Eduard

1. Spot-check \`G:\\duplicates-to_be_deleted\\\` against the keepers in
   \`G:\\Poze\\\`. Group-by-group sanity is in the log; the visual diff should
   be tight (Hamming ≤ ${s.threshold} ≈ "looks the same").
2. If a single file looks miscategorised: grep
   \`scripts/.g-master-dedup.log\` for its filename and run the per-file
   recovery one-liner above.
3. When happy, run the final-delete one-liner. The pre-existing
   \`G:\\Poze\\.duplicates\\\` from PR #61 is not part of this tree — that's a
   separate cleanup decision.
`;

fs.writeFileSync(DOC_PATH, md, 'utf8');
console.log(`[write-doc] wrote ${DOC_PATH}`);
