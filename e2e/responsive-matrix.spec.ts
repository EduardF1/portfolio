import { test, expect, type Page } from "@playwright/test";

/**
 * Cross-device responsive matrix.
 *
 * Runs on every project in playwright.config.ts (chromium-desktop,
 * chromium-laptop-1366, chromium-tablet, mobile-iphone-14,
 * mobile-iphone-se, mobile-pixel-7, mobile-galaxy-s5) and visits every
 * top-level public route to assert three V1 invariants:
 *
 *   1. No horizontal overflow (the "drag right reveals empty bg" bug).
 *   2. The primary nav is reachable — either the inline links are
 *      visible (≥md) or the hamburger trigger is visible (<md).
 *   3. Some non-trivial hero/page content is visible (the brand link,
 *      which is in the header on every page).
 *
 * Tagged @cross so it picks up on every project (mobile projects only
 * run @mobile|@cross). Single page.goto per route, parallel assertions.
 */

const ROUTES = ["/", "/work", "/personal", "/travel", "/contact", "/my-story"] as const;

async function assertNoHorizontalOverflow(page: Page, route: string) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scroll: doc.scrollWidth,
      inner: window.innerWidth,
    };
  });
  // +1px tolerance for sub-pixel rounding (common on devicePixelRatio>1).
  expect(
    result.scroll,
    `${route} must not overflow horizontally (scrollWidth=${result.scroll}, innerWidth=${result.inner})`,
  ).toBeLessThanOrEqual(result.inner + 1);
}

async function assertNavReachable(page: Page) {
  // Either the inline nav (md+) renders the Work link, or the mobile
  // hamburger trigger is visible. We only require ONE of them — that's
  // the contract: nav must be reachable on every viewport.
  const inlineNav = page.getByRole("navigation", { name: "Primary" });
  const hamburger = page.getByTestId("mobile-menu-trigger");

  const inlineVisible = await inlineNav.isVisible().catch(() => false);
  const hamburgerVisible = await hamburger.isVisible().catch(() => false);

  expect(
    inlineVisible || hamburgerVisible,
    "primary nav must be reachable — either inline links or hamburger button visible",
  ).toBe(true);
}

async function assertHeroBrandVisible(page: Page) {
  // The brand link appears on every page (it's in the SiteHeader).
  // This is the cheapest "page rendered something" probe that works
  // across all six routes without coupling to per-page copy.
  await expect(
    page.getByRole("link", { name: "Eduard Fischer-Szava", exact: true }),
  ).toBeVisible();
}

test.describe("responsive matrix @cross", () => {
  for (const route of ROUTES) {
    test(`${route} renders cleanly across the device matrix`, async ({
      page,
    }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should respond 200`).toBe(200);

      await assertHeroBrandVisible(page);
      await assertNoHorizontalOverflow(page, route);
      await assertNavReachable(page);
    });
  }

  test("/ shows the hero portrait", async ({ page }) => {
    await page.goto("/");
    // Hero portrait is identifiable by its accessible name (alt text).
    await expect(
      page.getByRole("img", { name: /Eduard Fischer-Szava, portrait/i }),
    ).toBeVisible();
  });
});
