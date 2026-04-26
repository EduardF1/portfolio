import { afterEach, describe, it, expect, vi } from "vitest";
import {
  getReadingFeed,
  isReadingSource,
  READING_SOURCES,
} from "./reading-feed";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const currentYear = new Date().getUTCFullYear();

const article = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  title: "T",
  description: "D",
  url: "https://dev.to/x/y",
  published_at: `${currentYear}-04-15T12:00:00Z`,
  reading_time_minutes: 4,
  tag_list: ["typescript"],
  user: { name: "Author", username: "author" },
  ...over,
});

const hnStory = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 100,
  type: "story",
  title: "Story title",
  url: "https://example.com",
  by: "user",
  time: Math.floor(new Date(`${currentYear}-04-01T00:00:00Z`).getTime() / 1000),
  score: 100,
  ...over,
});

describe("isReadingSource + READING_SOURCES", () => {
  it("recognises devto / hn / all only", () => {
    expect(isReadingSource("devto")).toBe(true);
    expect(isReadingSource("hn")).toBe(true);
    expect(isReadingSource("all")).toBe(true);
    expect(isReadingSource("twitter")).toBe(false);
    expect(isReadingSource(undefined)).toBe(false);
    expect(isReadingSource(null)).toBe(false);
  });

  it("exposes a stable list of source ids and labels", () => {
    expect(READING_SOURCES.map((s) => s.id)).toEqual(["devto", "hn", "all"]);
  });
});

describe("getReadingFeed (devto)", () => {
  it("returns parsed items, filtering by current year and approved tags", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          article({ id: 10, tag_list: ["typescript"] }),
          article({
            id: 11,
            published_at: `${currentYear - 1}-04-15T12:00:00Z`,
          }),
          article({ id: 12, tag_list: ["unrelated", "off-topic"] }),
          article({ id: 13, tag_list: undefined }),
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const out = await getReadingFeed("devto", 10);
    const ids = out.map((o) => o.id);
    expect(ids).toContain("devto-10");
    expect(ids).toContain("devto-13");
    expect(ids).not.toContain("devto-11");
    expect(ids).not.toContain("devto-12");
    for (const it of out) {
      expect(it.source).toBe("devto");
    }
  });

  it("respects the limit argument", async () => {
    const many = Array.from({ length: 10 }, (_, i) => article({ id: i + 1 }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(many), { status: 200 }),
    );
    const out = await getReadingFeed("devto", 3);
    expect(out.length).toBe(3);
  });

  it("returns [] when the network request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(await getReadingFeed("devto")).toEqual([]);
  });

  it("returns [] when dev.to responds non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("err", { status: 500 }),
    );
    expect(await getReadingFeed("devto")).toEqual([]);
  });

  it("falls back to username when name is missing; or 'dev.to' when neither", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          article({ id: 21, user: { username: "no-name" } }),
          article({ id: 22, user: {} }),
        ]),
        { status: 200 },
      ),
    );
    const out = await getReadingFeed("devto");
    const a = out.find((o) => o.id === "devto-21");
    const b = out.find((o) => o.id === "devto-22");
    expect(a?.author).toBe("no-name");
    expect(a?.authorUrl).toBe("https://dev.to/no-name");
    expect(b?.author).toBe("dev.to");
    expect(b?.authorUrl).toBeUndefined();
  });
});

describe("getReadingFeed (hn)", () => {
  it("fetches top story ids, then individual stories, current-year only", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url: string | URL | Request) => {
        const u = url.toString();
        if (u.endsWith("/topstories.json")) {
          return new Response(JSON.stringify([100, 101]), { status: 200 });
        }
        if (u.includes("/item/100.json")) {
          return new Response(JSON.stringify(hnStory({ id: 100 })), {
            status: 200,
          });
        }
        if (u.includes("/item/101.json")) {
          return new Response(
            JSON.stringify(
              hnStory({
                id: 101,
                time: Math.floor(
                  new Date(`${currentYear - 5}-01-01`).getTime() / 1000,
                ),
              }),
            ),
            { status: 200 },
          );
        }
        return new Response("nope", { status: 404 });
      },
    );
    const out = await getReadingFeed("hn", 10);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe("hn-100");
    expect(out[0].source).toBe("hn");
    expect(out[0].authorUrl).toBe(
      "https://news.ycombinator.com/user?id=user",
    );
  });

  it("returns [] when the top-stories endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    expect(await getReadingFeed("hn")).toEqual([]);
  });

  it("returns [] when the top-stories fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(await getReadingFeed("hn")).toEqual([]);
  });
});

describe("getReadingFeed (all)", () => {
  it("merges devto + hn and sorts newest-first", async () => {
    const dt = `${currentYear}-04-01T12:00:00Z`;
    const hnTime = Math.floor(
      new Date(`${currentYear}-06-01T00:00:00Z`).getTime() / 1000,
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url: string | URL | Request) => {
        const u = url.toString();
        if (u.startsWith("https://dev.to/api/articles")) {
          return new Response(
            JSON.stringify([article({ id: 50, published_at: dt })]),
            { status: 200 },
          );
        }
        if (u.endsWith("/topstories.json")) {
          return new Response(JSON.stringify([200]), { status: 200 });
        }
        if (u.includes("/item/200.json")) {
          return new Response(
            JSON.stringify(hnStory({ id: 200, time: hnTime })),
            { status: 200 },
          );
        }
        return new Response("nope", { status: 404 });
      },
    );
    const out = await getReadingFeed("all", 5);
    expect(out.length).toBe(2);
    // HN item is newer (June > April), so it comes first
    expect(out[0].id).toBe("hn-200");
    expect(out[1].id).toBe("devto-50");
  });
});
