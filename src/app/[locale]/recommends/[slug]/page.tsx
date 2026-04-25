import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCollection, getItem } from "@/lib/content";
import { mdxComponents } from "@/components/mdx-components";
import { formatDate } from "@/lib/format";

export async function generateStaticParams() {
  const items = await getCollection("recommends");
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem("recommends", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.frontmatter.title,
    description: item.frontmatter.description,
  };
}

export default async function RecommendItem({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = await getItem("recommends", slug);
  if (!item) return notFound();

  const url =
    typeof item.frontmatter.url === "string" ? item.frontmatter.url : null;
  const category =
    typeof item.frontmatter.category === "string"
      ? item.frontmatter.category
      : null;

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <Link
        href="/recommends"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> All recommendations
      </Link>

      {category && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          {category} · Reviewed {formatDate(item.frontmatter.date)}
        </p>
      )}
      <h1 className="mt-3 mb-6">{item.frontmatter.title}</h1>
      {item.frontmatter.description && (
        <p className="text-lg">{item.frontmatter.description}</p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          Visit product <ExternalLink className="h-4 w-4" />
        </a>
      )}

      <hr className="my-10" />

      <div className="prose-content">
        <MDXRemote source={item.body} components={mdxComponents} />
      </div>
    </article>
  );
}
