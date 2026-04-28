# Overnight QA Sweep — 2026-04-28

Autonomous QA pass after PR #56 (BVB hero + "On the road" image-path fix).
Branch: `fix/qa-sweep-overnight`. Branched off `origin/main` @ `bf0b510`
(post-#58 merge — agent #23's people-photo drop).

## Checks performed

| # | Check                                  | Result    | Notes                                                                                |
| - | -------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 1 | `validate-photos.mjs`                  | clean     | 222 catalogue entries (post-#58), 0 missing, 0 orphans, 0 pageMissing                |
| 2 | `/photos/...` refs in src + content    | clean     | Only `personal/page.tsx` (covered by check 1) + test fixtures (`/photos/a.jpg` etc.) |
| 3 | Sitemap crawl (124 URLs)               | clean     | All 200/308. EN + DA both healthy                                                    |
| 4 | Live image spot-check (1/trip × 20)    | clean     | All 20 random samples 200                                                            |
| 5 | OG image endpoints                     | **2 bugs**| Root `/opengraph-image` + `/twitter-image` returning 404 — fixed below               |
| 6 | MDX content image refs                 | n/a       | No `![..](..)` markdown images in any of the 21 MDX files                            |
| 7 | Top-5 trip page render                 | clean     | All 200, healthy HTML size (67–145 KB), no error markers                             |
| 8 | `npm run lint` / `npm run typecheck`   | clean*    | 0 lint errors (6 unused-var warnings, all pre-existing). Typecheck only the known imapflow error per memory. |

## Bugs found + auto-fixed

### Bug 1 — root `/opengraph-image` and `/twitter-image` returning 404 (SEO regression)

**Severity**: medium-high (breaks social link previews from the root URL).

**Symptoms**: home-page `<meta property="og:image" content="https://eduardfischer.dev/opengraph-image">` resolves to a 404. Same for `twitter:image`. Confirmed live before fix. All other root metadata routes (`/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/favicon.ico`, `/icon.svg`, `/apple-icon.svg`) returned 200.

**Root cause**: `src/proxy.ts` (Next 16 renamed `middleware.ts`) was matching root-level paths without a file extension and rewriting them into the next-intl locale tree. The dot-extension exclusion (`.*\\..*`) didn't catch `/opengraph-image` because metadata image routes have no extension in the URL. Locale-prefixed equivalents existed under `[locale]/` but no root-locale fallback served the bare path.

**Fix** (this branch): added `opengraph-image|twitter-image` to the proxy matcher's negative-lookahead exclusion alongside `_next|_vercel|api|admin|privacy`. One-line change in `src/proxy.ts`. Files in `src/app/opengraph-image.tsx` + `src/app/twitter-image.tsx` already exist; they just weren't reachable.

**Verification plan**: post-deploy, curl `https://eduardfischer.dev/opengraph-image` and expect 200 + `image/png`.

## Bugs queued for Eduard

None ambiguous. Everything found was either auto-fixed or pre-existing-and-known (lint warnings, imapflow typecheck error).

## Notes

- 6 ESLint warnings present but all pre-existing (unused vars in scripts + one test); not in scope.
- Typecheck `imapflow` error pre-existing per `MEMORY.md`; ignored.
- Did not touch `public/photos/personal/` (already shipped in PR #56).
- Agent #23's branch `feat/drop-remaining-people-photos` merged (#58) before this PR opened — this branch is rebased on top.
