import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Hit } from "@/lib/analytics";

const { cookieStore, notFoundFn, redisMocks } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn<(name: string) => { value: string } | undefined>(),
    set: vi.fn(),
  },
  notFoundFn: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redisMocks: {
    isAnalyticsEnabled: vi.fn<() => boolean>(),
    getHits: vi.fn<(days: string[]) => Promise<unknown[]>>(),
    getUniqueSessionCount: vi.fn<(days: string[]) => Promise<number>>(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundFn,
}));

vi.mock("@/lib/redis-analytics", () => redisMocks);

import AdminStatsPage from "./page";

const today = new Date().toISOString().slice(0, 10);

function makeHit(over: Partial<Hit> = {}): Hit {
  return {
    path: "/work",
    ref: "",
    country: "DK",
    region: "Hovedstaden",
    city: "Copenhagen",
    browser: "Chrome",
    os: "macOS",
    deviceType: "desktop",
    sessionId: "a".repeat(32),
    ts: Date.now(),
    ...over,
  };
}

beforeEach(() => {
  process.env.ADMIN_SECRET = "test-secret";
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  notFoundFn.mockClear();
  redisMocks.isAnalyticsEnabled.mockReset();
  redisMocks.getHits.mockReset();
  redisMocks.getUniqueSessionCount.mockReset();
});

afterEach(() => {
  cleanup();
  delete process.env.ADMIN_SECRET;
});

