# G:\Poze\ + D:\Portfolio\poze\ — archive consolidation summary

> Master-state doc for the 2026-04-28 / 2026-04-29 reorg sweep. Pure analysis +
> sign-off cheat-sheet — no file moves were performed by this doc's author, the
> moves were applied by sibling agents (PRs #57, #61, #62, #65, #67 + an
> in-flight screenshots quarantine).

Scope: snapshots `G:\Poze\` and `D:\Portfolio\poze\` after the reorg passes,
sums the move logs, lists the recovery commands per category, and closes with a
sign-off checklist + open-question list for Eduard.

---

## 1. Final tree state

### 1.1 G:\Poze\ (top level, post-reorg)

Snapshot: `2026-04-29 ~08:30 local`. 21 directories + ~17,629 loose root files
remaining.

| Entry | Type | Notes |
| --- | --- | --- |
| `.duplicates\` | dir (NEW) | PR #61 perceptual-dedup quarantine. **12,986 files**. Mirrors original relative paths under `G:\Poze\`. |
| `.review-for-delete\` | dir (NEW) | PR #62 bulk-delete quarantine. **1,398 files** (G-side). Subtree: `Browser\` + flat-root patterns. |
| `WhatsApp-by-year\` | dir (NEW) | PR #57 WhatsApp-by-year reorg. **2,312 files** across `2016\`–`2026\`. |
| `2017\` | dir (NEW) | PR #65 Poze Huawei reorg landing zone. **140 files**. |
| `2018\` | dir (NEW) | PR #65 Poze Huawei reorg landing zone. **102 files**. |
| `Screenshots\` | dir (existing, repopulated) | Pre-existing 1,316 + 4,685 from in-flight screenshots quarantine = **6,001 files** on disk. Doc is `docs/g-screenshots-quarantine-applied.md` — **NOT yet committed to main** (see §5 gap notes). |
| `Browser\` | dir (existing, mostly emptied) | PR #62 swept 307 of its files into `.review-for-delete\Browser\`. Small residue may remain. |
| `X\` | dir (existing, emptied) | PR #62 carve target on G-side; all 18 files were source-missing at script run (a sibling agent had already moved them). Folder is effectively empty. |
| `Instagram\` | dir | Instagram export — not a screenshot dump. **Not touched** by any reorg. |
| `Poze Huawei\` | dir (now empty) | Source folder for PR #65. Empty post-reorg; left in place per no-delete policy. |
| `Hamburg_Photos\` | dir | 2022 archive import. **Not touched** by reorg. |
| `Ha_Photos\` | dir | Hamburg follow-up. **Not touched** by reorg. |
| `Poze_A5_landscape\` | dir | A5 landscape album. **Not touched**. |
| `New folder\` | dir | Catch-all bucket. **Not touched**. |
| `backup thumbnails\` | dir | Thumbnail cache. **Not touched**. |
| `faber-feedback\` | dir | Faber project artifacts. **Not touched**. |
| **P13 sensitive folders (untouched by every reorg)** | | All on the blocklist in `docs/photo-organization.md` §6.1 |
| `CV + CL photos\` | dir | CV/CL DSLR archive. Group 2105 dedup cluster (4,031 byte-identical) skipped wholesale. |
| `Driving license photos\` | dir | P13 sensitive. |
| `ID Photos\` | dir | P13 sensitive. |
| `Passport photos\` | dir | P13 sensitive. |
| `Residence permit photos\` | dir | P13 sensitive. |
| **Loose root files** | | ~17,629 remaining: camera-source files (`IMG_YYYYMMDD_HHMMSS.jpg`, `IMG2026MMDDHHMMSS.jpg`), `1000NNNNNNN.jpg` Pixel-style numerics, `.0.jpg`–`.12.jpg` Snapchat exports, `_free_r_t_o_s_*.png` Doxygen artefacts (a few not caught by the bulk-delete pattern), and the WhatsApp variants `IMG-YYYYMMDD-WA*_2.jpg` / `IMG-YYYYMMDD-WA*(1).jpg` (39 of these — see §5). |

### 1.2 D:\Portfolio\poze\ (top level, post-reorg)

Snapshot: `2026-04-29 ~08:30 local`. ~31 directories + ~27,024 loose root files.

D-side gained a **fully populated year-bucket tree** (`2016\`–`2026\`)
**created by PR #67** (`docs/d-portfolio-yearbucket-reorg`) — 9,939 camera-source
files moved out of `D:\Portfolio\poze\` root. This is the D-side mirror of
PR #65 / PR #57 work but scoped to camera media only; D-side WhatsApp was
deliberately deferred.

| Entry | Type | Files | Notes |
| --- | --- | ---: | --- |
| `.review-for-delete\` | dir (NEW) | 1,641 | PR #62 D-side quarantine. Subtree: `Browser\` + `X\` + flat-root patterns. |
| `.duplicates\` | dir | **0** (NOT PRESENT) | PR #61 dedup was G-only — `dedup.ndjson` was indexed against G:\ alone. D-side has **no** perceptual-dedup quarantine. |
| `2016\` … `2026\` | dirs (NEW) | 110 / 40 / 730 / 831 / 190 / 60 / 1,001 / 2,417 / 1,104 / 2,320 / 1,136 = **9,939** | **PR #67** D-portfolio camera reorg landing zone (Huawei `IMGYYYYMMDD…`, Android `IMG_YYYYMMDD_…`, 13-digit epoch-ms). Created from scratch on 2026-04-29. |
| `Whatsapp\` | dir | 2,297 | D-side WhatsApp archive (NOT reorged into year buckets — PR #57 was G-only; PR #67 explicitly deferred D-side WhatsApp). |
| `camera\` | dir | 1,258 | Camera-source archive (a sub-folder, distinct from D-root camera-source files). **Not touched** by reorg — PR #67 only enumerated D-root non-recursively. |
| `Screenshots\` | dir | 1,434 | Existing screenshot tree. The screenshots quarantine (in-flight) targeted G-side only. |
| `Instagram\` | dir | 150 | IG export. |
| `Poze Huawei\` | dir | 275 | D-side Huawei archive (NOT reorged into year buckets — PR #65 was G-only). |
| `Ha_Photos\` | dir | 373 | |
| `CV + CL photos\` | dir | 299 | P13 sensitive — untouched. |
| `Driving license photos\` | dir | 4 | P13 sensitive. |
| `ID Photos\` | dir | 3 | P13 sensitive. |
| `Passport photos\` | dir | 1 | P13 sensitive. |
| `Residence permit photos\` | dir | 1 | P13 sensitive. |
| `private\` | dir | 4 | |
| `Browser\` | dir | 48 | Mostly emptied by PR #62. |
| `X\` | dir | 4 | Mostly emptied by PR #62. |
| `Poze_A5_landscape\` | dir | 12 | |
| `Hamburg_Photos\`, `New folder\`, `backup thumbnails\` | dirs | 0 each | Empty buckets. |
| `faber-feedback\` | dir | 2 | |
| **Loose root files** | | 27,024 | Down from 36,963 pre-PR-#67. Remainder: 2,351 WhatsApp `IMG-YYYYMMDD-WA*.jpg` (intentionally left), plus ~24,673 non-camera (FB photo IDs, browser dumps, freeform names, screenshots, `DSC_NNNN.JPG` w/o embedded date, ISO-date `YYYY-MM-DD-…`). |

---

## 2. Move-log totals (cumulative across all reorg agents)

| PR | Branch / agent | Side | Files moved | Source → destination |
| --: | --- | --- | --: | --- |
| **#57** | `docs/g-whatsapp-yearbucket-reorg` | G | **2,312** | `G:\Poze\IMG-YYYYMMDD-WAxxxx.jpg` → `G:\Poze\WhatsApp-by-year\<YYYY>\` |
| **#61** | `docs/g-dedup-quarantine` | G | **12,986** | Perceptual-dedup demotes (Hamming ≤ 8) → `G:\Poze\.duplicates\<original-rel-path>\` |
| **#62** | `docs/g-bulk-delete-quarantine` | G + D | **3,039** | PR #36 high-confidence delete patterns + folder cuts → `<root>\.review-for-delete\<rel>` (G: 1,398 / D: 1,641) |
| **#65** | `docs/g-poze-huawei-reorg` | G | **242** | `G:\Poze\Poze Huawei\IMG_YYYYMMDD_*.jpg` → `G:\Poze\<YYYY>\` (2017: 140, 2018: 102) |
| **#67** | `docs/d-portfolio-yearbucket-reorg` | D | **9,939** | `D:\Portfolio\poze\IMG[_]YYYYMMDD…` + `<13-digit-ms>` → `D:\Portfolio\poze\<YYYY>\` (3 passes; 5,228 huawei-style + 4,702 android + 9 epoch-ms) |
| (in-flight) | `docs/g-screenshots-quarantine-applied.md` (uncommitted) | G | **4,685** | Root screenshots / social-UI captures → `G:\Poze\Screenshots\` |
| | | **TOTAL** | **33,203** | Across G + D |

**By side:**

| Side | Files relocated |
| --- | --: |
| G:\Poze\ (PRs #57 + #61 + #62-G + #65 + screenshots) | 21,623 |
| D:\Portfolio\poze\ (PRs #62-D + #67) | 11,580 |
| **Total** | **33,203** |

**Skipped / drift (logged but not moved):**

| Reason | Count | Source |
| --- | --: | --- |
| `sensitive-blocklist` (P13 / CV+CL group 2105) | 4,127 | PR #61 |
| `source-missing` (file gone before script reached it — sibling overlap) | 416 + 243 = 659 | PR #61 + PR #62 |
| `not-WhatsApp-pattern` variants (39 with `_2`/`(1)` suffix) | 39 | PR #57 — out of scope by design |
| **Total skipped** | **4,825** | |

The 4,127 `sensitive-blocklist` skips are dominated by **group 2105** alone
(~3,888 of them) — the 4,031-image byte-identical CV/CL DSLR cluster keepered
inside `G:\Poze\CV + CL photos\All\DSC_0882.JPG`. Per spec, when a dedup
group's keeper is in a P13 folder, the entire group's demotes are skipped even
if some live at root. That cluster is **the largest open quarantine candidate**
and needs an explicit consent pass — see §5.

---

## 3. Recovery cheat-sheet — one place, all reverse commands

Every reorg pass logs to a TSV file in `scripts/`. **Forward path** is always
`<old_path> → <new_path>` (column 2 → column 3 for WhatsApp / Huawei; column 4
→ column 5 for the others). To undo a move you run `Move-Item -LiteralPath
<new_path> -Destination <old_path>`.

### 3.1 PR #57 — WhatsApp-by-year (G:\Poze\)

Log: `scripts/.g-whatsapp-reorg.log`

```powershell
# Bulk reverse
Get-Content scripts/.g-whatsapp-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path -LiteralPath $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

