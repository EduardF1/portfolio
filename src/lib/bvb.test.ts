import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __test__, getBvbFeed, BVB_TEAM_ID } from "./bvb";

const ORIG_FETCH = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const FAKE_STANDINGS = {
  standings: [
    {
      type: "TOTAL",
      table: [
        {
          position: 1,
          team: {
            id: BVB_TEAM_ID,
            name: "Borussia Dortmund",
            shortName: "Dortmund",
            tla: "BVB",
            crest: "https://crests.football-data.org/4.svg",
          },
          playedGames: 10,
          won: 7,
          draw: 2,
          lost: 1,
          goalsFor: 22,
          goalsAgainst: 8,
          goalDifference: 14,
          points: 23,
        },
      ],
    },
  ],
};

const FAKE_FIXTURES = {
  matches: [
    {
      id: 100,
      utcDate: "2026-05-02T13:30:00Z",
      status: "SCHEDULED",
      competition: { code: "BL1", name: "Bundesliga" },
      homeTeam: { id: BVB_TEAM_ID, name: "Borussia Dortmund", tla: "BVB" },
      awayTeam: { id: 5, name: "RB Leipzig", tla: "RBL" },
    },
  ],
};

const FAKE_RESULTS = {
  matches: [
    {
      id: 200,
      utcDate: "2026-04-19T13:30:00Z",
      status: "FINISHED",
      competition: { code: "BL1", name: "Bundesliga" },
      homeTeam: { id: 6, name: "Werder Bremen", tla: "SVW" },
      awayTeam: { id: BVB_TEAM_ID, name: "Borussia Dortmund", tla: "BVB" },
      score: { fullTime: { home: 1, away: 2 } },
    },
    {
      id: 201,
      utcDate: "2026-04-12T16:30:00Z",
      status: "FINISHED",
      competition: { code: "BL1", name: "Bundesliga" },
      homeTeam: { id: BVB_TEAM_ID, name: "Borussia Dortmund", tla: "BVB" },
      awayTeam: { id: 7, name: "FC Bayern", tla: "FCB" },
      score: { fullTime: { home: 1, away: 1 } },
    },
  ],
};

beforeEach(() => {
  vi.stubEnv("BVB_API_TOKEN", "test-token");
  vi.stubEnv("BVB_USE_MOCK", "");
});

afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getBvbFeed — happy path", () => {
  it("maps standings, fixtures, and results from a successful API response", async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes("/competitions/BL1/standings")) return jsonResponse(FAKE_STANDINGS);
      if (url.includes("status=SCHEDULED")) return jsonResponse(FAKE_FIXTURES);
      if (url.includes("status=FINISHED")) return jsonResponse(FAKE_RESULTS);
      throw new Error(`unexpected url: ${url}`);
    });
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings).toHaveLength(1);
    expect(feed.standings[0]?.teamTla).toBe("BVB");
    expect(feed.standings[0]?.points).toBe(23);
    expect(feed.fixtures).toHaveLength(1);
    expect(feed.fixtures[0]?.opponent).toBe("RB Leipzig");
    expect(feed.fixtures[0]?.isHome).toBe(true);
    expect(feed.results).toHaveLength(2);
    // Results should be newest-first.
    expect(feed.results[0]?.utcDate.startsWith("2026-04-19")).toBe(true);
    expect(feed.results[0]?.outcome).toBe("W");
    expect(feed.results[1]?.outcome).toBe("D");
  });

  it("forwards the X-Auth-Token header on every API call", async () => {
    type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
    const fetchSpy = vi.fn<FetchFn>().mockResolvedValue(
      jsonResponse({ standings: [], matches: [] }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    await getBvbFeed();

    for (const call of fetchSpy.mock.calls) {
      const init = call[1];
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.["X-Auth-Token"]).toBe("test-token");
    }
  });
});

describe("getBvbFeed — error and degraded paths", () => {
  it("falls back to mock data when every upstream call fails", async () => {
    globalThis.fetch = vi
      .fn(async () => new Response("nope", { status: 401, statusText: "Unauthorized" }))
      .mockName("401-fetch") as unknown as typeof globalThis.fetch;
    // Suppress the expected console.error noise.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(true);
    expect(feed.standings.length).toBeGreaterThan(0);
    expect(feed.fixtures.length).toBeGreaterThan(0);
    expect(errSpy).toHaveBeenCalled();
  });

  it("tolerates partial failure — keeps successful tabs, empties failing ones", async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes("/competitions/")) return jsonResponse(FAKE_STANDINGS);
      if (url.includes("status=SCHEDULED"))
        return new Response("rate limited", { status: 429, statusText: "Too Many Requests" });
      if (url.includes("status=FINISHED")) return jsonResponse(FAKE_RESULTS);
      throw new Error(`unexpected url: ${url}`);
    }) as unknown as typeof globalThis.fetch;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings).toHaveLength(1);
    expect(feed.fixtures).toEqual([]);
    expect(feed.results).toHaveLength(2);
  });

  it("returns mock data when fetch throws (network failure)", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(true);
  });
});