describe("/admin/stats — auth gate", () => {
  it("404s when no admin cookie and no key", async () => {
    cookieStore.get.mockReturnValue(undefined);
    redisMocks.isAnalyticsEnabled.mockReturnValue(false);

    await expect(
      AdminStatsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundFn).toHaveBeenCalled();
  });

  it("404s when key is wrong", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await expect(
      AdminStatsPage({ searchParams: Promise.resolve({ key: "wrong" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s when key is empty string (regression: no auto-pass on empty env)", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await expect(
      AdminStatsPage({ searchParams: Promise.resolve({ key: "" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s when ADMIN_SECRET env is unset, even if key is present", async () => {
    delete process.env.ADMIN_SECRET;
    cookieStore.get.mockReturnValue(undefined);
    await expect(
      AdminStatsPage({ searchParams: Promise.resolve({ key: "anything" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets pf_admin cookie and unlocks when key matches", async () => {
    cookieStore.get.mockReturnValue(undefined);
    redisMocks.isAnalyticsEnabled.mockReturnValue(false);

    const tree = await AdminStatsPage({
      searchParams: Promise.resolve({ key: "test-secret" }),
    });
    render(tree);

    expect(cookieStore.set).toHaveBeenCalledWith(
      "pf_admin",
      "1",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    );
    expect(notFoundFn).not.toHaveBeenCalled();
  });

  it("unlocks when pf_admin cookie is already set, no key needed", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "pf_admin" ? { value: "1" } : undefined,
    );
    redisMocks.isAnalyticsEnabled.mockReturnValue(false);

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(notFoundFn).not.toHaveBeenCalled();
  });
});

describe("/admin/stats — empty state", () => {
  it("shows the Upstash setup banner when analytics are not configured", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "pf_admin" ? { value: "1" } : undefined,
    );
    redisMocks.isAnalyticsEnabled.mockReturnValue(false);

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(
      screen.getByText(/Set up Upstash Redis to start collecting/),
    ).toBeInTheDocument();
    expect(screen.getByText(/docs\/metrics-setup\.md/)).toBeInTheDocument();
  });
});

describe("/admin/stats — dashboard render", () => {
  beforeEach(() => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "pf_admin" ? { value: "1" } : undefined,
    );
    redisMocks.isAnalyticsEnabled.mockReturnValue(true);
  });

  it("renders totals, top pages, geography, and device mix from seeded hits", async () => {
    const hits: Hit[] = [
      makeHit({ path: "/work", sessionId: "s1".padEnd(32, "0"), country: "DK" }),
      makeHit({ path: "/work", sessionId: "s1".padEnd(32, "0"), country: "DK" }),
      makeHit({
        path: "/personal",
        sessionId: "s2".padEnd(32, "0"),
        country: "DE",
        deviceType: "mobile",
        ref: "https://www.linkedin.com/feed",
      }),
      makeHit({
        path: "/contact",
        sessionId: "s3".padEnd(32, "0"),
        country: "DK",
        deviceType: "tablet",
      }),
    ];
    redisMocks.getHits.mockResolvedValue(hits);
    redisMocks.getUniqueSessionCount.mockResolvedValue(3);

    const tree = await AdminStatsPage({
      searchParams: Promise.resolve({ range: "7d" }),
    });
    render(tree);

    // Total page views card — scope to the labeled card so we don't
    // collide with the same number appearing in the per-day chart.
    const pageViewsCard = screen.getByText("Page views").parentElement!;
    expect(within(pageViewsCard).getByText("4")).toBeInTheDocument();
    const sessionsCard = screen.getByText(
      "Unique sessions (visit-day)",
    ).parentElement!;
    expect(within(sessionsCard).getByText("3")).toBeInTheDocument();

    // Top pages — /work has 2 hits, /personal and /contact 1 each
    const topPagesSection = screen.getByText("Top pages").parentElement!;
    expect(within(topPagesSection).getByText("/work")).toBeInTheDocument();
    expect(within(topPagesSection).getByText("/personal")).toBeInTheDocument();
    expect(within(topPagesSection).getByText("/contact")).toBeInTheDocument();

    // Top referrers — only the LinkedIn host
    const refSection = screen.getByText("Top referrers").parentElement!;
    expect(within(refSection).getByText("www.linkedin.com")).toBeInTheDocument();

    // Geography — DK appears (2 hits) and DE
    const geoSection = screen.getByText("Geography").parentElement!;
    expect(within(geoSection).getByText("DK")).toBeInTheDocument();
    expect(within(geoSection).getByText("DE")).toBeInTheDocument();

    // Device mix — should show all three buckets with non-zero where seeded
    const deviceSection = screen.getByText("Device mix").parentElement!;
    expect(within(deviceSection).getByText(/Mobile/)).toBeInTheDocument();
    expect(within(deviceSection).getByText(/Tablet/)).toBeInTheDocument();
    expect(within(deviceSection).getByText(/Desktop/)).toBeInTheDocument();
  });

  it("honours the range tab — passes 30 day-keys when range=30d", async () => {
    redisMocks.getHits.mockResolvedValue([]);
    redisMocks.getUniqueSessionCount.mockResolvedValue(0);

    await AdminStatsPage({
      searchParams: Promise.resolve({ range: "30d" }),
    });

    expect(redisMocks.getHits).toHaveBeenCalledWith(
      expect.arrayContaining([today]),
    );
    expect(redisMocks.getHits.mock.calls[0]![0]).toHaveLength(30);
  });

  it("falls back to 'today' (1 day) when range param is unrecognised", async () => {
    redisMocks.getHits.mockResolvedValue([]);
    redisMocks.getUniqueSessionCount.mockResolvedValue(0);

    await AdminStatsPage({
      searchParams: Promise.resolve({ range: "lifetime" }),
    });

    expect(redisMocks.getHits.mock.calls[0]![0]).toHaveLength(1);
  });

  it("ignores referrers that fail URL parsing", async () => {
    redisMocks.getHits.mockResolvedValue([
      makeHit({ ref: "not a url" }),
      makeHit({ ref: "https://valid.example/x" }),
    ]);
    redisMocks.getUniqueSessionCount.mockResolvedValue(1);

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    const refSection = screen.getByText("Top referrers").parentElement!;
    expect(within(refSection).getByText("valid.example")).toBeInTheDocument();
    expect(within(refSection).queryByText(/not a url/)).not.toBeInTheDocument();
  });

  it("renders the empty hint for top referrers when there are none", async () => {
    redisMocks.getHits.mockResolvedValue([makeHit({ ref: "" })]);
    redisMocks.getUniqueSessionCount.mockResolvedValue(1);

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(
      screen.getByText(/No external referrers in this window/),
    ).toBeInTheDocument();
  });
});
