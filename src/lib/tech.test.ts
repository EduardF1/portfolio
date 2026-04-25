import { describe, it, expect } from "vitest";
import { TECHS, findTech, techsByCategory } from "./tech";

describe("findTech()", () => {
  it("matches by exact slug", () => {
    expect(findTech("dotnet")?.name).toBe(".NET");
    expect(findTech("csharp")?.name).toBe("C#");
  });

  it("matches by display name", () => {
    expect(findTech("C#")?.slug).toBe("csharp");
    expect(findTech(".NET")?.slug).toBe("dotnet");
  });

  it("matches by alias", () => {
    expect(findTech("dotnet core")?.slug).toBe("dotnet");
    expect(findTech("springboot")?.slug).toBe("spring");
    expect(findTech("postgres")?.slug).toBe("postgresql");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(findTech("  REACT  ")?.slug).toBe("react");
    expect(findTech("TypeScript")?.slug).toBe("typescript");
    expect(findTech("typescript")?.slug).toBe("typescript");
  });

  it("returns undefined for unknown values", () => {
    expect(findTech("definitely-not-a-tech")).toBeUndefined();
    expect(findTech("")).toBeUndefined();
  });
});

describe("techsByCategory()", () => {
  it("groups every tech into exactly one category", () => {
    const grouped = techsByCategory();
    const total = Object.values(grouped).reduce(
      (n, list) => n + list.length,
      0,
    );
    expect(total).toBe(TECHS.length);
  });

  it("exposes all six expected categories", () => {
    const grouped = techsByCategory();
    expect(Object.keys(grouped).sort()).toEqual([
      "backend",
      "data",
      "frontend",
      "mobile",
      "ops",
      "testing",
    ]);
  });
});

describe("TECHS data integrity", () => {
  it("has unique slugs", () => {
    const slugs = TECHS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses kebab-case slugs", () => {
    for (const t of TECHS) {
      expect(t.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("provides https docsUrl for every tech", () => {
    for (const t of TECHS) {
      expect(t.docsUrl).toMatch(/^https:\/\//);
    }
  });

  it("provides a non-empty description for every tech", () => {
    for (const t of TECHS) {
      expect(t.description.length).toBeGreaterThan(20);
    }
  });
});
