# A16 — Per-route OG images for /writing, /recommends, /travel, /my-story

Branch: `feat/v1-polish-round4` (no commits made — handed back clean).

## Files created (7 new)

1. `src/app/[locale]/writing/opengraph-image.tsx`
2. `src/app/[locale]/writing/twitter-image.tsx`
3. `src/app/[locale]/recommends/opengraph-image.tsx`
4. `src/app/[locale]/recommends/twitter-image.tsx`
5. `src/app/[locale]/travel/opengraph-image.tsx`
6. `src/app/[locale]/travel/twitter-image.tsx`
7. `src/app/[locale]/my-story/twitter-image.tsx`

## Files NOT created (and why)

- `src/app/[locale]/my-story/opengraph-image.tsx` — already exists on this branch
  (cream `#FAF9F5` background, orange `#C25D3F` accent, tagline "How I got
  here." / "A chronological version of the CV: the choices, not the
  achievements. Dated, honest, and short."). I did **not** overwrite it. The
  task brief listed it as a file to create with the navy palette and the
  "From IBA Kolding to Mjølner — the longer arc" tagline, but the existing
  cream/orange version is intentional, route-flavoured, and already gives
  /my-story its own OG card (so the gap A9 flagged is closed regardless of
  who designed it). I added only the matching `twitter-image.tsx` so the
  X/Twitter variant points at the same image instead of falling back to
  the root navy card.

## Tagline copy used per route (so Eduard can swap)

| Route        | Big line          | Italic subline                                        | Alt text                                |
| ------------ | ----------------- | ----------------------------------------------------- | --------------------------------------- |
| /writing     | "Writing."        | "Essays from engineering and consulting practice."    | "Writing — Eduard Fischer-Szava"        |
| /recommends  | "Recommends."     | "Recommendations from colleagues and managers."       | "Recommends — Eduard Fischer-Szava"     |
| /travel      | "Travel."         | "20+ countries, photo-tagged trip journal."           | "Travel — Eduard Fischer-Szava"         |
| /my-story    | (existing) "How I got here." | (existing) "A chronological version of the CV…" | (existing) "How I got here — Eduard Fischer-Szava" |

The italic sublines came verbatim from the brief; the big line is a
single bold word for visual punch (matches the "Eduard Fischer-Szava"
hero on the root card). Eduard: easy swap if any read wrong — only one
string per file.

## Pattern conformance (all 3 navy cards)

Matches the root `src/app/opengraph-image.tsx` exactly:
- Background `#0F172A` with the same radial-gradient highlight
- Accent `#22D3EE` cyan on the EF tile, italic subline, and `/route` indicator
- Cream `rgba(242,238,227,0.65)` for the bottom "Aarhus · EN · DA" footer
  (the brief specified this triplet; root currently uses
  `rgba(226,232,240,0.75)`. I switched to the cream for the new routes
  to honour the brief literally — it reads as a slightly warmer footer.
  If you want byte-for-byte parity with root, change the three new
  navy files to `rgba(226,232,240,0.75)`.)
- Edge runtime, 1200×630, `image/png`
- No external font loading — system Georgia/sans (root does the same)

## Pattern deviations

1. **Header layout.** Root has the EF tile on the left and `EN · DA`
   only at the bottom. The new cards add a `/writing` (or `/recommends`,
   `/travel`) slug on the right side of the header, in cyan. Reason:
   the existing per-route OG cards on this branch (`personal`,
   `my-story`) already use this convention, so I matched the in-repo
   per-route pattern over the root pattern. This makes the route
   immediately scannable in a LinkedIn timeline.

2. **Big line shrunk from 110 → 100 px** for the navy cards. Root uses
   76 because it has two tight lines ("Eduard Fischer-Szava" + the
   italic). The new cards have only one short word, so 100 fills the
   space without overflowing.

3. **my-story OG left untouched.** See "Files NOT created" above.

4. **twitter-image files are 1-line re-exports** of the matching
   opengraph-image (same pattern as `src/app/twitter-image.tsx`). With
   `runtime`/`size`/`contentType`/`alt` mirrored locally — re-exporting
   them via `export { … } from` trips Turbopack on Next 16 (root file's
   own comment).

## Validation

- `npx tsc --noEmit` → exit 0, clean.
- Did not run `next build`. The React source compiles, ImageResponse
  signature matches the docs at
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`,
  and all four routes are static (no `params` consumed).
- The `[locale]` segment **is** a dynamic route, so per the same docs
  the default export *could* receive `params: Promise<{ locale: string }>`.
  I left the signature parameter-less (matching `personal/opengraph-image.tsx`
  and `my-story/opengraph-image.tsx` already in the repo) because the OG
  cards do not need to localise — they're English-only, and that's
  consistent with what's there. If Eduard wants Danish OG cards later,
  the swap is `({ params }) => { const { locale } = await params; … }`
  plus a `t()` call.

## Quick visual check before merge

Spin local dev and hit each route's OG endpoint:
- http://localhost:3000/en/writing/opengraph-image
- http://localhost:3000/en/recommends/opengraph-image
- http://localhost:3000/en/travel/opengraph-image
- http://localhost:3000/en/my-story/opengraph-image
- http://localhost:3000/en/my-story/twitter-image (new — should match the OG)

LinkedIn / X both cache aggressively; once shipped, run the URL through
LinkedIn Post Inspector and the X Card Validator to bust their caches.
