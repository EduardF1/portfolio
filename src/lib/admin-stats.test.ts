import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  barChartPercents,
  EMPTY_PALETTE_STATS,
  fetchPaletteStats,
  getSearchQueryStats,
  sortByCountDesc,
  topPaletteCombos,
  topRows,
  type PaletteStats,
} from "./admin-stats";

describe("barChartPercents", () => {
  it("returns [] for empty input", () => {
    expect(barChartPercents([])).toEqual([]);
  });

  it("scales widest bar to 100% and others proportionally", () => {
    const out = barChartPercents([
      { key: "a", count: 10 },
      { key: "b", count: 5 },
      { key: "c", count: 1 },
    ]);
    expect(out).toEqual([
      { key: "a", count: 10, pct: 100 },
      { key: "b", count: 5, pct: 50 },
      { key: "c", count: 1, pct: 10 },
    ]);
  });

  it("returns 0% for every row when all counts are 0 (no /0)", () => {
    const out = barChartPercents([
      { key: "a", count: 0 },
      { key: "b", count: 0 },
    ]);
    expect(out.every((r) => r.pct === 0)).toBe(true);
  });

  it("floors negative counts to 0 for the percent maths", () => {
    const out = barChartPercents([
      { key: "ok", count: 4 },
      { key: "bad", count: -3 },
    ]);
    expect(out[0]!.pct).toBe(100);
    // bad row: pct floored to 0, original count preserved on the row
    expect(out[1]!.pct).toBe(0);
    expect(out[1]!.count).toBe(-3);
  });

  it("preserves input order (caller controls sort)", () => {
    const out = barChartPercents([
      { key: "b", count: 1 },
      { key: "a", count: 2 },
    ]);
    expect(out.map((r) => r.key)).toEqual(["b", "a"]);
  });
});

describe("sortByCountDesc / topRows", () => {
  it("sorts by count desc, breaks ties on key asc", () => {
    expect(
      sortByCountDesc([
        { key: "z", count: 1 },
        { key: "a", count: 1 },
        { key: "m", count: 5 },
      ]),
    ).toEqual([
      { key: "m", count: 5 },
      { key: "a", count: 1 },
      { key: "z", count: 1 },
    ]);
  });

  it("topRows caps at N after sorting", () => {
    const out = topRows(
      [
        { key: "a", count: 1 },
        { key: "b", count: 4 },
        { key: "c", count: 3 },
      ],
      2,
    );
    expect(out).toEqual([
      { key: "b", count: 4 },
      { key: "c", count: 3 },
    ]);
  });
});

describe("topPaletteCombos", () => {
  it("splits 'palette::theme' keys and ranks by count", () => {
    const stats: PaletteStats = {
      counters: {
        "schwarzgelb::dark": 7,
        "mountain-navy::light": 3,
        "woodsy-cabin::dark": 7,
      },
      palettes: [],
      themes: [],
      updatedAt: "",
    };
    const rows = topPaletteCombos(stats, 5);
    expect(rows[0]!.count).toBe(7);
    expect(rows.map((r) => r.palette)).toEqual([
      "schwarzgelb",
      "woodsy-cabin",
      "mountain-navy",
    ]);
    expect(rows[0]!.key).toBe("schwarzgelb · dark");
  });

  it("skips malformed keys (missing '::') and negative counts", () => {
    const stats: PaletteStats = {
      counters: {
        broken: 5,
        "ok::dark": 2,
        "neg::light": -1,
      },
      palettes: [],
      themes: [],
      updatedAt: "",
    };
    const rows = topPaletteCombos(stats, 10);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.palette).toBe("ok");
  });
});

describe("fetchPaletteStats", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the empty stub when secret is undefined (no fetch)", async () => {
    const out = await fetchPaletteStats("https://example.com", undefined);
    expect(out).toEqual(EMPTY_PALETTE_STATS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty stub on non-OK response (route not yet shipped)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    const out = await fetchPaletteStats("https://example.com", "s3cret");
    expect(out).toEqual(EMPTY_PALETTE_STATS);
  });

  it("parses well-formed JSON into the typed shape", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          counters: { "a::dark": 1 },
          palettes: ["a"],
          themes: ["dark"],
          updatedAt: "2026-04-28T00:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const out = await fetchPaletteStats("https://example.com/", "s3cret");
    expect(out.counters["a::dark"]).toBe(1);
    expect(out.updatedAt).toBe("2026-04-28T00:00:00Z");
  });

  it("URL-encodes the secret in the query string", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    await fetchPaletteStats("https://example.com", "a b&c");
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("secret=a%20b%26c");
  });

  it("falls back to empty when the body isn't valid JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));
    const out = await fetchPaletteStats("https://example.com", "s3cret");
    expect(out).toEqual(EMPTY_PALETTE_STATS);
  });

  it("falls back to empty when fetch itself rejects", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const out = await fetchPaletteStats("https://example.com", "s3cret");
    expect(out).toEqual(EMPTY_PALETTE_STATS);
  });

  it("coerces missing/wrong-shaped fields to safe defaults", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ counters: "nope", palettes: 5 }), {
        status: 200,
      }),
    );
    const out = await fetchPaletteStats("https://example.com", "s3cret");
    expect(out.counters).toEqual({});
    expect(out.palettes).toEqual([]);
    expect(out.themes).toEqual([]);
    expect(out.updatedAt).toBe("");
  });
});

describe("getSearchQueryStats", () => {
  it("currently returns an empty array (privacy default)", async () => {
    expect(await getSearchQueryStats()).toEqual([]);
  });
});
