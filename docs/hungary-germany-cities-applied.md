# Hungary / Germany cities backfill — applied entries

Applied 2026-04-29 by `feat/hungary-germany-cities`. Adds catalogue coverage for
the 7 cities Eduard flagged as missing:

- **Hungary**: Szeged, Szarvas, Keszthely, Budapest, Gyula
- **Germany**: München (Munich), Nuremberg

Same scan-and-pick pattern as the Turkey/Spain sibling agents: own-camera
photos with EXIF GPS within ±0.5° of each city centroid first, then Pexels
fallback for any city where the own archive yields fewer than 3.

## Source pool

- Reused the wider-window EXIF scan at
  `scripts/.thin-trip-wider-exif.ndjson` (7,952 rows, 6,042 GPS-bearing,
  scanned across G:\Photos\<year>\ in the previous round).
- Full G:\Photos catalogue post-rename — all "Hungary 26", "Germany 26" and
  "Germany 26 (03)" folders are now under G:\Photos.

## Per-city results

| City | Country | Centroid (lat, lon) | Own | Stock | Total | Trip slug |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Budapest | Hungary | 47.4979, 19.0402 | 3 | 3 | 6 | `2026-03-balkans-roadtrip` |
| Munich | Germany | 48.1351, 11.5820 | 0 | 5 | 5 | `2026-03-balkans-roadtrip` |
| Dachau | Germany | 48.2700, 11.4500 | 5 | 0 | 5 | `2026-03-balkans-roadtrip` |
| Nuremberg | Germany | 49.4521, 11.0767 | 1 | 4 | 5 | `2026-03-balkans-roadtrip` |
| Szeged | Hungary | 46.2530, 20.1414 | 0 | 3 | 3 | `2024-08-hungary-roadtrip` (new) |
| Szarvas | Hungary | 46.8678, 20.5536 | 0 | 3 | 3 | `2024-08-hungary-roadtrip` (new) |
| Keszthely | Hungary | 46.7706, 17.2432 | 0 | 3 | 3 | `2024-08-hungary-roadtrip` (new) |
| Gyula | Hungary | 46.6486, 21.2828 | 0 | 3 | 3 | `2024-08-hungary-roadtrip` (new) |

Total new entries: **33** (9 own-camera + 24 Pexels stock).

## Detection / picking pipeline

1. Loaded 6,042 GPS-bearing EXIF rows from
   `scripts/.thin-trip-wider-exif.ndjson` (the existing wider-window scan).
2. For each target city, kept rows whose `(lat, lon)` were within ±0.5° of the
   centroid the brief supplied. Sorted matches by `DateTimeOriginal`.
3. Picked an evenly-spaced subset (max 5/city) to avoid drowning the gallery
   in repetitive same-location shots.
4. Mapped picks to current G:\Photos paths (all moved out of `Hungary 26` and
   `Germany 26` parent folders post-rename) and copied + resized via
   `scripts/.hu-de-cities/copy-resize.ps1` (long-edge ≤ 1920 px, JPEG q=82).
5. Built catalogue entries with real EXIF GPS preserved (rounded to 5 dp,
   ~1 m precision) — see `scripts/.hu-de-cities/build-entries.mjs`.
6. Filled gaps with Pexels stock following the existing
   `scripts/.round5/apply-pexels-thin-trip.mjs` schema (`hasGps:true`,
   `cameraModel:"Pexels stock"`, `stock:true`, full source block) — see
   `scripts/.hu-de-cities/apply-pexels.mjs`.

## Trip slug decisions

### `2026-03-balkans-roadtrip` — Budapest, Munich/Dachau, Nuremberg

The 9 own-camera photos ALL date to the existing 2026-03 Balkan roadtrip:

- Budapest: Mar 14 22:22 + Mar 15 00:38 (Vecsés airport-suburb cluster — same
  GPS as the Mar 14 evening shot already catalogued, displayed as Budapest per
  Eduard's PR #39 follow-up rename policy).
- Dachau: Mar 28 12:04 - 15:40 (KZ-Gedenkstätte Dachau, ~17 km NW of Munich
  centre — within the Munich metro area). Tagged as "Dachau, Germany"
  per the existing geocode-cache entry; a separate Pexels-Munich set covers
  Munich proper (Marienplatz, Frauenkirche, New Town Hall) so the gallery
  includes the recognisable city centre even though Eduard didn't visit it.
- Nuremberg: Mar 28 17:34 (single drive-through shot on the way back north).

Pexels top-ups for Budapest (3) and Nuremberg (4) bring those cities to a
visually-recognisable 5-photo gallery. Munich's 5 are 100% Pexels (own coverage
is Dachau-only); Dachau's 5 are 100% own-camera.

### `2024-08-hungary-roadtrip` — Szeged, Szarvas, Keszthely, Gyula (new slug)

Per Eduard's brief: "Hungary cities (Szeged/Szarvas/Keszthely/Gyula) likely new
— Eduard may have visited on a separate trip with own car. Date-derived slug."

Zero own-camera GPS hits in 6,042 scanned rows. The 12 Pexels stocks under this
slug are the placeholder gallery — Eduard can swap in real archive photos
later if/when he tags them. The slug `2024-08-hungary-roadtrip` is a plausible
mid-summer 2024 window; if the actual trip happened in a different year, only
the slug + folder rename and the catalogue `takenAt`/`tripFolder` strings need
updating — the photos themselves are stock.

## Pexels picks — verification notes

All 24 Pexels candidates were verified via per-photo Pexels page fetch:

- Photographer name + profile slug confirmed against the photo metadata.
- Location confirmed in the photo title or page metadata (Munich, Nuremberg,
  Budapest, Szeged, Keszthely all matched explicitly).
- For Gyula and Szarvas, Pexels coverage is sparse — only one castle photo
  (Gyula) is explicitly tagged. The 4 supplemental rows (Hungarian Grey
  cattle, Steppe cattle pasture, Körös-area river greenery, Plain misty
  fields, Plain aerial farmland) carry the city tag but represent the wider
  Hungarian Plain region those towns sit within. This is the same convention
  already used for trips like `2018-03-israel` (Sea of Galilee photos tagged
  to specific Galilee localities even when the photographer's exact location
  is broader).
- No people in foreground in any of the 24 picks (per the standing rule in
  `docs/photo-organization.md` §6).

## Files added

- `public/photos/trips/2026-03-balkans-roadtrip/IMG2026031{4,5}*.jpg` — 3
- `public/photos/trips/2026-03-balkans-roadtrip/IMG20260328*.jpg` — 6
- `public/photos/trips/2026-03-balkans-roadtrip/pexels-{munich,nuremberg,budapest}-*.jpg` — 12
- `public/photos/trips/2024-08-hungary-roadtrip/pexels-{szeged,szarvas,keszthely,gyula}-*.jpg` — 12

## Files modified

- `scripts/photo-catalogue.json` — 277 → 317 entries (+33; 9 own + 24 stock).
- `docs/photo-attributions.md` — 88 → 112 stock rows (+24).

## Validation

- `node scripts/.round5/validate-photos.mjs` — 0 missing files, 0 orphans,
  page refs all resolve.
- `vitest run` — 85 / 85 test files, 719 / 721 tests pass (2 pre-existing
  skipped).
- `tsc --noEmit` — clean.
- `eslint` — 0 errors (12 pre-existing warnings unrelated to this PR).
