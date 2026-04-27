import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { BvbFeed } from "@/components/bvb-feed";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export const metadata = { title: "Personal" };

// Captions derived from EXIF DateTimeOriginal + reverse-geocoded GPS
// (see scripts/build-photo-catalogue.mjs and scripts/photo-catalogue.json).
// Photos without EXIF GPS get a date-only caption rather than a guessed location.
const CAR_PHOTOS = [
  {
    src: "/photos/mar-2024-spring-evening.jpg",
    alt: "31 March 2024",
  },
  {
    src: "/photos/may-2024-late-spring.jpg",
    alt: "25 May 2024",
  },
  {
    src: "/photos/nov-2023-autumn.jpg",
    alt: "26 November 2023",
  },
];

const TRAVEL_PHOTOS = [
  {
    src: "/photos/mar-2026-recent-trip.jpg",
    alt: "Ljubljana, Slovenia · 25 March 2026",
  },
  {
    src: "/photos/sep-2025-autumn-afternoon.jpg",
    alt: "Málaga, Spain · 17 September 2025",
  },
  {
    src: "/photos/apr-2025-vienna.jpg",
    alt: "Vienna, Austria · 13 April 2025",
  },
  {
    src: "/photos/mar-2026-pula.jpg",
    alt: "Pula, Croatia · 25 March 2026",
  },
  {
    src: "/photos/sep-2025-gibraltar.jpg",
    alt: "Gibraltar · 15 September 2025",
  },
  {
    src: "/photos/apr-2023-milan.jpg",
    alt: "Milan, Italy · 2 April 2023",
  },
];

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("personal");
  const ts = await getTranslations("personal.sections");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-20">
        <SectionHeading
          level="h1"
          kicker={t("kicker")}
          headingClassName="max-w-3xl"
        >
          {t("heading")}
        </SectionHeading>
        <p className="mt-8 max-w-2xl text-lg">{t("description")}</p>
      </section>

      <section className="border-t border-border/60">
        <div className="container-page py-20 md:py-28 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading kicker={ts("footballKicker")}>
              <span className="underline decoration-[#FDE100] decoration-4 underline-offset-4">
                {ts("footballHeading")}
              </span>
            </SectionHeading>
          </div>
          <div className="md:col-span-8 space-y-8">
            <p className="max-w-2xl text-lg">{ts("footballLede")}</p>
            <p className="max-w-2xl">{ts("footballBody")}</p>
            <figure className="max-w-2xl space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface">
                <Image
                  src="/photos/bvb-yellow-wall-suedtribuene.jpg"
                  alt={ts("footballFigureAlt")}
                  fill
                  sizes="(min-width: 768px) 600px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="space-y-3 text-sm text-foreground-muted">
                <p>{ts("bvbCaptionLead")}</p>
                <p>{ts("bvbCaptionKlopp")}</p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
                  {ts.rich("bvbCaptionCredit", {
                    photographer: () => (
                      <a
                        href="https://commons.wikimedia.org/wiki/File:Suedtribuene.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
                      >
                        Pascal Philp
                      </a>
                    ),
                    license: () => (
                      <a
                        href="https://creativecommons.org/licenses/by-sa/2.0/de/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
                      >
                        CC BY-SA 2.0 DE
                      </a>
                    ),
                  })}
                </p>
              </figcaption>
            </figure>
            <BvbFeed />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container-page py-20 md:py-28 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading kicker={ts("carsKicker")}>
              {ts("carsHeading")}
            </SectionHeading>
          </div>
          <div className="md:col-span-8 space-y-8">
            <p className="max-w-2xl text-lg">{ts("carsLede")}</p>
            <ul
              className={`grid gap-px bg-border/60 ${responsiveGridColsClass(CAR_PHOTOS.length)} rounded-lg overflow-hidden`}
            >
              {CAR_PHOTOS.map((p) => (
                <li
                  key={p.src}
                  className="relative aspect-square bg-surface overflow-hidden"
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 768px) 240px, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container-page py-20 md:py-28 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading kicker={ts("travelKicker")}>
              {ts("travelHeading")}
            </SectionHeading>
          </div>
          <div className="md:col-span-8 space-y-8">
            <p className="max-w-2xl text-lg">{ts("travelLede")}</p>
            <ul
              className={`grid gap-px bg-border/60 ${responsiveGridColsClass(TRAVEL_PHOTOS.length, 2)} rounded-lg overflow-hidden`}
            >
              {TRAVEL_PHOTOS.map((p) => (
                <li
                  key={p.src}
                  className="relative aspect-[4/3] bg-surface overflow-hidden"
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 768px) 360px, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
            <Link
              href="/travel"
              className="inline-flex items-center gap-1 text-sm hover:text-accent"
            >
              {ts("travelLink")} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
