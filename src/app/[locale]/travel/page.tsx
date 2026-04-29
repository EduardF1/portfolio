import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { TravelEuropeMap } from "@/components/travel-europe-map";
import {
  getCityDestinations,
  getCountryTripCounts,
  getTravelDestinations,
} from "@/lib/travel-locations";
import { getTrips } from "@/lib/trips";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export const metadata = { title: "Travel" };

export default async function TravelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ map?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = (await searchParams) ?? {};
  const initialView: "destinations" | "intensity" | "cities" =
    sp.map === "intensity"
      ? "intensity"
      : sp.map === "cities"
        ? "cities"
        : "destinations";

  const t = await getTranslations("travel");
  const tt = await getTranslations("tooltips");
  const [destinations, photoTrips, tripCounts, cities] = await Promise.all([
    getTravelDestinations(),
    getTrips(),
    getCountryTripCounts(),
    getCityDestinations(),
  ]);

  const recentTrips = photoTrips.slice(0, 6);

  // Map each country to the chronologically earliest trip slug, so the
  // country card and map pin can both deep-link straight into a real
  // photo set rather than just a fragment on this page.
  const earliestByCountry = new Map<string, string>();
  for (const trip of photoTrips) {
    const key = trip.country.toLowerCase();
    const existing = earliestByCountry.get(key);
    if (
      !existing ||
      trip.startsAt < (photoTrips.find((t) => t.slug === existing)?.startsAt ?? "")
    ) {
      earliestByCountry.set(key, trip.slug);
    }
  }

  function firstTripSlug(country: string): string | undefined {
    return earliestByCountry.get(country.toLowerCase());
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
          <TravelEuropeMap
            destinations={destinations.map((d) => ({
              ...d,
              firstTripSlug: firstTripSlug(d.country),
            }))}
            cities={cities}
            tripCounts={tripCounts}
            initialView={initialView}
            labels={{
              toggleAriaLabel: t("mapToggleAriaLabel"),
              destinationsLabel: t("mapDestinations"),
              intensityLabel: t("mapIntensity"),
              citiesLabel: t("mapCities"),
              legendTitle: t("mapLegendTitle"),
              legendUnit: t("mapLegendUnit"),
              // Pre-resolved {one, other} pair for the city tooltip
              // photo-count line. Functions cannot cross the RSC
              // boundary, so we send templates instead.
              photoCountOne: t("photoCount", { count: 1 }),
              photoCountOther: t("photoCount", { count: 999 }).replace(
                "999",
                "{count}",
              ),
            }}
          />
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
              const slug = firstTripSlug(d.country);
              const inner = (
                <>
                  <p className="font-serif text-2xl text-foreground group-hover:text-accent transition-colors">
                    {d.country}
                  </p>
                  <p className="mt-3 text-sm text-foreground-muted">
                    {d.cities.slice(0, 6).join(", ")}
                    {d.cities.length > 6 && ", …"}
                  </p>
                </>
              );
              return (
                <li
                  key={d.slug}
                  id={`country-${d.slug}`}
                  className="bg-background scroll-mt-24"
                >
                  {slug ? (
                    <Link
                      href={`/travel/photos/${slug}`}
                      className="group block p-6 transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="p-6">{inner}</div>
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
                <li
                  key={trip.slug}
                  id={`trip-${trip.slug}`}
                  className="bg-background scroll-mt-24"
                >
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
                        {trip.dateRange} · {t("photoCount", { count: trip.photoCount })}
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
