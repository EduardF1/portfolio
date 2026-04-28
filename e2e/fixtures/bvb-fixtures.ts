/**
 * Stub OpenLigaDB JSON payloads for the BVB live-feed e2e tests.
 *
 * Why this file exists
 * --------------------
 * `src/lib/bvb.ts` calls the public OpenLigaDB API directly:
 *   - GET https://api.openligadb.de/getbltable/bl1/{season}
 *   - GET https://api.openligadb.de/getmatchdata/bl1/{season}
 *   - GET https://api.openligadb.de/getmatchdata/dfb/{season}
 * Each spec run that traverses /personal therefore makes 3 upstream calls.
 * On the new `CROSS_PLATFORM=1` matrix the BVB spec is tagged @cross and
 * runs across 9 projects → 27 live calls per nightly run, plus the same
 * burst on every PR retry. That's brittle (rate limits, upstream flakes,
 * fixture drift between runs) and rude.
 *
 * These stubs intentionally model the SUBSET of the OpenLigaDB schema that
 * `src/lib/bvb.ts` actually consumes (see `ApiTeam`, `ApiTableRow`,
 * `ApiMatch`, `ApiMatchResult` there). Anything the lib does not read has
 * been omitted to keep the fixture small and signal-rich.
 *
 * Determinism
 * -----------
 * - All match dates are pinned (no `new Date()` calls). Both the past
 *   results and the future fixtures sort cleanly through `getBvbFeed`'s
 *   internal sort + slice(0, 5) without depending on the test clock.
 * - BVB sits at position 4 in the table (Champions League slot, plausible
 *   for "early-season form, climbing"). Bayern leads, Leverkusen + Leipzig
 *   ahead. The standings highlight assertion (`tr[data-bvb]`) only needs
 *   one BVB row to exist, which it does.
 * - Crest URLs reference the live OpenLigaDB CDN. They are NOT fetched in
 *   the test (the DOM `<img>` falls back to alt="" if the network drops);
 *   the route mocks here only intercept the JSON endpoints.
 */

/**
 * Minimal subset of the OpenLigaDB table-row payload. Mirrors `ApiTableRow`
 * in `src/lib/bvb.ts` — re-declared here rather than imported because that
 * type is private to the lib and "server-only", which would break the
 * Playwright TS project that doesn't share the Next compile graph.
 */
type ApiTableRow = {
  teamInfoId: number;
  teamName: string;
  shortName: string | null;
  teamIconUrl: string | null;
  points: number;
  matches: number;
  won: number;
  draw: number;
  lost: number;
  goals: number;
  opponentGoals: number;
  goalDiff: number;
};

type ApiTeam = {
  teamId: number;
  teamName: string;
  shortName: string | null;
  teamIconUrl: string | null;
};

type ApiMatchResult = {
  resultTypeID: number;
  resultName: string;
  pointsTeam1: number;
  pointsTeam2: number;
};

type ApiMatch = {
  matchID: number;
  matchDateTimeUTC: string;
  matchIsFinished: boolean;
  team1: ApiTeam;
  team2: ApiTeam;
  matchResults: ApiMatchResult[];
  leagueShortcut: string;
  leagueName: string;
};

