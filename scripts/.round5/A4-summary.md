# A4 — Travel Page Restructure (Round 5)

Branch: `feat/v1-polish-round4` (uncommitted, per orchestrator instruction).

## Eduard's request (verbatim)

> "I want the format from before with the link to trip details in the country name card."
> "No latest trip, just all the trips with their dates (month and year) and see trip which navigates to the trip details."

## Files modified

- `src/app/[locale]/travel/page.tsx` — restructured (see below).
- `messages/en.json` — dropped `viewLatestTrip`, `recentTripsKicker`, `recentTripsHeading`; added `seeTrip`, `allTripsKicker`.
- `messages/da.json` — same key set, Danish strings.
- `src/app/[locale]/travel/travel.test.tsx` — extended with three new assertions covering the round-5 layout.
- `src/app/[locale]/collection-pages.test.tsx` — updated the `travel` namespace mock so `seeTrip` / `allTripsKicker` resolve and the dropped keys no longer leak into expectations.

## Files created

- `src/app/[locale]/travel/photos/[slug]/trip-photos.test.tsx` — new unit-test file for the trip-details route. Covers `generateStaticParams`, render of headline + month label + back link for a known slug, `notFound()` for an unknown slug, and `generateMetadata` for both branches.

## New routes created

None — `src/app/[locale]/travel/photos/[slug]/page.tsx` already existed (shipped in commit `5619b64` along with `getTrips()`/`generateStaticParams()`/`PhotoLightbox`). I only added the dedicated test file. Per-trip pages were already in production; the backlog item "Per-trip travel pages with photo lightboxes" can be marked as done in `docs/backlog.md` (left for the PO).

## "Latest trip" UX removal locations

- **`src/app/[locale]/travel/page.tsx`** — removed:
  - The `viewLatestTrip` pill that rendered "Latest: {city}, {month} ({N photos})" inside each country tile (replaced with a plain "See trip →" affordance).
  - The "Recent trips / Latest from the road" section (slice of 6 newest clusters); replaced with a full "All trips" section that renders every cluster, sorted newest first (28 trips today).
  - The `responsiveGridColsClass` import and the dynamic-cap call site (the all-trips grid now uses fixed `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` because we always have ≥3 trips in production; collapsing to a single column for ≤2 trips no longer applies).
- **`messages/en.json` / `messages/da.json`** — removed the three keys above.
- **`src/app/[locale]/collection-pages.test.tsx`** — removed the `recentTripsKicker` / `recentTripsHeading` mock entries.

## Country-card link layout

Each tile in the "By country" grid now has TWO interactive surfaces, both targeting `/travel/photos/{latest-slug}` for that country:

1. The country name itself — `<Link>` wrapping the serif `2xl` heading. Hover changes colour to `text-accent`. This satisfies Eduard's "link to trip details in the country name card".
2. A small `See trip →` affordance below the cities list, in `text-accent` with `hover:underline`, for clarity.

When a country has no clustered trip in the catalogue (no GPS-tagged photos for that country yet), the country name renders as plain text and the "See trip →" affordance is suppressed — graceful fallback for the destinations-only list.

The "All trips" section below the country grid renders one card per cluster (28 today). Each card shows: cover photo, country (uppercase mono), `{primaryCity ?? country}, {monthLabel}` headline, photo count, and an in-card `See trip →` affordance. The whole card is one big `<Link>` to keep the click target generous on mobile.

## i18n keys

| Locale | Removed | Added |
|---|---|---|
| `travel.viewLatestTrip` | yes | — |
| `travel.recentTripsKicker` | yes | — |
| `travel.recentTripsHeading` | yes | — |
| `travel.seeTrip` | — | EN: `See trip` / DA: `Se rejse` |
| `travel.allTripsKicker` | — | EN: `All trips` / DA: `Alle rejser` |

Other travel keys retained (`kicker`, `heading`, `description`, `noTrips`, `tripCount`, `all`, `viewTrips`, `byCountry`, `photoCount`, `cityCount`, `culinaryCrossLink`).

## Test status

Verified locally via `npx vitest run …` (only my owned test files, no full-suite run — Agent A8 owns that):

- `src/app/[locale]/travel/travel.test.tsx` — 5 passed (added three new tests covering the layout swap).
- `src/app/[locale]/travel/photos/[slug]/trip-photos.test.tsx` — 4 passed (new file).
- `src/app/[locale]/collection-pages.test.tsx` — 14 passed (mock updated, no behavioural change to its TravelPage assertion).

`tsc --noEmit` reports zero errors in the files I own; pre-existing failures in `src/lib/bvb.test.ts` belong to Agent A3 and are unrelated to this work.

## Photo-handling note

I did not touch `public/photos/` or `scripts/photo-catalogue.json`. All photo URLs come from `getTrips()` → `Trip.photos[].src`, which is built from the catalogue's `src` field with the `/photos/` prefix in `src/lib/trips.ts`. If Agent A1 reorganises into per-trip subfolders, only that prefix (or the catalogue itself) needs updating — the page code is path-agnostic.
