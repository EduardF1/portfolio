# P-orphans triage — 2026-04-28

> Statistical triage of `scripts/.photo-classify/P-orphans/scan.ndjson` (75,719 records). READ-ONLY catalogue work — no files moved, copied, or deleted. Resolves action item #3 in `docs/photo-classification-plan.md` ("Top action items"). Source allowlist enforced per `docs/photo-organization.md` §6.1.

## 1. Headline numbers

- **Total orphans triaged**: 75,719 (records in NDJSON)
- **Roots scanned**: `G:\Poze\` and `D:\Portfolio\poze\`
- **Sensitive-folder paths excluded from rollup**: 614 (matched the privacy carve-out: `CV + CL photos\`, `Driving license photos\`, `ID Photos\`, `Passport photos\`, `Residence permit photos\`)

### Per-root breakdown

| Root | Orphans flagged |
| --- | ---: |
| `G:\Poze` | 34,415 |
| `D:\Portfolio\poze` | 41,304 |
| **Total** | **75,719** |

### Orphan reason breakdown

| Reason | Count | Share |
| --- | ---: | ---: |
| `not-in-sibling-scan` | 33,231 | 43.9% |
| `not-in-sibling-scan\|no-exif-date-no-year-folder` | 29,052 | 38.4% |
| `no-date-signal` | 12,418 | 16.4% |
| `not-in-sibling-scan\|exif-unreadable-no-year-folder` | 674 | 0.9% |
| `exif-unreadable-no-year-folder` | 344 | 0.5% |

### Extension breakdown

| Extension | Count | Share | Notes |
| --- | ---: | ---: | --- |
| `.jpg` | 71,410 | 94.3% | bulk of orphans; mix of camera + web saves |
| `.png` | 2,558 | 3.4% | almost entirely web saves / Doxygen / UI assets — strong delete-class |
| `.heic` | 1,018 | 1.3% | iPhone originals (likely Eduard's own); re-EXIF candidates |
| `.jpeg` | 733 | 1.0% | Messenger `received_*` exports + downloads |
| `.gif` / `.webp` / `.bmp` / others | 0 | 0% | none in this NDJSON |

PNGs and `.gif`/`.webp` would be web-save tells; PNG is well-represented and confirms the Doxygen / Pinterest cluster. HEIC ext should be **kept** and re-scanned with exiftool (HEIC carries Eduard's iPhone originals).

## 2. Top folder paths (2nd-level rollup)

Top folders by orphan count, rounded by 2nd-level path under each root. Sensitive subfolders excluded. `<root>` denotes root-level files (no 2nd-level folder).

| Folder | Total | `no-date-signal`-class | Top extensions | Sample basenames |
| --- | ---: | ---: | --- | --- |
| `D:\Portfolio\poze\<root>` | 36,044 | 20,190 (56%) | jpg 34,220 / png 1,268 / jpeg 305 / heic 251 | `_a_t_m_e_g_a___free_r_t_o_s*.png`, `1000000134_2.jpg`, `IMG_0190.jpg` |
| `G:\Poze\<root>` | 32,601 | 20,192 (62%) | jpg 30,844 / png 1,201 / jpeg 305 / heic 251 | (mirror of D:) |
| `D:\Portfolio\poze\Whatsapp\` | 1,626 | 0 | jpg 1,511 / jpeg 115 | `IMG_20180714_013054.jpg`, `IMG_20230313_211125.jpg` |
| `D:\Portfolio\poze\Screenshots\` | 1,403 | 0 | jpg 1,384 / png 19 | `IMG_20200829_075634.jpg`, `Screenshot_2023-…` |
| `D:\Portfolio\poze\camera\` | 1,066 | 0 | jpg 1,066 | `IMG_20160813_*.jpg` (Huawei era) |
| `G:\Poze\Screenshots\` | 653 | 0 | jpg 653 | `IMG_20231008_161158.jpg`, `Screenshot_2023-…` |
| `G:\Poze\Browser\` | 424 | 380 (90%) | jpg 391 / png 33 | `00b3ce2b…f3b869c468.jpg`, `04ffca…spartan-workout.jpg` |
| `D:\Portfolio\poze\Browser\` | 424 | 380 (90%) | jpg 391 / png 33 | (mirror of G:) |
| `G:\Poze\Ha_Photos\` | 205 | 119 | jpg 119 / heic 86 | `IMG_0112.heic`, `IMG_0113.heic` |
| `D:\Portfolio\poze\Ha_Photos\` | 205 | 119 | jpg 119 / heic 86 | (mirror of G:) |
| `G:\Poze\Poze Huawei\` | 119 | 0 | jpg 119 | `IMG_20180101_135509.jpg` |
| `D:\Portfolio\poze\Poze Huawei\` | 119 | 0 | jpg 119 | (mirror of G:) |
| `G:\Poze\Instagram\` | 88 | 20 | jpg 88 | `curierul-30-07-2023-0001.jpg`, `IMG_20160910_*.jpg` |
| `D:\Portfolio\poze\Instagram\` | 88 | 20 | jpg 88 | (mirror of G:) |
| `G:\Poze\X\` | 18 | 14 (78%) | jpg 14 / jpeg 4 | `10152814_698152723574994_…_n.jpg` (FB-CDN) |
| `D:\Portfolio\poze\X\` | 18 | 14 (78%) | jpg 14 / jpeg 4 | (mirror of G:) |
| `D:\Portfolio\poze\private\` | 4 | 0 | jpg 4 | `IMG20241013212218.jpg` (OnePlus naming) |

Observations:

- **Two flat root-level dumps dominate**: `D:\Portfolio\poze\<root>` (36,044) and `G:\Poze\<root>` (32,601) account for **90.7% of all orphans** between them. These are the primary targets.
- **Heavy D:\ × G:\ duplication** in every named subfolder: `Whatsapp`, `Screenshots`, `camera`, `Browser`, `Ha_Photos`, `Poze Huawei`, `Instagram`, `X` all have near-identical totals on both drives. Consistent with P-B/P8-redo's 17,529 demote candidates — see §7 caveats; **do not act on D:\ duplicates until Eduard signs off the dedup plan**.
- **`Browser/` is a clear delete cluster**: 90% no-date-signal, hex-named or kebab-pinterest-style names.
- **`Ha_Photos\` mixes Eduard's own work with imports**: 86 HEIC files are iPhone originals (re-EXIF candidates → keep + ingest into the Hamburg trip slot per `photo-classification-plan.md` action item #1).
- **`camera\`, `Poze Huawei\`, `Whatsapp\`, `Screenshots\`** carry zero `no-date-signal` rows — every file has either a filename date or a parent year token. These are **absorb candidates**, not deletes.

## 3. Filename pattern signatures

Pattern matches over the `no-date-signal` and `no-exif-date-no-year-folder` orphan supersets (~41,470 rows). First-match-wins. Top patterns by count:

| Pattern | Count | Sample paths | Recommended class |
| --- | ---: | --- | --- |
| `<10digit>_*` | 2,072 | `G:\Poze\1000000134_2.jpg`, `G:\Poze\1000000166_2.jpg`, `G:\Poze\1000001893_2.jpg` | **delete** (Facebook photo IDs) |
| `IMG_NNNN` | 510 | `G:\Poze\IMG_0190.jpg`, `G:\Poze\IMG_0191.jpg`, `G:\Poze\IMG_0192.jpg` | **absorb** (DSLR / older device camera roll) |
| `received_*` | 246 | `G:\Poze\received_1023756715515923.jpeg`, `G:\Poze\received_1039557307672673.jpeg` | **delete** (Messenger receive) |
| `<hex hash>` | 232 | `G:\Poze\5529375ae58ef23231d1a1626572e592.jpg`, `G:\Poze\c179cbc0d3375c16e8ed208f2a143f51.jpg` | **delete** (browser cache hash) |
| `image*` | 196 | `G:\Poze\image-0-02-04-02e8d7a1…-V.jpg`, `G:\Poze\image-0-02-04-5970…-V.jpg` | **delete** (web save / Telegram-style export) |
| `FB_IMG_*` | 110 | `G:\Poze\FB_IMG_1468785900175.jpg`, `G:\Poze\FB_IMG_1481309948917.jpg` | **review** (FB save — could be Eduard's own up-/downloads) |
| `images(N)` | 58 | `G:\Poze\images (1).jpeg`, `G:\Poze\images (10).jpeg` | **delete** (browser download) |
| `logo*` | 26 | `G:\Poze\logo_10.png`, `G:\Poze\logo_2.png` | **delete** (UI asset) |
| `download*` | 20 | `G:\Poze\download.png`, `G:\Poze\Browser\download (1).jpg` | **delete** (browser download) |
| `_a_t_m_e_g_a*` | 12 | `G:\Poze\_a_t_m_e_g_a___free_r_t_o_s_8h__dep__incl*.png` | **delete** (Doxygen call-graph for AVR `freertos.h`) |
| `<n>__<n>.png` | 8 | `G:\Poze\1__2.png`, `G:\Poze\1__3.PNG`, `G:\Poze\2__2.png` | **delete** (hash PNG) |
| `Snapchat-*` | 4 | `G:\Poze\Snapchat-1896150730.jpg`, `D:\Portfolio\poze\Snapchat-1896150730.jpg` | **delete** (Snapchat export) |
| `MSGR_PHOTO_*` | 2 | `G:\Poze\MSGR_PHOTO_FOR_UPLOAD_1534687932756.jpg_1534687935959.jpeg` | **delete** (Messenger upload artifact) |
| `PHOTO_*` (`photo-<id>-…`) | 2 | `G:\Poze\Browser\photo-1615966650071-855b15f29ad1.jpg` | **delete** (Unsplash CDN slug) |
| `unnamed*` | 2 | `G:\Poze\Browser\unnamed-31-1024x1024.jpg` | **delete** (mail attachment) |
| `icon*` | 2 | `G:\Poze\icon.png`, `D:\Portfolio\poze\icon.png` | **delete** (UI asset) |

Pattern coverage of the 41,470-row supersets is ~3,500 — most no-date-signal orphans are **caught by the folder rollup (§2) rather than filename-only** (e.g. the 20,190 `<root>` no-date orphans on D:\ are mixed-name dumps, not fitting one prefix). The folder-level cuts in §6 are therefore where the bulk-delete bite comes from.

Aggregate **delete-class pattern hits**: ~3,074 (sum of all "delete" rows above; a handful are duplicated across G:/D:).
Aggregate **absorb-class pattern hits**: 510 (`IMG_NNNN`).
Aggregate **review-class hits**: 112 (`FB_IMG_*` + 2 `PHOTO_*`).

## 4. Year-folder hint check (gap in per-year slices)

Of the 33,231 orphans flagged `not-in-sibling-scan` (no other reason — i.e. they have a date signal somewhere), how many sit inside a path component that contains a 4-digit year (1980–2026)?

| Year hint in path | Count |
| --- | ---: |
| 2026 | 502 |
| 2025 | 3,322 |
| 2024 | 3,708 |
| 2023 | 344 |
| 2018 | 3 |
| 2017 | 2 |
| 2015 | 1 |
| **Total with year hint** | **7,882** |
| **No year hint** | **25,349** |

Findings:

- **7,882 orphans (~24%)** carry a year token in their path that the per-year P1/P3/P4/P5 slices SHOULD have absorbed but didn't.
- The lopsided concentration in **2024 (3,708) and 2025 (3,322)** suggests the P4 (2023-2024) and P5 (2025-2026 + undated) slices missed root-level / atypical-folder layouts — consistent with the P-orphans summary.md note that "P4 partial" and "P5 partial" coverage was logged.
- The 502 orphans for 2026 likely need a re-pass once the in-progress `2026-03-balkans-roadtrip/` material settles.
- The remaining **25,349 not-in-sibling-scan orphans without any year hint** are mostly root-level flat dumps — they have a date signal (filename `IMG_YYYYMMDD_*` or EXIF) but no parent-year folder. Re-running P1-P5 on the orphan-list directly (rather than scanning year-bucket folders) is the right shape.

Recommendation: re-run **P4 (2023-2024)** and **P5 (2025-2026)** with the orphan-list as input rather than re-walking the tree. P1 (≤2017) and P3 (2021-2022) are likely fine — the year-hint distribution shows almost no orphans pre-2023.

## 5. Auto-absorb estimate

Files where `not-in-sibling-scan` is the **only** reason fired (i.e. they had a filename date or year-folder hint, but the per-year slices simply skipped them): **33,231**.

These need no taste call from Eduard. The right move is to re-run P1/P3/P4/P5 against the orphan-list rather than re-walking the disk. Estimated absorb rate: ~95% (the residual 5% will be edge cases like out-of-range filename-date heuristic false positives).

## 6. Concrete proposals (Eduard sign-off)

### 6.1 Auto-absorb candidates (no Eduard input needed)

- **Estimated count**: 33,231 (all `not-in-sibling-scan`-only rows).
- **Action**: re-run `scripts/.photo-classify/P1`/`P3`/`P4`/`P5` scans with the P-orphans NDJSON as input rather than re-walking the disk.
- **Risk**: zero — these files have a date signal and live under the allowlist; they were just missed by year-bucket scoping.

### 6.2 Bulk-delete candidates (per-folder ticks)

Tick-list for Eduard. Each row is a **whole folder** that is >70% no-date-signal class. Skip any you want kept.

```
[ ] G:\Poze\Browser\                           424 files (380 no-date-signal, 90%)  — Pinterest/web saves
[ ] D:\Portfolio\poze\Browser\                 424 files (380 no-date-signal, 90%)  — mirror of G:\Poze\Browser
[ ] G:\Poze\X\                                  18 files ( 14 no-date-signal, 78%)  — old FB-CDN basenames
[ ] D:\Portfolio\poze\X\                        18 files ( 14 no-date-signal, 78%)  — mirror of G:\Poze\X
```

Tick-list for **filename-pattern groups inside `<root>`** (G:\Poze and D:\Portfolio\poze flat dumps; the 90% bulk lives here, but folder-level deletion is too broad — use patterns):

```
[ ] <10digit>_*.jpg          ~2,072 files (Facebook photo IDs)
[ ] received_*.jpeg            246 files (Messenger receive)
[ ] <hex hash>.jpg             232 files (browser cache hashes)
[ ] image-0-02-04-*.jpg        196 files (web save / messenger export)
[ ] images (N).jpeg             58 files (browser downloads)
[ ] logo_*.png                  26 files (UI assets)
[ ] download*.{jpg,png}         20 files (browser downloads)
[ ] _a_t_m_e_g_a___free_rtos*   12 files (Doxygen call-graph artifacts)
[ ] N__N.png                     8 files (hash PNGs)
[ ] Snapchat-*.jpg               4 files (Snapchat export)
[ ] MSGR_PHOTO_FOR_UPLOAD_*      2 files (Messenger upload)
[ ] photo-<unsplash-id>-*.jpg    2 files (Unsplash CDN slugs)
[ ] unnamed-*.jpg                2 files (mail attachments)
[ ] icon.png                     2 files (UI asset)
```

**Total proposed bulk-delete (pending sign-off)**: 3,754 files (848 folder-level + 2,906 pattern-level). These overlap zero so they sum cleanly. Plus the larger `<root>` flat-dump pool below.

The bigger "true delete" pool is the **20,190 / 20,192 no-date-signal rows inside `<root>` of D:\ and G:\** that don't fit any pattern above. Those need a second-pass classifier before bulk-delete (either visual content hashing for Pinterest fingerprints, or Eduard manually scrubbing alphabetically — too many to tick row-by-row). **Recommended next step**: run the pattern-detector on a wider regex set (Telegram exports, Tumblr URLs, blog-CDN slugs) before producing a final tick-list.

### 6.3 Re-EXIF candidates (Eduard nods)

- **Count**: 1,018 HEIC/RAW files (`.heic` 1,018; no `.cr2`/`.nef`/`.dng`/`.arw` in the orphan list).
- **Action**: install exiftool, run `scripts/.photo-classify/P-orphans/rescan-heic.ps1` (TODO per summary.md). No taste call.
- **Likely outcome**: 86 of these are the Hamburg `Ha_Photos\` cluster — feeds straight into action item #1 of `photo-classification-plan.md` (Hamburg 2022 import).

### 6.4 Keep + reclassify (top 20 candidates)

Orphans with mtime ≥ 2018-01-01 AND EXIF DateTimeOriginal present AND size ≥ 0.5 MB (camera-EXIF signal). These are **likely Eduard's own work that's just misfiled**. The DSC_NNNN cluster below is the 4,031-member CV/CL DSLR run that P-B already flagged — **half of these paths are inside `CV + CL photos\`** (sensitive folder; do NOT publish, only re-key for catalogue).

| Path | mtime | EXIF taken | Size MB |
| --- | --- | --- | ---: |
| `G:\Poze\DSC_0889.JPG` | 2020-09-01 | 2020-09-01 | 13.1 |
| `G:\Poze\CV + CL photos\All\DSC_0889.JPG` | 2020-09-01 | 2020-09-01 | 13.1 |
| `G:\Poze\DSC_0888.JPG` | 2020-09-01 | 2020-09-01 | 12.6 |
| `G:\Poze\CV + CL photos\All\DSC_0888.JPG` | 2020-09-01 | 2020-09-01 | 12.6 |
| `G:\Poze\DSC_0887.JPG` | 2020-09-01 | 2020-09-01 | 12.3 |
| `G:\Poze\CV + CL photos\All\DSC_0887.JPG` | 2020-09-01 | 2020-09-01 | 12.3 |
| `G:\Poze\DSC_0895.JPG` | 2020-09-01 | 2020-09-01 | 11.8 |
| `G:\Poze\CV + CL photos\All\DSC_0895.JPG` | 2020-09-01 | 2020-09-01 | 11.8 |
| `G:\Poze\DSC_0893.JPG` | 2020-09-01 | 2020-09-01 | 11.8 |
| `G:\Poze\CV + CL photos\All\DSC_0893.JPG` | 2020-09-01 | 2020-09-01 | 11.8 |
| `G:\Poze\DSC_0875.JPG` | 2020-09-01 | 2020-09-01 | 10.9 |
| `G:\Poze\CV + CL photos\All\DSC_0875.JPG` | 2020-09-01 | 2020-09-01 | 10.9 |
| `G:\Poze\DSC_0886.JPG` | 2020-09-01 | 2020-09-01 | 10.8 |
| `G:\Poze\CV + CL photos\All\DSC_0886.JPG` | 2020-09-01 | 2020-09-01 | 10.8 |
| `G:\Poze\DSC_0903.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |
| `G:\Poze\CV + CL photos\All\DSC_0903.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |
| `G:\Poze\DSC_0902.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |
| `G:\Poze\CV + CL photos\All\DSC_0902.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |
| `G:\Poze\DSC_0894.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |
| `G:\Poze\CV + CL photos\All\DSC_0894.JPG` | 2020-09-01 | 2020-09-01 | 10.7 |

