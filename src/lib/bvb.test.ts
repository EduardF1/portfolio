import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __test__,
  getBvbFeed,
  BVB_TEAM_ID,
  BUNDESLIGA_LEAGUE,
  DFB_POKAL_LEAGUE,
  getCurrentSeasonStartYear,
} from "./bvb";

const ORIG_FETCH = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- OpenLigaDB-shaped fixtures -----------------------------------------

const FAKE_BL_TABLE = [
  {
    teamInfoId: 40,
    teamName: "FC Bayern München",
    shortName: "Bayern",
    teamIconUrl: "https://example.test/fcb.png",
    points: 28,
    matches: 10,
    won: 9,
    draw: 1,
    lost: 0,
    goals: 30,
    opponentGoals: 5,
    goalDiff: 25,
  },
  {
    teamInfoId: BVB_TEAM_ID,
    teamName: "Borussia Dortmund",
    shortName: "Dortmund",
    teamIconUrl: "https://example.test/bvb.png",
    points: 23,
    matches: 10,
    won: 7,
    draw: 2,
    lost: 1,
    goals: 22,
    opponentGoals: 8,
    goalDiff: 14,
  },
  {
    teamInfoId: 9,
    teamName: "Bayer 04 Leverkusen",
    shortName: "Leverkusen",
    teamIconUrl: "https://example.test/b04.png",
    points: 22,
    matches: 10,
    won: 7,
    draw: 1,
    lost: 2,
    goals: 24,
    opponentGoals: 12,
    goalDiff: 12,
  },
  {
    teamInfoId: 1635,
    teamName: "RB Leipzig",
    shortName: "RB Leipzig",
    teamIconUrl: "https://example.test/rbl.png",
    points: 20,
    matches: 10,
    won: 6,
    draw: 2,
    lost: 2,
    goals: 18,
    opponentGoals: 10,
    goalDiff: 8,
  },
  {
    teamInfoId: 16,
    teamName: "VfB Stuttgart",
    shortName: "Stuttgart",
    teamIconUrl: "https://example.test/vfb.png",
    points: 18,
    matches: 10,
    won: 5,
    draw: 3,
    lost: 2,
    goals: 17,
    opponentGoals: 11,
    goalDiff: 6,
  },
  {
    teamInfoId: 91,
    teamName: "Eintracht Frankfurt",
    shortName: "Frankfurt",
    teamIconUrl: "https://example.test/sge.png",
    points: 16,
    matches: 10,
    won: 5,
    draw: 1,
    lost: 4,
    goals: 16,
    opponentGoals: 14,
    goalDiff: 2,
  },
];

const FAKE_BL_MATCHES = [
  // Future BVB home match.
  {
    matchID: 100,
    matchDateTimeUTC: "2099-05-02T13:30:00Z",
    matchIsFinished: false,
    leagueShortcut: "bl1",
    leagueName: "1. Bundesliga 2099/2100",
    team1: {
      teamId: BVB_TEAM_ID,
      teamName: "Borussia Dortmund",
      shortName: "Dortmund",
      teamIconUrl: "https://example.test/bvb.png",
    },
    team2: {
      teamId: 1635,
      teamName: "RB Leipzig",
      shortName: "RB Leipzig",
      teamIconUrl: "https://example.test/rbl.png",
    },
    matchResults: [],
  },
  // Past BVB away win.
  {
    matchID: 200,
    matchDateTimeUTC: "2026-04-19T13:30:00Z",
    matchIsFinished: true,
    leagueShortcut: "bl1",
    leagueName: "1. Bundesliga 2025/2026",
    team1: {
      teamId: 134,
      teamName: "Werder Bremen",
      shortName: "Bremen",
      teamIconUrl: "https://example.test/svw.png",
    },
    team2: {
      teamId: BVB_TEAM_ID,
      teamName: "Borussia Dortmund",
      shortName: "Dortmund",
      teamIconUrl: "https://example.test/bvb.png",
    },
    matchResults: [
      { resultTypeID: 1, resultName: "Halbzeit", pointsTeam1: 0, pointsTeam2: 1 },
      { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 1, pointsTeam2: 2 },
    ],
  },
  // Past BVB home draw.
  {
    matchID: 201,
    matchDateTimeUTC: "2026-04-12T16:30:00Z",
    matchIsFinished: true,
    leagueShortcut: "bl1",
    leagueName: "1. Bundesliga 2025/2026",
    team1: {
      teamId: BVB_TEAM_ID,
      teamName: "Borussia Dortmund",
      shortName: "Dortmund",
      teamIconUrl: "https://example.test/bvb.png",
    },
    team2: {
      teamId: 40,
      teamName: "FC Bayern München",
      shortName: "Bayern",
      teamIconUrl: "https://example.test/fcb.png",
    },
    matchResults: [
      { resultTypeID: 1, resultName: "Halbzeit", pointsTeam1: 0, pointsTeam2: 1 },
      { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 1, pointsTeam2: 1 },
    ],
  },
  // A non-BVB Bundesliga match — must be filtered out.
  {
    matchID: 202,
    matchDateTimeUTC: "2026-04-12T16:30:00Z",
    matchIsFinished: true,
    leagueShortcut: "bl1",
    leagueName: "1. Bundesliga 2025/2026",
    team1: { teamId: 40, teamName: "FC Bayern München", shortName: "Bayern" },
    team2: { teamId: 9, teamName: "Bayer 04 Leverkusen", shortName: "Leverkusen" },
    matchResults: [
      { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 2, pointsTeam2: 2 },
    ],
  },
];

