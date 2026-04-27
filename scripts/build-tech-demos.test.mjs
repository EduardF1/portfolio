import { describe, it, expect } from "vitest";
import {
  isTemplateRepo,
  normaliseRepo,
  buildLanguageMap,
  parseArgs,
} from "./build-tech-demos.mjs";

describe("isTemplateRepo()", () => {
  it("flags CRA scaffolds by description", () => {
    expect(
      isTemplateRepo({
        name: "demo",
        description:
          "This project was bootstrapped with Create React App.",
      }),
    ).toBe(true);
  });

  it("flags Next.js bootstrap scaffolds by description", () => {
    expect(
      isTemplateRepo({
        name: "demo",
        description:
          "This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.",
      }),
    ).toBe(true);
  });

  it("flags NestJS scaffolds by description", () => {
    expect(
      isTemplateRepo({
        name: "demo",
        description: "A progressive [Node.js] framework for building scalable apps.",
      }),
    ).toBe(true);
  });

  it("flags scaffold-ish names", () => {
    expect(isTemplateRepo({ name: "create-react-app" })).toBe(true);
    expect(isTemplateRepo({ name: "nextjs-starter" })).toBe(true);
    expect(isTemplateRepo({ name: "my-app" })).toBe(true);
  });

  it("does not flag genuine projects", () => {
    expect(
      isTemplateRepo({
        name: "calculator-api",
        description: "A small Express API exposing arithmetic operations over HTTP.",
      }),
    ).toBe(false);
    expect(
      isTemplateRepo({
        name: "portfolio",
        description: "Personal portfolio in Next.js + TypeScript.",
      }),
    ).toBe(false);
  });

  it("treats null/empty descriptions as harmless", () => {
    expect(isTemplateRepo({ name: "thing", description: null })).toBe(false);
    expect(isTemplateRepo({ name: "thing", description: "" })).toBe(false);
  });
});

describe("normaliseRepo()", () => {
  it("flattens primaryLanguage and applies defaults", () => {
    const out = normaliseRepo({
      name: "scala-hands-on",
      url: "https://github.com/EduardF1/scala-hands-on",
      description: "Practicing scala.",
      primaryLanguage: { name: "Scala" },
      stargazerCount: 2,
      isFork: false,
      isArchived: false,
    });
    expect(out).toEqual({
      name: "scala-hands-on",
      url: "https://github.com/EduardF1/scala-hands-on",
      description: "Practicing scala.",
      language: "Scala",
      stargazerCount: 2,
      isFork: false,
      isArchived: false,
    });
  });

  it("handles null primaryLanguage", () => {
    const out = normaliseRepo({
      name: "config-only",
      url: "https://github.com/EduardF1/config-only",
      description: null,
      primaryLanguage: null,
      stargazerCount: 0,
      isFork: false,
      isArchived: false,
    });
    expect(out.language).toBeNull();
    expect(out.description).toBeNull();
  });

  it("coerces missing fields safely", () => {
    const out = normaliseRepo({});
    expect(out).toEqual({
      name: "",
      url: "",
      description: null,
      language: null,
      stargazerCount: 0,
      isFork: false,
      isArchived: false,
    });
  });
});

describe("buildLanguageMap()", () => {
  /** @type {Array<Parameters<typeof buildLanguageMap>[0][number]>} */
  const sample = [
    {
      name: "type-utils",
      url: "https://github.com/u/type-utils",
      language: "TypeScript",
      description: "Helpers.",
      stargazerCount: 5,
      isFork: false,
      isArchived: false,
    },
    {
      name: "alpha-ts",
      url: "https://github.com/u/alpha-ts",
      language: "TypeScript",
      description: "Alpha.",
      stargazerCount: 5,
      isFork: false,
      isArchived: false,
    },
    {
      name: "beta-ts",
      url: "https://github.com/u/beta-ts",
      language: "TypeScript",
      description: "Beta.",
      stargazerCount: 1,
      isFork: false,
      isArchived: false,
    },
    {
      name: "gamma-ts",
      url: "https://github.com/u/gamma-ts",
      language: "TypeScript",
      description: "Gamma.",
      stargazerCount: 0,
      isFork: false,
      isArchived: false,
    },
    {
      name: "java-thing",
      url: "https://github.com/u/java-thing",
      language: "Java",
      description: null,
      stargazerCount: 0,
      isFork: false,
      isArchived: false,
    },
    {
      name: "old-fork",
      url: "https://github.com/u/old-fork",
      language: "Java",
      description: "fork",
      stargazerCount: 99,
      isFork: true,
      isArchived: false,
    },
    {
      name: "archived-thing",
      url: "https://github.com/u/archived-thing",
      language: "Java",
      description: "Archived.",
      stargazerCount: 99,
      isFork: false,
      isArchived: true,
    },
    {
      name: "create-react-app",
      url: "https://github.com/u/create-react-app",
      language: "JavaScript",
      description: null,
      stargazerCount: 0,
      isFork: false,
      isArchived: false,
    },
    {
      name: "no-language",
      url: "https://github.com/u/no-language",
      language: null,
      description: null,
      stargazerCount: 9,
      isFork: false,
      isArchived: false,
    },
  ];

  it("groups by language, drops forks/archived/templates/no-language", () => {
    const out = buildLanguageMap(sample);
    expect(Object.keys(out).sort()).toEqual(["Java", "TypeScript"]);
    expect(out.Java.map((d) => d.name)).toEqual(["java-thing"]);
  });

  it("caps each language at top N by stars, ties broken alphabetically", () => {
    const out = buildLanguageMap(sample, 3);
    expect(out.TypeScript.map((d) => d.name)).toEqual([
      "alpha-ts",
      "type-utils",
      "beta-ts",
    ]);
  });

  it("respects custom topN", () => {
    const out = buildLanguageMap(sample, 1);
    expect(out.TypeScript).toHaveLength(1);
    expect(out.TypeScript[0].name).toBe("alpha-ts");
  });

  it("only emits expected fields for each demo", () => {
    const out = buildLanguageMap(sample);
    for (const list of Object.values(out)) {
      for (const entry of list) {
        expect(Object.keys(entry).sort()).toEqual(["description", "name", "url"]);
      }
    }
  });
});

describe("parseArgs()", () => {
  it("defaults to EduardF1 + 100", () => {
    expect(parseArgs([])).toEqual({ user: "EduardF1", limit: 100 });
  });

  it("parses --user and --limit", () => {
    expect(parseArgs(["--user", "octocat", "--limit", "5"])).toEqual({
      user: "octocat",
      limit: 5,
    });
  });

  it("ignores invalid --limit values", () => {
    const opts = parseArgs(["--limit", "not-a-number"]);
    expect(opts.limit).toBe(100);
  });

  it("sets help on -h/--help", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
  });
});
