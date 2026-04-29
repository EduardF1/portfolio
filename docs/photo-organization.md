# Photo organization

> Path renamed from `G:\Poze` to `G:\Photos` on 2026-04-29; pre-rename log entries reference the old name and remain valid.

How travel photography is laid out, named, and catalogued for `EduardFischer.dev`.
This doc reflects the convention established in v1-polish round 4–5 by Agents A1
(reorganization), A10 (archive discovery), and A14 (stock fill). Read it before
adding a new trip, swapping a hero photo, or wiring a new image into a page.

If this doc and the actual file tree disagree, the file tree wins — open a PR to
fix the doc.

## 1. Folder taxonomy

Everything lives under `public/photos/`:

```
public/photos/
  trips/
    <YYYY>-<MM>-<country-or-region-slug>/
      <archive or stock files>
  personal/
    <slug-named hero photos>
```

### `trips/`

Chronologically ordered per-trip clusters. Folder slug is:

- `YYYY-MM-<country-slug>` for single-country trips — e.g.
  `2025-02-finland`, `2022-12-romania`, `2023-04-italy`.
- `YYYY-MM-<region-slug>` for multi-country trips, hyphen-joining country slugs
  in the order they were visited — e.g.
  `2025-04-czechia-poland-slovakia-austria`,
  `2026-03-balkans-roadtrip`,
  `2025-09-andalusia-gibraltar` (region name is fine when "andalusia + gibraltar"
  reads more naturally than "spain-gibraltar").

The folder slug is what shows up as `/travel/photos/<slug>` on the live site, so
it has to be URL-safe ASCII kebab-case.

### `personal/`

Non-trip portraits and slug-named hero photos that pages reference directly by
filename — e.g.

- `bvb-yellow-wall-suedtribuene.jpg` — BVB hero on `/personal`
- `apr-2025-vienna.jpg` — Vienna car-adjacent shot
- `mar-2024-spring-evening.jpg`, `nov-2023-autumn.jpg`, `may-2024-late-spring.jpg`
- `mar-2026-pula.jpg`, `mar-2026-recent-trip.jpg`, `apr-2023-milan.jpg`

These are deliberately **not** in `scripts/photo-catalogue.json`. The catalogue
drives the trip-photos pages; `personal/` files are referenced by hard-coded
paths in pages like `src/app/[locale]/personal/page.tsx`. Treat them as page
assets, not gallery entries.

> Naming note: `personal/` is the current name (set in round 5). If we later
> want to repurpose this folder for non-Eduard portraits, consider renaming to
> `featured/` to make the page-asset semantics clearer. See open question at the
> bottom.

## 2. Filename conventions