// Stable team identities. BVB is id 7 in OpenLigaDB; the rest match the
// real upstream ids so the fixture stays realistic if anyone scopes it
// against a live response.
const TEAM_BVB: ApiTeam = {
  teamId: 7,
  teamName: "Borussia Dortmund",
  shortName: "Dortmund",
  teamIconUrl: "https://i.imgur.com/wKQbOVe.png",
};
const TEAM_BAYERN: ApiTeam = {
  teamId: 40,
  teamName: "FC Bayern München",
  shortName: "FC Bayern",
  teamIconUrl: "https://i.imgur.com/jJEsJrj.png",
};
const TEAM_LEVERKUSEN: ApiTeam = {
  teamId: 6,
  teamName: "Bayer Leverkusen",
  shortName: "Leverkusen",
  teamIconUrl: "https://i.imgur.com/IsZJjZK.png",
};
const TEAM_LEIPZIG: ApiTeam = {
  teamId: 1635,
  teamName: "RB Leipzig",
  shortName: "RB Leipzig",
  teamIconUrl: "https://i.imgur.com/teCArMz.png",
};
const TEAM_STUTTGART: ApiTeam = {
  teamId: 16,
  teamName: "VfB Stuttgart",
  shortName: "VfB",
  teamIconUrl: "https://i.imgur.com/VPx6mQ0.png",
};
const TEAM_FRANKFURT: ApiTeam = {
  teamId: 91,
  teamName: "Eintracht Frankfurt",
  shortName: "Frankfurt",
  teamIconUrl: "https://i.imgur.com/JUVmK4O.png",
};
const TEAM_HOFFENHEIM: ApiTeam = {
  teamId: 9,
  teamName: "TSG Hoffenheim",
  shortName: "Hoffenheim",
  teamIconUrl: "https://i.imgur.com/Bk6WiVx.png",
};
const TEAM_FREIBURG: ApiTeam = {
  teamId: 112,
  teamName: "SC Freiburg",
  shortName: "Freiburg",
  teamIconUrl: "https://i.imgur.com/Tl4Yb8m.png",
};
const TEAM_HEIDENHEIM: ApiTeam = {
  teamId: 1340,
  teamName: "1. FC Heidenheim 1846",
  shortName: "Heidenheim",
  teamIconUrl: "https://i.imgur.com/Csu4OZi.png",
};
const TEAM_BREMEN: ApiTeam = {
  teamId: 134,
  teamName: "Werder Bremen",
  shortName: "Bremen",
  teamIconUrl: "https://i.imgur.com/Ge1qLlR.png",
};
const TEAM_AUGSBURG: ApiTeam = {
  teamId: 87,
  teamName: "FC Augsburg",
  shortName: "Augsburg",
  teamIconUrl: "https://i.imgur.com/uuzhsgz.png",
};
const TEAM_GLADBACH: ApiTeam = {
  teamId: 87654,
  teamName: "Borussia Mönchengladbach",
  shortName: "Gladbach",
  teamIconUrl: "https://i.imgur.com/AblIxKY.png",
};
const TEAM_MAINZ: ApiTeam = {
  teamId: 81,
  teamName: "1. FSV Mainz 05",
  shortName: "Mainz",
  teamIconUrl: "https://i.imgur.com/2Sw0r8s.png",
};
const TEAM_WOLFSBURG: ApiTeam = {
  teamId: 65,
  teamName: "VfL Wolfsburg",
  shortName: "Wolfsburg",
  teamIconUrl: "https://i.imgur.com/SXt1OFD.png",
};
const TEAM_UNION: ApiTeam = {
  teamId: 80,
  teamName: "1. FC Union Berlin",
  shortName: "Union",
  teamIconUrl: "https://i.imgur.com/J8FLP4g.png",
};
const TEAM_PAULI: ApiTeam = {
  teamId: 98,
  teamName: "FC St. Pauli",
  shortName: "St. Pauli",
  teamIconUrl: "https://i.imgur.com/rqGiJZf.png",
};
const TEAM_KOELN: ApiTeam = {
  teamId: 65324,
  teamName: "1. FC Köln",
  shortName: "Köln",
  teamIconUrl: "https://i.imgur.com/A6JbRmb.png",
};
const TEAM_BOCHUM: ApiTeam = {
  teamId: 123,
  teamName: "VfL Bochum",
  shortName: "Bochum",
  teamIconUrl: "https://i.imgur.com/gLGc1Xz.png",
};

// DFB-Pokal cup opponent (lower-league side, mirrors what the real cup
// draw produces in early rounds).
const TEAM_KAISERSLAUTERN: ApiTeam = {
  teamId: 95,
  teamName: "1. FC Kaiserslautern",
  shortName: "K'lautern",
  teamIconUrl: "https://i.imgur.com/N6vJqWj.png",
};

/**
 * Bundesliga table — 18 rows, ordered by points. BVB sits at position 4
 * (Champions-League qualification slot). The shape mirrors what
 * `https://api.openligadb.de/getbltable/bl1/2025` returns in production.
 *
 * Counts are internally consistent: matches = won + draw + lost,
 * goalDiff = goals - opponentGoals, points = won * 3 + draw.
 */
