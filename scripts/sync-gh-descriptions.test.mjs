import { describe, expect, it } from "vitest";
import {
  proposeDescription,
  extractFirstParagraph,
  extractH1Tagline,
  stripMarkdown,
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

  it("ignores non-numeric or non-positive --limit values", () => {
    const o = parseArgs(["--limit", "not-a-number"]);
    expect(o.limit).toBe(Number.POSITIVE_INFINITY);
    const o2 = parseArgs(["--limit", "-5"]);
    expect(o2.limit).toBe(Number.POSITIVE_INFINITY);
  });

  it("recognises -h and --help", () => {
    expect(parseArgs(["-h"]).help).toBe(true);
    expect(parseArgs(["--help"]).help).toBe(true);
  });
});

describe("template-README short-circuits (CRA / Next.js / NestJS)", () => {
  it("CRA boilerplate README → templated, not from-readme", () => {
    const readmeText = [
      "# my-cra-app",
      "",
      "This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).",
      "",
      "## Available Scripts",
      "",
      "In the project directory, you can run:",
      "",
      "### `npm start`",
      "",
      "Runs the app in the development mode.",
    ].join("\n");
    const r = proposeDescription({
      name: "my-cra-app",
      language: "JavaScript",
      readmeText,
    });
    expect(r.source).toBe("templated");
    expect(r.description).toBe(
      "A small project for practicing my cra app in JavaScript.",
    );
    // extractFirstParagraph also short-circuits to null on a CRA README
    expect(extractFirstParagraph(readmeText)).toBeNull();
  });

  it("Next.js bootstrapped-template README → templated", () => {
    const readmeText = [
      "# my-next",
      "",
      "This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.",
      "",
      "## Getting Started",
    ].join("\n");
    const r = proposeDescription({
      name: "my-next",
      language: "TypeScript",
      readmeText,
    });
    expect(r.source).toBe("templated");
    expect(r.description).toMatch(/in TypeScript\./);
    expect(extractFirstParagraph(readmeText)).toBeNull();
  });

  it("NestJS bootstrapped-template README → templated", () => {
    const readmeText = [
      "# my-nest",
      "",
      "[Nest](https://github.com/nestjs/nest) framework TypeScript starter.",
      "",
      "## Description",
      "",
      "A progressive [Node.js] framework for building efficient and scalable server-side applications.",
    ].join("\n");
    const r = proposeDescription({
      name: "my-nest",
      language: "TypeScript",
      readmeText,
    });
    expect(r.source).toBe("templated");
    expect(extractFirstParagraph(readmeText)).toBeNull();
  });
});

describe("paragraph guards (boilerplate, prepositional/numbered fragments)", () => {
  it("skips a paragraph that is just a numbered-fragment list line", () => {
    const md = [
      "# title",
      "",
      "1) Add foo to bar",
      "",
      "This actual paragraph describes the project in plain prose for once.",
      "",
    ].join("\n");
    expect(extractFirstParagraph(md)).toBe(
      "This actual paragraph describes the project in plain prose for once.",
    );
  });

  it("skips a fragment that begins with a preposition like 'of …' or 'to …'", () => {
    const md = [
      "# title",
      "",
      "of course you can do this in any language.",
      "",
      "This second paragraph is a real description of the actual project.",
      "",
    ].join("\n");
    expect(extractFirstParagraph(md)).toBe(
      "This second paragraph is a real description of the actual project.",
    );
  });

  it("skips a paragraph that begins with a bare shell command (npm/yarn/pnpm/node/npx)", () => {
    const md = [
      "# title",
      "",
      "npm install some-package-here-and-it-keeps-going-just-because.",
      "",
      "This second paragraph is the real description of the project we have here.",
      "",
    ].join("\n");
    expect(extractFirstParagraph(md)).toBe(
      "This second paragraph is the real description of the project we have here.",
    );
  });

  it("skips quoted blocks, HTML, code fences, hr, and reference-link defs", () => {
    const md = [
      "# title",
      "",
      "> a quoted block, irrelevant",
      "",
      "<div>html block</div>",
      "",
      "```",
      "console.log('hi')",
      "```",
      "",
      "---",
      "",
      "[ci]: https://example.com/badge",
      "",
      "This is the real first paragraph and it should pass through cleanly.",
      "",
    ].join("\n");
    expect(extractFirstParagraph(md)).toBe(
      "This is the real first paragraph and it should pass through cleanly.",
    );
  });

  it("returns null when the entire README is too short or unsuitable", () => {
    expect(extractFirstParagraph("short.")).toBeNull();
  });
});

