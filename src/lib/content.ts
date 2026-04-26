import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Frontmatter = {
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  // free-form for collection-specific fields
  [key: string]: unknown;
};

export type ContentItem = {
  slug: string;
  collection: string;
  frontmatter: Frontmatter;
  body: string;
};

export type CollectionName =
  | "writing"
  | "articles"
  | "recommends"
  | "travel"
  | "work";

export async function getCollection(
  collection: CollectionName,
): Promise<ContentItem[]> {
  const dir = path.join(CONTENT_DIR, collection);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const items = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx?$/, "");
        const raw = await fs.readFile(path.join(dir, f), "utf-8");
        const { data, content } = matter(raw);
        return {
          slug,
          collection,
          frontmatter: data as Frontmatter,
          body: content,
        } satisfies ContentItem;
      }),
  );
  // newest first
  return items.sort((a, b) => {
    const da = new Date(a.frontmatter.date).getTime();
    const db = new Date(b.frontmatter.date).getTime();
    return db - da;
  });
}

export async function getItem(
  collection: CollectionName,
  slug: string,
): Promise<ContentItem | null> {
  const items = await getCollection(collection);
  return items.find((i) => i.slug === slug) ?? null;
}
