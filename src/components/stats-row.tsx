import { useTranslations } from "next-intl";

const stats = [
  { value: "5+", labelKey: "stats.years" }, // years coding professionally
  { value: "4", labelKey: "stats.languages" }, // spoken languages: Romanian, Danish, English, Swedish/Norwegian
  { value: "4", labelKey: "stats.projects" }, // major shipped projects: KOMBIT VALG, SitaWare, Greenbyte SaaS, Boozt
  { value: "20+", labelKey: "stats.countries" }, // countries visited (placeholder — Eduard will refine)
];

export function StatsRow() {
  const t = useTranslations("home");
  return (
    // Wrap with a flex centring layer so 4-up at @md and the 2-up wrap at
    // narrow widths both centre as a group, not left-align. Each tile
    // also centres its own text — so a single tile in a wrapped row sits
    // visually balanced rather than dangling at the start of the row.
    <dl className="@container flex flex-wrap justify-center gap-x-8 gap-y-10">
      {stats.map(({ value, labelKey }) => (
        <div
          key={labelKey}
          className="flex flex-col items-center text-center w-[calc(50%-1rem)] @md:w-[calc(25%-1.5rem)]"
        >
          <dd className="font-serif text-5xl leading-none tracking-tight text-foreground @md:text-6xl">
            {value}
          </dd>
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-8 bg-accent"
          />
          <dt className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t(labelKey)}
          </dt>
        </div>
      ))}
    </dl>
  );
}
