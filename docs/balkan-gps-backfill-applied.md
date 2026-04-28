# Balkan trip GPS backfill — applied entries

Applied 2026-04-28 by `feat/balkan-trip-gps-backfill`. Backfills the previously
uncatalogued outbound leg (Aarhus -> Bucharest) plus the Mar 28 Nuremberg/Kassel
stops on the return. All photos in this batch carry real EXIF GPS — no
itinerary-synthesised coordinates were needed.

## Findings vs. expected itinerary

The confirmed itinerary was `Aarhus -> Hannover -> Prague -> Bratislava ->
Budapest -> Sibiu -> Bucharest -> Kladovo -> Belgrade -> Ljubljana -> Pula ->
Trieste -> Munich -> Nuremberg -> Kassel -> DK`. Two stops did not match the
photos as expected:

- **Hannover, DE (Mar 12)** — no photos. The Mar 12 cluster is at 54.07/9.98 =
  Neumünster (Schleswig-Holstein, ~270 km north of Hannover). The Hannover
  stop was either skipped or photo-less; Neumünster is what the camera roll
  shows for the day.
- **Sibiu, RO (Mar 16)** — no photos at Sibiu (45.79/24.13). The Mar 16 cluster
  is at 45.28/24.31 = Calimanesti (south of the Olt valley pass, between Sibiu
  and Bucharest). The pass-through happened, but the photo stops were further
  south.

Mar 22 has zero photos in the source archive (offline day, presumably).

All other planned cities (Prague, Bratislava, Budapest, Bucharest, Nuremberg,
Kassel, plus the already-catalogued Kladovo/Belgrade/Ljubljana/Pula/Trieste
chain) are covered.

Provenance tag:

- `[EXIF]`  — coordinates pulled directly from the photo's EXIF GPS.
- `[ITINERARY]` — coordinates synthesised from the day's expected city centroid (none in this batch).

Total new entries: 26.

| takenAt | src | place | provenance |
| --- | --- | --- | --- |
| 2026-03-11T22:17:33Z | trips/2026-03-balkans-roadtrip/IMG20260311221733.jpg | Aarhus, Denmark | [EXIF] |
| 2026-03-12T21:01:09Z | trips/2026-03-balkans-roadtrip/IMG20260312210109.jpg | Neumünster, Germany | [EXIF] |
| 2026-03-12T21:41:26Z | trips/2026-03-balkans-roadtrip/IMG20260312214126.jpg | Neumünster, Germany | [EXIF] |
| 2026-03-13T20:59:14Z | trips/2026-03-balkans-roadtrip/IMG20260313205914.jpg | Prague, Czechia | [EXIF] |
| 2026-03-13T22:15:23Z | trips/2026-03-balkans-roadtrip/IMG20260313221523.jpg | Prague, Czechia | [EXIF] |
| 2026-03-13T23:02:37Z | trips/2026-03-balkans-roadtrip/IMG20260313230237.jpg | Prague, Czechia | [EXIF] |
| 2026-03-14T01:33:22Z | trips/2026-03-balkans-roadtrip/IMG20260314013322.jpg | Prague, Czechia | [EXIF] |
| 2026-03-14T15:35:23Z | trips/2026-03-balkans-roadtrip/IMG20260314153523.jpg | Bratislava, Slovakia | [EXIF] |
| 2026-03-14T22:22:30Z | trips/2026-03-balkans-roadtrip/IMG20260314222230.jpg | Vecsés, Hungary | [EXIF] |
| 2026-03-15T12:54:27Z | trips/2026-03-balkans-roadtrip/IMG20260315125427.jpg | Kecskemét, Hungary | [EXIF] |
| 2026-03-16T13:30:55Z | trips/2026-03-balkans-roadtrip/IMG20260316133055.jpg | Calimanesti, Romania | [EXIF] |
| 2026-03-16T14:15:52Z | trips/2026-03-balkans-roadtrip/IMG20260316141552.jpg | Calimanesti, Romania | [EXIF] |
| 2026-03-17T00:20:10Z | trips/2026-03-balkans-roadtrip/IMG20260317002010.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-17T00:22:37Z | trips/2026-03-balkans-roadtrip/IMG20260317002237.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-17T00:25:19Z | trips/2026-03-balkans-roadtrip/IMG20260317002519.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-18T17:26:45Z | trips/2026-03-balkans-roadtrip/IMG20260318172645.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-18T21:19:40Z | trips/2026-03-balkans-roadtrip/IMG20260318211940.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-19T14:13:44Z | trips/2026-03-balkans-roadtrip/IMG20260319141344.jpg | Pantelimon, Romania | [EXIF] |
| 2026-03-19T14:14:00Z | trips/2026-03-balkans-roadtrip/IMG20260319141400.jpg | Pantelimon, Romania | [EXIF] |
| 2026-03-20T14:52:46Z | trips/2026-03-balkans-roadtrip/IMG20260320145246.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-20T20:07:59Z | trips/2026-03-balkans-roadtrip/IMG20260320200759.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-20T21:17:58Z | trips/2026-03-balkans-roadtrip/IMG20260320211758.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-21T20:45:02Z | trips/2026-03-balkans-roadtrip/IMG20260321204502.jpg | Bucharest, Romania | [EXIF] |
| 2026-03-28T17:34:46Z | trips/2026-03-balkans-roadtrip/IMG20260328173446.jpg | Nuremberg, Germany | [EXIF] |
| 2026-03-28T22:01:33Z | trips/2026-03-balkans-roadtrip/IMG20260328220133.jpg | Kassel, Germany | [EXIF] |
| 2026-03-29T23:46:55Z | trips/2026-03-balkans-roadtrip/IMG20260329234655.jpg | Aarhus, Denmark | [EXIF] |
