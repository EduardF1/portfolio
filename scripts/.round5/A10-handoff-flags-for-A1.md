# A10 → A1 critical hand-off flags

## 1. Israel trip month is MARCH, not April
A10's EXIF inspection confirms the Israel trip is **23-25 March 2018** (Yardenit, Rosh HaNikra, Nazareth, Kfar Kanna).

If you've already created `public/photos/trips/2018-04-israel/`, RENAME it to `public/photos/trips/2018-03-israel/`. The 10 untracked `IMG_20180323-25_*.jpg` files belong there.

## 2. The 10 Israel photos already in `public/photos/` are NOT in `scripts/photo-catalogue.json`
You must add them. Coordinates from EXIF (per A10):
- Yardenit cluster (32.704°N, 35.572°E) — 23 Mar 2018
- Rosh HaNikra (33.087°N, 35.108°E) — 24 Mar 2018
- Nazareth Basilica (32.703°N, 35.297°E) — 25 Mar 2018
- Kfar Kanna (32.745°N, 35.343°E) — 25 Mar 2018

## 3. Drop `scripts/round4-extension-newcountries.json` from any integration plan
The UK photos it lists (Milton Keynes 2017 + Edinburgh 2023) are private/airport selfies — A10 visually rejected all 6.

## 4. A10's manifest at `scripts/.round5/photo-discovery.json` adds 12 NEW Israel picks
None overlap with the 10 already in `public/photos/`. Standout new picks:
- `IMG_20180324_114159.jpg` — wide Mediterranean coast from Rosh HaNikra clifftop
- `IMG_20180324_130051.jpg` — iconic "Jerusalem 205 km / Beirut" trilingual signpost

## 5. Under-stocked trips brief was stale
Catalogue already has 6-10 photos per trip (sibling agents already filled them in Round 4 work). No more photos to surface from the archives — A10 found 0 fresh candidates after dedupe.