export const bundesligaTable: ApiTableRow[] = [
  {
    teamInfoId: TEAM_BAYERN.teamId,
    teamName: TEAM_BAYERN.teamName,
    shortName: TEAM_BAYERN.shortName,
    teamIconUrl: TEAM_BAYERN.teamIconUrl,
    points: 28,
    matches: 11,
    won: 9,
    draw: 1,
    lost: 1,
    goals: 32,
    opponentGoals: 9,
    goalDiff: 23,
  },
  {
    teamInfoId: TEAM_LEVERKUSEN.teamId,
    teamName: TEAM_LEVERKUSEN.teamName,
    shortName: TEAM_LEVERKUSEN.shortName,
    teamIconUrl: TEAM_LEVERKUSEN.teamIconUrl,
    points: 25,
    matches: 11,
    won: 8,
    draw: 1,
    lost: 2,
    goals: 26,
    opponentGoals: 12,
    goalDiff: 14,
  },
  {
    teamInfoId: TEAM_LEIPZIG.teamId,
    teamName: TEAM_LEIPZIG.teamName,
    shortName: TEAM_LEIPZIG.shortName,
    teamIconUrl: TEAM_LEIPZIG.teamIconUrl,
    points: 22,
    matches: 11,
    won: 7,
    draw: 1,
    lost: 3,
    goals: 21,
    opponentGoals: 13,
    goalDiff: 8,
  },
  {
    // BVB — the highlight row the spec asserts on (`tr[data-bvb]`).
    teamInfoId: TEAM_BVB.teamId,
    teamName: TEAM_BVB.teamName,
    shortName: TEAM_BVB.shortName,
    teamIconUrl: TEAM_BVB.teamIconUrl,
    points: 21,
    matches: 11,
    won: 6,
    draw: 3,
    lost: 2,
    goals: 22,
    opponentGoals: 12,
    goalDiff: 10,
  },
  {
    teamInfoId: TEAM_STUTTGART.teamId,
    teamName: TEAM_STUTTGART.teamName,
    shortName: TEAM_STUTTGART.shortName,
    teamIconUrl: TEAM_STUTTGART.teamIconUrl,
    points: 19,
    matches: 11,
    won: 6,
    draw: 1,
    lost: 4,
    goals: 18,
    opponentGoals: 14,
    goalDiff: 4,
  },
  {
    teamInfoId: TEAM_FRANKFURT.teamId,
    teamName: TEAM_FRANKFURT.teamName,
    shortName: TEAM_FRANKFURT.shortName,
    teamIconUrl: TEAM_FRANKFURT.teamIconUrl,
    points: 18,
    matches: 11,
    won: 5,
    draw: 3,
    lost: 3,
    goals: 17,
    opponentGoals: 13,
    goalDiff: 4,
  },
  {
    teamInfoId: TEAM_HOFFENHEIM.teamId,
    teamName: TEAM_HOFFENHEIM.teamName,
    shortName: TEAM_HOFFENHEIM.shortName,
    teamIconUrl: TEAM_HOFFENHEIM.teamIconUrl,
    points: 16,
    matches: 11,
    won: 4,
    draw: 4,
    lost: 3,
    goals: 16,
    opponentGoals: 15,
    goalDiff: 1,
  },
  {
    teamInfoId: TEAM_FREIBURG.teamId,
    teamName: TEAM_FREIBURG.teamName,
    shortName: TEAM_FREIBURG.shortName,
    teamIconUrl: TEAM_FREIBURG.teamIconUrl,
    points: 15,
    matches: 11,
    won: 4,
    draw: 3,
    lost: 4,
    goals: 14,
    opponentGoals: 14,
    goalDiff: 0,
  },
  {
    teamInfoId: TEAM_GLADBACH.teamId,
    teamName: TEAM_GLADBACH.teamName,
    shortName: TEAM_GLADBACH.shortName,
    teamIconUrl: TEAM_GLADBACH.teamIconUrl,
    points: 14,
    matches: 11,
    won: 4,
    draw: 2,
    lost: 5,
    goals: 15,
    opponentGoals: 17,
    goalDiff: -2,
  },
  {
    teamInfoId: TEAM_MAINZ.teamId,
    teamName: TEAM_MAINZ.teamName,
    shortName: TEAM_MAINZ.shortName,
    teamIconUrl: TEAM_MAINZ.teamIconUrl,
    points: 14,
    matches: 11,
    won: 3,
    draw: 5,
    lost: 3,
    goals: 13,
    opponentGoals: 13,
    goalDiff: 0,
  },
  {
    teamInfoId: TEAM_WOLFSBURG.teamId,
    teamName: TEAM_WOLFSBURG.teamName,
    shortName: TEAM_WOLFSBURG.shortName,
    teamIconUrl: TEAM_WOLFSBURG.teamIconUrl,
    points: 13,
    matches: 11,
    won: 3,
    draw: 4,
    lost: 4,
    goals: 13,
    opponentGoals: 15,
    goalDiff: -2,
  },
  {
    teamInfoId: TEAM_BREMEN.teamId,
    teamName: TEAM_BREMEN.teamName,
    shortName: TEAM_BREMEN.shortName,
    teamIconUrl: TEAM_BREMEN.teamIconUrl,
    points: 12,
    matches: 11,
    won: 3,
    draw: 3,
    lost: 5,
    goals: 14,
    opponentGoals: 18,
    goalDiff: -4,
  },
  {
    teamInfoId: TEAM_AUGSBURG.teamId,
    teamName: TEAM_AUGSBURG.teamName,
    shortName: TEAM_AUGSBURG.shortName,
    teamIconUrl: TEAM_AUGSBURG.teamIconUrl,
    points: 11,
    matches: 11,
    won: 3,
    draw: 2,
    lost: 6,
    goals: 11,
    opponentGoals: 17,
    goalDiff: -6,
  },
  {
    teamInfoId: TEAM_UNION.teamId,
    teamName: TEAM_UNION.teamName,
    shortName: TEAM_UNION.shortName,
    teamIconUrl: TEAM_UNION.teamIconUrl,
    points: 10,
    matches: 11,
    won: 2,
    draw: 4,
    lost: 5,
    goals: 9,
    opponentGoals: 14,
    goalDiff: -5,
  },
  {
    teamInfoId: TEAM_PAULI.teamId,
    teamName: TEAM_PAULI.teamName,
    shortName: TEAM_PAULI.shortName,
    teamIconUrl: TEAM_PAULI.teamIconUrl,
    points: 9,
    matches: 11,
    won: 2,
    draw: 3,
    lost: 6,
    goals: 8,
    opponentGoals: 16,
    goalDiff: -8,
  },
  {
    teamInfoId: TEAM_HEIDENHEIM.teamId,
    teamName: TEAM_HEIDENHEIM.teamName,
    shortName: TEAM_HEIDENHEIM.shortName,
    teamIconUrl: TEAM_HEIDENHEIM.teamIconUrl,
    points: 8,
    matches: 11,
    won: 2,
    draw: 2,
    lost: 7,
    goals: 10,
    opponentGoals: 19,
    goalDiff: -9,
  },
  {
    teamInfoId: TEAM_KOELN.teamId,
    teamName: TEAM_KOELN.teamName,
    shortName: TEAM_KOELN.shortName,
    teamIconUrl: TEAM_KOELN.teamIconUrl,
    points: 7,
    matches: 11,
    won: 1,
    draw: 4,
    lost: 6,
    goals: 9,
    opponentGoals: 18,
    goalDiff: -9,
  },
  {
    teamInfoId: TEAM_BOCHUM.teamId,
    teamName: TEAM_BOCHUM.teamName,
    shortName: TEAM_BOCHUM.shortName,
    teamIconUrl: TEAM_BOCHUM.teamIconUrl,
    points: 5,
    matches: 11,
    won: 1,
    draw: 2,
    lost: 8,
    goals: 7,
    opponentGoals: 22,
    goalDiff: -15,
  },
];

