import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { getCollection } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Writing" };

export default async function WritingPage() {
  const [posts, articles] = await Promise.all([
    getCollection("writing"),
    getCollection("articles"),
  ]);
  const t = await getTranslations("tooltips");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          Writing
        </p>
        <h1 className="max-w-3xl">Notes from practice — and from the master&apos;s bench.</h1>
        <p className="mt-6 max-w-2xl text-lg">
          Short essays on engineering and consulting, plus academic articles
          from my MSc in Technology-Based Business Development.
        </p>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading tooltip={t("writingPosts")}>Posts</SectionHeading>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        {posts.length === 0 ? (
          <PlaceholderEmpty>No posts yet.</PlaceholderEmpty>
        ) : (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {posts.map((p) => (
              <li key={p.slug}>
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
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="container-page py-12 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <SectionHeading tooltip={t("writingArticles")}>Articles</SectionHeading>
            <p className="mt-2 max-w-xl">
              Academic writing from my master&apos;s programme at Aarhus University.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </p>
        </div>
        {articles.length === 0 ? (
          <PlaceholderEmpty>No articles published yet.</PlaceholderEmpty>
        ) : (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {articles.map((a) => (
              <li key={a.slug}>
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
              </li>
            ))}
          </ul>
        )}
      </section>
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