describe("getBvbFeed — token gating", () => {
  it("returns mock data and never calls fetch when BVB_API_TOKEN is missing", async () => {
    vi.stubEnv("BVB_API_TOKEN", "");
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forces mock data when BVB_USE_MOCK=1 even with a valid token", async () => {
    vi.stubEnv("BVB_USE_MOCK", "1");
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("__test__ helpers", () => {
  it("mapCompetitionCode normalises CL/UCL/DFB/BL1 and falls back to OTHER", () => {
    expect(__test__.mapCompetitionCode("BL1")).toBe("BL1");
    expect(__test__.mapCompetitionCode("DFB")).toBe("DFB");
    expect(__test__.mapCompetitionCode("CL")).toBe("UCL");
    expect(__test__.mapCompetitionCode("UCL")).toBe("UCL");
    expect(__test__.mapCompetitionCode("PL")).toBe("OTHER");
    expect(__test__.mapCompetitionCode(undefined)).toBe("OTHER");
    expect(__test__.mapCompetitionCode(null)).toBe("OTHER");
  });

  it("competitionDisplayName returns canonical names and OTHER passthrough", () => {
    expect(__test__.competitionDisplayName("BL1")).toBe("Bundesliga");
    expect(__test__.competitionDisplayName("DFB")).toBe("DFB-Pokal");
    expect(__test__.competitionDisplayName("UCL")).toBe("UEFA Champions League");
    expect(__test__.competitionDisplayName("OTHER", "Friendly")).toBe("Friendly");
    expect(__test__.competitionDisplayName("OTHER", null)).toBe("Other");
  });

  it("toResult assigns W/D/L correctly from BVB's perspective", () => {
    const win = __test__.toResult({
      id: 1,
      utcDate: "2026-04-01T18:00:00Z",
      status: "FINISHED",
      competition: { code: "BL1" },
      homeTeam: { id: BVB_TEAM_ID },
      awayTeam: { id: 999, name: "Other", tla: "OTH" },
      score: { fullTime: { home: 3, away: 0 } },
    });
    expect(win.outcome).toBe("W");
    expect(win.bvbScore).toBe(3);

    const loss = __test__.toResult({
      id: 2,
      utcDate: "2026-04-01T18:00:00Z",
      status: "FINISHED",
      competition: { code: "BL1" },
      homeTeam: { id: 999, name: "Other", tla: "OTH" },
      awayTeam: { id: BVB_TEAM_ID },
      score: { fullTime: { home: 2, away: 1 } },
    });
    expect(loss.outcome).toBe("L");
    expect(loss.bvbScore).toBe(1);

    const draw = __test__.toResult({
      id: 3,
      utcDate: "2026-04-01T18:00:00Z",
      status: "FINISHED",
      competition: { code: "BL1" },
      homeTeam: { id: BVB_TEAM_ID },
      awayTeam: { id: 999, name: "Other", tla: "OTH" },
      score: { fullTime: { home: 1, away: 1 } },
    });
    expect(draw.outcome).toBe("D");

    const noScore = __test__.toResult({
      id: 4,
      utcDate: "2026-04-01T18:00:00Z",
      status: "TIMED",
      competition: { code: "BL1" },
      homeTeam: { id: BVB_TEAM_ID },
      awayTeam: { id: 999, name: "Other", tla: "OTH" },
      score: { fullTime: { home: null, away: null } },
    });
    expect(noScore.outcome).toBe(null);
  });

  it("toFixture flips home/away based on BVB_TEAM_ID", () => {
    const home = __test__.toFixture({
      id: 10,
      utcDate: "2026-05-01T13:00:00Z",
      status: "SCHEDULED",
      competition: { code: "BL1", name: "Bundesliga" },
      homeTeam: { id: BVB_TEAM_ID },
      awayTeam: { id: 999, name: "Other", tla: "OTH" },
    });
    expect(home.isHome).toBe(true);
    expect(home.opponent).toBe("Other");

    const away = __test__.toFixture({
      id: 11,
      utcDate: "2026-05-08T13:00:00Z",
      status: "SCHEDULED",
      competition: { code: "BL1", name: "Bundesliga" },
      homeTeam: { id: 999, name: "Other", tla: "OTH" },
      awayTeam: { id: BVB_TEAM_ID },
    });
    expect(away.isHome).toBe(false);
    expect(away.opponent).toBe("Other");
  });

  it("MOCK_FEED has plausible-looking data for the empty-state fallback", () => {
    expect(__test__.MOCK_FEED.standings.length).toBeGreaterThan(10);
    expect(__test__.MOCK_FEED.fixtures.length).toBeGreaterThan(0);
    expect(__test__.MOCK_FEED.results.length).toBeGreaterThan(0);
    // BVB row exists in the mock standings.
    const bvbRow = __test__.MOCK_FEED.standings.find((r) => r.teamId === BVB_TEAM_ID);
    expect(bvbRow).toBeDefined();
  });
});
