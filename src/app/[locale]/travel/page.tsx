import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { TravelEuropeMap } from "@/components/travel-europe-map";
import { getCollection } from "@/lib/content";
import { getTravelDestinations } from "@/lib/travel-locations";
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
  const [trips, destinations] = await Promise.all([
    getCollection("travel"),
    getTravelDestinations(),
  ]);

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

      {destinations.length > 0 && (
        <section className="container-page pb-12">
          <TravelEuropeMap destinations={destinations} />
        </section>
      )}

      <section className="container-page pb-12">
        <Link
          href="/travel/culinary"
          className="inline-flex items-center gap-1 text-sm hover:text-accent transition-colors"
        >
          See the culinary side of these trips <span aria-hidden="true">→</span>
        </Link>
      </section>

      {destinations.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
            By country
          </h2>
          <ul className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {destinations.map((d) => (
              <li
                key={d.slug}
                id={`country-${d.slug}`}
                className="bg-background p-6 scroll-mt-24"
              >
                <p className="font-serif text-2xl text-foreground">{d.country}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                  {d.photoCount} {d.photoCount === 1 ? "photo" : "photos"}
                  {" · "}
                  {d.cities.length} {d.cities.length === 1 ? "city" : "cities"}
                </p>
                <p className="mt-3 text-sm text-foreground-muted">
                  {d.cities.slice(0, 6).join(", ")}
                  {d.cities.length > 6 && ", …"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

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
