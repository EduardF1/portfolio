import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCollection, getItem } from "@/lib/content";
import { mdxComponents } from "@/components/mdx-components";
import { findTech } from "@/lib/tech";

export async function generateStaticParams() {
  const items = await getCollection("work");
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem("work", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.frontmatter.title,
    description:
      (item.frontmatter.summary as string | undefined) ??
      item.frontmatter.description,
  };
}

export default async function WorkCaseStudy({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = await getItem("work", slug);
  if (!item) return notFound();

  const fm = item.frontmatter as {
    title: string;
    company?: string;
    companyUrl?: string;
    role?: string;
    period?: string;
    location?: string;
    summary?: string;
    tech?: string[];
    liveUrl?: string;
    liveLabel?: string;
    liveCaveat?: string;
  };

  const kicker =
    fm.company && fm.period ? `${fm.company} · ${fm.period}` : fm.company;

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <Link
        href="/work"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> All work
      </Link>

      {kicker && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          {kicker}
        </p>
      )}
      <h1 className="mt-3 mb-6">{fm.title}</h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-foreground-muted">
        {fm.role && <span>{fm.role}</span>}
        {fm.role && fm.location && <span aria-hidden="true">·</span>}
        {fm.location && <span>{fm.location}</span>}
        {fm.companyUrl && fm.company && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={fm.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-accent"
            >
              {fm.company}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>

      {Array.isArray(fm.tech) && fm.tech.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {fm.tech.map((slug) => {
            const tech = findTech(slug);
            if (!tech) return null;
            return (
              <Link
                key={slug}
                href={{
                  pathname: "/work",
                  query: { tech: slug },
                  hash: "technologies",
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
              >
                {tech.name}
              </Link>
            );
          })}
        </div>
      )}

      {fm.summary && <p className="mt-8 text-lg">{fm.summary}</p>}

      {fm.liveUrl && (
        <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <a
            href={fm.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {fm.liveLabel ?? "Visit the live system"}
            <ArrowUpRight className="h-4 w-4" />
          </a>
          {fm.liveCaveat && (
            <span className="text-xs text-foreground-subtle italic">
              {fm.liveCaveat}
            </span>
          )}
        </div>
      )}

      <hr className="my-10" />

      <div className="prose-content">
        <MDXRemote source={item.body} components={mdxComponents} />
      </div>
    </article>
  );
}
