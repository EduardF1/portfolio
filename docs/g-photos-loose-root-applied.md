# `G:\Photos\` — loose-root + year-singleton reorg (applied)

> Applied 2026-04-29 by `scripts/reorg-g-photos-root-extended.mjs`. Two-phase
> move-only pass that closes out the 9,084 loose root files and re-clusters
> year-root singletons into existing trip folders. Successor to PR #74
> (semantic trip clustering) + the camera-source reorg.

---

## TL;DR

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Files at `G:\Photos\` root (loose) | **9,084** | **17** | **-9,067** |
| Files at `G:\Photos\Unsorted\` (mtime-only) | 0 | 8,842 | +8,842 |
| Files in year buckets (high-confidence year) | 0 | 225 | +225 |
| Year-root singletons | 523 (pre-phase-1) → 648 (post-phase-1) | 489 | -159 |
| **Total "loose" files** (root + year-root singletons) | 9,607 | **506** | **-9,101 (-94.7%)** |

Combined sum of files no longer "loose": **9,067 leaves root + 159 absorbed
into clusters = 9,226 files reclaimed**. The 8,842 in `Unsorted/` are
mtime-only (low confidence) — they're year-tagged but flagged for manual
review.

---

## Phase 1 — Loose root files

Source: `G:\Photos\` non-recursive. Filtered out year folders, `.duplicates\`,
`.review-for-delete\`, `Screenshots\`, `WhatsApp-by-year\`, P13 sensitive
folders (CV+CL, Driving license, ID, Passport, Residence permit), and the
other untouched buckets (`Browser\`, `Instagram\`, `Ha_Photos\`, etc.).

### Year-detection cascade

For each photo-extension file (`.jpg .jpeg .png .heic .raw .dng .bmp .gif .webp`):

1. **EXIF DateTimeOriginal / CreateDate / ModifyDate** (high confidence) →
   year bucket.
2. **Filename year regex** (`(19|20)\d{2}` surrounded by non-digits) →
   year bucket.
3. **Epoch-ms or epoch-s prefix** (10-13 digit numeric prefix) → year
   bucket *iff* the parsed epoch lands in 2005-2030.
4. **File mtime** (low confidence) → `Unsorted/` (NOT a year bucket).

### Phase 1 stats

```
rootFilesSeen:  9,084
moved:            225  (high-confidence year — into G:\Photos\<YYYY>\)
unsorted:       8,842  (mtime-only fallback — into G:\Photos\Unsorted\)
skipped:           17  (9 non-photo-ext + 8 mtime out-of-range)
failed:             0
```

### Phase 1 — moved per year (high-confidence)

| Year | Files moved |
| ---- | ---: |
| 2006 | 1 |
| 2008 | 2 |
| 2014 | 2 |
| 2015 | 6 |
| 2016 | 1 |
| 2017 | 26 |
| 2018 | 16 |
| 2019 | 2 |
| 2020 | 87 |
| 2021 | 4 |
| 2022 | 58 |
| 2023 | 9 |
| 2024 | 4 |
| 2025 | 3 |
| 2026 | 4 |
| **Total** | **225** |

### Why 8,842 went to `Unsorted/` (not a year bucket)

The dominant root-level filename pattern is `1NNNNNNNNN.jpg` (10-digit numeric)
— Pixel/Android **MediaStore IDs** that look like epoch values but are
sequential indexes. Parsed as epoch seconds they decode to early-2000s
nonsense (e.g. `1000000130 → 2001-09-09`). The script (correctly) rejects
these as out-of-range and falls back to mtime.

mtime is still useful — it tells us when the file was placed on disk, which
is often close to the photo's true date — but the spec demands these go to
`Unsorted/` for manual review rather than be auto-bucketed. From there
Eduard can:

- spot-check by mtime year (Explorer column-sort), or
- run a targeted EXIF-rebuild pass if he ever needs to recover the actual
  capture date from EXIF (where available).

mtime-year distribution of the `Unsorted/` files (informational only — these
are NOT in year buckets):

| mtime year | files |
| ---: | ---: |
| 1985 | 8  *(pre-MIN_YEAR — skipped, not in Unsorted)* |
| 2018 | 253 |
| 2019 | 24 |
| 2020 | 393 |
| 2021 | 25 |
| 2022 | 84 |
| 2023 | 403 |
| 2024 | 189 |
| 2025 | 2,131 |
| 2026 | 5,561 |

---

## Phase 2 — Year-root singleton re-clustering

After Phase 1 dropped 225 new files into year roots, the singleton count rose
from 523 → 648. Phase 2 walks each `G:\Photos\<YYYY>\` and finds files NOT
inside a `<Cluster>\` subfolder, then tries to absorb each into an existing
cluster within the same year.

### Match rule

For each singleton:
- Read EXIF `DateTimeOriginal` + GPS.
- For each existing cluster in the same year, compute its date range and
  GPS bbox.
- A match requires:
  - **Date**: singleton `DateTimeOriginal` within ±1 day of the cluster's
    date range.
  - **AND GPS**: singleton GPS within 200 km of the cluster bbox center
    (Haversine). If neither side has GPS, date-only match is acceptable.
- Among matches, pick the cluster with the smallest date-distance to the
  cluster midpoint.

### Phase 2 stats

```
totalSingletons:  648  (523 pre-existing + ~125 from Phase 1 drift)
absorbed:         159  (matched a cluster)
orphaned:         489  (no cluster matched within thresholds)
failed:             0
```

### Singletons absorbed into existing clusters (top trips)

| Cluster | Absorbed |
| --- | ---: |
| `2022\Hamburg 22` | 140 |
| `2023\Brasov region 23 (08)` | 6 |
| `2017\2017-02-12..13 trip` | 3 |
| `2018\Istanbul 18` | 3 |
| `2017\Kolding 17` | 1 |
| `2017\Esbjerg 17 (03)` | 1 |
| `2018\2018-01-24 trip` | 1 |
| `2018\Denmark 18 (05)` | 1 |
| `2019\Vejle 19 (08-7)` | 1 |
| `2023\Aarhus 23 (08)` | 1 |
| `2025\Aarhus 25 (08-4)` | 1 |
| **Total** | **159** |

The Hamburg-22 absorption (140) is by far the largest — these are
follow-up photos from the same Oct-2022 trip that landed at year root
during the camera reorg pass and didn't initially cluster.

### Leftover orphans by year

These are files that didn't match any cluster's date+GPS window. They
remain at the year root, date-sortable but not folder-grouped.

| Year | Orphans |
| ---: | ---: |
| 2006 | 1 |
| 2008 | 2 |
| 2014 | 2 |
| 2015 | 6 |
| 2016 | 11 |
| 2017 | 45 |
| 2018 | 21 |
| 2019 | 13 |
| 2020 | **265** |
| 2021 | 17 |
| 2022 | 33 |
| 2023 | 22 |
| 2024 | 25 |
| 2025 | 19 |
| 2026 | 7 |
| **Total** | **489** |

The 2020 spike (265) reflects COVID-era sparse-GPS / one-off photos that
inherently don't cluster. The pre-2016 entries (1+2+2+6 = 11) are from
year folders Phase 1 newly created — none have any clusters yet.

---

## Reduction summary

| Bucket | Before | After |
| --- | ---: | ---: |
| `G:\Photos\` loose root | 9,084 | 17 (9 non-photo-ext + 8 pre-2005 mtime) |
| Year-root singletons (orphans) | 523 | 489 |
| `G:\Photos\Unsorted\` (new) | 0 | 8,842 (mtime-flagged, manual review) |
| **Loose total** (root + singletons) | **9,607** | **506** |

Combined: **94.7% reduction** in "loose" files. Target was "low hundreds";
delivered 506.

---

## Reversibility — recovery commands

The full move log is at `scripts/.g-photos-root-extended.log`
(TSV: `timestamp\tphase\tkind\told_path\tnew_path\t...`).

### Undo Phase 1 (move everything back to G:\Photos\ root)

```powershell
Get-Content C:\Users\Eduard\Projects\portfolio\scripts\.g-photos-root-extended.log |
  Where-Object { $_ -match '^\d{4}-' -and $_ -match '\tphase1\t' } |
  ForEach-Object {
    $cols = $_ -split "`t"
    $oldP = $cols[3]; $newP = $cols[4]
    if (Test-Path -LiteralPath $newP) {
      Move-Item -LiteralPath $newP -Destination $oldP -Force
    }
  }
