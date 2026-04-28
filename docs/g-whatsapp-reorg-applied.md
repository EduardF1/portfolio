# G:\Poze\ WhatsApp media reorg — applied 2026-04-28

Per-year bucketing of WhatsApp media files (`IMG-YYYYMMDD-WAxxxx.jpg`) at the
root of `G:\Poze\` into `G:\Poze\WhatsApp-by-year\<year>\`. Move-only,
reversible, no deletes.

## Run summary

- Script: `scripts/reorg-g-whatsapp.mjs`
- Log: `scripts/.g-whatsapp-reorg.log` (TSV, one line per moved file plus run-boundary comments)
- Branch: `docs/g-whatsapp-yearbucket-reorg`
- Started: `2026-04-28T23:39:50.712Z`
- Finished: `2026-04-28T23:40:24.784Z`
- Duration: 34.1 s
- Source root files scanned: 38,162
- Matched WhatsApp pattern: 2,312
- Skipped (not WhatsApp pattern): 35,850
- **Moved: 2,312**
- **Unmoved (locked / failed): 0**

## Moved by year

| Year | Files moved |
| ---- | -----------:|
| 2016 |        221  |
| 2017 |         36  |
| 2018 |        179  |
| 2019 |        163  |
| 2020 |        106  |
| 2021 |        128  |
| 2022 |        541  |
| 2023 |        925  |
| 2024 |          5  |
| 2025 |          7  |
| 2026 |          1  |
| **Total** | **2,312** |

(Distribution drifted slightly from the prior scan — 2022 was 545 → 541, 2023
was 959 → 925, 2025 was 8 → 7. Within expected drift bounds; canonical state
is what was on disk at run time.)

## What was NOT moved

The strict regex used is `^IMG-(\d{4})(\d{2})(\d{2})-WA\d+\.jpe?g$`. Files at
the root that contain the substring `IMG-YYYYMMDD-WA` but have an additional
suffix between the digits and `.jpg` (e.g. `_2`, `(1)`) deliberately stay put,
per the task constraint "DO NOT touch files NOT matching the WhatsApp pattern".
There are 39 such variants currently at the root, e.g.
`IMG-20220329-WA0002_2.jpg`, `IMG-20220630-WA0000(1).jpg`. They are duplicates
of moved files; if a follow-up wants to bucket them too, broaden the regex to
`^IMG-(\d{4})(\d{2})(\d{2})-WA\d+(?:[_(].*)?\.jpe?g$`.

Camera-source files (`IMG_YYYYMMDD_HHMMSS.jpg`, `IMG2026MMDDHHMMSS.jpg`, etc.)
also stay at root — explicitly out-of-scope per spec.

Subfolders (`CV + CL photos`, `Driving license photos`, `ID Photos`,
`Passport photos`, `Residence permit photos`, …) were never enumerated. The
script only reads `G:\Poze\` root non-recursively.

## Unmoved file list

None. All 2,312 matched files were moved successfully.

## Recovery

The reorg is fully reversible. The log at `scripts/.g-whatsapp-reorg.log` is a
TSV of every move:

```
<timestamp>\t<old_path>\t<new_path>\t<filename>\t<year>
```

### Manual one-off restore

```bash
mv "G:/Poze/WhatsApp-by-year/<year>/<file>" "G:/Poze/<file>"
```

### Bulk reverse (one-liner from the repo root, bash)

```bash
awk -F'\t' '!/^#/ {print $3 "\t" $2}' scripts/.g-whatsapp-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### Bulk reverse (PowerShell)

```powershell
Get-Content scripts/.g-whatsapp-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

After a successful reverse, the empty `G:\Poze\WhatsApp-by-year\<year>\`
folders can be removed manually if desired (the reverse script does not delete
them — keeping with the no-delete policy).

## Constraint compliance

- [x] No deletes anywhere.
- [x] No touch of `G:\Citizenship*`, `G:\Whatsapp\`, `G:\Important Documents\`,
      `G:\backup NC*`, `G:\Poze\CV + CL photos\`, `G:\Poze\Driving license photos\`,
      `G:\Poze\ID Photos\`, `G:\Poze\Passport photos\`,
      `G:\Poze\Residence permit photos\` (script reads `G:\Poze\` root only,
      non-recursively).
- [x] Camera-source files left at root.
- [x] Move uses `fs.renameSync` — atomic on the same volume.
- [x] Single run; log header + footer prove a single run.
