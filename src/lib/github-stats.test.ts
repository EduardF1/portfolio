import { describe, it, expect, afterEach, vi } from "vitest";
import { getProfileStats, summarizeStats } from "./github-stats";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("summarizeStats", () => {
  it("filters forks/archived, sums stars, picks top 3 languages", () => {
    const out = summarizeStats(
      { public_repos: 42, followers: 7, created_at: "2019-04-15T10:00:00Z" },
      [
        { language: "TypeScript", stargazers_count: 5, fork: false, archived: false },
        { language: "TypeScript", stargazers_count: 1, fork: false, archived: false },
        { language: "Java", stargazers_count: 3, fork: false, archived: false },
        { language: "PHP", stargazers_count: 0, fork: false, archived: false },
        { language: "Python", stargazers_count: 0, fork: false, archived: false },
        { language: "C++", stargazers_count: 99, fork: true, archived: false }, // dropped
        { language: "Java", stargazers_count: 99, fork: false, archived: true }, // dropped
        { language: null, stargazers_count: 2, fork: false, archived: false }, // counted in stars only
      ],
    );
    expect(out.user).toBe("EduardF1");
    // publicRepos is the live filtered count (6), not profile.public_repos (42)
    // — matches the "N public repositories" feed text below the card.
    expect(out.publicRepos).toBe(6);
    expect(out.followers).toBe(7);
    expect(out.memberSince).toBe(2019);
    expect(out.totalStars).toBe(5 + 1 + 3 + 0 + 0 + 2);
    expect(out.topLanguages).toHaveLength(3);
    expect(out.topLanguages[0]).toEqual({ name: "TypeScript", count: 2 });
    // Java and PHP / Python all tie at 1 — sort tie-break is alphabetical.
    expect(out.topLanguages[1].count).toBe(1);
  });

  it("handles an empty repo list", () => {
    const out = summarizeStats(
      { public_repos: 0, followers: 0, created_at: "2020-01-01T00:00:00Z" },
      [],
    );
    expect(out.totalStars).toBe(0);
    expect(out.topLanguages).toEqual([]);
    expect(out.memberSince).toBe(2020);
  });
});

describe("getProfileStats", () => {
  it("returns null when either endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getProfileStats()).toBeNull();
  });

  it("aggregates data on success", async () => {
    let call = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return new Response(
          JSON.stringify({
            public_repos: 5,
            followers: 2,
            created_at: "2019-04-15T10:00:00Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify([
          { language: "TypeScript", stargazers_count: 10, fork: false, archived: false },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    const out = await getProfileStats();
    expect(out).toEqual({
      user: "EduardF1",
      publicRepos: 1,
      followers: 2,
      totalStars: 10,
      memberSince: 2019,
      topLanguages: [{ name: "TypeScript", count: 1 }],
    });
  });

  it("returns null when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getProfileStats()).toBeNull();
  });
});
