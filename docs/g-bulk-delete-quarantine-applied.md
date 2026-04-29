# G:\ + D:\ bulk-delete quarantine — 2026-04-29

> Applies the PR #36 / `docs/photo-orphans-triage.md` §6.2 tick-list. **Move-only, reversible, no deletes.** Files matching the high-confidence delete patterns + folder cuts have been relocated under each source root's `.review-for-delete\` tree, preserving directory structure for trivial restoration.

## 1. Headline

| Metric | Value |
| --- | ---: |
| Records scanned (`scan.ndjson`) | 75,719 |
| Candidates identified after filters | 3,282 |
| **Files moved** | **3,039** |
| Source-missing skips (handled by siblings) | 243 |
| P13 sensitive-folder skips | 0 |
| Carve-out (.duplicates / WhatsApp-by-year) skips | 0 |
| Destination collisions (hash-suffixed) | 0 |
| Move failures | 0 |
| Runtime | ~7.7 s |

The doc-stated tick-list of ~3,754 candidates assumed the `IMG_NNNN` (510, absorb-class) and `FB_IMG_*` (110, review-class) patterns *would not* be moved — those are correctly excluded here. After excluding them the doc target is ~3,134; we identified 3,282 (within 5% — the residual variance comes from regex-strictness on `<hex hash>` and a small G/D mirror imbalance for `<10digit>_*`).

