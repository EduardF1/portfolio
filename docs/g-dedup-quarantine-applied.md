# G:\Poze\ perceptual-dedup quarantine — applied 2026-04-28

Reversible quarantine of P-B (perceptual-dedup, dHash Hamming ≤ 8) demote
candidates from `G:\Poze\` into `G:\Poze\.duplicates\<original-relative-path>`.
Move-only — no deletes. The "keeper" of each group (members[0] in
`scripts/.photo-classify/P8-redo/dedup.ndjson`) was left in place; subsequent
group members were quarantined.

## Run summary

- Script: `scripts/quarantine-g-dedup.mjs`
- Input: `scripts/.photo-classify/P8-redo/dedup.ndjson` (8,631 groups,
  17,529 demote candidates)
- Log: `scripts/.g-dedup-quarantine.log` (TSV, one line per move + every
  skip / keeper-missing event + run-boundary comments; ~2.0 MB)
- Summary JSON: `scripts/.g-dedup-quarantine.summary.json`
- Branch: `docs/g-dedup-quarantine`
- Started: `2026-04-28T23:49:21.170Z`
- Finished: `2026-04-28T23:51:29.724Z`
- Duration: **128.6 s** (~2 min 9 s)
- Groups processed: **8,631**
- Demote candidates seen: **17,529**
- **Moved: 12,986**
- Filename collisions suffixed: **0**
- Move failures: **0**

## Skip counts by reason

| Reason | Count |
| ---- | -----: |
| `sensitive-blocklist` (P13 folders + keeper-in-sensitive groups) | 4,127 |
| `source-missing` (file gone before this run reached it) | 416 |
| `d-portfolio` (D:\Portfolio\poze\, out of scope) | 0 |
| `out-of-scope-root` (path not under G:\Poze\) | 0 |
| `already-quarantined` (path under .duplicates\) | 0 |
| `move-failed` (FS error after retries) | 0 |
| `max-moves-reached` (cap hit) | 0 |
| **Total skipped** | **4,543** |

`12,986 moved + 4,543 skipped = 17,529 demote candidates` (✓ reconciles).

The bulk of `sensitive-blocklist` is **group 2105** alone — the 4,031-image
byte-identical CV/CL DSLR cluster whose keeper lives at
`G:\Poze\CV + CL photos\All\DSC_0882.JPG`. Per spec, when a group's keeper is
inside a P13 folder, the entire group is skipped — including the demotes that
sit at `G:\Poze\` root (e.g. `G:\Poze\DSC_0880.JPG`). That single group
accounts for ~3,888 of the 4,127 `sensitive-blocklist` skips; the remaining
~239 are scattered demotes that individually live inside other P13 folders
(`Driving license photos`, `ID Photos`, `Passport photos`,
`Residence permit photos`, etc.).

## Top 10 largest demote groups (by files quarantined)

| # | group_id | Moved | member_count | Keeper | Notes |
| - | --: | --: | --: | --- | --- |
| 1 | 2087 | 144 | 145 | `G:\Poze\ic_launcher_round_105.png` | Android launcher icon variants (192×192 PNG cluster) |
| 2 | 2043 | 52 | 53 | `G:\Poze\1000049338_2.jpg` | Mixed small JPG/PNG screenshot cluster (232×232) |
| 3 | 8521 | 52 | 53 | `G:\Poze\Screenshot_2024-11-21-22-50-07-61_1aa686df619c9181e4c508143eb65c87.jpg` | November-2024 screenshot run (1080×2412) |
| 4 | 3432 | 47 | 48 | `G:\Poze\IMG_20230422_233053_BURST002.jpg` | April-2023 burst-mode capture (4608×3456) |
| 5 | 2008 | 42 | 43 | `G:\Poze\IMG_20180207_093318.jpg` | Feb-2018 photo + 42 near-dupes (incl. `Poze Huawei\` copy) |
| 6 | 8301 | 42 | 43 | `G:\Poze\Screenshot_2025-01-30-14-04-27-43_0838a639474f00ba9938a3404d829a95.jpg` | Jan-2025 screenshot run |
| 7 | 5702 | 40 | 42 | `G:\Poze\IMG20230922134302.jpg` | Sep-2023 burst (3072×4096) |
| 8 | 8356 | 36 | 37 | `G:\Poze\Screenshot_2024-12-01-14-18-41-71_fe657d718f12c74f5142081a66e15273.jpg` | Late-2024 screenshot cluster |
| 9 | 2780 | 32 | 34 | `G:\Poze\IMG20241214151500.jpg` | Dec-2024 burst (3072×4096) |
| 10 | 8134 | 28 | 29 | `G:\Poze\Screenshot_2025-07-30-21-26-44-37_1aa686df619c9181e4c508143eb65c87.jpg` | July–Oct 2025 screenshot cluster |

(There is no `group 2105` in this list because it was skipped wholesale —
its 3,888 demotes count under `sensitive-blocklist`, not under "moved".)

## Keepers missing on disk — data-integrity flag

`keeperMissingCount = 1572`. **All 1,572 are benign** — they match the
WhatsApp filename pattern `IMG-YYYYMMDD-WAxxxx.jpg` and the file exists at
`G:\Poze\WhatsApp-by-year\<YYYY>\<basename>`, i.e. it was relocated by the
prior `scripts/reorg-g-whatsapp.mjs` run on 2026-04-28. The dedup index was
built before that reorg; paths are stale, content is intact.

`keeperMissingReal = []` — **zero unexplained missing keepers**. Demotes for
those 1,572 groups still moved into quarantine as expected (the relocated
keeper remains the canonical copy).

If a future audit wants to refresh the dedup index, regenerate
`dedup.ndjson` against the current G:\Poze\ tree.

## Recovery / undo

Every quarantined file is recoverable from the log. The TSV has columns
`timestamp\tevent\tgroup_id\told_path\tnew_path\treason`. To restore one
file:

```bash
mv "G:/Poze/.duplicates/<rel>" "G:/Poze/<rel>"
```

To restore everything (PowerShell one-liner, replays the log):

```powershell
Get-Content scripts/.g-dedup-quarantine.log |
  Where-Object { $_ -match "^[^#].*\tMOVE(_SUFFIXED|_EXDEV)?\t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    $old = $cols[3]; $new = $cols[4]
    if (Test-Path -LiteralPath $new) {
      $dir = Split-Path -Parent $old
      if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
      Move-Item -LiteralPath $new -Destination $old
    }
  }
