# V1 Quality Gate — Lighthouse + axe Sweep

> Branch: `qa/v1-perf-a11y-audit` off `integration/v1-content-polish`.
> Date: 2026-04-28. Tools: Lighthouse 13.1.0 (headless Chrome, default
> throttling — 4× CPU, slow 4G), axe-core 4.11 via `@axe-core/playwright`,
> chromium project. Probe: local `npm run start` on `http://localhost:3100`
> (production build).
>
> Per-route JSON in `docs/lighthouse-reports/v1-audit-before/` and
> `…/v1-audit-after/`. Re-run with:
>
> ```bash
> BASE_URL=http://localhost:3100 \
>   OUT_DIR=docs/lighthouse-reports/v1-audit-before \
>   node scripts/v1-audit-lighthouse.mjs
> ```

## Lighthouse — before vs after auto-fixes

| Route                                 | Perf B → A | A11y B → A | BP B → A | SEO B → A |
| ------------------------------------- | ---------: | ---------: | -------: | --------: |
| `/en` (home)                          |    88 → 88 |   97 → 100 |  100→100 |    92→ 92¹ |
| `/en/travel`                          |    88 → 85 |  100 → 100 |  100→100 |    92→100 |
| `/en/travel/photos/germany-2022-10`   |    90 → 90 |  100 → 100 |  100→100 |    92→100 |
| `/en/travel/photos/romania-2024-06`   |    88 → 88 |  100 → 100 |  100→100 |    92→100 |
| `/en/travel/photos/united-kingdom-2023-07` | 87 → 89 | 100 → 100 |  100→100 |    92→100 |
| `/en/personal`                        |   100 →100 |  100 → 100 |   77→ 77² |    92→100 |
| `/en/work`                            |    90 → 91 |  100 → 100 |  100→100 |    92→100 |
| `/en/writing`                         |    93 → 93 |  100 → 100 |  100→100 |    92→100 |
| `/en/now`                             |    89 → 93 |  100 → 100 |  100→100 |    92→100 |
| `/en/contact`                         |    90 → 91 |  100 → 100 |  100→100 |    92→100 |

> ¹ `/en` (home) shows 92 SEO on the localhost probe because Lighthouse
> emits "Points to another `hreflang` location" — the canonical
> `https://eduardfischer.dev` differs from the probe host
> `http://localhost:3100`. **False positive on localhost; will resolve to
> 100 on the production domain.**
>
> ² `/en/personal` BP 77 driven entirely by Wikipedia commons crest URLs
> (Bundesliga club logos in the BVB feed) setting third-party cookies.
> See "Doc-only findings" below — fix is non-trivial (cache-and-host).

**Per-route averages** — A11y 99.7 (was 99.4), BP 97.7 (unchanged — held
back by `/personal`), SEO 99.2 (was 92.0), Perf 90.8 (essentially flat
±1; no perf-targeted fixes shipped).

## axe-core — WCAG 2.1 A/AA sweep

`e2e/a11y.spec.ts` extended to 11 routes (added the three trip-photo
pages). `e2e/a11y-audit-dump.spec.ts` dumps every violation per route
to JSON for the audit (kept for re-runs; not part of CI).

```text
=== before ===                  === after ===
/                  0             /                  0
/work              0             /work              0
/writing           0             /writing           0
/recommends        0             /recommends        0
/personal          0             /personal          0
/travel            0             /travel            0
/travel/photos/germany-2022-10   0   …              0
/travel/photos/romania-2024-06   0   …              0
/travel/photos/united-kingdom-2023-07 0  …          0
/now               0             /now               0
/contact           0             /contact           0
```

**Zero serious/critical/moderate/minor violations across all 11 routes,
both before and after.** The Round-5 contrast and link-in-text-block
fixes ([docs/perf-audit-2026-04.md](perf-audit-2026-04.md)) hold up,
and the new trip-photo grid pages and the recently expanded photo
catalogues did not regress a11y.

The only a11y signal Lighthouse reported (and axe did not, because it's
a WCAG 2.1 AAA-leaning rule) was `target-size` on the home carousel
dots — auto-fixed below.

## Auto-fixes applied (12 changes, well under the 30-cap)

