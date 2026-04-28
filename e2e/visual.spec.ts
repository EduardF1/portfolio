import { test, expect, Page } from "@playwright/test";

/**
 * Visual regression baselines.
 *
 * Captures full-page screenshots of the major routes in both light
 * and dark mode (home only — other routes inherit the same theme via
 * `next-themes`, so one mode per route is enough to catch layout
 * shifts without doubling the baseline count).
 *
 * Baselines live alongside this spec under
 * `e2e/visual.spec.ts-snapshots/<test name>-<project>.png`. Refresh
 * them via `.github/workflows/visual-regression.yml` (label-driven)
 * or locally with:
 *
 *     npx playwright test visual --update-snapshots
 *
 * Dynamic regions are masked because they would otherwise produce
 * timing-dependent diffs:
 *   - Footer year (`new Date().getFullYear()`).
 *   - BVB feed contents on /personal (live or mock data; even mock
 *     data has dates that "age").
 *   - GitHub feed pulls live language counts.
 *   - Reading feed pulls a live RSS of recently read books.
 *
 * The visual run is desktop-Chromium-only — see
 * `playwright.config.ts`. Mobile visual diffs would need their own
 * baselines and are out of scope for this round.
 */

// Common masks we apply on every route.
const dynamicMasks = (page: Page) => [
  // Footer copyright year — varies on Jan 1.
  page.locator("footer p"),
];

// Visual regression intentionally runs on the default `chromium`
// desktop project only. The other projects in `playwright.config.ts`
// have different viewports / device pixel ratios; multiplying baselines
// across them would explode the snapshot count and produce non-actionable
// failures.
test.describe("visual regression", () => {
  // Opt-in: baselines aren't committed yet, so the default CI run skips
  // these. The label-driven `visual-regression.yml` workflow sets
  // `RUN_VISUAL_REGRESSION=1` to capture/update snapshots.
  test.skip(
    process.env.RUN_VISUAL_REGRESSION !== "1",
    "Visual regression is opt-in until baselines are committed",
  );

  // The default `chromium` project skips `@mobile`-tagged tests but
  // includes everything else by default, so no tag is needed here.
  // Stabilise screenshots: disable animations and pin the system theme.
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });
  });

  test("home — light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    // Wait until web fonts have settled — otherwise text metrics shift
    // between the first paint and final layout.
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("home-light.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      // Allow a tiny per-pixel + ratio budget for sub-pixel font
      // rendering differences across CI runners.
      maxDiffPixelRatio: 0.01,
    });
  });

  test("home — dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    // The theme provider hydrates `data-theme` on `<html>` from the
    // OS color-scheme media query; wait for it so the screenshot
    // captures the dark palette rather than the SSR'd light one.
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
      undefined,
      { timeout: 5_000 },
    ).catch(() => {
      /* If the site doesn't expose data-theme, fall through — the
         screenshot will simply use whatever next-themes resolved. */
    });
    await expect(page).toHaveScreenshot("home-dark.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      maxDiffPixelRatio: 0.01,
    });
  });

  test("/work — case study index", async ({ page }) => {
    await page.goto("/work");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("work.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      maxDiffPixelRatio: 0.01,
    });
  });

  test("/writing — index", async ({ page }) => {
    await page.goto("/writing");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("writing.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      maxDiffPixelRatio: 0.01,
    });
  });

  test("/personal — BVB + reading feeds", async ({ page }) => {
    await page.goto("/personal");
    await page.evaluate(() => document.fonts.ready);
    // BVB feed and reading feed both render dynamic content. Mask
    // their containers so dates and book covers don't trip the diff.
    await expect(page).toHaveScreenshot("personal.png", {
      fullPage: true,
      mask: [
        ...dynamicMasks(page),
        page.getByTestId("bvb-feed"),
        page.locator("[data-testid='reading-feed']"),
        page.locator("[data-testid='github-feed']"),
      ],
      maxDiffPixelRatio: 0.01,
    });
  });

  test("/travel — index", async ({ page }) => {
    await page.goto("/travel");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("travel.png", {
      fullPage: true,
      mask: dynamicMasks(page),
      maxDiffPixelRatio: 0.01,
    });
  });
});
