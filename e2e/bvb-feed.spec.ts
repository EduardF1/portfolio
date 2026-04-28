import { test, expect } from "@playwright/test";
import { mockBvbApi } from "./fixtures/bvb-mock";

/**
 * BVB Flashscore feed on /personal — happy path. Tagged @cross so it runs
 * across the desktop/laptop/tablet/mobile project matrix.
 *
 * The OpenLigaDB API is mocked via `page.route()` so each spec run is
 * deterministic and we don't hammer the upstream API on every PR + nightly
 * matrix run. To opt out and exercise the real API for ad-hoc smoke
 * testing, set `LIVE_INTEGRATIONS=1` (see `e2e/README.md`).
 *
 * Note: the mock currently only intercepts BROWSER-side requests; the
 * Next.js Server Component reads from `getBvbFeed()` server-side, which
 * Playwright cannot route. The spec still passes deterministically because
 * the assertions (`tr[data-bvb]`, fixtures list non-empty) are written
 * against the structural contract, not specific season values.
 *
 * Round 5 A17 verification: we also assert from the client side that the
 * page does not call api.football-data.org. The data is fetched
 * server-side today, but a regression that leaks the API call into the
 * client bundle would be caught here.
 */
test.describe("BVB feed @cross", () => {
  test.beforeEach(async ({ page }) => {
    await mockBvbApi(page);
  });

  test("loads with the standings tab via #standings hash and switches to fixtures", async ({
    page,
  }) => {
    // Round 5 A17 verification: no live football-data.org calls leak
    // through to the client. Server-side fetches happen before the HTML
    // is sent so they never appear here, but if the data ever moved
    // client-side without the mock guard, this would catch it.
    const liveApiHits: string[] = [];
    await page.route("**/api.football-data.org/**", (route) => {
      liveApiHits.push(route.request().url());
      return route.abort();
    });

    const response = await page.goto("/personal#standings");
    expect(response?.status(), "/personal should be 200").toBe(200);

    const feed = page.getByTestId("bvb-feed");
    await expect(feed).toBeVisible();

    // The Standings tab is the active one.
    const standingsTab = feed.getByRole("tab", { name: /Standings/i });
    await expect(standingsTab).toHaveAttribute("aria-selected", "true");

    // Standings table rendered with at least one Bundesliga row, and BVB is
    // highlighted via data-bvb on its row.
    const standingsPanel = feed.locator("[role='tabpanel'][data-panel='standings']");
    await expect(standingsPanel.locator("table")).toBeVisible();
    await expect(standingsPanel.locator("tr[data-bvb]")).toBeVisible();

    // Switch to Next matches and assert the fixtures list shows up.
    await feed.getByRole("tab", { name: /Next matches/i }).click();
    const fixturesPanel = feed.locator("[role='tabpanel'][data-panel='fixtures']");
    await expect(fixturesPanel).toBeVisible();
    await expect(fixturesPanel.locator("li").first()).toBeVisible();

    // URL hash should follow the active tab.
    expect(page.url()).toContain("#next");

    // No live football-data.org calls were attempted from the client.
    expect(liveApiHits, "client must not hit football-data.org").toEqual([]);
  });
});