```bash
# Bash reverse
awk -F'\t' '!/^#/ {print $3 "\t" $2}' scripts/.g-whatsapp-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### 3.2 PR #61 — perceptual-dedup quarantine (G:\Poze\.duplicates\)

Log: `scripts/.g-dedup-quarantine.log` (TSV: `timestamp event group_id old_path new_path reason`)

```powershell
# Restore everything
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

```powershell
# Restore one specific dedup group (e.g. group 2087 — 144 Android launcher icons)
Select-String -Path scripts/.g-dedup-quarantine.log -Pattern "`tMOVE.*`t2087`t" |
  ForEach-Object {
    $cols = ($_.Line -split "`t")
    Move-Item -LiteralPath $cols[4] -Destination $cols[3]
  }
```

### 3.3 PR #62 — bulk-delete quarantine (G + D `.review-for-delete\`)

Log: `scripts/.g-bulk-delete-quarantine.log` (TSV: `timestamp event category old_path new_path reason`)

```powershell
# Restore everything (both roots)
Get-Content scripts\.g-bulk-delete-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $cols = $_ -split "`t"; if ($cols[1] -like "MOVE*") { Move-Item -LiteralPath $cols[4] -Destination $cols[3] } }
```

```powershell
# Restore one category (e.g. pattern:logo)
Get-Content scripts\.g-bulk-delete-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $cols = $_ -split "`t"; if ($cols[1] -like "MOVE*" -and $cols[2] -eq "pattern:logo") { Move-Item -LiteralPath $cols[4] -Destination $cols[3] } }
```

### 3.4 PR #65 — Poze Huawei reorg (G:\Poze\2017\, 2018\)

Log: `scripts/.g-poze-huawei-reorg.log`

```powershell
Get-Content scripts/.g-poze-huawei-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path -LiteralPath $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

