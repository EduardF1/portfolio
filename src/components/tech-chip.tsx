import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { findTech } from "@/lib/tech";
import { demosForLanguage } from "@/lib/tech-demos";

export type TechChipProps = {
  /** The chip slug or display name to look up in the tech registry. */
  slug: string;
  /**
   * Optional `data-` testing handle used by tests in /work and the home page
   * experience list. Forwarded onto the chip's text link element.
   */
  "data-tech-slug"?: string;
};

/**
 * Renders a tech chip pill: a filter-link to /work?tech=<slug>#technologies
 * plus, when the tech maps to a GitHub language with at least one matching
 * public repo in `scripts/tech-demos.json`, a tiny inline "demo ↗" badge
 * that opens a popover listing up to three demo repos.
 *
 * The badge is hidden when no demos are available, keeping the visual
 * footprint identical to the legacy chip in the no-match case.
 *
 * Server component. The popover is CSS-only (group-hover / group-focus-within)
 * so no client bundle is required.
 */
export function TechChip({ slug, ...rest }: TechChipProps) {
  const t = useTranslations("work");
  const tech = findTech(slug);
  if (!tech) return null;
  const demos = demosForLanguage(tech.ghLanguage);
  const hasDemos = demos.length > 0;
  const dataTechSlug = rest["data-tech-slug"];

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors";

  if (!hasDemos) {
    // Backwards-compatible rendering: same markup as the prior inline chip so
    // existing layout tests and screenshots remain unchanged.
    return (
      <Link
        href={{
          pathname: "/work",
          query: { tech: tech.slug },
          hash: "technologies",
        }}
        data-tech-slug={dataTechSlug}
        className={pillBase}
      >
        {tech.name}
      </Link>
    );
  }

  // Wrapping element groups the filter link with the demo badge so they share
  // a single border, and acts as the `group` for the popover hover state.
  return (
    <span
      className={`${pillBase} group relative gap-2 pr-2`}
      data-tech-chip={tech.slug}
    >
      <Link
        href={{
          pathname: "/work",
          query: { tech: tech.slug },
          hash: "technologies",
        }}
        data-tech-slug={dataTechSlug}
        className="hover:text-accent"
      >
        {tech.name}
      </Link>
      <span aria-hidden="true" className="text-foreground-subtle">
        ·
      </span>
      <span
        data-testid={`tech-chip-demo-badge-${tech.slug}`}
        className="inline-flex cursor-default items-center gap-0.5 rounded-full bg-accent-soft/60 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-foreground-muted group-hover:text-accent group-focus-within:text-accent"
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-label={t("chipDemoBadgeAria", { tech: tech.name })}
      >
        {t("chipDemoBadge")} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
      <span
        role="tooltip"
        data-testid={`tech-chip-demo-popover-${tech.slug}`}
        className="invisible absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-md border border-border bg-background p-2 text-left text-xs shadow-lg opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-wider text-foreground-subtle">
          {t("chipDemoPopoverTitle", { tech: tech.name })}
        </span>
        <ul className="space-y-1">
          {demos.map((d) => (
            <li key={d.url}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground hover:text-accent"
              >
                {d.name}
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}