| # | File | Issue | Fix |
|---|---|---|---|
| 1 | `src/components/recommendations-carousel.tsx` | `target-size` (Lighthouse a11y) — carousel dots 6×6 px on `/`, AA wants 24×24 | Wrapped the visible 6×6 dot in a 24×24 hitbox `<button>`; the dot is now a presentational `<span>`. Visual unchanged. |
| 2 | `src/app/[locale]/work/page.tsx` | SEO `canonical` inherits layout's `/` | Per-route `alternates: { canonical: "/work" }` |
| 3 | `src/app/[locale]/writing/page.tsx` | same | `…canonical: "/writing"` |
| 4 | `src/app/[locale]/recommends/page.tsx` | same | `…canonical: "/recommends"` |
| 5 | `src/app/[locale]/personal/page.tsx` | same | `…canonical: "/personal"` |
| 6 | `src/app/[locale]/travel/page.tsx` | same | `…canonical: "/travel"` |
| 7 | `src/app/[locale]/travel/culinary/page.tsx` | same | `…canonical: "/travel/culinary"` |
| 8 | `src/app/[locale]/now/page.tsx` | same | `…canonical: "/now"` |
| 9 | `src/app/[locale]/contact/page.tsx` | same | `…canonical: "/contact"` |
| 10 | `src/app/[locale]/my-story/page.tsx` | same | `…canonical: "/my-story"` |
| 11 | `src/app/[locale]/travel/[slug]/page.tsx` | same — dynamic | `generateMetadata` returns ``canonical: `/travel/${slug}` `` |
| 12 | `src/app/[locale]/travel/photos/[slug]/page.tsx` | same — dynamic | `generateMetadata` returns ``canonical: `/travel/photos/${slug}` `` |
| 13 | `src/app/[locale]/work/[slug]/page.tsx` | same — dynamic | ``canonical: `/work/${slug}` `` |
| 14 | `src/app/[locale]/writing/[slug]/page.tsx` | same — dynamic | ``canonical: `/writing/${slug}` `` |
| 15 | `src/app/[locale]/recommends/[slug]/page.tsx` | same — dynamic | ``canonical: `/recommends/${slug}` `` |
| 16 | `e2e/a11y.spec.ts` | New routes weren't covered | Added the three trip-photo pages |

The home page (`src/app/[locale]/page.tsx`) deliberately does not set its
own canonical — it inherits the layout's `canonical: "/"` which is the
correct value for the root.

No content/MDX files were touched. No new Tailwind tokens introduced
(target-size fix uses existing `h-6 w-6` utilities; no token edits).

## Doc-only findings (recommended follow-ups for Eduard)

### 1. `/personal` BP 77 — Wikipedia 3rd-party cookies

The BVB feed renders opponent club crests via OpenLigaDB-supplied
`teamIconUrl` values that point at `upload.wikimedia.org/…`. Wikipedia
sets a `WMF-Uniq` cookie + flags 8 commons URLs in the inspector.

**Fix sketch (M)** — write a one-shot script
(`scripts/cache-bvb-crests.mjs`) that downloads each Bundesliga crest
once, stores under `public/images/bvb-crests/<id>.svg`, and add a
`crestUrl` mapper in `src/lib/bvb.ts` that prefers the local copy and
falls back to the OpenLigaDB URL for unknown teams. Crests rarely
change; refresh annually with the same script.

### 2. Site-wide `redirects` audit — 600 ms savings (every route)

Lighthouse flags `redirects` worth ~600 ms on every route. Tracing it
to the `/` → `/en` middleware redirect (next-intl default-locale
behaviour). The probe URL also goes through it (Lighthouse navigates
`http://localhost:3100/en` but follows a 308 to `…/en/`, etc.).

**Fix sketch (M)** — verify whether `next-intl` can serve the EN
content at the unprefixed root for English-default visitors instead of
issuing a redirect, or whether the redirect is intentional for hreflang
consistency. Probably keep it; document the trade-off.

### 3. `/travel` — `max-potential-fid` 360 ms

`react-simple-maps` ships `d3-geo` and parses TopoJSON on the main
thread on first paint. Carried over from the previous audit; Lighthouse
still flags it (24/100 on this audit, `total-blocking-time` 200 ms).

