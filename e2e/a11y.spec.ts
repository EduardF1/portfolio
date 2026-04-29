import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility audit — fails CI on `serious` or `critical` violations.
 * `moderate` and `minor` issues are surfaced via console.log so they show
 * up in the GitHub Actions log without blocking PRs (yet).
 *
 * Targets the EN locale. The DA tree mirrors structure 1:1 so the same
 * results would apply (we'd add per-locale runs once we start fixing
 * locale-specific copy issues).
 */

const ROUTES = [
  "/",
  "/work",
  "/writing",
  "/recommends",
  "/personal",
  "/travel",
  // V1 audit (qa/v1-perf-a11y-audit): cover the per-trip photo pages
  // — they ship the largest <Image> grids on the site so any new
  // alt-text / heading / contrast regression shows up here first.
  "/travel/photos/germany-2022-10",
  "/travel/photos/romania-2024-06",
  "/travel/photos/united-kingdom-2023-07",
  "/now",
  "/contact",
] as const;

for (const route of ROUTES) {
  test(`a11y — ${route} has no serious or critical violations`, async ({
    page,
  }, testInfo) => {
    await page.goto(route);
    // Wait for the page to settle: the brand link is on every page.
    // `exact` so we don't collide with content links.
    await expect(
      page.getByRole("link", { name: "Eduard Fischer-Szava", exact: true }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const advisory = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor",
    );

    if (advisory.length) {
      console.log(
        `[a11y advisory] ${route}: ${advisory.length} moderate/minor issue(s)`,
      );
      for (const v of advisory) {
        console.log(`  - ${v.id} (${v.impact}): ${v.help} [${v.nodes.length}]`);
      }
    }

    if (blocking.length) {
      const summary = blocking
        .map(
          (v) =>
            `${v.id} (${v.impact}): ${v.help}\n  nodes:\n${v.nodes
              .slice(0, 5)
              .map(
                (n) =>
                  `    ${n.target.join(" ")}\n      ${(n.failureSummary ?? "").replace(/\n/g, "\n      ")}`,
              )
              .join("\n")}`,
        )
        .join("\n");
      await testInfo.attach("axe-violations.json", {
        body: JSON.stringify(blocking, null, 2),
        contentType: "application/json",
      });
      throw new Error(
        `${route}: ${blocking.length} serious/critical a11y violation(s):\n${summary}`,
      );
    }

    expect(blocking).toHaveLength(0);
  });
}