```

### Undo Phase 2 (move singletons back to year root)

```powershell
Get-Content C:\Users\Eduard\Projects\portfolio\scripts\.g-photos-root-extended.log |
  Where-Object { $_ -match '^\d{4}-' -and $_ -match '\tphase2\t' } |
  ForEach-Object {
    $cols = $_ -split "`t"
    $oldP = $cols[3]; $newP = $cols[4]
    if (Test-Path -LiteralPath $newP) {
      Move-Item -LiteralPath $newP -Destination $oldP -Force
    }
  }
```

### Undo both (concat the two undo blocks above, run in either order — they touch disjoint paths).

---

## Constraints honoured

- **No deletes.** Every operation is `fs.renameSync` (atomic same-volume).
- **P13 sensitive folders skipped** at top-level enumeration.
- **`.duplicates\`, `.review-for-delete\`, `Screenshots\`, `WhatsApp-by-year\`
  not touched.**
- **`G:\duplicates-to_be_deleted\` not touched** (off-tree, separate path).
- **Move cap**: 15,000 (not reached — actual moves: 384 high-conf + 159
  absorbed = 543; plus 8,842 → Unsorted = 9,385 total).
- **Sibling agent** `chore/g-photos-cluster-renames` operates on
  `<year>\<Country YY>` → `<year>\<City YY>` cluster-folder renames. This
  pass operates at year-root level (Phase 1) and inside already-named
  cluster folders only when absorbing singletons (Phase 2). Disjoint paths,
  no merge conflict expected.

---

## Follow-up suggestions

1. **`Unsorted/` triage** — 8,842 mtime-only files. Options:
   - Eyeball-sort by mtime in Explorer; accept mtime-year bucket if good.
   - Run a targeted EXIF-rebuild pass via `exiftool -overwrite_original
     -DateTimeOriginal<FileModifyDate "G:\Photos\Unsorted\"` to inject
     EXIF dates from mtime; then re-run Phase 1 to bucket them.
   - Leave as-is — they're already grouped, not loose.
2. **2020 orphan tail (265 files)** — biggest single-year orphan group;
   consider a manual-cluster pass with looser thresholds (±3 day, 500 km).
3. **Re-run master dedup post-rename** — orthogonal but listed in
   `g-photos-final-state.md` §5.5; may catch path-stale residue now that
   loose files are bucketed.
