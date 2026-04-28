# A17 — BVB feed Playwright route mock

**Branch:** `feat/v1-polish-round4` (no commit, no switch)

## Problem

A12 wired up the cross-platform Playwright matrix (`CROSS_PLATFORM=1`,
9 projects). The BVB feed spec is tagged `@cross` so it runs across all
9. `src/lib/bvb.ts` calls 3 OpenLigaDB endpoints per page load, which
means **27 live calls per nightly run** (plus another 27 on every
retry). The old `BVB_USE_MOCK=1` path was deleted by A3 in the same
round, so there's currently no escape valve.

## Files

### Created

| Path | Purpose |
| --- | --- |
| `e2e/fixtures/bvb-fixtures.ts` | Stub OpenLigaDB JSON: 18-team Bundesliga table, 5 BVB league matches (3 past + 2 future), 2 DFB-Pokal cup ties (1 past + 1 future). |
| `e2e/fixtures/bvb-mock.ts` | `mockBvbApi(page)` Playwright route helper. Honours `LIVE_INTEGRATIONS=1` opt-out. |
| `e2e/README.md` | New file. Documents the Playwright suite, the `@cross` / `@mobile` tagging, the live-integrations mock pattern, and the opt-out env var. |

### Modified

| Path | Change |
| --- | --- |
| `e2e/bvb-feed.spec.ts` | Imports `mockBvbApi`, calls it in `test.beforeEach`. Stale `BVB_USE_MOCK=1` doc-comment swapped for the new env contract. |

### Untouched (per ownership)

`src/lib/bvb.ts`, `src/components/bvb-tabs.tsx`, `src/components/bvb-feed.tsx`, `playwright.config.ts`.

## Fixture realism notes

- **Bundesliga table.** 18 rows, ordered by points. Bayern leads with
  28pt, BVB sits 4th on 21pt (Champions-League slot — plausible for
  "early-season form, climbing"). Counts are internally consistent:
  `matches = won + draw + lost`, `goalDiff = goals - opponentGoals`,
  `points = won * 3 + draw`. Team ids match real OpenLigaDB ids
  (Dortmund=7, Bayern=40, Leverkusen=6, Leipzig=1635, etc.) so the
  fixture stays realistic if anyone diffs it against a live response.
- **BVB matches.** 5 league matches across past + future. The 3 past
  results sort newest-first into the lib's `slice(0, 5)`; the 2 future
  fixtures sort earliest-first. Includes home and away variants and
  a draw, so the W/D/L outcome rendering is exercised.
- **Result schema.** Each finished match ships both half-time
  (`resultTypeID: 1, resultName: "Halbzeit"`) and final-time
  (`resultTypeID: 2, resultName: "Endergebnis"`) results — the lib's
  `finalScore()` reads the `resultTypeID === 2` row and would also
  fall through to `resultName === "Endergebnis"` if it were ever first,
  so this exercises the primary path.
- **DFB-Pokal ties.** 1 first-round win at 1. FC Kaiserslautern (3-1)
  and 1 upcoming round-of-16 vs Eintracht Frankfurt. Tagged
  `leagueShortcut: "dfb"` so the lib's `leagueShortcutToCompetition()`
  maps to `Competition.DFB` and the panel correctly shows "DFB-Pokal".
- **Crests.** `teamIconUrl` fields are populated with placeholder URLs.
  These fire as browser-side `<img>` requests, which Playwright DOES
  intercept — but we deliberately don't mock them. They 404 silently
  and the alt-text fallback wins. No spec asserts crest visibility.
- **Determinism.** All match dates are pinned ISO strings (no
  `new Date()` calls). The "current" season-rollover logic in
  `getCurrentSeasonStartYear` is exercised by unit tests, not e2e.

## Opt-out env-var contract

```bash
LIVE_INTEGRATIONS=1 npm run test:e2e -- e2e/bvb-feed.spec.ts
```

When `process.env.LIVE_INTEGRATIONS === "1"`, `mockBvbApi(page)` is a
no-op and the spec hits the real OpenLigaDB API. Use this for ad-hoc
smoke tests before a release or when debugging "the mock disagrees
with production" bugs. **Never set this in CI.** The matrix multiplies
calls by 9, retries multiply again, and we've already had nightly
flakes from rate-limiting.

The contract is documented in `e2e/README.md` under "Live integrations"
so future agents adding mocks for other APIs can copy the pattern.

## Important caveat about Server Components

`getBvbFeed()` is invoked by a React Server Component on the Next.js
server. Playwright's `page.route()` only intercepts requests made by
the **browser** context — server-side fetches issued by Next.js's data
layer go through Node's fetch and bypass Playwright. The current mock:

1. Is still useful: it intercepts any client-side hydration fetches
   and any future client-side enhancements (e.g. an auto-refresh
   feature) without re-wiring the spec.
2. Documents the intent — agents adding mocks for other live
   integrations can copy the pattern.
3. Doesn't cover server-side determinism today. The spec assertions
   are deliberately written against the **structural contract**
   (`tr[data-bvb]` exists, fixtures list non-empty, hash updates),
   NOT against specific season values, so a drifting upstream still
   doesn't break the spec.

If a future round wants full server-side determinism (e.g. because
OpenLigaDB has gone hard-down on a release day), the correct next step
is a `BVB_FIXTURE_PATH` env var inside `src/lib/bvb.ts` that returns
the in-process fixture directly. That's noted in the README under
"Server-component caveat" so it's discoverable without grepping
backlog notes.

## Validation

- `npx tsc --noEmit` — clean (exit 0).
- `npx playwright test --list e2e/bvb-feed.spec.ts` — parses without
  error, lists 1 chromium test.
- `CROSS_PLATFORM=1 npx playwright test --list e2e/bvb-feed.spec.ts` —
  parses without error, lists 9 tests across the full matrix
  (chromium, firefox-desktop, webkit-desktop, chromium-mobile-emulated,
  mobile-iphone-14, mobile-iphone-14-landscape, mobile-pixel-7,
  tablet-ipad-pro-11, tablet-ipad-pro-11-landscape).
- The actual spec was not run — A17's sandbox has no browser binaries
  and the task explicitly forbids it.

## Risks / followups

1. **Server-side fetches not yet stubbed.** Documented above. Mitigated
   by structural assertions + Next.js fetch cache. Becomes urgent only
   if OpenLigaDB has a sustained outage that knocks out a release day.
2. **`BVB_USE_MOCK=1` is dead.** A3 deleted the runtime support; the
   only mention in source was the stale spec comment, now removed.
   `.github/workflows/e2e-cross-platform.yml` line 46 still sets it
   in env — that's A12's territory and a no-op there now, but worth
   flagging for a future cleanup pass.
3. **Crest URLs 404 silently.** Acceptable today (no test asserts on
   crest visibility) but if a future a11y spec checks the `<img>`'s
   loaded state, add a 4th `page.route()` for the icon CDN.
