import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * A single entry in the site-wide search index.
 *
 * One per MDX file across the four indexable collections
 * (writing, articles, work, recommends). Long-form MDX is currently
 * EN-only — the DA index falls back to the same EN entries with a small
 * `EN` badge surfaced at the UI layer (see `localeFallback`).
 */
export type SearchEntry = {
  /** Stable identifier — `${collection}:${slug}`. */
  id: string;
  /** MDX collection. */
  collection: SearchCollection;
  /** File slug used for the route. */
  slug: string;
  /** Locale this entry is intended for. */
  locale: string;
  /**
   * If `true`, the entry is shown under `locale` but its content is in
   * the source locale (currently EN). Surfaces an `EN` badge in the UI.
   */
  localeFallback?: boolean;
  /** Frontmatter title. */
  title: string;
  /** Frontmatter description, if present. */
  description?: string;
  /** Frontmatter tags, if present. */
  tags: string[];
  /** First ~200 chars of the body, MDX-stripped. */
  excerpt: string;
  /** Frontmatter ISO date string, if present (used to sort newest-first). */
  date?: string;
};

export type SearchCollection = "writing" | "articles" | "work" | "recommends";

export const INDEXED_COLLECTIONS: readonly SearchCollection[] = [
  "writing",
  "articles",
  "work",
  "recommends",
] as const;

export type SearchIndex = {
  locale: string;
  generatedAt: string;
  entries: SearchEntry[];
};

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Strip MDX/Markdown to plain text for the excerpt. Conservative — keeps
 * meaning, drops noise. Order matters: code fences first so the inner
 * content does not get tokenised, then images/links, then everything else.
 */
export function stripMdx(input: string): string {
  let s = input;
  // fenced code blocks
  s = s.replace(/```[\s\S]*?```/g, " ");
  // inline code
  s = s.replace(/`[^`]*`/g, " ");
  // import/export lines (MDX)
  s = s.replace(/^\s*(import|export)\s.*$/gm, " ");
  // JSX-ish tags (single line; nested attributes ok)
  s = s.replace(/<\/?[A-Za-z][^>]*>/g, " ");
  // HTML comments
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // images ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // headings, blockquote, list markers
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/^\s{0,3}>\s?/gm, "");
  s = s.replace(/^\s*[-*+]\s+/gm, "");
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  // emphasis
  s = s.replace(/(\*\*|__)(.*?)\1/g, "$2");
  s = s.replace(/(\*|_)(.*?)\1/g, "$2");
  // horizontal rule
  s = s.replace(/^---+$/gm, " ");
  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Take the first ~`max` characters of the stripped MDX, breaking at a
 * word boundary when possible.
 */
export function makeExcerpt(body: string, max = 200): string {
  const stripped = stripMdx(body);
  if (stripped.length <= max) return stripped;
  const cut = stripped.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s.,;:!?-]+$/, "")}…`;
}

type BuildOptions = {
  /** Override content directory (used by tests). */
  contentDir?: string;
  /** Override the indexed collections (used by tests). */
  collections?: readonly SearchCollection[];
};

async function readEntriesForCollection(
  contentDir: string,
  collection: SearchCollection,
): Promise<Omit<SearchEntry, "locale" | "localeFallback">[]> {
  const dir = path.join(contentDir, collection);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const entries = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx?$/, "");
        const raw = await fs.readFile(path.join(dir, f), "utf-8");
        const { data, content } = matter(raw);
        const fmTitle =
          typeof data.title === "string" ? data.title : slug;
        const fmDescription =
          typeof data.description === "string" ? data.description : undefined;
        const fmTags = Array.isArray(data.tags)
          ? data.tags.filter((t): t is string => typeof t === "string")
          : [];
        const fmDate = typeof data.date === "string" ? data.date : undefined;
        return {
          id: `${collection}:${slug}`,
          collection,
          slug,
          title: fmTitle,
          description: fmDescription,
          tags: fmTags,
          excerpt: makeExcerpt(content),
          date: fmDate,
        } satisfies Omit<SearchEntry, "locale" | "localeFallback">;
      }),
  );
  return entries;
}

/**
 * Build a search index for a single locale.
 *
 * Long-form MDX is EN-only today, so for non-EN locales we mark every
 * entry with `localeFallback: true` and the same source rows. The UI
 * surfaces this with a small `EN` badge per result.
 */
export async function buildSearchIndex(
  locale: string,
  options: BuildOptions = {},
): Promise<SearchIndex> {
  const contentDir = options.contentDir ?? DEFAULT_CONTENT_DIR;
  const collections = options.collections ?? INDEXED_COLLECTIONS;
  const localeFallback = locale !== "en";

  const all = await Promise.all(
    collections.map((c) => readEntriesForCollection(contentDir, c)),
  );
  const flat = all.flat();
  // Newest first when a date is present; entries without date sink.
  flat.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const entries: SearchEntry[] = flat.map((e) => ({
    ...e,
    locale,
    ...(localeFallback ? { localeFallback: true } : {}),
  }));

  return {
    locale,
    generatedAt: new Date().toISOString(),
    entries,
  };
}
