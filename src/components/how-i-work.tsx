import { SectionHeading } from "@/components/section-heading";

/**
 * "How I work" — methodologies as honest sentences, not buzzword chips.
 *
 * Per `docs/feature-exploration-2026-04.md` idea #1: the Scandinavian
 * register prefers naming where + when each practice was learned, with
 * no marketing inflation. Each entry: methodology, role/year tag,
 * one factual sentence on what it taught.
 *
 * Sources (LinkedIn + CV ledger, surfaced via `docs/tech-pass-from-artefacts.md`):
 *   - Scrum, Kanban, FDD, CMMI/TMMI, LEAN, Clean Architecture, BDD.
 */

type Methodology = {
  name: string;
  where: string; // role + year tag
  body: string;
};

const ENTRIES: Methodology[] = [
  {
    name: "Scrum",
    where: "VIA Bachelor + Systematic 2021 + Netcompany 2024–2026",
    body: "Standard rhythm for most of the work — sprint planning, daily standups, retros. Useful when scope is fluid and the team is co-located.",
  },
  {
    name: "Kanban",
    where: "Boozt 2021–2022 — introduced it on the team",
    body: "Better fit when the work is operational and incoming, not bounded by a sprint. Pull-based, WIP-limited, fewer meetings.",
  },
  {
    name: "Feature-Driven Development",
    where: "Systematic 2021 — defence/SitaWare programme",
    body: "Domain-first modelling, then a plan-by-feature list, then implementation in two-week tracks. Heavier upfront, but the requirements traceability earned its weight on regulated work.",
  },
  {
    name: "CMMI / TMMI Level 5",
    where: "Systematic 2021 + VIA coursework on process management",
    body: "Process maturity as a contractual obligation, not an aspiration. Audit trails, defined defect-removal practice, predictable release cadence.",
  },
  {
    name: "LEAN",
    where: "Systematic 2021 + Greenbyte 2021–2024",
    body: "Cut the waste, surface the bottlenecks. In practice: fewer ceremonies, smaller PRs, value-stream-mapping the bits of the pipeline that hurt most.",
  },
  {
    name: "Clean Architecture",
    where: "Netcompany 2024–2026 — KOMBIT VALG and STIL stints",
    body: "Strict dependency direction, business rules in the inner layers, frameworks and IO at the edges. Pays off for long-lived enterprise platforms where the framework will outlast the framework.",
  },
];

export function HowIWork() {
  return (
    <section className="@container border-t border-border/60 bg-surface/30">
      <div className="container-page py-20 md:py-28">
        <div className="grid gap-12 @md:grid-cols-12">
          <div className="@md:col-span-4">
            <SectionHeading>How I work</SectionHeading>
            <p className="mt-4 max-w-sm text-foreground-muted">
              Methodologies I&apos;ve actually shipped under, where I picked
              them up, and what they earned. Not chips — chips on
              methodologies tend to read as buzzwordy.
            </p>
          </div>
          <ol className="@md:col-span-8 space-y-8">
            {ENTRIES.map((m) => (
              <li key={m.name} className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                <h3 className="text-xl col-span-2">{m.name}</h3>
                <p className="col-span-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                  {m.where}
                </p>
                <p className="col-span-2 mt-2 max-w-prose">{m.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
