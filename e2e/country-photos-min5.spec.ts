/**
 * Enforces the core photo-quality invariant:
 *   For every country the user has visited, every city shown on the
 *   /travel/photos/country/[slug] page must have ≥ 5 distinct photos.
 *
 * The test dynamically discovers all country slugs by scraping the
 * /travel country-card grid, so it keeps itself up to date as new
 * countries are added to the catalogue.
 */
import { test, expect } from "@playwright/test";

test("every country page: each city has ≥5 photos", async ({ page }) => {
  // 1. Collect all country slugs from the /travel page country cards.
  await page.goto("/travel");
  await expect(
    page.locator('[id^="country-"]').first(),
  ).toBeVisible({ timeout: 15_000 });

  const countrySlugs: string[] = await page
    .locator('[id^="country-"] a[href^="/travel/photos/country/"]')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? "")
        .map((href) => href.replace("/travel/photos/country/", ""))
        .filter(Boolean),
    );

  expect(countrySlugs.length).toBeGreaterThan(0);

  const failures: string[] = [];

  for (const slug of countrySlugs) {
    await page.goto(`/travel/photos/country/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10_000,
    });

    const sections = page.locator('[data-testid="city-section"]');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);
      const city = await section.getAttribute("data-city");
      const thumbs = section.locator('[data-testid="lightbox-thumb"]');
      const thumbCount = await thumbs.count();

      if (thumbCount < 5) {
        failures.push(
          `${slug} → ${city ?? "?"}: ${thumbCount}/5 photos`,
        );
      }

      // All thumbnail <img> src values within a city must be distinct
      // (no duplicate photos shown side by side).
      const srcs: string[] = await thumbs
        .locator("img")
        .evaluateAll((imgs) =>
          imgs
            .map((img) => (img as HTMLImageElement).getAttribute("src") ?? "")
            .filter(Boolean),
        );
      const unique = new Set(srcs);
      if (unique.size < srcs.length) {
        failures.push(
          `${slug} → ${city ?? "?"}: ${srcs.length - unique.size} duplicate photo(s)`,
        );
      }
    }
  }

  expect(
    failures,
    `Photo quality failures:\n${failures.join("\n")}`,
  ).toHaveLength(0);
});

test("country page: back link returns to /travel", async ({ page }) => {
  await page.goto("/travel/photos/country/germany");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const backLink = page.locator('a[href="/travel"]').first();
  await expect(backLink).toBeVisible();
  await backLink.click();
  await page.waitForURL("/travel");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
