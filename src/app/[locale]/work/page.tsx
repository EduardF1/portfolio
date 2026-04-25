import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GithubFeed } from "@/components/github-feed";
import { getRepos } from "@/lib/github";

export const metadata = { title: "Work" };

const selected = [
  {
    slug: "kombit-valg",
    title: "KOMBIT VALG",
    kicker: "Netcompany · 2024 — present",
    blurb:
      "Denmark's administrative election platform. Full-stack C#/.NET + Angular. [Placeholder — case study to be written.]",
    stack: ["C#", ".NET", "Angular", "MS SQL", "Azure DevOps"],
  },
  {
    slug: "sitaware",
    title: "SitaWare Frontline & Edge",
    kicker: "Systematic · 2021",
    blurb:
      "NATO-grade C2 software for defence. Full-stack Java + Angular. [Placeholder — case study to be written.]",
    stack: ["Java", "Spring", "Angular", "JUnit"],
  },
  {
    slug: "greenbyte-saas",
    title: "Greenbyte SaaS + Mobile",
    kicker: "Greenbyte · 2021 — 2024",
    blurb:
      "Renewable-energy monitoring platform with Flutter mobile companion. [Placeholder.]",
    stack: ["C#", ".NET Core", "EF Core", "React", "Flutter/Dart"],
  },
  {
    slug: "boozt",
    title: "Boozt e-commerce backend",
    kicker: "Boozt Fashion · 2021 — 2022",
    blurb:
      "Symfony backend for a large Nordic retailer. [Placeholder.]",
    stack: ["PHP", "Symfony", "MySQL", "PHPUnit"],
  },
];

export default async function WorkPage() {
  const repos = await getRepos();

  return (
    <>
      <section className="container-page pt-24 md:pt-28 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          Work
        </p>
        <h1 className="max-w-3xl">Selected work and open-source explorations.</h1>
        <p className="mt-6 max-w-2xl text-lg">
          Hand-picked case studies of business-critical systems I&apos;ve helped
          build, alongside a live feed of every public repo where I&apos;ve been
          learning out loud.
        </p>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8">
          <h2>Selected</h2>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            4 case studies
          </p>
        </div>
        <ul className="grid gap-px bg-border/60 sm:grid-cols-2 rounded-lg overflow-hidden">
          {selected.map((p) => (
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

      <section className="container-page py-12 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2>Open source &amp; learning in public</h2>
            <p className="mt-2 max-w-xl">
              {repos.length} public repositories from {new Date().getFullYear() - 2019}+
              years of side-projects, course work, and weekend experiments —
              auto-pulled from GitHub.
            </p>
          </div>
        </div>
        {repos.length > 0 ? (
          <GithubFeed repos={repos} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-foreground-subtle">
              GitHub feed unavailable — try refreshing in a moment.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
