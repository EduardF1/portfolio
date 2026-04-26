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
    <dl className="@container grid grid-cols-2 gap-8 @md:grid-cols-4">
      {stats.map(({ value, labelKey }) => (
        <div key={labelKey} className="flex flex-col">
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
