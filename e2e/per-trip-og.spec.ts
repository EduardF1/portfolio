import { test, expect } from "@playwright/test";

/**
 * Per-trip Open Graph image smoke test.
 *
 * The per-trip OG route lives at
 *   /<locale>/travel/photos/<slug>/opengraph-image
 * and is a Next.js metadata file (Edge runtime, `next/og`
 * `ImageResponse`). It should render an image/png with a
 * non-trivial body for every real trip slug.
 *
 * To avoid pinning the test to a specific slug (the catalogue
 * shifts as trips are added), we resolve a real slug at run time
 * by hitting /travel and reading the first per-trip card link.
 */

test("per-trip opengraph-image returns image/png with reasonable bytes", async ({
  page,
  request,
}) => {
  await page.goto("/en/travel");

  // Find a real trip slug from the Recent trips section. Skip the
  // SVG city-dot links which share the href pattern but live inside
  // <svg> so are unreliable for getAttribute reads.
  const tripLink = page
    .locator('a[href*="/travel/photos/"]:not([data-testid="city-dot"])')
    .first();
  await expect(tripLink).toBeVisible();
  const href = await tripLink.getAttribute("href");
  expect(
    href,
    "expected at least one /travel/photos/<slug> link on /travel",
  ).toMatch(/\/travel\/photos\/([a-z0-9-]+-\d{4}-\d{2}(?:-\d+)?)/);

  // Extract the slug and locale from the href. The link from
  // /en/travel will already be locale-prefixed.
  const match = href!.match(
    /\/(?:en|da)?\/?travel\/photos\/([a-z0-9-]+-\d{4}-\d{2}(?:-\d+)?)/,
  );
  expect(match, `could not extract slug from ${href}`).toBeTruthy();
  const slug = match![1];

  // When `generateImageMetadata` is in play, Next.js mounts the OG
  // route at `.../opengraph-image/<id>` (the id is the value we
  // returned in `generateImageMetadata`). For per-trip OGs the id
  // is the slug itself, so the public URL is symmetrical.
  const ogPath = `/en/travel/photos/${slug}/opengraph-image/${slug}`;
  // `request.get` does not follow redirects by default, but the
  // intl middleware 307s the locale-prefixed URL into the canonical
  // form. `maxRedirects` lets us land on the final 200.
  const res = await request.get(ogPath, { maxRedirects: 5 });
  expect(res.status(), `${ogPath} should be 200`).toBe(200);

  const contentType = res.headers()["content-type"] ?? "";
  expect(contentType, `${ogPath} content-type`).toContain("image/png");

  const body = await res.body();
  // next/og output for a 1200x630 card with no embedded photo is
  // typically 10-60 KB. Accept anything between 1 KB (sanity) and
  // 200 KB (well above the no-photo ceiling) so the test does not
  // flake when fonts or palette tokens shift.
  expect(
    body.byteLength,
    `${ogPath} body size`,
  ).toBeGreaterThan(1024);
  expect(
    body.byteLength,
    `${ogPath} body size should be sane (no embedded JPGs)`,
  ).toBeLessThan(200 * 1024);
});
