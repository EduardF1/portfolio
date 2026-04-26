import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /writing/rss.xml", () => {
  it("returns an RSS 2.0 feed with the expected channel + items", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toMatch(/application\/rss\+xml/);
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=3600/);
    const body = await res.text();
    expect(body).toMatch(/<\?xml/);
    expect(body).toMatch(/<rss[\s\S]*version="2.0"/);
    expect(body).toMatch(/<channel>/);
    // Articles are present in the feed
    expect(body).toMatch(/Digitalization of waste collection/);
    expect(body).toMatch(/audit management system/i);
    // Cache-control mentions s-maxage as well
    expect(res.headers.get("Cache-Control")).toMatch(/s-maxage=3600/);
  });

  it("escapes special XML chars in titles and descriptions", async () => {
    const res = await GET();
    const body = await res.text();
    // No raw ampersand-letter sequences (they should be entity-encoded)
    // We assert the body is well-formed enough to round-trip:
    expect(body).not.toMatch(/<title>[^<]*&[^a-z;][^<]*<\/title>/);
  });
});