### 3.5 PR #67 — D-portfolio camera reorg (D:\Portfolio\poze\<YYYY>\)

Log: `scripts/.d-portfolio-camera-reorg.log` (TSV: `timestamp old_path new_path filename year pattern_id`)

```powershell
# Bulk reverse
Get-Content scripts/.d-portfolio-camera-reorg.log |
  Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3 -and (Test-Path -LiteralPath $cols[2])) {
      Move-Item -LiteralPath $cols[2] -Destination $cols[1]
    }
  }
```

```bash
# Bash reverse
awk -F'\t' '!/^#/ {print $3 "\t" $2}' scripts/.d-portfolio-camera-reorg.log \
  | while IFS=$'\t' read -r src dst; do
      [ -n "$src" ] && [ -f "$src" ] && mv -n "$src" "$dst"
    done
```

### 3.6 Screenshots quarantine (G:\Poze\Screenshots\) — IN-FLIGHT

Log: `scripts/.g-screenshots-quarantine.log` (TSV: `timestamp event category old_path new_path reason`).
**Note: doc + log are not yet committed to main as of 2026-04-29 morning.**

```powershell
# Restore everything (note: pre-existing 1,316 contents stay put — only this run's 4,685 are reversed)
Get-Content scripts\.g-screenshots-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols[1] -like "MOVE*") { Move-Item -LiteralPath $cols[4] -Destination $cols[3] }
  }
```

