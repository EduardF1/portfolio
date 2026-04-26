import { getCollection } from "@/lib/content";

const SITE = "https://eduardfischer.dev";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const [writing, articles] = await Promise.all([
    getCollection("writing"),
    getCollection("articles"),
  ]);
  const items = [...writing, ...articles].sort((a, b) => {
    const da = new Date(a.frontmatter.date).getTime();
    const db = new Date(b.frontmatter.date).getTime();
    return db - da;
  });

  const lastBuild = new Date(
    items[0]?.frontmatter.date ?? Date.now(),
  ).toUTCString();

  const itemXml = items
    .map((item) => {
      const url = `${SITE}/writing/${item.slug}`;
      const title = escapeXml(item.frontmatter.title ?? item.slug);
      const description = escapeXml(
        typeof item.frontmatter.description === "string"
          ? item.frontmatter.description
          : "",
      );
      const pubDate = new Date(item.frontmatter.date).toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Eduard Fischer-Szava — Posts and articles</title>
    <link>${SITE}/writing</link>
    <atom:link href="${SITE}/writing/rss.xml" rel="self" type="application/rss+xml" />
    <description>Short essays from practice and academic articles from Eduard's MSc at Aarhus University.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${itemXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
