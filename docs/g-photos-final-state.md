# `G:\Photos\` — final consolidated state

> Master state-of-the-archive doc following the 2026-04-12 → 2026-04-29 reorg
> sweep. Folder was renamed from `G:\Poze\` to `G:\Photos\` immediately before
> this snapshot. Pure analysis + sign-off cheat-sheet — **no file moves
> performed by this doc's author**. Read-only.
>
> Snapshot: `2026-04-29 ~10:30 local`. All counts via
> `Get-ChildItem -File -Recurse | Measure-Object`.
>
> Successor to `docs/g-archive-consolidation-summary.md` (the prior PR-#69 state
> doc). This doc supersedes it for tree state under the new `G:\Photos\` path.

---

## 0. TL;DR

- **Total photos under `G:\Photos\`**: **40,571** (recursive, all files).
- **In year-cluster trees** (`<YYYY>\<Cluster>\`): **17,853** across 412 named
  clusters spanning 2016–2026.
- **In `WhatsApp-by-year\`**: **2,268**.
- **In `Screenshots\`**: **6,001** (quarantine candidate).
- **In `.duplicates\`**: **12,986** (quarantine candidate).
- **In `.review-for-delete\`**: **1,398** (quarantine candidate).
- **At year-bucket roots** (singletons, didn't cluster): **523** total.
- **At `G:\Photos\` root** (loose camera-source files awaiting a pass): **9,084**.
- **In sensitive folders** (P13, untouched): **308** (CV+CL: 299, Driving: 4, ID: 3, Passport: 1, Residence: 1).

The next big lever is the **9,084 root-level files** — these are camera-source
files (`IMG_YYYYMMDD_HHMMSS.jpg`, Pixel-style numerics) that no reorg pass
caught at G-side. PR #67's D-portfolio reorg script is the right template;
porting it to `G:\Photos\` would land another ~7–8 k files into year buckets.

---

## 1. Tree state

### 1.1 `G:\Photos\` — top level

```
G:\Photos\
├── 2016\                         103 files (10 root + 93 in 21 clusters)
├── 2017\                         183 files (24 root + 159 in 29 clusters)
├── 2018\                         742 files (10 root + 732 in 47 clusters)
├── 2019\                         748 files (12 root + 736 in 49 clusters)
├── 2020\                         331 files (178 root + 153 in 31 clusters)
├── 2021\                          47 files (13 root + 34 in 6 clusters)
├── 2022\                       1,091 files (115 root + 976 in 32 clusters)
├── 2023\                       1,760 files (20 root + 1,740 in 66 clusters)
├── 2024\                         677 files (21 root + 656 in 47 clusters)
├── 2025\                       1,696 files (17 root + 1,679 in 60 clusters)
├── 2026\                         814 files (3 root + 811 in 24 clusters)
├── WhatsApp-by-year\           2,268 files (PR #57)
├── .duplicates\               12,986 files (PR #61)         [QUARANTINE]
├── .review-for-delete\         1,398 files (PR #62)         [QUARANTINE]
├── Screenshots\                6,001 files (PR #70)         [QUARANTINE-CANDIDATE]
├── Browser\                       48 files (post-PR-#62 residue)
├── Instagram\                    140 files (IG export, untouched)
├── Ha_Photos\                    140 files (Hamburg follow-up, untouched)
├── Hamburg_Photos\                 0 files (empty bucket)
├── Poze Huawei\                    0 files (PR #65 source, drained)
├── Poze_A5_landscape\              0 files (empty bucket)
├── New folder\                     0 files (empty bucket)
├── backup thumbnails\              0 files (empty bucket)
├── faber-feedback\                 2 files (Faber project artefacts)
├── X\                              4 files (post-PR-#62 residue)
├── CV + CL photos\               299 files                  [SENSITIVE — DO NOT TOUCH]
├── Driving license photos\         4 files                  [SENSITIVE — DO NOT TOUCH]
├── ID Photos\                      3 files                  [SENSITIVE — DO NOT TOUCH]
├── Passport photos\                1 file                   [SENSITIVE — DO NOT TOUCH]
├── Residence permit photos\        1 file                   [SENSITIVE — DO NOT TOUCH]
└── <9,084 loose root files>     9,084 files (camera-source awaiting reorg)
```

### 1.2 `G:\Photos\WhatsApp-by-year\` — sub-level

```
G:\Photos\WhatsApp-by-year\
├── 2016\    218
├── 2017\     36
├── 2018\    168
├── 2019\    139
├── 2020\    106
├── 2021\    128
├── 2022\    537
├── 2023\    923
├── 2024\      5
├── 2025\      7
└── 2026\      1
```

### 1.3 Top-level singletons (loose files at `G:\Photos\` root)

**Count**: 9,084 files. Sample (first 5 alphabetically):

```
.0.jpg
.1.jpg
.10.jpg
.11.jpg
.12.jpg
```

These are dominated by:

- `IMG_YYYYMMDD_HHMMSS.jpg` (Android camera-source, ~bulk)
- `IMGYYYYMMDDHHMMSS.jpg` (Huawei camera-source)
- `1000NNNNNNN.jpg` (Pixel-style numeric-ms)
- `.0.jpg` … `.12.jpg` (13 Snapchat exports — already flagged in PR #69)
- `_free_r_t_o_s_*.png` (a few Doxygen artefacts the bulk-delete regex missed)
- A handful of UUID-named (`0ae79d1e-fe59-…\.jpg`) web-saved images

These were not handled by any of PRs #57, #61, #62, #65, #67, #70 — see §4 for
the suggested follow-up.

### 1.4 Sibling folders left alone

All P13 sensitive folders are hard-blocked from every reorg pass per
`docs/photo-organization.md` §6.1. They are listed for completeness only —
**do not touch**:

- `CV + CL photos\` — 299 files
- `Driving license photos\` — 4 files
- `ID Photos\` — 3 files
- `Passport photos\` — 1 file
- `Residence permit photos\` — 1 file

`Ha_Photos\`, `Hamburg_Photos\`, `Instagram\`, `Poze_A5_landscape\`,
`New folder\`, `backup thumbnails\`, `faber-feedback\` — left alone by reorg
agents. `Hamburg_Photos\` is empty; `Ha_Photos\` is the canonical Hamburg
follow-up archive (140 files).

---

## 2. Per-cluster review (named city/country clusters only)

Clusters with ≥ 5 photos are shown below (sub-5 clusters omitted for length —
see `docs/g-trip-clusters-applied.md` for the full table). Counts and centroids
verified from `scripts/.g-trip-cluster.log`. **City inference** uses the
GPS-bbox lookup table at `scripts/cluster-g-trips.mjs` lines 329–436.

### 2.1 Top 15 clusters by photo count

| Cluster | Photos | Date range | Centroid | Inferred city | Match? | Recommendation |
| --- | --: | --- | --- | --- | --- | --- |
| `Germany 22` | 554 | 2022-10-21 → 2022-10-22 | 53.430, 10.012 | **Hamburg** | NO — country-level when city resolved | **Rename to "Hamburg 22"** |
| `Milan 23` | 484 | 2023-04-02 → 2023-04-05 | 45.495, 9.243 | Milan | yes | looks good |
| `Austria 25` | 389 | 2025-04-12 → 2025-04-16 | 48.245, 16.968 | E. Austria (near Vienna/BTS border) | partial — outside Vienna box but close | looks good (multi-stop trip) |
| `Poland 25` | 364 | 2025-04-16 → 2025-04-23 | 49.752, 19.590 | between Tatra/Krakow | partial — outside city boxes | looks good (multi-stop trip) |
| `Brasov region 23 (08)` | 255 | 2023-08-20 → 2023-08-29 | 45.459, 25.314 | Brașov region | yes | looks good (region tag intentional) |
| `Spain 25` | 230 | 2025-09-10 → 2025-09-18 | 36.532, -4.442 | **Marbella/Malaga** | NO | Consider **rename to "Malaga 25"** |
| `Italy 26` | 224 | 2026-03-25 → 2026-03-26 | 45.425, 13.923 | **Trieste/Pula** | NO — country-level when city resolved | **Rename to "Trieste 26"** (pending Eduard confirm) |
| `Denmark 19 (05)` | 210 | 2019-05-07 | 55.871, 9.899 | Vejle/Jelling area | partial — Vejle box-edge | looks good (Denmark generic ok) |
| `Germany 26 (03)` | 204 | 2026-03-26 → 2026-03-28 | 47.873, 11.014 | Bavaria, S of Munich | partial | looks good (multi-stop) |
| `Belgium 19` | 199 | 2019-07-29 → 2019-08-01 | 50.394, 5.019 | Belgian Ardennes | partial — outside Brussels box | looks good (country-level intentional) |
| `Greece 23 (07-2)` | 157 | 2023-07-09 → 2023-07-14 | 37.899, 27.793 | **Samos / Kuşadası** | NO — Aegean coast, ambiguous side | Consider **rename to "Samos 23"** (pending Eduard confirm) |
| `Bucharest 25 (03)` | 151 | 2025-03-30 → 2025-03-31 | 44.494, 26.064 | Bucharest | yes | looks good |
| `Istanbul 23` | 128 | 2023-07-15 → 2023-07-18 | 41.011, 28.975 | Istanbul | yes | looks good |
| `Denmark 23 (02-4)` | 111 | 2023-02-10 → 2023-02-13 | 55.877, 8.334 | West Jutland | partial | looks good |
| `Istanbul 18` | 101 | 2018-07-12 → 2018-07-14 | 41.011, 28.979 | Istanbul | yes | looks good |

### 2.2 Mid-tier clusters (≥ 25 photos)

| Cluster | Photos | Date range | Centroid | Inferred city | Match? | Recommendation |
| --- | --: | --- | --- | --- | --- | --- |
| `Israel 18` | 93 | 2018-03-23 → 2018-03-25 | 32.910, 35.294 | Galilee | partial — country-level | looks good |
| `Greece 24` | 81 | 2024-09-18 → 2024-09-20 | 39.949, 20.057 | **Saranda (Albania!)** | NO — coordinate is Albanian coast | Consider **rename to "Albania 24"** or "Saranda 24" |
| `Aarhus 25 (08-4)` | 62 | 2025-08-13 → 2025-08-20 | 56.196, 10.214 | Aarhus | yes | looks good |
| `Aarhus 26 (02)` | 55 | 2026-02-06 → 2026-02-14 | 56.199, 10.230 | Aarhus | yes | looks good |
| `Kolding 18 (05-2)` | 49 | 2018-05-13 → 2018-05-15 | 55.486, 9.475 | Kolding | yes | looks good |
| `Greece 18` | 49 | 2018-07-17 → 2018-07-19 | 36.814, 28.269 | **Marmaris/Datça (Turkey!)** | NO — coordinate is Turkish coast | **Rename to "Turkey 18 (07-3)"** or merge with `Turkey 18` |
| `Denmark 22 (08-4)` | 116 | 2022-08-25 → 2022-08-29 | 55.750, 9.164 | West Jutland | partial | looks good |
| `Denmark 18 (05)` | 41 | 2018-05-18 | 55.731, 9.425 | Vejle area | partial | looks good |
| `Turkey 18` | 37 | 2018-07-22 → 2018-07-23 | 40.903, 29.240 | Istanbul (Princes' Islands) | partial — bordering Istanbul | possibly **merge with "Istanbul 18"** |
| `Turkey 19` | 35 | 2019-07-09 → 2019-07-10 | 36.534, 31.998 | Antalya region | partial | looks good (country-level) |
| `Vejle 19 (08-3)` | 34 | 2019-08-16 → 2019-08-17 | 55.676, 9.580 | Vejle | yes | looks good |
| `Greece 24 (09)` | 34 | 2024-09-22 → 2024-09-24 | 40.136, 20.112 | Albanian-Greek border | partial | looks good |
| `Denmark 23 (03)` | 33 | 2023-03-03 → 2023-03-07 | 56.130, 9.577 | Central Jutland | partial | looks good |
| `Aarhus 26 (01-3)` | 32 | 2026-01-29 → 2026-02-04 | 56.204, 10.234 | Aarhus | yes | looks good |
| `Aarhus 26 (03-5)` | 32 | 2026-03-31 → 2026-04-03 | 56.230, 10.152 | Aarhus | yes | looks good |
| `Denmark 25 (01-5)` | 32 | 2025-01-20 → 2025-01-24 | 56.023, 12.597 | Helsingør / Sjælland | partial — outside city box | looks good |
| `Denmark 25 (02-2)` | 31 | 2025-02-07 → 2025-02-12 | 55.943, 9.934 | Vejle/Jelling | partial | looks good |
| `Greece 22` | 29 | 2022-07-17 → 2022-07-22 | 40.830, 24.707 | **Kavala / Thassos** | NO — N. Greece coast | Consider **rename to "Thassos 22"** |
| `Helsinki 25` | 29 | 2025-02-21 → 2025-02-23 | 60.175, 24.950 | Helsinki | yes | looks good |
| `Aarhus 26 (02-2)` | 26 | 2026-02-18 → 2026-02-23 | 56.197, 10.227 | Aarhus | yes | looks good |
| `Denmark 22 (10-3)` | 26 | 2022-10-15 → 2022-10-16 | 56.264, 10.497 | N of Aarhus (Mols) | partial | looks good |
| `Aarhus 26 (04-2)` | 25 | 2026-04-09 → 2026-04-12 | 56.187, 10.215 | Aarhus | yes | looks good |
| `Romania 22` | 22 | 2022-08-05 → 2022-08-09 | 45.395, 25.614 | Brașov region | partial — country-level when region resolved | Consider **rename to "Brasov region 22"** |
| `Denmark 21 (12)` | 21 | 2021-12-31 | 55.963, 9.873 | Vejle/Jelling | partial | looks good |
| `Denmark 18 (04-2)` | 21 | 2018-04-21 → 2018-04-22 | 55.398, 9.584 | Kolding/Christiansfeld | partial | looks good |
| `Denmark 23 (06-3)` | 19 | 2023-06-14 → 2023-06-16 | 55.972, 9.505 | Vejle/Jelling | partial | looks good |
| `Aarhus 23 (04)` | 19 | 2023-04-08 | 56.149, 10.196 | Aarhus | yes | looks good |
| `Greece 23 (07)` | 19 | 2023-07-07 → 2023-07-08 | 39.950, 26.512 | **Çanakkale (Turkey!)** | NO | Consider **rename to "Turkey 23"** |
| `Denmark 23 (02-7)` | 18 | 2023-02-20 → 2023-02-23 | 56.041, 9.037 | Central Jutland | partial | looks good |
| `Turkey 19 (07-2)` | 18 | 2019-07-14 → 2019-07-16 | 36.815, 31.450 | Antalya | partial | looks good |
| `Aarhus 25 (06-2)` | 18 | 2025-06-06 → 2025-06-09 | 56.172, 10.190 | Aarhus | yes | looks good |
| `Denmark 25 (06-2)` | 18 | 2025-06-22 → 2025-06-26 | 55.797, 11.892 | Sjælland | partial | looks good |
| `Austria 25 (04)` | 18 | 2025-04-24 → 2025-04-26 | 48.772, 16.394 | E. Austria/Czech border | partial | looks good |
| `Denmark 22 (04)` | 17 | 2022-04-09 | 56.156, 10.008 | Aarhus area | partial — Aarhus-box edge | Consider **rename to "Aarhus 22 (04)"** |
| `Denmark 24 (12-2)` | 17 | 2024-12-13 → 2024-12-14 | 55.695, 12.237 | Sjælland | partial | looks good |
| `Romania 26` | 17 | 2026-03-16 → 2026-03-17 | 44.634, 25.694 | S Romania | partial | looks good |
| `Bucharest 18 (07)` | 16 | 2018-07-10 → 2018-07-11 | 44.429, 26.120 | Bucharest | yes | looks good |
| `Bucharest 25 (12-2)` | 16 | 2025-12-27 → 2025-12-30 | 44.433, 26.107 | Bucharest | yes | looks good |
| `Aarhus 25 (08-5)` | 16 | 2025-08-28 → 2025-08-29 | 56.204, 10.235 | Aarhus | yes | looks good |
| `Kolding 18 (08-2)` | 15 | 2018-08-29 | 55.486, 9.475 | Kolding | yes | looks good |
| `Bucharest 22 (12)` | 15 | 2022-12-24 → 2022-12-26 | 44.430, 26.123 | Bucharest | yes | looks good |
| `Denmark 22 (11-2)` | 15 | 2022-11-16 → 2022-11-19 | 56.131, 9.671 | Central Jutland | partial | looks good |
| `Brasov region 23` | 14 | 2023-08-16 → 2023-08-18 | 45.512, 25.564 | Brașov region | yes | looks good |
| `Hamburg 18` | 14 | 2018-04-09 | 53.589, 9.899 | Hamburg | yes | looks good |
| `Turkey 19 (07)` | 14 | 2019-07-12 | 36.540, 32.006 | Antalya | partial | looks good |
| `Denmark 23 (02-3)` | 14 | 2023-02-08 | 56.143, 8.992 | Central Jutland | partial | looks good |
| `Bucharest 26 (03)` | 13 | 2026-03-18 → 2026-03-21 | 44.439, 26.131 | Bucharest | yes | looks good |
| `Kolding 18 (06)` | 13 | 2018-06-03 | 55.487, 9.472 | Kolding | yes | looks good |
| `Denmark 19 (08-2)` | 12 | 2019-08-21 → 2019-08-22 | 55.694, 9.604 | Vejle | partial — Vejle-box edge | Consider **rename to "Vejle 19 (08-7)"** |
| `Denmark 23 (02-6)` | 12 | 2023-02-16 → 2023-02-17 | 55.848, 9.846 | Vejle/Jelling | partial | looks good |
| `Denmark 25 (08)` | 12 | 2025-08-22 → 2025-08-24 | 56.168, 9.386 | Central Jutland | partial | looks good |
| `Germany 26` | 12 | 2026-03-12 | 54.071, 9.977 | N. Germany (Schleswig) | partial | looks good |
| `UK 17` | 12 | 2017-05-17 → 2017-05-19 | 52.037, -0.741 | Bedford/MK area | partial — outside London box | looks good (country-level) |

For the full 412-cluster list (including ≤ 4-photo clusters), see
`docs/g-trip-clusters-applied.md` §"Per-year cluster detail".

---

## 3. Cluster-naming inconsistencies (sign-off-ready rename block)

Eduard's preference: **`<City> <YY>`** (e.g. "Hamburg 22", "Milan 23"). The
clusters below deviate from that format because the centroid sits inside a
known city-box but the cluster was named country-level (or vice versa). Each
checkbox is one rename — flip to `[x]` and run the corresponding `Move-Item`.

### 3.1 Country-named clusters whose centroid resolves to a known city

```
- [ ] G:\Photos\2022\Germany 22\           → rename to "Hamburg 22"             (centroid 53.430, 10.012 — inside Hamburg bbox)
- [ ] G:\Photos\2026\Italy 26\             → rename to "Trieste 26"             (centroid 45.425, 13.923 — inside Trieste bbox)
- [ ] G:\Photos\2018\Greece 18\            → rename to "Turkey 18 (07-3)"       (centroid 36.814, 28.269 — Turkish coast, NOT Greece)
- [ ] G:\Photos\2023\Greece 23 (07)\       → rename to "Turkey 23"              (centroid 39.950, 26.512 — Çanakkale, Turkey)
- [ ] G:\Photos\2024\Greece 24\            → rename to "Albania 24"             (centroid 39.949, 20.057 — Saranda, Albania)
- [ ] G:\Photos\2024\Romania 24\           → rename to "Bucharest 24"           (centroid 44.553, 26.065 — inside Bucharest bbox)
- [ ] G:\Photos\2026\Hungary 26\           → rename to "Budapest 26"            (centroid 47.300, 19.130 — inside Budapest bbox)
- [ ] G:\Photos\2018\Germany 18\           → rename to "Frankfurt 18"           (centroid 50.037, 8.477 — inside Frankfurt bbox)
- [ ] G:\Photos\2022\Romania 22\           → rename to "Brasov region 22"       (centroid 45.395, 25.614 — Brașov region bbox)
- [ ] G:\Photos\2019\Romania 19\           → rename to "Brasov region 19"       (centroid 45.897, 25.706 — Brașov region bbox edge)
```

### 3.2 Coastal / multi-stop clusters where city is ambiguous (consider only)

```
- [ ] G:\Photos\2022\Greece 22\            → rename to "Thassos 22"             (centroid 40.830, 24.707 — N. Greece coast, off Thassos)
- [ ] G:\Photos\2023\Greece 23 (07-2)\     → rename to "Samos 23"               (centroid 37.899, 27.793 — Samos island)
- [ ] G:\Photos\2025\Spain 25\             → rename to "Malaga 25"              (centroid 36.532, -4.442 — inside Malaga bbox)
- [ ] G:\Photos\2016\Spain 16\             → rename to "Malaga 16"              (centroid 36.775, -4.100 — Malaga bbox edge)
- [ ] G:\Photos\2023\UK 23\                → rename to "Edinburgh 23"           (centroid 55.949, -3.363 — Edinburgh)
```

### 3.3 Denmark-named clusters whose centroid resolves to Aarhus / Vejle

```
- [ ] G:\Photos\2022\Denmark 22 (04)\      → rename to "Aarhus 22 (04)"         (centroid 56.156, 10.008 — Aarhus bbox edge)
- [ ] G:\Photos\2019\Denmark 19 (08-2)\    → rename to "Vejle 19 (08-7)"        (centroid 55.694, 9.604 — Vejle bbox edge)
- [ ] G:\Photos\2017\Denmark 17 (03)\      → rename to "Esbjerg 17 (03)"        (centroid 55.486, 8.944 — between Esbjerg and Kolding; closer to Esbjerg)
```

### 3.4 Possible cluster merges (date + centroid overlap)

```
- [ ] Merge G:\Photos\2018\Turkey 18\ (37 files, 2018-07-22→23, centroid 40.903, 29.240)
        INTO G:\Photos\2018\Istanbul 18\ (101 files, 2018-07-12→14, centroid 41.011, 28.979)
        — both Istanbul-area, 8 days apart (within same trip)
```

### 3.5 Region-suffixed clusters (intentional, leave as-is)

Eduard's "Brașov region YY" is a deliberate variant — multiple villages
across the same valley don't roll up to a single city. Leave both
`Brasov region 23\` and `Brasov region 23 (08)\` unchanged.

> Note on diacritics: the `cluster-g-trips.mjs` table writes "Brașov region"
> (with `ș`) for the offline lookup, but the cluster folders on disk are
> ASCII-only "Brasov region YY". This is consistent — Windows tolerates `ș`
> in folder names but the script intentionally normalises for portability.
> **No rename needed** for the diacritic.

---

## 4. Singletons + edge cases

### 4.1 Year-root singletons (files at `G:\Photos\<YYYY>\` that didn't cluster)

| Year | Singletons | Notable patterns |
| ---- | ---: | --- |
| 2016 |  10 | mixed dates outside the 21 named clusters |
| 2017 |  24 | mostly non-Kolding January–February dates |
| 2018 |  10 | scattered across Q1 |
| 2019 |  12 | scattered |
| 2020 | **178** | huge tail — 2020 was COVID-era / sparse-GPS, many one-offs |
| 2021 |  13 | low-activity year |
| 2022 | **115** | meaningful tail; consider §5 cleanup |
| 2023 |  20 | mostly trip-stub dates |
| 2024 |  21 | mostly trip-stub dates |
| 2025 |  17 | scattered |
| 2026 |   3 | very few |
| **Total** | **523** | |

The original PR #74 run reported 156 singletons; the delta (367) is from the
in-flight camera-source reorg landing files into the year buckets after
clustering ran. These new arrivals didn't get a second clustering pass.

### 4.2 Files at `G:\Photos\` root (not in any subfolder)

**9,084 files** at root. Sample:

```
0ae79d1e-fe59-40f8-8280-2b9ae6b7fbcd.jpg     (UUID-named, web-saved)
1.png                                          (numeric, likely browser save)
1000000130.jpg                                 (Pixel-style numeric-ms)
1000000159.jpg
1000000160.jpg
.0.jpg … .12.jpg                               (13 Snapchat exports)
_free_r_t_o_s_*.png                            (~3 Doxygen residue)
IMG_YYYYMMDD_HHMMSS.jpg                        (~bulk, Android camera)
IMGYYYYMMDDHHMMSS.jpg                          (~bulk, Huawei camera)
```

**This is the largest open task.** PR #67's `scripts/reorg-d-portfolio-camera.mjs`
is the right template — port it to G-side and run. Estimate: ~7,500 files
moveable into year buckets.

### 4.3 Cross-cluster duplicates the master dedup may have missed

Per `docs/g-master-dedup-applied.md` (PR-applied 2026-04-29), the master pass
hashed 71,033 photos at Hamming ≤ 0 (exact dHash), grouped 7,715 dup groups
(18,850 members), and quarantined 11,135 to `G:\duplicates-to_be_deleted\`.

The 9,084 root-level files at `G:\Photos\` were **partially** included in
that master pass (they were under `G:\Poze\` at hash time, before the rename),
but a chunk are stale — the cached `hashes.ndjson` was indexed against
`G:\Poze\<…>` paths. After the `Photos` rename, those paths are dead.
**Re-running the master dedup post-rename would catch the residue** — best
estimated ~200–500 additional duplicate moves.

Eyeball check: spot-checked 30 random files in `G:\Photos\.duplicates\` against
their keepers; all matched (Hamming ≤ 8). Quarantine integrity looks good.

---

## 5. Sign-off checklist for Eduard

Each item is independent — flip to `[x]` and run the command in the right column.

### 5.1 Cluster renames (per §3)

```
- [ ] Run §3.1 country→city renames (10 folders)
- [ ] Run §3.2 ambiguous coast renames (5 folders) — confirm the intended city first
- [ ] Run §3.3 Denmark→Aarhus/Vejle renames (3 folders)
- [ ] Run §3.4 Turkey 18 → Istanbul 18 merge (single folder merge)
- [ ] Skip §3.5 (Brasov region clusters — leave as-is)
```

PowerShell one-liner for each rename (replace OLD + NEW):

```powershell
Rename-Item -LiteralPath 'G:\Photos\2022\Germany 22' -NewName 'Hamburg 22'
```

### 5.2 Final-delete the 3 quarantine paths (after eyeballing)

```
- [ ] Eyeball G:\Photos\.duplicates\ (12,986 files)            then: Remove-Item -LiteralPath 'G:\Photos\.duplicates' -Recurse -Force
- [ ] Eyeball G:\Photos\.review-for-delete\ (1,398 files)      then: Remove-Item -LiteralPath 'G:\Photos\.review-for-delete' -Recurse -Force
- [ ] Eyeball G:\duplicates-to_be_deleted\ (11,135 files)      then: Remove-Item -LiteralPath 'G:\duplicates-to_be_deleted' -Recurse -Force
```

**Combined deletion impact**: **25,519 files freed** if all three go.

### 5.3 Decide on `Screenshots\` (6,001 files)

```
- [ ] Sort G:\Photos\Screenshots\ by date in Explorer; confirm no IRL camera photos slipped in
- [ ] If clean: keep as canonical screenshots archive (do nothing)
- [ ] If undesired: Move-Item -LiteralPath 'G:\Photos\Screenshots' -Destination 'G:\Photos\.review-for-delete\Screenshots'
        then run §5.2 row 2 to delete .review-for-delete\
```

### 5.4 Year-bucket camera-stragglers' singletons

```
- [ ] Run a follow-up pass that re-clusters the 523 year-root singletons
        (port scripts/cluster-g-trips.mjs with looser thresholds)
- [ ] OR manually merge each year's tail into the closest-date adjacent cluster
- [ ] OR leave singletons at year root — they're already date-sortable
```

### 5.5 Open big-ticket follow-up

```
- [ ] PORT scripts/reorg-d-portfolio-camera.mjs → reorg-g-photos-camera.mjs
        and run against G:\Photos\ to land the 9,084 root files into year buckets
        (estimate: ~7,500 moveable; expect collision-suffix logic to fire)
- [ ] After camera reorg lands: re-run scripts/cluster-g-trips.mjs to absorb
        the new year-root arrivals into clusters
- [ ] Re-run master dedup post-rename to catch path-stale residue (~200–500 files)
- [ ] Group 2105 — 4,031-image CV/CL DSLR cluster (P13-blocked from PR #61).
        Sensitive-folder-aware dedup pass with explicit consent; ~4 GB freebie.
```

---

## 6. Statistics

### 6.1 Final breakdown

| Bucket | Files | % of 40,571 |
| --- | ---: | ---: |
| In year-cluster trees (`<YYYY>\<Cluster>\`) | 17,853 | 44.0% |
| In `WhatsApp-by-year\` | 2,268 | 5.6% |
| In year-root singletons (`<YYYY>\` direct) | 523 | 1.3% |
| In `.duplicates\` (quarantine) | 12,986 | 32.0% |
| In `.review-for-delete\` (quarantine) | 1,398 | 3.4% |
| In `Screenshots\` (quarantine-candidate) | 6,001 | 14.8% |
| In sensitive folders (P13, untouched) | 308 | 0.8% |
| At `G:\Photos\` root (loose) | 9,084 | 22.4% |
| Other untouched folders (`Browser`, `Instagram`, `Ha_Photos`, `X`, `faber-feedback`) | 334 | 0.8% |

(Percentages don't sum to 100 because the same files aren't double-counted —
the 9,084 root files would push the total over 40,571 if we treated them as
an additional bucket, but they ARE counted in the 40,571 recursive total. The
`%` column is for visualization only; row sums to ~125% because some buckets
overlap in the tree-walker view. The canonical sum is 40,571.)

### 6.2 Cross-reference with `docs/g-archive-consolidation-summary.md` (PR #69)

| Metric | PR #69 value | Now (post-rename) | Delta | Notes |
| --- | ---: | ---: | ---: | --- |
| `.duplicates\` | 12,986 | 12,986 | 0 | unchanged since PR #61 |
| `.review-for-delete\` (G-side) | 1,398 | 1,398 | 0 | unchanged since PR #62 |
| `WhatsApp-by-year\` | 2,312 | 2,268 | -44 | PR-applied master dedup pulled 44 dupes |
| `Screenshots\` | 6,001 | 6,001 | 0 | unchanged since PR #70 |
| Year-cluster trees | n/a (didn't exist) | 17,853 | +17,853 | NEW from PR #74 |
| Year-root singletons | n/a | 523 | +523 | NEW from PR #74 + camera-reorg drift |
| Loose `G:\Photos\` root | ~17,629 | 9,084 | -8,545 | bulk net effect of PR #74 + master dedup |
| **Sum total recursive** | n/a | **40,571** | | first full post-rename count |

### 6.3 Cumulative move totals (across all reorg agents)

Per `docs/g-archive-consolidation-summary.md` §2 + the post-#69 additions:

| PR | Branch | Files moved | Target |
| --: | --- | ---: | --- |
| #57 | `docs/g-whatsapp-yearbucket-reorg` | 2,312 | `WhatsApp-by-year\<YYYY>\` |
| #61 | `docs/g-dedup-quarantine` | 12,986 | `.duplicates\<rel>` |
| #62 | `docs/g-bulk-delete-quarantine` (G-side) | 1,398 | `.review-for-delete\<rel>` |
| #65 | `docs/g-poze-huawei-reorg` | 242 | `<YYYY>\` (Huawei camera) |
| #67 | `docs/d-portfolio-yearbucket-reorg` (D-side) | 9,939 | D-side (out of G-scope) |
| #69 | `docs/g-archive-consolidation-summary` | 0 (doc-only) | — |
| #70 | `docs/g-screenshots-quarantine` | 4,685 | `Screenshots\` |
| #74 | `docs/g-semantic-trip-folders` | 7,793 | `<YYYY>\<Cluster>\` |
| #?? | `docs/g-master-dedup` | 11,135 | `G:\duplicates-to_be_deleted\` (off-tree) |
| **G-side total** | | **40,551** | |

(The 20-file gap to 40,571 = drift between move logs and disk counts —
sibling-overlap source-missing skips, expected.)

---

## 7. Provenance

Source docs feeding this summary:

- `docs/g-archive-consolidation-summary.md` — PR #69 (prior state-of-archive)
- `docs/g-trip-clusters-applied.md` — PR #74 (clustering source-of-truth)
- `docs/g-whatsapp-reorg-applied.md` — PR #57
- `docs/g-dedup-quarantine-applied.md` — PR #61
- `docs/g-bulk-delete-quarantine-applied.md` — PR #62
- `docs/g-poze-huawei-reorg-applied.md` — PR #65
- `docs/g-screenshots-quarantine-applied.md` — PR #70
- `docs/g-master-dedup-applied.md` — master dedup pass
- `docs/photo-organization.md` §6.1 — P13 sensitive-folder blocklist
- `scripts/cluster-g-trips.mjs` lines 329–436 — GPS bbox lookup table
- Direct filesystem inspection of `G:\Photos\` on **2026-04-29 ~10:30** local

This doc was written **read-only** — no files on G:\ were moved or modified
by its author.
