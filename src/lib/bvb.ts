import "server-only";

/**
 * Borussia Dortmund feed for /personal.
 *
 * Data source: https://www.football-data.org/ (v4 REST API).
 *   - Free tier covers Bundesliga (competition code BL1, id 2002) and a
 *     fistful of other top-flight European leagues.
 *   - Free-tier rate limit: 10 requests / minute. We cache for 1 hour with
 *     `next: { revalidate: 3600 }` so a personal portfolio nowhere near
 *     trips it.
 *   - Auth: single header `X-Auth-Token: <key>`. No CORS-relevant client
 *     calls — every fetch here runs server-side.
 *   - Borussia Dortmund team id: 4 (TLA "BVB"). Stable since v4.
 *
 * Why this API:
 *   - Free, generous quota, no RapidAPI middleman.
 *   - Standings + team matches subresource cover all three tabs in one
 *     library, two endpoints.
 *   - Crest URLs ship with team payloads — no separate logo fetch.
 *
 * Env vars:
 *   - BVB_API_TOKEN — secret server-side token from football-data.org.
 *     Missing or empty → we automatically fall back to mock data with a
 *     once-per-boot warning. Page never breaks.
 *   - BVB_USE_MOCK=1 — explicit override to force mock data even when a
 *     token is set. Useful for local dev without burning quota and for
 *     CI/Playwright where the spec must be deterministic.
 */

export const BUNDESLIGA_CODE = "BL1";
export const BVB_TEAM_ID = 4;

export type Competition = "BL1" | "DFB" | "UCL" | "OTHER";

export type StandingRow = {
  position: number;
  teamId: number;
  teamName: string;
  teamShortName: string | null;
  teamTla: string | null;
  crest: string | null;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type Fixture = {
  id: number;
  utcDate: string;
  competition: Competition;
  competitionName: string;
  opponent: string;
  opponentTla: string | null;
  isHome: boolean;
  status: string;
};

export type Result = {
  id: number;
  utcDate: string;
  competition: Competition;
  competitionName: string;
  opponent: string;
  opponentTla: string | null;
  isHome: boolean;
  bvbScore: number | null;
  opponentScore: number | null;
  outcome: "W" | "D" | "L" | null;
};

export type BvbFeedData = {
  standings: StandingRow[];
  fixtures: Fixture[];
  results: Result[];
  isMock: boolean;
};

const API_BASE = "https://api.football-data.org/v4";

let warnedNoToken = false;

function shouldUseMock(): boolean {
  if (process.env.BVB_USE_MOCK === "1") return true;
  const token = process.env.BVB_API_TOKEN;
  if (!token || token.trim() === "") {
    if (!warnedNoToken) {
      console.warn(
        "[bvb] BVB_API_TOKEN not set — falling back to mock data. Set BVB_API_TOKEN in Vercel to enable the live feed.",
      );
      warnedNoToken = true;
    }
    return true;
  }
  return false;
}

function mapCompetitionCode(code: string | undefined | null): Competition {
  if (code === "BL1") return "BL1";
  if (code === "DFB") return "DFB";
  if (code === "CL" || code === "UCL") return "UCL";
  return "OTHER";
}

function competitionDisplayName(c: Competition, raw?: string | null): string {
  switch (c) {
    case "BL1":
      return "Bundesliga";
    case "DFB":
      return "DFB-Pokal";
    case "UCL":
      return "UEFA Champions League";
    default:
      return raw ?? "Other";
  }
}

type ApiTeam = {
  id?: number;
  name?: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

type ApiStandingRow = {
  position: number;
  team: ApiTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type ApiStandingsResponse = {
  standings?: Array<{
    type?: string;
    table?: ApiStandingRow[];
  }>;
};

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  competition?: { code?: string; name?: string };
  homeTeam?: ApiTeam;
  awayTeam?: ApiTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
  };
};

type ApiMatchesResponse = {
  matches?: ApiMatch[];
};

async function apiFetch<T>(path: string): Promise<T | null> {
  const token = process.env.BVB_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "X-Auth-Token": token },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error(`[bvb] ${path} ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[bvb] fetch failed for ${path}`, e);
    return null;
  }
}

