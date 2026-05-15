import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Hit } from "@/lib/analytics";

const { cookieStore, headerStore, notFoundFn, redirectFn, redisMocks, adminStatsMocks } =
  vi.hoisted(() => ({
    cookieStore: {
      get: vi.fn<(name: string) => { value: string } | undefined>(),
      set: vi.fn(),
    },
    headerStore: {
      get: vi.fn<(name: string) => string | null>(),
    },
    notFoundFn: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    redirectFn: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    redisMocks: {
      isAnalyticsEnabled: vi.fn<() => boolean>(),
      getHits: vi.fn<(days: string[]) => Promise<unknown[]>>(),
      getUniqueSessionCount: vi.fn<(days: string[]) => Promise<number>>(),
    },
    adminStatsMocks: {
      fetchPaletteStats: vi.fn<
        (
          baseUrl: string,
          secret: string | undefined,
        ) => Promise<{
          counters: Record<string, number>;
          palettes: string[];
          themes: string[];
          updatedAt: string;
        }>
      >(),
      getSearchQueryStats: vi.fn<() => Promise<unknown[]>>(),
    },
  }));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => headerStore,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundFn,
  redirect: redirectFn,
}));

vi.mock("@/lib/redis-analytics", () => redisMocks);

// Stub the Recharts wrappers. Recharts needs ResizeObserver which
// jsdom doesn't ship; keep the assertions focused on data rather than
// SVG paths by rendering simple data-testid markers instead.
vi.mock("@/components/admin-charts", () => ({
  DailyViewsChart: ({ data }: { data: Array<{ day: string; views: number }> }) => (
    <div data-testid="daily-chart">{data.length} days</div>
  ),
  EventsBarChart: ({ data }: { data: Array<{ label: string; value: number }> }) => (
    <div data-testid="events-chart">{data.length} events</div>
  ),
  DevicePie: ({ data }: { data: Array<{ label: string; value: number }> }) => (
    <div data-testid="device-pie">{data.length} buckets</div>
  ),
}));

vi.mock("@/lib/admin-stats", async () => {
  // Re-export the pure helpers (barChartPercents, topPaletteCombos,
  // EMPTY_PALETTE_STATS, etc.) from the real module so the dashboard
  // renders the same maths under test, and only stub the I/O paths.
  const actual = await vi.importActual<typeof import("@/lib/admin-stats")>(
    "@/lib/admin-stats",
  );
  return {
    ...actual,
    fetchPaletteStats: adminStatsMocks.fetchPaletteStats,
    getSearchQueryStats: adminStatsMocks.getSearchQueryStats,
  };
});

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
  headerStore.get.mockReset();
  // Default header behaviour: simulate a Vercel-edge request to
  // example.test. Individual tests can override.
  headerStore.get.mockImplementation((name: string) => {
    if (name === "x-forwarded-proto") return "https";
    if (name === "x-forwarded-host") return "example.test";
    return null;
  });
  notFoundFn.mockClear();
  redirectFn.mockClear();
  redisMocks.isAnalyticsEnabled.mockReset();
  redisMocks.getHits.mockReset();
  redisMocks.getUniqueSessionCount.mockReset();
  adminStatsMocks.fetchPaletteStats.mockReset();
  adminStatsMocks.fetchPaletteStats.mockResolvedValue({
    counters: {},
    palettes: [],
    themes: [],
    updatedAt: "",
  });
  adminStatsMocks.getSearchQueryStats.mockReset();
  adminStatsMocks.getSearchQueryStats.mockResolvedValue([]);
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

  it("redirects to /admin/unlock when key matches and no cookie is set", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(
      AdminStatsPage({
        searchParams: Promise.resolve({ key: "test-secret" }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/unlock\?key=test-secret/);

    expect(redirectFn).toHaveBeenCalledWith("/admin/unlock?key=test-secret");
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(notFoundFn).not.toHaveBeenCalled();
  });

  it("forwards range param through the redirect", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(
      AdminStatsPage({
        searchParams: Promise.resolve({ key: "test-secret", range: "30d" }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/unlock\?key=test-secret&range=30d/);
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

describe("/admin/stats — palette × theme + search queries", () => {
  beforeEach(() => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "pf_admin" ? { value: "1" } : undefined,
    );
    redisMocks.isAnalyticsEnabled.mockReturnValue(true);
    redisMocks.getHits.mockResolvedValue([]);
    redisMocks.getUniqueSessionCount.mockResolvedValue(0);
  });

  it("renders the palette × theme card with bars sorted by count desc", async () => {
    adminStatsMocks.fetchPaletteStats.mockResolvedValue({
      counters: {
        "schwarzgelb::dark": 8,
        "mountain-navy::light": 3,
        "woodsy-cabin::dark": 5,
      },
      palettes: ["schwarzgelb", "mountain-navy", "woodsy-cabin"],
      themes: ["dark", "light"],
      updatedAt: "2026-04-28T10:00:00Z",
    });

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    const card = screen.getByText("Top palette × theme").parentElement!;
    expect(
      within(card).getByText("schwarzgelb · dark"),
    ).toBeInTheDocument();
    expect(within(card).getByText("8")).toBeInTheDocument();
    expect(within(card).getByText("woodsy-cabin · dark")).toBeInTheDocument();
    expect(within(card).getByText(/Updated 2026-04-28/)).toBeInTheDocument();
  });

  it("shows the no-data placeholder for palette × theme when counters are empty", async () => {
    adminStatsMocks.fetchPaletteStats.mockResolvedValue({
      counters: {},
      palettes: [],
      themes: [],
      updatedAt: "",
    });

    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    const card = screen.getByText("Top palette × theme").parentElement!;
    expect(within(card).getByText(/No data yet/)).toBeInTheDocument();
    expect(within(card).getByText(/api\/track-palette/)).toBeInTheDocument();
  });

  it("shows the no-data placeholder for search queries by default (privacy)", async () => {
    adminStatsMocks.getSearchQueryStats.mockResolvedValue([]);
    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    const card = screen.getByText("Top search queries").parentElement!;
    expect(
      within(card).getByText(/Search queries stay client-side by default/),
    ).toBeInTheDocument();
  });

  it("renders search query bars when the log returns rows", async () => {
    adminStatsMocks.getSearchQueryStats.mockResolvedValue([
      { key: "react", count: 7 },
      { key: "next", count: 3 },
    ]);
    const tree = await AdminStatsPage({ searchParams: Promise.resolve({}) });
    render(tree);
    const card = screen.getByText("Top search queries").parentElement!;
    expect(within(card).getByText("react")).toBeInTheDocument();
    expect(within(card).getByText("next")).toBeInTheDocument();
  });

  it("forwards the env secret + Vercel host to the palette fetcher", async () => {
    headerStore.get.mockImplementation((name: string) => {
      if (name === "x-forwarded-proto") return "https";
      if (name === "x-forwarded-host") return "preview.example.test";
      return null;
    });

    await AdminStatsPage({ searchParams: Promise.resolve({}) });
    expect(adminStatsMocks.fetchPaletteStats).toHaveBeenCalledWith(
      "https://preview.example.test",
      "test-secret",
    );
  });
});