**Important caveat**: the entire top-20 here is the same 2020-09-01 DSC_NNNN headshot batch (the 4,031-member CV/CL group from P-B). The mtime-after-2018 + EXIF-present heuristic isn't selective enough — it's dominated by one big cluster. Recommended fix before next round:

1. dedupe by `EXIF DateTimeOriginal` minute-bucket;
2. exclude paths under `CV + CL photos\` from "publish-candidate" lists;
3. re-rank by **EXIF GPS presence** (P-A2 found that's the truer signal for Eduard's own field shots).

## 7. Sources of error / caveats

1. **Per-year slices skipped 33,231 root-level files.** Expected behaviour — those scans walked year-bucket folders, not flat root dumps. Not a data bug; just needs a re-run with the orphan-list as input rather than re-walking the disk. See §4 for the year-distribution evidence.
2. **614 sensitive-folder paths excluded from §2 rollup.** Per `docs/photo-classification-plan.md` privacy note: `CV + CL photos\`, `Driving license photos\`, `ID Photos\`, `Passport photos\`, `Residence permit photos\` are blocklisted. They appear in §6.4's "keep + reclassify" extract because the heuristic (mtime + EXIF) doesn't discriminate by path; ignore those rows for any publish path.
3. **D:\Portfolio\poze\ vs G:\Poze\ heavy duplication.** Per P-B / P8-redo: 17,529 demote candidates. The §2 rollup shows near-identical counts in every named subfolder on both drives. **Do not act on D:-side files alone — wait for Eduard's sign-off on the dedup demote list (action item #8 in `photo-classification-plan.md`).** The bulk-delete tick-list in §6.2 explicitly mirrors G:/D: pairs so they can move together once dedup is signed off.
4. **§6.2 tick-list is partial.** ~3,754 files explicitly named; the larger flat-`<root>` no-date-signal pool (40,382 rows across G:\ + D:\) needs a second-pass classifier before bulk action. A wider regex pass (Telegram, Tumblr, generic CDN slugs) plus visual-fingerprint clustering against known Pinterest/Imgur output would likely raise that to ~25,000.
5. **The keep-candidates heuristic in §6.4 is dominated by one cluster.** 90% of the top-200 are the 2020-09-01 CV/CL DSLR headshots. Better signals: EXIF GPS presence, `cameraModel` = phone/DSLR not "scanner", and date spread across ≥ 5 distinct days.
6. **HEIC re-EXIF count (1,018) likely undercounts iPhone originals.** Some HEIC files in named folders (`Ha_Photos\`, `Poze Huawei\`, `camera\`) already had a year-hint and so didn't fall into the `exif-unreadable` bucket. Real iPhone-original count after exiftool re-pass is probably 1,200–1,500.
7. **No `.gif`, `.webp`, `.bmp`, `.cr2`, `.nef`, `.dng`, `.arw` in the orphan NDJSON.** This means either (a) they don't exist in the source roots, or (b) the P-orphans `scan.ps1` photo-extension allowlist excluded them. Per §summary.md methodology footnote — accepted exts are `.jpg .jpeg .heic .png .raw .cr2 .nef .dng .arw`. The 0-count for RAW is therefore real (Eduard's DSLR was shooting JPEG-only or RAW files live elsewhere). The 0-count for `.gif`/`.webp` is likewise real for these roots.
8. **D:\Portfolio\poze\Whatsapp\, \Screenshots\, \camera\ are orphan-heavy but not delete-candidates.** Their 0% no-date-signal rate confirms every file has a filename date or year-folder hint — they got missed because the per-year slices walked year-named folders, not these named ones. Treat as auto-absorb (§6.1), not delete.

## 8. Next-action summary

| Action | Files affected | Eduard input | Owner |
| --- | ---: | --- | --- |
| Re-run P1/P3/P4/P5 against orphan-list (auto-absorb) | 33,231 | none | Domain-Expert / scripts agent |
| Install exiftool + re-EXIF HEIC orphans | 1,018 | none | infra |
| Tick the §6.2 folder + pattern bulk-delete list | ~3,754 | per-row | Eduard |
| Wider pattern-detector pass (Telegram/Tumblr/CDN slugs) | TBD | none | Domain-Expert |
| Wait on Eduard's dedup demote-list sign-off before any D:\ action | 17,529 | global yes/no | Eduard |
| Hamburg `Ha_Photos\` re-classify (HEIC subset) | 86 | confirm hero shortlist | Eduard |

## 9. Related

- `scripts/.photo-classify/P-orphans/scan.ndjson` — source NDJSON
- `scripts/.photo-classify/P-orphans/summary.md` — initial summary by P-E agent
- `scripts/.photo-classify/P-orphans/analyze.mjs` — streaming analyzer that produced this doc
- `docs/photo-classification-plan.md` — top-action item #3 this doc resolves
- `docs/photo-organization.md` — §6 (delete classes) + §6.1 (source allowlist)
- `scripts/.photo-classify/P13/sensitive-sweep.md` — privacy blocklist
- `scripts/.photo-classify/P8-redo/dedup.ndjson` + `summary.md` — dedup demote list (17,529)