```powershell
# Restore one category (e.g. social-instagram)
Get-Content scripts\.g-screenshots-quarantine.log |
  Where-Object { $_ -match "^[^#]" } |
  ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols[1] -like "MOVE*" -and $cols[2] -eq "social-instagram") {
      Move-Item -LiteralPath $cols[4] -Destination $cols[3]
    }
  }
```

### 3.7 "Nuclear" full reverse (every reorg, in reverse order)

If you want to roll back **everything** to pre-reorg state:

```powershell
# 1. Reverse screenshots (newest, G-side)
Get-Content scripts\.g-screenshots-quarantine.log | Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $c = $_ -split "`t"; if ($c[1] -like "MOVE*") { Move-Item -LiteralPath $c[4] -Destination $c[3] } }

# 2. Reverse PR #67 D-portfolio camera
Get-Content scripts/.d-portfolio-camera-reorg.log | Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object { $c = $_ -split "`t"; if ($c.Length -ge 3 -and (Test-Path -LiteralPath $c[2])) { Move-Item -LiteralPath $c[2] -Destination $c[1] } }

# 3. Reverse PR #65 Huawei (G-side)
Get-Content scripts/.g-poze-huawei-reorg.log | Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object { $c = $_ -split "`t"; if ($c.Length -ge 3 -and (Test-Path -LiteralPath $c[2])) { Move-Item -LiteralPath $c[2] -Destination $c[1] } }

