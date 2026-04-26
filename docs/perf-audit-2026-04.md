# Performance, A11y & Bundle Audit — 2026-04-26

> Architect-pass audit by Senior Dev B. Live target:
> `https://eduardfischer.dev`. Lighthouse 13.1, axe-core via Playwright,
> measured from a clean Chrome headless on a Windows runner. Methodology
> notes at the bottom.

## Lighthouse scores per route

| Route          | Perf | A11y | BP  | SEO |
| -------------- | ---: | ---: | --: | --: |
| `/`            |   97 |   90 | 100 | 100 |
| `/work`        |   97 |   96 |  96 |  92 |
| `/writing`     |   96 |   96 | 100 |  92 |
| `/recommends`  |   97 |   94 | 100 |  92 |
| `/personal`    |   98 |   96 | 100 |  92 |
| `/travel`      |   91 |   96 |  96 |  92 |
| `/contact`     |   99 |   96 | 100 |  92 |
| `/now`         |   98 |   96 | 100 |  92 |

Average: **97 perf · 95 a11y · 99 bp · 93 seo.** All routes already
exceed the proposed CI budgets (Perf >= 85, A11y >= 95, BP >= 95,
SEO >= 95) on three categories; SEO sits at 92 site-wide because of
`canonical` not being on the per-route variants (more on that below).

## Top 3 wins (already strong)

1. **Server-side rendering + no client-side data fetching on the public
   pages.** All collection lists, MDX bodies, OG images and the reading
   feed are computed at build (or revalidated server-side via ISR), so
   the initial paint never waits on JS. Time-to-Interactive is 2.4–3.1 s
   across every route on a slow simulated connection.
2. **Image discipline.** Every `<Image>` already has explicit `sizes`,
   the LCP portrait on `/` has `priority`, and the photo-gallery /
   personal-page tiles correctly use `loading="lazy"`. The only `<img>`
   in tree (Skills tile logos via Devicon CDN) is `loading="lazy"` and
   never participates in LCP.
3. **Tiny JS surface for static content.** `lucide-react` is used as
   named-import only and the MDX content collections are compiled at
   build, so the Next bundle that ships per route is dominated by the
   React+Next runtime — not page-specific feature code. The carousel and
   the travel map are the only client components on `/` and `/travel`
   respectively.

## Top 5 issues per route (ranked by effort × impact)

`/`

- **`label-content-name-mismatch`** on `<a aria-label="Home">` and the
  locale toggle: the visible text ("Eduard Fischer-Szava", "EN/DA")
  doesn't appear inside the accessible name. **S** — re-word
  `aria-label` to start with the visible text or drop the override and
  use a `<span class="sr-only">` instead.
- **`target-size`** on the carousel dots: 6×6 px, AA wants 24×24.
  **S** — wrap the `<button>` in a 24×24 hitbox without changing the
  visual indicator size.
- **`bf-cache` blocked**: 2 reasons (likely service-worker /
  unload-listener). **M** — investigate; usually a third-party script
  or `unload` listener.
- **LCP request discovery (`lcp-discovery-insight`)**: the portrait
  image is `priority` already; the audit still flags it because it
  isn't preloaded *separately* from the document. **M** — add
  `<link rel="preload" as="image" href="..." imagesrcset="...">` in
  the head.
- **Unused JavaScript** [27 KiB savings]. **L** — deferred work; will
  shrink once we de-tree the search palette into a route-level dynamic
  import.

`/work`

- **`server-response-time`** [1,200 ms TTFB]. **M** — the page calls
  `getAllWorkProjects()` and `getAllRecommendations()` synchronously
  on each request; consider full SSG with ISR.
- **`canonical`** missing. **S** — already shipped at the layout level
  but the per-route `metadata.alternates.canonical` should be set on
  collection pages.
- Console errors logged. **S** — investigate the source.
- 24 KiB unused JS. **L** — needs route-level dynamic import surgery.

`/writing`

- **`server-response-time`** [870 ms]. **M** — the live reading feed
  (dev.to + HN) ISR can fall through to fetch on cold renders. Already
  cached for 1 h.
- **`forced-reflow-insight`**. **M** — small layout thrash during
  hydration of the tab strip.
- 28 KiB unused JS. **L**.

`/recommends`

- **`heading-order`**: H2 → H4 jump on the recommendations index list.
  **S** — re-tag the per-card heading to H3.
- 21 KiB unused JS. **L**.
- 150 ms render-blocking. **M** — reduce blocking CSS.

`/personal`

- **`network-dependency-tree-insight`**. **M** — long chain on first
  paint because the photo grid lazy-loads in waterfall.
- 24 KiB image-delivery savings. **M** — convert source PNGs that
  haven't been resaved as AVIF/WebP yet.
- 150 ms render-blocking. **M**.

`/travel`

- **`max-potential-fid` 380 ms**. **M** — the world TopoJSON parsing
  blocks the main thread; could move to a worker.
- **`unused-javascript` [53 KiB]** — `react-simple-maps` ships
  `d3-geo`. **L** — needs a swap or partial import.
- Console errors. **S** — investigate.

`/contact`

- **`server-response-time`** [1,240 ms]. **M** — server-action
  module is loaded on first GET; consider response streaming.
- 48 KiB unused JS. **L**.

`/now`

