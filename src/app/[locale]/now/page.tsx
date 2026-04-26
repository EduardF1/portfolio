import { setRequestLocale } from "next-intl/server";
import { SectionHeading } from "@/components/section-heading";
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
      <section className="container-page pt-24 md:pt-28 pb-12">
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

      <section className="container-page py-12 max-w-3xl">
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
          <p className="text-foreground-muted text-sm italic">
            Eduard: replace this with current project context once you&apos;ve
            settled into a delivery you can name publicly. Keep it
            non-confidential and short.
          </p>
        </div>
      </section>

      <section className="container-page py-12 max-w-3xl">
        <SectionHeading>Reading</SectionHeading>
        <div className="mt-6 space-y-4">
          <p className="text-foreground-muted text-sm italic">
            Eduard: list 2-3 books or longer pieces in flight. Format: title,
            author, one-line of why it&apos;s on the pile. Cross-reference to{" "}
            <Link
              href="/recommends"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              /recommends
            </Link>{" "}
            for the things you&apos;ve already finished and would push to
            others.
          </p>
        </div>
      </section>

      <section className="container-page py-12 max-w-3xl">
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
          <p className="text-foreground-muted text-sm italic">
            Eduard: drop in any current side projects — open source, study,
            certifications, hobby code.
          </p>
        </div>
      </section>

      <section className="container-page py-12 pb-24 max-w-3xl">
        <SectionHeading>Lately</SectionHeading>
        <div className="mt-6 space-y-4">
          <p className="text-foreground-muted text-sm italic">
            Eduard: a short paragraph on the texture of life right now —
            travel, training, family, language study, anything outside work
            that&apos;s shaping the season. The{" "}
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
