import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// Mock the data layer at the module boundary so we don't have to
// stub fetch and fabricate a full response shape inside every test.
vi.mock("@/lib/github-stats", () => ({
  getProfileStats: vi.fn(),
}));

import { GithubStats } from "./github-stats";
import { getProfileStats } from "@/lib/github-stats";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("<GithubStats />", () => {
  it("renders the stats cards when the API returns data", async () => {
    vi.mocked(getProfileStats).mockResolvedValue({
      user: "EduardF1",
      publicRepos: 42,
      followers: 7,
      totalStars: 123,
      topLanguages: [
        { name: "TypeScript", count: 15 },
        { name: "Java", count: 8 },
      ],
    });
    render(await GithubStats());
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText(/TypeScript \(15\)/)).toBeInTheDocument();
    expect(screen.getByText(/Java \(8\)/)).toBeInTheDocument();
    expect(screen.getByText(/@EduardF1/)).toBeInTheDocument();
  });

  it("renders the three SVG cards (stats, top-langs, streak)", async () => {
    vi.mocked(getProfileStats).mockResolvedValue({
      user: "EduardF1",
      publicRepos: 1,
      followers: 1,
      totalStars: 1,
      topLanguages: [],
    });
    render(await GithubStats());
    const svgs = screen.getByTestId("github-stats-svg");
    const imgs = svgs.querySelectorAll("img");
    expect(imgs.length).toBe(3);
    expect(imgs[0]?.getAttribute("alt")).toMatch(/GitHub stats for @EduardF1/);
    expect(imgs[1]?.getAttribute("alt")).toMatch(/Top languages for @EduardF1/);
    expect(imgs[2]?.getAttribute("alt")).toMatch(/Contribution streak for @EduardF1/);
    // Each <picture> should provide a dark <source> for prefers-color-scheme.
    expect(svgs.querySelectorAll("source").length).toBe(3);
  });

  it("renders the empty state when the API returns null", async () => {
    vi.mocked(getProfileStats).mockResolvedValue(null);
    render(await GithubStats());
    expect(screen.getByText(/GitHub stats unavailable/)).toBeInTheDocument();
  });
});