const FAKE_DFB_MATCHES = [
  // BVB DFB-Pokal win.
  {
    matchID: 300,
    matchDateTimeUTC: "2026-04-02T19:00:00Z",
    matchIsFinished: true,
    leagueShortcut: "dfb",
    leagueName: "DFB-Pokal 2025/2026",
    team1: {
      teamId: BVB_TEAM_ID,
      teamName: "Borussia Dortmund",
      shortName: "Dortmund",
      teamIconUrl: "https://example.test/bvb.png",
    },
    team2: {
      teamId: 1635,
      teamName: "RB Leipzig",
      shortName: "RB Leipzig",
      teamIconUrl: "https://example.test/rbl.png",
    },
    matchResults: [
      { resultTypeID: 1, resultName: "Halbzeit", pointsTeam1: 1, pointsTeam2: 0 },
      { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 3, pointsTeam2: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------

function urlMatcher(req: Parameters<typeof globalThis.fetch>[0]): string {
  return typeof req === "string" ? req : (req as URL | Request).toString();
}

function installFetchMock(
  responder: (url: string) => Response | Promise<Response>,
): ReturnType<typeof vi.fn> {
  const spy = vi.fn(async (input: Parameters<typeof globalThis.fetch>[0]) =>
    responder(urlMatcher(input)),
  );
  globalThis.fetch = spy as unknown as typeof globalThis.fetch;
  return spy;
}

beforeEach(() => {
  // Silence expected error logs for the failure-path tests.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
  vi.restoreAllMocks();
});

describe("getBvbFeed — happy path", () => {
  it("maps standings, fixtures, and results from a successful OpenLigaDB response", async () => {
    installFetchMock((url) => {
      if (url.includes("/getbltable/")) return jsonResponse(FAKE_BL_TABLE);
      if (url.includes(`/getmatchdata/${BUNDESLIGA_LEAGUE}/`))
        return jsonResponse(FAKE_BL_MATCHES);
      if (url.includes(`/getmatchdata/${DFB_POKAL_LEAGUE}/`))
        return jsonResponse(FAKE_DFB_MATCHES);
      throw new Error(`unexpected url: ${url}`);
    });

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    // Standings: all 6 mock teams, ordered by points desc, BVB present and TLA-derived.
    expect(feed.standings.length).toBe(6);
    expect(feed.standings[0]?.teamName).toBe("FC Bayern München");
    expect(feed.standings[0]?.position).toBe(1);
    const bvb = feed.standings.find((r) => r.teamId === BVB_TEAM_ID);
    expect(bvb).toBeDefined();
    expect(bvb?.position).toBe(2);
    expect(bvb?.points).toBe(23);
    expect(bvb?.teamTla).toBe("BVB");
    expect(bvb?.crest).toBe("https://example.test/bvb.png");

    // Fixtures: only the future BVB BL match (filtered + capped at 5).
    expect(feed.fixtures).toHaveLength(1);
    expect(feed.fixtures[0]?.opponent).toBe("RB Leipzig");
    expect(feed.fixtures[0]?.isHome).toBe(true);
    expect(feed.fixtures[0]?.competition).toBe("BL1");
    expect(feed.fixtures[0]?.status).toBe("SCHEDULED");

    // Results: BVB only, newest-first. The non-BVB BL match must NOT appear.
    expect(feed.results).toHaveLength(3);
    expect(feed.results[0]?.utcDate.startsWith("2026-04-19")).toBe(true);
    expect(feed.results[0]?.outcome).toBe("W");
    expect(feed.results[0]?.bvbScore).toBe(2);
    expect(feed.results[0]?.opponentScore).toBe(1);
    expect(feed.results[1]?.outcome).toBe("D");
    expect(feed.results[2]?.competition).toBe("DFB");
    expect(feed.results[2]?.opponent).toBe("RB Leipzig");
  });

  it("requests with next.revalidate = 3600 (1-hour ISR window)", async () => {
    type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
    const fetchSpy = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse([]));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    await getBvbFeed();

    expect(fetchSpy).toHaveBeenCalled();
    for (const call of fetchSpy.mock.calls) {
      const init = call[1] as
        | (RequestInit & { next?: { revalidate?: number } })
        | undefined;
      expect(init?.next?.revalidate).toBe(3600);
    }
  });

  it("does not require any auth header (OpenLigaDB is keyless)", async () => {
    type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
    const fetchSpy = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse([]));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    await getBvbFeed();

    for (const call of fetchSpy.mock.calls) {
      const init = call[1];
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers["X-Auth-Token"]).toBeUndefined();
      expect(headers["Authorization"]).toBeUndefined();
    }
  });

  it("hits the three documented OpenLigaDB endpoints with the current season", async () => {
    const fetchSpy = installFetchMock(() => jsonResponse([]));

    await getBvbFeed();

    const calledUrls = fetchSpy.mock.calls.map((c) => c[0] as string);
    const season = getCurrentSeasonStartYear();
    expect(calledUrls.some((u) => u.includes(`/getbltable/bl1/${season}`))).toBe(true);
    expect(calledUrls.some((u) => u.includes(`/getmatchdata/bl1/${season}`))).toBe(true);
    expect(calledUrls.some((u) => u.includes(`/getmatchdata/dfb/${season}`))).toBe(true);
  });
});

describe("getBvbFeed — error and degraded paths", () => {
  it("returns an empty feed (no sample data) when every upstream call fails", async () => {
    installFetchMock(
      () => new Response("nope", { status: 500, statusText: "Server Error" }),
    );

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings).toEqual([]);
    expect(feed.fixtures).toEqual([]);
    expect(feed.results).toEqual([]);
  });

  it("returns an empty feed when fetch throws (network failure)", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings).toEqual([]);
    expect(feed.fixtures).toEqual([]);
    expect(feed.results).toEqual([]);
  });

  it("tolerates partial failure — keeps successful tabs, empties failing ones", async () => {
    installFetchMock((url) => {
      if (url.includes("/getbltable/")) return jsonResponse(FAKE_BL_TABLE);
      if (url.includes(`/getmatchdata/${BUNDESLIGA_LEAGUE}/`))
        return new Response("rate limited", { status: 429, statusText: "Too Many Requests" });
      if (url.includes(`/getmatchdata/${DFB_POKAL_LEAGUE}/`))
        return jsonResponse(FAKE_DFB_MATCHES);
      throw new Error(`unexpected url: ${url}`);
    });

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings.length).toBeGreaterThan(0);
    // Bundesliga match feed failed → no scheduled BL fixtures.
    expect(feed.fixtures).toEqual([]);
    // DFB-Pokal match still returns the BVB win.
    expect(feed.results).toHaveLength(1);
    expect(feed.results[0]?.competition).toBe("DFB");
  });

  it("returns an empty feed when the upstream JSON is malformed (non-array body)", async () => {
    installFetchMock(() =>
      jsonResponse({ not: "the array we expected" }),
    );

    const feed = await getBvbFeed();

    expect(feed.isMock).toBe(false);
    expect(feed.standings).toEqual([]);
    expect(feed.fixtures).toEqual([]);
    expect(feed.results).toEqual([]);
  });

  it("ignores match rows missing matchID or matchDateTimeUTC", async () => {
    installFetchMock((url) => {
      if (url.includes("/getbltable/")) return jsonResponse([]);
      if (url.includes(`/getmatchdata/${BUNDESLIGA_LEAGUE}/`))
        return jsonResponse([
          // missing matchID
          {
            matchDateTimeUTC: "2099-01-01T00:00:00Z",
            matchIsFinished: false,
            team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
            team2: { teamId: 9, teamName: "Bayer Leverkusen" },
          },
          // missing matchDateTimeUTC
          {
            matchID: 999,
            matchIsFinished: false,
            team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
            team2: { teamId: 9, teamName: "Bayer Leverkusen" },
          },
        ]);
      if (url.includes(`/getmatchdata/${DFB_POKAL_LEAGUE}/`)) return jsonResponse([]);
      throw new Error(`unexpected url: ${url}`);
    });

    const feed = await getBvbFeed();

    expect(feed.fixtures).toEqual([]);
    expect(feed.results).toEqual([]);
  });
});

