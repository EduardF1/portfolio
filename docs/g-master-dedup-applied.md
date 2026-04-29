# G:\ master deduplication — applied 2026-04-29

Reversible quarantine of perceptual duplicates across the entire `G:\` drive.
Move-only — no deletes. Builds on PR #61 (which only covered `G:\Poze\`) by
extending the dedup sweep to every photo-bearing root listed in
`docs/g-other-folders-scout.md` and unifying the index across all roots so
cross-folder dupes are caught (e.g. an `IMG-…WA…\.jpg` that lives in both
`G:\Poze\WhatsApp-by-year\<year>\` and `G:\Video\WhatsApp_Images\`).

## Run summary

- Hasher: `scripts/hash-g-roots.ps1` (WPF dHash 8×8). Grouping threshold: Hamming ≤ 0 (exact-dHash match).
- Mover: `scripts/master-dedup-g.mjs`.
- Inputs:
  - `scripts/.photo-classify/P8-redo/hashes.ndjson` (40,460 cached `G:\Poze\` hashes from PR #61).
  - `scripts/.photo-classify/g-master-dedup/hashes-new.ndjson` (newly computed for the broader scope).
- Quarantine target: `G:\duplicates-to_be_deleted\` (created this run; note the underscore in the spec).
- Log: `scripts/.g-master-dedup.log` (TSV).
- Summary JSON: `scripts/.g-master-dedup.summary.json`.
- Branch: `docs/g-master-dedup`.
- Started: `2026-04-29T08:48:04.906Z`
- Finished: `2026-04-29T08:49:30.876Z`
- Duration: **86.0 s**
- Records loaded: **71,033**
- Filtered out before grouping: missing=29,346 (stale paths from prior reorgs), sensitive=135, skip-dir=1,315.
- Flagged as exact-match-only (small < 600 px short axis, or low-entropy dHash): **11,564** — these still group via SHA-256 sub-buckets but are excluded from Hamming-near-match to avoid the all-zeros icon collision problem.
- Eligible photos grouped: **40,237** (under the 100,000 sanity cap).
- Duplicate groups (≥ 2 members): **7,715**
- Total members across groups: **18,850**
- **Moved to quarantine: 11,135** (59.1% of grouped members).
- Move failures: 0
- Filename collisions suffixed: 0
- Cross-folder duplicate groups: **6,697**
- Skipped at move-time (cap, missing, sensitive): 0.

## Moved by source root

| Root | Moved |
| --- | ---: |
| `G:\Video\WhatsApp_Images` | 4,881 |
| `G:\backup media telefon` | 4,502 |
| `G:\WD_EXT_HDD` | 1,113 |
| `G:\Poze (other)` | 571 |
| `G:\Poze\WhatsApp-by-year` | 44 |
| `G:\Poze\<year>` | 24 |

## Keepers by destination root

(Where the canonical copy lives after this pass — i.e. the priority winner of each group.)

| Root | Groups kept |
| --- | ---: |
| `G:\Poze (other)` | 2,538 |
| `G:\Poze\WhatsApp-by-year` | 2,258 |
| `G:\Poze\<year>` | 1,915 |
| `G:\WD_EXT_HDD` | 726 |
| `G:\Video\WhatsApp_Images` | 180 |
| `G:\backup media telefon` | 98 |

## Top 10 largest dup groups (by files moved)

| # | group_id | Members | Moved | Cross-folder | Roots present | Keeper |
| - | --: | --: | --: | --- | --- | --- |
| 1 | 1846 | 26 | 25 | no | `G:\Poze (other)` | `G:\Poze\ic_launcher_107.png` |
| 2 | 1847 | 26 | 25 | no | `G:\Poze (other)` | `G:\Poze\ic_launcher_108.png` |
| 3 | 1848 | 26 | 25 | no | `G:\Poze (other)` | `G:\Poze\ic_launcher_109.png` |
| 4 | 1849 | 26 | 25 | no | `G:\Poze (other)` | `G:\Poze\ic_launcher_110.png` |
| 5 | 1850 | 26 | 25 | no | `G:\Poze (other)` | `G:\Poze\ic_launcher_111.png` |
| 6 | 4563 | 18 | 17 | yes | `G:\Video\WhatsApp_Images`, `G:\backup media telefon`, `G:\Poze\WhatsApp-by-year` | `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0008.jpg` |
| 7 | 2911 | 15 | 14 | yes | `G:\Video\WhatsApp_Images`, `G:\WD_EXT_HDD`, `G:\backup media telefon`, `G:\Poze\<year>` | `G:\Poze\2016\IMG_20160816_212345.jpg` |
| 8 | 4155 | 15 | 14 | yes | `G:\Video\WhatsApp_Images`, `G:\backup media telefon`, `G:\Poze\WhatsApp-by-year` | `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0018.jpg` |
| 9 | 4412 | 15 | 14 | yes | `G:\Video\WhatsApp_Images`, `G:\backup media telefon`, `G:\Poze\WhatsApp-by-year` | `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0019.jpg` |
| 10 | 6511 | 14 | 13 | no | `G:\WD_EXT_HDD` | `G:\WD_EXT_HDD\C PARTITION EDY PC\upload\114.jpg` |

## Cross-folder duplicate samples

When a photo appears in two roots (e.g. `G:\Poze\<year>\…` and
`G:\Video\WhatsApp_Images\…`), the keeper-priority rule kept the
`G:\Poze\` copy and quarantined the other. Sample (first 12):

- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0008.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0017.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\<year>`: `G:\Poze\2016\IMG_20160816_212345.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20230831-WA0013.jpeg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0018.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0022.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0019.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0020.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0009.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0009.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0015.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20190106-WA0010.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0007.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0007.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0010.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0010.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\<year>`: `G:\Poze\2023\Denmark 23 (02-4)\IMG_20230211_151516_BURST001_COVER.jpg`  ←  kept; moved `G:\Poze\1000003826.jpg` (`G:\Poze (other)`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0024.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0024.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0026.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20180415-WA0030.jpg` (`G:\Video\WhatsApp_Images`)
- `G:\Poze\WhatsApp-by-year`: `G:\Poze\WhatsApp-by-year\2018\IMG-20180415-WA0025.jpg`  ←  kept; moved `G:\Video\WhatsApp_Images\WhatsApp Images\IMG-20190106-WA0012.jpg` (`G:\Video\WhatsApp_Images`)

## Recovery / undo

Every move is logged in `scripts/.g-master-dedup.log` with columns
`timestamp\tevent\tgroup_id\told_path\tnew_path\treason`. Quarantine is
fully reversible.

To restore one specific file:

```powershell
Move-Item -LiteralPath '<new_path>' -Destination '<old_path>'
```

To restore everything (PowerShell one-liner — replays the log):

```powershell
Get-Content scripts/.g-master-dedup.log |
  Where-Object { $_ -match "^[^#].*`tMOVE(_SUFFIXED|_EXDEV)?`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    $old = $cols[3]; $new = $cols[4]
    if (Test-Path -LiteralPath $new) {
      $dir = Split-Path -Parent $old
      if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
      }
      Move-Item -LiteralPath $new -Destination $old
    }
  }
