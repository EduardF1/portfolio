# Balkan trip GPS backfill — 2026-04-28

> Workflow for backfilling GPS metadata on the 2026-03 Balkan road trip photos so they cluster correctly on `/travel`. Currently only Croatia=9, Slovenia=6, Serbia=8 photos carry GPS — the rest of the trip is invisible to the per-country map and per-trip clustering.

## Why this is needed

P-G's geocode pass (2026-04-28, see `scripts/.photo-classify/P-locations/`) found that 3,809 of Eduard's photos carry GPS — but the Balkan trip is dramatically under-represented. P11's GPS-cluster validation flagged `2026-03-balkans-roadtrip/` specifically for "transit legs Italy/Germany/Austria" where photo locations don't match. Most likely cause: the camera that took those photos didn't write GPS tags (or they were stripped by a copy/transfer), so the time-only photos can't be placed on the map without a separate GPS source.

## Pipeline (one of two sources)

### Source A — Google Timeline (preferred if you had Maps Location History on)

1. **Export your timeline data** for 2026-03-XX → 2026-03-YY (the trip dates):
   - Open Google Maps → menu → "Your timeline" → Settings (cog icon) → "Export Timeline data". You get a JSON dump.
   - On Android, alternatively: Maps app → profile → "Your data in Maps" → "Download your data" → select Location History.
2. **Convert JSON → GPX** using the well-maintained tool [`location-history-json-converter`](https://github.com/Scarygami/location-history-json-converter):
   ```
   pip install --user location-history-json-converter
   location-history-json-converter Records.json balkan-trip-2026-03.gpx -f gpx -s 2026-03-XX -e 2026-03-YY
   ```
3. Skip to **Apply** below.

### Source B — third-party GPS logger (Strava / `Geo Tracker` / etc.)

If you used a phone app to record the trip, export the activities for the trip date range as `.gpx` files. Concatenate them into one merged track if needed (any `gpsbabel` build can do this: `gpsbabel -i gpx -f a.gpx -f b.gpx -o gpx -F merged.gpx`).

## Apply — exiftool geotag

ExifTool is already installed on this machine (P-F installed v13.57 via winget on 2026-04-28). To geotag a photo folder against a GPX track:

```
exiftool -geotag "balkan-trip-2026-03.gpx" -overwrite_original_in_place "G:\Poze\<balkan-trip-folder>\"
```

**STOP — read this before running**: `-overwrite_original_in_place` modifies the JPEGs in place (adds GPS EXIF tags, doesn't touch pixels). Per Eduard's "double check before deleting" rule:
- **First, run a dry pass** to confirm the time-window matches: `exiftool -geotag "balkan-trip-2026-03.gpx" -api GeoMaxIntSecs=1800 -p '$filename: $GPSLatitude $GPSLongitude' "G:\Poze\<folder>\"` — this prints what WOULD be tagged without writing.
- If the dry pass shows blank or wrong-country results, the time zone of the photos may not match the GPX track's UTC. ExifTool's `-geotime "${DateTimeOriginal}+02:00"` (CEST) sets the offset.
- Only when the dry pass looks right, run the actual write WITHOUT the `_in_place` suffix first to keep `<filename>_original` backups: `exiftool -geotag track.gpx folder/`. Confirm a sample, then `del *_original` (or keep them, they're cheap).

## After the write

1. Re-run P-A2-style scan over the affected folder so EXIF GPS lands in `scripts/.photo-classify/<slice>/scan.ndjson`.
2. Re-run P-G's geocoder (`scripts/.photo-classify/P-locations/run.ps1`). It re-uses the 226-cell Nominatim cache so only NEW cells hit the network. Most Balkan-leg GPS will be in cells that already have country/city data for nearby trips, so it should finish in seconds.
3. Verify: `/travel` heatmap and per-trip page for `2026-03-balkans-roadtrip` should populate the missing legs.

## What this DOES NOT do

- **No deletes, no moves, no copies.** Only adds GPS EXIF to the existing JPEG/HEIC files in place.
- **No content changes.** Pixel data isn't touched; ExifTool only writes EXIF metadata blocks.
- **No portfolio publication.** The new GPS data only feeds the local catalogue. Anything that shows up on `eduardfischer.dev` still goes through the existing per-trip page workflow (`public/photos/trips/<slug>/`).

## Open question

Which source do you want to use? If Google Timeline is on, source A is fastest (one export, done). If not, you'll need to find a tracker app that was logging during the trip — Strava's a common pick if you had any walks recorded.
