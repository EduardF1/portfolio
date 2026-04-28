/**
 * Tests for POST /api/track and GET /api/track.
 *
 * The route is the analytics ingestion endpoint. The contract:
 *   - 204 on success (analytics never blocks the UI),
 *   - 204 on a malformed body (no throw, no record),
 *   - 204 on admin browser (pf_admin=1 cookie),
 *   - 204 + skip Redis when env vars are missing (local dev),
 *   - mints a 30-min session cookie when the request didn't carry one,
 *   - records geo from x-vercel-ip-* headers, never reads x-forwarded-for,
 *   - GET returns 405 Method Not Allowed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => ({
    get: (key: string) => incomingHeaders.get(key.toLowerCase()) ?? null,
  }),
}));

let incomingHeaders = new Map<string, string>();

const recordHit = vi.fn();
const isAnalyticsEnabled = vi.fn(() => true);
vi.mock("@/lib/redis-analytics", () => ({
  recordHit: (...args: unknown[]) => recordHit(...args),
  isAnalyticsEnabled: () => isAnalyticsEnabled(),
}));

vi.mock("@/lib/analytics", () => ({
  generateSessionId: () => "abcdef0123456789abcdef0123456789",
}));

vi.mock("@/lib/ua-parser", () => ({
  parseUserAgent: (ua: unknown) => ({
    browser: typeof ua === "string" && ua.includes("Firefox") ? "Firefox" : "Chrome",
    os: "macOS",
    deviceType: "desktop",
  }),
}));

beforeEach(() => {
  cookieGet.mockReset();
  recordHit.mockReset();
  isAnalyticsEnabled.mockReset().mockReturnValue(true);
  incomingHeaders = new Map();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

import { GET, POST } from "./route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/track", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/track", () => {
  it("returns 204 with no body when analytics is disabled (env vars unset)", async () => {
    isAnalyticsEnabled.mockReturnValueOnce(false);
    const res = await POST(makeReq({ path: "/work" }));
    expect(res.status).toBe(204);
    expect(recordHit).not.toHaveBeenCalled();
  });

  it("returns 204 and skips recording when pf_admin=1 cookie is present", async () => {
    cookieGet.mockImplementation((name: string) =>
      name === "pf_admin" ? { value: "1" } : undefined,
    );
    const res = await POST(makeReq({ path: "/work" }));
    expect(res.status).toBe(204);
    expect(recordHit).not.toHaveBeenCalled();
  });

  it("returns 204 on malformed JSON body without recording", async () => {
    cookieGet.mockReturnValue(undefined);
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: "{not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(recordHit).not.toHaveBeenCalled();
  });

  it("records a hit and returns 204 with a Set-Cookie minting a new session", async () => {
    cookieGet.mockReturnValue(undefined);
    incomingHeaders.set("user-agent", "Mozilla/5.0 Chrome");
    incomingHeaders.set("x-vercel-ip-country", "DK");
    incomingHeaders.set("x-vercel-ip-country-region", "82");
    incomingHeaders.set("x-vercel-ip-city", "Aarhus");
    const res = await POST(makeReq({ path: "/work", ref: "https://x" }));
    expect(res.status).toBe(204);
    expect(recordHit).toHaveBeenCalledTimes(1);
    const hit = recordHit.mock.calls[0][0] as Record<string, unknown>;
    expect(hit.path).toBe("/work");
    expect(hit.ref).toBe("https://x");
    expect(hit.country).toBe("DK");
    expect(hit.region).toBe("82");
    expect(hit.city).toBe("Aarhus");
    expect(hit.sessionId).toBe("abcdef0123456789abcdef0123456789");
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(/pf_session=abcdef0123456789abcdef0123456789/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/Secure/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    // 30 min TTL
    expect(setCookie).toMatch(/Max-Age=1800/);
  });

  it("does NOT mint a new cookie when a valid session cookie is already present", async () => {
    const existing = "0123456789abcdef0123456789abcdef";
    cookieGet.mockImplementation((name: string) =>
      name === "pf_session" ? { value: existing } : undefined,
    );
    const res = await POST(makeReq({ path: "/work" }));
    expect(res.status).toBe(204);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    const hit = recordHit.mock.calls[0][0] as Record<string, unknown>;
    expect(hit.sessionId).toBe(existing);
  });

  it("re-mints when the existing cookie value has the wrong shape", async () => {
    cookieGet.mockImplementation((name: string) =>
      name === "pf_session" ? { value: "not-32-hex-chars" } : undefined,
    );
    const res = await POST(makeReq({ path: "/work" }));
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(/pf_session=abcdef0123456789abcdef0123456789/);
  });

  it("URI-decodes city names that Vercel encoded with %20", async () => {
    cookieGet.mockReturnValue(undefined);
    incomingHeaders.set("x-vercel-ip-city", "New%20York");
    const res = await POST(makeReq({ path: "/work" }));
    expect(res.status).toBe(204);
    const hit = recordHit.mock.calls[0][0] as Record<string, unknown>;
    expect(hit.city).toBe("New York");
  });

  it("falls back to '/' when the body path is missing or not a string starting with /", async () => {
    cookieGet.mockReturnValue(undefined);
    await POST(makeReq({ path: "no-leading-slash" }));
    const hit = recordHit.mock.calls[0][0] as Record<string, unknown>;
    expect(hit.path).toBe("/");
  });

  it("clamps the path to 256 chars and the ref to 512 chars", async () => {
    cookieGet.mockReturnValue(undefined);
    const longPath = "/" + "a".repeat(500);
    const longRef = "https://x.example.com/" + "b".repeat(1000);
    await POST(makeReq({ path: longPath, ref: longRef }));
    const hit = recordHit.mock.calls[0][0] as Record<string, unknown>;
    expect((hit.path as string).length).toBe(256);
    expect((hit.ref as string).length).toBe(512);
  });
});

describe("GET /api/track", () => {
  it("returns 405 Method Not Allowed", () => {
    const res = GET();
    expect(res.status).toBe(405);
  });
});