```

## Final-delete (Eduard's call, after eyeball pass)

Once you have spot-checked the quarantine and are happy:

```powershell
Remove-Item -LiteralPath G:\duplicates-to_be_deleted -Recurse -Force
```

That command is **destructive** and should only be run after a manual
review. Not part of this PR.

## Constraints honoured

- Move-only (no deletes). `fs.renameSync` on the same volume; copy + unlink fallback on EXDEV.
- P13 sensitive folders untouched: `G:\Citizenship*`, `G:\backup NC*`,
  `G:\Whatsapp\` (audio-only WhatsApp archive, separate from the
  Video\WhatsApp_Images media archive),
  `G:\Important Documents\`, plus the in-Poze sensitive set
  (`CV + CL photos\`, `Driving license photos\`, `ID Photos\`,
  `Passport photos\`, `Residence permit photos\`, `Camera Roll iPhone Backup\`).
- `G:\Poze\.duplicates\` left in place — those were already quarantined by
  PR #61 and are awaiting Eduard's final-delete call separately.
- Skip directories anywhere in the tree: `.duplicates\`,
  `.review-for-delete\`, `Screenshots\`, `duplicates-to_be_deleted\`,
  `$RECYCLE.BIN\`, `System Volume Information\`, `Recycle Bin\`.
- Photo cap: 100,000 (eligible records were 40,237 — well under).
- Collisions: appended `-2`, `-3` … suffix and logged (0 this run).

## Threshold calibration

PR #61 used Hamming ≤ 8 on `G:\Poze\` only (40k photos). At the wider 60k+
scope of this pass — adding `G:\Video\WhatsApp_Images\` (10k WhatsApp
exports), `G:\WD_EXT_HDD\` (4k legacy), and `G:\backup media telefon\`
(5.7k phone backups) — the same threshold cascades transitively across the
denser hash space and merges genuinely different photos via chains of
"close-enough" 8×8 dHashes (verified empirically: a single Spain 16 keeper
absorbed 3,500 unrelated images via chained near-matches).

This pass therefore defaults to **threshold = 0** (exact-dHash match), with
SHA-256 sub-bucketing for low-entropy hashes (tiny / icon images) so true
byte-identical duplicates still group. Hamming-near-match remains available
behind `--threshold N` with a 150-member group-size cap as cascade
protection.

## Keeper-priority rule

For each duplicate group, the keeper is selected by the first matching tier:

1. Inside `G:\Poze\<year>\<cluster>\…` (already organized into a trip / cluster folder)
2. Inside `G:\Poze\<year>\…` (year bucket, no cluster)
3. Inside `G:\Poze\WhatsApp-by-year\<year>\…`
4. Inside `G:\Poze\` root or other `G:\Poze\` subfolder
5. Inside `G:\Video\WhatsApp_Images\…` (raw WhatsApp archive)
6. Anywhere else — newest `mtime` wins

Tiebreakers within a tier: earliest `mtime` (more original) → larger pixel
area → larger file size. The `anywhere else` tier flips the mtime sort to
newest-first per Eduard's spec.

## Next steps for Eduard

1. Spot-check `G:\duplicates-to_be_deleted\` against the keepers in
   `G:\Poze\`. Group-by-group sanity is in the log; the visual diff should
   be tight (Hamming ≤ 0 ≈ "looks the same").
2. If a single file looks miscategorised: grep
   `scripts/.g-master-dedup.log` for its filename and run the per-file
   recovery one-liner above.
3. When happy, run the final-delete one-liner. The pre-existing
   `G:\Poze\.duplicates\` from PR #61 is not part of this tree — that's a
   separate cleanup decision.
