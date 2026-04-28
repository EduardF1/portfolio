import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { ReadingFeed } from "@/components/reading-feed";
import {
  StickyParallaxStack,
  StickyParallaxItem,
} from "@/components/sticky-parallax";
import { getCollection } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { isReadingSource } from "@/lib/reading-feed";
import { readingMinutes, formatReadingTime } from "@/lib/reading-time";
import { parallaxCardsEnabled } from "@/lib/proto-flags";

export const metadata = { title: "Posts and articles" };

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ reading?: string }>;
}) {
  const [posts, articles, sp] = await Promise.all([
    getCollection("writing"),
    getCollection("articles"),
    searchParams,
  ]);
  const t = await getTranslations("tooltips");
  const tw = await getTranslations("writing");
  const source = isReadingSource(sp.reading) ? sp.reading : "devto";
  const showParallaxCards = parallaxCardsEnabled();

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          {tw("kicker")}
        </p>
        <h1 className="max-w-3xl">{tw("heading")}</h1>
        <p className="mt-6 max-w-2xl text-lg">{tw("description")}</p>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading tooltip={t("writingPosts")}>
            {tw("posts")}
          </SectionHeading>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {tw("postCount", { count: posts.length })}
          </p>
        </div>
        {posts.length === 0 ? (
          <PlaceholderEmpty>{tw("noPosts")}</PlaceholderEmpty>
        ) : (
          <MaybeParallax enabled={showParallaxCards}>
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {posts.map((p, idx) => (
                <li key={p.slug}>
                  <MaybeStickyItem enabled={showParallaxCards} index={idx}>
                    <Link
                      href={`/writing/${p.slug}`}
                      className="group flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:justify-between md:gap-8 hover:bg-surface px-2 -mx-2 rounded-md transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-xl group-hover:text-accent transition-colors">
                          {p.frontmatter.title}
                        </h3>
                        {p.frontmatter.description && (
                          <p className="mt-1 text-sm">{p.frontmatter.description}</p>
                        )}
                      </div>
                      <p className="font-mono text-xs text-foreground-subtle whitespace-nowrap">
                        {formatDate(p.frontmatter.date)}
                        {readingMinutes(p.body) > 0 && (
                          <>
                            {" · "}
                            {formatReadingTime(readingMinutes(p.body))}
                          </>
                        )}
                      </p>
                    </Link>
                  </MaybeStickyItem>
                </li>
              ))}
            </ul>
          </MaybeParallax>
        )}
      </section>

      <section className="container-page py-12 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <SectionHeading tooltip={t("writingArticles")}>
              {tw("articles")}
            </SectionHeading>
            <p className="mt-2 max-w-xl">{tw("articlesLead")}</p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {tw("articleCount", { count: articles.length })}
          </p>
        </div>
        {articles.length === 0 ? (
          <PlaceholderEmpty>{tw("noArticles")}</PlaceholderEmpty>
        ) : (
          <MaybeParallax enabled={showParallaxCards}>
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {articles.map((a, idx) => (
                <li key={a.slug}>
                  <MaybeStickyItem enabled={showParallaxCards} index={idx}>
                    <Link
                      href={`/writing/${a.slug}`}
                      className="group flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:justify-between md:gap-8 hover:bg-surface px-2 -mx-2 rounded-md transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-xl group-hover:text-accent transition-colors">
                          {a.frontmatter.title}
                        </h3>
                        {a.frontmatter.description && (
                          <p className="mt-1 text-sm">{a.frontmatter.description}</p>
                        )}
                        {typeof a.frontmatter.publication === "string" && (
                          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                            {a.frontmatter.publication}
                          </p>
                        )}
                      </div>
                      <p className="font-mono text-xs text-foreground-subtle whitespace-nowrap">
                        {formatDate(a.frontmatter.date)}
                      </p>
                      <ArrowUpRight className="hidden md:inline h-4 w-4 text-foreground-subtle group-hover:text-accent" />
                    </Link>
                  </MaybeStickyItem>
                </li>
              ))}
            </ul>
          </MaybeParallax>
        )}
      </section>

      <ReadingFeed
        tooltip={t("readingFeed")}
        source={source}
        limit={6}
      />
    </>
  );
}

function PlaceholderEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      <p className="text-foreground-subtle">{children}</p>
    </div>
  );
}

function MaybeParallax({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return <StickyParallaxStack>{children}</StickyParallaxStack>;
}

function MaybeStickyItem({
  enabled,
  index,
  children,
}: {
  enabled: boolean;
  index: number;
  children: React.ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return <StickyParallaxItem index={index}>{children}</StickyParallaxItem>;
}
