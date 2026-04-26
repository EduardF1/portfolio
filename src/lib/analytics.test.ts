import { describe, it, expect } from "vitest";
import {
  bucketHitsByDay,
  countBy,
  dayKey,
  dayKeysForRange,
  deviceMix,
  generateSessionId,
  normalizeReferrer,
  topN,
  uniqueSessions,
  type Hit,
} from "./analytics";

function hit(partial: Partial<Hit>): Hit {
  return {
    path: "/",
    ref: "",
    country: "DK",
    region: null,
    city: null,
    browser: "Chrome",
    os: "Windows",
    deviceType: "desktop",
    sessionId: "abc",
    ts: Date.UTC(2026, 3, 26, 12, 0, 0), // 2026-04-26
    ...partial,
  };
}

describe("dayKey", () => {
  it("emits yyyy-MM-dd in UTC, zero-padded", () => {
    expect(dayKey(new Date(Date.UTC(2026, 0, 5, 23, 59, 59)))).toBe("2026-01-05");
    expect(dayKey(new Date(Date.UTC(2026, 11, 31, 0, 0, 0)))).toBe("2026-12-31");
  });
});

describe("dayKeysForRange", () => {
  it("returns N consecutive UTC day keys ending at `now`", () => {
    const now = new Date(Date.UTC(2026, 3, 26));
    expect(dayKeysForRange(now, 1)).toEqual(["2026-04-26"]);
    expect(dayKeysForRange(now, 3)).toEqual([
      "2026-04-24",
      "2026-04-25",
      "2026-04-26",
    ]);
  });

  it("crosses month boundaries cleanly", () => {
    const now = new Date(Date.UTC(2026, 4, 1)); // 1 May 2026
    expect(dayKeysForRange(now, 3)).toEqual([
      "2026-04-29",
      "2026-04-30",
      "2026-05-01",
    ]);
  });
});

describe("bucketHitsByDay", () => {
  it("pads days with zero counts and groups hits to the right bucket", () => {
    const range = ["2026-04-25", "2026-04-26"];
    const hits = [
      hit({ ts: Date.UTC(2026, 3, 25, 10) }),
      hit({ ts: Date.UTC(2026, 3, 26, 10) }),
      hit({ ts: Date.UTC(2026, 3, 26, 18) }),
    ];
    expect(bucketHitsByDay(hits, range)).toEqual({
      "2026-04-25": 1,
      "2026-04-26": 2,
    });
  });

  it("ignores hits outside the requested range", () => {
    const range = ["2026-04-26"];
    const hits = [
      hit({ ts: Date.UTC(2026, 3, 26, 10) }),
      hit({ ts: Date.UTC(2026, 3, 27, 10) }), // out of range — ignored
    ];
    expect(bucketHitsByDay(hits, range)).toEqual({ "2026-04-26": 1 });
  });
});

describe("topN", () => {
  it("sorts by count desc, breaks ties on key asc, slices to n", () => {
    const counts = { "/": 5, "/work": 5, "/about": 2, "/contact": 9 };
    expect(topN(counts, 2)).toEqual([
      { key: "/contact", count: 9 },
      { key: "/", count: 5 },
    ]);
  });

  it("returns [] for an empty input", () => {
    expect(topN({}, 5)).toEqual([]);
  });
});

describe("countBy", () => {
  it("counts non-empty values for the given field", () => {
    const hits = [
      hit({ country: "DK" }),
      hit({ country: "DK" }),
      hit({ country: "DE" }),
      hit({ country: null }),
      hit({ country: "" }),
    ];
    expect(countBy(hits, "country")).toEqual({ DK: 2, DE: 1 });
  });
});

describe("deviceMix", () => {
  it("emits all three keys even when a bucket is empty", () => {
    const hits = [
      hit({ deviceType: "desktop" }),
      hit({ deviceType: "desktop" }),
      hit({ deviceType: "mobile" }),
    ];
    expect(deviceMix(hits)).toEqual({ desktop: 2, mobile: 1, tablet: 0 });
  });
});

describe("uniqueSessions", () => {
  it("counts distinct session IDs", () => {
    const hits = [
      hit({ sessionId: "a" }),
      hit({ sessionId: "a" }),
      hit({ sessionId: "b" }),
    ];
    expect(uniqueSessions(hits)).toBe(2);
  });
});

describe("normalizeReferrer", () => {
  it("returns the host for an external URL", () => {
    expect(normalizeReferrer("https://news.ycombinator.com/item?id=42")).toBe(
      "news.ycombinator.com",
    );
  });

  it("drops self-referrals when selfHost is provided", () => {
    expect(
      normalizeReferrer("https://eduardfischer.dev/work", "eduardfischer.dev"),
    ).toBeNull();
  });

  it("returns null for empty / unparsable input", () => {
    expect(normalizeReferrer("")).toBeNull();
    expect(normalizeReferrer(null)).toBeNull();
    expect(normalizeReferrer("not a url")).toBeNull();
  });
});

describe("generateSessionId", () => {
  it("produces a 32-char hex string", () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns distinct values across calls", () => {
    const a = generateSessionId();
    const b = generateSessionId();
    expect(a).not.toBe(b);
  });
});