/**
 * Helper for the result-array shape OpenLigaDB returns. resultTypeID 1 is
 * the half-time score, resultTypeID 2 is the final score (the lib only
 * reads the final, but we ship both for realism).
 */
function results(home: number, away: number, ht1: number, ht2: number): ApiMatchResult[] {
  return [
    {
      resultTypeID: 1,
      resultName: "Halbzeit",
      pointsTeam1: ht1,
      pointsTeam2: ht2,
    },
    {
      resultTypeID: 2,
      resultName: "Endergebnis",
      pointsTeam1: home,
      pointsTeam2: away,
    },
  ];
}

/**
 * Bundesliga matches involving BVB.
 *
 * - 3 finished matches in the past (results panel — most-recent-first
 *   slice picks all 3).
 * - 2 future scheduled matches (fixtures panel — earliest-first slice
 *   picks both).
 *
 * The lib filters this entire `getmatchdata/bl1/{season}` response down
 * to BVB-only on its side, so all 5 entries here include team1 or team2
 * = TEAM_BVB. We don't need to ship 306 non-BVB matches.
 */
export const bundesligaMatches: ApiMatch[] = [
  // ----- past results, most recent first by date -----
  {
    matchID: 70101,
    matchDateTimeUTC: "2025-10-25T16:30:00Z",
    matchIsFinished: true,
    team1: TEAM_BVB,
    team2: TEAM_GLADBACH,
    matchResults: results(4, 0, 2, 0),
    leagueShortcut: "bl1",
    leagueName: "1. Fußball-Bundesliga 2025/2026",
  },
  {
    matchID: 70102,
    matchDateTimeUTC: "2025-10-18T13:30:00Z",
    matchIsFinished: true,
    team1: TEAM_AUGSBURG,
    team2: TEAM_BVB,
    matchResults: results(1, 2, 0, 1),
    leagueShortcut: "bl1",
    leagueName: "1. Fußball-Bundesliga 2025/2026",
  },
  {
    matchID: 70103,
    matchDateTimeUTC: "2025-10-04T16:30:00Z",
    matchIsFinished: true,
    team1: TEAM_BVB,
    team2: TEAM_LEIPZIG,
    matchResults: results(1, 1, 1, 0),
    leagueShortcut: "bl1",
    leagueName: "1. Fußball-Bundesliga 2025/2026",
  },

  // ----- future fixtures, earliest first by date -----
  {
    matchID: 70201,
    matchDateTimeUTC: "2026-05-09T13:30:00Z",
    matchIsFinished: false,
    team1: TEAM_BREMEN,
    team2: TEAM_BVB,
    matchResults: [],
    leagueShortcut: "bl1",
    leagueName: "1. Fußball-Bundesliga 2025/2026",
  },
  {
    matchID: 70202,
    matchDateTimeUTC: "2026-05-16T13:30:00Z",
    matchIsFinished: false,
    team1: TEAM_BVB,
    team2: TEAM_BAYERN,
    matchResults: [],
    leagueShortcut: "bl1",
    leagueName: "1. Fußball-Bundesliga 2025/2026",
  },
];

/**
 * DFB-Pokal matches involving BVB. Two cup ties — one finished (BVB
 * won 3-1 in the first round), one upcoming round of 16. The lib merges
 * these with the Bundesliga match list and tags them with the DFB-Pokal
 * `leagueShortcut`, so the fixture panel correctly shows "DFB-Pokal" as
 * the competition label.
 */
export const dfbMatches: ApiMatch[] = [
  {
    matchID: 80101,
    matchDateTimeUTC: "2025-08-15T18:00:00Z",
    matchIsFinished: true,
    team1: TEAM_KAISERSLAUTERN,
    team2: TEAM_BVB,
    matchResults: results(1, 3, 0, 1),
    leagueShortcut: "dfb",
    leagueName: "DFB-Pokal 2025/2026",
  },
  {
    matchID: 80102,
    matchDateTimeUTC: "2025-12-03T19:45:00Z",
    matchIsFinished: false,
    team1: TEAM_BVB,
    team2: TEAM_FRANKFURT,
    matchResults: [],
    leagueShortcut: "dfb",
    leagueName: "DFB-Pokal 2025/2026",
  },
];
