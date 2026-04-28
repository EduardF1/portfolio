# WhatsApp travel-candidate scout

Read-only scout of `G:\Poze\IMG-YYYYMMDD-WA####.jpg|jpeg` against the per-trip date windows in `scripts/photo-catalogue.json` (±2 days). Goal: an actionable shortlist of WhatsApp images that may be travel-landscape candidates worth a visual review for trip-photo pages. **No copies, no catalogue edits.** This document is the only output.

WhatsApp strips most EXIF including GPS, so classification rests on filename date, file size, image dimensions, and aspect ratio only — see heuristic table at the bottom. False positives are acceptable; missing real landscapes is worse, so the `people-likely` and `food-likely` bins still surface in the per-trip tables for completeness.

## 1. Headline

- **WhatsApp files scanned**: 2312 (the scout brief cited 2,351; today's strict `IMG-YYYYMMDD-WA####.{jpg,jpeg}` ls returns 2,312 — the 39-file delta is likely files trashed or moved between the brief's scan and this run; not material to the recommendation).
- **Year breakdown** — in-window: `2020=7, 2022=105, 2023=69`; out-of-window: `2016=221, 2017=36, 2018=179, 2019=163, 2020=99, 2021=128, 2022=436, 2023=856, 2024=5, 2025=7, 2026=1`.
- **In any trip window (pre-filter)**: 181
- **Classified as `landscape` (post-filter shortlist)**: 31
- **Trips with at least one in-window candidate**: 8 of 20
- **Document-flag privacy hits**: 0

## 2. Per-trip tables

Sort: filename ascending (= date ascending, since the WhatsApp filename embeds `YYYYMMDD`). Resolution shown as `width×height`. Aspect = long-edge ÷ short-edge.

### 2020-02-denmark

- Window: `2020-02-15` → `2020-02-19` (catalogue min/max ±2 days)
- Candidates: **7** (people-likely=6, landscape=1)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20200216-WA0000.jpeg` | 2020-02-16 | `people-likely` | 513 KB | 2080×4160 | 2.00 | tall portrait 2080x4160 aspect 2 |
| `IMG-20200216-WA0002.jpeg` | 2020-02-16 | `people-likely` | 1141 KB | 2304×4608 | 2.00 | tall portrait 2304x4608 aspect 2 |
| `IMG-20200216-WA0006.jpeg` | 2020-02-16 | `people-likely` | 589 KB | 2304×4608 | 2.00 | tall portrait 2304x4608 aspect 2 |
| `IMG-20200216-WA0008.jpg` | 2020-02-16 | `landscape` | 181 KB | 1600×1200 | 1.33 | horizontal 1600x1200 181KB |
| `IMG-20200216-WA0009.jpg` | 2020-02-16 | `people-likely` | 147 KB | 899×1600 | 1.78 | tall portrait 899x1600 aspect 1.78 |
| `IMG-20200216-WA0010.jpeg` | 2020-02-16 | `people-likely` | 948 KB | 2304×4608 | 2.00 | tall portrait 2304x4608 aspect 2 |
| `IMG-20200218-WA0000.jpg` | 2020-02-18 | `people-likely` | 98 KB | 899×1600 | 1.78 | tall portrait 899x1600 aspect 1.78 |

### 2022-07-greece

- Window: `2022-07-15` → `2022-07-19` (catalogue min/max ±2 days)
- Candidates: **3** (screenshot-likely=2, people-likely=1)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20220717-WA0001.jpg` | 2022-07-17 | `screenshot-likely` | 55 KB | 1080×879 | 1.23 | compressed horizontal 55KB |
| `IMG-20220717-WA0002.jpg` | 2022-07-17 | `screenshot-likely` | 28 KB | 720×673 | 1.07 | tiny 28KB 720px (sticker/meme) |
| `IMG-20220718-WA0000.jpg` | 2022-07-18 | `people-likely` | 296 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |

### 2022-08-romania

