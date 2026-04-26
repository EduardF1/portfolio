import { test, expect } from "@playwright/test";

test.describe("mobile smoke @mobile", () => {
  test("home renders without horizontal overflow at 375px", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status(), "/ should be 200").toBe(200);

    // Hero visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // No horizontal scrollbar — document width matches viewport
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scroll: doc.scrollWidth,
        client: doc.clientWidth,
      };
    });
    expect(
      overflow.scroll,
      "no horizontal overflow on home",
    ).toBeLessThanOrEqual(overflow.client + 1);

    // No console errors
    expect(consoleErrors).toEqual([]);
  });

  test("nav reaches Posts and articles", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Posts and articles/i });
    await expect(link.first()).toBeVisible();
    await link.first().click();
    await page.waitForURL(/\/writing/);
    expect(page.url()).toMatch(/\/writing$/);
  });

  test("palette dropdown is reachable and selectable on touch", async ({
    page,
  }) => {
    await page.goto("/");
    const sel = page.getByTestId("palette-selector");
    await expect(sel).toBeVisible();
    await sel.selectOption("mountain-navy");
    await expect(page.locator("html")).toHaveAttribute(
      "data-palette",
      "mountain-navy",
    );
  });

  test("contact page renders the form on mobile", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel(/Your name/)).toBeVisible();
    await expect(page.getByLabel(/^Email/)).toBeVisible();
    await expect(page.getByLabel(/Message/)).toBeVisible();
  });
});
