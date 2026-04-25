import { test, expect } from "@playwright/test";

test.describe("smoke — public routes return 200 and render content", () => {
  for (const path of [
    "/",
    "/work",
    "/writing",
    "/recommends",
    "/personal",
    "/contact",
    "/da",
    "/da/work",
    "/da/contact",
  ]) {
    test(`GET ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should be 200`).toBe(200);
      // The site name is in the header on every page
      await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    });
  }
});

test("locale toggle round-trips between EN and DA", async ({ page }) => {
  await page.goto("/");
  // Click the language toggle
  await page.getByRole("button", { name: /Switch to (Danish|English)/ }).click();
  await page.waitForURL("/da");
  await expect(page).toHaveURL("/da");
  // And back
  await page.getByRole("button", { name: /Switch to (Danish|English)/ }).click();
  await page.waitForURL("/");
});

test("contact form rejects empty submission", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /Send message/ }).click();
  // HTML5 validation prevents submission; form remains visible.
  await expect(page.getByLabel(/Your name/)).toBeVisible();
});