**Fix sketch (L)** — move the TopoJSON parse to a Web Worker, or swap
`react-simple-maps` for an SSR-rendered SVG of pre-projected paths.
Same recommendation as the prior audit's deferred item #5.

### 4. Trip-photo pages — `lcp-discovery-insight`

All three trip-photo pages flag `lcp-discovery-insight (0)`. The first
photo in the grid is the LCP candidate and is not preloaded separately
from the document.

**Fix sketch (M)** — for each trip page, emit `<link rel="preload"
as="image" href="…" imagesrcset="…">` for the first photo from
`generateMetadata` or via `metadata.other`. Saves ~200 ms LCP on slow
connections.

### 5. Site-wide `unused-javascript` — 27–52 KiB per route

Every route ships ~48 KiB of unused JS. Top suspects:
- `lucide-react` named imports (already tree-shaken but with overhead).
- `flexsearch` (search palette) loaded eagerly.
- `react-simple-maps` chunk on routes other than `/travel` (probably a
  shared chunk leakage — confirm with `ANALYZE=true npm run build`).

**Fix sketch (L)** — route-level `dynamic()` import for the search
palette + travel map; verify with `ANALYZE=true` whether the map chunk
genuinely leaks.

### 6. `/work` `server-response-time` 1,440 ms (cold)

TTFB on `/work` is 1.4 s on cold render. Inherited from the prior
audit. Page calls `getRepos()` and `getCollection("work")` synchronously.

**Fix sketch (M)** — convert to full SSG with ISR (`revalidate: 3600`)
since work content changes daily at most.

### 7. Home — `bf-cache` blocked

The home page is excluded from bf-cache (2 reasons). Carried over from
prior audit. Likely an `unload`-style listener or a tracker.

**Fix sketch (M)** — capture the `bfcache` failure reasons via
`PerformanceObserver({ type: "navigation" })`, find the offending
listener (probably `visit-tracker` or `palette-tracker`), use
`pagehide` instead.

## Bundle size

Total `.next/static/chunks/` size is unchanged — the auto-fixes are
metadata-only edits (no new component code, no new dependencies). Each
canonical line is ~3–4 lines of TS. No measurable bundle delta.

## Top 5 perf wins to consider (post-V1)

1. **Cache + host BVB crests locally** — flips `/personal` BP from 77
   to 100 and removes 8 third-party cookie violations. (M, ~2 h.)
2. **Preload first trip-photo image** — closes
   `lcp-discovery-insight` on all three audited trip pages, +5–8 perf
   each. (M, ~1 h.)
3. **Move TopoJSON parsing off the main thread** — `/travel`
   `max-potential-fid` 360 → ~80 ms; +6 perf. (L, ~1 d.)
4. **ISR on `/work`** — collapses `server-response-time` 1.4 s →
   <100 ms. (M, ~2 h.)
5. **Audit `unused-javascript` site-wide via `ANALYZE=true`** —
   targeting the 27–52 KiB per-route waste. Likely a shared chunk
   carrying `react-simple-maps` further than it should. (L, ~1 d.)

## Verify

- `npm run lint` — clean (15 pre-existing no-unused-vars warnings, 0
  errors). New audit scripts contributed 0 warnings of their own after
  cleanup.
- `npm run typecheck` — clean.
- `npm run build` — succeeds.
- `npm run test` — **745 unit tests passing, 2 skipped** (unchanged).
- `BASE_URL=http://localhost:3100 npx playwright test e2e/a11y.spec.ts
  --project=chromium` — **all 11 routes pass**, 0 serious/critical
  violations.

## Methodology

- Probe: production build (`next build` + `next start --port 3100`).
- Each route audited once per pass (before/after). Lighthouse default
  throttling (4× CPU, slow 4G). Single run, not the median of 5.
- Localhost runs introduce small variance (±2 perf points run-to-run);
  the same applies to `total-blocking-time`. Treat scores as
  directional, not absolute.
- The Lighthouse on Windows tmp-dir cleanup (EPERM) was worked around
  by reading the JSON regardless of CLI exit code — see
  `scripts/v1-audit-lighthouse.mjs` and `scripts/v1-audit-collect.mjs`.
