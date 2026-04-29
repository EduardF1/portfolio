import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * V1 audit (qa/v1-perf-a11y-audit) — dump every axe violation (all
 * impacts) to docs/lighthouse-reports/v1-audit-before/axe-<route>.json
 * for later inclusion in the audit doc. Skipped from the standard suite
 * via `.skip` toggling — flip to `test.describe` when running the audit.
 */

const ROUTES = [
  ["/", "home"],
  ["/work", "work"],
  ["/writing", "writing"],
  ["/personal", "personal"],
  ["/travel", "travel"],
  ["/travel/photos/germany-2022-10", "trip-germany-2022-10"],
  ["/travel/photos/romania-2024-06", "trip-romania-2024-06"],
  ["/travel/photos/united-kingdom-2023-07", "trip-uk-2023-07"],
  ["/now", "now"],
  ["/contact", "contact"],
] as const;

const OUT = process.env.OUT_DIR ?? "docs/lighthouse-reports/v1-audit-before";

mkdirSync(OUT, { recursive: true });

for (const [route, slug] of ROUTES) {
  test(`axe-dump ${route}`, async ({ page }) => {
    await page.goto(route);
    // Don't wait for networkidle on photo grids — lazy images can keep
    // the network busy past the 30 s test timeout.
    await page
      .waitForLoadState("domcontentloaded")
      .catch(() => {});
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = {
      route,
      slug,
      url: page.url(),
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodeCount: v.nodes.length,
        nodes: v.nodes.slice(0, 5).map((n) => ({
          target: n.target,
          html: n.html?.slice(0, 200),
          failureSummary: n.failureSummary,
        })),
      })),
    };
    writeFileSync(
      join(OUT, `axe-${slug}.json`),
      JSON.stringify(summary, null, 2),
      "utf-8",
    );
  });
}
