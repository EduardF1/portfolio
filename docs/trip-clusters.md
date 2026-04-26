# Trip clusters from photo archive — observational reference

> **Senior Dev C, 2026-04-26.** Reference data for PO + Senior Dev A (who is independently building per-trip pages). Source: `scripts/photo-catalogue.json` (253 entries; **215 with EXIF GPS**; 20 distinct countries). Clustering rule: `(country, year-month)` with same-country same-month grouped together. Cross-border trips that span a single 14-day window appear as adjacent clusters with a "linked trip" hint.
>
> Sort: newest first. "Photos" is the count after EXIF GPS resolution. "Primary city" is the most-frequent or most-recent EXIF-resolved city in that cluster (Nominatim names — `Grad Pula`, `Stari Grad Urban Municipality`, etc., as the catalogue stores them).
>
> This is **observational** — Senior Dev A is the source of truth for the per-trip page generation; this document is for PO review when triaging which clusters become standalone `/travel/{slug}` pages and which fold into a country-level page.

## Master cluster table

| Country | Year-Month | Date range | Photos | Primary cities | Trip note |
|---|---|---|---|---:|---|
| **Germany** | 2026-03 | 2026-03-12 → 2026-03-27 | 13 | Landsberg am Lech, Neumünster, Schwangau | Bavaria + Schleswig-Holstein. Likely 2 sub-trips or one long road tour. |
| **Croatia** | 2026-03 | 2026-03-25 | 9 | Grad Pula, Istria County | Linked with Slovenia/Italy/Austria 2026-03 — Adriatic loop. |
| **Italy** | 2026-03 | 2026-03-25 → 2026-03-26 | 10 | Trieste | Adriatic loop continuation. |
| **Slovenia** | 2026-03 | 2026-03-25 | 6 | Ljubljana | Adriatic loop continuation. |
| **Austria** | 2026-03 | 2026-03-26 | 2 | Hermagor-Pressegger See, Matrei in Osttirol | Adriatic loop return leg. |
| **Serbia** | 2026-03 | 2026-03-23 → 2026-03-24 | 8 | Stari Grad Urban Municipality (Belgrade core), Savski Venac (Belgrade), Palilula (Belgrade), Kladovo Municipality | Belgrade city break + Danube. Stand-alone earlier in the same trip-cluster as the Adriatic loop or independent — ambiguous from EXIF alone. |
| **Romania** | 2025-12 | 2025-12-25 → 2025-12-30 | 3 | Bucharest | Christmas / family. |
| **Spain** | 2025-09 | 2025-09-12 → 2025-09-21 | 10 | Málaga, Almuñécar, Salobreña, Torremolinos | Costa del Sol week. |
| **Gibraltar** | 2025-09 | 2025-09-15 | 3 | Gibraltar | Day trip from Spain 2025-09. **Linked.** |
| **Denmark** | 2025-08 | 2025-08-24 | 1 | Esbjerg | Domestic single-day. |
| **Denmark** | 2025-05 | 2025-05-27 | 1 | Copenhagen | Domestic single-day. |
| **Slovakia** | 2025-04 | 2025-04-14 → 2025-04-17 | 17 | Bratislava, Banská Bystrica, Harmanec, Malá Franková | Largest single Slovak cluster. |
| **Austria** | 2025-04 | 2025-04-13 | 12 | Vienna | Vienna weekend. **Linked** with Slovakia 2025-04 (same calendar week). |
| **Poland** | 2025-04 | 2025-04-16 → 2025-04-23 | 9 | Kraków, Katowice, Zakopane, Murzasichle, Brzezinka (Auschwitz), Brzegi, Sromowce Wyżne | South-Poland loop. **Linked** with Slovakia (overlap 2025-04-16/17). |
| **Czechia** | 2025-04 | 2025-04-26 | 2 | Jaroslavice | Return leg. **Linked** with Poland 2025-04. |
| **Romania** | 2025-03 | 2025-03-30 → 2025-03-31 | 6 | Bucharest | Long weekend. |
| **Finland** | 2025-02 | 2025-02-21 → 2025-02-22 | 2 | Helsinki | City break. |
| **Denmark** | 2025-02 | 2025-02-03 | 1 | Copenhagen | Domestic single-day. |
| **Denmark** | 2025-01 | 2025-01-01 → 2025-01-22 | 2 | Helsingør Municipality, Horsens | Domestic. |
| **Romania** | 2024-09 | 2024-09-26 | 1 | Brașov | Domestic Romania single-day (likely transit shot). |
| **Albania** | 2024-09 | 2024-09-18 → 2024-09-24 | 7 | Saranda, Gjirokastra, Mesopotam | Southern-Albania loop. |
| **Romania** | 2023-08 | 2023-08-24 → 2023-08-29 | 12 | București, Sinaia, Bușteni, Săcele, Moroeni, Turda | Carpathians + Bucharest summer trip. |
| **Turkey** | 2023-07 | 2023-07-10 → 2023-07-16 | 10 | Istanbul, Kuşadası, Denizli (Pamukkale) | Aegean loop. |
| **Denmark** | 2023-07 | 2023-07-03 | 1 | Herning Municipality | Domestic single-day. |
| **Denmark** | 2023-06 | 2023-06-14 | 1 | Herning Municipality | Domestic single-day. |
| **Italy** | 2023-04 | 2023-04-02 → 2023-04-05 | 13 | Milan | Milan long-weekend. |
| **Denmark** | 2023-04 | 2023-04-08 | 2 | Aarhus | Domestic. |
| **Denmark** | 2023-03 | 2023-03-16 | 1 | Herning Municipality | Domestic. |
| **Denmark** | 2023-02 | 2023-02-02 → 2023-02-11 | 5 | Horsens, Ringkøbing-Skjern Municipality, Varde Municipality | West-Jutland mini-loop. |
| **Romania** | 2022-12 | 2022-12-25 | 1 | București | Christmas. |
| **Germany** | 2022-10 | 2022-10-21 → 2022-10-22 | 15 | Hamburg, Munster | North-Germany weekend. |
| **Denmark** | 2022-10 | 2022-10-15 | 2 | (no city resolved) | Domestic. EXIF GPS but Nominatim couldn't resolve to a city — likely rural/coast. |
| **Denmark** | 2022-09 | 2022-09-10 | 3 | Viborg Municipality | Domestic. |
| **Denmark** | 2022-08 | 2022-08-10 → 2022-08-27 | 11 | Billund Municipality, Horsens | Multi-trip / summer in Jutland (LEGOLAND likely). |
| **Romania** | 2022-08 | 2022-08-07 | 2 | Predeal, Săcele | Carpathians weekend. |
| **Greece** | 2022-07 | 2022-07-17 | 1 | Kavala | Single shot — possibly transit through northern Greece. |
| **Denmark** | 2022-03 | 2022-03-29 | 1 | Horsens | Domestic. |
| **Denmark** | 2020-02 | 2020-02-17 | 2 | Horsens | Domestic. |
| **Belgium** | 2019-07 | 2019-07-29 → 2019-07-31 | 4 | Brussels, Ghent, Bastogne | Belgium summer trip. |
| **Luxembourg** | 2019-07 | 2019-07-30 | 1 | Luxembourg | Day trip. **Linked** with Belgium 2019-07. |
| **Turkey** | 2019-07 | 2019-07-16 | 1 | Manavgat | Antalya region. Likely a different earlier-July leg of the same Turkey holiday. |
| **Sweden** | 2018-04 | 2018-04-08 | 1 | Malmö kommun | Day trip from Copenhagen. |

