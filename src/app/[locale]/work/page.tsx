import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GithubFeed } from "@/components/github-feed";
import { SectionHeading } from "@/components/section-heading";
import { getRepos } from "@/lib/github";
import { findTech } from "@/lib/tech";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export const metadata = { title: "Work" };

const selected = [
  {
    slug: "kombit-valg",
    title: "KOMBIT VALG",
    kicker: "Netcompany · 2024 – present",
    blurb:
      "Full-stack engineering on Denmark's national administrative election platform. C#/.NET on the back end, Angular on the web.",
    stack: ["C#", ".NET", "Angular", "MS SQL", "Azure DevOps"],
  },
  {
    slug: "sitaware",
    title: "SitaWare Frontline & Edge",
    kicker: "Systematic · 2021",
    blurb:
      "Internship on Systematic's NATO-grade command-and-control suite. Java and Angular feature work, plus Robot Framework UI test automation.",
    stack: ["Java", "Spring", "Angular", "JUnit"],
  },
  {
    slug: "greenbyte-saas",
    title: "Greenbyte SaaS + Mobile",
    kicker: "Greenbyte · 2021 – 2024",
    blurb:
      "Three years on a renewable-energy SaaS platform. Full-stack .NET Core and React, plus architect and lead developer of the Flutter mobile companion.",
    stack: ["C#", ".NET Core", "EF Core", "React", "Flutter/Dart"],
  },
  {
    slug: "boozt",
    title: "Boozt e-commerce backend",
    kicker: "Boozt Fashion · 2021 – 2022",
    blurb:
      "PHP / Symfony backend for one of the larger Nordic fashion retailers. Feature work, automated testing, and a Kanban flow brought to the team.",
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
  const t = await getTranslations("tooltips");

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          Work
        </p>
        <h1 className="max-w-3xl">Selected case studies.</h1>
        <p className="mt-6 max-w-2xl text-lg">
          Case studies of business-critical systems I have helped build,
          alongside a live feed of my public GitHub repositories.
        </p>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading tooltip={t("selectedWork")}>Selected</SectionHeading>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {visibleSelected.length} of {selected.length} case studies
          </p>
        </div>
        <nav
          aria-label="Filter case studies by stack"
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
            All
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
                <p className="mt-3 flex-1">{p.blurb}</p>
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
                  Read the case study <ArrowUpRight className="h-4 w-4" />
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
            kicker="Technologies"
            tooltip={t("technologies")}
          >
            {tech ? tech.name : "Pick a technology"}
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
                Official docs <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/work"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
              >
                Clear filter
              </Link>
            </div>
          </div>
        ) : (
          <p className="max-w-2xl text-foreground-muted">
            Click a technology chip on the{" "}
            <Link href="/" className="underline hover:text-accent">
              home page
            </Link>{" "}
            to see its description here and pre-filter the repository feed
            below.
          </p>
        )}
      </section>

      <section className="container-page py-12 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <SectionHeading tooltip={t("openSource")}>
              Public repositories
            </SectionHeading>
            <p className="mt-2 max-w-xl">
              {repos.length} public repositories from{" "}
              {new Date().getFullYear() - 2019}+ years of side-projects, course
              work, and experiments, pulled from GitHub.
            </p>
          </div>
        </div>
        {repos.length > 0 ? (
          <GithubFeed
            repos={repos}
            initialLanguage={tech?.ghLanguage ?? null}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">
              GitHub feed unavailable, try refreshing in a moment.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