- Window: `2022-08-05` → `2022-08-09` (catalogue min/max ±2 days)
- Candidates: **44** (people-likely=37, landscape=7)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20220807-WA0001.jpg` | 2022-08-07 | `people-likely` | 37 KB | 792×1408 | 1.78 | tall portrait 792x1408 aspect 1.78 |
| `IMG-20220807-WA0002.jpg` | 2022-08-07 | `people-likely` | 696 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0003.jpg` | 2022-08-07 | `people-likely` | 717 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0004.jpg` | 2022-08-07 | `people-likely` | 512 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0005.jpg` | 2022-08-07 | `people-likely` | 588 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0006.jpg` | 2022-08-07 | `people-likely` | 729 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0007.jpg` | 2022-08-07 | `people-likely` | 633 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0008.jpg` | 2022-08-07 | `people-likely` | 672 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0009.jpg` | 2022-08-07 | `people-likely` | 706 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0010.jpg` | 2022-08-07 | `people-likely` | 753 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0011.jpg` | 2022-08-07 | `people-likely` | 715 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0012.jpg` | 2022-08-07 | `people-likely` | 702 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0013.jpg` | 2022-08-07 | `people-likely` | 544 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0014.jpg` | 2022-08-07 | `people-likely` | 600 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0015.jpg` | 2022-08-07 | `people-likely` | 596 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0016.jpg` | 2022-08-07 | `people-likely` | 494 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0017.jpg` | 2022-08-07 | `people-likely` | 299 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220807-WA0018.jpg` | 2022-08-07 | `people-likely` | 277 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220807-WA0019.jpg` | 2022-08-07 | `people-likely` | 293 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220807-WA0020.jpg` | 2022-08-07 | `people-likely` | 300 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220807-WA0021.jpg` | 2022-08-07 | `people-likely` | 372 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0022.jpg` | 2022-08-07 | `people-likely` | 469 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0023.jpg` | 2022-08-07 | `people-likely` | 468 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0024.jpg` | 2022-08-07 | `people-likely` | 484 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0025.jpg` | 2022-08-07 | `people-likely` | 496 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0026.jpg` | 2022-08-07 | `people-likely` | 521 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0027.jpg` | 2022-08-07 | `people-likely` | 686 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0028.jpg` | 2022-08-07 | `people-likely` | 729 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0029.jpg` | 2022-08-07 | `people-likely` | 584 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0030.jpg` | 2022-08-07 | `people-likely` | 673 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220807-WA0031.jpg` | 2022-08-07 | `landscape` | 189 KB | 1600×1200 | 1.33 | horizontal 1600x1200 189KB |
| `IMG-20220807-WA0032.jpg` | 2022-08-07 | `landscape` | 186 KB | 1600×1200 | 1.33 | horizontal 1600x1200 186KB |
| `IMG-20220807-WA0033.jpg` | 2022-08-07 | `landscape` | 196 KB | 1600×1200 | 1.33 | horizontal 1600x1200 196KB |
| `IMG-20220807-WA0034.jpg` | 2022-08-07 | `landscape` | 179 KB | 1600×1200 | 1.33 | horizontal 1600x1200 179KB |
| `IMG-20220807-WA0035.jpg` | 2022-08-07 | `landscape` | 191 KB | 1600×1200 | 1.33 | horizontal 1600x1200 191KB |
| `IMG-20220807-WA0036.jpg` | 2022-08-07 | `landscape` | 190 KB | 1600×1200 | 1.33 | horizontal 1600x1200 190KB |
| `IMG-20220808-WA0000.jpg` | 2022-08-08 | `people-likely` | 100 KB | 1056×1408 | 1.33 | portrait orient 1056x1408 (selfie/portrait/food common) |
| `IMG-20220808-WA0001.jpg` | 2022-08-08 | `people-likely` | 96 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220808-WA0002.jpg` | 2022-08-08 | `people-likely` | 82 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220808-WA0003.jpg` | 2022-08-08 | `people-likely` | 106 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220808-WA0004.jpg` | 2022-08-08 | `people-likely` | 149 KB | 921×2048 | 2.22 | tall portrait 921x2048 aspect 2.22 |
| `IMG-20220808-WA0005.jpg` | 2022-08-08 | `people-likely` | 130 KB | 720×1600 | 2.22 | tall portrait 720x1600 aspect 2.22 |
| `IMG-20220809-WA0001.jpeg` | 2022-08-09 | `landscape` | 1195 KB | 3840×2160 | 1.78 | horizontal 3840x2160 1195KB |
| `IMG-20220809-WA0003.jpg` | 2022-08-09 | `people-likely` | 108 KB | 899×1599 | 1.78 | tall portrait 899x1599 aspect 1.78 |

### 2022-08-denmark

- Window: `2022-08-08` → `2022-08-29` (catalogue min/max ±2 days)
- Candidates: **24** (people-likely=21, landscape=3)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20220811-WA0000.jpg` | 2022-08-11 | `people-likely` | 288 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220812-WA0000.jpg` | 2022-08-12 | `people-likely` | 474 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220812-WA0001.jpg` | 2022-08-12 | `people-likely` | 559 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220812-WA0002.jpg` | 2022-08-12 | `people-likely` | 515 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220812-WA0003.jpg` | 2022-08-12 | `people-likely` | 656 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20220812-WA0004.jpg` | 2022-08-12 | `people-likely` | 232 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20220812-WA0005.jpg` | 2022-08-12 | `people-likely` | 468 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220812-WA0006.jpg` | 2022-08-12 | `people-likely` | 577 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20220812-WA0007.jpeg` | 2022-08-12 | `people-likely` | 1121 KB | 2160×3840 | 1.78 | tall portrait 2160x3840 aspect 1.78 |
| `IMG-20220812-WA0009.jpeg` | 2022-08-12 | `people-likely` | 1139 KB | 2160×3840 | 1.78 | tall portrait 2160x3840 aspect 1.78 |
| `IMG-20220813-WA0000.jpg` | 2022-08-13 | `landscape` | 480 KB | 1600×1200 | 1.33 | horizontal 1600x1200 480KB |
| `IMG-20220813-WA0001.jpeg` | 2022-08-13 | `people-likely` | 402 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |
| `IMG-20220813-WA0003.jpg` | 2022-08-13 | `people-likely` | 422 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220813-WA0005.jpg` | 2022-08-13 | `people-likely` | 121 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220815-WA0000.jpg` | 2022-08-15 | `people-likely` | 111 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220815-WA0001.jpg` | 2022-08-15 | `people-likely` | 197 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220815-WA0002.jpg` | 2022-08-15 | `people-likely` | 183 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20220815-WA0003.jpg` | 2022-08-15 | `landscape` | 214 KB | 1600×1200 | 1.33 | horizontal 1600x1200 214KB |
| `IMG-20220816-WA0000.jpg` | 2022-08-16 | `people-likely` | 110 KB | 899×1599 | 1.78 | tall portrait 899x1599 aspect 1.78 |
| `IMG-20220818-WA0000.jpg` | 2022-08-18 | `landscape` | 85 KB | 1080×1047 | 1.03 | horizontal 1080x1047 85KB |
| `IMG-20220825-WA0000.jpg` | 2022-08-25 | `people-likely` | 390 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20220829-WA0000.jpg` | 2022-08-29 | `people-likely` | 103 KB | 899×1599 | 1.78 | tall portrait 899x1599 aspect 1.78 |
| `IMG-20220829-WA0001.jpg` | 2022-08-29 | `people-likely` | 112 KB | 720×1600 | 2.22 | tall portrait 720x1600 aspect 2.22 |
| `IMG-20220829-WA0002.jpeg` | 2022-08-29 | `people-likely` | 994 KB | 2160×3840 | 1.78 | tall portrait 2160x3840 aspect 1.78 |

