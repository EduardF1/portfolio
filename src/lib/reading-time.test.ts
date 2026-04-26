import { describe, it, expect } from "vitest";
import {
  countWords,
  readingMinutes,
  formatReadingTime,
} from "./reading-time";

describe("countWords", () => {
  it("returns 0 for empty input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("counts simple word sequences", () => {
    expect(countWords("one two three four")).toBe(4);
  });

  it("strips fenced code blocks", () => {
    const md = "Intro paragraph.\n\n```ts\nconst a = 1;\nconsole.log(a);\n```\n\nOutro paragraph.";
    expect(countWords(md)).toBe(4); // "Intro paragraph. Outro paragraph."
  });

  it("strips inline code", () => {
    expect(countWords("Use `useState` to manage state.")).toBe(4);
  });

  it("strips JSX tags but keeps text content", () => {
    expect(countWords("<p>This is <em>important</em> text.</p>")).toBe(4);
  });

  it("collapses markdown links to their text", () => {
    expect(countWords("Read [the docs](https://example.com) for details.")).toBe(5);
  });

  it("strips markdown images", () => {
    expect(countWords("![alt text here](/img.png) The text.")).toBe(2);
  });

  it("ignores frontmatter delimiters", () => {
    const md = "---\ntitle: Hello\ndate: 2026-04-26\n---\n\nReal content here.";
    expect(countWords(md)).toBeGreaterThan(0);
    expect(countWords(md)).toBeLessThanOrEqual(6);
  });
});

describe("readingMinutes", () => {
  it("returns 0 for empty input", () => {
    expect(readingMinutes("")).toBe(0);
  });

  it("floors at 1 minute for short content", () => {
    expect(readingMinutes("short post")).toBe(1);
  });

  it("computes reading time at 200 wpm", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readingMinutes(text)).toBe(3); // 600 / 200 = 3
  });

  it("rounds up partial minutes", () => {
    const text = Array.from({ length: 250 }, () => "word").join(" ");
    expect(readingMinutes(text)).toBe(2); // 250 / 200 = 1.25 → 2
  });
});

describe("formatReadingTime", () => {
  it("returns empty string for 0 minutes", () => {
    expect(formatReadingTime(0)).toBe("");
  });

  it("formats English by default", () => {
    expect(formatReadingTime(3)).toBe("3 min read");
  });

  it("formats Danish when locale=da", () => {
    expect(formatReadingTime(3, "da")).toBe("3 min læsning");
  });
});
