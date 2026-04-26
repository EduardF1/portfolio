import { SectionHeading } from "@/components/section-heading";

/**
 * "How I work" — short, specific bullets grounded in the actual record.
 *
 * The earlier draft listed methodologies as honest sentences, but read
 * generic in audience review (Janteloven test: "could anyone write
 * this?"). This rewrite anchors each bullet in a decision, a tool, or
 * a specific moment from Eduard's CV — KOMBIT VALG, the SitaWare
 * stint, Greenbyte's Flutter app, the Boozt Kanban introduction.
 *
 * Source ledger:
 *   - `src/app/[locale]/page.tsx` Experience block (companies + tech)
 *   - `src/app/[locale]/my-story/page.tsx` chapters (decisions per role)
 *   - `content/recommends/letters/*.mdx` (how peers describe him:
 *     "approachable, solution-oriented" — Nanna; "excellent sparring
 *     partner ... strong on system architecture and integration" —
 *     Tobias; "strong project management ... natural understanding of
 *     IT architecture" — Niels at LEGO; "highly qualified and
 *     dedicated ... drove real progress on a tight deadline" — Martin
 *     at STIL)
 */

type Bullet = {
  // The "where + when" tag, kept short and dated.
  where: string;
  // The bullet itself, written as one specific sentence.
  body: string;
};

const BULLETS: Bullet[] = [
  {
    where: "KOMBIT VALG · Netcompany 2024–2026",
    body: "I optimise for legibility over cleverness when the audit trail will outlive me. Election platforms have to read clearly to auditors years later, so I treat naming, comments, and PR descriptions as part of the deliverable, not garnish.",
  },
  {
    where: "STIL / UA.dk · Netcompany 2025",
    body: "When the deadline is fixed and the team is small, I pair the architecture conversation with the first commit. On the four-month EUD III stint at STIL we shipped a reusable component catalog because we agreed the boundaries on day three, not at the retro.",
  },
  {
    where: "SitaWare · Systematic 2021",
    body: "I lean on test automation when the cost of a defect is borne downstream. Robot Framework UI tests on Frontline & Edge weren't a vanity exercise — defence software calibrates how seriously you take qualification.",
  },
  {
    where: "Greenbyte mobile · 2021–2024",
    body: "Architect-and-ship rather than architect-then-hand-off. I designed the Flutter / Dart companion app and stayed on it through release, which is also how I learned that the second-hardest part of a mobile app is the release pipeline.",
  },
  {
    where: "Boozt Fashion · 2021–2022",
    body: "I introduce process changes the same way I introduce code changes — small, reversible, and measured. Bringing Kanban into the campaign-booking team was a six-week experiment with an exit ramp, not a mandate.",
  },
  {
    where: "Across all five roles",
    body: "I read the brief twice before writing the first line. The marketing diploma I started with at IBA Kolding wasn't wasted — it left me with a habit of clarifying scope with stakeholders before the IDE is open.",
  },
];

export function HowIWork() {
  return (
    <section
      id="how-i-work"
      className="@container border-t border-border/60 bg-surface/30 scroll-mt-24"
    >
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 @md:grid-cols-12">
          <div className="@md:col-span-4">
            <SectionHeading>How I work</SectionHeading>
            <p className="mt-6 max-w-sm text-foreground-muted">
              Six short principles, each grounded in something I&apos;ve
              actually shipped — not chips, not buzzwords. Where it was
              learned is on the line above each.
            </p>
          </div>
          <ol className="@md:col-span-8 space-y-8">
            {BULLETS.map((b, i) => (
              <li
                key={`${b.where}-${i}`}
                className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1"
              >
                <p className="col-span-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                  {b.where}
                </p>
                <p className="col-span-2 mt-2 max-w-prose">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