# 4. Reverse PR #62 bulk-delete (G + D)
Get-Content scripts\.g-bulk-delete-quarantine.log | Where-Object { $_ -match "^[^#]" } |
  ForEach-Object { $c = $_ -split "`t"; if ($c[1] -like "MOVE*") { Move-Item -LiteralPath $c[4] -Destination $c[3] } }

# 5. Reverse PR #61 dedup (G-side)
Get-Content scripts/.g-dedup-quarantine.log | Where-Object { $_ -match "^[^#].*\tMOVE(_SUFFIXED|_EXDEV)?\t" } |
  ForEach-Object {
    $c = $_ -split "`t"; $old = $c[3]; $new = $c[4]
    if (Test-Path -LiteralPath $new) {
      $dir = Split-Path -Parent $old
      if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
      Move-Item -LiteralPath $new -Destination $old
    }
  }

# 6. Reverse PR #57 WhatsApp (oldest)
Get-Content scripts/.g-whatsapp-reorg.log | Where-Object { $_ -notmatch '^#' -and $_ -match "`t" } |
  ForEach-Object { $c = $_ -split "`t"; if ($c.Length -ge 3 -and (Test-Path -LiteralPath $c[2])) { Move-Item -LiteralPath $c[2] -Destination $c[1] } }
```

Order matters: do screenshots **before** dedup-undo, because some screenshots
may otherwise re-collide with dedup paths during the dedup reverse.

---

## 4. Sign-off checklist for Eduard

> Eyeball each row, then choose the action. Default action is "keep as
> archive" — only flip to "delete" once you're confident.

### 4.1 Safe-to-delete after sign-off

| Quarantine tree | Files | Recommended sign-off check | Final delete command |
| --- | --: | --- | --- |
| `G:\Poze\.duplicates\` | 12,986 | Spot-check 20–30 random files vs. their keepers in `G:\Poze\` (Hamming ≤ 8 = "looks the same"). | `Remove-Item -LiteralPath 'G:\Poze\.duplicates' -Recurse -Force` |
| `G:\Poze\.review-for-delete\` | 1,398 | Confirm `Browser\` is Pinterest / Doxygen / hex-hash web saves; confirm zero `IMG_NNNN` or `FB_IMG_*` (none expected). | `Remove-Item -LiteralPath 'G:\Poze\.review-for-delete' -Recurse -Force` |
| `D:\Portfolio\poze\.review-for-delete\` | 1,641 | Same as above; D-side adds the `X\` carve. | `Remove-Item -LiteralPath 'D:\Portfolio\poze\.review-for-delete' -Recurse -Force` |
| `G:\Poze\Screenshots\` (4,685 new + 1,316 pre-existing = 6,001) | 6,001 | Sort by date in Explorer; confirm no IRL camera photos slipped in. | Route B: `Move-Item -LiteralPath 'G:\Poze\Screenshots' -Destination 'G:\Poze\.review-for-delete\Screenshots'` then the `.review-for-delete` delete above. |

**Combined deletion impact** (if all four trees go): **22,026 files freed**.

### 4.2 Stays as archive (do nothing)

| Tree | Why |
| --- | --- |
| `G:\Poze\WhatsApp-by-year\<YYYY>\` (2,312 files) | Reorganised, not flagged for deletion. Keep as canonical WhatsApp media archive. |
| `G:\Poze\2017\`, `G:\Poze\2018\` (242 Huawei files) | Reorganised from `Poze Huawei\`. Keep as the canonical 2017–2018 personal photo archive. |
| `G:\Poze\Poze Huawei\` (now empty) | Source folder; no-delete policy says leave the empty dir. Eduard can `Remove-Item -LiteralPath 'G:\Poze\Poze Huawei'` if he wants to tidy. |
| `D:\Portfolio\poze\<2016..2026>\` (9,939 files) | **Created by PR #67** D-portfolio camera reorg — canonical D-side per-year camera archive. Keep. |
| `D:\Portfolio\poze\Whatsapp\` (2,297), `Poze Huawei\` (275), `Screenshots\` (1,434) | Pre-existing D-side archives — analogous reorg explicitly deferred per spec. **Optional follow-up** (see §5). |
| **All P13 sensitive folders** (`CV + CL photos\`, `Driving license photos\`, `ID Photos\`, `Passport photos\`, `Residence permit photos\`, `Citizenship*`, `Important Documents\`, `backup NC*`, `camera roll iphone backup\`) | Hard-blocked from every reorg by spec. Stay forever. |
| `G:\Poze\Hamburg_Photos\`, `Ha_Photos\`, `Instagram\`, `Poze_A5_landscape\`, `New folder\`, `backup thumbnails\`, `faber-feedback\` | Not touched by reorg. Future passes may classify them; for now they stay. |

### 4.3 Pre-delete sanity grep (run before any `Remove-Item`)

```powershell
# Confirm no IMG_NNNN or FB_IMG_* leaked into bulk-delete (should yield zero)
Select-String -Path scripts\.g-bulk-delete-quarantine.log -Pattern "MOVE.*(IMG_\d+|FB_IMG_)"