## Cluster-level summary

| Metric | Value |
|---|---|
| Distinct (country × year-month) clusters | **42** |
| Distinct international trip-events (clusters merged where same trip spans countries within 14 days) | **~20–25** (see "Linked trips" below) |
| Distinct countries with at least one photo | **20** |
| Countries with ≥10 photos in a single cluster | **9** (Germany 2026-03, Italy 2023-04, Italy 2026-03, Spain 2025-09, Slovakia 2025-04, Austria 2025-04, Romania 2023-08, Turkey 2023-07, Germany 2022-10) |
| Largest single cluster | Slovakia 2025-04 — 17 photos |
| Earliest dated photo | 2018-04-08 (Malmö) |
| Latest dated photo | 2026-03-27 (Germany) |

### Identified multi-country trip-events (linked clusters)

These are obvious "one trip, multiple countries" patterns from contiguous date ranges. Useful for Senior Dev A's per-trip page generation:

1. **2026-03 Adriatic + Balkans loop** (Mar 12 – Mar 27): Germany ↔ Austria ↔ Italy ↔ Slovenia ↔ Croatia ↔ Serbia. 48 photos across 6 countries. **A single rich travelogue page candidate.**
2. **2025-04 Central-Europe loop** (Apr 13 – Apr 26): Austria → Slovakia → Poland → Czechia. 40 photos across 4 countries. **Another travelogue candidate.**
3. **2025-09 Costa del Sol + Gibraltar** (Sep 12 – Sep 21): Spain + Gibraltar day-trip. 13 photos.
4. **2019-07 Western-Europe trip** (Jul 29 – Jul 31): Belgium + Luxembourg. 5 photos. Plus separate Turkey leg same month.

