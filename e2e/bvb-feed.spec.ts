import { test, expect } from "@playwright/test";

/**
 * BVB Flashscore feed on /personal — happy path. Tagged @cross so it runs
 * across the desktop/laptop/tablet/mobile project matrix.
 *
 * The dev/CI server should be started with BVB_USE_MOCK=1 so the data is
 * deterministic and no API key is needed.
 */
test.describe("BVB feed @cross", () => {
  test("loads with the standings tab via #standings hash and switches to fixtures", async ({
    page,
  }) => {
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
  });
});
