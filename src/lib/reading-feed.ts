import "server-only";

/**
 * Auto-pulled "what the wider community is reading" feed.
 *
 * Two sources, both keyless and free:
 *   - dev.to public REST API — top recent articles, tag-filtered to languages
 *     and patterns relevant to this site, current-year only.
 *   - Hacker News Firebase API — top stories from the front page (no per-topic
 *     filter; HN curation is the filter).
 *
 * The `"all"` source merges both and sorts by published date desc.
 *
 * If a source goes away or the schema shifts we degrade silently — an empty
 * array is returned for that source and the consumer hides the section. No
 * build break.
 */

export type ReadingSource = "devto" | "hn" | "all";

export const READING_SOURCES: { id: ReadingSource; label: string }[] = [
  { id: "devto", label: "dev.to" },
  { id: "hn", label: "Hacker News" },
  { id: "all", label: "All sources" },
];

export function isReadingSource(value: unknown): value is ReadingSource {
  return value === "devto" || value === "hn" || value === "all";
}

const DEVTO_URL = "https://dev.to/api/articles?per_page=24&top=7";
const DEVTO_TAG_FILTER = new Set([
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

const HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = (id: number) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const HN_FETCH_DEPTH = 30; // how many top IDs to inspect

export type ReadingItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string; // ISO date
  author: string;
  authorUrl?: string;
  readingMinutes?: number;
  tags: string[];
  source: "devto" | "hn";
};

type DevToArticle = {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  reading_time_minutes?: number;
  tag_list?: string[];
  user?: { name?: string; username?: string };
};

type HNStory = {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  by?: string;
  time?: number; // unix seconds
  score?: number;
};

async function fetchDevTo(limit: number): Promise<ReadingItem[]> {
  let raw: DevToArticle[];
  try {
    const res = await fetch(DEVTO_URL, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    raw = (await res.json()) as DevToArticle[];
  } catch {
    return [];
  }

  const currentYear = new Date().getUTCFullYear();
  return raw
    .filter((a) => new Date(a.published_at).getUTCFullYear() === currentYear)
    .filter((a) => {
      if (!a.tag_list || a.tag_list.length === 0) return true;
      return a.tag_list.some((t) => DEVTO_TAG_FILTER.has(t.toLowerCase()));
    })
    .slice(0, limit)
    .map((a) => ({
      id: `devto-${a.id}`,
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
      source: "devto" as const,
    }));
}

async function fetchHackerNews(limit: number): Promise<ReadingItem[]> {
  let ids: number[];
  try {
    const res = await fetch(HN_TOP_URL, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    ids = (await res.json()) as number[];
  } catch {
    return [];
  }

  const head = ids.slice(0, HN_FETCH_DEPTH);
  const stories = await Promise.all(
    head.map(async (id) => {
      try {
        const r = await fetch(HN_ITEM_URL(id), {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });
        if (!r.ok) return null;
        return (await r.json()) as HNStory | null;
      } catch {
        return null;
      }
    }),
  );

  const currentYear = new Date().getUTCFullYear();
  return stories
    .filter((s): s is HNStory => Boolean(s))
    .filter((s) => s.type === "story" && Boolean(s.url) && Boolean(s.title))
    .filter((s) => {
      if (!s.time) return false;
      return new Date(s.time * 1000).getUTCFullYear() === currentYear;
    })
    .slice(0, limit)
    .map((s) => ({
      id: `hn-${s.id}`,
      title: s.title!,
      url: s.url!,
      description: "",
      publishedAt: new Date((s.time ?? 0) * 1000).toISOString(),
      author: s.by ?? "Hacker News",
      authorUrl: s.by
        ? `https://news.ycombinator.com/user?id=${s.by}`
        : undefined,
      tags: [],
      source: "hn" as const,
    }));
}

export async function getReadingFeed(
  source: ReadingSource = "devto",
  limit = 6,
): Promise<ReadingItem[]> {
  if (source === "devto") return fetchDevTo(limit);
  if (source === "hn") return fetchHackerNews(limit);

  // "all" — fetch both, merge, sort by published desc, take top `limit`
  const [devto, hn] = await Promise.all([
    fetchDevTo(limit),
    fetchHackerNews(limit),
  ]);
  return [...devto, ...hn]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);
}