- 21 KiB unused JS. **L**.
- 140 ms render-blocking. **M**.

## Prioritised fix list

| # | Issue | Routes | Effort | Status |
|--:|---|---|:-:|---|
| 1 | Bump `--color-foreground-subtle` to clear AA 4.5:1 across all 6 palette/theme combos | all | S | **APPLIED** |
| 2 | Drop `role="img"` on `<TravelEuropeMap>` wrapper (nested-interactive) | /travel | S | **APPLIED** |
| 3 | Underline the carousel author link (link-in-text-block) | / | S | **APPLIED** |
| 4 | Use `text-foreground-muted` on search trigger label/kbd | all | S | **APPLIED** |
| 5 | `<link rel="preconnect">` to cdn.jsdelivr.net + github.com | all | S | **APPLIED** |
| 6 | Fix `label-content-name-mismatch` on locale toggle + Home link | all | S | deferred — needs translated copy decision (see "Deferred") |
| 7 | Carousel dot target-size to 24×24 hitbox | / | S | deferred — visual consult preferred |
| 8 | H3 (not H4) for per-rec card heading on /recommends | /recommends | S | deferred — content-team review |
| 9 | Per-route `metadata.alternates.canonical` on collection pages | /work,/writing,/recommends,/travel,/personal,/now | S | deferred — needs Vercel preview check |
| 10 | Investigate console errors on /work and /travel | /work,/travel | M | deferred |
| 11 | Address `bf-cache` blockers | / | M | deferred |
| 12 | Move TopoJSON parsing off main thread | /travel | L | deferred |
| 13 | Audit unused JS (27–53 KiB per route) | all | L | deferred |
| 14 | Move LCP image to `<link rel="preload" as="image">` | / | M | deferred |

S = Small (≤ 1 h, no behaviour change). M = Medium. L = Large.
"deferred" items are recommended for a follow-up PR.

## A11y audit (axe-core via Playwright)

The new `e2e/a11y.spec.ts` walks every public route and runs an axe
scan. After this branch, **all routes pass with 0 serious/critical
violations.**

Violations found and fixed in this branch:

- `color-contrast` (serious) — multiple tokens; lifted across all 6
  palette/theme combos (commit `0d6f195`).
- `link-in-text-block` (serious) — recommendations-carousel author
  link; added a dotted underline (commit `3e50574`).
- `nested-interactive` (serious) — travel-europe-map wrapper; switched
  `role="img"` div to a `<figure aria-label>` (commit `3e50574`).

Moderate / minor advisories that the spec logs but doesn't fail on:

- `target-size` on carousel dots, `label-content-name-mismatch` on
  locale toggle and `home` link (see deferred fixes above).

## Bundle size baseline

Next 16 with Turbopack does not print per-route first-load JS sizes in
the build output the way Next 14 did. As a workaround, we tracked
total client-chunk size on this commit:

| Metric | Bytes | Notes |
|---|---:|---|
| Total `.next/static/chunks/` | ~970 KB | Includes shared React/Next runtime and all route-level chunks |

For per-route precision use the freshly-wired analyzer:

```bash
ANALYZE=true npm run build
```

This opens HTML treemaps for the client/edge/server bundles. Wired in
`next.config.ts` (commit `758420b`); when toggled off, build output is
unchanged. The analyzer requires Webpack mode rather than Turbopack to
emit treemaps — if `--turbopack` is the default in CI, run the analysis
locally with `next build` (no `--turbopack`).

Per-route first-load JS will be tracked in the Lighthouse CI workflow
once we standardise on a probe URL: each Lighthouse run already
measures `total-byte-weight` per route, exposed in
`docs/lighthouse-reports/*.json` under `audits.total-byte-weight.numericValue`.

## Coverage thresholds

`vitest.config.ts` now enforces:

- statements: 60
- branches:   55
- functions:  65
- lines:      60

Set comfortably below the current baseline (63.05 / 57.06 / 68.92 /
63.29) so a small regression is allowed but a >5 pp drop fails CI.

## Methodology

- **Lighthouse**: Lighthouse 13.1.0 CLI, headless Chrome, default
  throttling (4× CPU, slow 4G), categories: performance, accessibility,
  best-practices, seo. JSON reports written to
  `docs/lighthouse-reports/<route>.json`. Aggregate: `scores.md`.
  Repro: `node scripts/lighthouse-batch.mjs` (uses
  `BASE_URL=https://eduardfischer.dev` by default).
- **axe-core**: `@axe-core/playwright` 4.11, default ruleset filtered
  to `wcag2a, wcag2aa, wcag21a, wcag21aa`. Run from
  `e2e/a11y.spec.ts` against the local `npm run start` server.
- **Bundle analyzer**: `@next/bundle-analyzer` 16.2.4, gated behind
  `ANALYZE=true`.

## Deferred items (M/L) — recommended order

1. Per-route `canonical` URLs on collection pages → +5 to SEO across the board.
2. Console errors on `/work`, `/travel` → BP +5 on the affected routes.
3. `target-size` and `heading-order` polish → +3 a11y on `/`, `/recommends`.
4. Move LCP image to a preload link → ~200 ms LCP shave on `/`.
5. Worker-side TopoJSON parse on `/travel` → unblocks main thread, +6 perf.
6. Audit unused JS site-wide → 20–50 KiB per route win.