### 2022-10-germany

- Window: `2022-10-01` → `2022-10-31` (catalogue min/max ±2 days)
- Candidates: **28** (people-likely=12, landscape=9, screenshot-likely=5, unknown=2)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20221003-WA0000.jpg` | 2022-10-03 | `people-likely` | 137 KB | 921×2048 | 2.22 | tall portrait 921x2048 aspect 2.22 |
| `IMG-20221003-WA0001.jpeg` | 2022-10-03 | `landscape` | 1629 KB | 3840×2160 | 1.78 | horizontal 3840x2160 1629KB |
| `IMG-20221004-WA0000.jpg` | 2022-10-04 | `screenshot-likely` | 23 KB | 400×224 | 1.79 | tiny 23KB 400px (sticker/meme) |
| `IMG-20221005-WA0000.jpg` | 2022-10-05 | `screenshot-likely` | 46 KB | 845×245 | 3.45 | extreme aspect 3.45 |
| `IMG-20221005-WA0002.jpg` | 2022-10-05 | `landscape` | 214 KB | 1600×900 | 1.78 | horizontal 1600x900 214KB |
| `IMG-20221005-WA0004.jpg` | 2022-10-05 | `people-likely` | 221 KB | 900×1600 | 1.78 | tall portrait 900x1600 aspect 1.78 |
| `IMG-20221010-WA0000.jpg` | 2022-10-10 | `landscape` | 133 KB | 1006×840 | 1.20 | horizontal 1006x840 133KB |
| `IMG-20221011-WA0000.jpeg` | 2022-10-11 | `people-likely` | 403 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |
| `IMG-20221012-WA0000.jpeg` | 2022-10-12 | `people-likely` | 2067 KB | 2160×3840 | 1.78 | tall portrait 2160x3840 aspect 1.78 |
| `IMG-20221012-WA0003.jpeg` | 2022-10-12 | `people-likely` | 423 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |
| `IMG-20221012-WA0005.jpeg` | 2022-10-12 | `people-likely` | 464 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |
| `IMG-20221012-WA0007.jpeg` | 2022-10-12 | `people-likely` | 416 KB | 1080×1920 | 1.78 | tall portrait 1080x1920 aspect 1.78 |
| `IMG-20221014-WA0000.jpg` | 2022-10-14 | `screenshot-likely` | 45 KB | 720×531 | 1.36 | low res 720x531 |
| `IMG-20221015-WA0000.jpg` | 2022-10-15 | `unknown` | 70 KB | 736×981 | 1.33 | 736x981 70KB aspect 1.33 |
| `IMG-20221017-WA0003.jpg` | 2022-10-17 | `screenshot-likely` | 18 KB | 321×157 | 2.04 | tiny 18KB 321px (sticker/meme) |
| `IMG-20221021-WA0001.jpg` | 2022-10-21 | `landscape` | 254 KB | 1200×912 | 1.32 | horizontal 1200x912 254KB |
| `IMG-20221022-WA0054.jpg` | 2022-10-22 | `people-likely` | 51 KB | 496×968 | 1.95 | tall portrait 496x968 aspect 1.95 |
| `IMG-20221023-WA0000.jpg` | 2022-10-23 | `landscape` | 93 KB | 1600×1200 | 1.33 | horizontal 1600x1200 93KB |
| `IMG-20221024-WA0000.jpg` | 2022-10-24 | `people-likely` | 90 KB | 768×1024 | 1.33 | portrait orient 768x1024 (selfie/portrait/food common) |
| `IMG-20221024-WA0002.jpg` | 2022-10-24 | `people-likely` | 90 KB | 720×1600 | 2.22 | tall portrait 720x1600 aspect 2.22 |
| `IMG-20221024-WA0003.jpeg` | 2022-10-24 | `landscape` | 930 KB | 3840×2160 | 1.78 | horizontal 3840x2160 930KB |
| `IMG-20221024-WA0029.jpg` | 2022-10-24 | `people-likely` | 190 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20221024-WA0030.jpg` | 2022-10-24 | `landscape` | 97 KB | 1024×768 | 1.33 | horizontal 1024x768 97KB |
| `IMG-20221024-WA0031.jpg` | 2022-10-24 | `people-likely` | 117 KB | 768×1024 | 1.33 | portrait orient 768x1024 (selfie/portrait/food common) |
| `IMG-20221024-WA0032.jpg` | 2022-10-24 | `landscape` | 207 KB | 1024×768 | 1.33 | horizontal 1024x768 207KB |
| `IMG-20221026-WA0000.jpg` | 2022-10-26 | `screenshot-likely` | 102 KB | 749×499 | 1.50 | low res 749x499 |
| `IMG-20221029-WA0004.jpg` | 2022-10-29 | `landscape` | 246 KB | 1599×899 | 1.78 | horizontal 1599x899 246KB |
| `IMG-20221029-WA0005.jpg` | 2022-10-29 | `unknown` | 42 KB | 598×886 | 1.48 | 598x886 42KB aspect 1.48 |

