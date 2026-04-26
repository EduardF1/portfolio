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
    yearRange: "2017–2019",
    place: "IBA Erhvervsakademi Kolding",
    heading: "AP Degree · Marketing & Management",
    body: "I started in Denmark with an AP Degree in Marketing & Management at IBA Kolding. I came in from a Romanian high school in natural sciences (mathematics and informatics), and the move was as much about learning to operate in Danish-language work culture as it was about the field. The diploma gave me a working vocabulary for business — briefs, stakeholders, market context — that I still use when I sit on the engineering side of a delivery and need to read what the other half of the room actually wants.",
    takeaway: "Took with me: how to read a brief, how to hold a room.",
  },
  {
    yearRange: "2016–2021",
    place: "Alongside studies — Kolding, Bucharest, Vejle",
    heading: "Paying my own way",
    body: "I funded the degrees with steady part-time work outside the lecture room. Sales assistant at LPP Reserved in Kolding (Apr – Sep 2016), call-centre agent at eMAG in Bucharest (Sep 2016 – Jan 2017), goods receiver at GLS in Kolding (Mar 2017 – Sep 2018), a sales internship at Domisis Construct in Romania (Jul – Oct 2018), and goods receiver at REITAN in Vejle through the BSc years (May 2019 – May 2021). I paid for studies by working logistics and retail, and it taught me about service, operations, and how to be a steady team-mate on a long shift.",
    takeaway: "Took with me: respect for service work, the rhythm of inventory, the patience to be calm in a queue.",
  },
  {
    yearRange: "2019–2022",
    place: "VIA University College, Horsens",
    heading: "BSc · Software Technology Engineering",
    body: "The switch into software was the obvious-in-hindsight move I should have made earlier. VIA's BSc in Software Technology Engineering — with a data engineering specialisation — was where I met my first real codebases, my first real teammates, and the first systems I had to maintain rather than only finish. Process Management for Engineering on CMMI/TMMI was on the curriculum from early on, which set the register I still default to: small daily commitments, tests that catch what manual checks miss, code review as a design conversation.",
    takeaway: "Took with me: the first real codebases, the first real teammates.",
  },
  {
    yearRange: "2022–2024",
    place: "Aarhus University",
    heading: "MSc Engineering · Technology-Based Business Development",
    body: "The MSc at Aarhus University was the bridge between the engineering side and the business side I had originally trained for. The programme is built around scoping systems and assessing them as deliveries, not only as code, and the thesis — done as a consultant for The LEGO Group on a future audit & compliance platform — was the moment a lot of that came together. The technical detail of the thesis lives on /writing; what stayed with me is the habit of scoping the problem properly before writing a line of code.",
    takeaway: "Took with me: how to scope a system before writing a line of code.",
  },
  {
    yearRange: "Feb–Jun 2021",
    place: "Systematic, Aarhus",
    heading: "First industry role · SitaWare",
    body: "My first industry role was a 25-week engineering internship at Systematic on the SitaWare suite — Java and Angular feature work on the web client, plus UI test automation in Robot Framework and JUnit-style coverage closer to the code. Defence software was a calibrating environment: a Scrum team running Feature-Driven Development under CMMI 5, code review and qualification taken seriously because the people on the other end stake decisions on the system. I left because it was an internship and the BSc still had a final stretch to finish; the QA mindset I learned there has carried into everything since.",
    takeaway: "Took with me: care for systems where mistakes have weight.",
  },
  {
    yearRange: "Oct 2021 – May 2022",
    place: "Boozt Fashion, Malmö (remote/Aarhus)",
    heading: "E-commerce at Nordic scale",
    body: "Eight months on the PHP 8 / Symfony / MySQL backend at Boozt — a campaign-booking slice of one of the larger Nordic fashion platforms. The codebase was old enough to have a personality, which made the most interesting work the slow gradual quality push: PHPUnit, Mockery and Behat coverage on the legacy paths the new logic touched, and a Kanban flow I helped introduce to give the team a clearer view of what was actually in flight. The muscle I left with is the patient kind of refactoring that high-traffic codebases reward over time.",
    takeaway: "Took with me: the muscle for production-grade refactors.",
  },
  {
    yearRange: "Nov 2021 – Sep 2024",
    place: "Greenbyte (Power Factors), Horsens / Aarhus",
    heading: "SaaS for renewable-energy fleets",
    body: "Just shy of three years at Greenbyte — first as a student software engineer alongside the MSc, then full-time after graduation. .NET Core with EF Core on the backend, React on the web, and a Flutter / Dart mobile companion app where I was architect and lead developer. It's also where the DevOps research for my master's thesis was grounded — an honest empirical study of what made adoption stick in a small-to-mid-sized engineering team, sitting inside the team it was studying.",
    takeaway: "Took with me: the rhythm of weekly releases.",
  },
  {
    yearRange: "Oct 2024 – Feb 2026",
    place: "Netcompany, Aarhus",
    heading: "Public-sector consulting · KOMBIT VALG",
    body: "Sixteen months at Netcompany, mostly on the KOMBIT VALG programme — Denmark's national administrative election platform — with C# / .NET on the back end and Angular on the web. From June to September 2025 I was loaned to STIL on EUD3, UADK and Uddannelse.dk, where I designed a reusable UI component catalog on a JBoss + jQuery + TypeScript stack. Public-sector consulting is a different operating tempo: release windows that don't move, regulatory weight on every decision, and a clear sense that the people on the other end are election secretaries in real town halls.",
    takeaway: "Took with me: how to deliver under regulatory weight.",
  },
  {
    yearRange: "Apr 2026 –",
    place: "Mjølner Informatics, Aarhus",
    heading: "Current chapter",
    body: "I joined Mjølner Informatics in April 2026. The first months are about settling in — understanding the consultancy's product mix and the team's review and release cadence — before I commit publicly to the texture of the work. I'll fill this chapter out properly once there's a delivery I can name.",
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
              <p className="mt-4">
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
        <p className="mt-6">
          The direction I&apos;m looking in: long-form work on systems that
          carry real weight — public-sector, infrastructure, tools used daily
          by teams that depend on them — in a calm review culture that takes
          quality seriously. Aarhus is home; I&apos;m open to hybrid and to
          Copenhagen for the right team. Pairs with{" "}
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
