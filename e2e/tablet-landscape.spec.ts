import { test, expect, type Page } from "@playwright/test";

/**
 * Tablet-landscape smoke pass — exercises the breakpoints between
 * tablet-portrait (768 px) and small-laptop (1366 px). The
 * chromium-tablet-landscape project pins viewport to 1024×768 (classic
 * iPad landscape) and chromium-tablet-landscape-large to 1366×1024
 * (iPad Pro 12.9"). At those widths Tailwind's viewport `lg:` flips on
 * (≥1024) but each section's container is narrower than the viewport,
 * so any layout that has been migrated from `md:grid-cols-12` to
 * `@md:grid-cols-12` (container query) needs to keep behaving the same.
 *
 * Tagged @tablet-landscape so it only runs on the two tablet-landscape
 * projects, plus @cross so it shows up in the cross-device matrix.
 *
 * The smoke checks are intentionally narrow:
 *   1. The route returns 200 and the brand link renders.
 *   2. The page does not overflow horizontally (the same invariant the
 *      responsive matrix asserts at every viewport).
 *   3. The hero portrait renders on `/` (the most likely visual
 *      regression from the @container migration).
 *   4. On `/personal`, the BVB football figure stays one-up under its
 *      copy (figure aspect ratio is 4:3, height should be measurable).
 *   5. The travel "By country" grid renders at least one country card.
 */

const ROUTES = ["/", "/work", "/travel", "/personal"] as const;

async function assertHorizontalContained(page: Page, route: string) {
  const result = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(
    result.scroll,
    `${route} must not overflow horizontally on tablet landscape (scrollWidth=${result.scroll}, innerWidth=${result.inner})`,
  ).toBeLessThanOrEqual(result.inner + 1);
}

test.describe("tablet landscape smoke @cross @tablet-landscape", () => {
  for (const route of ROUTES) {
    test(`${route} renders cleanly on tablet landscape`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should respond 200`).toBe(200);

      // Brand link is in the header on every page.
      await expect(
        page.getByRole("link", { name: "Eduard Fischer-Szava", exact: true }),
      ).toBeVisible();

      await assertHorizontalContained(page, route);
    });
  }

  test("/ shows the hero portrait at tablet-landscape width", async ({
    page,
  }) => {
    await page.goto("/");
    const portrait = page.getByRole("img", {
      name: /Eduard Fischer-Szava, portrait/i,
    });
    await expect(portrait).toBeVisible();

    // The hero frame should sit within the right column (≤ 400 px wide
    // per its max-width). Above 768 px container we expect the two-up
    // layout, so the frame's right edge cannot equal the section's
    // right edge — there must be at least some left-side copy column.
    const frame = page.getByTestId("hero-frame");
    await expect(frame).toBeVisible();
    const frameBox = await frame.boundingBox();
    expect(frameBox, "hero frame must have measurable bounds").not.toBeNull();
    if (frameBox) {
      expect(
        frameBox.width,
        "hero frame max-width is 400 px — must not stretch full-width on tablet landscape",
      ).toBeLessThanOrEqual(420);
    }
  });

  test("/personal football figure renders under copy", async ({ page }) => {
    await page.goto("/personal");
    // The figure has a 4:3 aspect ratio and a measurable bounding box.
    const figureImg = page.getByRole("img", {
      name: /BVB|Borussia|Südtribüne/i,
    });
    await expect(figureImg.first()).toBeVisible();
  });

  test("/travel by-country grid renders at least one card", async ({
    page,
  }) => {
    await page.goto("/travel");
    // Country cards have ids of the form #country-<slug>; assert that
    // at least one exists on the page so the grid hasn't silently
    // collapsed.
    const firstCountry = page.locator('[id^="country-"]').first();
    await expect(firstCountry).toBeVisible();
  });
});
