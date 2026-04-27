import "server-only";

/**
 * Borussia Dortmund live feed for /personal.
 *
 * Data source: OpenLigaDB (https://www.openligadb.de/).
 *   - Free, public, no API key required, no rate-limit headers, no
 *     RapidAPI middleman. Specifically built for German football, so
 *     Bundesliga (`bl1`) and DFB-Pokal (`dfb`) are first-class citizens.
 *   - We hit three endpoints:
 *       GET /getbltable/bl1/{season}        Bundesliga table
 *       GET /getmatchdata/bl1/{season}      All Bundesliga matches (season)
 *       GET /getmatchdata/dfb/{season}      All DFB-Pokal matches (season)
 *     and filter the match arrays down to BVB on our side. OpenLigaDB does
 *     not expose a "by team" subresource, but the season payload is small
 *     enough (a few hundred rows) that filtering server-side after a
 *     1-hour ISR fetch is essentially free.
 *   - Auth: none. CORS-irrelevant — every fetch here runs server-side via
 *     Next.js's data-fetching layer.
 *   - Caching: `next: { revalidate: 3600 }` (1 hour). OpenLigaDB has no
 *     published quota, but we are courteous regardless.
 *
 * Why this API:
 *   - User explicitly asked for live, Flashscore-style coverage with no
 *     sample / seed data fallback. OpenLigaDB lets us do that without
 *     handing out a paid token, without a key in Vercel, and without any
 *     mock fallback. If the upstream goes down, we render an empty state.
 *   - Crest URLs ship inside the team payload (`teamIconUrl`) — no
 *     separate logo fetch.
 *
 * Borussia Dortmund team identity:
 *   - OpenLigaDB id 7 (stable). Matched by id first, then by a name allow-
 *     list as a defensive fallback in case the id ever shifts upstream.
 *
 * Env vars: none required. Pure live feed.
 */

export const BUNDESLIGA_LEAGUE = "bl1";
export const DFB_POKAL_LEAGUE = "dfb";

/**
 * OpenLigaDB's stable id for Borussia Dortmund. Verified against
 * /getavailableteams/bl1/<season>; Dortmund has been id 7 across every
 * season the API exposes.
 */
export const BVB_TEAM_ID = 7;

/** Defensive fallback when the upstream id ever drifts. */
const BVB_NAME_PATTERNS = [/borussia\s*dortmund/i, /^bvb$/i];

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
  /**
   * Always `false` for the live OpenLigaDB feed. Retained on the type so
   * existing UI (mock-data badge, e2e selectors) keep typechecking; the
   * value is never `true` in production paths.
   */
  isMock: boolean;
};

const API_BASE = "https://api.openligadb.de";

// 1-hour ISR. OpenLigaDB updates the table within minutes of full-time;
// hourly revalidation matches Eduard's editorial cadence and stays well
// within "polite usage" of a free, key-less API.
const REVALIDATE_SECONDS = 3600;

/**
 * Returns the current Bundesliga season-start year. Season convention:
 * a season that runs Aug 2025 – May 2026 is identified as 2025 by
 * OpenLigaDB. Season changeover is taken at 1 July: anything before
 * 1 July of year Y belongs to the season that started in year Y - 1.
 *
 * Exposed for tests so we can pin "now" without monkeying with `Date`.
 */
export function getCurrentSeasonStartYear(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed: Jan=0, Jul=6
  return month >= 6 ? year : year - 1;
}

// ---------------------------------------------------------------------------
// Upstream wire types (subset of what OpenLigaDB returns — we only model
// the fields we actually consume).
// ---------------------------------------------------------------------------

type ApiTeam = {
  teamId?: number;
  teamName?: string;
  shortName?: string | null;
  teamIconUrl?: string | null;
};

type ApiTableRow = {
  teamInfoId?: number;
  teamName?: string;
  shortName?: string | null;
  teamIconUrl?: string | null;
  points?: number;
  matches?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goals?: number;
  opponentGoals?: number;
  goalDiff?: number;
};

type ApiMatchResult = {
  resultTypeID?: number;
  resultName?: string;
  pointsTeam1?: number;
  pointsTeam2?: number;
};

