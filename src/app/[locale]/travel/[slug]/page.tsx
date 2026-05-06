import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCollection, getItem } from "@/lib/content";
import { mdxComponents } from "@/components/mdx-components";
import { mdxOptions } from "@/lib/mdx-options";
import { formatDate } from "@/lib/format";
import { PhotoGallery, type Photo } from "@/components/photo-gallery";
import { ArticleJsonLd } from "@/components/structured-data";

export async function generateStaticParams() {
  const trips = await getCollection("travel");
  return trips.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem("travel", slug);
  if (!item) return { title: "Not found" };
  const summary =
    typeof item.frontmatter.summary === "string"
      ? item.frontmatter.summary
      : item.frontmatter.description;
  return {
    title: item.frontmatter.title,
    description: summary,
    alternates: { canonical: `/travel/${slug}` },
  };
}

export default async function TravelItem({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("travel");
  const item = await getItem("travel", slug);
  if (!item) return notFound();

  const location =
    typeof item.frontmatter.location === "string"
      ? item.frontmatter.location
      : null;
  const country =
    typeof item.frontmatter.country === "string"
      ? item.frontmatter.country
      : null;
  const summary =
    typeof item.frontmatter.summary === "string"
      ? item.frontmatter.summary
      : null;
  const photos = Array.isArray(item.frontmatter.photos)
    ? (item.frontmatter.photos as Photo[])
    : [];

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <ArticleJsonLd
        title={item.frontmatter.title}
        description={summary ?? undefined}
        date={item.frontmatter.date}
        path={`/travel/${slug}`}
        locale={locale}
      />
      <Link
        href="/travel"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> {t("all")}
      </Link>

      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {[location, country, formatDate(item.frontmatter.date)]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <h1 className="mt-3 mb-6">{item.frontmatter.title}</h1>
      {summary && <p className="text-lg">{summary}</p>}

      <hr className="my-10" />

      <div className="prose-content">
        <MDXRemote
          source={item.body}
          components={mdxComponents}
          options={mdxOptions}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-12">
          <PhotoGallery photos={photos} />
        </div>
      )}
    </article>
  );
}
