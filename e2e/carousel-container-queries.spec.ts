import { test, expect } from "@playwright/test";

/**
 * Verify the recommendations-carousel responds to its container's width
 * via container queries (@container / @md:), not the viewport width.
 *
 * Strategy: wrap the rendered carousel into a constrained <div> at runtime
 * and re-measure the inner slides container. With true container queries,
 * the slides element should drop @md padding (py-12 → 48px) when the
 * wrapper is 320px wide and gain @md padding (py-16 → 64px) when the
 * wrapper is 1024px wide. The viewport stays at 1280px the whole time
 * so any size change *must* come from the container query.
 */

test("carousel container queries: padding flips when the parent width changes (not viewport)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  // Wait for the carousel to render.
  const carousel = page.getByRole("region", { name: "Recommendations" });
  await expect(carousel).toBeVisible();

  // Move the carousel into a constrained wrapper at 320px to simulate a
  // narrow parent without resizing the viewport.
  await page.evaluate(() => {
    const car = document.querySelector(
      'div[role="region"][aria-label="Recommendations"]',
    );
    if (!car) throw new Error("carousel not found");
    const wrapper = document.createElement("div");
    wrapper.id = "test-carousel-wrapper";
    wrapper.style.width = "320px";
    car.parentElement!.insertBefore(wrapper, car);
    wrapper.appendChild(car);
  });

  // The inner slides div is the first child with aria-live attribute.
  const slidesNarrow = await page.evaluate(() => {
    const car = document.querySelector(
      'div[role="region"][aria-label="Recommendations"]',
    )!;
    const slides = car.querySelector("[aria-live]") as HTMLElement;
    const cs = getComputedStyle(slides);
    return {
      paddingTop: parseFloat(cs.paddingTop),
      paddingBottom: parseFloat(cs.paddingBottom),
    };
  });

  // Now widen the wrapper to 1024px (well above @md ≈ 768px). Same
  // viewport. With container queries the padding should grow; with
  // viewport-based responsive utilities it would not change at all.
  await page.evaluate(() => {
    const w = document.getElementById("test-carousel-wrapper")!;
    w.style.width = "1024px";
  });

  const slidesWide = await page.evaluate(() => {
    const car = document.querySelector(
      'div[role="region"][aria-label="Recommendations"]',
    )!;
    const slides = car.querySelector("[aria-live]") as HTMLElement;
    const cs = getComputedStyle(slides);
    return {
      paddingTop: parseFloat(cs.paddingTop),
      paddingBottom: parseFloat(cs.paddingBottom),
    };
  });

  // py-12 = 3rem = 48px ; py-16 = 4rem = 64px (Tailwind defaults).
  // Wide must be larger than narrow — that's the container-query proof.
  expect(slidesNarrow.paddingTop).toBeGreaterThan(0);
  expect(slidesWide.paddingTop).toBeGreaterThan(slidesNarrow.paddingTop);
  expect(slidesWide.paddingTop).toBeGreaterThanOrEqual(60);
  expect(slidesNarrow.paddingTop).toBeLessThan(60);
});