describe("extractH1Tagline", () => {
  it("returns the first non-empty content line after an H1", () => {
    const md = ["# Cool", "", "A short tagline that follows the title."].join(
      "\n",
    );
    expect(extractH1Tagline(md)).toBe(
      "A short tagline that follows the title.",
    );
  });

  it("returns null when the next non-empty line is another heading", () => {
    const md = ["# Cool", "", "## subhead", "", "Body."].join("\n");
    expect(extractH1Tagline(md)).toBeNull();
  });

  it("returns null when there is no H1", () => {
    expect(extractH1Tagline("just prose, no heading")).toBeNull();
  });
});

describe("stripMarkdown", () => {
  it("removes badges, links, emphasis, and inline code", () => {
    const text =
      "![ci](https://example.com/x.png) [Cool](https://example.com) **bold** _italic_ `inline`";
    expect(stripMarkdown(text)).toBe("Cool bold italic inline");
  });

  it("strips bare HTML tags but keeps text content", () => {
    expect(stripMarkdown("<b>hi</b> there")).toBe("hi there");
  });
});

describe("templated language coverage", () => {
  it("covers Go, Rust, PHP, Ruby, Kotlin, C#, Python, C++, C", () => {
    expect(templated("go-thing", "Go")).toMatch(/in Go$/);
    expect(templated("rusty", "Rust")).toMatch(/in Rust$/);
    expect(templated("phpish", "PHP")).toMatch(/in PHP$/);
    expect(templated("rb", "Ruby")).toMatch(/in Ruby$/);
    expect(templated("kt", "Kotlin")).toMatch(/in Kotlin$/);
    expect(templated("dotnet", "C#")).toMatch(/in C#$/);
    expect(templated("py", "Python")).toMatch(/in Python$/);
    expect(templated("cpp", "C++")).toMatch(/in C\+\+$/);
    expect(templated("c-thing", "C")).toMatch(/in C$/);
  });

  it("HTML, CSS, Shell, Dockerfile take their own phrasing", () => {
    expect(templated("html-bits", "HTML")).toMatch(/with HTML$/);
    expect(templated("css-bits", "CSS")).toMatch(/with CSS$/);
    expect(templated("scripts", "Shell")).toMatch(/shell scripting/);
    expect(templated("dock", "Dockerfile")).toMatch(/containerization/);
  });

  it("falls through to a generic phrasing for unrecognised languages", () => {
    expect(templated("haskell-stuff", "Haskell")).toBe(
      "A small project for practicing haskell stuff in Haskell",
    );
  });

  it("uses a no-language phrasing for empty / null language", () => {
    expect(templated("name-x", null)).toBe("A small project exploring name x");
    expect(templated("name-y", "")).toBe("A small project exploring name y");
  });
});

describe("finalize edge cases", () => {
  it("trims trailing comma/semicolon/dash before adding the period when truncating", () => {
    // 199 chars then ", x" — slicing at 200 chops mid-tail and the
    // trailing-punctuation cleanup runs.
    const long = "x".repeat(195) + ", more";
    const out = finalize(long);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith(".")).toBe(true);
    expect(out.endsWith(",.")).toBe(false);
  });

  it("preserves an exclamation mark", () => {
    expect(finalize("Watch out!")).toBe("Watch out!");
  });

  it("appends a period when the input lacks terminating punctuation", () => {
    expect(finalize("no punctuation here")).toBe("no punctuation here.");
  });
});
