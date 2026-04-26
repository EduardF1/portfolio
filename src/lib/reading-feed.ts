import "server-only";

/**
 * Auto-pulled "what the wider community is reading" feed.
 *
 * Source: dev.to public REST API (no auth required, generous rate limits,
 * stable since 2018). We fetch the top recent articles, filter to the
 * current year so the section never goes stale, and render them as a
 * simple list. Vercel's `revalidate: 3600` keeps the homepage build fast
 * while refreshing the list every hour.
 *
 * If dev.to ever goes away or the schema shifts we degrade silently —
 * `getReadingFeed()` returns an empty array on any error and the consumer
 * hides the section. No build break.
 */

const FEED_URL = "https://dev.to/api/articles?per_page=24&top=7";
const TAG_FILTER = new Set([
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "node",
  "csharp",
  "dotnet",
  "java",
  "spring",
  "php",
  "symfony",
  "webdev",
  "softwareengineering",
  "architecture",
  "testing",
  "devops",
  "ai",
  "llm",
]);

export type ReadingItem = {
  id: number;
  title: string;
  url: string;
  description: string;
  publishedAt: string; // ISO date
  author: string;
  authorUrl?: string;
  readingMinutes?: number;
  tags: string[];
};

type DevToArticle = {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  reading_time_minutes?: number;
  tag_list?: string[];
  user?: { name?: string; username?: string; profile_image_90?: string };
};

export async function getReadingFeed(limit = 6): Promise<ReadingItem[]> {
  let raw: DevToArticle[];
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 3600 }, // 1h ISR
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    raw = (await res.json()) as DevToArticle[];
  } catch {
    return [];
  }

  const currentYear = new Date().getUTCFullYear();
  const filtered = raw
    .filter((a) => {
      const year = new Date(a.published_at).getUTCFullYear();
      return year === currentYear;
    })
    .filter((a) => {
      if (!a.tag_list || a.tag_list.length === 0) return true;
      return a.tag_list.some((t) => TAG_FILTER.has(t.toLowerCase()));
    })
    .slice(0, limit);

  return filtered.map((a) => ({
    id: a.id,
    title: a.title,
    url: a.url,
    description: a.description,
    publishedAt: a.published_at,
    author: a.user?.name ?? a.user?.username ?? "dev.to",
    authorUrl: a.user?.username
      ? `https://dev.to/${a.user.username}`
      : undefined,
    readingMinutes: a.reading_time_minutes,
    tags: a.tag_list ?? [],
  }));
}
