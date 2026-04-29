# Visual content cleanup v2

Triggered by Eduard reports of inappropriate content the prior CLIP sweep
missed because it skipped Pexels and only flagged sales/work content:

- Tirana own-camera photo showing an MG34 machine gun
- Budapest own-camera photo showing a Claude chat screenshot

## Method

CLIP zero-shot (`ViT-B-32 / laion2b_s34b_b79k`) over EVERY entry in
`scripts/photo-catalogue.json` (own + Pexels). 9 REJECT labels (weapons,
screenshots, mundane interiors, marketplace listings, clothing on hangers)
vs. 5 ACCEPT labels (landmarks, landscapes, architecture, food, skylines).
Photos with a REJECT top-1 score > 0.18 were moved to
`scripts/.removed-non-artistic/<orig-path>`, dropped from the catalogue,
and (for Pexels) dropped from `docs/photo-attributions.md`.

Scan: 473 photos. Removals: 30.

## Confirmed reports

| Report | File | Top label | Score |
| --- | --- | --- | --- |
| MG34 (Tirana, Albania) | `trips/2024-09-albania-saranda/IMG20240924140038.jpg` | a machine gun or rifle or cannon | 0.8639 |
| Claude chat screenshot (Balkans roadtrip / Budapest leg) | `trips/2026-03-balkans-roadtrip/IMG20260315003841.jpg` | a screenshot of a chat application or web page | 0.9792 |

## Removed photos

| File | Top label | Score | Source |
| --- | --- | --- | --- |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250413162629.jpg` | a machine gun or rifle or cannon | 0.9974 | Own |
| `trips/2022-10-germany/IMG_20221022_120955484_HDR.jpg` | a machine gun or rifle or cannon | 0.9842 | Own |
| `trips/2026-03-balkans-roadtrip/IMG20260315003841.jpg` | a screenshot of a chat application or web page | 0.9792 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250413162256.jpg` | a weapon or firearm or military gear | 0.9725 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250413161509.jpg` | a weapon or firearm or military gear | 0.9162 | Own |
| `trips/2026-03-balkans-roadtrip/IMG20260324135856.jpg` | items being sold or marketplace listing | 0.8877 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250414204538.jpg` | a piece of clothing on a hanger or in a closet | 0.8799 | Own |
| `trips/2022-10-germany/IMG_20221021_121447359_HDR.jpg` | indoor mundane domestic scene | 0.8753 | Own |
| `trips/2024-09-albania-saranda/IMG20240924140038.jpg` | a machine gun or rifle or cannon | 0.8639 | Own |
| `trips/2022-10-germany/IMG_0190.jpg` | a machine gun or rifle or cannon | 0.8146 | Own |
| `trips/2022-10-germany/IMG_20221022_131638320.jpg` | a machine gun or rifle or cannon | 0.7520 | Own |
| `trips/2022-10-germany/IMG_0227.jpg` | indoor mundane domestic scene | 0.7422 | Own |
| `trips/2022-10-germany/20221021_120647.jpg` | a machine gun or rifle or cannon | 0.7413 | Own |
| `trips/2022-10-germany/IMG_20221021_121644340_HDR.jpg` | a machine gun or rifle or cannon | 0.7237 | Own |
| `trips/2022-10-germany/IMG_0143.jpg` | a machine gun or rifle or cannon | 0.7041 | Own |
| `trips/2022-10-germany/IMG_20221022_124225360_HDR.jpg` | a weapon or firearm or military gear | 0.6684 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250413154619.jpg` | a weapon or firearm or military gear | 0.6643 | Own |
| `trips/2019-07-luxembourg/IMG_20190730_140153.jpg` | a weapon or firearm or military gear | 0.6568 | Own |
| `trips/2022-10-germany/IMG_0124.jpg` | a machine gun or rifle or cannon | 0.6338 | Own |
| `trips/2025-03-romania/IMG20250328203701.jpg` | a phone screenshot or computer interface | 0.5723 | Own |
| `trips/2022-10-germany/IMG_0141.jpg` | a machine gun or rifle or cannon | 0.5479 | Own |
| `trips/2022-10-germany/20221021_110855.jpg` | a piece of clothing on a hanger or in a closet | 0.5246 | Own |
| `trips/2024-08-hungary-roadtrip/pexels-keszthely-balaton-speedboat-pier-12553574.jpg` | a machine gun or rifle or cannon | 0.4936 | Pexels |
| `trips/2022-12-romania/pexels-bucharest-snow-street-bicycle-953626.jpg` | items being sold or marketplace listing | 0.4679 | Pexels |
| `trips/2022-10-germany/IMG_20221021_183920675_HDR.jpg` | an empty conference room or whiteboard | 0.4607 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250421174759.jpg` | an empty conference room or whiteboard | 0.4469 | Own |
| `trips/2025-04-czechia-poland-slovakia-austria/IMG20250421190301.jpg` | a bedroom or hotel room or hallway interior | 0.4313 | Own |
| `trips/2022-10-germany/20221021_100237.jpg` | a machine gun or rifle or cannon | 0.4062 | Own |
| `trips/2022-08-denmark/pexels-billund-airport-airliner-11554593.jpg` | indoor mundane domestic scene | 0.3632 | Pexels |
| `trips/2022-08-denmark/pexels-billund-airport-airliner-landing-11554593.jpg` | indoor mundane domestic scene | 0.3446 | Pexels |

## Reproducibility

Scan + apply:

```bash
scripts/.inpaint-venv/Scripts/python.exe scripts/visual-content-cleanup-v2.py \
    --catalogue scripts/photo-catalogue.json \
    --photos-root public/photos \
    --threshold 0.18 \
  > scripts/.visual-cleanup-v2.ndjson
node scripts/apply-visual-cleanup-v2.mjs
```
