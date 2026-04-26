import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: {
    set: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

import { GET } from "./route";

function makeRequest(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  process.env.ADMIN_SECRET = "test-secret";
  cookieStore.set.mockReset();
});

afterEach(() => {
  delete process.env.ADMIN_SECRET;
});

describe("GET /admin/unlock", () => {
  it("404s when no key is provided", async () => {
    const res = await GET(makeRequest("https://example.com/admin/unlock"));
    expect(res.status).toBe(404);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("404s on a wrong key", async () => {
    const res = await GET(
      makeRequest("https://example.com/admin/unlock?key=nope"),
    );
    expect(res.status).toBe(404);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("404s when ADMIN_SECRET is unset, even with any key", async () => {
    delete process.env.ADMIN_SECRET;
    const res = await GET(
      makeRequest("https://example.com/admin/unlock?key=anything"),
    );
    expect(res.status).toBe(404);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("404s on empty key", async () => {
    const res = await GET(
      makeRequest("https://example.com/admin/unlock?key="),
    );
    expect(res.status).toBe(404);
  });

  it("sets pf_admin cookie and 303-redirects to /admin/stats on key match", async () => {
    const res = await GET(
      makeRequest("https://example.com/admin/unlock?key=test-secret"),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://example.com/admin/stats");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "pf_admin",
      "1",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("preserves the range query param on the redirect", async () => {
    const res = await GET(
      makeRequest(
        "https://example.com/admin/unlock?key=test-secret&range=30d",
      ),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://example.com/admin/stats?range=30d",
    );
  });
});
