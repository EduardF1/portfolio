import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCollection, getItem } from "@/lib/content";
import { mdxComponents } from "@/components/mdx-components";
import { formatDate } from "@/lib/format";

export async function generateStaticParams() {
  const [posts, articles] = await Promise.all([
    getCollection("writing"),
    getCollection("articles"),
  ]);
  return [...posts, ...articles].map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item =
    (await getItem("writing", slug)) ?? (await getItem("articles", slug));
  if (!item) return { title: "Not found" };
  return {
    title: item.frontmatter.title,
    description: item.frontmatter.description,
  };
}

export default async function WritingItem({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item =
    (await getItem("writing", slug)) ?? (await getItem("articles", slug));
  if (!item) return notFound();

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <Link
        href="/writing"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> All writing
      </Link>

      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {formatDate(item.frontmatter.date)}
        {typeof item.frontmatter.publication === "string" && (
          <span> · {item.frontmatter.publication}</span>
        )}
      </p>
      <h1 className="mt-3 mb-6">{item.frontmatter.title}</h1>
      {item.frontmatter.description && (
        <p className="text-lg">{item.frontmatter.description}</p>
      )}

      <hr className="my-10" />

      <div className="prose-content">
        <MDXRemote source={item.body} components={mdxComponents} />
      </div>
    </article>
  );
}
