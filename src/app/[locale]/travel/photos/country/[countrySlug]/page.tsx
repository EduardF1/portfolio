import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import {
  getPhotosByCountry,
  getAllCountrySlugs,
  type TripPhoto,
} from "@/lib/trips";
import { getCitiesByCountry } from "@/lib/travel-locations";

export async function generateStaticParams() {
  const slugs = await getAllCountrySlugs();
  return slugs.map((countrySlug) => ({ countrySlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; countrySlug: string }>;
}) {
  const { countrySlug } = await params;
  const group = await getPhotosByCountry(countrySlug);
  if (!group) return { title: "Not found" };
  return {
    title: `${group.country} · All Photos`,
    description: `${group.photoCount} photo${group.photoCount === 1 ? "" : "s"} from ${group.country} across ${group.cities.length} ${group.cities.length === 1 ? "city" : "cities"}.`,
    alternates: { canonical: `/travel/photos/country/${countrySlug}` },
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
 * Group photos by city using the country-card display order (same
 * logic as the trip page). Cities absent from the card order are
 * appended alphabetically. The `cities` array from
 * `getPhotosByCountry` is already sorted by photoCount desc, so this
 * just applies the canonical country-card order on top.
 */
function groupByCity(
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
  const seen = new Set<string>();
  for (const name of cityOrder) {
    const arr = buckets.get(name);
    if (arr && arr.length > 0) {
      out.push({ city: name, photos: arr });
      seen.add(name);
    }
  }
  const leftover = [...buckets.keys()]
    .filter((c) => !seen.has(c))
    .sort((a, b) => a.localeCompare(b));
  for (const name of leftover) {
    out.push({ city: name, photos: buckets.get(name)! });
  }
  if (other.length > 0) out.push({ city: null, photos: other });
  return out;
}

export default async function CountryPhotosPage({
  params,
}: {
  params: Promise<{ locale: string; countrySlug: string }>;
}) {
  const { locale, countrySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("travel");
  const tp = await getTranslations("tripPhotos");

  const group = await getPhotosByCountry(countrySlug);
  if (!group) return notFound();

  // Resolve canonical country-card city order so sections render in the
  // same order visitors saw on /travel.
  const citiesByCountry = await getCitiesByCountry();
  const matchedCountry = citiesByCountry.find(
    (cc) => cc.country.toLowerCase() === group.country.toLowerCase(),
  );
  const cityOrder = matchedCountry
    ? matchedCountry.cities.map((c) => c.name)
    : [];

  // Flatten all photos then re-group via the canonical order.
  const allPhotos = group.cities.flatMap((c) => c.photos);
  const sections = groupByCity(allPhotos, cityOrder);

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
      <Link
        href="/travel"
        className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-accent mb-12"
      >
        <ArrowLeft className="h-4 w-4" /> {t("all")}
      </Link>

      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {tp("kicker", { country: group.country })}
      </p>
      <h1 className="mt-3 mb-3">{group.country}</h1>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {tp("photoCount", { count: group.photoCount })}
        {" · "}
        {group.cities.length}{" "}
        {group.cities.length === 1 ? "city" : "cities"}
      </p>
      <p className="max-w-2xl text-foreground-muted mb-10">
        {tp("intro", { country: group.country, month: "" }).replace(
          / in $/,
          ".",
        )}
      </p>

      {sections.map((section, sectionIndex) => {
        const sectionPhotos: LightboxPhoto[] = section.photos.map((p) => ({
          src: p.src,
          alt: p.alt || group.country,
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
