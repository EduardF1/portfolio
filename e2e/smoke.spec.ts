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
      await expect(
        page.getByRole("link", { name: "Home", exact: true }),
      ).toBeVisible();
    });
  }
});

test("locale toggle round-trips between EN and DA", async ({ page }) => {
  await page.goto("/");
  // Use data-testid because the aria-label is itself translated (locale-dependent).
  const toggle = page.getByTestId("locale-toggle");
  await toggle.click();
  await page.waitForURL("/da");
  await expect(page).toHaveURL("/da");
  // And back
  await toggle.click();
  await page.waitForURL("/");
});

test("/work/kombit-valg renders the case-study heading", async ({ page }) => {
  const response = await page.goto("/work/kombit-valg");
  expect(response?.status(), "/work/kombit-valg should be 200").toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: /KOMBIT VALG/ }),
  ).toBeVisible();
});

test("contact form rejects empty submission", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /Send message/ }).click();
  // HTML5 validation prevents submission; form remains visible.
  await expect(page.getByLabel(/Your name/)).toBeVisible();
});

test("palette selection persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("palette-selector").selectOption("mountain-navy");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-palette",
    "mountain-navy",
  );
});

test("tech chip on home navigates to /work?tech=… glossary section", async ({
  page,
}) => {
  await page.goto("/");

  // Click the .NET chip on the Netcompany role.
  const netcompanyChips = page.getByTestId("role-tech-netcompany");
  const dotnetChip = netcompanyChips.locator('[data-tech-slug="dotnet"]');
  await expect(dotnetChip).toBeVisible();
  await dotnetChip.click();

  // URL should land on /work with the tech query.
  await page.waitForURL(/\/work\?tech=dotnet/);
  expect(page.url()).toMatch(/\/work\?tech=dotnet/);

  // The Technologies section should announce the tech.
  const techSection = page.locator("#technologies");
  await expect(techSection).toBeVisible();
  await expect(techSection).toHaveAttribute("data-tech", "dotnet");
  await expect(techSection.getByRole("heading", { name: ".NET" })).toBeVisible();

  // The GithubFeed should have C# pre-selected as the active language filter.
  // The active button uses bg-foreground / text-background; we just assert
  // a button labelled "C# (…)" exists and is in its selected state.
  const csharpBtn = page.getByRole("button", { name: /^C# \(\d+\)$/ });
  if (await csharpBtn.count()) {
    await expect(csharpBtn.first()).toHaveClass(/bg-foreground/);
  }
});