# Confirm no IRL camera filenames in screenshots quarantine (should yield zero)
Select-String -Path scripts\.g-screenshots-quarantine.log -Pattern "MOVE.*\\IMG_\d{8}_\d{6}\."
```

---

## 5. Remaining open questions / manual handling

### 5.1 Sibling-agent gaps (work that didn't land)

| Expected work | Status | Suggested handling |
| --- | --- | --- |
| **G-root camera-source reorg** (`IMG_YYYYMMDD_HHMMSS.jpg` + `IMGYYYYMMDDHHMMSS.jpg` + Pixel-numeric `1000NNNNNNN.jpg` into year buckets) | **Not started.** ~17,629 root files remain at `G:\Poze\` — most are camera-source. PR #57 explicitly excluded camera-source filenames; PR #65 only handled the `Poze Huawei\` subdir; PR #67 was D-side only. | Re-use `scripts/reorg-d-portfolio-camera.mjs` (PR #67) as the template — same patterns (`huawei-imgYMDhms`, `android-camera`, `epoch-ms`) apply on G-side. Output to `G:\Poze\<YYYY>\` (folders 2017/2018 already exist from PR #65, so collision-suffix logic should be lit). Estimate ~15k files moveable. |
| **D-side WhatsApp reorg** (`D:\Portfolio\poze\Whatsapp\` 2,297 files + 2,351 `IMG-YYYYMMDD-WA*.jpg` files at D-root) | **Deliberately deferred** per PR #67 spec. | Optional. Mirror PR #57 against D-side: for the 2,351 root files, regex match → `D:\Portfolio\poze\WhatsApp-by-year\<YYYY>\`. The `Whatsapp\` sub-folder is a separate question (it's already organised, just not by year). Check with Eduard before reorging. |
| **D-side Poze Huawei reorg** (`D:\Portfolio\poze\Poze Huawei\` 275 files) | **Not started.** PR #65 was G-only. | Optional. Same caveat as above. |
| **D-side perceptual-dedup quarantine** (`D:\Portfolio\poze\.duplicates\`) | **Not started.** PR #61 dedup index is G-only. | Re-run dedup with both roots indexed; quarantine to `D:\Portfolio\poze\.duplicates\`. ~5–8k files likely (rough extrapolation). |
| **Screenshots quarantine doc + script + log commit** | **Files present on the prior worktree's working tree but never committed.** `docs/g-screenshots-quarantine-applied.md`, `scripts/quarantine-g-screenshots.mjs`, `scripts/.g-screenshots-quarantine.log`, `scripts/.g-screenshots-quarantine.summary.json` are **not on `main`** as of this summary's run. The 4,685 file moves DID happen on disk (verified: `G:\Poze\Screenshots\` now holds ~6,001 files vs. the pre-existing 1,316). | Open a small follow-up PR that commits the four artefacts from the surviving working tree (or re-generate from a fresh `quarantine-g-screenshots.mjs` run that no-ops because the files are already in place). Without those artefacts, the §3.5 reverse commands cannot run. |

### 5.2 Files that no agent could classify

| Cluster | Count | Why unhandled | Suggested action |
| --- | --: | --- | --- |
| `IMG-YYYYMMDD-WAxxxx_2.jpg` / `IMG-YYYYMMDD-WAxxxx(1).jpg` | 39 | PR #57 used strict regex `^IMG-\d{8}-WA\d+\.jpe?g$` and deliberately didn't match suffixed variants (per spec). | Broaden to `^IMG-\d{8}-WA\d+(?:[_(].*)?\.jpe?g$` and re-run; the variants are duplicates of moved files. Trivial follow-up PR. |
| `.0.jpg` … `.12.jpg` (13 files) | 13 | Snapchat exports with hidden-file-style basenames. No reorg targeted them. | Manual eyeball; if disposable, add to bulk-delete pattern list. |
| `_free_r_t_o_s_*.png` (Doxygen residue) | ~3 still at root | PR #62 caught most via `pattern:doxygen-rtos` (2 G-side moved). The few that remain didn't match the regex exactly. | Either widen the regex or eyeball-delete. |
| `0ae79d1e-fe59-40f8-8280-2b9ae6b7fbcd.jpg` style (UUID-named) | A handful | No `pattern:uuid-jpg` rule exists. | Add a `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$` rule to a future bulk-delete pass — high-confidence web-saved or app-cached. |
| **Group 2105 — 4,031-image CV/CL DSLR cluster** | 4,031 | PR #61 skipped wholesale because the keeper sits in a P13 folder. | **Sensitive-folder-aware dedup pass with explicit consent.** Eduard chooses one keeper, the rest go to `.duplicates\`. Largest single freebie on the table — saves ~4 GB likely. |

### 5.3 Drift / data-integrity flags (informational, no action needed)

| Flag | Source | Resolution |
| --- | --- | --- |
| 1,572 dedup keepers reported as missing on disk | PR #61 doc §"Keepers missing on disk" | All benign — they were relocated by PR #57 (WhatsApp-by-year) before PR #61 ran. Rebuild `dedup.ndjson` post-WhatsApp if you want a clean index. |
| 243 source-missing skips during PR #62 | PR #62 doc §4 | Sibling overlap (PR #61 had already pulled them); not a real loss. |
| 416 source-missing skips during PR #61 | PR #61 doc §"Skip counts" | Same — sibling overlap. |
| WhatsApp 2022 count drift (545 → 541) and 2023 (959 → 925) | PR #57 doc §"Moved by year" | Within expected drift bounds — index built before run, files moved during run. Canonical state is what's on disk now. |

---

## 6. Provenance

Source docs feeding this summary:

- `docs/g-whatsapp-reorg-applied.md` — PR #57 (merged)
- `docs/g-dedup-quarantine-applied.md` — PR #61 (merged)
- `docs/g-bulk-delete-quarantine-applied.md` — PR #62 (merged)
- `docs/g-poze-huawei-reorg-applied.md` — PR #65 (merged)
- `docs/d-portfolio-camera-reorg-applied.md` — PR #67 (merged)
- `docs/g-screenshots-quarantine-applied.md` — **NOT yet on main**; was on the in-flight worktree at `docs/g-poze-huawei-reorg` earlier in the session but was never committed. See §5.1 for the recommended follow-up PR.
- `docs/photo-orphans-triage.md` — PR #36 (the upstream tick-list driving PR #62)
- `docs/photo-organization.md` §6.1 — P13 sensitive-folder blocklist
- Direct filesystem inspection of `G:\Poze\` and `D:\Portfolio\poze\` on 2026-04-29 morning

This doc was written **read-only** — no files on G:\ or D:\ were moved or
modified by its author.
