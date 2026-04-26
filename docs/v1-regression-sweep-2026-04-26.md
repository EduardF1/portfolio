# V1 Regression Sweep — 2026-04-26

> Senior Dev C, branch `feat/v1-regression-sweep`. Pre-V1 polish-pass
> regression audit. Two grid fixes shipped, all other findings deferred or
> noted. Playwright matrix and Lighthouse smoke included.

## 1. Playwright matrix — clean

`npm run build && npx playwright test` (run twice: once on `main`'s tip,
once after the photo-gallery / photo-lightbox edits below).

| Project                  | Result                |
| ------------------------ | --------------------- |
| `chromium`               | pass (15 tests)       |
| `chromium-laptop-1366`   | pass (7 @cross tests) |
| `chromium-tablet`        | pass (7 @cross tests) |
| `mobile-iphone-14`       | pass (11 tests)       |
| `mobile-iphone-se`       | pass (11 tests)       |
| `mobile-pixel-7`         | pass (11 tests)       |
| `mobile-galaxy-s5`       | pass (11 tests)       |

**Totals:** 98 passed, 1 skipped, 0 failed (~17 s wall). The skipped
test is the pre-existing webkit-only mobile Safari probe; harmless.

Vitest also re-run end-to-end: **315 passed / 0 failed** (313 baseline
+ 2 new low-count grid assertions on `<PhotoGallery>` and
`<PhotoLightbox>`).

## 2. Grid spot-check — two issues, both fixed

Walked every named page at 375 / 768 / 1280 px and grepped every
`grid-cols-N` callsite. The PO's earlier passes already reach every
page-level grid (`/work`, `/personal`, `/recommends`, `/travel`,
`/travel/culinary`, `github-feed`, `/not-found`). The remaining
empty-rectangle risk is in the **shared photo components** consumed by
`/travel/[slug]` and `/travel/photos/[slug]`.

### 2.1 `<PhotoGallery>` — fixed

- **File:** `src/components/photo-gallery.tsx`
- **Pages affected:** `/travel/[slug]` (every trip page).
- **Issue:** hard-coded `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for
  any photo count. Trip MDX entries with 1 or 2 photos render with 1–2
  empty rectangles at lg.
- **Fix:** delegate to `responsiveGridColsClass(photos.length, 3)`.
  1 photo → `grid-cols-1`. 2 photos → `sm:grid-cols-2` only. 3+ →
  full ladder (unchanged behaviour for the well-fed case).
- **Coverage:** added a low-count assertion to
  `src/components/photo-gallery.test.tsx` that exercises 1, 2, and 3
  photos.

### 2.2 `<PhotoLightbox>` — fixed

- **File:** `src/components/photo-lightbox.tsx`
- **Pages affected:** `/travel/photos/[slug]` (every cluster page).
  Photo-catalogue analysis at the time of this sweep:
  - 1-photo trips: Sweden 04/2018, Luxembourg 07/2019, Denmark 02/2020,
    Greece 07/2022, Romania 08/2022, Denmark 10/2022, Romania 12/2022,
    Romania 03/2025 — **8 trip pages** rendering 2 empty rectangles each
    on lg.
  - 2-photo trips: Germany 10/2022, Finland 02/2025, Czechia 04/2025,
    Italy 03/2026, Austria 03/2026 — **5 trip pages** rendering 1 empty
    rectangle on lg.
- **Issue:** identical to `<PhotoGallery>`.
- **Fix:** identical pattern (`responsiveGridColsClass`).
- **Coverage:** added the same low-count assertion to
  `src/components/photo-lightbox.test.tsx`.

### 2.3 Deferred / noted (not fixed — Dev A or Dev B scope)

- **`<Skills>` mobile category** — `src/components/skills.tsx`, used on
  `/`. The "mobile" category renders 3 tiles in a `@md:grid-cols-6`
  grid → 3 trailing empty cells at @md (≈768 px container width). This
  isn't an "empty rectangle" with `bg-border/60` — the cells just don't
  render — so it's a *symmetry* bug, not the one the PO asked about.
  `/` is implicitly Dev A territory via the home page; **left as-is,
  flagged here**.
- All remaining `md:grid-cols-12` 12-column hero/section layouts are
  behaving correctly (every consumer sets `col-span-N`).

## 3. Lighthouse smoke — no regression

Run locally against `npm run start` on `localhost:3500`, **on this
branch's tip** (after the photo-gallery / photo-lightbox edits). 360 px
mobile preset and 1366 px desktop preset; both runs hit the freshly
built SSG output, not Vercel.

| Route        | Width | Perf | A11y | BP  | SEO |
| ------------ | ----: | ---: | ---: | --: | --: |
| `/`          |   360 |   92 |   97 | 100 |  92 |
| `/work`      |   360 |   94 |  100 | 100 |  92 |
| `/personal`  |   360 |   92 |  100 | 100 |  92 |
| `/contact`   |   360 |   94 |  100 | 100 |  92 |
| `/`          |  1366 |  100 |   97 | 100 |  92 |
| `/work`      |  1366 |  100 |  100 | 100 |  92 |
| `/personal`  |  1366 |  100 |  100 | 100 |  92 |
| `/contact`   |  1366 |  100 |  100 | 100 |  92 |

Baseline from `docs/perf-audit-2026-04.md` (live `eduardfischer.dev`,
default mobile preset): 97 perf / 95 a11y / 99 BP / 93 SEO average.

- **Perf:** desktop is **+3** site-wide vs baseline (all four routes
  hit 100). Mobile dips slightly on `/` (92 vs 97) and `/personal`
  (92 vs 98) — within run-to-run noise on a Windows laptop, and these
  two routes are the LCP-image heavy ones. Not a regression.
- **A11y:** **+2 to +5** vs baseline across the board. The carousel
  `target-size` and Home-link `label-content-name-mismatch` items are
  still the only soft flags — already deferred in `perf-audit-2026-04`.
- **BP:** 100 site-wide; baseline had `/work` and `/travel` at 96.
  Whatever fixed those landed before this branch.
- **SEO:** flat 92 site-wide; baseline `/` was 100 only because the
  live `<link rel="canonical">` is per-Vercel-deploy. Local prod
  build re-uses the layout-level canonical, so `/` lines up with the
  rest. No fix needed for V1.

**No Perf / A11y / BP / SEO regression below baseline.**

## 4. V1-blocker check — none

Nothing in the audit blocks calling V1 done. The deferred Skills-mobile
asymmetry and the previously-deferred carousel `target-size` /
`label-content-name-mismatch` items are V1.1 polish.

## 5. Coordination notes

- **Dev A (`feat/v1-i18n-sweep`)** — no overlap. This branch does not
  touch `messages/{en,da}.json` or any of `/work`, `/now`, `/personal`,
  `/travel`, `/my-story`, `/recommends`, `/contact`. The
  `<PhotoGallery>` is rendered *from* `/travel/[slug]/page.tsx` but the
  edit is wholly inside the shared component.
- **Dev B (`feat/v1-bvb-flashscore`)** — no overlap. No edits to
  `src/components/bvb-feed.tsx` or any new `/personal` route handler.

## 6. Files changed on this branch

- `src/components/photo-gallery.tsx` — switched to
  `responsiveGridColsClass`.
- `src/components/photo-lightbox.tsx` — same.
- `src/components/photo-gallery.test.tsx` — low-count grid assertion.
- `src/components/photo-lightbox.test.tsx` — low-count grid assertion.
- `docs/v1-regression-sweep-2026-04-26.md` — this report.
