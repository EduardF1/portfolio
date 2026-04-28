# Inpaint pre-scan summary

Generated: 2026-04-28 (UTC)
Source: `scripts/inpaint-prescan.py` over `public/photos/trips/**/*.jpg`
Manifest: [`scripts/inpaint-targets.json`](../scripts/inpaint-targets.json)
Audit log (NDJSON): `scripts/.inpaint-prescan.ndjson`

## Why this exists

The face-removal inpainting pipeline (`scripts/inpaint-people.py`) takes
~13 s/photo on CPU. Running it blanket over every JPG under
`public/photos/trips/` would take ~40 minutes on this corpus and produce a
larger diff for review than necessary.

This pre-scan runs **face-detection only** (MediaPipe BlazeFace full-range,
gated at confidence ≥ 0.6 and bbox area ≥ 0.5 % of frame, identical to the
inpaint script's gate) plus a YOLO11n person-detection side pass for
cross-reference. It writes a manifest the sweep harness consumes so the
expensive LaMa step runs **only on photos that actually have visible faces**.

## Headline numbers

| Metric            | Count | %       |
| ----------------- | ----: | ------: |
| Total scanned     |   189 | 100.0 % |
| `needs-inpaint`   |    12 |   6.3 % |
| `clean`           |   177 |  93.7 % |
| Errors            |     0 |   0.0 % |

Pre-scan wall time: **18.5 s** (~98 ms/photo, including YOLO side pass).

The hit rate (6.3 %) is well below the 30 % extrapolation from the prior
5-photo test. Two factors:

1. The 2018-03 Israel trip dominates the hits (9 of 12, 75 %); other
   destinations are mostly landscape/architecture without people in frame.
2. Many `clean` photos still have **persons** detected by YOLO (statues,
   distant pedestrians, blurry figures), but no qualifying **face**. This is
   the intended monument-preservation behaviour from the inpaint pipeline.

## Top trips by inpaint density

| Rank | Trip                       | Hits / total |  Density |
| ---: | -------------------------- | -----------: | -------: |
|    1 | `2018-03-israel`           |        9 / 14 | 64.3 % |
|    2 | `2019-07-belgium`          |         1 / 5 |  20.0 % |
|    3 | `2020-02-denmark`          |         1 / 5 |  20.0 % |
|    4 | `2026-03-balkans-roadtrip` |        1 / 42 |   2.4 % |

## Trips with 0 % face hits

The sweep harness can skip these entirely; the inpaint pipeline does not need
to touch any of their files:

- `2018-04-sweden` (5 photos)
- `2019-07-luxembourg` (5 photos)
- `2022-07-greece` (5 photos)
- `2022-08-denmark` (5 photos)
- `2022-08-romania` (5 photos)
- `2022-10-denmark` (5 photos)
- `2022-10-germany` (5 photos)
- `2022-12-romania` (5 photos)
- `2023-04-italy` (5 photos)
- `2023-07-turkey` (5 photos)
- `2023-08-romania` (5 photos)
- `2024-09-albania-saranda` (5 photos)
- `2025-02-finland` (5 photos)
- `2025-03-romania` (5 photos)
- `2025-04-czechia-poland-slovakia-austria` (39 photos)
- `2025-09-andalusia-gibraltar` (14 photos)

## Face-count distribution among `needs-inpaint` photos

| Faces | Photos |
| ----: | -----: |
|     1 |      6 |
|     2 |      4 |
|     3 |      2 |
|   5 + |      0 |

No crowd shots (5+ faces) were detected, so there are no inpaint-quality
risks to flag for human review on those grounds. One photo (Israel
`IMG_20180324_113721.jpg`) has a `maxFaceArea` of 0.176, which exceeds the
inpaint pipeline's `--max-face-area 0.15` ceiling — it will be **flagged**
rather than inpainted by `inpaint-people.py` and routed to
`<output>/flagged/` for manual review.

## How the sweep harness consumes this manifest

`scripts/inpaint-targets.json` shape:

```json
{
  "generatedAt": "2026-04-28T22:38:27Z",
  "root": "public/photos/trips",
  "thresholds": { "faceConfidence": 0.6, "minFaceArea": 0.005, "yoloThreshold": 0.4 },
  "totalScanned": 189,
  "needsInpaint": 12,
  "clean": 177,
  "errors": 0,
  "targets": [
    { "src": "trips/2018-03-israel/IMG_20180323_113715.jpg", "faceCount": 1, "personCount": 1, "maxFaceArea": 0.010815 },
    ...
  ]
}
```

The harness should:

1. Read `targets[].src`, prefix with `public/photos/` → absolute photo path.
2. Pass each path as `--input` to `scripts/inpaint-people.py` (or batch as
   one comma-joined glob list).
3. Skip every other JPG under `public/photos/trips/` — those are pre-confirmed
   `clean`.

Estimated sweep time given 12 targets at ~13 s/photo: **~2.6 minutes** vs.
~41 minutes for a blanket run. Speed-up: ~16x.

## Re-running

The pre-scan is idempotent and overwrites both outputs:

```sh
scripts/.inpaint-venv/Scripts/python.exe scripts/inpaint-prescan.py
```

Adjust thresholds with `--face-confidence`, `--min-face-area`, or
`--yolo-threshold`. The script never writes image bytes; JPGs are read-only.