function toStandingRow(r: ApiStandingRow): StandingRow {
  return {
    position: r.position,
    teamId: r.team?.id ?? 0,
    teamName: r.team?.name ?? "Unknown",
    teamShortName: r.team?.shortName ?? null,
    teamTla: r.team?.tla ?? null,
    crest: r.team?.crest ?? null,
    playedGames: r.playedGames,
    won: r.won,
    draw: r.draw,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDifference: r.goalDifference,
    points: r.points,
  };
}

function toFixture(m: ApiMatch): Fixture {
  const isHome = m.homeTeam?.id === BVB_TEAM_ID;
  const opp = isHome ? m.awayTeam : m.homeTeam;
  const code = mapCompetitionCode(m.competition?.code);
  return {
    id: m.id,
    utcDate: m.utcDate,
    competition: code,
    competitionName: competitionDisplayName(code, m.competition?.name),
    opponent: opp?.name ?? "TBD",
    opponentTla: opp?.tla ?? null,
    isHome,
    status: m.status,
  };
}

function toResult(m: ApiMatch): Result {
  const isHome = m.homeTeam?.id === BVB_TEAM_ID;
  const opp = isHome ? m.awayTeam : m.homeTeam;
  const code = mapCompetitionCode(m.competition?.code);
  const home = m.score?.fullTime?.home ?? null;
  const away = m.score?.fullTime?.away ?? null;
  const bvbScore = isHome ? home : away;
  const oppScore = isHome ? away : home;
  let outcome: Result["outcome"] = null;
  if (bvbScore != null && oppScore != null) {
    outcome = bvbScore > oppScore ? "W" : bvbScore < oppScore ? "L" : "D";
  }
  return {
    id: m.id,
    utcDate: m.utcDate,
    competition: code,
    competitionName: competitionDisplayName(code, m.competition?.name),
    opponent: opp?.name ?? "Unknown",
    opponentTla: opp?.tla ?? null,
    isHome,
    bvbScore,
    opponentScore: oppScore,
    outcome,
  };
}

export async function getBvbFeed(): Promise<BvbFeedData> {
  if (shouldUseMock()) {
    return { ...MOCK_FEED, isMock: true };
  }
  const [standingsRes, fixturesRes, resultsRes] = await Promise.all([
    apiFetch<ApiStandingsResponse>(`/competitions/${BUNDESLIGA_CODE}/standings`),
    apiFetch<ApiMatchesResponse>(
      `/teams/${BVB_TEAM_ID}/matches?status=SCHEDULED&limit=5`,
    ),
    apiFetch<ApiMatchesResponse>(
      `/teams/${BVB_TEAM_ID}/matches?status=FINISHED&limit=5`,
    ),
  ]);

  // If every call failed (e.g. token revoked, network issue) fall back to
  // mock so /personal still renders. Partial failures are tolerated:
  // each tab independently shows empty state.
  const allFailed = !standingsRes && !fixturesRes && !resultsRes;
  if (allFailed) {
    return { ...MOCK_FEED, isMock: true };
  }

  const totalTable =
    standingsRes?.standings?.find((s) => s.type === "TOTAL")?.table ??
    standingsRes?.standings?.[0]?.table ??
    [];

  const fixtures = (fixturesRes?.matches ?? []).map(toFixture);
  // API returns FINISHED matches oldest-first by default; we want newest-first.
  const results = (resultsRes?.matches ?? [])
    .map(toResult)
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 5);

  return {
    standings: totalTable.map(toStandingRow),
    fixtures,
    results,
    isMock: false,
  };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
// Used when BVB_API_TOKEN is missing or BVB_USE_MOCK=1. Numbers are
// deliberately plausible (Bundesliga 2025/26 mid-table snapshot) but
// not real — they exist so the section renders something coherent in
// dev, in CI, and if the live API ever has a wobble.

