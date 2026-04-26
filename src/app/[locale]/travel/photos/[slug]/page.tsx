import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { getTrip, getTrips } from "@/lib/trips";

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
  };
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

  const headline = trip.primaryCity ?? trip.country;
  const photos: LightboxPhoto[] = trip.photos.map((p) => ({
    src: p.src,
    alt: p.alt || `${trip.country}, ${trip.monthLabel}`,
  }));

  return (
    <article className="container-prose pt-20 md:pt-28 pb-24">
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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-10">
        {trip.dateRange}
        {" · "}
        {tp("photoCount", { count: trip.photoCount })}
      </p>

      <PhotoLightbox
        photos={photos}
        countLabel={tp("countLabel")}
        prevLabel={tp("prev")}
        nextLabel={tp("next")}
        closeLabel={tp("close")}
      />
    </article>
  );
}
