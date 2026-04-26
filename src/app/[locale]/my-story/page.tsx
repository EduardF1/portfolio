import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/section-heading";

export const metadata = {
  title: "How I got here",
  description:
    "The longer arc — from AP Marketing in Kolding to engineering in Aarhus. Chronological, dated, calm.",
};

type Chapter = {
  yearRange: string;
  place: string;
  heading: string;
  body: string; // placeholder; Eduard replaces
  takeaway?: string;
};

const CHAPTERS: Chapter[] = [
  {
    yearRange: "2014–2016",
    place: "IBA Kolding",
    heading: "AP Marketing & Management",
    body: "Eduard: 2-3 sentences on why marketing first, what stuck, what didn't. Honest. No retroactive narrative — just the actual reason.",
    takeaway: "Took with me: how to read a brief, how to hold a room.",
  },
  {
    yearRange: "2016–2021",
    place: "Alongside studies — Kolding, Bucharest, Vejle",
    heading: "Paying my own way",
    body: "Eduard: a short factual paragraph naming the work that funded the degrees: LPP Reserved (sales assistant, Apr–Sep 2016, Kolding), eMAG (call centre agent, Sep 2016 – Jan 2017, Bucharest), GLS (goods receiver, Mar 2017 – Sep 2018, Kolding), Domisis Construct (sales intern, Jul–Oct 2018, Romania), REITAN (goods receiver, May 2019 – May 2021, Vejle, part-time during the BSc). No apology, no bragging — “I paid for studies by working logistics and retail; that taught me about service, operations, and how to keep a steady team-mate in the warehouse on a long shift.”",
    takeaway: "Took with me: respect for service work, the rhythm of inventory, the patience to be calm in a queue.",
  },
  {
    yearRange: "2016–2019",
    place: "VIA University College, Horsens",
    heading: "BSc Software Engineering",
    body: "Eduard: 2-3 sentences on the switch — what triggered it, how the marketing background carried over, what the BSc gave you that you still use.",
    takeaway: "Took with me: the first real codebases, the first real teammates.",
  },
  {
    yearRange: "2019–2023",
    place: "Aarhus University",
    heading: "MSc Technology-Based Business Development",
    body: "Eduard: 2-3 sentences on bridging tech + business. The thesis (audit management for LEGO) sits under /writing — link to it. Don't restate it here; just say what shaped you most.",
    takeaway: "Took with me: how to scope a system before writing a line of code.",
  },
  {
    yearRange: "2020–2021",
    place: "Systematic, Aarhus",
    heading: "First industry role · SitaWare",
    body: "Eduard: 2-3 sentences on what you actually worked on (sanitised — no confidentiality breach), what surprised you about defence software, what made you move.",
    takeaway: "Took with me: care for systems where mistakes have weight.",
  },
  {
    yearRange: "2021–2023",
    place: "Boozt, Aarhus",
    heading: "E-commerce at Nordic scale",
    body: "Eduard: 2-3 sentences on the work, on PHP/Symfony at scale, on what you took from a high-traffic consumer codebase.",
    takeaway: "Took with me: the muscle for production-grade refactors.",
  },
  {
    yearRange: "2023–2024",
    place: "Greenbyte (Power Factors), Aarhus",
    heading: "SaaS for renewable-energy fleets",
    body: "Eduard: 2-3 sentences on the Breeze platform, on switching to a smaller-team SaaS rhythm, on the domain.",
    takeaway: "Took with me: the rhythm of weekly releases.",
  },
  {
    yearRange: "2024–2026",
    place: "Netcompany, Aarhus",
    heading: "Public-sector consulting · KOMBIT VALG",
    body: "Eduard: 2-3 sentences on the consulting world, on the public-sector side, on what STIL/UA.dk projects taught you.",
    takeaway: "Took with me: how to deliver under regulatory weight.",
  },
  {
    yearRange: "2026–",
    place: "Mjølner Informatics, Aarhus",
    heading: "Current chapter",
    body: "Eduard: keep this short until you have something concrete to say. 1-2 sentences max.",
  },
];

export default async function MyStoryPage({
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
          My story
        </p>
        <h1 className="max-w-3xl">How I got here.</h1>
        <p className="mt-6 max-w-2xl text-lg">
          A chronological version of the CV — the choices, not the
          achievements. Dated, honest, and short. The technical detail of each
          chapter lives on{" "}
          <Link
            href="/work"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            /work
          </Link>
          ; the steadier-life slice lives on{" "}
          <Link
            href="/personal"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            /personal
          </Link>
          .
        </p>
        <p className="mt-4 max-w-2xl text-foreground-muted text-sm italic">
          (This is a shell — Eduard is filling in the prose chapter by
          chapter. Tone notes for each section live in
          <code className="font-mono text-xs mx-1 rounded bg-surface px-1.5 py-0.5">
            docs/audience-benchmark.md
          </code>
          .)
        </p>
      </section>

      <section className="container-page py-12 max-w-3xl">
        <ol className="relative border-l border-border/60 pl-8 space-y-12">
          {CHAPTERS.map((c, i) => (
            <li key={`${c.yearRange}-${i}`} className="relative">
              <span
                className="absolute -left-[35px] top-1 w-3 h-3 rounded-full bg-accent ring-4 ring-background"
                aria-hidden="true"
              />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                {c.yearRange} · {c.place}
              </p>
              <h2 className="mt-2 text-2xl font-serif">{c.heading}</h2>
              <p className="mt-4 text-foreground-muted text-sm italic">
                {c.body}
              </p>
              {c.takeaway && (
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-accent">
                  {c.takeaway}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page py-12 pb-24 max-w-3xl">
        <SectionHeading>What&apos;s next</SectionHeading>
        <p className="mt-6 text-foreground-muted text-sm italic">
          Eduard: 2-3 sentences on what you&apos;re looking to do next — not as
          a wishlist, but as direction. Pairs with{" "}
          <Link
            href="/now"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            /now
          </Link>{" "}
          which holds the volatile slice.
        </p>
        <p className="mt-8">
          If something here resonates with what you&apos;re hiring for,{" "}
          <Link
            href="/contact"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            I&apos;d be glad to hear from you
          </Link>
          .
        </p>
      </section>
    </>
  );
}
