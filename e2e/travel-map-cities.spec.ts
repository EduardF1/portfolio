import { test, expect } from "@playwright/test";

/**
 * /travel city dots: gated behind the Cities toggle, hover surfaces a
 * tooltip with `{city}, {country} · {n} photo(s)`, click scrolls to the
 * matching trip card or country tile.
 */

test.describe("/travel city overlay", () => {
  test("Cities toggle reveals dots and hover surfaces a tooltip", async ({
    page,
  }) => {
    const response = await page.goto("/en/travel");
    expect(response?.status()).toBe(200);

    // The Cities toggle is gated behind a non-empty city list. The
    // catalogue ships ~74 cities, so the button is always rendered.
    const citiesToggle = page.getByTestId("map-view-cities");
    await expect(citiesToggle).toBeVisible();
    await expect(citiesToggle).toHaveAttribute("aria-pressed", "false");

    // No city dots in the default view.
    await expect(page.locator('[data-testid="city-dot"]').first()).toHaveCount(
      0,
    );

    await citiesToggle.click();
    await expect(citiesToggle).toHaveAttribute("aria-pressed", "true");

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

  test("URL ?map=cities deep-links into the Cities view", async ({ page }) => {
    await page.goto("/en/travel?map=cities");
    await expect(page.getByTestId("map-view-cities")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.locator('[data-testid="city-dot"]').first(),
    ).toBeVisible();
  });
});
