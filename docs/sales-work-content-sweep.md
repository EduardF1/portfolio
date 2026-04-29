# Sales/Work Content Sweep

Aggressive second-pass CLIP zero-shot scan to catch sales-listing /
work-environment shots that the prior sweep missed (e.g. Horsens 2020-02
laptop+mouse for-sale shot, Vejle Tican meat warehouse).

- **Date**: 2026-04-28
- **Scanner**: `scripts/classify-non-artistic-v2.py` (open_clip ViT-B-32, laion2b)
- **Threshold**: top-1 label in REMOVE set AND score > 0.15
- **Photos scanned**: 215 (own-camera only; pexels stocks skipped)
- **Total flagged**: 44
- **Auto-removed (top 30 by score)**: 30
- **Flagged for Eduard's review (over cap)**: 14

## Auto-removed photos

| # | Filename | Top label | Score | Reason | Recovery |
| - | -------- | --------- | ----- | ------ | -------- |
| 1 | `trips/2024-09-albania-saranda/IMG20240924185804.jpg` | vehicles in parking lots or driving | 0.9997 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2024-09-albania-saranda/IMG20240924185804.jpg public/photos/trips/2024-09-albania-saranda/IMG20240924185804.jpg` |
| 2 | `trips/2020-02-denmark/IMG_20200209_165202.jpg` | a laptop or computer or electronic device | 0.9989 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200209_165202.jpg public/photos/trips/2020-02-denmark/IMG_20200209_165202.jpg` |
| 3 | `trips/2023-07-greece-athens-halkidiki/IMG_20230706_184740.jpg` | vehicles in parking lots or driving | 0.9984 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2023-07-greece-athens-halkidiki/IMG_20230706_184740.jpg public/photos/trips/2023-07-greece-athens-halkidiki/IMG_20230706_184740.jpg` |
| 4 | `trips/2024-09-albania-saranda/IMG20240924185719.jpg` | vehicles in parking lots or driving | 0.9982 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2024-09-albania-saranda/IMG20240924185719.jpg public/photos/trips/2024-09-albania-saranda/IMG20240924185719.jpg` |
| 5 | `trips/2020-02-denmark/IMG_20200224_185200.jpg` | a laptop or computer or electronic device | 0.9976 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200224_185200.jpg public/photos/trips/2020-02-denmark/IMG_20200224_185200.jpg` |
| 6 | `trips/2022-12-romania/IMG_20221224_015628.jpg` | vehicles in parking lots or driving | 0.9969 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-12-romania/IMG_20221224_015628.jpg public/photos/trips/2022-12-romania/IMG_20221224_015628.jpg` |
| 7 | `trips/2026-03-balkans-roadtrip/IMG20260326162437.jpg` | vehicles in parking lots or driving | 0.9951 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2026-03-balkans-roadtrip/IMG20260326162437.jpg public/photos/trips/2026-03-balkans-roadtrip/IMG20260326162437.jpg` |
| 8 | `trips/2020-02-denmark/IMG_20200217_161219.jpg` | a computer mouse or keyboard or wires | 0.9925 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200217_161219.jpg public/photos/trips/2020-02-denmark/IMG_20200217_161219.jpg` |
| 9 | `trips/2020-02-denmark/IMG_20200228_215647.jpg` | items being sold online or marketplace listings | 0.9903 | marketplace listing / item-being-sold — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200228_215647.jpg public/photos/trips/2020-02-denmark/IMG_20200228_215647.jpg` |
| 10 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250421173744.jpg` | a computer mouse or keyboard or wires | 0.9898 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-04-czechia-poland-slovakia-austria/IMG20250421173744.jpg public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250421173744.jpg` |
| 11 | `trips/2020-02-denmark/IMG_20200209_170004.jpg` | a computer mouse or keyboard or wires | 0.9873 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200209_170004.jpg public/photos/trips/2020-02-denmark/IMG_20200209_170004.jpg` |
| 12 | `trips/2020-02-denmark/IMG_20200217_093614.jpg` | a computer mouse or keyboard or wires | 0.9846 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200217_093614.jpg public/photos/trips/2020-02-denmark/IMG_20200217_093614.jpg` |
| 13 | `trips/2022-10-germany/IMG_20221022_114756.jpg` | vehicles in parking lots or driving | 0.9702 | parking lot / driving shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/IMG_20221022_114756.jpg public/photos/trips/2022-10-germany/IMG_20221022_114756.jpg` |
| 14 | `trips/2026-03-balkans-roadtrip/IMG20260314013322.jpg` | indoor mundane scene like a hotel room or hallway | 0.9640 | hotel-room / mundane indoor shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2026-03-balkans-roadtrip/IMG20260314013322.jpg public/photos/trips/2026-03-balkans-roadtrip/IMG20260314013322.jpg` |
| 15 | `trips/2020-02-denmark/IMG_20200219_125539.jpg` | a work environment or office or warehouse | 0.9636 | work environment / warehouse — not travel-artistic content | `git mv scripts/.removed-non-artistic/2020-02-denmark/IMG_20200219_125539.jpg public/photos/trips/2020-02-denmark/IMG_20200219_125539.jpg` |
| 16 | `trips/2022-10-germany/20221021_155218.jpg` | a work environment or office or warehouse | 0.9585 | work environment / warehouse — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/20221021_155218.jpg public/photos/trips/2022-10-germany/20221021_155218.jpg` |
| 17 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250423160602.jpg` | consumer goods packaging or product photography | 0.9405 | product / packaging shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-04-czechia-poland-slovakia-austria/IMG20250423160602.jpg public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250423160602.jpg` |
| 18 | `trips/2023-07-greece-athens-halkidiki/IMG_20230706_172303.jpg` | consumer goods packaging or product photography | 0.9230 | product / packaging shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2023-07-greece-athens-halkidiki/IMG_20230706_172303.jpg public/photos/trips/2023-07-greece-athens-halkidiki/IMG_20230706_172303.jpg` |
| 19 | `trips/2022-10-germany/IMG_0231.jpg` | consumer goods packaging or product photography | 0.9089 | product / packaging shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/IMG_0231.jpg public/photos/trips/2022-10-germany/IMG_0231.jpg` |
| 20 | `trips/2026-03-balkans-roadtrip/IMG20260315003840.jpg` | a laptop or computer or electronic device | 0.8810 | electronic-device / for-sale shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2026-03-balkans-roadtrip/IMG20260315003840.jpg public/photos/trips/2026-03-balkans-roadtrip/IMG20260315003840.jpg` |
| 21 | `trips/2022-10-germany/IMG_0196.jpg` | items being sold online or marketplace listings | 0.7729 | marketplace listing / item-being-sold — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/IMG_0196.jpg public/photos/trips/2022-10-germany/IMG_0196.jpg` |
| 22 | `trips/2025-09-andalusia-gibraltar/IMG20250916233230.jpg` | indoor mundane scene like a hotel room or hallway | 0.7675 | hotel-room / mundane indoor shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-09-andalusia-gibraltar/IMG20250916233230.jpg public/photos/trips/2025-09-andalusia-gibraltar/IMG20250916233230.jpg` |
| 23 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250416212124.jpg` | items being sold online or marketplace listings | 0.7256 | marketplace listing / item-being-sold — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-04-czechia-poland-slovakia-austria/IMG20250416212124.jpg public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250416212124.jpg` |
| 24 | `trips/2022-08-denmark/IMG_20220827_123421.jpg` | a work environment or office or warehouse | 0.7216 | work environment / warehouse — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-08-denmark/IMG_20220827_123421.jpg public/photos/trips/2022-08-denmark/IMG_20220827_123421.jpg` |
| 25 | `trips/2022-10-germany/20221021_105022.jpg` | a work environment or office or warehouse | 0.7057 | work environment / warehouse — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/20221021_105022.jpg public/photos/trips/2022-10-germany/20221021_105022.jpg` |
| 26 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250417162312.jpg` | a work environment or office or warehouse | 0.6994 | work environment / warehouse — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-04-czechia-poland-slovakia-austria/IMG20250417162312.jpg public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250417162312.jpg` |
| 27 | `trips/2026-03-balkans-roadtrip/IMG20260314222230.jpg` | indoor mundane scene like a hotel room or hallway | 0.6883 | hotel-room / mundane indoor shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2026-03-balkans-roadtrip/IMG20260314222230.jpg public/photos/trips/2026-03-balkans-roadtrip/IMG20260314222230.jpg` |
| 28 | `trips/2022-10-germany/IMG_0118.jpg` | items being sold online or marketplace listings | 0.6623 | marketplace listing / item-being-sold — not travel-artistic content | `git mv scripts/.removed-non-artistic/2022-10-germany/IMG_0118.jpg public/photos/trips/2022-10-germany/IMG_0118.jpg` |
| 29 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250419132929.jpg` | consumer goods packaging or product photography | 0.5927 | product / packaging shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2025-04-czechia-poland-slovakia-austria/IMG20250419132929.jpg public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250419132929.jpg` |
| 30 | `trips/2026-03-balkans-roadtrip/IMG20260328120403.jpg` | consumer goods packaging or product photography | 0.5705 | product / packaging shot — not travel-artistic content | `git mv scripts/.removed-non-artistic/2026-03-balkans-roadtrip/IMG20260328120403.jpg public/photos/trips/2026-03-balkans-roadtrip/IMG20260328120403.jpg` |