type ApiMatch = {
  matchID?: number;
  matchDateTimeUTC?: string;
  matchIsFinished?: boolean;
  team1?: ApiTeam;
  team2?: ApiTeam;
  matchResults?: ApiMatchResult[];
  leagueShortcut?: string;
  leagueName?: string;
};

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error(`[bvb] ${path} ${res.status} ${res.statusText}`);
      return null;
    }
    const data = (await res.json()) as T;
    return data;
  } catch (e) {
    console.error(`[bvb] fetch failed for ${path}`, e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Best-effort 3-letter abbreviation for a club. OpenLigaDB does not ship
 * `tla` natively — it gives us `shortName` (e.g. "Dortmund") and the full
 * `teamName` (e.g. "Borussia Dortmund"). We hand-roll a TLA from
 * a curated table for the 18 Bundesliga clubs and fall back to an
 * uppercase-letters-of-shortName heuristic for anything else (DFB-Pokal
 * lower-league opponents).
 */
const BUNDESLIGA_TLA: Readonly<Record<string, string>> = Object.freeze({
  "FC Bayern München": "FCB",
  "Borussia Dortmund": "BVB",
  "Bayer 04 Leverkusen": "B04",
  "Bayer Leverkusen": "B04",
  "RB Leipzig": "RBL",
  "VfB Stuttgart": "VFB",
  "Eintracht Frankfurt": "SGE",
  "TSG Hoffenheim": "TSG",
  "TSG 1899 Hoffenheim": "TSG",
  "SC Freiburg": "SCF",
  "1. FC Heidenheim 1846": "FCH",
  "1. FC Heidenheim": "FCH",
  "Werder Bremen": "SVW",
  "SV Werder Bremen": "SVW",
  "FC Augsburg": "FCA",
  "Borussia Mönchengladbach": "BMG",
  "1. FSV Mainz 05": "M05",
  "VfL Wolfsburg": "WOB",
  "1. FC Union Berlin": "FCU",
  "Union Berlin": "FCU",
  "FC St. Pauli": "STP",
  "FC St. Pauli 1910": "STP",
  "1. FC Köln": "KOE",
  "VfL Bochum": "BOC",
  "VfL Bochum 1848": "BOC",
  "Hamburger SV": "HSV",
  "FC Schalke 04": "S04",
  "Hertha BSC": "BSC",
});

export function deriveTla(teamName: string | undefined | null, shortName?: string | null): string | null {
  if (!teamName && !shortName) return null;
  const name = teamName ?? "";
  const lookup = BUNDESLIGA_TLA[name];
  if (lookup) return lookup;
  const source = (shortName && shortName.length > 0 ? shortName : name).trim();
  if (!source) return null;
  // Strip leading "FC ", "1. FC ", "SV ", etc., then take first 3 letters.
  const stripped = source
    .replace(/^(\d+\.\s*)?(FC|SC|SV|VfB|VfL|TSG|TSV|FSV|RB|FSV)\s+/i, "")
    .replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (stripped.length >= 3) return stripped.slice(0, 3).toUpperCase();
  return source.slice(0, 3).toUpperCase();
}

function isBvbTeam(team: ApiTeam | undefined | null): boolean {
  if (!team) return false;
  if (team.teamId === BVB_TEAM_ID) return true;
  const name = team.teamName ?? "";
  return BVB_NAME_PATTERNS.some((re) => re.test(name));
}

export function competitionDisplayName(c: Competition, raw?: string | null): string {
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

export function leagueShortcutToCompetition(shortcut?: string | null): Competition {
  if (!shortcut) return "OTHER";
  const s = shortcut.toLowerCase();
  if (s === "bl1") return "BL1";
  if (s === "dfb") return "DFB";
  if (s === "ucl" || s === "cl" || s === "ucl2024" || s.startsWith("ucl")) return "UCL";
  return "OTHER";
}

function toStandingRow(r: ApiTableRow, position: number): StandingRow {
  const teamName = r.teamName ?? "Unknown";
  const won = r.won ?? 0;
  const draw = r.draw ?? 0;
  const lost = r.lost ?? 0;
  const goalsFor = r.goals ?? 0;
  const goalsAgainst = r.opponentGoals ?? 0;
  return {
    position,
    teamId: r.teamInfoId ?? 0,
    teamName,
    teamShortName: r.shortName ?? null,
    teamTla: deriveTla(teamName, r.shortName ?? null),
    crest: r.teamIconUrl ?? null,
    playedGames: r.matches ?? won + draw + lost,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: r.goalDiff ?? goalsFor - goalsAgainst,
    points: r.points ?? 0,
  };
}

function finalScore(m: ApiMatch): { home: number | null; away: number | null } {
  const results = m.matchResults ?? [];
  // resultTypeID === 2 is the final score; resultName "Endergebnis" backs
  // it up. If neither marker is present, fall back to the highest-numbered
  // result (OpenLigaDB orders halftime first).
  const final =
    results.find((r) => r.resultTypeID === 2) ??
    results.find((r) => r.resultName === "Endergebnis") ??
    results[results.length - 1];
  if (!final) return { home: null, away: null };
  return {
    home: typeof final.pointsTeam1 === "number" ? final.pointsTeam1 : null,
    away: typeof final.pointsTeam2 === "number" ? final.pointsTeam2 : null,
  };
}

function toFixture(m: ApiMatch): Fixture | null {
  const id = m.matchID;
  const utcDate = m.matchDateTimeUTC;
  if (typeof id !== "number" || !utcDate) return null;
  const isHome = isBvbTeam(m.team1);
  const opp = isHome ? m.team2 : m.team1;
  const code = leagueShortcutToCompetition(m.leagueShortcut);
  return {
    id,
    utcDate,
    competition: code,
    competitionName: competitionDisplayName(code, m.leagueName),
    opponent: opp?.teamName ?? "TBD",
    opponentTla: deriveTla(opp?.teamName ?? null, opp?.shortName ?? null),
    isHome,
    status: m.matchIsFinished ? "FINISHED" : "SCHEDULED",
  };
}

function toResult(m: ApiMatch): Result | null {
  const id = m.matchID;
  const utcDate = m.matchDateTimeUTC;
  if (typeof id !== "number" || !utcDate) return null;
  const isHome = isBvbTeam(m.team1);
  const opp = isHome ? m.team2 : m.team1;
  const code = leagueShortcutToCompetition(m.leagueShortcut);
  const { home, away } = finalScore(m);
  const bvbScore = isHome ? home : away;
  const oppScore = isHome ? away : home;
  let outcome: Result["outcome"] = null;
  if (bvbScore != null && oppScore != null) {
    outcome = bvbScore > oppScore ? "W" : bvbScore < oppScore ? "L" : "D";
  }
  return {
    id,
    utcDate,
    competition: code,
    competitionName: competitionDisplayName(code, m.leagueName),
    opponent: opp?.teamName ?? "Unknown",
    opponentTla: deriveTla(opp?.teamName ?? null, opp?.shortName ?? null),
    isHome,
    bvbScore,
    opponentScore: oppScore,
    outcome,
  };
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const EMPTY_FEED: BvbFeedData = {
  standings: [],
  fixtures: [],
  results: [],
  isMock: false,
};

/**
 * Fetches the live BVB feed from OpenLigaDB.
 *
 * Failure modes:
 *   - Upstream 5xx / network error / malformed JSON → that tab is empty.
 *   - All three calls fail → `EMPTY_FEED`. The component renders the
 *     "BVB live feed unavailable" empty state. No sample data, ever.
 */
export async function getBvbFeed(): Promise<BvbFeedData> {
  const season = getCurrentSeasonStartYear();

  const [tableRes, blMatchesRes, dfbMatchesRes] = await Promise.all([
    apiFetch<ApiTableRow[]>(`/getbltable/${BUNDESLIGA_LEAGUE}/${season}`),
    apiFetch<ApiMatch[]>(`/getmatchdata/${BUNDESLIGA_LEAGUE}/${season}`),
    apiFetch<ApiMatch[]>(`/getmatchdata/${DFB_POKAL_LEAGUE}/${season}`),
  ]);

  const tableRows = safeArray<ApiTableRow>(tableRes);
  const standings = tableRows
    .slice()
    // OpenLigaDB orders the response by points already, but resort defensively
    // so a flaky upstream cannot wreck the rendered position numbers.
    .sort((a, b) => {
      const pts = (b.points ?? 0) - (a.points ?? 0);
      if (pts !== 0) return pts;
      const gd = (b.goalDiff ?? 0) - (a.goalDiff ?? 0);
      if (gd !== 0) return gd;
      return (b.goals ?? 0) - (a.goals ?? 0);
    })
    .map((row, i) => toStandingRow(row, i + 1));

  const allMatches: ApiMatch[] = [
    ...safeArray<ApiMatch>(blMatchesRes).map((m) => ({
      ...m,
      leagueShortcut: m.leagueShortcut ?? BUNDESLIGA_LEAGUE,
      leagueName: m.leagueName ?? "Bundesliga",
    })),
    ...safeArray<ApiMatch>(dfbMatchesRes).map((m) => ({
      ...m,
      leagueShortcut: m.leagueShortcut ?? DFB_POKAL_LEAGUE,
      leagueName: m.leagueName ?? "DFB-Pokal",
    })),
  ];

  const bvbMatches = allMatches.filter(
    (m) => isBvbTeam(m.team1) || isBvbTeam(m.team2),
  );

  const fixtures = bvbMatches
    .filter((m) => !m.matchIsFinished)
    .map(toFixture)
    .filter((f): f is Fixture => f !== null)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 5);

  const results = bvbMatches
    .filter((m) => m.matchIsFinished === true)
    .map(toResult)
    .filter((r): r is Result => r !== null)
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 5);

  const allFailed = !tableRes && !blMatchesRes && !dfbMatchesRes;
  if (allFailed) {
    return EMPTY_FEED;
  }

  return {
    standings,
    fixtures,
    results,
    isMock: false,
  };
}

// Test-only surface: internal helpers we want to unit-test without going
// through the network. Importing __test__ outside of a test file is a
// type-level only escape hatch.
export const __test__ = {
  toStandingRow,
  toFixture,
  toResult,
  finalScore,
  isBvbTeam,
  leagueShortcutToCompetition,
  competitionDisplayName,
  deriveTla,
  getCurrentSeasonStartYear,
  EMPTY_FEED,
};