```

To restore one specific group (e.g. group 2087):

```powershell
Select-String -Path scripts/.g-dedup-quarantine.log -Pattern "`tMOVE.*`t2087`t" |
  ForEach-Object {
    $cols = ($_.Line -split "`t")
    Move-Item -LiteralPath $cols[4] -Destination $cols[3]
  }
```

## Constraints honoured

- ✅ Move-only (`fs.renameSync` on the same volume; no deletes).
- ✅ P13 sensitive folders untouched: `G:\Citizenship*`,
  `G:\Poze\CV + CL photos\`, `G:\Poze\Driving license photos\`,
  `G:\Poze\ID Photos\`, `G:\Poze\Passport photos\`,
  `G:\Poze\Residence permit photos\`, `G:\Poze\Camera Roll iPhone Backup\`,
  `G:\Whatsapp\`, `G:\Important Documents\`, `G:\backup NC*\`.
- ✅ Group 2105 (4,031-image CV/CL DSLR cluster) **skipped entirely** — the
  group's keeper sits in `G:\Poze\CV + CL photos\All\`, so per-spec the
  whole group's demotes were rejected even where they sat at G:\Poze\ root.
- ✅ `D:\Portfolio\poze\` not touched (zero matches anyway, dedup.ndjson is
  G:-only).
- ✅ Filename collisions: zero this run (the quarantine tree mirrors the
  source tree, so collisions only happen when two source paths share both
  basename and relative directory — none occurred). Suffix logic is in place
  for future re-runs.
- ✅ Source-missing files: 416 — skip + log, no error.

## Next steps for Eduard

1. Spot-check `G:\Poze\.duplicates\` against the keepers in `G:\Poze\` —
   the visual diff should be tight (Hamming ≤ 8 ≈ "looks the same").
2. If happy: keep `.duplicates\` for ~30 days, then a follow-up task can
   delete the tree once you've signed off.
3. If a single file looks miscategorised: grep `scripts/.g-dedup-quarantine.log`
   for its filename, copy the `old_path` and `new_path` from the matching
   `MOVE` line, run the one-liner above to undo just that move.
4. Group 2105 (CV/CL) is unchanged — if you want to dedupe that cluster,
   it needs a separate, sensitive-folder-aware pass with explicit consent.
