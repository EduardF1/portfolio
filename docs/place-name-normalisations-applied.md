# Place-name normalisations applied

**Date:** 2026-04-28
**Branch:** `fix/place-name-normalization`
**Script:** `scripts/normalize-place-names.mjs`

## Why

Nominatim reverse-geocoding (used by `scripts/build-photo-catalogue.mjs`)
sometimes returns administrative names — e.g. `"Stari Grad Urban Municipality"`
or `"Malmö kommun"` — instead of the well-known city name. On the `/travel`
country cards each of these admin labels rendered as a distinct city,
inflating the city count and splitting photos that belong to the same place.

This pass normalises 26 entries in `scripts/photo-catalogue.json` and the
matching 20 entries in `scripts/.geocode-cache.json` (so a future rebuild
does not reintroduce the admin labels from cached Nominatim responses).

GPS coordinates were **not** modified for any entry.

## Scope

Only `place.city` and `place.display` are rewritten. Entry order, `gps`,
`takenAt`, `source`, and every other field are preserved. No new entries
were added (the sibling agent on `feat/uk-edinburgh-and-more` owns the
"add UK photos" task).

## Consolidations (before -> after counts)

| Before (`place.city`) | After (`place.city`) | Country | Entries |
|---|---|---|---|
| `Grad Pula` | `Pula` | Croatia | 5 |
| `Mate Asher Regional Council` | `Rosh HaNikra` | Israel | 4 |
| `Billund Municipality` | `Billund` | Denmark | 3 |
| `Rosh HaNikra (Mate Asher)` | `Rosh HaNikra` | Israel | 3 |
| `Brasov` | `Brașov` | Romania | 2 |
| `Thassos Municipality` | `Thassos` | Greece | 2 |
| `Stari Grad Urban Municipality` | `Belgrade` | Serbia | 1 |
| `Savski Venac Urban Municipality` | `Belgrade` | Serbia | 1 |
| `Palilula Urban Municipality` | `Belgrade` | Serbia | 1 |
| `Kladovo Municipality` | `Kladovo` | Serbia | 1 |
| `Malmö kommun` | `Malmö` | Sweden | 1 |
| `Abdera Municipality` | `Abdera` | Greece | 1 |
| `Municipal Unit of Nafplio` | `Nafplio` | Greece | 1 |
| **Total entries rewritten** | | | **26** |

### Notable merges

- **Belgrade, Serbia** — 3 sub-municipalities (Stari Grad, Savski Venac,
  Palilula) consolidated into a single `Belgrade` entry totalling **3**
  photos that previously appeared as 3 separate "cities" on the country
  card.
- **Brașov, Romania** — 2 plain-ASCII `Brasov` entries merged into the
  Unicode-correct `Brașov`, which already had 5 entries. Final total: **7**
  photos under one city label.
- **Rosh HaNikra, Israel** — both `Mate Asher Regional Council` (4 photos)
  and the legacy `Rosh HaNikra (Mate Asher)` label (3 photos) collapsed to
  one canonical `Rosh HaNikra` entry totalling **7** photos. Mate Asher is
  the regional council; Rosh HaNikra is the actual landmark Eduard
  photographed (GPS 33.09, 35.10 sits at the grottoes).
- **Pula, Croatia** — `Grad Pula` ("Grad" = "City of") simplified to `Pula`.
  No prior `Pula` entry existed; final total **5** photos.
- **Malmö, Sweden** — `Malmö kommun` collapsed into the existing `Malmö`
  cluster. Final total: **6** photos (5 stock + 1 own).

## Country city-count delta (`/travel` country cards)

Counts are distinct `place.city` values per country, before and after
normalisation. Countries unchanged are omitted.

| Country | Before | After | Delta |
|---|---|---|---|
| Croatia | 2 | 2 | 0 (rename only: Grad Pula -> Pula) |
| Denmark | 9 | 9 | 0 (rename only: Billund Municipality -> Billund) |
| Greece | 7 | 7 | 0 (3 admin renames, no merges) |
| Israel | 3 | 2 | -1 (Mate Asher + Rosh HaNikra (Mate Asher) -> Rosh HaNikra) |
| Romania | 6 | 5 | -1 (Brasov -> Brașov merged) |
| Serbia | 4 | 2 | -2 (3 sub-municipalities -> Belgrade; Kladovo Municipality -> Kladovo) |
| Sweden | 2 | 1 | -1 (Malmö kommun -> Malmö merged) |
| **Total** | **102 unique city/country pairs** | **97** | **-5** |

## Out-of-scope (intentionally left alone)

- `Istria County, Croatia` (3 photos) — county-level fallback for photos
  south of Pula whose true sub-city the cache cannot derive without a
  higher-zoom re-geocode. The brief explicitly warned not to merge
  truly-different cities. Left as-is.
- `Gibraltar, Gibraltar` vs `Gibraltar` (display-only mismatch on 2 entries)
  — orthogonal to the admin-suffix problem. Out of scope here.
- Catalogue entries with `place.city = null` — nothing to normalise.

## Verification

- `npm run lint` — 0 errors, 12 pre-existing warnings (unchanged).
- `npm run typecheck` — clean.
- Spot-checked GPS preservation on Belgrade / Rosh HaNikra / Brașov /
  Pula / Malmö entries — all original lat/lon values intact.
- Geocode cache (`scripts/.geocode-cache.json`) rewritten for 20 keys so
  a future `build-photo-catalogue.mjs --geocode` run does not re-emit
  admin-suffixed names from the cache.

## Reproducing

```bash
node scripts/normalize-place-names.mjs           # dry-run, prints diff
node scripts/normalize-place-names.mjs --write   # apply
```

The `NORMALISATION_MAP` at the top of the script is the single source of
truth for the rules. Adding a new rule is one line; the script handles
both the catalogue and the geocode cache in lock-step.
