import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { getCollection } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export const metadata = {
  title: "Culinary",
  alternates: { canonical: "/travel/culinary" },
};

export default async function CulinaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("culinary");
  const dishes = await getCollection("culinary");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          {t("kicker")}
        </p>
        <h1 className="max-w-3xl">{t("heading")}</h1>
        <p className="mt-6 max-w-2xl text-lg">{t("description")}</p>
        <p className="mt-4 max-w-2xl text-foreground-muted">
          {t.rich("subSection", {
            link: (chunks) => (
              <Link
                href="/travel"
                className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>

      <section className="container-page pb-24">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading>{t("dishesHeading")}</SectionHeading>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("dishCount", { count: dishes.length })}
          </p>
        </div>

        {dishes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">
              {t.rich("noDishes", {
                code: (chunks) => (
                  <code className="font-mono text-xs">{chunks}</code>
                ),
              })}
            </p>
          </div>
        ) : (
          <ul className={`grid gap-px bg-border/60 ${responsiveGridColsClass(dishes.length, 3)} rounded-lg overflow-hidden`}>
            {dishes.map((d) => {
              const city =
                typeof d.frontmatter.city === "string" ? d.frontmatter.city : null;
              const country =
                typeof d.frontmatter.country === "string"
                  ? d.frontmatter.country
                  : null;
              const restaurant =
                typeof d.frontmatter.restaurant === "string"
                  ? d.frontmatter.restaurant
                  : null;
              const description =
                typeof d.frontmatter.description === "string"
                  ? d.frontmatter.description
                  : null;
              const verdict =
                typeof d.frontmatter.verdict === "string"
                  ? d.frontmatter.verdict
                  : null;

              return (
                <li key={d.slug} className="bg-background">
                  <article className="flex h-full flex-col p-8">
                    <h3 className="text-foreground">{d.frontmatter.title}</h3>
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                      {[city, country, formatDate(d.frontmatter.date)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {restaurant && (
                      <p className="mt-2 text-sm text-foreground-muted">
                        {restaurant}
                      </p>
                    )}
                    {description && (
                      <p className="mt-4 flex-1 text-foreground">{description}</p>
                    )}
                    {verdict && (
                      <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                        {verdict}
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
