import { setRequestLocale } from "next-intl/server";
import { SectionHeading } from "@/components/section-heading";
import { SectionNav } from "@/components/section-nav";
import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Now",
  description:
    "What Eduard is focused on right now — short, dated, honest. Updated every 1-2 months.",
};

const LAST_UPDATED = "2026-04-26";

export default async function NowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SectionNav
        sections={[
          { id: "intro", label: "Now" },
          { id: "focus", label: "Focus" },
          { id: "reading", label: "Reading" },
          { id: "side-bets", label: "Side bets" },
          { id: "lately", label: "Lately" },
        ]}
      />
      <section
        id="intro"
        className="container-page pt-24 md:pt-28 pb-12 scroll-mt-24"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
          Now
        </p>
        <h1 className="max-w-3xl">What I&apos;m focused on right now.</h1>
        <p className="mt-6 max-w-2xl text-lg">
          A snapshot of what has my attention — work, study, side bets,
          reading. Updated every month or two.{" "}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            What is a /now page?
          </a>
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          Last updated · {LAST_UPDATED}
        </p>
      </section>

      <section
        id="focus"
        className="container-page py-12 max-w-3xl scroll-mt-24"
      >
        <SectionHeading>Focus</SectionHeading>
        <div className="mt-6 space-y-4">
          <p>
            Settling into my new role at{" "}
            <a
              href="https://mjolner.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              Mjølner Informatics
            </a>{" "}
            in Aarhus after closing my chapter at Netcompany in February. The
            first months are about understanding the consultancy&apos;s product
            mix, the engineering practice, and where I can add value early.
          </p>
          <p>
            Day-to-day that means reading my way into ongoing client deliveries,
            getting comfortable with the team&apos;s review and release cadence,
            and being useful where I can without rushing the onboarding. I&apos;ll
            update this section once I&apos;m on a delivery I can name publicly.
          </p>
        </div>
      </section>

      <section
        id="reading"
        className="container-page py-12 max-w-3xl scroll-mt-24"
      >
        <SectionHeading>Reading</SectionHeading>
        <div className="mt-6 space-y-4">
          <p>
            A small reading pile, mostly engineering and a bit of business —
            picked up between commits rather than in long blocks. The finished
            and recommended end of the pile lives on{" "}
            <Link
              href="/recommends"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              /recommends
            </Link>
            ; this is what&apos;s currently in flight.
          </p>
        </div>
      </section>

      <section
        id="side-bets"
        className="container-page py-12 max-w-3xl scroll-mt-24"
      >
        <SectionHeading>Side bets</SectionHeading>
        <div className="mt-6 space-y-4">
          <p>
            This site, kept lean and updated as I learn things worth recording.
            The technical decisions live on{" "}
            <Link
              href="/work"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              /work
            </Link>
            ; the longer arcs go on{" "}
            <Link
              href="/writing"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              /writing
            </Link>
            .
          </p>
          <p>
            Beyond the portfolio: keeping my Danish on track, the occasional
            small commit to side-projects from the bachelor- and MSc-era
            backlog, and watching for a small AI/LLM angle worth shipping
            honestly rather than for show.
          </p>
        </div>
      </section>

      <section
        id="lately"
        className="container-page py-12 pb-24 max-w-3xl scroll-mt-24"
      >
        <SectionHeading>Lately</SectionHeading>
        <div className="mt-6 space-y-4">
          <p>
            Spring in Aarhus. A short trip to Slovenia and Croatia in late
            March, BVB on Saturdays where the schedule allows, and the slow
            steady work of settling into a new team after a long stretch at
            the previous one. The{" "}
            <Link
              href="/personal"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              /personal
            </Link>{" "}
            page holds the steadier interests; this is the volatile slice.
          </p>
        </div>
      </section>
    </>
  );
}
