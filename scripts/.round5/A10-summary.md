# Agent A10 — Photo Discovery Summary

Date: 2026-04-27

## Archives scanned (read-only)
- D:\Portfolio: 264 files in archive; round-4 EXIF extractor produced 73 rows (55 with GPS)
- G:\Poze: 38,163 files in archive; round-4 EXIF extractor produced 4806 rows (3589 with GPS)
- Combined GPS-tagged candidates considered: 3644

## Israel — primary deliverable
- Total Israel-bbox photos with GPS: **75** (all from G:\Poze)
- Trip dates: 23 March 2018 (Yardenit baptismal site, Sea of Galilee), 24 March 2018 (Rosh HaNikra grottoes & cliff), 25 March 2018 (Nazareth Basilica + Kfar Kanna Wedding-Church)
- Camera: Huawei RNE-L21 (Mate 10 Lite)
- Already copied to public/photos/ but NOT in scripts/photo-catalogue.json: **10** photos (the canonical 10 surfaced by an earlier round)
- Manifest picks: **12** (deduped to one frame per ~hour-cluster, then human-curated by visual inspection)
  - **2 fresh picks** (NOT yet in /public/photos): IMG_20180324_114159.jpg (wide Mediterranean coast from Rosh HaNikra clifftop) and IMG_20180324_130051.jpg (iconic Jerusalem-205km / Beirut signpost) — both verified as STRONG portfolio shots via Read-tool inspection.
  - **2 fresh personal picks**: IMG_20180323_113718.jpg (Eduard at Yardenit) and IMG_20180325_131135.jpg (father at icon, Nazareth Annunciation) — adds people-context to the trip narrative.
  - **8 already-in-/public picks** included so A1 has the complete set in one place when adding catalogue entries; A1 just needs to add the catalogue rows (gps + place block) for these — file copy is already done.

### Top Israel picks (manifest order)
1. [in /public] `IMG_20180324_121517.jpg` — Already in /public; turquoise water crashing on white limestone inside Rosh HaNikra grottoes — STUNNING portfolio shot
1. [FRESH] `IMG_20180324_114159.jpg` — WIDE shot south down the Mediterranean coast from Rosh HaNikra cliff — dramatic landscape, no people foregrounded; STRONG portfolio pick
1. [FRESH] `IMG_20180324_130051.jpg` — Iconic Rosh HaNikra signpost (Jerusalem 205 km / Beirut) — strong context shot, two people foregrounded
1. [in /public] `IMG_20180323_115533.jpg` — Eduard's father at Yardenit, with the Mark 1:9 baptism plaque (Danish) behind — context-rich travel photo
1. [in /public] `IMG_20180324_130102.jpg` — Already in /public; same signpost area
1. [in /public] `IMG_20180323_113715.jpg` — Stone steps at Yardenit baptismal site, Sea of Galilee — already in /public
1. [in /public] `IMG_20180325_135940.jpg` — Already in /public; Greek Orthodox Wedding-Church, Kfar Kanna
1. [in /public] `IMG_20180325_131138.jpg` — Already in /public; same church
1. [FRESH] `IMG_20180323_113718.jpg` — Eduard sitting on the stone steps at Yardenit, Jordan-River baptism site — personal portrait, decent light
1. [FRESH] `IMG_20180325_131135.jpg` — Eduard's father at icon inside the Greek Orthodox Church of the Annunciation, Nazareth — strong religious-architecture context
1. [in /public] `IMG_20180324_113721.jpg` — Already in /public; Rosh HaNikra clifftop landscape
1. [in /public] `IMG_20180324_130414.jpg` — Already in /public; signpost variant

## New destinations (countries NOT yet in catalogue)
Sweep covered both archives, all GPS rows + bbox fallback for 35 plausible countries. Findings:

- **United Kingdom — 6 photos found, ALL REJECTED**
  - 4 × IMG_3820..3823.JPG (Milton Keynes, May 2017): private/personal mirror selfies — NOT portfolio-suitable. (These also appear in scripts/round4-extension-newcountries.json; A1 should be warned to skip them despite the round-4 manifest listing them.)
  - 2 × IMG_20230706_071836/43.jpg (Edinburgh airport, July 2023): café tray with cappuccino — airport snack pic, no portfolio value.
