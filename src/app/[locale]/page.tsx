import { ArrowUpRight, Download } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";
import { StatsRow } from "@/components/stats-row";
import { Skills } from "@/components/skills";
import { RecommendationsCarousel } from "@/components/recommendations-carousel";
import { findTech } from "@/lib/tech";
import { getRecommendations } from "@/lib/recommendations";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const recommendations = await getRecommendations();
  const t = await getTranslations();

  return (
    <>
      <Hero />
      <About />
      <section className="border-t border-border/60">
        <div className="container-page py-16 md:py-20">
          <StatsRow />
        </div>
      </section>
      <Experience />
      <Skills />
      {recommendations.length > 0 && (
        <section className="border-t border-border/60">
          <div className="container-page py-20 md:py-28">
            <div className="mb-12 max-w-2xl">
              <SectionHeading
                kicker={t("testimonials.kicker")}
                tooltip={t("tooltips.testimonials")}
              >
                {t("testimonials.heading")}
              </SectionHeading>
            </div>
            <RecommendationsCarousel
              recommendations={recommendations}
              locale={locale === "da" ? "da" : "en"}
            />
          </div>
        </section>
      )}
      <FeaturedWork />
    </>
  );
}

function Hero() {
  const t = useTranslations();
  return (
    <section className="container-page pt-24 md:pt-32 pb-20">
      <div className="grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-7">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
            {t("common.available")}
          </p>
          <h1 className="max-w-4xl">
            {t.rich("home.hero", {
              em: (chunks) => (
                <em className="text-accent not-italic">{chunks}</em>
              ),
            })}
          </h1>
          <p className="mt-8 max-w-2xl text-lg">{t("home.heroSubtitle")}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t("common.seeWork")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="/cv/Eduard_Fischer-Szava_CV_EN.pdf"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-accent hover:text-accent"
              download
            >
              <Download className="h-4 w-4" />
              {t("common.downloadCv")}
            </a>
          </div>
        </div>
        <div className="md:col-span-5 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[400px] aspect-square">
            <Image
              src="/images/hero/portrait.png"
              alt="Eduard Fischer-Szava — portrait"
              fill
              priority
              sizes="(min-width: 768px) 400px, 100vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const t = useTranslations("home");
  return (
    <section className="border-t border-border/60">
      <div className="container-page py-20 md:py-28 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("aboutKicker")}
          </p>
        </div>
        <div className="md:col-span-8 space-y-6 text-lg">
          <p className="text-foreground">
            [Placeholder narrative — to be written by Eduard.] A few paragraphs
            reframing the CV opener as a story rather than bullets. Quality,
            correctness, operational reliability. Diplomatic, structured, calm
            under pressure.
          </p>
          <p>
            [Continued placeholder.] Romanian by birth, Danish by residence,
            European by inclination. Master&apos;s in Technology-Based Business
            Development from Aarhus University.
          </p>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  const t = useTranslations();
  const roles: Array<{
    company: string;
    url: string;
    role: string;
    period: string;
    location: string;
    summary: string;
    tech: string[];
  }> = [
    {
      company: "Mjølner Informatics",
      url: "https://mjolner.dk/en/",
      role: "Software Engineer / Consultant",
      period: "Apr 2026 — Present",
      location: "Aarhus, Denmark",
      summary:
        "Consulting on business-critical software for Danish enterprise and public-sector clients.",
      tech: [],
    },
    {
      company: "Netcompany",
      url: "https://www.netcompany.com/",
      role: "IT Consultant",
      period: "Oct 2024 — Feb 2026",
      location: "Aarhus, Denmark",
      summary:
        "KOMBIT VALG — Denmark's administrative election platform. Full-stack C#/.NET + Angular. Summer 2025 stint at STIL on UA.dk EUD III.",
      tech: ["csharp", "dotnet", "angular", "mssql", "azure-devops"],
    },
    {
      company: "Greenbyte",
      url: "https://www.greenbyte.com/",
      role: "Software Engineer",
      period: "Nov 2021 — Sep 2024",
      location: "Horsens, Denmark",
      summary:
        "Renewable-energy SaaS. .NET Core + EF Core + React. Architect and lead developer of the Flutter mobile companion app.",
      tech: ["dotnet", "react", "flutter", "dart"],
    },
    {
      company: "Boozt Fashion",
      url: "https://www.booztgroup.com/",
      role: "System Engineer",
      period: "Oct 2021 — May 2022",
      location: "Malmö, Sweden",
      summary:
        "Large-scale e-commerce backend in PHP/Symfony. Introduced Kanban; quality and test automation focus.",
      tech: ["php", "symfony", "mysql"],
    },
    {
      company: "Systematic",
      url: "https://systematic.com/",
      role: "Junior Systems Engineer",
      period: "Feb 2021 — Jun 2021",
      location: "Aarhus, Denmark",
      summary:
        "Mission-critical SitaWare suite (Frontline, Edge). Java + Angular. NATO interoperability.",
      tech: ["java", "angular", "junit"],
    },
  ];

  return (
    <section className="border-t border-border/60 bg-surface/30">
      <div className="container-page py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading
              kicker={t("home.experienceKicker")}
              tooltip={t("tooltips.experience")}
            >
              {t("home.experienceHeading")}
            </SectionHeading>
          </div>
          <ol className="md:col-span-8 relative border-l border-border space-y-10 pl-8">
            {roles.map((r) => (
              <li
                key={r.company}
                className="relative grid grid-cols-[1fr_auto] gap-x-6 gap-y-2"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[37px] top-2 h-[10px] w-[10px] rounded-full border-2 border-accent bg-background"
                />
                <div>
                  <h3 className="text-xl">{r.role}</h3>
                  <p className="mt-1 text-foreground">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-accent"
                    >
                      {r.company}
                    </a>
                    {" · "}
                    {r.location}
                  </p>
                </div>
                <p className="font-mono text-xs text-foreground-subtle text-right">
                  {r.period}
                </p>
                <p className="col-span-2 mt-2 max-w-prose">{r.summary}</p>
                {r.tech.length > 0 && (
                  <div
                    className="col-span-2 mt-2 flex flex-wrap gap-2"
                    data-testid={`role-tech-${r.company.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {r.tech.map((slug) => {
                      const tech = findTech(slug);
                      if (!tech) return null;
                      return (
                        <Link
                          key={slug}
                          href={{
                            pathname: "/work",
                            query: { tech: slug },
                            hash: "technologies",
                          }}
                          data-tech-slug={slug}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
                        >
                          {tech.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FeaturedWork() {
  const t = useTranslations();
  const projects = [
    {
      slug: "kombit-valg",
      title: "KOMBIT VALG",
      kicker: "Netcompany · 2024 — present",
      blurb:
        "Full-stack engineering on Denmark's national administrative election platform — C# / .NET, Angular, and the integrations every Danish kommune depends on at poll time.",
    },
    {
      slug: "sitaware",
      title: "SitaWare Frontline & Edge",
      kicker: "Systematic · 2021",
      blurb:
        "Internship on Systematic's NATO-grade C2 suite. Java + Angular feature work, defect triage, and Robot Framework UI test automation under FDD.",
    },
    {
      slug: "greenbyte-saas",
      title: "Greenbyte SaaS + Mobile",
      kicker: "Greenbyte · 2021 — 2024",
      blurb:
        "Three years on a renewable-energy SaaS platform. Full-stack .NET Core + React, and architect and lead developer of the Flutter / Dart mobile companion app.",
    },
    {
      slug: "boozt",
      title: "Boozt e-commerce backend",
      kicker: "Boozt Fashion · 2021 — 2022",
      blurb:
        "PHP / Symfony backend on a large-scale Nordic fashion retailer. Feature work, automated testing, and a Kanban flow brought to the team.",
    },
  ];

  return (
    <section className="border-t border-border/60">
      <div className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between mb-12">
          <SectionHeading
            kicker={t("home.selectedKicker")}
            tooltip={t("tooltips.selectedWork")}
          >
            {t("home.selectedHeading")}
          </SectionHeading>
          <Link
            href="/work"
            className="hidden md:inline-flex items-center gap-1 text-sm hover:text-accent"
          >
            {t("common.allWork")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="grid gap-px bg-border/60 sm:grid-cols-2 rounded-lg overflow-hidden">
          {projects.map((p) => (
            <li key={p.slug} className="bg-background">
              <Link
                href={`/work/${p.slug}`}
                className="group block h-full p-8 transition-colors hover:bg-surface"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                  {p.kicker}
                </p>
                <h3 className="mt-3 group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-3">{p.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
