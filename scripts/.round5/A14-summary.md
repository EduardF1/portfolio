# A14 — Stock Photo Fill — summary

Run date: 2026-04-27
Branch: `feat/v1-polish-round4` (uncommitted)

## What landed

- **50 reuse-allowed stock photographs** added to 16 thin trip clusters, all from
  Pexels (single provider for catalogue consistency in v1).
- Each photo is downloaded from `images.pexels.com` at `?w=2400`, then re-encoded
  with `sharp` (mozjpeg, q=85, progressive, EXIF/metadata stripped, long-edge
  ≤2000 px). All landed within the 150–800 KB target band.
- `scripts/photo-catalogue.json` now has 189 entries total (was 139). Each new
  entry carries a `source: { type: "stock", provider, url, photographer,
  photographerUrl, license, licenseUrl }` block.
- `docs/photo-attributions.md` (new) — full attribution table with photographer
  links and source URLs for every stock photo, plus the Pexels License terms.
- Validation script (`scripts/.round5/a14-validate.mjs`) confirms every target
  cluster now has ≥5 photos, no duplicate `src`, no missing files.

## Per-trip counts (before → after)

| Folder | City target | Before | Stock added | After | Status |
|---|---|---|---|---|---|
| `2018-04-sweden` | Malmö | 1 | 4 | 5 | OK |
| `2019-07-belgium` | Brussels + Ghent | 3 | 2 | 5 | OK |
| `2019-07-luxembourg` | Luxembourg City | 1 | 4 | 5 | OK |
| `2020-02-denmark` | Horsens | 1 | 4 | 5 | OK |
| `2022-07-greece` | Kavala | 1 | 4 | 5 | OK |
| `2022-08-denmark` | Billund + Horsens | 3 | 2 | 5 | OK |
| `2022-08-romania` | Săcele (Brașov) | 1 | 4 | 5 | OK |
| `2022-10-denmark` | Randers area | 1 | 4 | 5 | OK |
| `2022-10-germany` | Hamburg | 2 | 3 | 5 | OK |
| `2022-12-romania` | Bucharest | 1 | 4 | 5 | OK |
| `2023-04-italy` | Milan | 4 | 1 | 5 | OK |
| `2023-07-turkey` | Istanbul + Kuşadası | 4 | 1 | 5 | OK |
| `2023-08-romania` | Săcele + Sinaia | 2 | 3 | 5 | OK |
| `2024-09-albania-saranda` | Saranda + Gjirokastra | 2 | 3 | 5 | OK |
| `2025-02-finland` | Helsinki | 2 | 3 | 5 | OK |
| `2025-03-romania` | Bucharest | 1 | 4 | 5 | OK |
| **Total** |  | **30** | **50** | **80** | — |

50 photos lands one above the 47-photo floor in the spec; the extra is the
foggy-Malmö Turning Torso shot that needed a PNG-source patch run after the
main batch (`scripts/.round5/a14-fetch-fog.mjs`).

## Provider breakdown

| Provider | Count |
|---|---|
| Pexels | 50 |

Pixabay was probed but returned `403` to `WebFetch`, so all stock came from
Pexels for a clean v1. Unsplash was searched for fallback options on
hard-to-cover cities (Kavala, Billund, Săcele) but Pexels turned out to have
strong area-specific coverage in every case, so a single-provider fill was
cleaner.

## Aesthetic / sourcing notes

- For **Săcele** (small town with no dedicated stock) and **Sinaia** trip
  clusters, sourced regional Brașov + Peleș Castle imagery — covers the visual
  story of the trip without forcing weak local material. Clearly within the
  brief's "regional / scenic-area level" allowance for under-stocked cities.
- For **Randers** (limited stock), used 2 genuine Randers shots (Haslund
  Church in winter, wind turbines) plus 2 Aarhus shots (cathedral / harbor
  and half-timbered street) — same East-Jutland visual region. The trip's
  GPS lat/lon (56.28, 10.47) sits ~30 km from Aarhus, so this is honest.
- For **Horsens** (one of Denmark's least-photographed major cities on stock
  sites), KAO MHG's aerial drone series covers most of the cluster. Less
  "moody editorial" than Eduard's existing photos, but faithful to the city.
  Padded with an Igor Meghega park-pathway shot for variety.
- For **Kavala**, plenty of strong harbor / hilltop-castle / sunset-rooftop
  material — likely the best surprise of the run. Photos by Tetiana Hutsu,
  Barkalı, Sevgi LALE, and Lydia Griva all on the editorial side rather than
  generic touristic.
- For **Bucharest** and **Brașov**, intentionally varied subjects to avoid
  five Palace-of-the-Parliament / five-Black-Church monocultures: chose
  Parliament + Triumphal Arch + Military Circle + a quiet street for 2022-12,
  and Cărturești Carusel + Parliament cloudy + Triumphal Arch night +
  charming street for 2025-03.
- For **Hamburg**, leaned on Speicherstadt + Elbphilharmonie pairing — the
  two visual icons of the city. The Wasserschloss B&W shot gives a moodier
  beat to complement Eduard's existing photos.