describe("__test__ helpers", () => {
  it("leagueShortcutToCompetition normalises bl1/dfb/cl/ucl + falls back to OTHER", () => {
    expect(__test__.leagueShortcutToCompetition("bl1")).toBe("BL1");
    expect(__test__.leagueShortcutToCompetition("BL1")).toBe("BL1");
    expect(__test__.leagueShortcutToCompetition("dfb")).toBe("DFB");
    expect(__test__.leagueShortcutToCompetition("cl")).toBe("UCL");
    expect(__test__.leagueShortcutToCompetition("ucl")).toBe("UCL");
    expect(__test__.leagueShortcutToCompetition("ucl2024")).toBe("UCL");
    expect(__test__.leagueShortcutToCompetition("bl2")).toBe("OTHER");
    expect(__test__.leagueShortcutToCompetition(undefined)).toBe("OTHER");
    expect(__test__.leagueShortcutToCompetition(null)).toBe("OTHER");
  });

  it("competitionDisplayName returns canonical names and OTHER passthrough", () => {
    expect(__test__.competitionDisplayName("BL1")).toBe("Bundesliga");
    expect(__test__.competitionDisplayName("DFB")).toBe("DFB-Pokal");
    expect(__test__.competitionDisplayName("UCL")).toBe("UEFA Champions League");
    expect(__test__.competitionDisplayName("OTHER", "Friendly")).toBe("Friendly");
    expect(__test__.competitionDisplayName("OTHER", null)).toBe("Other");
  });

  it("isBvbTeam matches by id first, then by name fallback", () => {
    expect(__test__.isBvbTeam({ teamId: BVB_TEAM_ID })).toBe(true);
    expect(__test__.isBvbTeam({ teamId: 999, teamName: "Borussia Dortmund" })).toBe(true);
    expect(__test__.isBvbTeam({ teamId: 999, teamName: "BVB" })).toBe(true);
    expect(__test__.isBvbTeam({ teamId: 999, teamName: "FC Bayern" })).toBe(false);
    expect(__test__.isBvbTeam(null)).toBe(false);
    expect(__test__.isBvbTeam(undefined)).toBe(false);
  });

  it("deriveTla maps Bundesliga clubs and falls back to first letters", () => {
    expect(__test__.deriveTla("Borussia Dortmund")).toBe("BVB");
    expect(__test__.deriveTla("FC Bayern München")).toBe("FCB");
    expect(__test__.deriveTla("Bayer 04 Leverkusen")).toBe("B04");
    expect(__test__.deriveTla("RB Leipzig")).toBe("RBL");
    expect(__test__.deriveTla("Hamburger SV")).toBe("HSV");
    // Falls back to a heuristic for unmapped names.
    expect(__test__.deriveTla("SV Sandhausen", "Sandhausen")).toBe("SAN");
    expect(__test__.deriveTla(null, null)).toBe(null);
  });

  it("toResult assigns W/D/L correctly from BVB's perspective", () => {
    const win = __test__.toResult({
      matchID: 1,
      matchDateTimeUTC: "2026-04-01T18:00:00Z",
      matchIsFinished: true,
      leagueShortcut: "bl1",
      team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
      team2: { teamId: 999, teamName: "Other" },
      matchResults: [
        { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 3, pointsTeam2: 0 },
      ],
    });
    expect(win?.outcome).toBe("W");
    expect(win?.bvbScore).toBe(3);

    const loss = __test__.toResult({
      matchID: 2,
      matchDateTimeUTC: "2026-04-01T18:00:00Z",
      matchIsFinished: true,
      leagueShortcut: "bl1",
      team1: { teamId: 999, teamName: "Other" },
      team2: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
      matchResults: [
        { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 2, pointsTeam2: 1 },
      ],
    });
    expect(loss?.outcome).toBe("L");
    expect(loss?.bvbScore).toBe(1);

    const draw = __test__.toResult({
      matchID: 3,
      matchDateTimeUTC: "2026-04-01T18:00:00Z",
      matchIsFinished: true,
      leagueShortcut: "bl1",
      team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
      team2: { teamId: 999, teamName: "Other" },
      matchResults: [
        { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 1, pointsTeam2: 1 },
      ],
    });
    expect(draw?.outcome).toBe("D");

    const noScore = __test__.toResult({
      matchID: 4,
      matchDateTimeUTC: "2026-04-01T18:00:00Z",
      matchIsFinished: false,
      leagueShortcut: "bl1",
      team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
      team2: { teamId: 999, teamName: "Other" },
      matchResults: [],
    });
    expect(noScore?.outcome).toBe(null);
    expect(noScore?.bvbScore).toBe(null);
  });

  it("toFixture flips home/away based on BVB_TEAM_ID", () => {
    const home = __test__.toFixture({
      matchID: 10,
      matchDateTimeUTC: "2099-05-01T13:00:00Z",
      matchIsFinished: false,
      leagueShortcut: "bl1",
      leagueName: "Bundesliga",
      team1: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
      team2: { teamId: 999, teamName: "Other" },
    });
    expect(home?.isHome).toBe(true);
    expect(home?.opponent).toBe("Other");

    const away = __test__.toFixture({
      matchID: 11,
      matchDateTimeUTC: "2099-05-08T13:00:00Z",
      matchIsFinished: false,
      leagueShortcut: "bl1",
      leagueName: "Bundesliga",
      team1: { teamId: 999, teamName: "Other" },
      team2: { teamId: BVB_TEAM_ID, teamName: "Borussia Dortmund" },
    });
    expect(away?.isHome).toBe(false);
    expect(away?.opponent).toBe("Other");
  });

  it("finalScore prefers resultTypeID === 2 over halftime entry", () => {
    const score = __test__.finalScore({
      matchResults: [
        { resultTypeID: 1, resultName: "Halbzeit", pointsTeam1: 0, pointsTeam2: 1 },
        { resultTypeID: 2, resultName: "Endergebnis", pointsTeam1: 3, pointsTeam2: 1 },
      ],
    });
    expect(score).toEqual({ home: 3, away: 1 });

    const empty = __test__.finalScore({ matchResults: [] });
    expect(empty).toEqual({ home: null, away: null });
  });

  it("getCurrentSeasonStartYear flips at 1 July", () => {
    expect(__test__.getCurrentSeasonStartYear(new Date("2026-04-27T12:00:00Z"))).toBe(2025);
    expect(__test__.getCurrentSeasonStartYear(new Date("2026-06-30T23:59:59Z"))).toBe(2025);
    expect(__test__.getCurrentSeasonStartYear(new Date("2026-07-01T00:00:00Z"))).toBe(2026);
    expect(__test__.getCurrentSeasonStartYear(new Date("2026-12-31T23:59:59Z"))).toBe(2026);
  });

  it("EMPTY_FEED is the failsafe (no rows, isMock false)", () => {
    expect(__test__.EMPTY_FEED.standings).toEqual([]);
    expect(__test__.EMPTY_FEED.fixtures).toEqual([]);
    expect(__test__.EMPTY_FEED.results).toEqual([]);
    expect(__test__.EMPTY_FEED.isMock).toBe(false);
  });
});