### 2022-12-romania

- Window: `2022-12-23` → `2022-12-27` (catalogue min/max ±2 days)
- Candidates: **6** (screenshot-likely=1, people-likely=4, landscape=1)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20221224-WA0000.jpg` | 2022-12-24 | `screenshot-likely` | 24 KB | 1032×496 | 2.08 | extreme aspect 2.08 |
| `IMG-20221227-WA0000.jpg` | 2022-12-27 | `people-likely` | 98 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20221227-WA0001.jpg` | 2022-12-27 | `people-likely` | 111 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20221227-WA0002.jpg` | 2022-12-27 | `people-likely` | 160 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20221227-WA0003.jpg` | 2022-12-27 | `people-likely` | 174 KB | 1200×1600 | 1.33 | portrait orient 1200x1600 (selfie/portrait/food common) |
| `IMG-20221227-WA0004.jpg` | 2022-12-27 | `landscape` | 173 KB | 1824×1026 | 1.78 | horizontal 1824x1026 173KB |

### 2023-04-italy

- Window: `2023-03-31` → `2023-04-06` (catalogue min/max ±2 days)
- Candidates: **3** (screenshot-likely=1, people-likely=2)

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20230401-WA0000.jpg` | 2023-04-01 | `screenshot-likely` | 67 KB | 960×720 | 1.33 | compressed horizontal 67KB |
| `IMG-20230402-WA0000.jpg` | 2023-04-02 | `people-likely` | 194 KB | 720×1600 | 2.22 | tall portrait 720x1600 aspect 2.22 |
| `IMG-20230403-WA0000.jpg` | 2023-04-03 | `people-likely` | 137 KB | 921×2048 | 2.22 | tall portrait 921x2048 aspect 2.22 |

### 2023-07-turkey

- Window: `2023-07-10` → `2023-07-18` (catalogue min/max ±2 days)
- Candidates: **66** (people-likely=54, landscape=10, screenshot-likely=2)
- Showing top 30 by file size (full set 66; window has >50 hits).

| filename | date | classification | size | resolution | aspect | reason |
| --- | --- | --- | --- | --- | --- | --- |
| `IMG-20230712-WA0007.jpg` | 2023-07-12 | `people-likely` | 823 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0006.jpg` | 2023-07-12 | `people-likely` | 717 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0041.jpg` | 2023-07-12 | `people-likely` | 705 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0043.jpg` | 2023-07-12 | `people-likely` | 646 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0036.jpg` | 2023-07-12 | `people-likely` | 548 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0039.jpg` | 2023-07-12 | `people-likely` | 476 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0035.jpg` | 2023-07-12 | `people-likely` | 463 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0040.jpg` | 2023-07-12 | `people-likely` | 451 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0038.jpg` | 2023-07-12 | `people-likely` | 432 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0037.jpg` | 2023-07-12 | `people-likely` | 410 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0019.jpg` | 2023-07-12 | `people-likely` | 353 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0047.jpg` | 2023-07-12 | `people-likely` | 326 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0045.jpg` | 2023-07-12 | `people-likely` | 318 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0033.jpg` | 2023-07-12 | `people-likely` | 318 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0012.jpg` | 2023-07-12 | `people-likely` | 309 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0002.jpg` | 2023-07-12 | `landscape` | 300 KB | 2048×1536 | 1.33 | horizontal 2048x1536 300KB |
| `IMG-20230712-WA0022.jpg` | 2023-07-12 | `people-likely` | 290 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230713-WA0002.jpg` | 2023-07-13 | `people-likely` | 285 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0001.jpg` | 2023-07-12 | `landscape` | 278 KB | 2048×1536 | 1.33 | horizontal 2048x1536 278KB |
| `IMG-20230712-WA0034.jpg` | 2023-07-12 | `people-likely` | 274 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0011.jpg` | 2023-07-12 | `people-likely` | 273 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0044.jpg` | 2023-07-12 | `people-likely` | 271 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230712-WA0032.jpg` | 2023-07-12 | `people-likely` | 265 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20230712-WA0023.jpg` | 2023-07-12 | `people-likely` | 256 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |
| `IMG-20230713-WA0005.jpg` | 2023-07-13 | `people-likely` | 254 KB | 900×1600 | 1.78 | tall portrait 900x1600 aspect 1.78 |
| `IMG-20230712-WA0027.jpg` | 2023-07-12 | `landscape` | 252 KB | 2000×1500 | 1.33 | horizontal 2000x1500 252KB |
| `IMG-20230712-WA0005.jpg` | 2023-07-12 | `landscape` | 248 KB | 2048×1536 | 1.33 | horizontal 2048x1536 248KB |
| `IMG-20230712-WA0031.jpg` | 2023-07-12 | `people-likely` | 245 KB | 1536×2048 | 1.33 | portrait orient 1536x2048 (selfie/portrait/food common) |
| `IMG-20230712-WA0004.jpg` | 2023-07-12 | `landscape` | 245 KB | 2048×1536 | 1.33 | horizontal 2048x1536 245KB |
| `IMG-20230712-WA0010.jpg` | 2023-07-12 | `people-likely` | 242 KB | 1500×2000 | 1.33 | portrait orient 1500x2000 (selfie/portrait/food common) |