const MOCK_STANDINGS: StandingRow[] = [
  ["Bayer 04 Leverkusen", "Leverkusen", "B04", 3],
  ["FC Bayern München", "Bayern", "FCB", 5],
  ["Borussia Dortmund", "Dortmund", "BVB", BVB_TEAM_ID],
  ["RB Leipzig", "RB Leipzig", "RBL", 721],
  ["VfB Stuttgart", "Stuttgart", "VFB", 10],
  ["Eintracht Frankfurt", "Frankfurt", "SGE", 19],
  ["TSG Hoffenheim", "Hoffenheim", "TSG", 2],
  ["SC Freiburg", "Freiburg", "SCF", 17],
  ["1. FC Heidenheim 1846", "Heidenheim", "HDH", 44],
  ["Werder Bremen", "Bremen", "SVW", 12],
  ["FC Augsburg", "Augsburg", "FCA", 16],
  ["Borussia Mönchengladbach", "Gladbach", "BMG", 18],
  ["1. FSV Mainz 05", "Mainz", "M05", 15],
  ["VfL Wolfsburg", "Wolfsburg", "WOB", 11],
  ["1. FC Union Berlin", "Union Berlin", "FCU", 28],
  ["FC St. Pauli 1910", "St. Pauli", "STP", 20],
  ["1. FC Köln", "Köln", "KOE", 1],
  ["VfL Bochum 1848", "Bochum", "BOC", 36],
].map(([name, short, tla, id], i) => {
  const played = 27 + (i % 2);
  const won = Math.max(0, 18 - i);
  const draw = Math.max(0, Math.min(8, 6 - Math.floor(i / 4)));
  const lost = played - won - draw;
  const goalsFor = 65 - i * 3;
  const goalsAgainst = 25 + i * 3;
  return {
    position: i + 1,
    teamId: id as number,
    teamName: name as string,
    teamShortName: short as string,
    teamTla: tla as string,
    crest: null,
    playedGames: played,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: won * 3 + draw,
  };
});

const MOCK_FIXTURES: Fixture[] = [
  {
    id: 9001,
    utcDate: "2026-05-02T13:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "RB Leipzig",
    opponentTla: "RBL",
    isHome: true,
    status: "SCHEDULED",
  },
  {
    id: 9002,
    utcDate: "2026-05-09T16:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "Bayer 04 Leverkusen",
    opponentTla: "B04",
    isHome: false,
    status: "SCHEDULED",
  },
  {
    id: 9003,
    utcDate: "2026-05-16T13:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "1. FSV Mainz 05",
    opponentTla: "M05",
    isHome: true,
    status: "SCHEDULED",
  },
];

const MOCK_RESULTS: Result[] = [
  {
    id: 8001,
    utcDate: "2026-04-19T13:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "Werder Bremen",
    opponentTla: "SVW",
    isHome: false,
    bvbScore: 2,
    opponentScore: 1,
    outcome: "W",
  },
  {
    id: 8002,
    utcDate: "2026-04-12T16:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "FC Bayern München",
    opponentTla: "FCB",
    isHome: true,
    bvbScore: 1,
    opponentScore: 1,
    outcome: "D",
  },
  {
    id: 8003,
    utcDate: "2026-04-05T13:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "VfB Stuttgart",
    opponentTla: "VFB",
    isHome: false,
    bvbScore: 0,
    opponentScore: 2,
    outcome: "L",
  },
  {
    id: 8004,
    utcDate: "2026-04-02T19:00:00Z",
    competition: "DFB",
    competitionName: "DFB-Pokal",
    opponent: "RB Leipzig",
    opponentTla: "RBL",
    isHome: true,
    bvbScore: 3,
    opponentScore: 1,
    outcome: "W",
  },
  {
    id: 8005,
    utcDate: "2026-03-29T14:30:00Z",
    competition: "BL1",
    competitionName: "Bundesliga",
    opponent: "Eintracht Frankfurt",
    opponentTla: "SGE",
    isHome: true,
    bvbScore: 2,
    opponentScore: 0,
    outcome: "W",
  },
];

const MOCK_FEED: Omit<BvbFeedData, "isMock"> = {
  standings: MOCK_STANDINGS,
  fixtures: MOCK_FIXTURES,
  results: MOCK_RESULTS,
};

export const __test__ = {
  toStandingRow,
  toFixture,
  toResult,
  mapCompetitionCode,
  competitionDisplayName,
  MOCK_FEED,
};
