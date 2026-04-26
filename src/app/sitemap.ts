import type { MetadataRoute } from "next";
import { getCollection } from "@/lib/content";
import { getTrips } from "@/lib/trips";
import { routing } from "@/i18n/routing";

const SITE = "https://eduardfischer.dev";
const STATIC_PATHS = [
  "",
  "/work",
  "/writing",
  "/recommends",
  "/personal",
  "/travel",
  "/travel/culinary",
  "/now",
  "/my-story",
  "/contact",
];

function url(locale: string, path: string): string {
  if (locale === routing.defaultLocale) return `${SITE}${path}`;
  return `${SITE}/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [writing, articles, recommends, travel, work, culinary, trips] =
    await Promise.all([
      getCollection("writing"),
      getCollection("articles"),
      getCollection("recommends"),
      getCollection("travel"),
      getCollection("work"),
      getCollection("culinary"),
      getTrips(),
    ]);

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of routing.locales) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: url(locale, p),
        lastModified: now,
        changeFrequency: p === "" || p === "/writing" ? "weekly" : "monthly",
        priority: p === "" ? 1 : 0.7,
      });
    }
    for (const item of writing) {
      entries.push({
        url: url(locale, `/writing/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const item of articles) {
      entries.push({
        url: url(locale, `/writing/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const item of recommends) {
      entries.push({
        url: url(locale, `/recommends/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const item of travel) {
      entries.push({
        url: url(locale, `/travel/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const item of culinary) {
      entries.push({
        url: url(locale, `/travel/culinary/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const item of work) {
      entries.push({
        url: url(locale, `/work/${item.slug}`),
        lastModified: new Date(item.frontmatter.date ?? now),
      });
    }
    for (const trip of trips) {
      entries.push({
        url: url(locale, `/travel/photos/${trip.slug}`),
        lastModified: new Date(trip.endsAt ?? now),
      });
    }
  }

  return entries;
}
