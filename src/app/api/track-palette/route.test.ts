import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub the rate-limit module so the route's per-IP limiter never
// reaches `fetch` in tests. Without this, the limiter's KV pipeline
// call would be captured by `fetchMock` and pollute the per-test
// invocation counts the assertions below rely on.
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, count: 0, limit: 30 }),
}));

// Capture every `fetch` invocation against the mocked KV REST endpoint
// so individual tests can assert on the commands that were sent.
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  process.env.KV_REST_API_URL = "https://kv.example.com";
  process.env.KV_REST_API_TOKEN = "test-token";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.ADMIN_SECRET = "test-secret";
});

afterEach(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.ADMIN_SECRET;
  vi.restoreAllMocks();
});

// Import after env scaffolding is in place. Route handlers don't read
// env at import time (they're closures), but it's cheap insurance.
import { GET, POST } from "./route";

function makeRequest(
  url: string,
  init: { method?: string; body?: unknown } = {},
): Request {
  const { method = "POST", body } = init;
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function mockKvOk(results: unknown[]): void {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(results.map((r) => ({ result: r }))), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/track-palette", () => {
  it("rejects non-JSON bodies with 400", async () => {
    const req = new Request("https://example.com/api/track-palette", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean; reason?: string };
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("invalid-json");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects bodies that fail Zod validation with 400", async () => {
    // Wrong palette enum value — Zod should reject.
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: {
          palette: "not-a-real-palette",
          theme: "dark",
          locale: "en",
          path: "/",
        },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean; reason?: string };
    expect(json.reason).toBe("invalid-body");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing required fields", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: { palette: "mountain-navy", theme: "dark" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a path that doesn't start with /", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: {
          palette: "mountain-navy",
          theme: "dark",
          locale: "en",
          path: "no-leading-slash",
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("logs to stderr and skips KV when KV_REST_API_URL is unset", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: {
          palette: "mountain-navy",
          theme: "dark",
          locale: "en",
          path: "/",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; stored: boolean };
    expect(json).toEqual({ ok: true, stored: false });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });

  it("INCRs both counter shapes when KV is configured", async () => {
    mockKvOk([1, 1]);
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: {
          palette: "schwarzgelb",
          theme: "light",
          locale: "da",
          path: "/da/now",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; stored: boolean };
    expect(json).toEqual({ ok: true, stored: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://kv.example.com/pipeline");
    const sent = JSON.parse(String((init as RequestInit).body));
    expect(sent).toEqual([
      ["INCR", "palette:schwarzgelb:light"],
      ["INCR", "palette-pair:schwarzgelb:light:da"],
    ]);
  });

  it("returns ok:true,stored:false when KV is unreachable", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("server gone", { status: 502 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      makeRequest("https://example.com/api/track-palette", {
        body: {
          palette: "woodsy-cabin",
          theme: "dark",
          locale: "en",
          path: "/",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; stored: boolean };
    expect(json).toEqual({ ok: true, stored: false });
  });
});

describe("GET /api/track-palette", () => {
  it("404s without secret", async () => {
    const res = await GET(
      makeRequest("https://example.com/api/track-palette", { method: "GET" }),
    );
    expect(res.status).toBe(404);
  });

  it("404s on wrong secret", async () => {
    const res = await GET(
      makeRequest("https://example.com/api/track-palette?secret=wrong", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("404s when ADMIN_SECRET is unset (even with a key)", async () => {
    delete process.env.ADMIN_SECRET;
    const res = await GET(
      makeRequest(
        "https://example.com/api/track-palette?secret=test-secret",
        { method: "GET" },
      ),
    );
    expect(res.status).toBe(404);
  });

  it("returns the documented JSON shape on a valid secret with KV unset", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const res = await GET(
      makeRequest(
        "https://example.com/api/track-palette?secret=test-secret",
        { method: "GET" },
      ),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      counters: Record<string, number>;
      palettes: string[];
      themes: string[];
      updatedAt: string;
    };
    expect(json.counters).toEqual({});
    expect(json.palettes).toEqual([
      "schwarzgelb",
      "mountain-navy",
      "woodsy-cabin",
    ]);
    expect(json.themes).toEqual(["light", "dark"]);
    expect(typeof json.updatedAt).toBe("string");
    // ISO timestamp parses cleanly.
    expect(Number.isFinite(Date.parse(json.updatedAt))).toBe(true);
  });

  it("returns the merged counter map when KV responds", async () => {
    // 18 keys: 6 palette:<p>:<t> + 12 palette-pair:<p>:<t>:<l>.
    // We only return non-zero values for two of them so the sparse
    // map contract is exercised.
    const results = new Array(18).fill(null) as Array<string | null>;
    results[0] = "5"; // palette:schwarzgelb:light
    results[1] = "3"; // palette-pair:schwarzgelb:light:en
    mockKvOk(results);

    const res = await GET(
      makeRequest(
        "https://example.com/api/track-palette?secret=test-secret",
        { method: "GET" },
      ),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      counters: Record<string, number>;
      palettes: string[];
      themes: string[];
    };
    expect(json.counters["palette:schwarzgelb:light"]).toBe(5);
    expect(json.counters["palette-pair:schwarzgelb:light:en"]).toBe(3);
    // Zero / null entries are dropped from the map.
    expect(
      Object.keys(json.counters).every((k) => json.counters[k] > 0),
    ).toBe(true);
  });
});
