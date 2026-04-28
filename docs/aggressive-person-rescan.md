# Aggressive person re-scan (2026-04-28)

Eduard reported people still visible in Germany, Israel, and Croatia trip
photos after the original face-detection pass. The first run used
`face-confidence 0.6 / min-face-area 0.005 / yolo-threshold 0.5`, which
missed partial heads, distant pedestrians, and small faces in cityscapes.

This pass uses an **OR-of-two-detectors** rule with much lower thresholds:

| Detector | Setting | Original |
|---|---|---|
| YOLO11n person (class 0) | conf >= **0.35** | 0.5 |
| MediaPipe Face (full-range, model 1) | conf >= **0.4** AND face area >= **0.001** of frame | 0.6 / 0.005 |

A photo is **removed** if EITHER detector hits. Removed files are git-moved to
`scripts/.removed-non-artistic/<trip>/<filename>` (recoverable). LaMa
inpainting is **NOT** used here — it produces grey-shadow artefacts on the
real travel corpus and was rejected for shipping. We drop the photo.

## Scope

- `trips/2018-03-israel/` (Israel 2018)
- `trips/2022-10-germany/` (Germany 2022 — Hamburg, Munster)
- `trips/2026-03-balkans-roadtrip/` filtered to `place.country == "Germany"` (transit through DE)
- `trips/2026-03-balkans-roadtrip/` filtered to `place.country == "Croatia"` (Pula, Istria)

80 catalogue entries scanned; 30 flagged for removal.

## Per-trip summary

| Trip | Scanned | Flagged | Removed |
|---|---|---|---|
| Israel 2018 | 3 | 1 | 1 |
| Germany 2022 | 60 | 24 | 24 |
| Balkans 2026 Germany | 9 | 3 | 3 |
| Balkans 2026 Croatia | 8 | 2 | 2 |
| Austria 2025 (Eduard override — motion blur) | 1 | 1 | 1 |
| **Total** | **81** | **31** | **31** |

## Manual override: Vienna motion-blur

`trips/2025-04-czechia-poland-slovakia-austria/IMG20250413160631.jpg`
(Vienna, 2025-04-13 16:06) — motion-blurred, not artistic. Dropped per
Eduard explicit ask, regardless of detector output.

## Per-photo decisions

### Israel 2018 (1)

| src | place | faceCount | personCount | largestFaceFrac | decision | rationale |
|---|---|---|---|---|---|---|
| `trips/2018-03-israel/IMG_20180325_131138.jpg` | Nazareth, Israel | 1 | 1 | 0.0031 | remove | both detectors hit — face + body visible |

### Germany 2022 (24)

| src | place | faceCount | personCount | largestFaceFrac | decision | rationale |
|---|---|---|---|---|---|---|
| `trips/2022-10-germany/20221021_103051.jpg` |  | 0 | 1 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/20221021_105442.jpg` |  | 1 | 0 | 0.0101 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |
| `trips/2022-10-germany/20221021_111231.jpg` |  | 0 | 1 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/20221021_111727.jpg` |  | 1 | 0 | 0.0021 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |
| `trips/2022-10-germany/20221021_111820.jpg` |  | 1 | 0 | 0.0026 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |
| `trips/2022-10-germany/20221021_121039.jpg` | Hamburg, Germany | 0 | 2 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/20221021_134042.jpg` | Hamburg, Germany | 1 | 3 | 0.0073 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/20221021_191658.jpg` | Hamburg, Germany | 2 | 2 | 0.0181 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/20221021_195010.jpg` | Hamburg, Germany | 1 | 9 | 0.0041 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/20221022_165157.jpg` | Hamburg, Germany | 0 | 9 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/20221022_172538.jpg` | Hamburg, Germany | 1 | 1 | 0.0220 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0113.jpg` | Munster, Germany | 1 | 1 | 0.0053 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0116.jpg` | Munster, Germany | 1 | 1 | 0.0047 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0128.jpg` | Munster, Germany | 0 | 1 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/IMG_0169.jpg` | Hamburg, Germany | 0 | 4 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/IMG_0172.jpg` | Hamburg, Germany | 0 | 2 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/IMG_0249.jpg` | Hamburg, Germany | 0 | 6 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/IMG_0253.jpg` | Hamburg, Germany | 0 | 4 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2022-10-germany/IMG_0269.jpg` | Hamburg, Germany | 1 | 2 | 0.0082 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0283.jpg` | Hamburg, Germany | 2 | 4 | 0.0100 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0292.jpg` | Hamburg, Germany | 2 | 0 | 0.0027 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |
| `trips/2022-10-germany/IMG_0303.jpg` | Hamburg, Germany | 2 | 2 | 0.0051 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/IMG_0307.jpg` | Hamburg, Germany | 2 | 7 | 0.0033 | remove | both detectors hit — face + body visible |
| `trips/2022-10-germany/original_16daf845-1eaa-45da-a415-61c184d2bde8_IMG_20221022_130459028.jpg` | Hamburg, Germany | 1 | 0 | 0.0045 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |

### Balkans 2026 Germany (3)

| src | place | faceCount | personCount | largestFaceFrac | decision | rationale |
|---|---|---|---|---|---|---|
| `trips/2026-03-balkans-roadtrip/IMG20260312214126.jpg` | Neumünster, Germany | 0 | 1 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |
| `trips/2026-03-balkans-roadtrip/IMG20260327162429.jpg` | Schwangau, Germany | 1 | 0 | 0.0059 | remove | MediaPipe face hit (small face under prior 0.005 area gate) |
| `trips/2026-03-balkans-roadtrip/IMG20260328135215.jpg` | Dachau, Germany | 0 | 1 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |

### Balkans 2026 Croatia (2)

| src | place | faceCount | personCount | largestFaceFrac | decision | rationale |
|---|---|---|---|---|---|---|
| `trips/2026-03-balkans-roadtrip/IMG20260325161747.jpg` | Grad Pula, Croatia | 1 | 2 | 0.0016 | remove | both detectors hit — face + body visible |
| `trips/2026-03-balkans-roadtrip/IMG20260325164444.jpg` | Grad Pula, Croatia | 0 | 4 | 0.0000 | remove | YOLO person hit (no detectable face but body in frame) |

### Austria 2025 (manual override) (1)

| src | place | faceCount | personCount | largestFaceFrac | decision | rationale |
|---|---|---|---|---|---|---|
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250413160631.jpg` | Vienna, Austria | - | - | - | remove | motion-blur, not artistic (Eduard ask) |

## Recovery

Each removed photo is git-tracked at
`scripts/.removed-non-artistic/<trip>/<filename>.jpg`. Reverse with:

```bash
git mv scripts/.removed-non-artistic/<trip>/<filename>.jpg \n       public/photos/trips/<trip>/<filename>.jpg
```

and re-add the catalogue entry from the prior commit on `main`.