- **No other new countries detected.** Every other GPS-tagged photo across the 38,163-file archive falls inside one of the 20 currently-catalogued country bboxes plus Israel. No Egypt/Jordan/Cyprus/Greek-isles/Hungary/etc photos exist.

### Recommendation to A1
- DO NOT add scripts/round4-extension-newcountries.json's UK entries to the catalogue. Update that file's status or remove it.

## Under-stocked trips
The brief listed 11 under-stocked trips (2-4 photos each). The current catalogue actually has all of them at ~10 photos — sibling agents (likely round 3 + 4) already enriched these.

Per-trip current catalogue counts:
- Spain 2025-09: **7** in catalogue (brief said 4)
- Gibraltar 2025-09: **7** in catalogue (brief said 3)
- Czechia 2025-04: **10** in catalogue (brief said 2)
- Poland 2025-04: **10** in catalogue (brief said 4)
- Austria 2025-04: **9** in catalogue (brief said 3)
- Germany 2026-03: **10** in catalogue (brief said 3)
- Austria 2026-03: **3** in catalogue (brief said 2)
- Italy 2026-03: **10** in catalogue (brief said 2)
- Croatia 2026-03: **8** in catalogue (brief said 4)
- Slovenia 2026-03: **5** in catalogue (brief said 4)
- Serbia 2026-03: **6** in catalogue (brief said 4)

Fresh archive candidates for these trips: **0** (every GPS-tagged archive photo for these (country, month) pairs is already in scripts/photo-catalogue.json). No supplementary picks possible from D:\Portfolio or G:\Poze.

## Files dropped from consideration
- ~1,235 archive photos with no GPS metadata (cannot attribute country)
- 4 UK photos (Milton Keynes 2017 — personal/private)
- 2 UK photos (Edinburgh airport 2023 — café snack snapshots)
- ~63 Israel near-duplicates collapsed to 12 picks via hour-bucket dedupe (largest-filesize wins)
- All trips listed in the under-stocked brief: zero fresh candidates remain in the archives

## How A1 should consume the manifest
- Read `scripts/.round5/photo-discovery.json`. Each entry has:
  - `src` (absolute path to the source JPG on D:\ or G:\)
  - `alreadyInPublicPhotos` boolean — when true the file is already at `public/photos/<filename>` and A1 only needs to add the catalogue entry (no copy/resize). When false, A1 should run the resize+copy pipeline.
  - `coords`, `city`, `country`, `takenAt`, `cameraModel` ready to drop into the catalogue's standard schema (`gps`, `place`, `takenAt`).
  - `suggestedCaption` and `suggestedFolder` (`trips/2018-03-israel`) for the public-facing copy.
- Adding all 12 entries surfaces a brand-new "Israel — March 2018" trip cluster on the photos page (slug: `israel-2018-03`).
- ⚠ A sibling agent already created `public/photos/trips/2018-04-israel/` (wrong month — trip was 23-25 March, not April). Consider renaming that dir to `2018-03-israel` before adding the 4 fresh files; the 10 already-copied photos move with the rename.
- For each Israel entry, the catalogue `place` block should be:
  - Yardenit photos (lat≈32.71, lon≈35.57): `{ city: "Yardenit (Sea of Galilee)", country: "Israel", display: "Yardenit, Israel" }`
  - Rosh HaNikra photos (lat≈33.09, lon≈35.10-35.11): `{ city: "Rosh HaNikra", country: "Israel", display: "Rosh HaNikra, Israel" }`
  - Nazareth photos (lat≈32.70, lon≈35.30): `{ city: "Nazareth", country: "Israel", display: "Nazareth, Israel" }`
  - Kfar Kanna photos (lat≈32.75, lon≈35.34): `{ city: "Kafr Kanna", country: "Israel", display: "Kafr Kanna, Israel" }`

