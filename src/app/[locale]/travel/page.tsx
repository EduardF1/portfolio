import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { TravelEuropeMap } from "@/components/travel-europe-map";
import { getCollection } from "@/lib/content";
import { getTravelDestinations } from "@/lib/travel-locations";
import { getTrips } from "@/lib/trips";
import { formatDate } from "@/lib/format";
import { responsiveGridColsClass } from "@/lib/grid-cols";

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
  const [trips, destinations, photoTrips] = await Promise.all([
    getCollection("travel"),
    getTravelDestinations(),
    getTrips(),
  ]);

  // Most-recent trip per country, used to wire the country grid up to
  // its corresponding /travel/photos/[slug] page.
  const latestByCountry = new Map<string, (typeof photoTrips)[number]>();
  for (const tr of photoTrips) {
    const existing = latestByCountry.get(tr.country);
    if (!existing || tr.startsAt > existing.startsAt) {
      latestByCountry.set(tr.country, tr);
    }
  }
  const recentTrips = photoTrips.slice(0, 6);

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
          <ul
            className={`grid gap-px bg-border/60 ${responsiveGridColsClass(destinations.length)} rounded-lg overflow-hidden`}
          >
            {destinations.map((d) => {
              const latest = latestByCountry.get(d.country);
              return (
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
                  {latest && (
                    <Link
                      href={`/travel/photos/${latest.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      {t("viewTrips")} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {recentTrips.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
            {t("recentTripsKicker")}
          </h2>
          <p className="font-serif text-2xl text-foreground mb-6">
            {t("recentTripsHeading")}
          </p>
          <ul className={`grid gap-4 ${responsiveGridColsClass(recentTrips.length)}`}>
            {recentTrips.map((trip) => {
              const cover = trip.photos[0];
              const headline = trip.primaryCity ?? trip.country;
              return (
                <li key={trip.slug} className="bg-background">
                  <Link
                    href={`/travel/photos/${trip.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-border overflow-hidden transition-colors hover:bg-surface"
                  >
                    <div
                      className="relative aspect-[4/3] bg-surface"
                      aria-hidden="true"
                    >
                      <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
                        {trip.country}
                      </p>
                      <p className="mt-1 font-serif text-lg text-foreground group-hover:text-accent transition-colors">
                        {headline}, {trip.monthLabel}
                      </p>
                      <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
                        {trip.dateRange} · {trip.photoCount}{" "}
                        {trip.photoCount === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
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
          <ul
            className={`grid gap-px bg-border/60 ${responsiveGridColsClass(trips.length)} rounded-lg overflow-hidden`}
          >
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
