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
  /**
   * Link target for the recommender's name on a slide. If absent, the
   * carousel falls back to a LinkedIn people-search URL using the author
   * name + company. Setting this explicitly is preferred once the user
   * has confirmed the right profile URL.
   */
  linkedinUrl?: string;
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
          linkedinUrl:
            typeof data.linkedinUrl === "string" ? data.linkedinUrl : undefined,
        } satisfies Recommendation;
      }),
  );
  return items.sort((a, b) => a.author.localeCompare(b.author));
}
