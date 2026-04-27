import type { Page } from "@playwright/test";
import { bundesligaTable, bundesligaMatches, dfbMatches } from "./bvb-fixtures";

/**
 * Playwright route fixture for the BVB live feed.
 *
 * Why
 * ---
 * `src/lib/bvb.ts` calls three OpenLigaDB endpoints — `/getbltable/bl1/...`,
 * `/getmatchdata/bl1/...` and `/getmatchdata/dfb/...`. The cross-platform
 * matrix (`CROSS_PLATFORM=1`) runs the BVB spec across 9 projects, which
 * adds up to 27 live calls per nightly run plus another 27 on every PR
 * retry. That's both rude to the free, key-less upstream and a major
 * source of nightly flakes (rate limits, season-rollover issues, brief
 * upstream downtime). This helper returns deterministic JSON instead.
 *
 * Opt-out
 * -------
 * Setting `LIVE_INTEGRATIONS=1` in the spec environment makes
 * {@link mockBvbApi} a no-op. Use this for ad-hoc smoke tests against the
 * real API; never enable it in CI. The default (`mockBvbApi` active) is
 * what every PR + nightly run uses.
 *
 * Important caveat about Server Components
 * ----------------------------------------
 * `getBvbFeed()` is invoked by a React Server Component on the Next.js
 * server. Playwright's `page.route()` only intercepts requests made by
 * the BROWSER context — i.e. fetches issued from the browser-side JS
 * runtime. Server-side fetches issued by Next.js itself (via the
 * `next: { revalidate }` cache layer) are NOT routed through Playwright.
 *
 * In practice this still helps because:
 *   1. Crest images (`<img src="https://...openligadb.de/...">`) are
 *      browser-side requests that *are* intercepted (we don't currently
 *      mock those — they 404 silently and the alt-text fallback wins).
 *   2. Any future client-side BVB fetches (e.g. an "auto-refresh"
 *      enhancement) would be intercepted automatically.
 *   3. It documents the intent — anyone copying the pattern for another
 *      live integration knows how to wire it up.
 *
 * For full server-side determinism we still rely on:
 *   - The Next.js fetch cache (the dev server is started once per
 *     Playwright run, the first hit warms ISR, subsequent hits are
 *     cached for 1 hour — see `REVALIDATE_SECONDS` in `src/lib/bvb.ts`).
 *   - The `data-bvb` row + tab structure being deterministic enough that
 *     the spec passes against any season payload.
 *
 * If a future round adds client-side BVB fetching, this helper kicks in
 * automatically and the cross-platform matrix stops hammering the API.
 */
export async function mockBvbApi(page: Page): Promise<void> {
  if (process.env.LIVE_INTEGRATIONS === "1") {
    // Explicit opt-out for ad-hoc smoke testing against the real API.
    // Never set this in CI.
    return;
  }

  // Bundesliga table — `https://api.openligadb.de/getbltable/bl1/{season}`.
  // The wildcard tolerates whatever season the test run lands on (season
  // crossover handling in `getCurrentSeasonStartYear` is exercised by the
  // unit tests, not e2e).
  await page.route("**/api.openligadb.de/getbltable/**", (route) =>
    route.fulfill({ json: bundesligaTable }),
  );

  // Bundesliga matches — `/getmatchdata/bl1/{season}`. Filtered to
  // BVB-only on the lib side; we ship 5 BVB matches plus none of the
  // 300+ non-BVB rows.
  await page.route("**/api.openligadb.de/getmatchdata/bl1/**", (route) =>
    route.fulfill({ json: bundesligaMatches }),
  );

  // DFB-Pokal matches — `/getmatchdata/dfb/{season}`. Same idea, 2 BVB
  // cup ties.
  await page.route("**/api.openligadb.de/getmatchdata/dfb/**", (route) =>
    route.fulfill({ json: dfbMatches }),
  );
}
