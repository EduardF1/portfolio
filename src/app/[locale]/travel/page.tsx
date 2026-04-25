import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { getCollection } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Travel" };

export default async function TravelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("travel");
  const tt = await getTranslations("tooltips");
  const trips = await getCollection("travel");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <SectionHeading
          level="h1"
          kicker={t("kicker")}
          tooltip={tt("travel")}
          headingClassName="max-w-3xl"
        >
          {t("heading")}
        </SectionHeading>
        <p className="mt-6 max-w-2xl text-lg">{t("description")}</p>
      </section>

      <section className="container-page pb-24">
        <div className="flex items-end justify-between mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("tripCount", { count: trips.length })}
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">{t("noTrips")}</p>
          </div>
        ) : (
          <ul className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {trips.map((trip) => {
              const location =
                typeof trip.frontmatter.location === "string"
                  ? trip.frontmatter.location
                  : null;
              const country =
                typeof trip.frontmatter.country === "string"
                  ? trip.frontmatter.country
                  : null;
              const summary =
                typeof trip.frontmatter.summary === "string"
                  ? trip.frontmatter.summary
                  : null;

              return (
                <li key={trip.slug} className="bg-background">
                  <Link
                    href={`/travel/${trip.slug}`}
                    className="group flex h-full flex-col p-8 transition-colors hover:bg-surface"
                  >
                    <h3 className="group-hover:text-accent transition-colors">
                      {trip.frontmatter.title}
                    </h3>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                      {[location, country, formatDate(trip.frontmatter.date)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {summary && (
                      <p className="mt-4 flex-1 text-foreground-muted">
                        {summary}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
