# Personal + Pisa rules sweep

Applied the same three artistic-portfolio rules used on `public/photos/trips/`
to the remaining hero locations:

- 8 photos under `public/photos/personal/` (referenced from
  `src/app/[locale]/personal/page.tsx`).
- 3 legacy sample-trip photos under `public/travel/pisa/`.

## Pipeline

`scripts/personal-pisa-scan.py` — single Python script run inside
`scripts/.inpaint-venv/`. Per photo it runs:

1. **YOLO11n** detection (Ultralytics, COCO classes 0/15/16, conf 0.5).
2. **MediaPipe Face Detection** — BlazeFace full-range, conf > 0.6 AND
   face area > 0.5 % of frame (matches `inpaint-people.py` v2 thresholds).
3. **OpenCLIP** zero-shot classification (`ViT-B-32 / openai`) against an
   artistic-vs-non-artistic label set (15 artistic, 7 non-artistic).
4. Decision priority:
   1. `cat_count > 0 OR dog_count > 0` -> `remove-pet`
   2. `topClipBucket == non-artistic AND topClipScore > 0.18` ->
      `remove-non-artistic`
   3. `face_count > 0 AND largest_face_fraction < 0.15` -> `inpaint`
   4. `face_count > 0 AND largest_face_fraction >= 0.15` ->
      `flag-dominant-face`
   5. otherwise -> `keep`

Per-photo audit log: `scripts/.personal-pisa-scan.ndjson`.

## Result summary

| Decision              | Count |
| --------------------- | ----: |
| keep                  |    11 |
| inpaint               |     0 |
| remove-pet            |     0 |
| remove-non-artistic   |     0 |
| flag-dominant-face    |     0 |

All 11 photos passed every rule. No file moves, no LaMa inpainting, no
`page.tsx` edits, no Pisa MDX edits.

## Per-photo

| Src                                                     |   W x H    | persons | faces | face\_frac | cats | dogs | top CLIP label                                  | score | decision |
| ------------------------------------------------------- | ---------- | ------: | ----: | ---------: | ---: | ---: | ----------------------------------------------- | ----: | -------- |
| `public/photos/personal/apr-2023-milan.jpg`             | 1440 x 1920 |       4 |     0 |       0.000 |    0 |    0 | architecture or a building                      | 0.490 | keep     |
| `public/photos/personal/apr-2025-vienna.jpg`            | 1920 x 1440 |       0 |     0 |       0.000 |    0 |    0 | architecture or a building                      | 0.595 | keep     |
| `public/photos/personal/bvb-yellow-wall-suedtribuene.jpg` |  980 x 504 |       5 |     0 |       0.000 |    0 |    0 | sports stadium with crowd                       | 0.983 | keep     |
| `public/photos/personal/mar-2024-spring-evening.jpg`    | 1440 x 1920 |       4 |     0 |       0.000 |    0 |    0 | tower or historic landmark                      | 0.346 | keep     |
| `public/photos/personal/mar-2026-pula.jpg`              | 1920 x 1440 |       0 |     0 |       0.000 |    0 |    0 | beach or coastline                              | 0.492 | keep     |
| `public/photos/personal/mar-2026-recent-trip.jpg`       | 1440 x 1920 |       2 |     0 |       0.000 |    0 |    0 | street scene                                    | 0.352 | keep     |
| `public/photos/personal/may-2024-late-spring.jpg`       | 1920 x 1440 |       0 |     0 |       0.000 |    0 |    0 | landscape photograph                            | 0.348 | keep     |
| `public/photos/personal/nov-2023-autumn.jpg`            | 1920 x 1440 |       0 |     0 |       0.000 |    0 |    0 | cityscape photograph                            | 0.530 | keep     |
| `public/travel/pisa/01.jpg`                             | 3000 x 4000 |       0 |     0 |       0.000 |    0 |    0 | monument or sculpture                           | 0.928 | keep     |
| `public/travel/pisa/02.jpg`                             | 3072 x 4096 |       0 |     0 |       0.000 |    0 |    0 | monument or sculpture                           | 0.944 | keep     |
| `public/travel/pisa/03.jpg`                             | 2352 x 3136 |       2 |     0 |       0.000 |    0 |    0 | monument or sculpture                           | 0.380 | keep     |

## BVB Yellow Wall — v2 threshold check

The Südtribüne photo is the canonical stress-test for the v2 face-area
filter. YOLO returns 5 person detections (banner figures + crowd) but
MediaPipe Face Detection returns **0 faces** above the 0.5 % area
threshold — the audience tier is too distant for individual faces to clear
that bar at this resolution (980 x 504). CLIP is also extremely confident
(0.98) that this is "a sports stadium with crowd", which is on the artistic
side of the label set.

Conclusion: BVB photo behaves correctly under the v2 thresholds. Nothing
was modified. Threshold was **not** lowered.

## Page references — no edits required

`src/app/[locale]/personal/page.tsx` is untouched: every photo on the page
was kept. Pisa MDX (the legacy sample trip) is untouched: all 3 Pisa
photos were kept (had they all flagged, at least one would have been
preserved as the template hero, per the constraint).

## Validation

- `npm run lint` — clean (4 pre-existing warnings, none from this branch).
- `npm run typecheck` — clean.
- `npm run dev` + `curl http://localhost:3001/en/personal` -> HTTP 200.
- `node scripts/.round5/validate-photos.mjs` -> `missingFiles: []`,
  `orphanFiles: []` (pageMissing is a pre-existing inconsistency between
  the page src paths `/photos/<file>.jpg` and the on-disk paths
  `/photos/personal/<file>.jpg` — outside the scope of this sweep).

## Files added

- `scripts/personal-pisa-scan.py` — the detection script.
- `scripts/.personal-pisa-scan.ndjson` — per-photo audit log.
- `docs/personal-pisa-sweep-results.md` — this report.

## Files NOT added

- No new entries in `scripts/inpaint-blocklist.json` (none required: the
  blocklist is for monument-preservation, and the BVB photo does not need
  blocklisting because it does not trigger the inpainter under v2).
- No new files under `scripts/.removed-non-artistic/` or
  `scripts/.flagged-non-artistic/`.
- No `docs/personal-pisa-flagged.md` (zero `flag-dominant-face` photos).