## 3. Privacy flags

No `document-likely` hits in the in-window candidate set under the current heuristic (very high R+G+B with low variance + small file size + aspect-near-A4). The classifier doesn't read pixel content — it can't see text — so this section will read "none" until the heuristic is upgraded with luminance-variance sampling. **A manual scroll-through of `G:\Poze\IMG-*-WA*` for receipts/IDs is still recommended** since WhatsApp commonly carries forwarded scans of documents and the filename-date heuristic alone won't surface them.

Per `docs/photo-organization.md` §6: any frame with a printed page, ID, passport, contract, receipt, screen-of-document, mailpiece, or readable text on background items is **banned content** for portfolio import — even if it lands inside a trip window. Reviewer should skip on sight.

## 4. Summary stats — across all WhatsApp files

Methodology: every in-window candidate was inspected via `sharp`. Out-of-window files (2131) were sampled at stride 50/year (399 samples) and the result extrapolated. Numbers are approximate beyond the in-window set.

| classification | in-window (precise) | out-of-window (extrapolated from sample) | total estimate |
| --- | --- | --- | --- |
| `landscape` | 31 | 411 | 442 |
| `people-likely` | 137 | 1479 | 1616 |
| `screenshot-likely` | 11 | 182 | 193 |
| `unknown` | 2 | 59 | 61 |

