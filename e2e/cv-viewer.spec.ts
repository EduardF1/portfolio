import { test, expect } from "@playwright/test";

/**
 * Smoke spec for the read-only CV viewer at /cv. Verifies:
 *   - The route returns 200 and renders the heading.
 *   - The PDF.js canvas eventually renders with a non-zero size.
 *   - Right-click on the canvas wrapper is suppressed (deters casual copy).
 *   - The /cv?lang=da variant loads the Danish PDF.
 *
 * The viewer is deliberately a UX nudge, not DRM — the secondary
 * "Download the PDF" link is still present and functional.
 */

test.describe("CV viewer (/cv)", () => {
  test("/cv returns 200 and renders the read-only viewer", async ({ page }) => {
    const res = await page.goto("/cv");
    expect(res?.status(), "/cv should be 200").toBe(200);

    // Heading reads as a CV viewer.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The canvas inside the viewer eventually renders with a non-zero size
    // (PDF.js has decoded and painted at least one page).
    const canvas = page.locator('[data-testid="cv-viewer"] canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(50);
    expect(box?.height ?? 0).toBeGreaterThan(50);
  });

  test("right-click on the canvas wrapper is blocked", async ({ page }) => {
    await page.goto("/cv");

    const canvas = page.locator('[data-testid="cv-viewer"] canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Listen for the contextmenu event on the canvas wrapper and confirm
    // its default is prevented (no native menu would appear).
    const wrapper = page
      .locator('[data-testid="cv-viewer"]')
      .locator(":scope > div")
      .filter({ has: canvas });

    const wasDefaultPrevented = await wrapper.evaluate((el) => {
      let prevented = false;
      el.addEventListener(
        "contextmenu",
        (e) => {
          prevented = e.defaultPrevented;
        },
        { capture: false, once: true },
      );
      // Dispatch a synthetic contextmenu event; the React handler runs
      // and calls preventDefault().
      el.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
      return prevented;
    });

    expect(wasDefaultPrevented).toBe(true);
  });

  test("/cv?lang=da loads the Danish PDF", async ({ page }) => {
    const res = await page.goto("/cv?lang=da");
    expect(res?.status()).toBe(200);

    const canvas = page.locator('[data-testid="cv-viewer"] canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // The DA tab is selected, EN is not.
    await expect(
      page.getByRole("tab", { name: /Dansk|Danish/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("the secondary direct-download link is present", async ({ page }) => {
    await page.goto("/cv?lang=en");
    const dl = page.getByRole("link", { name: /Download the PDF/ });
    await expect(dl).toBeVisible();
    await expect(dl).toHaveAttribute(
      "href",
      "/cv/Eduard_Fischer-Szava_CV_EN.pdf",
    );
  });
});
