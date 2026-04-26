import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap()", () => {
  it("emits the static path × locale grid plus dynamic MDX entries", async () => {
    const entries = await sitemap();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    const urls = entries.map((e) => e.url);
    // Static EN routes
    for (const p of ["", "/work", "/writing", "/recommends", "/personal", "/travel", "/travel/culinary", "/contact"]) {
      expect(urls).toContain(`https://eduardfischer.dev${p}`);
    }
    // DA prefix on non-default locale
    expect(urls).toContain("https://eduardfischer.dev/da");
    expect(urls).toContain("https://eduardfischer.dev/da/work");

    // Dynamic content from real MDX files
    expect(urls).toContain("https://eduardfischer.dev/writing/welcome");
    expect(urls).toContain(
      "https://eduardfischer.dev/writing/digitalization-of-waste-collection-feral-systems",
    );

    // Per-trip photo pages from the EXIF catalogue clusters.
    expect(
      urls.some((u) =>
        /^https:\/\/eduardfischer\.dev\/travel\/photos\/[a-z0-9-]+-\d{4}-\d{2}$/.test(
          u,
        ),
      ),
    ).toBe(true);
  });

  it("home page has priority 1, weekly cadence", async () => {
    const entries = await sitemap();
    const home = entries.find((e) => e.url === "https://eduardfischer.dev");
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1);
    expect(home?.changeFrequency).toBe("weekly");
  });

  it("inner pages have priority 0.7", async () => {
    const entries = await sitemap();
    const work = entries.find(
      (e) => e.url === "https://eduardfischer.dev/work",
    );
    expect(work?.priority).toBe(0.7);
  });
});
