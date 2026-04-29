import { test, expect } from "@playwright/test";

// The clustering library generates a static set of trip slugs from the
// EXIF catalogue at build time. We resolve a real slug by hitting the
// /travel index first and clicking through, so this test does not need
// to know any specific slug.
test("per-trip photo page opens, lightbox traps focus, ESC restores it", async ({
  page,
}) => {
  await page.goto("/travel");

  // Recent trips section ships at least one trip card. Filter out the SVG
  // map city-dot links which share the href pattern but live inside <svg>
  // and intercept pointer events behind other markers.
  const recentTripLink = page
    .locator('a[href*="/travel/photos/"]:not([data-testid="city-dot"])')
    .first();
  await expect(recentTripLink).toBeVisible();
  const href = await recentTripLink.getAttribute("href");
  expect(href).toMatch(/^\/travel\/photos\/[a-z0-9-]+-\d{4}-\d{2}(?:-\d+)?$/);

  await recentTripLink.click();
  await page.waitForURL(/\/travel\/photos\//);

  // Title should be present.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // At least one thumbnail.
  const firstThumb = page.getByTestId("lightbox-thumb").first();
  await expect(firstThumb).toBeVisible();

  // Click → lightbox opens.
  await firstThumb.click();
  const dialog = page.getByTestId("lightbox-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // ESC closes; focus returns to the originating thumbnail.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(firstThumb).toBeFocused();
});

test("country card links into the country's primary trip, per-trip page renders city sections with deep-link anchors", async ({
  page,
}) => {
  await page.goto("/travel");

  // The "By country" section renders country cards as <li> with id
  // "country-<slug>"; each card wraps a Link to a real trip slug.
  const countryCard = page.locator('[id^="country-"] a[href^="/travel/photos/"]').first();
  await expect(countryCard).toBeVisible();
  const href = await countryCard.getAttribute("href");
  expect(href).toMatch(/^\/travel\/photos\/[a-z0-9-]+-\d{4}-\d{2}(?:-\d+)?$/);
  await countryCard.click();
  await page.waitForURL(/\/travel\/photos\//);

  // Per-trip page renders at least one city section with id="city-<slug>"
  // and a heading; its scroll-mt offset means the anchor is reachable.
  const firstCitySection = page.locator('[data-testid="city-section"]').first();
  await expect(firstCitySection).toBeVisible();
  const cityId = await firstCitySection.getAttribute("id");
  expect(cityId).toMatch(/^city-[a-z0-9-]+$/);

  // Deep-link to the city anchor scrolls without 404'ing.
  const url = new URL(page.url());
  url.hash = `#${cityId}`;
  await page.goto(url.toString());
  await expect(firstCitySection).toBeInViewport();
});
