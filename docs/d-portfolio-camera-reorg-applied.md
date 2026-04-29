# D:\Portfolio\poze\ camera media reorg — applied 2026-04-29

Per-year bucketing of camera-source media (Android Camera, Huawei,
13-digit epoch-ms exports) at the root of `D:\Portfolio\poze\` into
`D:\Portfolio\poze\<year>\`. Move-only, reversible, no deletes.

This is the D-side mirror of the G-side reorg work (PR #57 covered the G:\Poze\
WhatsApp family; this PR covers the D-side camera family). The D-side WhatsApp
family (`IMG-YYYYMMDD-WAxxxx.jpg`, 2,351 files) is **deliberately left at
root** — only G:\ received the WhatsApp reorg.

## Run summary

- Script: `scripts/reorg-d-portfolio-camera.mjs`
- Log: `scripts/.d-portfolio-camera-reorg.log` (TSV, one line per moved file plus run-boundary comments)
- Summary JSON: `scripts/.d-portfolio-camera-reorg.summary.json` (latest run only)
- Branch: `docs/d-portfolio-yearbucket-reorg`
- Started: `2026-04-29T06:29:06Z` (pass 1)
- Finished: `2026-04-29T06:30:34Z` (pass 3)
- Total elapsed (3 passes): ~88 s
- Source root files at start of pass 1: 36,963
- Source root files after pass 3: 27,024
- **Moved: 9,939** (9,706 + 173 retry + 60 extended-pattern)
- **Unmoved (locked / failed): 0**

Three passes were run because (a) 173 files were transiently `EBUSY` on pass 1
(retried successfully on pass 2 with no code change), and (b) 60 files matched
broader Pixel/GCam variants (`IMG_YYYYMMDD_HHMMSS<ms>_HDR.jpg`,
`IMG…~2.jpg`) once the regex was widened to accept an optional 3-digit
millisecond extension and `~`/`-` suffix-start characters.

## Patterns matched

| Pattern id | Shape | Moved |
| ---------- | ----- | -----:|
| `huawei-imgYMDhms` | `IMGYYYYMMDDHHMMSS[suffix].jpg\|jpeg\|png` | 5,228 |
| `android-camera`   | `IMG_YYYYMMDD_HHMMSS[ms][suffix].jpg\|jpeg\|png\|mp4` | 4,702 |
| `epoch-ms`         | `<13-digit-ms>.jpg\|jpeg\|jfif\|png\|mp4` | 9 |
| **Total**          |   | **9,939** |

Pattern stems also enumerated but not present at the D-side root: `PXL_*`,
`MVIMG_*`, `VID_*`. The script keeps them in case future drops include them.

## Moved by year

| Year | Files moved |
| ---- | -----------:|
| 2016 |        110  |
| 2017 |         40  |
| 2018 |        730  |
| 2019 |        831  |
| 2020 |        190  |
| 2021 |         60  |
| 2022 |      1,001  |
| 2023 |      2,417  |
| 2024 |      1,104  |
| 2025 |      2,320  |
| 2026 |      1,136  |
| **Total** | **9,939** |

Eleven year folders created at `D:\Portfolio\poze\<YYYY>\` (2016–2026). No
year folder existed before this run; none were recursed into.

## Residue at root

After pass 3, the D-root has:

- **0** files matching `IMG_YYYYMMDD_HHMMSS*` (any case)
- **0** files matching `IMGYYYYMMDDHHMMSS*` (any case)
- **0** files matching `<13-digit-ms>.<ext>`
- **2,351** files matching `IMG-YYYYMMDD-WAxxxx.jpg` — *intentionally left*,
  per spec ("D-side WhatsApp stays at root for now")
- **24,673** other files — non-camera (Facebook IDs, browser dumps, freeform
  names, screenshots, `DSC_NNNN.JPG` without embedded date, ISO-date
  `YYYY-MM-DD-…` files, etc.). These are out of scope here; some are already
  flagged in PR #62's `.review-for-delete\` quarantine queue.

The current D-root file count is **27,024** down from **36,963** before the
run (a delta of 9,939 — exactly what was moved into year folders).

## Sensitive folders untouched

The script enumerates `D:\Portfolio\poze\` non-recursively and only acts on
files (`isFile()`). Subfolders are never read. The following sensitive
subfolders, all detected and tagged at run time, were left alone:

- `D:\Portfolio\poze\CV + CL photos\`
- `D:\Portfolio\poze\Driving license photos\`
- `D:\Portfolio\poze\ID Photos\`
- `D:\Portfolio\poze\Passport photos\`
- `D:\Portfolio\poze\Residence permit photos\`
- `D:\Portfolio\poze\Whatsapp\`

The PR #62 quarantine tree at `D:\Portfolio\poze\.review-for-delete\` was
similarly skipped (it is a directory, never enumerated by `listRootFiles`).

## What was NOT moved

- **WhatsApp family** (`IMG-YYYYMMDD-WAxxxx*.jpg`, ~2,351 files). The script
  detects them and explicitly tags `skip: 'whatsapp-pattern'` rather than
  matching them. Spec says D-side WhatsApp reorg is deferred.
- **DSC_NNNN.JPG** Nikon-style files (no embedded date — date would have to
  come from EXIF, which is out of scope).
- **Facebook photo-id, Browser dumps, etc.** — these belong to the
  PR #62 `.review-for-delete\` workflow, not the year-bucket reorg.
- **Anything inside subfolders.** Camera files inside e.g.
  `D:\Portfolio\poze\Poze Huawei\` are not enumerated.

## Recovery

The reorg is fully reversible. The log at
`scripts/.d-portfolio-camera-reorg.log` is a TSV of every move:

```
<timestamp>\t<old_path>\t<new_path>\t<filename>\t<year>\t<pattern_id>
```

### Manual one-off restore

```bash
mv "D:/Portfolio/poze/<year>/<file>" "D:/Portfolio/poze/<file>"
```

### Bulk reverse (one-liner from the repo root, bash)

```bash
awk -F'\t' '!/^#/ {print $3 "\t" $2}' scripts/.d-portfolio-camera-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### Bulk reverse (PowerShell)

```powershell
Get-Content scripts/.d-portfolio-camera-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

After a successful reverse, the empty `D:\Portfolio\poze\<year>\` folders can
be removed manually if desired (the reverse script does not delete them —
keeping with the no-delete policy).

## Constraint compliance

- [x] No deletes anywhere — `fs.renameSync` only.
- [x] No touch of sensitive subfolders (CV/CL, Driving license, ID, Passport,
      Residence permit, Whatsapp); enumeration is non-recursive on root.
- [x] No touch of `.review-for-delete\` (PR #62 quarantine).
- [x] Pre-existing year folders are not recursed into (the script only reads
      files at the root, never directories).
- [x] WhatsApp pattern (`IMG-YYYYMMDD-WAxxxx.jpg`) deliberately left at root
      per spec.
- [x] Move uses `fs.renameSync` — atomic on the same volume (D:\).
- [x] Source-root existence checked at start; on missing, soft-aborts with a
      summary JSON instead of crashing.
- [x] Reversible: every move appended to `scripts/.d-portfolio-camera-reorg.log`.
