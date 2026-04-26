import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We re-import inside each test to pick up env-var changes.
async function loadModule() {
  vi.resetModules();
  return await import("./redis-analytics");
}

describe("redis-analytics — env-var-less mode", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("isAnalyticsEnabled() returns false when env vars are unset", async () => {
    const mod = await loadModule();
    expect(mod.isAnalyticsEnabled()).toBe(false);
  });

  it("recordHit() is a silent no-op when Redis is unavailable", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mod = await loadModule();
    await mod.recordHit({
      path: "/",
      ref: "",
      country: "DK",
      region: null,
      city: null,
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop",
      sessionId: "abc",
      ts: Date.now(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("getHits()/getUniqueSessionCount() return empty/zero with no env", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mod = await loadModule();
    expect(await mod.getHits(["2026-04-26"])).toEqual([]);
    expect(await mod.getUniqueSessionCount(["2026-04-26"])).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("redis-analytics — with env vars set", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.restoreAllMocks();
  });

  it("isAnalyticsEnabled() returns true", async () => {
    const mod = await loadModule();
    expect(mod.isAnalyticsEnabled()).toBe(true);
  });

  it("recordHit() POSTs the expected pipeline (ZADD/SADD/INCR/...)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const mod = await loadModule();
    await mod.recordHit({
      path: "/work",
      ref: "https://news.ycombinator.com/",
      country: "DK",
      region: "Midtjylland",
      city: "Aarhus",
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop",
      sessionId: "sess-1",
      ts: Date.UTC(2026, 3, 26, 10, 0, 0),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://example.upstash.io/pipeline");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(Array.isArray(body)).toBe(true);
    // ZADD into hits:2026-04-26
    expect(body[0][0]).toBe("ZADD");
    expect(body[0][1]).toBe("hits:2026-04-26");
    // SADD session
    expect(body[1]).toEqual(["SADD", "sessions:2026-04-26", "sess-1"]);
    // INCR pageviews
    expect(body[2]).toEqual(["INCR", "pageviews:2026-04-26:/work"]);
    // ZINCRBY referrer host
    expect(body[3]).toEqual([
      "ZINCRBY",
      "referrers:2026-04-26",
      1,
      "news.ycombinator.com",
    ]);
  });

  it("getHits() decodes JSON members from pipeline result", async () => {
    const sample = {
      path: "/",
      ref: "",
      country: "DK",
      region: null,
      city: null,
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop" as const,
      sessionId: "abc",
      ts: 123,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([{ result: [JSON.stringify(sample), "{not-json"] }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const mod = await loadModule();
    const hits = await mod.getHits(["2026-04-26"]);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual(sample);
  });

  it("getUniqueSessionCount() sums SCARD results across days", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ result: 3 }, { result: 5 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const mod = await loadModule();
    expect(
      await mod.getUniqueSessionCount(["2026-04-25", "2026-04-26"]),
    ).toBe(8);
  });

  it("getHits() returns [] when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mod = await loadModule();
    expect(await mod.getHits(["2026-04-26"])).toEqual([]);
  });
});

describe("redis-analytics — KV_REST_API_* fallback (Vercel marketplace)", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = "https://kv-marketplace.upstash.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
  });
  afterEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.restoreAllMocks();
  });

  it("isAnalyticsEnabled() returns true when only KV_* vars are set", async () => {
    const mod = await loadModule();
    expect(mod.isAnalyticsEnabled()).toBe(true);
  });

  it("recordHit() POSTs to the KV_REST_API_URL when UPSTASH_* is unset", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const mod = await loadModule();
    await mod.recordHit({
      path: "/",
      ref: "",
      country: null,
      region: null,
      city: null,
      browser: "Chrome",
      os: "macOS",
      deviceType: "desktop",
      sessionId: "x".repeat(32),
      ts: Date.UTC(2026, 3, 27, 0, 0, 0),
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://kv-marketplace.upstash.io/pipeline");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer kv-token",
    });
  });

  it("UPSTASH_* takes precedence over KV_* when both are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://primary.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "primary-token";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const mod = await loadModule();
    await mod.recordHit({
      path: "/",
      ref: "",
      country: null,
      region: null,
      city: null,
      browser: "Chrome",
      os: "macOS",
      deviceType: "desktop",
      sessionId: "y".repeat(32),
      ts: Date.now(),
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("primary.upstash.io");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer primary-token",
    });
  });
});