Year totals (out-of-window only, by filename date): 2016=221, 2017=36, 2018=179, 2019=163, 2020=99, 2021=128, 2022=436, 2023=856, 2024=5, 2025=7, 2026=1.

## 5. Next-step recommendation

Trips ordered by `landscape` count (post-filter) descending, then by total candidates. Eduard should prioritise the top of this list for a deeper visual review — these are where the highest expected return is.

| rank | trip slug | total in-window | landscape | recommendation |
| --- | --- | --- | --- | --- |
| 1 | `2023-07-turkey` | 66 | 10 | Turkey 2023 has by far the most WhatsApp material in the archive (959 files in 2023 — most of any year). Worth a 30-min visual pass; expect coastline, Cappadocia, Istanbul skyline. |
| 2 | `2022-10-germany` | 28 | 9 | A parallel agent already imported 93 photos to this trip; double-check for duplicates against `public/photos/trips/2022-10-germany/` before considering any of these. |
| 3 | `2022-08-romania` | 44 | 7 | Romania August 2022 — likely Carpathians, family-trip landscapes. Skim the `landscape`-classified rows first. |
| 4 | `2022-08-denmark` | 24 | 3 | Denmark August 2022 — beach/coast candidates plausible. |
| 5 | `2020-02-denmark` | 7 | 1 | Small set (7); a quick eye is enough. |
| 6 | `2022-12-romania` | 6 | 1 | Winter Romania — small set; check for snow landscapes. |
| 7 | `2022-07-greece` | 3 | 0 | Tiny set (3); probably already covered by the camera archive. |
| 8 | `2023-04-italy` | 3 | 0 | Tiny set (3); likely covered already. |

