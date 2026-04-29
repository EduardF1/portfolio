import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  StickyParallaxStack,
  StickyParallaxItem,
} from "@/components/sticky-parallax";
import { getCollection } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { responsiveGridColsClass } from "@/lib/grid-cols";
import { parallaxCardsEnabled } from "@/lib/proto-flags";

export const metadata = {
  title: "Recommends",
  alternates: { canonical: "/recommends" },
};

export default async function RecommendsPage() {
  const items = await getCollection("recommends");
  const t = await getTranslations("recommends");
  const showParallaxCards = parallaxCardsEnabled();

  const grid = (
    <ul
      className={`grid gap-px bg-border/60 ${responsiveGridColsClass(items.length)} rounded-lg overflow-hidden`}
    >
      {items.map((it, idx) => (
        <li key={it.slug} className="bg-background">
          {showParallaxCards ? (
            <StickyParallaxItem index={idx}>
              <RecommendCard item={it} translate={t} />
            </StickyParallaxItem>
          ) : (
            <RecommendCard item={it} translate={t} />
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          {t("kicker")}
        </p>
        <h1 className="max-w-3xl">{t("heading")}</h1>
        <p className="mt-6 max-w-2xl text-lg">{t("description")}</p>
      </section>

      <section className="container-page pb-24">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">{t("noItems")}</p>
          </div>
        ) : showParallaxCards ? (
          <StickyParallaxStack>{grid}</StickyParallaxStack>
        ) : (
          grid
        )}
      </section>
    </>
  );
}

type RecommendItem = Awaited<ReturnType<typeof getCollection>>[number];

function RecommendCard({
  item: it,
  translate: t,
}: {
  item: RecommendItem;
  translate: (key: string, values?: Record<string, string>) => string;
}) {
  return (
    <Link
      href={`/recommends/${it.slug}`}
      className="group flex h-full flex-col p-8 transition-colors hover:bg-surface"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {String(it.frontmatter.category ?? "")}
      </p>
      <h3 className="mt-3 group-hover:text-accent transition-colors">
        {it.frontmatter.title}
      </h3>
      {it.frontmatter.description && (
        <p className="mt-3 flex-1">{it.frontmatter.description}</p>
      )}
      <p className="mt-5 font-mono text-xs text-foreground-subtle">
        {t("reviewed", { date: formatDate(it.frontmatter.date) })}
      </p>
    </Link>
  );
}