- For **Helsinki**, paired a winter aerial (Kseniia Bezz) with a moody
  cathedral-at-dusk (Tapio Haaja) and a tram-at-sunrise (Mingyang LIU) — fits
  Eduard's existing winter Helsinki aesthetic.

## Open follow-ups for downstream agents

1. **Lightbox UI should surface `source.photographer` for stock entries.**
   Right now the lightbox/UI assumes Eduard's own photos and shows no credit.
   When stock photos render, the UI should display "Photo by &lt;photographer&gt; on Pexels"
   near the caption. The catalogue already carries everything needed
   (`source.photographer`, `source.photographerUrl`, `source.provider`).
2. The `place` block on stock entries is hand-curated (display string only,
   no GPS), so any map / cluster code that filters by `hasGps` will continue
   to skip these — verified intentional. If we want stock photos to appear
   on the map at the city centroid, that's a separate decision.
3. Consider whether `takenAt: null` on stock entries should be inferred from
   the photo's content / Pexels upload date for chronological sorting in
   the gallery. Current behaviour: stock entries fall to the end of the
   sort. If gallery UX needs them interleaved, set a `takenAt` to the trip's
   median date.
4. **No stock photos depict identifiable people foregrounded.** The Galleria
   Vittorio Milan shot has shoppers visible but at scale, no portraits.
   Re-review if the Pexels License clause about "depicting identifiable
   people in a bad light" is later interpreted strictly — none of the
   selections are that, but worth a sanity pass before launch.
5. Pixabay was blocked by anti-bot on `WebFetch`, so v2 sourcing (if more
   variety wanted) should curl-with-realistic-UA the Pixabay detail pages
   directly, parsing photographer from `og:title` / page meta. Skipped here
   to keep the run within budget.

## Visual QA + post-swap notes

After the main run I read every cluster's photos to spot-check for watermark /
embedded text / visible-logo / branded-product / foregrounded-people violations.
Found and replaced:

- `2022-08-romania/pexels-brasov-tampa-cable-car-15511267.jpg` — replaced with
  `pexels-brasov-black-church-aerial-35410900.jpg` (Valeria Drozdova). The
  original had a giant **Coca-Cola** logo on the side of the cable-car gondola
  AND identifiable passengers visible inside the gondola (one in a face mask).
  Two violations stacked.
- `2022-12-romania/pexels-bucharest-palace-parliament-28898468.jpg` — replaced
  with `pexels-bucharest-odeon-theatre-8780208.jpg` (Ana-Maria Antonenco). The
  original had visible event-marketing text on tents in the foreground
  (`#RunInBucharest`, `Autonom`).
- `2025-03-romania/pexels-bucharest-charming-street-28898466.jpg` — replaced
  twice (first sub had graffiti reading "TALES" on a corrugated fence in the
  foreground). Final pick is `pexels-bucharest-neoclassical-tenement-17066982.jpg`
  by Roman Muntean — clean architectural shot of a neoclassical tenement
  facade with autumn trees, no text overlays.

Items intentionally accepted on review:
- The **Odeon Theatre** Bucharest shot has the building's "ODEON" architectural
  signage as part of the façade. That's an integral part of the architecture
  (like how Eduard's Helsinki bakery shot includes shop signage). Not a
  watermark. Kept.
- The **Istanbul Galata Tower** street shot has a small "VINTAGE CLOTHING"
  shop sign visible at distance on the left side of the alley. It's a real
  storefront in the streetscape, not embedded text or branding overlay,
  and the tower at golden hour is unambiguously the photo's subject. Kept.
- The **Galleria Vittorio Milan** photo has shoppers visible in the lower
  third of the frame at small scale — no portraits, no foregrounded faces,
  the soaring glass arcade is the subject. Kept.

## Files touched

- `public/photos/trips/<16 folders>/pexels-*.jpg` — 50 new files
- `scripts/photo-catalogue.json` — appended 50 entries (was 139, now 189)
- `docs/photo-attributions.md` — **new**, full attribution table for all 50
  stock photos with photographer + license URLs
- `scripts/.round5/a14-fetch-stock.mjs` — **new**, main download/optimise
  pipeline (49 of 50 photos)
- `scripts/.round5/a14-fetch-fog.mjs` — **new**, follow-up patch for the
  one photo whose CDN returned PNG-only
- `scripts/.round5/a14-fetch-bucharest-replacements.mjs` — **new**, swapped
  out the two photos that violated the watermark/text rule
- `scripts/.round5/a14-fetch-bucharest-replacement2.mjs` — **new**, swapped
  out the second sub-replacement (graffiti text in foreground)
- `scripts/.round5/a14-rebuild-attributions.mjs` — **new**, regenerates the
  attribution doc from the current catalogue (re-runnable if more swaps are
  ever needed)
- `scripts/.round5/a14-validate.mjs` — **new**, cluster-count + path resolver
- `scripts/.round5/a14-results.json` — **new**, per-pick result manifest
  from the main run
- `scripts/.round5/A14-summary.md` — **this file**

## Out-of-scope (not touched)

- `src/` — no UI / lightbox / catalogue-loader changes (Agent A14's brief is
  data + assets only)
- Eduard's existing photos — not modified
- No commit; branch left dirty for the orchestrator
- No build or e2e run — Agent A8 owns the build pipeline; A14 only validated
  catalogue paths
