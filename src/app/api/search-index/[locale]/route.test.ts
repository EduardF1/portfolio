/**
 * Tests for GET /api/search-index/[locale].
 *
 * The route serves the per-locale FlexSearch payload as JSON, cached at
 * the edge for an hour and revalidated by deploy. We verify:
 *   - 404 + JSON error for an unsupported locale,
 *   - 200 with the JSON payload for `en` / `da`,
 *   - the cache-control header is set to public + s-maxage,
 *   - generateStaticParams enumerates the configured locales.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/search/build-index", () => ({
  buildSearchIndex: vi.fn(async (locale: string) => ({
    locale,
    entries: [
      {
        id: "writing/three-tier",
        collection: "writing",
        slug: "three-tier-thinking",
        locale,
        title: "Three-tier thinking",
        tags: [],
        excerpt: "stub",
      },
    ],
  })),
}));

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "da"],
  },
}));

import { GET, generateStaticParams } from "./route";

describe("GET /api/search-index/[locale]", () => {
  it("returns the index payload as JSON for the EN locale", async () => {
    const res = await GET(new Request("http://localhost/api/search-index/en"), {
      params: Promise.resolve({ locale: "en" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string; entries: unknown[] };
    expect(body.locale).toBe("en");
    expect(body.entries.length).toBeGreaterThan(0);
  });

  it("returns the DA index for the DA locale", async () => {
    const res = await GET(new Request("http://localhost/api/search-index/da"), {
      params: Promise.resolve({ locale: "da" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string };
    expect(body.locale).toBe("da");
  });

  it("returns 404 with a JSON error for an unknown locale", async () => {
    const res = await GET(
      new Request("http://localhost/api/search-index/fr"),
      { params: Promise.resolve({ locale: "fr" }) },
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unknown locale");
  });

  it("sets a public, edge-cached Cache-Control header", async () => {
    const res = await GET(new Request("http://localhost/api/search-index/en"), {
      params: Promise.resolve({ locale: "en" }),
    });
    const cc = res.headers.get("Cache-Control") ?? "";
    expect(cc).toMatch(/public/);
    expect(cc).toMatch(/s-maxage=86400/);
  });

  it("returns Content-Type: application/json on success", async () => {
    const res = await GET(new Request("http://localhost/api/search-index/en"), {
      params: Promise.resolve({ locale: "en" }),
    });
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/);
  });
});

describe("generateStaticParams", () => {
  it("enumerates one entry per configured locale", async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([{ locale: "en" }, { locale: "da" }]);
  });
});
