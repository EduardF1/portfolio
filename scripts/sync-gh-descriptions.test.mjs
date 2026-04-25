import { describe, expect, it } from "vitest";
import {
  proposeDescription,
  extractFirstParagraph,
  finalize,
  templated,
  humanizeName,
  parseArgs,
} from "./sync-gh-descriptions.mjs";

describe("extractFirstParagraph", () => {
  it("returns the first usable paragraph and skips headings/badges/lists", () => {
    const md = [
      "# Cool Project",
      "",
      "![ci](https://img.shields.io/badge/ci-passing-green)",
      "",
      "- bullet item one",
      "- bullet item two",
      "",
      "This project demonstrates a small React widget that wraps a calculator.",
      "",
      "## Install",
    ].join("\n");
    const para = extractFirstParagraph(md);
    expect(para).toBe(
      "This project demonstrates a small React widget that wraps a calculator.",
    );
  });

  it("returns null when README has only headings and lists", () => {
    const md = ["# Title", "", "## Subtitle", "", "- one", "- two", ""].join("\n");
    expect(extractFirstParagraph(md)).toBeNull();
  });

  it("falls back to the first sentence when paragraph is too long", () => {
    const sentence = "This is a concise opening sentence about the project.";
    const tail = " ".concat("very long extra content ".repeat(20));
    const md = `# Title\n\n${sentence}${tail}\n`;
    const para = extractFirstParagraph(md);
    expect(para).toBe(sentence);
  });
});

describe("proposeDescription", () => {
  it("uses README paragraph when present (from-readme)", () => {
    const readmeText = [
      "# my-app",
      "",
      "A small Express API that exposes a calculator over HTTP for demo purposes.",
      "",
      "## Setup",
    ].join("\n");
    const result = proposeDescription({
      name: "my-app",
      language: "JavaScript",
      readmeText,
    });
    expect(result.source).toBe("from-readme");
    expect(result.description).toBe(
      "A small Express API that exposes a calculator over HTTP for demo purposes.",
    );
  });

  it("falls back to templated when README has only headings", () => {
    const readmeText = "# foo-experiment\n\n## Usage\n\n## Notes\n";
    const result = proposeDescription({
      name: "foo-experiment",
      language: "JavaScript",
      readmeText,
    });
    expect(result.source).toBe("templated");
    expect(result.description).toBe(
      "A small project for practicing foo experiment in JavaScript.",
    );
  });

  it("falls back to templated when README is missing entirely (no-readme)", () => {
    const result = proposeDescription({
      name: "foo-experiment",
      language: "JavaScript",
      readmeText: null,
    });
    expect(result.source).toBe("no-readme");
    expect(result.description).toBe(
      "A small project for practicing foo experiment in JavaScript.",
    );
  });

  it("templates by language for Java repos", () => {
    const result = proposeDescription({
      name: "JavaPlayground",
      language: "Java",
      readmeText: null,
    });
    expect(result.description).toBe(
      "A small project for practicing java playground in Java.",
    );
  });

  it("handles unknown/empty language", () => {
    const result = proposeDescription({
      name: "mystery-repo",
      language: null,
      readmeText: null,
    });
    expect(result.description).toBe("A small project exploring mystery repo.");
  });
});

describe("finalize", () => {
  it("trims to 200 chars and ends with punctuation", () => {
    const long = "x".repeat(500);
    const out = finalize(long);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith(".")).toBe(true);
  });

  it("does not double up trailing punctuation", () => {
    expect(finalize("Already ends with a period.")).toBe(
      "Already ends with a period.",
    );
    expect(finalize("Ends with question?")).toBe("Ends with question?");
  });

  it("collapses whitespace", () => {
    expect(finalize("  multiple   spaces\n\there  ")).toBe(
      "multiple spaces here.",
    );
  });
});

describe("templated and humanizeName", () => {
  it("humanizes slug names", () => {
    expect(humanizeName("react-hands-on")).toBe("react hands on");
    expect(humanizeName("MyCamelCase_repo.name")).toBe("my camel case repo name");
  });

  it("templated uses TypeScript phrasing", () => {
    expect(templated("ts-utils", "TypeScript")).toBe(
      "A small project for practicing ts utils in TypeScript",
    );
  });
});

describe("parseArgs", () => {
  it("defaults to dry-run with EduardF1", () => {
    const o = parseArgs([]);
    expect(o.apply).toBe(false);
    expect(o.user).toBe("EduardF1");
    expect(o.limit).toBe(Number.POSITIVE_INFINITY);
  });

  it("parses --apply / --user / --limit", () => {
    const o = parseArgs(["--apply", "--user", "octocat", "--limit", "3"]);
    expect(o.apply).toBe(true);
    expect(o.user).toBe("octocat");
    expect(o.limit).toBe(3);
  });
});