## Flagged but not auto-removed (over cap of 30)

Eduard to inspect these manually and decide. CLIP scored them lower than the auto-removed set.

| # | Filename | Top label | Score |
| - | -------- | --------- | ----- |
| 1 | `trips/2022-10-germany/IMG_20221021_121447359_HDR.jpg` | a computer mouse or keyboard or wires | 0.5353 |
| 2 | `trips/2022-10-germany/IMG_0190.jpg` | a computer mouse or keyboard or wires | 0.5264 |
| 3 | `trips/2026-03-balkans-roadtrip/IMG20260315003841.jpg` | a laptop or computer or electronic device | 0.5251 |
| 4 | `trips/2022-10-germany/20221021_110855.jpg` | a work environment or office or warehouse | 0.5053 |
| 5 | `trips/2022-12-romania/IMG_20221225_211840.jpg` | vehicles in parking lots or driving | 0.4823 |
| 6 | `trips/2026-03-balkans-roadtrip/IMG20260328220133.jpg` | consumer goods packaging or product photography | 0.4687 |
| 7 | `trips/2025-02-finland/IMG20250221150611.jpg` | consumer goods packaging or product photography | 0.4294 |
| 8 | `trips/2025-09-andalusia-gibraltar/IMG20250915162242.jpg` | a work environment or office or warehouse | 0.4244 |
| 9 | `trips/2022-10-germany/IMG_0143.jpg` | a work environment or office or warehouse | 0.4225 |
| 10 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250414204538.jpg` | a computer mouse or keyboard or wires | 0.3675 |
| 11 | `trips/2023-07-turkey/IMG_20230715_165617.jpg` | vehicles in parking lots or driving | 0.3672 |
| 12 | `trips/2022-10-germany/IMG_20221022_124225360_HDR.jpg` | items being sold online or marketplace listings | 0.3324 |
| 13 | `trips/2026-03-balkans-roadtrip/IMG20260327215145.jpg` | a work environment or office or warehouse | 0.2928 |
| 14 | `trips/2025-04-czechia-poland-slovakia-austria/IMG20250419145559.jpg` | indoor mundane scene like a hotel room or hallway | 0.2778 |

## Recovery — bulk

To restore everything in this sweep:

```sh
git revert <merge-commit-of-this-PR>
```
