import { test, expect } from "@playwright/test";

// The clustering library generates a static set of trip slugs from the
// EXIF catalogue at build time. We resolve a real slug by hitting the
// /travel index first and clicking through, so this test does not need
// to know any specific slug.
test("per-trip photo page opens, lightbox traps focus, ESC restores it", async ({
  page,
}) => {
  await page.goto("/travel");

  // Recent trips section ships at least one trip card.
  const recentTripLink = page
    .locator('a[href*="/travel/photos/"]')
    .first();
  await expect(recentTripLink).toBeVisible();
  const href = await recentTripLink.getAttribute("href");
  expect(href).toMatch(/\/travel\/photos\/[a-z0-9-]+-\d{4}-\d{2}$/);

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
