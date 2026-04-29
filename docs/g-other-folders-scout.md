# `G:\` Photo Scout — Folders Outside `Poze\` and `Whatsapp\`

**Status:** READ-ONLY scout. No files were moved or modified.
**Date:** 2026-04-28.
**Scope:** Every top-level directory under `G:\` except the explicitly skipped ones below.
**Cross-check baseline:** `G:\Poze\` (40,359 photo filenames indexed at scan time).

## Skipped per task spec

| Reason | Folders |
| --- | --- |
| P13 sensitive | `G:\Citizenship\`, `G:\Citizenship_Application\`, `G:\Important Documents\`, `G:\backup NC (24.02.2026)\` |
| Audio-only / already audited | `G:\Whatsapp\`, `G:\Poze\` |
| Clearly non-photo | `G:\Dev\`, `G:\Documents\`, `G:\Calendars\`, `G:\Courses\`, `G:\System Volume Information\`, `G:\$RECYCLE.BIN\` |

## Method

1. Enumerated `G:\` top-level directories (cmd `dir /AD /B`).
2. Recursive count (`.jpg|.jpeg|.png|.heic|.raw|.dng`) per non-skipped folder, depth-4 cap.
3. Sampled 5 files per folder for EXIF (`exiftool -DateTimeOriginal -CreateDate -GPSPosition`); top-tier folders also got a 50-file stratified sample for a date range.
4. Cross-checked basenames against the `G:\Poze\` filename index for duplicate-by-name counts.
5. Re-ran the heaviest folders without the depth cap (PowerShell) to confirm totals — see "Caveats" below.

Driver scripts (read-only, kept in repo for reproducibility):
- `scripts/scout-g-other-folders.mjs`
- `scripts/scout-g-deep-analysis.mjs`

Raw output:
- `scripts/.g-other-folders-scout.json`
- `scripts/.g-other-folders-deep.json`

## Per-folder summary

Counts below: `photoCount` is the recursive count of photo-extension files; `dup` is the count whose basename also appears somewhere in `G:\Poze\`. Date range is from `DateTimeOriginal`/`CreateDate` on the EXIF sample (see "Caveats").

| Folder | Files (total) | Photos | Dup w/ Poze | Date range | Classification | Recommended action |
| --- | ---:| ---:| ---:| --- | --- | --- |
| `G:\Video\` | 15,325 | 10,496 | 2,309 | 2023-11-28 → 2026-02-05 | mixed (WhatsApp media archive — `WhatsApp_Images\` = 10,486 of these) | **MERGE candidate.** Reorg into `G:\Poze\WhatsApp-by-year\<year>\` (will roughly 5x current 2,312 entries there). Keep `Bandicam\`, `Phone_Downloads\`, `take_*\` aside — those are screen recordings / mixed. |
| `G:\WD_EXT_HDD\` | 5,298+ (depth-4) | 4,077 (full-recursion) | 4 | 2016-08-27 → 2017-01-23 (sampled — true range likely 2008-2018) | **primary photo source (legacy backup)** | **MERGE candidate (highest priority).** Goldmine of pre-2018 family/iPhone/high-school photos: `Poze tata` (398), `poze_tata_iphone` (704), `chestii_liceu+documente_tata` (490), `cislau_tata` (91), `C PARTITION EDY PC\upload\` etc. Sort by EXIF date into `G:\Poze\<year>\`. ~4,070 NEW photos. |
| `G:\backup media telefon\` | 5,756 | 5,754 | 5,754 | 2021-12-12 → 2026-01-27 | **duplicate of Poze (phone backup)** | **No action — deletion candidate.** 100% basename overlap with Poze. Already imported. Verify content-hash before deleting; if confirmed dup → trash whole folder. |
| `G:\Steam\` | 13,289 | 6,707 | 2 | n/a (game UI assets) | app/game assets | **No action — keep in place.** Steam install + controller_base/appcache icons. Not photos. |
| `G:\Huawei themes\` | 1,363 | 1,363 | 0 | 2013-03-04 → 2019-10-25 (file mtimes, not real EXIF) | wallpaper assets | **No action.** Magazine-unlock wallpapers from old Huawei phone, hash-named, not personal photos. |
| `G:\XAMPP\` | 8,386 | 1,306 | 15 | n/a | app assets | **No action.** phpMyAdmin/Mercury icons. Not photos. |
| `G:\Archive\` | 9,063 | 1,469 | 80 | 2020-09-12 only (sampled) | course assets / screenshots | **No action — already in catalog scope.** 786 in `Courses\`, 480 in `VIA_UCL\`, 137 in `_from_E_2026-04-15_0116\` (April recovery dump — worth a future thin-trip check). Not personal photos. |
| `G:\Windows Kits\` | 8,155 | 140 | 9 | n/a | SDK app icons | **No action.** Default app images shipped with Windows SDK. |
| `G:\University\` | 1,800 | 76 | 48 | 2023-01-25 → 2023-08-10 | mostly duplicate of Poze | **Low priority.** ~28 NEW; mostly course screenshots / installer assets — manual triage if anything. |
| `G:\AU-MSC\` | 1,674 | 239 | 16 | 2023-02-08 only (sampled) | screenshots | **No action.** Master's lecture slides/diagrams (PNGs of TOC, CRT, Kant maxims, exam formats). Not personal photos. |
| `G:\ApacheTomcat\` | 243 | 6 | 0 | n/a | app assets | No action. Tomcat ROOT bg-*.png. |
| `G:\Heroku\` | 4,937 | 2 | 0 | n/a | dev (`node_modules`) | No action. |
| `G:\SteamLibrary\` | 3,788 | 11 | 1 | n/a | game assets | No action. EU4/HoI4 launcher graphics. |
| All other 41 folders | varies | 0 | 0 | — | dev tools / IDEs / drivers / no photos | No action. |

## Total NEW photos discovered (outside Poze + Whatsapp + not duplicated)

| Bucket | NEW photos (approx.) |
| --- | ---:|
| `G:\Video\WhatsApp_Images\` | ~8,177 (10,486 − 2,309 already in `Poze\WhatsApp-by-year\`) |
| `G:\WD_EXT_HDD\` | ~4,073 (4,077 − 4 dup) |
| `G:\Archive\_from_E_2026-04-15_0116\` (subset) | ~135 (manual triage required — most are screenshots) |
| `G:\University\` | ~28 |
| `G:\AU-MSC\` | ~223 (course slides — likely NOT personal) |
| **Net personal-photo candidates** | **~12,250** (Video WhatsApp + WD_EXT_HDD) |
| Asset/screenshot noise excluded from the merge calculus | ~9,800 (Steam + XAMPP + Huawei themes + Windows Kits + course PNGs) |

## Top 5 candidates for merging into `G:\Poze\<year>\`

1. **`G:\Video\WhatsApp_Images\WhatsApp Images\`** — ~8,177 NEW WhatsApp images from `Private\` and `Sent\`. Filenames are date-stamped (`IMG-YYYYMMDD-WAxxxx.jpg`), trivial to bucket into `G:\Poze\WhatsApp-by-year\<year>\`.
2. **`G:\WD_EXT_HDD\C PARTITION EDY PC\Poze tata\`** — 398 family photos from dad's old PC.
3. **`G:\WD_EXT_HDD\WD_EXT_HDD\Main\Asus_Laptop (De sortat)\poze_tata_iphone\`** — 704 iPhone-era photos with EXIF GPS already (sampled GPS hit: 45°22′ N, 25°32′ E — Prahova/Brașov area). Sort by EXIF date.
4. **`G:\WD_EXT_HDD\chestii_liceu+documente_tata\`** subset — ~490 with high-school-era photos in `POZE TATA`, `Poze jacobs`, `Poze Jacobs X2`, `All in all\POZE ROMANA`.
5. **`G:\WD_EXT_HDD\C PARTITION EDY PC\upload\`** — ~700+ uncategorized JPGs already auto-numbered (e.g., `73.jpg`); EXIF-date-bucket and review for keepers.

## Caveats

- **Depth cap.** First-pass walker capped at depth 4. `WD_EXT_HDD` reported 2,225 photos under that cap; full recursion confirms 4,077 — i.e. ~1,850 photos sit at depth ≥ 5 (mostly under `WD_EXT_HDD\WD_EXT_HDD\Main\Asus_Laptop (De sortat)\…`). The deep-analysis script ran without the cap for the top-10 folders and the table above uses those numbers where available.
- **Duplicate detection is filename-only.** `IMG_20161029_011439.jpg` matching by basename is high-confidence (date-stamped, unique). Generic names (`73.jpg`, `screenshot.png`) could yield false dup matches. A content-hash pass is recommended before trashing `G:\backup media telefon\`.
- **Date range is sample-based** (50 files stratified by index). EXIF-less assets (e.g. `Huawei themes`, Steam assets) report `n/a`. WD_EXT_HDD shows 2016–2017 from the sample but the legacy folders very likely span 2008–2018 — full extraction needed before bucketing.
- **Recovery folder `G:\Archive\_from_E_2026-04-15_0116\`** is the recent April recovery dump — overlaps with the 2026-04-15 thin-trip work that already happened. Treat its 137 photos as already covered by the existing reorg pipeline; do not double-process.
- **`G:\Video\WhatsApp_Images\`** is a separate, larger WhatsApp media archive than `G:\Whatsapp\` (audio-only). The current `G:\Poze\WhatsApp-by-year\` (2,312 photos) appears to be a partial export — Video has the full ~10,486-photo set including the missing 2024-2026 messages.

## Proposed actions (sign-off required)

| # | Action | Risk | Reversible? |
| --- | --- | --- | --- |
| 1 | **Merge `G:\Video\WhatsApp_Images\WhatsApp Images\` → `G:\Poze\WhatsApp-by-year\<year>\`** by parsing the `IMG-YYYYMMDD-WA####.jpg` date prefix. Skip files whose basename already exists in target year. | Low (date in filename) | Yes (move log) |
| 2 | **Bucket `G:\WD_EXT_HDD\` photos by EXIF DateTimeOriginal** into `G:\Poze\<year>\<source-folder-name>\`. Keep source-folder name as a subfolder so provenance is clear. EXIF-less files → `G:\Poze\.review-for-delete\WD_EXT_HDD-undated\`. | Medium (legacy material, family photos — manual sanity check on top-100 by year recommended) | Yes (move log) |
| 3 | **Content-hash verify `G:\backup media telefon\` against `G:\Poze\`**; on confirmation that ≥99% are byte-identical, trash the folder (with retention period). | Low | Yes (Recycle Bin) |
| 4 | **Leave alone:** Steam, SteamLibrary, XAMPP, Heroku, Windows Kits, ApacheTomcat, Huawei themes, AU-MSC, Archive, Wireshark, all dev/IDE folders. | n/a | n/a |
| 5 | **`G:\University\` triage** (76 photos, 48 dup) — manual review of the 28 new ones; most are likely installer screenshots. Defer until after #1 and #2. | Low | Yes |

Awaiting sign-off before any move.
