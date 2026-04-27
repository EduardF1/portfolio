# A3 — Bundesliga Live Data (round 5)

## Eduard's ask
> "For the bundesliga table, remove sample data and use a real live data api integration for us to keep it live and up to date like flashscore."

## API chosen — OpenLigaDB

**https://api.openligadb.de/** — free, public, **no API key**, no
account, no rate-limit headers, no RapidAPI middleman. Built for German
football, so Bundesliga (`bl1`) and DFB-Pokal (`dfb`) are first-class
citizens.

Why this API over the alternatives:

- **football-data.org** (the previous integration) requires a free token
  and a hard 10-req/min cap. Setting up Vercel env vars for a personal
  portfolio is friction Eduard does not need; we'd also have to keep
  a fallback for when the token is missing — which is precisely the
  "sample data" path the user wants gone.
- **api-football.com** (RapidAPI) is also keyed and ships with a 100
  req/day cap on free tier. Worse experience.
- **OpenLigaDB** is the only mainstream, free, key-less option. Eduard
  doesn't have to set or rotate anything; if the upstream is down we
  show an empty state, full stop.

## Endpoints used

| Endpoint                                   | Purpose                            |
| ------------------------------------------ | ---------------------------------- |
| `GET /getbltable/bl1/{season}`             | Bundesliga standings table         |
| `GET /getmatchdata/bl1/{season}`           | All Bundesliga matches that season |
| `GET /getmatchdata/dfb/{season}`           | All DFB-Pokal matches that season  |

Three calls per ISR window. The match feeds are filtered down to BVB
(team id `7`, with a name-based fallback for resilience) and then
partitioned into upcoming fixtures (matchIsFinished=false, sorted asc,
top 5) and recent results (matchIsFinished=true, sorted desc, top 5).

Season is auto-derived from `Date.now()`: anything before 1 July of
year Y belongs to season Y-1 (matches the OpenLigaDB convention).

## Caching strategy

`fetch(url, { next: { revalidate: 3600 } })` — 1-hour ISR. OpenLigaDB
has no published quota, but hourly is more than fresh enough for an
editorial portfolio and stays polite on a free, key-less API. With
three endpoints * 1 revalidation/hour = 3 requests/hour at peak.

## Sample data — fully removed

- Deleted `MOCK_FEED`, `MOCK_STANDINGS`, `MOCK_FIXTURES`, `MOCK_RESULTS`
- Deleted `BVB_USE_MOCK` env handling
- Deleted `FOOTBALL_DATA_TOKEN` / `BVB_API_TOKEN` env handling
- `getBvbFeed()` now returns `EMPTY_FEED` (zero rows, `isMock: false`)
  on total upstream failure. Partial failures keep the working tabs
  and empty out the failing one.
- The `isMock: boolean` field is **kept on the type** (always `false`)
  so the existing UI's mock-data badge component / e2e selectors keep
  type-checking. The badge will simply never appear in production.

## Test status

`src/lib/bvb.test.ts` — **18 / 18 passing**
- Happy path: standings ordered by points, BVB row mapped (incl. `BVB`
  TLA derivation and crest URL), 1 future BL fixture, 3 BVB-only
  results across both BL and DFB (newest-first), non-BVB matches
  filtered out, exact endpoint URLs hit with the current season.
- ISR: every fetch carries `next.revalidate === 3600`.
- No auth headers sent (OpenLigaDB is keyless).
- Failure paths: 500 from all → empty feed; fetch throws → empty feed;
  malformed JSON → empty feed; partial failure → keep working tabs.
- Schema-defence: rows missing `matchID` / `matchDateTimeUTC` are
  dropped silently rather than rendering as `NaN`/blank cells.
- Helpers: `isBvbTeam`, `deriveTla`, `competitionDisplayName`,
  `leagueShortcutToCompetition`, `finalScore`, `getCurrentSeasonStartYear`,
  `toResult`, `toFixture`.

`tsc --noEmit` — clean.
`eslint src/lib/bvb.ts src/lib/bvb.test.ts` — clean.

### Known collateral failure (not in my ownership)

`src/components/bvb-feed.test.tsx` has a small `getBvbFeed (mock
fallback)` describe at the bottom (2 tests, lines 133-160) that asserts
`data.isMock === true` when no token is set or when `BVB_USE_MOCK=1`.
Both assert the exact behavior Eduard asked us to **remove**, so they
now fail:

- "returns mock data when no API token is configured" — fails (no
  longer a token-gated path)
- "returns mock data when BVB_USE_MOCK=1 even with a token set" — fails
  (`BVB_USE_MOCK` is no longer wired)

The other 7 tests in that file (the real `<BvbTabs />` UI tests) still
pass. Per the round-5 ownership matrix this file is not mine to touch;
**a follow-up agent (or Eduard) should delete those two test cases**
or replace them with an empty-state test like:

```ts
it("returns an empty live feed when OpenLigaDB is unreachable", async () => {
  globalThis.fetch = vi.fn(async () => new Response("nope", { status: 500 }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { getBvbFeed } = await import("@/lib/bvb");
  const data = await getBvbFeed();
  expect(data.isMock).toBe(false);
  expect(data.standings).toEqual([]);
});
```

## Env vars

**None.** OpenLigaDB needs no key. `.env.example` was updated to remove
`FOOTBALL_DATA_TOKEN` and `BVB_USE_MOCK` and now documents that the
section is fully live with no setup required.

## Things Eduard should know

1. **First load after deploy will hit OpenLigaDB three times** to warm
   the ISR cache. After that, every visitor in the next hour gets the
   cached HTML — zero upstream traffic per visitor.
2. **Crest images are inline `<img>` from `upload.wikimedia.org`.** The
   existing component already opts out of `next/image` for them with
   an `eslint-disable-next-line @next/next/no-img-element` comment, so
   no `next.config` `images.remotePatterns` change is needed.
3. **TLA derivation** is hand-rolled because OpenLigaDB does not ship
   a 3-letter abbreviation. The Bundesliga table in `bvb.ts` covers
   the 18 current first-tier clubs plus a few historical (HSV, S04,
   Hertha) and second-tier likely cup opponents; anything not on the
   list falls back to the first 3 letters of the short name. This will
   degrade gracefully for obscure DFB-Pokal lower-league opponents.
4. **The Playwright spec** at `e2e/bvb-feed.spec.ts` still references
   `BVB_USE_MOCK=1` in a doc comment as the way to get deterministic
   data. That env var is now a no-op. The e2e will hit OpenLigaDB
   live on every run, which is fine but not deterministic. If CI
   flakiness becomes an issue, the cleanest fix is to add a Playwright
   route mock for `**/api.openligadb.de/**` in the spec — that's
   outside A3's ownership too.
5. **Season rollover.** The `getCurrentSeasonStartYear()` helper uses
   1 July as the boundary. OpenLigaDB normally publishes the new
   season's table by the time pre-season kicks off in late July, so
   the boundary is safe. If the table for a brand-new season is
   briefly empty between 1 July and the first matchday, the section
   will render the empty state for those few weeks — that's correct,
   not a bug.
6. **No "live ticker"-style auto-refresh.** A flashscore-grade live
   minute-by-minute feed would need either WebSockets or sub-minute
   polling, which is overkill for a portfolio. Hourly ISR matches
   "post-match coverage" depth, which is what the section is for.
