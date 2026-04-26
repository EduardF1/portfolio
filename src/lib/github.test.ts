import { afterEach, describe, it, expect, vi } from "vitest";
import { getRepos, summarize, type Repo } from "./github";

afterEach(() => {
  vi.restoreAllMocks();
});

const sample: Repo[] = [
  {
    id: 1,
    name: "alpha",
    full_name: "EduardF1/alpha",
    html_url: "",
    description: null,
    language: "TypeScript",
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "",
    updated_at: "",
    fork: false,
    archived: false,
  },
  {
    id: 2,
    name: "beta",
    full_name: "EduardF1/beta",
    html_url: "",
    description: null,
    language: "TypeScript",
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "",
    updated_at: "",
    fork: true, // filtered out
    archived: false,
  },
  {
    id: 3,
    name: "gamma",
    full_name: "EduardF1/gamma",
    html_url: "",
    description: null,
    language: "Java",
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "",
    updated_at: "",
    fork: false,
    archived: true, // filtered out
  },
];

describe("summarize", () => {
  it("counts repos by language and sorts by count descending", () => {
    const repos: Repo[] = [
      { ...sample[0], language: "TypeScript" },
      { ...sample[0], id: 11, language: "TypeScript" },
      { ...sample[0], id: 12, language: "Java" },
      { ...sample[0], id: 13, language: null },
    ];
    const out = summarize(repos);
    expect(out.total).toBe(4);
    // TypeScript first (count 2), Java second (count 1), null skipped
    expect(out.languages[0]).toEqual(["TypeScript", 2]);
    expect(out.languages[1]).toEqual(["Java", 1]);
    expect(out.languages.length).toBe(2);
  });
});

describe("getRepos", () => {
  it("filters out forks and archived repos on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(sample), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const out = await getRepos();
    expect(out.length).toBe(1);
    expect(out[0].name).toBe("alpha");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns [] when the response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await getRepos();
    expect(out).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns [] when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await getRepos();
    expect(out).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
  });
});
