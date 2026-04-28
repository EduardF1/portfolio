/**
 * Tests for <BvbFeed /> — the Server Component that fetches the
 * football-data.org feed once and renders the three Flashscore-style
 * panels (standings / next matches / recent results).
 *
 * Approach:
 *   - For the empty branch we render the resulting tree in jsdom and
 *     assert the season-summary fallback is shown.
 *   - For the populated branch the panels are async sub-components that
 *     React Server Components materialise inline. jsdom can't resolve
 *     async children synchronously, so we mock <BvbTabs /> with a
 *     passthrough and inspect the resolved props the parent passed
 *     in (mockBadge, isMock). The actual table / list markup is exercised
 *     by the dedicated panel tests below where we call the panel function
 *     directly and await its returned tree.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const tabsCalls: Array<Record<string, unknown>> = [];
vi.mock("./bvb-tabs", () => ({
  BvbTabs: (props: { children: React.ReactNode; isMock: boolean; mockBadge: string }) => {
    tabsCalls.push({ isMock: props.isMock, mockBadge: props.mockBadge });
    return (
      <div data-testid="bvb-feed-stub">
        {props.isMock && <p data-testid="bvb-mock-badge">{props.mockBadge}</p>}
      </div>
    );
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => (key: string) => {
    const map: Record<string, Record<string, string>> = {
      "personal.bvb": {
        unavailable: "Feed unavailable",
        seasonSummary: "Season summary fallback line",
        "tabs.standings": "Standings",
        "tabs.fixtures": "Next matches",
        "tabs.results": "Recent results",
        mockBadge: "Sample data",
      },
      "personal.bvb.standings": {
        empty: "No standings yet",
        caption: "Bundesliga table",
        position: "Pos",
        team: "Team",
        played: "P",
        won: "W",
        drawn: "D",
        lost: "L",
        goalDiff: "GD",
        points: "Pts",
      },
      "personal.bvb.fixtures": {
        empty: "No fixtures",
        vs: "vs",
        at: "at",
      },
      "personal.bvb.results": {
        empty: "No results yet",
        vs: "vs",
        at: "at",
        "outcome.W": "Win",
        "outcome.D": "Draw",
        "outcome.L": "Loss",
      },
    };
    return map[ns ?? ""]?.[key] ?? `${ns}:${key}`;
  },
}));

const getBvbFeed = vi.fn();
vi.mock("@/lib/bvb", () => ({
  getBvbFeed: () => getBvbFeed(),
  BVB_TEAM_ID: 4,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  getBvbFeed.mockReset();
  tabsCalls.length = 0;
});

import { BvbFeed } from "./bvb-feed";

describe("<BvbFeed /> (Server Component)", () => {
  it("renders the empty placeholder when feed has nothing in any panel", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [],
      fixtures: [],
      results: [],
      isMock: false,
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.getByTestId("bvb-feed-empty")).toBeInTheDocument();
    expect(screen.getByText(/Feed unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Season summary fallback line/)).toBeInTheDocument();
    // BvbTabs must NOT be mounted when the empty branch is taken.
    expect(tabsCalls.length).toBe(0);
  });

  it("forwards isMock=false to BvbTabs when feed has live data", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [
        {
          position: 1,
          teamId: 4,
          teamName: "Dortmund",
          teamShortName: "Dortmund",
          teamTla: "BVB",
          playedGames: 1,
          won: 1,
          draw: 0,
          lost: 0,
          goalDifference: 1,
          points: 3,
        },
      ],
      fixtures: [],
      results: [],
      isMock: false,
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.getByTestId("bvb-feed-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("bvb-mock-badge")).not.toBeInTheDocument();
    expect(tabsCalls).toHaveLength(1);
    expect(tabsCalls[0]).toMatchObject({ isMock: false });
  });

  it("forwards isMock=true and the localised badge label when fixture mode is on", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [
        {
          position: 1,
          teamId: 4,
          teamName: "Dortmund",
          teamShortName: "Dortmund",
          teamTla: "BVB",
          playedGames: 1,
          won: 1,
          draw: 0,
          lost: 0,
          goalDifference: 1,
          points: 3,
        },
      ],
      fixtures: [],
      results: [],
      isMock: true,
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.getByTestId("bvb-mock-badge")).toHaveTextContent("Sample data");
    expect(tabsCalls[0]).toMatchObject({ isMock: true, mockBadge: "Sample data" });
  });

  it("does not call BvbTabs when standings, fixtures, and results are all empty", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [],
      fixtures: [],
      results: [],
      isMock: true, // even with isMock=true, the empty branch wins
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.getByTestId("bvb-feed-empty")).toBeInTheDocument();
    expect(tabsCalls.length).toBe(0);
  });

  it("treats a populated standings list alone as 'not empty'", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [
        {
          position: 1,
          teamId: 4,
          teamName: "Dortmund",
          teamShortName: "Dortmund",
          teamTla: "BVB",
          playedGames: 30,
          won: 20,
          draw: 5,
          lost: 5,
          goalDifference: 25,
          points: 65,
        },
      ],
      fixtures: [],
      results: [],
      isMock: false,
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.queryByTestId("bvb-feed-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("bvb-feed-stub")).toBeInTheDocument();
  });

  it("treats a populated fixtures-only feed as 'not empty'", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [],
      fixtures: [
        {
          id: 1,
          utcDate: "2026-05-01T14:00:00Z",
          opponent: "Bayern",
          isHome: true,
          competitionName: "Bundesliga",
        },
      ],
      results: [],
      isMock: false,
    });
    const tree = await BvbFeed();
    render(tree);
    expect(screen.queryByTestId("bvb-feed-empty")).not.toBeInTheDocument();
    expect(tabsCalls.length).toBe(1);
  });
});

// ----------------------------------------------------------------------
// Direct render of the panel sub-trees. We re-import the BvbFeed module
// via top-level dynamic import so React renders the resolved JSX from
// each panel function (the panels are async server functions —
// React.use() can't be invoked from jsdom, but awaiting the function
// directly returns the JSX tree we can render with @testing-library).
// ----------------------------------------------------------------------

describe("BvbFeed panel rendering", () => {
  it("standings panel renders the BVB row with the data-bvb attribute", async () => {
    getBvbFeed.mockResolvedValueOnce({
      standings: [
        {
          position: 1,
          teamId: 99,
          teamName: "Bayern",
          teamShortName: "Bayern",
          teamTla: "BAY",
          playedGames: 30,
          won: 25,
          draw: 3,
          lost: 2,
          goalDifference: 50,
          points: 78,
        },
        {
          position: 2,
          teamId: 4,
          teamName: "Borussia Dortmund",
          teamShortName: "Dortmund",
          teamTla: "BVB",
          playedGames: 30,
          won: 20,
          draw: 5,
          lost: 5,
          goalDifference: 25,
          points: 65,
        },
      ],
      fixtures: [],
      results: [],
      isMock: false,
    });
    // Spy: capture the children passed to BvbTabs so we can render the
    // StandingsPanel sub-tree directly. The panel is the first child.
    let capturedChildren: React.ReactNode[] = [];
    vi.doMock("./bvb-tabs", () => ({
      BvbTabs: ({ children }: { children: React.ReactNode }) => {
        capturedChildren = Array.isArray(children) ? children : [children];
        return null;
      },
    }));
    vi.resetModules();
    const { BvbFeed: FreshBvbFeed } = await import("./bvb-feed");
    const tree = await FreshBvbFeed();
    render(tree);

    // Each child is an async server component (a Promise of JSX). Resolve
    // the first (StandingsPanel) and render it.
    const [standingsChild] = capturedChildren;
    if (
      standingsChild &&
      typeof standingsChild === "object" &&
      "type" in standingsChild &&
      typeof (standingsChild as { type: unknown }).type === "function"
    ) {
      // The element shape is { type, props }. Call the type with props
      // to invoke the async component, then render the result.
      const el = standingsChild as {
        type: (p: unknown) => Promise<React.ReactNode>;
        props: unknown;
      };
      const resolved = await el.type(el.props);
      const { container } = render(resolved as React.ReactElement);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
      expect(rows[0].getAttribute("data-bvb")).toBeNull();
      expect(rows[1].getAttribute("data-bvb")).toBe("true");
    } else {
      throw new Error("Expected StandingsPanel React element from BvbTabs children");
    }
  });
});