### Domestic-Denmark cluster note

Denmark dominates the count by cluster but lightly by photos (~32 photos across 13 separate dates). Most are 1–3-photo single-day shots (Horsens / Aarhus / Copenhagen / Herning / Esbjerg / Helsingør). Recommendation for Senior Dev A: roll all Denmark clusters into a **single `/travel/denmark` page** rather than per-date trip pages.

## Gap analysis vs. `src/lib/travel-locations.ts`

The `getTravelDestinations()` function in `src/lib/travel-locations.ts` derives its country list dynamically from `scripts/photo-catalogue.json` — there is **no static "countries Eduard claims to have visited" list** to gap-check against. The 20 countries surfaced on `/travel` come directly from the catalogue.

Therefore, the gap analysis is between:

- **What's in the catalogue** (and thus on the live `/travel` map) → 20 countries.
- **What Eduard has actually been to but isn't represented in EXIF** → unknown without further input from Eduard.

### Likely-visited countries NOT in the catalogue (informed guesses from CV / context — Eduard to confirm)

These are not in the photo archive but are plausible omissions worth Eduard checking against his actual travel history:

| Country | Reason for guess |
|---|---|
| **Netherlands** | Common transit/short-trip destination from DK; not in the 20-country list. |
| **France** | Common European destination; absent. |
| **Norway** | Eduard lists "Norwegian" as a limited-working language — usually correlates with at least one trip. |
| **Hungary** | Adjacent to the 2025-04 Slovakia cluster; might have been a short side-trip without photos. |
| **United Kingdom** | Common career-adjacent destination; absent. |
| **Bulgaria** | Adjacent to Romania; common road-trip extension. |
| **Bosnia and Herzegovina, Montenegro, North Macedonia** | Adjacent to the 2026-03 Adriatic + Balkans loop; might have been quietly traversed without photos. |
| **Norway / Iceland / Faroe Islands** | Nordic-region completeness. |

**This list is speculative** and intentionally framed as questions, not assertions. Action item for Eduard / PO: confirm which (if any) belong on the travel map even without photo evidence, and whether `src/lib/travel-locations.ts` should grow a static "additionally visited" list to surface them as un-pinned dots on the map. Recommended size: **S, 1–2h** to add a static augmentation list and merge it with the EXIF-derived list.

### Photos without GPS — context only

38 of 253 photos have no EXIF GPS. Distribution by camera model:

- OnePlus 11 5G: 20 (likely Eduard's current daily phone, GPS disabled)
- CDY-NX9A (Huawei P30 Lite): 10
- RNE-L21 (Huawei Mate 10 Lite): 6
- ALE-L21 (Huawei P9 Lite): 2

By year: 2 (2016), 3 (2018), 3 (2019), 2 (2022), 10 (2023), 18 (2024). The 2024 spike correlates with the OnePlus 11 — likely the location-services-disabled subset. **Action item for Eduard**: turning location services on for the OnePlus 11 going forward would let future trips auto-cluster without manual tagging.

## Photo files in the working tree

The 9 hand-curated photos in `public/photos/` (apr-2023-milan.jpg, apr-2025-vienna.jpg, etc.) are a **separate manual selection** for the `/personal` and `/travel` listing pages, not the same 253-entry archive. The full archive lives elsewhere (likely `D:\Portfolio` per session memory) and only the EXIF metadata + filenames are committed to `scripts/photo-catalogue.json`. PO note: when Senior Dev A generates per-trip pages, they will likely reference more of the archive — coordinate on which photos actually copy into `public/photos/`.