| Kind | Pattern | Example |
| --- | --- | --- |
| Archive (Eduard's own camera) | original camera filename, untouched | `IMG_20180323_113715.jpg`, `IMG20250917154701.jpg` |
| Slug-named hero (under `personal/`) | kebab-case meaningful slug | `bvb-yellow-wall-suedtribuene.jpg`, `mar-2024-spring-evening.jpg` |
| Stock photo (under `trips/<YYYY-MM-…>/`) | `<provider>-<location-slug>-<id>.jpg` | `pexels-helsinki-cathedral-dusk-2311602.jpg`, `pexels-malmo-turning-torso-7019069.jpg` |

Rules:

- `.jpg` extension, lowercase. No `.JPG`, no `.jpeg`.
- ASCII only. No spaces, no unicode in filenames (it survives but breaks Windows
  tooling and URL encoding).
- Camera filenames vary by device — preserve them as-is so the archive stays
  reversible. We've seen `IMG_YYYYMMDD_HHMMSS.jpg` (Huawei), `IMGYYYYMMDDHHMMSS.jpg`
  (OnePlus), and a few `IMG_NNNN.JPG` (older devices). All are fine; the
  catalogue keys off the path, not the format.
- For stock, the trailing `<id>` is the provider's photo ID. It's how we trace
  the file back to the source URL during attribution audits.

## 3. Catalogue schema (`scripts/photo-catalogue.json`)

The catalogue is a JSON array. Each entry describes one photo on disk under
`public/photos/`. The full shape:

```json
{
  "src": "trips/2025-09-andalusia-gibraltar/IMG20250917154701.jpg",
  "takenAt": "2025-09-17T15:47:01Z",
  "hasGps": true,
  "cameraModel": "OnePlus 11 5G",
  "gps": { "lat": 36.72, "lon": -4.42 },
  "place": {
    "city": "Málaga",
    "country": "Spain",
    "display": "Málaga, Spain"
  },
  "source": {
    "type": "stock",
    "provider": "Pexels",
    "photographer": "Tapio Haaja",
    "photographerUrl": "https://www.pexels.com/@tapio-haaja-1214336/",
    "url": "https://www.pexels.com/photo/.../2311602/",
    "license": "Pexels License",
    "licenseUrl": "https://www.pexels.com/license/"
  }
}
```

### Field rules

- `src` — path relative to `public/photos/`, forward-slashed. Must resolve to a
  real file. Validation script: `scripts/.round5/validate-photos.mjs`.
- `takenAt` — ISO 8601 UTC. Pulled from EXIF for archive photos. May be `null`
  for stock (Pexels upload date is not the capture date; we leave it `null` and
  let those entries sort to the end).
- `hasGps` — true if EXIF carried real coordinates. Map / cluster code keys off
  this so it can skip approximated entries.
- `cameraModel` — EXIF `Make Model`. Useful for audit / dedupe; absent on stock.
- `gps` — `{ lat, lon }` in decimal degrees, WGS84. Required when `hasGps`.
  May also be present for stock (hand-curated city centroid) but stock is
  conventionally omitted from the map layer.
- `place` — reverse-geocoded via Nominatim and cached in
  `scripts/.geocode-cache.json`. `display` is what the UI shows.
- `inferredPlace` / `inferredFrom` — present when the entry's `place` was
  derived from temporally-adjacent GPS neighbours rather than its own EXIF. See
  `docs/photo-location-tooling.md` for the inference rule.

### `source` block

- **Personal photos (Eduard's own)**: `source` is **omitted** entirely. Empirically
  no entry in the current catalogue carries `source.type: "personal"`; the
  absence of the block IS the marker. (If we ever need to disambiguate, the
  current convention is "no `source` block ⇒ personal".)
- **Stock photos**: `source.type === "stock"` is required, plus at minimum
  `provider` and `photographer`. In practice all v1 stock is Pexels, with the
  full block above (provider, url, photographer, photographerUrl, license,
  licenseUrl). Keep it complete — `docs/photo-attributions.md` is generated from
  these fields.

### Hero photos under `personal/`

Hero photos under `public/photos/personal/` are **not** in the catalogue. They're
referenced by hard-coded paths in pages and are not part of the trip-gallery
pipeline.

## 4. Adding a new trip

1. **Decide the folder slug**: `YYYY-MM-<country-slug>` or
   `YYYY-MM-<region-slug>` per section 1.
2. **Create the folder**: `public/photos/trips/<slug>/`
3. **Drop photos in**. For Eduard's own shots from `G:\Photos` or `D:\Portfolio`,
   resize first via `scripts/copy-and-resize-photos.ps1` (long-edge 2000 px,
   JPEG q85, EXIF preserved — the catalogue builder needs EXIF to read GPS and
   `takenAt`).
4. **Rebuild the catalogue.**
   - Full rebuild: `node scripts/build-photo-catalogue.mjs --folder 'G:\Photos' --write`
     (reads EXIF, reverse-geocodes via Nominatim, writes
     `scripts/photo-catalogue.json` and updates `.geocode-cache.json`).
   - Incremental for a single trip: copy and adapt `scripts/extend-catalogue.mjs`,
     which takes a hardcoded trip-window list and only appends matches. Faster
     when only one new trip moved.
5. **Validate**: `node scripts/.round5/validate-photos.mjs` (no missing files,
   no orphan files, page refs resolve).
6. **Commit folder + catalogue + cache together** so the trip lands as one
   atomic change.

## 5. Adding a stock photo

Stock fill is acceptable when archive material is thin (< 5 photos for a trip
the gallery surfaces). Rules:

1. **Source from Pexels / Unsplash / Pixabay**, reuse-allowed only. v1 used
   Pexels exclusively for catalogue consistency. See `docs/backlog.md` and
   `scripts/.round5/A14-summary.md` for prior sourcing decisions and the
   per-trip rationale.
2. **Optimize via sharp**: long-edge ≤ 2000 px, JPEG mozjpeg q=85, progressive,
   strip EXIF/metadata. Target file size 150–800 KB.
3. **Filename**: `<provider>-<location>-<id>.jpg` — e.g.
   `pexels-helsinki-cathedral-dusk-2311602.jpg`. Provider lowercase, location
   slug kebab-case, id is the provider's photo ID.
4. **Place under** `public/photos/trips/<YYYY-MM-…>/` matching the trip cluster.
5. **Append a catalogue entry** with the full `source` block (see section 3).
   `hasGps: false`, `gps` omitted (or hand-curated city centroid if the map
   layer needs it later), `takenAt: null`.
6. **Update `docs/photo-attributions.md`** — the master attribution table.
   Photographer name, profile link, source URL.

The full pipeline is captured in `scripts/.round5/a14-fetch-stock.mjs`; reuse it
for round-2 batches.

## 6. Banned content

Per Eduard's standing rules. Remove on sight; never accept these in stock fills
or new archive uploads:

- **Recognisable relatives** (faces, even with verbal consent — require written
  per-photo re-confirmation). Children of relatives are excluded outright.
- **Document photos**: any frame where a printed page, ID, passport, contract,
  receipt, screen-of-document, mailpiece, or whiteboard is the dominant
  content, or where text on such items is readable in the background.
- **Work environments**: indoor photos at any current or former employer's
  site (Netcompany, Greenbyte, Boozt, prior); whiteboards / screens from any
  client engagement; other employees' faces. Excluded indefinitely.
- **Apartment interiors** with identifying detail (mail, address, parcel
  labels, floor-plan-revealing wide shots, window views identifying the
  building). Cropped detail shots (e.g. plant, desk corner) are case-by-case.
- Identifiable third parties without consent (faces in foreground, recognisable
  individuals).
- VELO nicotine product placement, or any similar product foregrounded on
  tables / surfaces.
- Military or restricted-area signage (MOD signs, base entry boards, etc.).
- Politically charged imagery — propaganda reproductions, swastikas, dictator
  iconography in non-museum contexts. Museum interiors with period material are
  case-by-case (kept the Tito / Yugoslavia map exhibit; removed the standalone
  Tito-Castro-Che frame and Tito-themed restaurant).
- License plates and readable car-park signage. Most plate-bearing shots can be
  cropped or replaced; otherwise drop.
- Near-duplicates: same GPS, same scene, < 60 s apart in `takenAt`. Keep the
  largest-filesize / sharpest frame, drop the rest.

When in doubt, flag in the agent summary rather than silently keeping. See
`scripts/.round5/A1-summary.md` Phase 1 for the working audit log format.

### 6.1 Source-folder policy

Per the privacy sweep at `scripts/.photo-classify/P13/sensitive-sweep.md`. Build
script `scripts/build-photo-catalogue.mjs` accepts only `--folder` args, so this
is policy not enforcement — but a documented blocklist prevents accidental
imports from sensitive directories.

**Approved import sources** (safe to pass to `--folder`):

- `G:\Photos\`
- `D:\Portfolio\poze\`
- Loose `D:\Portfolio\IMG*.jpg` at drive root (after manual sort)

**Blocked import sources** (never pass to `--folder`):

- `G:\Important Documents\`, `D:\Portfolio\Important Documents\` — Cat-2 (residence permit, police, medical, tax, housing, qualifications, others' documents)
- `G:\Documents\`, `D:\Portfolio\Documents\` — Cat-2 mixed PDFs
- `G:\Citizenship\`, `G:\Citizenship_Application\` — passport / ID / birth-cert scans
- `G:\Whatsapp\` — group-chat exports with relatives + children of relatives
- `G:\backup media telefon\` — older phone snapshot, mixed sensitive content
- `G:\backup NC (24.02.2026)\` — **Netcompany NDA**, work artefacts
- `G:\Desktop Files (Before Reinstall)\` — pre-reinstall dump with screenshots / login screens
- `G:\Calendars\` — meeting subjects revealing employer / client names
- All coursework folders (`G:\AU-MSC\`, `G:\University\`, `G:\IBA Studies\`,
  `G:\VIA_UCL*\`, `D:\Portfolio\AU-MSC\`, `D:\Portfolio\University\`,
  `D:\Portfolio\master thesis\`) — group-work consent required
- `D:\Portfolio\Text files\` — `*-stdout.txt` / `*-stderr.txt` may leak
  work-machine paths, employer hostnames, ticket IDs

For ambiguous slugs (e.g. `mar-2026-recent-trip` — too vague), the photo is
held out of the page until renamed to a content-descriptive slug encoding both
location AND subject.

## 7. Trip-detail target

Each `/travel/photos/<slug>` page should have **≥ 5 photos**. Stock fill is the
acceptable lever when archive material is thin — round 5 brought 16 thin
clusters up to 5 each via 50 Pexels photos. Going beyond 5 per trip is fine when
the archive supports it; don't pad past 5 with stock just to inflate counts.

## 8. Related docs

- `docs/photo-attributions.md` — the master stock attribution table. Update on
  every stock add/remove.
- `docs/photo-location-tooling.md` — temporal-inference + GeoSetter workflow for
  photos missing GPS.
- `docs/trip-clusters.md` — narrative grouping of trips for the photos page.
- `docs/backlog.md` — outstanding photo work and prior decisions.

## Open questions for Eduard

- Is `personal/` the right folder name for slug-named hero photos, or should it
  be `featured/` (or similar)? Current contents are not all "personal" — e.g.
  `bvb-yellow-wall-suedtribuene.jpg` is a stadium hero, `apr-2023-milan.jpg` is
  a travel hero reused outside a trip cluster. A rename would cascade through
  `src/app/[locale]/personal/page.tsx` refs and any tests.
- Do we want `source.type: "personal"` made explicit in the catalogue (so every
  entry carries a `source` block), or stay with the current "absent ⇒ personal"
  convention? Current convention is fewer keystrokes; explicit is friendlier to
  type-safe consumers.
