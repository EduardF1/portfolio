import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";

export const metadata = { title: "Personal" };

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
            <ul className="grid gap-px bg-border/60 grid-cols-2 sm:grid-cols-3 rounded-lg overflow-hidden">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="aspect-square bg-surface flex items-center justify-center"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                    {ts("photoTBD")}
                  </span>
                </li>
              ))}
            </ul>
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
            <ul className="grid gap-px bg-border/60 grid-cols-2 sm:grid-cols-3 rounded-lg overflow-hidden">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="aspect-square bg-surface flex items-center justify-center"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                    {ts("photoTBD")}
                  </span>
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
