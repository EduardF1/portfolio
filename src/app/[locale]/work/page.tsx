import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GithubFeed } from "@/components/github-feed";
import { GithubStats } from "@/components/github-stats";
import { SectionHeading } from "@/components/section-heading";
import { getRepos } from "@/lib/github";
import { findTech } from "@/lib/tech";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export const metadata = {
  title: "Work",
  alternates: { canonical: "/work" },
};

// Case-study titles + kickers stay in source: titles are proper nouns, kickers
// are company + year ranges (also proper-noun adjacent). Only the blurbs go
// through the translation files (work.blurbs.<slug>).
const selected = [
  {
    slug: "kombit-valg",
    title: "KOMBIT VALG",
    kicker: "Netcompany · 2024 – present",
    stack: ["C#", ".NET", "Angular", "MS SQL", "Azure DevOps"],
  },
  {
    slug: "sitaware",
    title: "SitaWare Frontline & Edge",
    kicker: "Systematic · 2021",
    stack: ["Java", "Spring", "Angular", "JUnit"],
  },
  {
    slug: "greenbyte-saas",
    title: "Greenbyte SaaS + Mobile",
    kicker: "Greenbyte · 2021 – 2024",
    stack: ["C#", ".NET Core", "EF Core", "React", "Flutter/Dart"],
  },
  {
    slug: "boozt",
    title: "Boozt e-commerce backend",
    kicker: "Boozt Fashion · 2021 – 2022",
    stack: ["PHP", "Symfony", "MySQL", "PHPUnit"],
  },
];

// Distinct stack chips across the selected list, used to render the
// filter row above the case-study grid. Deduplicated, in insertion order.
const STACK_CHIPS = Array.from(
  new Set(selected.flatMap((s) => s.stack)),
);

function normalizeStack(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string; stack?: string }>;
}) {
  const { tech: techSlug, stack: stackParam } = await searchParams;
  const tech = techSlug ? findTech(techSlug) : null;
  const stackFilter = stackParam ? normalizeStack(stackParam) : null;
  const visibleSelected = stackFilter
    ? selected.filter((s) =>
        s.stack.some((label) => normalizeStack(label) === stackFilter),
      )
    : selected;
  const repos = await getRepos();
  const t = await getTranslations("work");
  const tt = await getTranslations("tooltips");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          {t("kicker")}
        </p>
        <h1 className="max-w-3xl">{t("heading")}</h1>
        <p className="mt-6 max-w-2xl text-lg">{t("description")}</p>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading tooltip={tt("selectedWork")}>
            {t("selected")}
          </SectionHeading>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("casesOf", {
              visible: visibleSelected.length,
              total: selected.length,
            })}
          </p>
        </div>
        <nav
          aria-label={t("filterAria")}
          className="mb-6 flex flex-wrap gap-2"
        >
          <Link
            href="/work"
            scroll={false}
            aria-current={stackFilter === null ? "page" : undefined}
            className={
              "rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors " +
              (stackFilter === null
                ? "bg-accent text-accent-foreground"
                : "border border-border text-foreground-muted hover:border-accent hover:text-accent")
            }
          >
            {t("all")}
          </Link>
          {STACK_CHIPS.map((label) => {
            const slug = normalizeStack(label);
            const active = stackFilter === slug;
            return (
              <Link
                key={label}
                href={{ pathname: "/work", query: { stack: slug } }}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors " +
                  (active
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-foreground-muted hover:border-accent hover:text-accent")
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <ul
          className={`grid gap-px bg-border/60 ${responsiveGridColsClass(visibleSelected.length, 2)} rounded-lg overflow-hidden`}
        >
          {visibleSelected.map((p) => (
            <li key={p.slug} className="bg-background">
              <Link
                href={`/work/${p.slug}`}
                className="group flex h-full flex-col p-8 transition-colors hover:bg-surface"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                  {p.kicker}
                </p>
                <h3 className="mt-3 group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1">{t(`blurbs.${p.slug}`)}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground-subtle"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm text-foreground-muted group-hover:text-accent">
                  {t("readCaseStudy")} <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="technologies"
        data-tech={tech?.slug ?? ""}
        className="container-page py-12 scroll-mt-24"
      >
        <div className="flex items-end justify-between mb-8">
          <SectionHeading
            kicker={t("technologiesKicker")}
            tooltip={tt("technologies")}
          >
            {tech ? tech.name : t("pickATechnology")}
          </SectionHeading>
        </div>
        {tech ? (
          <div className="max-w-2xl">
            <p className="text-lg">{tech.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={tech.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-accent"
              >
                {t("officialDocs")} <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/work"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
              >
                {t("clearFilter")}
              </Link>
            </div>
          </div>
        ) : (
          <p className="max-w-2xl text-foreground-muted">
            {t.rich("techHint", {
              home: (chunks) => (
                <Link href="/" className="underline hover:text-accent">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
      </section>

      <section className="container-page py-12 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <SectionHeading tooltip={tt("openSource")}>
              {t("openSourceHeading")}
            </SectionHeading>
            <p className="mt-2 max-w-xl">
              {t("openSourceLead", {
                count: repos.length,
                years: new Date().getFullYear() - 2019,
              })}
            </p>
          </div>
        </div>
        {/* GitHub aggregate stats — sits above the repo grid as a quick
            "at a glance" summary. Server Component, ISR-cached 1h. */}
        <div className="mb-8">
          <GithubStats />
        </div>
        {repos.length > 0 ? (
          <GithubFeed
            repos={repos}
            initialLanguage={tech?.ghLanguage ?? null}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">{t("feedUnavailable")}</p>
          </div>
        )}
      </section>
    </>
  );
}
