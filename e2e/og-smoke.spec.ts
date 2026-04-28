import { test, expect } from "@playwright/test";

/**
 * Round 5 verification — per-route Open Graph images.
 *
 * Per-route OG images can't be unit-tested (they rely on `next/og`'s
 * runtime). This spec just makes sure the routes render: status 200,
 * `image/png` content-type, and a non-empty body.
 *
 * Routes covered:
 *   - /my-story         → static OG generated for the my-story page
 *   - /personal         → static OG for the personal landing page
 *   - /travel/culinary  → static OG for the culinary sub-page
 *   - /work             → static OG for the work index
 *
 * Note on coverage: not every public route has its own OG image.
 * `/writing`, `/recommends`, `/travel` (top-level) inherit the root
 * `src/app/opengraph-image.tsx`, which is already exercised by the
 * smoke spec via the home route. This spec only enumerates the
 * routes that ship a *bespoke* OG image.
 */

const OG_ROUTES = [
  "/my-story/opengraph-image",
  "/personal/opengraph-image",
  "/travel/culinary/opengraph-image",
  "/work/opengraph-image",
];

test.describe("Open Graph image routes", () => {
  for (const path of OG_ROUTES) {
    test(`GET ${path} returns image/png`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status(), `${path} should be 200`).toBe(200);
      const contentType = res.headers()["content-type"] ?? "";
      expect(contentType, `${path} content-type`).toContain("image/png");
      const body = await res.body();
      expect(body.byteLength, `${path} body size`).toBeGreaterThan(1024);
    });
  }
});
