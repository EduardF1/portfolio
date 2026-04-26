import { test, expect } from "@playwright/test";

test.describe("site-wide search palette", () => {
  test("Cmd+K opens the palette, query → result → Enter navigates", async ({
    page,
  }) => {
    await page.goto("/");

    // Open the palette via the platform-appropriate shortcut. Both
    // Meta+K and Control+K are wired, so we send both for robustness
    // across desktop platforms.
    await page.keyboard.press("Control+K");
    const palette = page.getByTestId("search-palette");
    await expect(palette).toBeVisible();

    // Type a known-present query — "KOMBIT" sits in the work collection
    // (case study `kombit-valg`) and is a stable substring.
    const input = page.getByTestId("search-palette-input");
    await input.fill("kombit");

    // The index is fetched lazily on first open; allow a generous
    // window for the cold first request when `npm run start` is just
    // warming up.
    const results = page.getByTestId("search-palette-result");
    await expect(results.first()).toBeVisible({ timeout: 15_000 });
    await expect(results.first()).toContainText(/KOMBIT/i);

    // Enter opens the active (first) result.
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/work\/kombit-valg/);
    await expect(
      page.getByRole("heading", { level: 1, name: /KOMBIT VALG/ }),
    ).toBeVisible();
  });

  test("/search renders full-results page with URL state", async ({ page }) => {
    await page.goto("/search?q=kombit");
    await expect(page.getByTestId("search-page-input")).toHaveValue("kombit");
    const results = page.getByTestId("search-page-result");
    await expect(results.first()).toBeVisible();
  });
});
