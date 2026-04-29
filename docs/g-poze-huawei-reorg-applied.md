# G:\Poze\Poze Huawei\ reorg — applied 2026-04-28

Per-year bucketing of Eduard's Huawei-era photos (`G:\Poze\Poze Huawei\`) into
sibling year folders at the parent level (`G:\Poze\<year>\`). Move-only,
reversible, no deletes.

## Run summary

- Script: `scripts/reorg-g-poze-huawei.mjs`
- Log: `scripts/.g-poze-huawei-reorg.log` (TSV, one line per moved file plus run-boundary comments)
- Branch: `docs/g-poze-huawei-reorg`
- Started: `2026-04-29T06:26:50.856Z`
- Finished: `2026-04-29T06:26:53.734Z`
- Duration: 2.9 s
- Source files discovered (recursive): 242
- Sensitive subdirs skipped: 0 (none present)
- **Moved: 242**
- **Unresolved (no year): 0**
- **Failed: 0**
- **Collision-suffixed (`-huawei-NNN`): 0**

## Moved by year

| Year | Files moved |
| ---- | -----------:|
| 2017 |        140  |
| 2018 |        102  |
| **Total** | **242** |

This matches the prior P9 audit conclusion that `Poze Huawei\` is a 2017–2018
era cluster — Huawei P9 ownership window for Eduard.

## Filename pattern stats

All 242 files were classified via filename pattern; no EXIF fallback was
needed.

| Pattern | Files |
| ------- | -----:|
| `IMG_YYYYMMDD_HHMMSS*` (e.g. `IMG_20170120_125646.jpg`) | 242 |
| `YYYYMMDD_HHMMSS*`     | 0 |
| `YYYY-MM-DD*`          | 0 |
| `IMG-YYYYMMDD-WA*`     | 0 |
| EXIF `DateTimeOriginal` fallback | 0 |
| **Total**              | **242** |

## What was NOT moved

Nothing. Every file in `G:\Poze\Poze Huawei\` matched the
`IMG_YYYYMMDD_HHMMSS*` pattern with a sane year/month/day. The source
directory is now empty.

The empty `G:\Poze\Poze Huawei\` folder is left in place per spec — a future
task may use the dirpath. The no-delete policy applies to directories too.

### Sensitive subfolder check

The script defensively skips any subdirectory named `ID Photos`,
`Passport photos`, `Driving license photos`, `Residence permit photos`, or
`CV + CL photos` (P13 blocklist). None of these were found inside
`Poze Huawei\` — the tree was a flat directory of 242 JPGs.

### Filename collisions

There was no overlap between Huawei filenames and any pre-existing
`G:\Poze\<year>\<file>` (the year buckets did not exist before this run — they
were created by `mkdirSync`). The `-huawei-NNN` suffix code path was therefore
never exercised.

## Recovery

The reorg is fully reversible. The log at `scripts/.g-poze-huawei-reorg.log`
is a TSV of every move:

```
<timestamp>\t<old_path>\t<new_path>\t<filename>\t<year>\t<detection>
```

### Manual one-off restore

```bash
mv "G:/Poze/<year>/<file>" "G:/Poze/Poze Huawei/<file>"
```

### Bulk reverse (one-liner from the repo root, bash)

```bash
awk -F'\t' '!/^#/ {print $3 "\t" $2}' scripts/.g-poze-huawei-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### Bulk reverse (PowerShell)

```powershell
Get-Content scripts/.g-poze-huawei-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

After a successful reverse, the empty `G:\Poze\2017\` and `G:\Poze\2018\`
folders can be removed manually if desired (the reverse script does not
delete them — keeping with the no-delete policy).

## Constraint compliance

- [x] No deletes anywhere (move-only `fs.renameSync`, atomic on the same volume).
- [x] Operates only inside `G:\Poze\Poze Huawei\`; the only writes outside it
      are creating `G:\Poze\<year>\` siblings and renaming files into them.
- [x] No recursion into other `G:\Poze\<other-folder>\` siblings.
- [x] P13-sensitive subfolder names skipped at recursion (none present).
- [x] Year resolution: filename patterns first, EXIF fallback wired but unused
      (no files needed it).
- [x] Collision strategy `-huawei-NNN` implemented (unused this run).
- [x] Empty `Poze Huawei\` folder left in place.
- [x] Single run; log header + footer prove a single run.
