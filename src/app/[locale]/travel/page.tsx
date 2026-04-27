import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { TravelEuropeMap } from "@/components/travel-europe-map";
import { getTravelDestinations } from "@/lib/travel-locations";
import { getTrips } from "@/lib/trips";

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
  const [destinations, photoTrips] = await Promise.all([
    getTravelDestinations(),
    getTrips(),
  ]);

  // Most-recent trip per country, used to wire the country tile to its
  // matching /travel/photos/[slug] page (the country-name card links
  // straight to the latest trip-details page for that country).
  const latestByCountry = new Map<string, (typeof photoTrips)[number]>();
  for (const tr of photoTrips) {
    const existing = latestByCountry.get(tr.country);
    if (!existing || tr.startsAt > existing.startsAt) {
      latestByCountry.set(tr.country, tr);
    }
  }

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
          {t("culinaryCrossLink")} <span aria-hidden="true">→</span>
        </Link>
      </section>

      {destinations.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
            {t("byCountry")}
          </h2>
          <ul
            className="grid gap-px bg-border/60 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden"
          >
            {destinations.map((d) => {
              const latest = latestByCountry.get(d.country);
              const countryHref = latest
                ? `/travel/photos/${latest.slug}`
                : null;
              return (
                <li
                  key={d.slug}
                  id={`country-${d.slug}`}
                  className="bg-background p-6 scroll-mt-24"
                >
                  {countryHref ? (
                    <Link
                      href={countryHref}
                      className="font-serif text-2xl text-foreground hover:text-accent transition-colors"
                    >
                      {d.country}
                    </Link>
                  ) : (
                    <p className="font-serif text-2xl text-foreground">
                      {d.country}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-foreground-muted">
                    {d.cities.slice(0, 6).join(", ")}
                    {d.cities.length > 6 && ", …"}
                  </p>
                  {countryHref && (
                    <Link
                      href={countryHref}
                      className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      {t("seeTrip")}{" "}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {photoTrips.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
            {t("allTripsKicker")}
          </h2>
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {photoTrips.map((trip) => {
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
                        {t("photoCount", { count: trip.photoCount })}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1 text-sm text-accent group-hover:underline">
                        {t("seeTrip")}{" "}
                        <span aria-hidden="true">→</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </>
  );
}
