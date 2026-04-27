# A18 — Lightbox attribution caption for stock photos

Sprint: v1-polish-round5
Branch: `feat/v1-polish-round4` (no commits, no branch switch)
Date: 2026-04-27

## Scope

Add a subtle attribution caption inside the lightbox dialog whenever the
active photo carries a `source.type === "stock"` block. Personal photos
(no `source` block, or `type === "personal"`) render unchanged.

Coordinates with Agent A14, who is populating `source` blocks for ~47
new stock photos in `scripts/photo-catalogue.json`.

## Files

### Created

- `src/lib/photo-source.ts`
  - Exports `PhotoSourceType`, `PhotoSource`, `AttributionView`.
  - Exports `getAttribution(source)` — single discriminator. Returns
    `null` for personal / missing-source photos, otherwise a flat
    `{ photographer, photographerUrl, provider, providerUrl, licenseUrl }`
    view consumed by the lightbox.
  - JSDoc references the catalogue convention documented in
    `docs/photo-organization.md` (no `source` block ⇒ personal).

### Modified

- `src/components/photo-lightbox.tsx`
  - Imports `getAttribution` + `PhotoSource` from `@/lib/photo-source`.
  - Extends `LightboxPhoto` with `source?: PhotoSource`. Backwards
    compatible — existing call sites (`travel/photos/[slug]/page.tsx`)
    keep compiling without changes.
  - New `useTranslations("attribution")` hook (`ta`).
  - Computes `attribution = getAttribution(currentPhoto.source)` once
    per active photo.
  - Renders a caption inside the image-area div (still inside the
    `role="dialog"` landmark), beneath the existing `caption` block.

- `messages/en.json` / `messages/da.json`
  - New top-level `attribution` namespace (added after `tooltips`,
    matching the existing closing-brace convention).

## i18n keys added

`attribution.photoBy`, `attribution.via`, `attribution.licenseLabel`.

| key                         | en                  | da                |
| --------------------------- | ------------------- | ----------------- |
| `attribution.photoBy`       | `Photo by {name}`   | `Foto af {name}`  |
| `attribution.via`           | `via {provider}`    | `via {provider}`  |
| `attribution.licenseLabel`  | `License`           | `Licens`          |

No other i18n keys were touched.

## Visual treatment

- Position: directly under the optional `currentPhoto.caption`, inside
  the rounded image container. Stays inside the dialog landmark, so
  screen readers announce it as part of the modal.
- Typography: `font-mono`, `text-[11px]`, `tracking-[0.05em]` — one
  step smaller than the existing caption (`text-xs uppercase
  tracking-[0.2em]`) so it reads as metadata, not as a counterpoint
  to the photo. Lowercase by default (no uppercase transform), since
  photographer names should render naturally.
- Color: `text-white/60` — subtle against the `bg-black/85` backdrop;
  still hits AA contrast on solid black. Matches the muted treatment
  used by the count badge (`text-white/80`) but a notch lower so it
  recedes.
- Links: `underline decoration-white/30 underline-offset-2`. On hover
  / focus they resolve to `text-white` + `decoration-white` for clear
  affordance without competing with the photo.
- Layout: single line, centered, e.g.
  `Photo by Tapio Haaja via Pexels — License`. The em-dash separator
  and link grouping mirror the convention in `docs/photo-attributions.md`.

## Accessibility

- Caption lives inside the `role="dialog"` landmark via the existing
  image-area div (no new region or landmark introduced).
- Each link opens in a new tab with `target="_blank"` +
  `rel="noopener noreferrer"`.
- Each link carries an `aria-label` ending in `(opens in a new tab)`,
  composed from the same translated string the visible label uses.
  This keeps the announcement localised and gives screen-reader users
  the same "external link" affordance that sighted users get from the
  underline.
- When a URL is missing (e.g. `photographerUrl` absent), the segment
  renders as plain `<span>` text instead of an empty link — defensive
  for partial catalogue entries.
- Focus trap inside the dialog continues to work: the new links are
  picked up automatically by the existing `dialogRef.current
  .querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')`
  query, so Tab cycles through them and Shift+Tab reverses correctly.
- Test hook: caption carries `data-testid="lightbox-attribution"` for
  future regression coverage.

## Type adjustments to existing photo entry types

- `LightboxPhoto` (in `photo-lightbox.tsx`) gained an optional
  `source?: PhotoSource` field. Optional, so all existing
  `LightboxPhoto[]` builders compile unchanged.
- No changes to `RawCatalogueEntry` / `TripPhoto` in `src/lib/trips.ts`
  — that file is owned by other agents (A1 / A14). When A14 finishes
  populating catalogue entries, a follow-up agent will need to:
  1. Add `source?: PhotoSource` to `RawCatalogueEntry` and `TripPhoto`.
  2. Forward `source` from `RawCatalogueEntry` through `mapToTripPhoto`
     into `TripPhoto`.
  3. Forward `p.source` in
     `src/app/[locale]/travel/photos/[slug]/page.tsx` when building
     `LightboxPhoto[]`:
     ```ts
     const photos: LightboxPhoto[] = trip.photos.map((p) => ({
       src: p.src,
       alt: p.alt || ...,
       source: p.source,
     }));
     ```
  Until then the lightbox will simply never see a `source` block and
  the attribution caption stays hidden — safe no-op, no regression.

## Validation

- `npx tsc --noEmit` — clean (no new TypeScript errors introduced).
- `src/components/photo-lightbox.test.tsx` — pre-existing failure
  unrelated to this change. The committed-on-`HEAD` version of the
  component does not call `useTranslations`, but the working-tree
  version (modified before this round by another agent for
  `tooltips.lightboxClose / lightboxPrev / lightboxNext`) already
  did, and the existing test file does not wrap renders in
  `NextIntlClientProvider`. Confirmed by stashing my changes and
  re-running: same failure mode (`useTranslations("tooltips")` throws
  the missing-context error). My addition of
  `useTranslations("attribution")` does not change the failure shape
  or count. A separate fix (test setup adds a `next-intl` mock or
  wraps render in a provider) is needed; flagged here for the
  test-infra owner.
- Empty / personal-photo regression: `getAttribution(undefined)`
  returns `null`, so `{attribution && (...)}` renders nothing. The
  existing test cases ("renders nothing for empty input", "renders
  thumbnails", "opens dialog and closes on Escape") all pass through
  the unchanged code paths.

## Hand-off notes

- A14: catalogue is yours; once stock entries are committed they flow
  into the lightbox automatically once the trips-lib forwarding
  patch above is applied.
- Trips-lib follow-up (A19/A20 if assigned, otherwise next round):
  see "Type adjustments" section.
- `docs/photo-attributions.md` is the human-readable master table;
  this UI caption is the per-photo surface that complements it.
