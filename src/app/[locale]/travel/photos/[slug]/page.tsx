import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { getTrip, getTrips, type TripPhoto } from "@/lib/trips";
import { getCitiesByCountry } from "@/lib/travel-locations";
import { ImageGalleryJsonLd } from "@/components/structured-data";

export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) return { title: "Not found" };
  const where = trip.primaryCity ?? trip.country;
  return {
    title: `${where}, ${trip.monthLabel}`,
    description: `${trip.photoCount} photo${trip.photoCount === 1 ? "" : "s"} from ${trip.country}, ${trip.dateRange}.`,
    // Per-route canonical so each trip page advertises itself rather
    // than inheriting the layout's `/` canonical (Lighthouse SEO win).
    alternates: { canonical: `/travel/photos/${slug}` },
  };
}

function citySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Group trip photos by city, in the order specified by the country
 * card. Cities not represented in the country card order fall through
 * to the end (alphabetically). Photos without a `city` value are
 * collected under an "Other" bucket and rendered last.
 *
 * This is exported (and pure) so the unit test can exercise the
 * ordering logic without rendering React.
 */
export function groupTripPhotosByCity(
  photos: readonly TripPhoto[],
  cityOrder: readonly string[],
): { city: string | null; photos: TripPhoto[] }[] {
  const buckets = new Map<string, TripPhoto[]>();
  const other: TripPhoto[] = [];
  for (const p of photos) {
    if (!p.city) {
      other.push(p);
      continue;
    }
    const arr = buckets.get(p.city) ?? [];
    if (arr.length === 0) buckets.set(p.city, arr);
    arr.push(p);
  }

  const out: { city: string | null; photos: TripPhoto[] }[] = [];
  // First emit cities in the requested order.
  const seen = new Set<string>();
  for (const name of cityOrder) {
    const arr = buckets.get(name);
    if (arr && arr.length > 0) {
      out.push({ city: name, photos: arr });
      seen.add(name);
    }
  }
  // Then any cities present in the trip but missing from the country
  // card order, alphabetically.
  const leftover = [...buckets.keys()]
    .filter((c) => !seen.has(c))
    .sort((a, b) => a.localeCompare(b));
  for (const name of leftover) {
    out.push({ city: name, photos: buckets.get(name)! });
  }
  if (other.length > 0) {
    out.push({ city: null, photos: other });
  }
  return out;
}

export default async function TripPhotosPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("travel");
  const tp = await getTranslations("tripPhotos");
  const trip = await getTrip(slug);
  if (!trip) return notFound();

  // Resolve the country-card city order so the per-trip city sections
  // render in the same order visitors saw on /travel.
  const citiesByCountry = await getCitiesByCountry();
  const matchedCountry = citiesByCountry.find(
    (cc) => cc.country.toLowerCase() === trip.country.toLowerCase(),
  );
  const cityOrder = matchedCountry
    ? matchedCountry.cities.map((c) => c.name)
    : [];

  const sections = groupTripPhotosByCity(trip.photos, cityOrder);

  const headline = trip.primaryCity ?? trip.country;

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <ImageGalleryJsonLd
        title={`${headline}, ${trip.monthLabel}`}
        description={`${trip.photoCount} photo${trip.photoCount === 1 ? "" : "s"} from ${trip.country}, ${trip.dateRange}.`}
        date={trip.endsAt ?? undefined}
        path={`/travel/photos/${slug}`}
        locale={locale}
        images={trip.photos.slice(0, 12).map((p) => p.src)}
      />
      <Link
        href="/travel"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> {t("all")}
      </Link>

      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {tp("kicker", { country: trip.country })}
      </p>
      <h1 className="mt-3 mb-3">
        {headline}, {trip.monthLabel}
      </h1>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {trip.dateRange}
        {" · "}
        {tp("photoCount", { count: trip.photoCount })}
      </p>
      <p className="max-w-2xl text-foreground-muted mb-10">
        {tp("intro", { country: trip.country, month: trip.monthLabel })}
      </p>

      {sections.map((section, sectionIndex) => {
        const sectionPhotos: LightboxPhoto[] = section.photos.map((p) => ({
          src: p.src,
          // `p.alt` already prefers the catalogue caption (landmark +
          // city + month) thanks to clusterTrips; the country/month
          // fallback only kicks in when the catalogue lacks both.
          alt: p.alt || `${trip.country}, ${trip.monthLabel}`,
        }));
        const heading = section.city ?? tp("otherCity");
        const anchorId = section.city
          ? `city-${citySlug(section.city)}`
          : `city-other`;
        const sparse = section.photos.length < 3;
        return (
          <section
            key={anchorId}
            id={anchorId}
            className="scroll-mt-24 mb-12"
            data-testid="city-section"
            data-city={section.city ?? ""}
          >
            <h2 className="font-serif text-2xl text-foreground mb-2">
              {heading}
            </h2>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-4">
              {tp("photoCount", { count: section.photos.length })}
              {sparse ? ` · ${tp("sparseCity")}` : ""}
            </p>
            <PhotoLightbox
              photos={sectionPhotos}
              countLabel={tp("countLabel")}
              prevLabel={tp("prev")}
              nextLabel={tp("next")}
              closeLabel={tp("close")}
              priorityFirstImage={sectionIndex === 0}
            />
          </section>
        );
      })}
    </article>
  );
}
