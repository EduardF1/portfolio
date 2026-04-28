# Travel page tooltips — for Agent A4

A5 (Tooltips) added i18n keys under `tooltips.*` for the travel surfaces.
A5 owns the strings; A4 owns the page wiring. Please wire these up when
you next touch `src/app/[locale]/travel/page.tsx` (and related travel
components).

## Already wired (no action needed)

- `tooltips.travel` is already passed to the page-level `<SectionHeading>`
  via `tt("travel")` in `travel/page.tsx`. No change required.

## New keys A5 added — A4 to wire

These are present in both `messages/en.json` and `messages/da.json` under
the `tooltips` namespace.

| Key | Suggested usage |
| --- | --- |
| `tooltips.travelEuropeMap` | Add `title={tt("travelEuropeMap")}` on the `<figure>` wrapping `<TravelEuropeMap>` (currently has only `aria-label`). File: `src/components/travel-europe-map.tsx` line ~50. |
| `tooltips.travelByCountry` | Wrap the "By country" `<h2>` heading with a `SectionHeading tooltip={tt("travelByCountry")}` (or add a `title` attr on the `<h2>`). File: `src/app/[locale]/travel/page.tsx` line ~71. |
| `tooltips.travelRecentTrips` | Wrap the "Recent trips" `<h2>` block similarly. File: `src/app/[locale]/travel/page.tsx` line ~112. |
| `tooltips.travelCulinaryCrossLink` | Add `title={tt("travelCulinaryCrossLink")}` on the `<Link href="/travel/culinary">` cross-link. File: `src/app/[locale]/travel/page.tsx` line ~61. |

## How to access the keys

The travel page already calls `getTranslations("tooltips")` and stores it
as `tt`. You can use those keys directly as `tt("travelEuropeMap")` etc.

## Tone reference

A5's tooltip tone is "clear, professional, slightly warm; tell the user
what they will find". Keep new tooltips you add in the same register.
The Danish translations are in `messages/da.json` — already natural for
DK readers, not literal translations.
