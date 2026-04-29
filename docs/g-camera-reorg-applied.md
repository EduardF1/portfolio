# G:\Poze\ camera-source reorg — applied 2026-04-28

Per-year bucketing of camera-source media files at the root of `G:\Poze\` into
`G:\Poze\<YYYY>\`. Move-only, reversible, no deletes.

This is the third bulk pass on `G:\Poze\` (after PR #57 WhatsApp reorg, PR #61
dedup quarantine, PR #62 bulk-delete quarantine). It targets the camera-source
filename families left at the root (Huawei `IMG_YYYYMMDD_HHMMSS`, OnePlus
`IMGYYYYMMDDHHMMSS`, epoch-ms `1234567890123.jpg`, and older Canon `IMG_NNNN`
where year is read from EXIF `DateTimeOriginal` via exiftool).

## Run summary

- Script: `scripts/reorg-g-camera.mjs`
- Log: `scripts/.g-camera-reorg.log` (TSV, one line per moved file plus run-boundary comments)
- Branch: `docs/g-camera-yearbucket-reorg`
- Started: `2026-04-29T06:31:07.700Z`
- Finished: `2026-04-29T06:34:11.968Z`
- Duration: 184.3 s (~3 min, EXIF reads bottleneck the long tail)
- Source root files scanned: 17,629
- **Moved: 7,974**
- **Skipped (left at root): 9,655**
- **Collisions renamed (`-2` suffix): 2**
- **Failed: 0**

## Moved by year

| Year | Files moved |
| ---- | -----------:|
| 2016 |        103  |
| 2017 |         43  |
| 2018 |        643  |
| 2019 |        755  |
| 2020 |        331  |
| 2021 |         48  |
| 2022 |      1,092  |
| 2023 |      1,766  |
| 2024 |        677  |
| 2025 |      1,701  |
| 2026 |        815  |
| **Total** | **7,974** |

Years 2017 and 2018 already existed under `G:\Poze\` from prior manual sorting
(140 pre-existing files in 2017, 102 in 2018). The script adds to those
folders without touching what's already there.

## Files left at root

| Reason | Count |
| ------ | -----:|
| `no-camera-pattern` (no IMG_/IMG2/epoch/IMG_NNNN signal) | 9,630 |
| `whatsapp-already-bucketed` (`IMG-YYYYMMDD-WAxxxx`)      | 23    |
| `exif-no-date` (IMG_NNNN with no readable EXIF date)     | 2     |
| **Total left at root** | **9,655** |

`no-camera-pattern` includes Screenshots (~4,680), `Screenshot_*`/
`Screenshot YYYY-MM-DD …` files (always skipped per spec), random
`<bigint>.jpg` non-epoch numerics, UUID-named files, `.0.jpg` … `.12.jpg`
junk, `1.png`, `_free_r_t_o_s_*.png` (project artefacts), and many other
non-camera filename shapes. These stay at root for manual sort later — spec
requires "SKIP, leave at root for manual sort later" when no year signal is
available.

The 23 `IMG-YYYYMMDD-WAxxxx` files left at root are non-strict variants
(e.g. `IMG-YYYYMMDD-WA0000_2.jpg`, `IMG-…(1).jpg`) that PR #57's strict regex
deliberately did not catch — also out of scope for this pass.

## Collisions

Two files at the root collided with same-named files inside the pre-existing
`G:\Poze\2018\` folder. They were moved with a `-2` suffix to preserve both
copies (no overwrite, no delete):

| Source | Destination |
| ------ | ----------- |
| `G:\Poze\IMG_20180207_093316.jpg` | `G:\Poze\2018\IMG_20180207_093316-2.jpg` |
| `G:\Poze\IMG_20180207_093337.jpg` | `G:\Poze\2018\IMG_20180207_093337-2.jpg` |

If a follow-up determines those are exact duplicates, the `-2` copy can be
quarantined (not deleted) using the established `.duplicates\` flow.

## Recovery

The reorg is fully reversible. The log at `scripts/.g-camera-reorg.log` is a
TSV of every move:

```
<timestamp>\t<old_path>\t<new_path>\t<filename>\t<year>\t<source>\t<collision_suffix>
```

`source` is one of `filename:img_date_underscore`, `filename:img_date_nosep`,
`filename:epoch_ms`, `filename:epoch_s_idx`, `exif:img_4digit`.
`collision_suffix` is 0 unless a `-N` suffix was appended.

### Manual one-off restore

```bash
mv "G:/Poze/<year>/<file>" "G:/Poze/<original_file>"
```

Note: collision-renamed files restore to the un-suffixed root name (the log's
`old_path` is the source-of-truth). E.g. `2018\IMG_20180207_093316-2.jpg`
restores to `Poze\IMG_20180207_093316.jpg`.

### Bulk reverse (one-liner from the repo root, bash)

```bash
awk -F'\t' '!/^#/ && NF>=3 {print $3 "\t" $2}' scripts/.g-camera-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### Bulk reverse (PowerShell)

```powershell
Get-Content scripts/.g-camera-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path -LiteralPath $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1] -ErrorAction SilentlyContinue
    }
  }
```

After a successful reverse, the per-year folders may contain pre-existing
files from before this reorg — those are NOT touched by the reverse script
(it only touches files mentioned in the log). The empty `<year>\` folders
that were created by this run can be removed manually if desired (the
reverse script does not delete them — keeping with the no-delete policy).

## Constraint compliance

- [x] No deletes anywhere — `fs.renameSync` move-only.
- [x] No touch of `G:\Citizenship*`, `G:\Whatsapp\`, `G:\Important Documents\`,
      `G:\backup NC*`, `G:\Poze\CV + CL photos\`, `G:\Poze\Driving license photos\`,
      `G:\Poze\ID Photos\`, `G:\Poze\Passport photos\`,
      `G:\Poze\Residence permit photos\` — script reads `G:\Poze\` root only,
      non-recursively, so subfolders are never enumerated.
- [x] No touch of `G:\Poze\WhatsApp-by-year\`, `G:\Poze\.duplicates\`,
      `G:\Poze\.review-for-delete\`, `Poze Huawei\` — same reason
      (subfolders never enumerated).
- [x] WhatsApp pattern `IMG-YYYYMMDD-WAxxxx` explicitly skipped (already done in PR #57).
- [x] `Screenshot_*` files explicitly skipped per spec (not photographic).
- [x] Files with no year signal AND no readable EXIF stay at root.
- [x] Same-name collision → `-N` suffix, never overwrite.
- [x] Single run; log header + footer prove a single run.
