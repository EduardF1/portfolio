# Photo location labeling tooling

## Problem

The portfolio's photo catalogue (`scripts/photo-catalogue.json`, 73 entries) is built by `scripts/build-photo-catalogue.mjs`, which reads EXIF GPS via PowerShell and reverse-geocodes through Nominatim. Eduard wants to expand to >=5 photos per trip drawn from `G:\Poze` (~38k images), but a meaningful fraction of those have no EXIF GPS because phone GPS was off during shooting. He still knows where every trip happened. The question: which tool/workflow lets us label the missing photos cheaply, on Windows, and feed the result back into the existing JSON pipeline without locking data into a proprietary format.

## Candidates

| Tool | Map UI | Write-back | Cost | Windows | Verdict |
|---|---|---|---|---|---|
| ExifTool | No (CLI) | EXIF / XMP | Free | Yes | Best as a *backend* for whatever else we pick; not a standalone solution. |
| GeoSetter | Yes | EXIF + .xmp sidecar | Free | Yes | Purpose-built for this task, but unmaintained since 2017; OSM tiles still work. |
| digiKam | Yes | EXIF + DB | Free | Yes | Powerful but heavyweight; imposes a DAM workflow on a 38k library. |
| Lightroom Classic | Yes (Map module) | EXIF + .xmp | Paid sub | Yes | Overkill if not already a subscriber. |
| darktable | Yes (geotagging view) | EXIF + .xmp | Free | Yes | Solid free alternative to Lightroom; geotagging is functional but not the focal point. |
| Photo Mechanic | Limited | EXIF + IPTC | Paid | Yes | Aimed at press workflow; no real geo-pick UI. |
| Custom Node CLI | No | JSON direct | Build it | Yes | Fast for batch inference; tedious for true unknowns. |
| Temporal inference in `build-photo-catalogue.mjs` | No | JSON direct | Build it | Yes | Free wins for the most common case: photos in a trip with at least one GPS neighbor. |

## Recommendation

**Hybrid: extend `build-photo-catalogue.mjs` with temporal inference first, then use GeoSetter for the residual unknowns.**

Rationale: most missing-GPS photos are *adjacent in time* to GPS-tagged shots from the same camera in the same trip; we can resolve them with zero UI work. The leftover stragglers (a whole day with phone GPS off, or scans/screenshots) are a much smaller set and well suited to a map-pick GUI. GeoSetter writes a vanilla `.xmp` sidecar plus optionally back-fills EXIF GPS, which `extract-exif.ps1` already reads, so the pipeline absorbs the result with no schema changes. ExifTool ships inside GeoSetter, so we get the canonical writer for free.

Trade-offs: GeoSetter is unmaintained (last release 2017) but stable for this read/write use case, and OpenStreetMap tile sources still work; digiKam and Lightroom both work but force a heavier ingestion workflow that we don't need here. Keeping inference inside `build-photo-catalogue.mjs` avoids a second source of truth.

## Quickstart

1. Implement the temporal inference pass in `build-photo-catalogue.mjs` (sketch below). Re-run `node scripts/build-photo-catalogue.mjs --folder 'G:\Poze' --write` and inspect `photo-catalogue.json` for `inferredPlace: true` entries.
2. For photos still without a place, install GeoSetter (`https://geosetter.de/en/download-en/`) and point it at the parent folder.
3. In GeoSetter: select the unlocated photos, drag them onto the map (or right-click -> Set Position), then **Images -> Save Changes** to write `.xmp` sidecars. Leave **Edit -> Preferences -> File Options -> Write to original file** *off* if you want to avoid touching the JPEG bytes.
4. Re-run the catalogue builder. `extract-exif.ps1` already parses GPS from sidecars when present; if not, add `Get-Item ${file}.xmp` fallback there.
5. Commit the refreshed `scripts/photo-catalogue.json` and `.geocode-cache.json`.

## Temporal inference pseudocode

```
INPUT: exifRows (already date-parsed and sorted by file path)
PARAMS:
  MAX_GAP_MINUTES = 90   # widest gap we still trust
  SAME_TRIP_HOURS = 36   # don't bridge across trips

sort exifRows by takenAt ascending
for each row R without GPS:
  before = nearest earlier row with GPS where (R.takenAt - before.takenAt) <= MAX_GAP_MINUTES
  after  = nearest later   row with GPS where (after.takenAt - R.takenAt) <= MAX_GAP_MINUTES
  if before AND after AND distance(before.gps, after.gps) < 50 km
    AND (after.takenAt - before.takenAt) <= SAME_TRIP_HOURS:
      R.gps = midpoint(before.gps, after.gps)   # or copy nearer neighbor
      R.place = before.place                    # they agree at city zoom
      R.inferredPlace = true
      R.inferredFrom  = [before.src, after.src]
  else if exactly one neighbor exists within MAX_GAP_MINUTES:
      R.gps  = neighbor.gps
      R.place = neighbor.place
      R.inferredPlace = true
      R.inferredFrom  = [neighbor.src]
  else:
      leave R unlabeled  # falls through to GeoSetter pass
```

Persist `inferredPlace` and `inferredFrom` so the UI (and a future audit) can downgrade or re-verify these entries without re-running the whole pipeline.