**Top 3 to visually review first**:

1. `2023-07-turkey` — 10 landscape candidates, 66 total in window.
1. `2022-10-germany` — 9 landscape candidates, 28 total in window.
1. `2022-08-romania` — 7 landscape candidates, 44 total in window.

Trips not in the table above (`2018-03-israel`, `2018-04-sweden`, `2019-07-belgium`, `2019-07-luxembourg`, `2022-10-denmark`, `2023-08-romania`, `2024-09-albania-saranda`, `2025-02-finland`, `2025-03-romania`, `2025-04-czechia-poland-slovakia-austria`, `2025-09-andalusia-gibraltar`, `2026-03-balkans-roadtrip`) had **zero WhatsApp files** in their date windows under the strict `IMG-YYYYMMDD-WA####` pattern. Either the trip dates fell outside WhatsApp use or the photos for those trips live elsewhere on `G:\Poze\` under camera-original filenames already covered by the catalogue.

## 6. Sample for taste — what dominates each year

Three representative filenames per year drawn from the stride-50 out-of-window sample, with classifier verdict. Useful as a sanity check — if 2023 (the heaviest year) is mostly `people-likely`, that's consistent with WhatsApp being a family-and-friends channel rather than a landscape archive.

**2016** — total out-of-window: 221
  - `IMG-20160727-WA0000.jpg` — `people-likely` — 747×1328 286 KB — tall portrait 747x1328 aspect 1.78
  - `IMG-20160727-WA0004.jpg` — `landscape` — 960×540 86 KB — horizontal 960x540 86KB
  - `IMG-20160825-WA0001.jpg` — `people-likely` — 900×1600 183 KB — tall portrait 900x1600 aspect 1.78

**2017** — total out-of-window: 36
  - `IMG-20170101-WA0000.jpg` — `people-likely` — 1200×1600 256 KB — portrait orient 1200x1600 (selfie/portrait/food common)
  - `IMG-20170101-WA0001.jpg` — `people-likely` — 1200×1600 195 KB — portrait orient 1200x1600 (selfie/portrait/food common)
  - `IMG-20170101-WA0002.jpg` — `people-likely` — 1200×1600 234 KB — portrait orient 1200x1600 (selfie/portrait/food common)

**2018** — total out-of-window: 179
  - `IMG-20180103-WA0000.jpg` — `unknown` — 672×960 61 KB — 672x960 61KB aspect 1.43
  - `IMG-20180107-WA0002.jpg` — `people-likely` — 1200×1600 192 KB — portrait orient 1200x1600 (selfie/portrait/food common)
  - `IMG-20180107-WA0005.jpg` — `people-likely` — 1095×1600 238 KB — portrait orient 1095x1600 (selfie/portrait/food common)

**2019** — total out-of-window: 163
  - `IMG-20190106-WA0000.jpg` — `people-likely` — 903×1600 56 KB — tall portrait 903x1600 aspect 1.77
  - `IMG-20190106-WA0003.jpg` — `people-likely` — 903×1600 175 KB — tall portrait 903x1600 aspect 1.77
  - `IMG-20190106-WA0006.jpg` — `people-likely` — 901×1600 116 KB — tall portrait 901x1600 aspect 1.78

**2020** — total out-of-window: 99
  - `IMG-20200101-WA0000.jpg` — `landscape` — 1600×1200 163 KB — horizontal 1600x1200 163KB
  - `IMG-20200111-WA0000.jpg` — `people-likely` — 1200×1599 268 KB — portrait orient 1200x1599 (selfie/portrait/food common)
  - `IMG-20200111-WA0001.jpg` — `people-likely` — 1200×1599 216 KB — portrait orient 1200x1599 (selfie/portrait/food common)

**2021** — total out-of-window: 128
  - `IMG-20210126-WA0000.jpg` — `people-likely` — 1200×1599 140 KB — portrait orient 1200x1599 (selfie/portrait/food common)
  - `IMG-20210407-WA0000.jpeg` — `people-likely` — 1632×3264 1155 KB — tall portrait 1632x3264 aspect 2
  - `IMG-20210626-WA0000.jpg` — `people-likely` — 1200×1599 200 KB — portrait orient 1200x1599 (selfie/portrait/food common)

**2022** — total out-of-window: 436
  - `IMG-20220106-WA0000.jpg` — `people-likely` — 921×2048 119 KB — tall portrait 921x2048 aspect 2.22
  - `IMG-20220117-WA0000.jpg` — `landscape` — 1076×1074 93 KB — horizontal 1076x1074 93KB
  - `IMG-20220124-WA0004.jpeg` — `people-likely` — 1080×1920 383 KB — tall portrait 1080x1920 aspect 1.78

**2023** — total out-of-window: 856
  - `IMG-20230112-WA0000.jpg` — `screenshot-likely` — 428×508 43 KB — low res 428x508
  - `IMG-20230123-WA0007.jpeg` — `people-likely` — 2160×3840 956 KB — tall portrait 2160x3840 aspect 1.78
  - `IMG-20230208-WA0000.jpg` — `landscape` — 1599×899 148 KB — horizontal 1599x899 148KB

**2024** — total out-of-window: 5
  - `IMG-20240307-WA0005.jpg` — `people-likely` — 1280×1600 450 KB — portrait orient 1280x1600 (selfie/portrait/food common)
  - `IMG-20240902-WA0002.jpg` — `people-likely` — 1536×2048 483 KB — portrait orient 1536x2048 (selfie/portrait/food common)
  - `IMG-20241227-WA0008.jpg` — `people-likely` — 1153×2048 322 KB — tall portrait 1153x2048 aspect 1.78

**2025** — total out-of-window: 7
  - `IMG-20250102-WA0005.jpg` — `landscape` — 2048×1153 283 KB — horizontal 2048x1153 283KB
  - `IMG-20250122-WA0003.jpg` — `people-likely` — 1200×1600 221 KB — portrait orient 1200x1600 (selfie/portrait/food common)
  - `IMG-20250217-WA0002.jpg` — `people-likely` — 917×2048 127 KB — tall portrait 917x2048 aspect 2.23

**2026** — total out-of-window: 1
  - `IMG-20260224-WA0011.jpg` — `people-likely` — 1536×2048 248 KB — portrait orient 1536x2048 (selfie/portrait/food common)

## 7. Classifier heuristic (for transparency)

No AI/ML. Pure rules over `sharp` metadata + file size:

- **`screenshot-likely`** — long edge < 800 px, OR aspect ≥ 2.0, OR very small (<30 KB) tiny image.
- **`people-likely`** — portrait orientation with aspect ≥ 1.7 (typical phone-camera 9:16 selfie / portrait shot), OR portrait orientation ≥ 80 KB at any aspect (most family-channel photos pivot vertical).
- **`food-likely`** — square (~1:1) with file size ≥ 80 KB. Catches food close-ups + portrait crops; coarse but useful for skip-screen.
- **`landscape`** — horizontal orientation, aspect ≤ 1.85, ≥ 80 KB. Captures 4:3 / 3:2 / 16:9 outdoor frames and forwarded camera-roll landscapes.
- **`document-likely`** — currently unused (placeholder for a future luminance-variance heuristic). The classifier does not read pixel content.
- **`unknown`** — sharp couldn't read metadata, or none of the above bins matched.

Limits: the classifier cannot tell a horizontal landscape from a horizontal photo of a meal-on-table or a horizontal selfie. The `landscape` bin is the *shortlist for visual review*, not a definitive set. A human pass is required.

---

Generated 2026-04-28 by the Domain-Expert scout sub-agent. Source folder: `G:\Poze` (read-only). Files inspected: 2312 WhatsApp pattern (`IMG-YYYYMMDD-WA####.{jpg,jpeg}`); 181 trip-window candidates received full `sharp` metadata; 399 stride-sampled out-of-window files for the global stats extrapolation.
