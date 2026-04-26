import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const LETTERS_DIR = path.join(
  process.cwd(),
  "content",
  "recommends",
  "letters",
);

export type Recommendation = {
  slug: string;
  author: string;
  role: string;
  company: string;
  quote: string;
  quoteEn?: string;
  language: "en" | "da";
  source?: "linkedin" | "letter";
  date?: string;
  context?: string;
  portrait?: string;
};

export async function getRecommendations(): Promise<Recommendation[]> {
  let files: string[];
  try {
    files = await fs.readdir(LETTERS_DIR);
  } catch {
    return [];
  }
  const items = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx?$/, "");
        const raw = await fs.readFile(path.join(LETTERS_DIR, f), "utf-8");
        const { data } = matter(raw);
        return {
          slug,
          author: String(data.author ?? ""),
          role: String(data.role ?? ""),
          company: String(data.company ?? ""),
          quote: String(data.quote ?? ""),
          quoteEn: typeof data.quoteEn === "string" ? data.quoteEn : undefined,
          language: data.language === "da" ? "da" : "en",
          source:
            data.source === "linkedin" || data.source === "letter"
              ? data.source
              : undefined,
          date: typeof data.date === "string" ? data.date : undefined,
          context:
            typeof data.context === "string" ? data.context : undefined,
          portrait:
            typeof data.portrait === "string" ? data.portrait : undefined,
        } satisfies Recommendation;
      }),
  );
  return items.sort((a, b) => a.author.localeCompare(b.author));
}
