import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildSearchIndex,
  makeExcerpt,
  stripMdx,
  INDEXED_COLLECTIONS,
} from "./build-index";

describe("stripMdx", () => {
  it("removes fenced code blocks and inline code", () => {
    const input = "Hello ```\nconst x = 1;\n``` world `inline` end.";
    expect(stripMdx(input)).toBe("Hello world end.");
  });

  it("removes import / export lines (MDX)", () => {
    const input = `import Foo from "@/x";\nexport const z = 1;\nReal text here.`;
    expect(stripMdx(input)).toBe("Real text here.");
  });

  it("strips JSX tags but keeps text", () => {
    expect(stripMdx("<Foo bar=\"y\">Body text</Foo>")).toBe("Body text");
  });

  it("collapses markdown emphasis and headings", () => {
    expect(stripMdx("# Title\n\n**Bold** and *italic*.")).toBe(
      "Title Bold and italic.",
    );
  });

  it("turns markdown links into their text", () => {
    expect(stripMdx("See [the docs](https://example.com).")).toBe(
      "See the docs.",
    );
  });
});

describe("makeExcerpt", () => {
  it("returns the whole stripped body when shorter than max", () => {
    expect(makeExcerpt("Just a short body.", 200)).toBe("Just a short body.");
  });

  it("truncates long bodies at a word boundary with an ellipsis", () => {
    const long = "word ".repeat(100).trim();
    const ex = makeExcerpt(long, 50);
    expect(ex.endsWith("…")).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(51);
    expect(/word$/.test(ex.replace(/…$/, ""))).toBe(true);
  });
});

describe("buildSearchIndex", () => {
  let tmpDir = "";

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "search-idx-"));

    // Fake collection layout. Only the four indexed collections matter
    // here — `travel` and `culinary` should not leak in even if present.
    const writeMdx = async (rel: string, content: string) => {
      const full = path.join(tmpDir, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content, "utf-8");
    };

    await writeMdx(
      "writing/welcome.mdx",
      `---\ntitle: "Hello world"\ndate: "2026-04-25"\ndescription: "Opener."\ntags: ["meta", "intro"]\n---\n\n# Heading\n\nA short [linked](https://x) body with \`code\` and **emphasis**.`,
    );
    await writeMdx(
      "articles/audit.mdx",
      `---\ntitle: "Audit management"\ndate: "2023-12-01"\n---\n\nLEGO Group case study, MSc thesis.`,
    );
    await writeMdx(
      "work/kombit.mdx",
      `---\ntitle: "KOMBIT VALG"\ndate: "2024-10-01"\ntags: ["dotnet", "angular"]\n---\n\nDanish election platform.`,
    );
    await writeMdx(
      "recommends/oneplus.mdx",
      `---\ntitle: "OnePlus 11"\ndate: "2026-02-01"\n---\n\nGreat phone, fast charger.`,
    );
    // Should NOT be indexed:
    await writeMdx(
      "travel/pisa.mdx",
      `---\ntitle: "Pisa trip"\ndate: "2024-06-01"\n---\n\nThe leaning tower.`,
    );
  });

  afterAll(async () => {
    if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("indexes only the four configured collections", async () => {
    const idx = await buildSearchIndex("en", { contentDir: tmpDir });
    const collections = new Set(idx.entries.map((e) => e.collection));
    expect(Array.from(collections).sort()).toEqual(
      [...INDEXED_COLLECTIONS].sort(),
    );
    expect(idx.entries.find((e) => e.collection === ("travel" as never))).toBeUndefined();
  });

  it("extracts title, description, tags, slug, locale, collection, excerpt", async () => {
    const idx = await buildSearchIndex("en", { contentDir: tmpDir });
    const welcome = idx.entries.find((e) => e.slug === "welcome");
    expect(welcome).toBeDefined();
    expect(welcome!.collection).toBe("writing");
    expect(welcome!.title).toBe("Hello world");
    expect(welcome!.description).toBe("Opener.");
    expect(welcome!.tags).toEqual(["meta", "intro"]);
    expect(welcome!.locale).toBe("en");
    expect(welcome!.id).toBe("writing:welcome");
    // Excerpt is body-derived, MDX-stripped.
    expect(welcome!.excerpt).toContain("linked");
    expect(welcome!.excerpt).not.toContain("`");
    expect(welcome!.excerpt).not.toContain("**");
    expect(welcome!.excerpt).not.toContain("#");
  });

  it("sorts newest-first across collections", async () => {
    const idx = await buildSearchIndex("en", { contentDir: tmpDir });
    const dates = idx.entries
      .map((e) => (e.date ? new Date(e.date).getTime() : 0))
      .filter((d) => d > 0);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  it("marks non-default locale entries as fallback (DA falls back to EN)", async () => {
    const en = await buildSearchIndex("en", { contentDir: tmpDir });
    const da = await buildSearchIndex("da", { contentDir: tmpDir });
    expect(en.entries.every((e) => !e.localeFallback)).toBe(true);
    expect(da.entries.length).toBe(en.entries.length);
    expect(da.entries.every((e) => e.localeFallback === true)).toBe(true);
    expect(da.entries.every((e) => e.locale === "da")).toBe(true);
  });

  it("returns empty when no collections exist", async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), "search-idx-empty-"));
    try {
      const idx = await buildSearchIndex("en", { contentDir: empty });
      expect(idx.entries).toEqual([]);
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });
});
