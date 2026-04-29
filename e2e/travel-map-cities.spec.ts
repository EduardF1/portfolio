import { test, expect } from "@playwright/test";

/**
 * /travel combined Map view: the chloropleth and per-city dots render
 * together by default. Hover on a dot surfaces a tooltip with
 * `{city}, {country} · {n} photo(s)`, click scrolls to the matching
 * trip card or country tile.
 */

test.describe("/travel combined map view", () => {
  test("Map is the default view and renders dots overlaid on the chloropleth", async ({
    page,
  }) => {
    const response = await page.goto("/en/travel");
    expect(response?.status()).toBe(200);

    // The combined Map view is the new default — no toggle click
    // required. Dots render immediately alongside the chloropleth.
    const mapToggle = page.getByTestId("map-view-map");
    await expect(mapToggle).toBeVisible();
    await expect(mapToggle).toHaveAttribute("aria-pressed", "true");

    // Legend appears in the combined view.
    await expect(page.getByTestId("map-legend")).toBeVisible();

    const dots = page.locator('[data-testid="city-dot"]');
    const count = await dots.count();
    expect(count).toBeGreaterThan(10);

    // Each dot has a tooltip-style aria-label "{city}, {country} · N photo(s)".
    // Hover the first dot and assert *some* tooltip with the same
    // shape is visible. We do not assert which exact city wins the
    // race because city dots from neighbouring cities can overlap in
    // screen space, so the cursor's landing position picks the
    // top-most one — `firstDot` may differ from the rendered tooltip.
    const firstDot = dots.first();
    const ariaLabel = await firstDot.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/^.+,\s.+\s·\s\d+\sphotos?$/);

    // The sticky site header can sit over the top of the map at small
    // viewport offsets, so we hover with `force` to bypass the
    // pointer-intercept guard.
    await firstDot.scrollIntoViewIfNeeded();
    await firstDot.hover({ force: true });
    // The tooltip <g> is inserted on hover; its <text> contains a
    // line in the "{city}, {country} · N photo(s)" format.
    const tooltip = page.locator('[data-testid="city-tooltip"]').first();
    await expect(tooltip).toBeVisible();
    const tooltipText = await tooltip
      .locator("text")
      .first()
      .textContent();
    expect(tooltipText).toMatch(/^.+,\s.+\s·\s\d+\sphotos?$/);
  });

  test("Destinations toggle hides city dots and shows country pins", async ({
    page,
  }) => {
    await page.goto("/en/travel");
    const destToggle = page.getByTestId("map-view-destinations");
    await expect(destToggle).toBeVisible();
    await destToggle.click();
    await expect(destToggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-testid="city-dot"]').first()).toHaveCount(
      0,
    );
  });

  test("legacy ?map=cities deep-link is folded into the combined Map view", async ({
    page,
  }) => {
    await page.goto("/en/travel?map=cities");
    // Older shared link still lands on something useful: the combined
    // Map view, with both chloropleth and city dots visible.
    await expect(page.getByTestId("map-view-map")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.locator('[data-testid="city-dot"]').first(),
    ).toBeVisible();
  });

  test("?map=destinations deep-links into the simpler Destinations view", async ({
    page,
  }) => {
    await page.goto("/en/travel?map=destinations");
    await expect(page.getByTestId("map-view-destinations")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[data-testid="city-dot"]').first()).toHaveCount(
      0,
    );
  });
});
