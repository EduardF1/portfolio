import { describe, it, expect } from "vitest";
import { composeDigest } from "./visit-digest";

describe("composeDigest", () => {
  it("renders subject + body for a normal day", () => {
    const out = composeDigest({
      day: "2026-04-27",
      totalPageViews: 12,
      uniqueVisitors: 3,
      topPages: [
        { path: "/work", views: 5 },
        { path: "/", views: 3 },
        { path: "/travel", views: 2 },
        { path: "/writing/hello-world", views: 2 },
      ],
      topPaletteTheme: {
        palette: "mountain-navy",
        theme: "dark",
        count: 7,
      },
    });
    expect(out.subject).toBe("portfolio — 12 visits yesterday (3 unique)");
    expect(out.body).toContain("Yesterday (2026-04-27 UTC):");
    expect(out.body).toContain("Total page views:   12");
    expect(out.body).toContain("Unique visitors:    3");
    expect(out.body).toContain("/work");
    expect(out.body).toContain("Top palette × theme: mountain-navy × dark (7)");
    expect(out.body).toContain("https://eduardfischer.dev/admin/stats");
  });

  it("uses singular 'visit' in subject when total is exactly 1", () => {
    const out = composeDigest({
      day: "2026-04-27",
      totalPageViews: 1,
      uniqueVisitors: 1,
      topPages: [{ path: "/", views: 1 }],
      topPaletteTheme: null,
    });
    expect(out.subject).toBe("portfolio — 1 visit yesterday (1 unique)");
  });

  it("renders an empty 'no top pages' line when there's no traffic", () => {
    const out = composeDigest({
      day: "2026-04-27",
      totalPageViews: 0,
      uniqueVisitors: 0,
      topPages: [],
      topPaletteTheme: null,
    });
    expect(out.subject).toBe("portfolio — 0 visits yesterday (0 unique)");
    expect(out.body).toContain("Top pages:          (none)");
    expect(out.body).toContain("Top palette × theme: —");
  });

  it("falls back to a dash when palette signal is missing", () => {
    const out = composeDigest({
      day: "2026-04-27",
      totalPageViews: 5,
      uniqueVisitors: 2,
      topPages: [{ path: "/", views: 5 }],
      topPaletteTheme: null,
    });
    expect(out.body).toContain("Top palette × theme: —");
    expect(out.body).not.toContain("undefined");
    expect(out.body).not.toContain("null");
  });

  it("right-pads top-page paths to a consistent width", () => {
    const out = composeDigest({
      day: "2026-04-27",
      totalPageViews: 10,
      uniqueVisitors: 4,
      topPages: [
        { path: "/work", views: 5 },
        { path: "/writing/three-tier-thinking", views: 5 },
      ],
      topPaletteTheme: null,
    });
    // Both rows should align: the shorter path gets padded out so the
    // count column lines up under the longer path.
    const shortLine = out.body
      .split("\n")
      .find((l) => l.trim().startsWith("/work "))!;
    const longLine = out.body
      .split("\n")
      .find((l) => l.trim().startsWith("/writing/three-tier-thinking"))!;
    // The view count appears at the same column index on both rows.
    const idxShort = shortLine.lastIndexOf("5");
    const idxLong = longLine.lastIndexOf("5");
    expect(idxShort).toBe(idxLong);
  });
});
