# Thin-trip audit — 2026-04-29

## 2026-04-28 — wider-window backfill (PR feat/thin-trip-wider-scan)

After PR #73's narrow ±2-day / ±0.5° window left `2020-02-denmark` at 3 own-camera
candidates plus 2 stocks, this pass widened the search to ±30 days / ±3° GPS
(plus country bbox fallback for trips with sparse GPS) and re-scanned all of
`G:\Poze\<year>\` recursively (47 cluster folders for 2018 alone). Result:
22 fresh GPS-bearing candidates inside the wider Denmark window, 10 passing
the YOLO + MediaPipe + CLIP gate, **7 imported** via temporal even-spread.

| Trip | Own-camera before | Own-camera after | Pexels stocks (added by sibling PR #78) | Total after |
|---|---:|---:|---:|---:|
| `2020-02-denmark` | 1 | 8 | 7 | 15 |

After the rebase against `origin/main`, the Pexels-apply sibling agent (PR #78)
had already added 5 more `pexels-horsens-…` stocks to the trip, so the final
`2020-02-denmark` total is 15 (8 own-camera + 7 stocks). Every trip is now
comfortably ≥5.

Other trips were already at ≥5 and per the PR brief constraint `If a trip is
already at ≥5, leave it alone`, were not regrown — even though the wider window
revealed many more candidates (e.g. 197 Denmark Oct candidates, 230 Italy Apr
candidates) that future targeted regrowth could draw from.

---


After the Round-58 people-removal sweep + non-artistic CLIP filter, several
trip galleries fell below the 5-photo target. This audit lists every trip slug
under `public/photos/trips/`, its current `scripts/photo-catalogue.json` entry
count, the 5-photo target, and the gap to fill.

| Trip slug | Current count | Target | Gap |
|---|---:|---:|---:|
| `2018-03-israel` | 2 | 5 | -3 |
| `2018-04-sweden` | 5 | 5 | OK |
| `2019-07-belgium` | 4 | 5 | -1 |
| `2019-07-luxembourg` | 4 | 5 | -1 |
| `2020-02-denmark` | 2 | 5 | -3 |
| `2022-07-greece` | 15 | 5 | OK |
| `2022-08-denmark` | 4 | 5 | -1 |
| `2022-08-romania` | 5 | 5 | OK |
| `2022-10-denmark` | 5 | 5 | OK |
| `2022-10-germany` | 36 | 5 | OK |
| `2022-12-romania` | 4 | 5 | -1 |
| `2023-04-italy` | 4 | 5 | -1 |
| `2023-07-turkey` | 4 | 5 | -1 |
| `2023-08-romania` | 5 | 5 | OK |
| `2024-09-albania-saranda` | 5 | 5 | OK |
| `2025-02-finland` | 5 | 5 | OK |
| `2025-03-romania` | 4 | 5 | -1 |
| `2025-04-czechia-poland-slovakia-austria` | 65 | 5 | OK |
| `2025-09-andalusia-gibraltar` | 10 | 5 | OK |
| `2026-03-balkans-roadtrip` | 34 | 5 | OK |

## Thin trips (gap > 0)

Nine trips need backfill:

| Trip | Need | Backfill plan |
|---|---:|---|
| `2018-03-israel` | 3 | Camera archive (`G:\Poze\2018\IMG_2018032*.jpg`) |
| `2019-07-belgium` | 1 | Camera archive (`G:\Poze\2019\IMG_2019072[789]*.jpg`) |
| `2019-07-luxembourg` | 1 | Camera archive (`G:\Poze\2019\IMG_20190730*.jpg` — Luxembourg-bbox) |
| `2020-02-denmark` | 3 | Camera archive (`G:\Poze\2020\IMG_202002*.jpg`) |
| `2022-08-denmark` | 1 | Camera archive (`G:\Poze\2022\IMG_2022081*.jpg`) |
| `2022-12-romania` | 1 | Camera archive (`G:\Poze\2022\IMG_2022122[3-7]*.jpg`) |
| `2023-04-italy` | 1 | Camera archive (`G:\Poze\2023\IMG_2023040[1-5]*.jpg`) |
| `2023-07-turkey` | 1 | Camera archive (`G:\Poze\2023\IMG_2023071[0-7]*.jpg`) |
| `2025-03-romania` | 1 | Camera archive (`G:\Poze\2025\IMG2025033*.jpg`) |

## Result (after own-archive backfill, this PR)

| Trip | Before | After | Hit ≥5? |
|---|---:|---:|:-:|
| `2018-03-israel` | 2 | 5 | yes |
| `2019-07-belgium` | 4 | 5 | yes |
| `2019-07-luxembourg` | 4 | 5 | yes |
| `2020-02-denmark` | 2 | 3 | no — **2 short, stocks needed** |
| `2022-08-denmark` | 4 | 5 | yes |
| `2022-12-romania` | 4 | 5 | yes |
| `2023-04-italy` | 4 | 5 | yes |
| `2023-07-turkey` | 4 | 5 | yes |
| `2025-03-romania` | 4 | 5 | yes |

The 2020-02-denmark gap is real: most candidates in the date+GPS window are
documents/receipts/winter-evening interior shots that fail the CLIP
non-artistic guard or have YOLO-detected people. One artistic-interior frame
passed all gates and was imported; the remaining 2 slots should come from
Pexels stocks (sibling agent owns `docs/thin-trip-pexels-candidates.md`).

## Methodology

For each thin trip:

1. Compute date window from existing catalogue `takenAt` ± 2 days.
2. Compute GPS bbox from existing catalogue GPS ± 0.5° (when available).
3. Scan `G:\Poze\` (year subfolders + `Poze Huawei`) using EXIF dump
   `scripts/.gposze-full-exif.ndjson` (36k entries, all years 2016–2026).
4. Drop files already in `scripts/.removed-non-artistic/<slug>/`.
5. Drop files already in the catalogue.
6. Cluster-dedupe near-time near-GPS (60s window, same 4-decimal GPS).
7. Sample 12 (or 15 for 3-gap trips) temporally diverse candidates per trip.
8. Run unified detector (`scripts/thin-trip-detect.py`):
   - YOLO11n person (conf 0.35) — drop if person.
   - YOLO11n cat/dog (conf 0.35) — drop if pet.
   - MediaPipe BlazeFace full-range (conf 0.4, area 0.001) — drop if face.
   - CLIP ViT-B-32 zero-shot (threshold 0.18) — drop if non-artistic
     (gas pump / parking / receipt / mundane interior / etc.) wins.
9. Pick cleanest candidates (zero detections), import top N to bring trip to 5.

See `docs/thin-trip-backfill-candidates.md` for the per-trip candidate detail
sheet with detection scores and sign-off checkboxes.