The 243 source-missing skips are real-world drift — sibling agents had already pulled those files (e.g. all 18 G-side `X\` files, parts of `Browser\`, parts of the `<10digit>_` cluster) before this run. All skips are logged with reason.

## 2. Moved by root × category

### G:\Poze (1,398 moved)

| Category | Moved |
| --- | ---: |
| `pattern:fb-photo-id` (`^<10digit>_`) | 969 |
| `folder:Browser` | 307 |
| `pattern:received` (Messenger) | 87 |
| `pattern:images-N` (`images (N)`) | 10 |
| `pattern:hex-hash` (32-char hex) | 6 |
| `pattern:logo` | 6 |
| `pattern:image-tg` (`image-0-02-04-`) | 5 |
| `pattern:doxygen-rtos` | 2 |
| `pattern:hash-png` (`N__N.png`) | 2 |
| `pattern:snapchat` | 2 |
| `pattern:download` | 1 |
| `pattern:msgr-photo` | 1 |
| `folder:X` | 0 (all 18 source-missing — handled by sibling) |

### D:\Portfolio\poze (1,641 moved)

| Category | Moved |
| --- | ---: |
| `pattern:fb-photo-id` (`^<10digit>_`) | 1,033 |
| `folder:Browser` | 424 |
| `pattern:received` (Messenger) | 119 |
| `folder:X` | 18 |
| `pattern:logo` | 11 |
| `pattern:images-N` | 10 |
| `pattern:hex-hash` | 6 |
| `pattern:doxygen-rtos` | 6 |
| `pattern:image-tg` | 5 |
| `pattern:hash-png` | 4 |
| `pattern:snapchat` | 2 |
| `pattern:download` | 1 |
| `pattern:msgr-photo` | 1 |
| `pattern:icon` | 1 |

## 3. Combined by category (top 5)

| Rank | Category | Moved (G + D) |
| ---: | --- | ---: |
| 1 | `pattern:fb-photo-id` (Facebook photo IDs `^<10digit>_`) | 2,002 |
| 2 | `folder:Browser` (Pinterest / web saves cluster) | 731 |
| 3 | `pattern:received` (Messenger `received_*`) | 206 |
| 4 | `folder:X` (FB-CDN basenames; D-side only — G all source-missing) | 18 |
| 5 | `pattern:logo` (UI assets) | 17 |

## 4. Skipped by reason

| Reason | Count |
| --- | ---: |
| `source-missing` | 243 |
| `sensitive-blocklist` | 0 |
| `carve-out` | 0 |
| `out-of-scope-root` | 0 |
| `move-failed` | 0 |

The 243 source-missing skips concentrate in:

- `folder:Browser` (G side): 117 — sibling agent pulled prior to this run
- `folder:X` (G side): 18 — entire G:\Poze\X\ photo set already moved
- `pattern:fb-photo-id`: 64
- `pattern:received`: 32
- minor: `doxygen-rtos` (4), `logo` (5), `hash-png` (2), `icon` (1)

## 5. Carve-outs honored (zero touches)

The script was hard-coded to skip:

**P13 sensitive folders** (per `docs/photo-organization.md` §6.1):

- `G:\Poze\CV + CL photos\`
- `G:\Poze\Driving license photos\`
- `G:\Poze\ID Photos\`
- `G:\Poze\Passport photos\`
- `G:\Poze\Residence permit photos\`
- `G:\Poze\camera roll iphone backup\`
- `G:\Whatsapp\`
- `G:\Important Documents\`
- `G:\Citizenship*` (wildcard)
- `G:\backup NC*` (wildcard)
- D-side equivalents under `D:\Portfolio\poze\` and `D:\Portfolio\Important Documents\`

**Recently-reorganized trees** (PR #57 + PR #61 + this script's own tree):

- `G:\Poze\WhatsApp-by-year\`
- `G:\Poze\.duplicates\` and `D:\Portfolio\poze\.duplicates\`
- `G:\Poze\.review-for-delete\` and `D:\Portfolio\poze\.review-for-delete\`

**Zero candidates landed in these prefixes** — the orphan list itself was already carved against P13 (614 sensitive paths excluded upstream per the triage doc), so the in-script gate served as defense-in-depth.

## 6. Recovery (per file)

Every move is logged at `scripts/.g-bulk-delete-quarantine.log` as TSV:

```
timestamp <TAB> event <TAB> category <TAB> old_path <TAB> new_path <TAB> reason
```

To restore a single file:

```powershell
# Per-line restore — old_path is the original location, new_path is the quarantine location.
Move-Item -LiteralPath <new_path> -Destination <old_path>
```

To restore an entire category (e.g. `pattern:logo` because Eduard wants those back):

```powershell
# PowerShell one-liner: parse the TSV log and reverse moves for one category.
Get-Content scripts\.g-bulk-delete-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $cols = $_ -split "`t"; if ($cols[1] -like "MOVE*" -and $cols[2] -eq "pattern:logo") { Move-Item -LiteralPath $cols[4] -Destination $cols[3] } }
```

To restore everything:

```powershell
Get-Content scripts\.g-bulk-delete-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $cols = $_ -split "`t"; if ($cols[1] -like "MOVE*") { Move-Item -LiteralPath $cols[4] -Destination $cols[3] } }
```

## 7. Sign-off path (when Eduard is ready to actually delete)

After a final manual eyeball of `<root>\.review-for-delete\` on each drive, the actual delete is two commands:

```powershell
Remove-Item -LiteralPath 'G:\Poze\.review-for-delete' -Recurse -Force
Remove-Item -LiteralPath 'D:\Portfolio\poze\.review-for-delete' -Recurse -Force
```

**Recommended pre-delete checks:**

1. Spot-check 20 random `<root>\.review-for-delete\Browser\` thumbnails — they should be Pinterest / Doxygen / hex-hash web saves with no personal content.
2. Confirm no `IMG_NNNN` files or `FB_IMG_*` files snuck in (they're not in the script's pattern list, but worth grepping the log: `grep -E "MOVE.*(IMG_\d+|FB_IMG_)" scripts/.g-bulk-delete-quarantine.log` — should yield zero rows).
3. Compare `G:\Poze\.review-for-delete\` vs `D:\Portfolio\poze\.review-for-delete\` for any G-only or D-only oddities (G-side has `\Browser\` only; D-side has `\Browser\` + `\X\` plus more flat-root patterns).

## 8. Related

- `docs/photo-orphans-triage.md` — source tick-list (§6.2)
- `docs/photo-organization.md` §6.1 — sensitive-folder blocklist
- `scripts/quarantine-g-bulk-delete.mjs` — the script
- `scripts/.photo-classify/P-orphans/scan.ndjson` — source NDJSON (75,719 records)
- `scripts/.g-bulk-delete-quarantine.log` — per-move audit trail (TSV, ~470 KB)
- `scripts/.g-bulk-delete-quarantine.summary.json` — JSON summary
- PR #57 — WhatsApp-by-year reorg (carve-out)
- PR #61 — `.duplicates\` quarantine (carve-out)
