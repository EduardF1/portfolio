import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BvbTabs } from "./bvb-tabs";

afterEach(() => {
  cleanup();
  // Each test starts fresh: clear hash so URL-sync logic does not leak.
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", window.location.pathname);
  }
});

const labels = {
  standings: "Standings",
  fixtures: "Next matches",
  results: "Recent results",
};

function renderTabs(opts?: { isMock?: boolean }) {
  return render(
    <BvbTabs
      labels={labels}
      isMock={opts?.isMock ?? false}
      mockBadge="Sample data"
    >
      <div data-testid="panel-standings">Standings table</div>
      <div data-testid="panel-fixtures">Next matches list</div>
      <div data-testid="panel-results">Recent results list</div>
    </BvbTabs>,
  );
}

describe("<BvbTabs />", () => {
  it("renders all three tabs with correct ARIA roles", () => {
    renderTabs();
    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeInTheDocument();
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("shows the standings panel by default and hides the others", () => {
    renderTabs();
    // Standings panel is visible (not hidden).
    const standingsPanel = screen.getByTestId("panel-standings").closest(
      "[role='tabpanel']",
    );
    expect(standingsPanel).not.toHaveAttribute("hidden");
    // Fixtures + results panels are hidden.
    const fixturesPanel = screen.getByTestId("panel-fixtures").closest(
      "[role='tabpanel']",
    );
    expect(fixturesPanel).toHaveAttribute("hidden");
    const resultsPanel = screen.getByTestId("panel-results").closest(
      "[role='tabpanel']",
    );
    expect(resultsPanel).toHaveAttribute("hidden");
  });

  it("switches tabs on click and updates the URL hash", async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(screen.getByRole("tab", { name: "Next matches" }));
    expect(
      screen.getByRole("tab", { name: "Next matches" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe("#next");
    const fixturesPanel = screen.getByTestId("panel-fixtures").closest(
      "[role='tabpanel']",
    );
    expect(fixturesPanel).not.toHaveAttribute("hidden");

    await user.click(screen.getByRole("tab", { name: "Recent results" }));
    expect(window.location.hash).toBe("#results");
  });

  it("supports arrow-key navigation and roving tabindex", async () => {
    const user = userEvent.setup();
    renderTabs();
    const standingsTab = screen.getByRole("tab", { name: "Standings" });
    standingsTab.focus();
    expect(standingsTab).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    const fixturesTab = screen.getByRole("tab", { name: "Next matches" });
    expect(fixturesTab).toHaveFocus();
    expect(fixturesTab).toHaveAttribute("aria-selected", "true");
    expect(fixturesTab).toHaveAttribute("tabindex", "0");
    expect(standingsTab).toHaveAttribute("tabindex", "-1");

    // ArrowLeft wraps backward.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Standings" })).toHaveFocus();

    // Home / End jump to first / last.
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Recent results" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Standings" })).toHaveFocus();
  });

  it("syncs initial state from a #fixtures URL hash on mount", () => {
    window.history.replaceState(null, "", "/personal#next");
    renderTabs();
    expect(
      screen.getByRole("tab", { name: "Next matches" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("renders the mock-data badge when isMock is true", () => {
    renderTabs({ isMock: true });
    expect(screen.getByTestId("bvb-mock-badge")).toHaveTextContent(
      /sample data/i,
    );
  });

  it("does not render the mock badge when isMock is false", () => {
    renderTabs({ isMock: false });
    expect(screen.queryByTestId("bvb-mock-badge")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Unit-test the data-shaping helpers in lib/bvb. These are exposed via
// __test__ so we don't need to fire real fetches against football-data.org.
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

describe("getBvbFeed (mock fallback)", () => {
  it("returns mock data when no API token is configured", async () => {
    const original = process.env.BVB_API_TOKEN;
    delete process.env.BVB_API_TOKEN;
    delete process.env.BVB_USE_MOCK;
    // Re-import so the module-level mock check runs against the cleared env.
    vi.resetModules();
    const { getBvbFeed, BVB_TEAM_ID } = await import("@/lib/bvb");
    const data = await getBvbFeed();
    expect(data.isMock).toBe(true);
    expect(data.standings.length).toBeGreaterThan(0);
    expect(data.fixtures.length).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    // Borussia Dortmund must appear in the mock standings.
    expect(data.standings.some((row) => row.teamId === BVB_TEAM_ID)).toBe(true);
    if (original !== undefined) process.env.BVB_API_TOKEN = original;
  });

  it("returns mock data when BVB_USE_MOCK=1 even with a token set", async () => {
    process.env.BVB_API_TOKEN = "stub-token";
    process.env.BVB_USE_MOCK = "1";
    vi.resetModules();
    const { getBvbFeed } = await import("@/lib/bvb");
    const data = await getBvbFeed();
    expect(data.isMock).toBe(true);
    delete process.env.BVB_USE_MOCK;
    delete process.env.BVB_API_TOKEN;
  });
});
