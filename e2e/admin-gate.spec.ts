import { test, expect } from "@playwright/test";

/**
 * Admin metrics dashboard is gated by either:
 *   - an `?key=<ADMIN_SECRET>` query string on first hit, or
 *   - a `pf_admin=1` cookie on subsequent hits.
 *
 * Without either, the page calls notFound() so the route is
 * indistinguishable from a non-existent URL. This spec asserts
 * that a vanilla unauthenticated GET returns 404 — the only
 * piece of behaviour we can verify without standing up a Redis
 * fixture and faking the cookie.
 */
test("/admin/stats returns 404 to unauthenticated visitors", async ({
  page,
}) => {
  const response = await page.goto("/admin/stats");
  expect(response?.status()).toBe(404);
});
