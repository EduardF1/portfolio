import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Module under test re-imports per test so env-var changes are picked
// up. Mirrors the pattern used in `redis-analytics.test.ts`.
async function loadModule() {
  vi.resetModules();
  return await import("./visit-tracker");
}

describe("hashIpForDay", () => {
  beforeEach(() => {
    delete process.env.DAILY_SALT;
  });

  it("produces a 16-char hex string", async () => {
    const { hashIpForDay } = await loadModule();
    const h = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-x");
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic for the same inputs", async () => {
    const { hashIpForDay } = await loadModule();
    const a = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-x");
    const b = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-x");
    expect(a).toBe(b);
  });

  it("rotates daily — same IP, different day → different hash", async () => {
    const { hashIpForDay } = await loadModule();
    const a = await hashIpForDay("203.0.113.7", "2026-04-26", "salt-x");
    const b = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-x");
    expect(a).not.toBe(b);
  });

  it("changes when the salt changes (no salt-leak collision)", async () => {
    const { hashIpForDay } = await loadModule();
    const a = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-a");
    const b = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-b");
    expect(a).not.toBe(b);
  });

  it("hashes empty / nullish IPs to a stable 'unknown' bucket", async () => {
    const { hashIpForDay } = await loadModule();
    const a = await hashIpForDay(null, "2026-04-27", "salt-x");
    const b = await hashIpForDay("", "2026-04-27", "salt-x");
    const c = await hashIpForDay(undefined, "2026-04-27", "salt-x");
    expect(a).toBe(b);
    expect(a).toBe(c);
    // and DIFFERENT from a real IP, so unknowns don't collide with
    // an actual visitor's hash:
    const real = await hashIpForDay("203.0.113.7", "2026-04-27", "salt-x");
    expect(a).not.toBe(real);
  });

  it("falls back to process.env.DAILY_SALT when no salt is passed", async () => {
    process.env.DAILY_SALT = "env-salt-1";
    const { hashIpForDay } = await loadModule();
    const a = await hashIpForDay("203.0.113.7", "2026-04-27");
    process.env.DAILY_SALT = "env-salt-2";
    const { hashIpForDay: hashIp2 } = await loadModule();
    const b = await hashIp2("203.0.113.7", "2026-04-27");
    expect(a).not.toBe(b);
  });
});

describe("extractClientIp", () => {
  it("prefers x-vercel-forwarded-for", async () => {
    const { extractClientIp } = await loadModule();
    const h = new Headers({
      "x-vercel-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-forwarded-for": "198.51.100.7",
    });
    expect(extractClientIp(h)).toBe("203.0.113.7");
  });

  it("falls back to x-forwarded-for when vercel header is missing", async () => {
    const { extractClientIp } = await loadModule();
    const h = new Headers({
      "x-forwarded-for": "198.51.100.7, 172.16.0.1",
    });
    expect(extractClientIp(h)).toBe("198.51.100.7");
  });

  it("returns null when no client-ip headers are present", async () => {
    const { extractClientIp } = await loadModule();
    expect(extractClientIp(new Headers())).toBeNull();
  });
});

describe("visitKey / visitsSetKey", () => {
  it("compose the documented Redis key prefixes", async () => {
    const { visitKey, visitsSetKey } = await loadModule();
    expect(visitKey("2026-04-27", "abc123def4567890")).toBe(
      "visits:2026-04-27:abc123def4567890",
    );
    expect(visitsSetKey("2026-04-27")).toBe("visits-set:2026-04-27");
  });
});

describe("recordVisit — env-var-less mode", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("is a silent no-op when Redis is unavailable", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mod = await loadModule();
    await mod.recordVisit("203.0.113.7", new Date(Date.UTC(2026, 3, 27)));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("recordVisit — with env vars set", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.DAILY_SALT = "test-salt";
  });
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DAILY_SALT;
    vi.restoreAllMocks();
  });

  it("POSTs a SADD into visits-set:<day> with the IP-hash", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { result: 1 },
          { result: 1 },
          { result: 1 },
          { result: 1 },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const mod = await loadModule();
    await mod.recordVisit("203.0.113.7", new Date(Date.UTC(2026, 3, 27, 12)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://example.upstash.io/pipeline");
    const body = JSON.parse(String((init as RequestInit).body)) as Array<
      (string | number)[]
    >;
    // 4 commands: SET + EXPIRE + SADD + EXPIRE
    expect(body).toHaveLength(4);
    expect(body[0][0]).toBe("SET");
    expect(body[0][1]).toMatch(/^visits:2026-04-27:[0-9a-f]{16}$/);
    expect(body[2][0]).toBe("SADD");
    expect(body[2][1]).toBe("visits-set:2026-04-27");
    expect(String(body[2][2])).toMatch(/^[0-9a-f]{16}$/);
    // The hash in SET key matches the hash SADD'd into the set.
    const setHash = String(body[0][1]).split(":")[2];
    expect(body[2][2]).toBe(setHash);
  });
});

describe("getUniqueVisitorCount", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.restoreAllMocks();
  });

  it("returns SCARD on visits-set:<day>", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const mod = await loadModule();
    expect(await mod.getUniqueVisitorCount("2026-04-27")).toBe(7);
  });

  it("returns 0 on Redis miss", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mod = await loadModule();
    expect(await mod.getUniqueVisitorCount("2026-04-27")).toBe(0);
  });
});
