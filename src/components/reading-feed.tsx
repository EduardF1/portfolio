import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import {
  getReadingFeed,
  READING_SOURCES,
  type ReadingSource,
} from "@/lib/reading-feed";
import { SectionHeading } from "@/components/section-heading";

export async function ReadingFeed({
  kicker,
  tooltip,
  source = "devto",
  limit = 6,
}: {
  kicker?: string;
  tooltip: string;
  source?: ReadingSource;
  limit?: number;
}) {
  const items = await getReadingFeed(source, limit);
  const t = await getTranslations("readingFeed");
  const resolvedKicker = kicker ?? t("kicker");

  return (
    <section className="container-page py-12 pb-24">
      <div className="flex items-end justify-between mb-6 gap-8">
        <div>
          <SectionHeading kicker={resolvedKicker} tooltip={tooltip}>
            {t(`headings.${source}`)}
          </SectionHeading>
          <p className="mt-4 max-w-xl">{t(`descriptions.${source}`)}</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle text-right shrink-0">
          {READING_SOURCES.find((s) => s.id === source)?.label ?? source}
          {items.length > 0 && ` · ${items.length}`}
        </p>
      </div>

      <SourceTabs current={source} ariaLabel={t("sourceTabsAria")} />

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-foreground-subtle">{t("unavailable")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:justify-between md:gap-8 hover:bg-surface px-2 -mx-2 rounded-md transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-xl group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                    {source === "all" && (
                      <span className="text-accent mr-2">
                        {item.source === "hn" ? "HN" : "dev.to"}
                      </span>
                    )}
                    {item.author}
                    {item.readingMinutes &&
                      ` · ${t("readingMinutes", { count: item.readingMinutes })}`}
                    {item.tags.length > 0 &&
                      ` · ${item.tags.slice(0, 3).join(" · ")}`}
                  </p>
                </div>
                <p className="font-mono text-xs text-foreground-subtle whitespace-nowrap inline-flex items-center gap-1">
                  {formatDate(item.publishedAt)}
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceTabs({
  current,
  ariaLabel,
}: {
  current: ReadingSource;
  ariaLabel: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-6 flex flex-wrap gap-2 border-b border-border/60 pb-3"
    >
      {READING_SOURCES.map((s) => {
        const active = s.id === current;
        const href = s.id === "devto" ? "/writing" : `/writing?reading=${s.id}`;
        return (
          <Link
            key={s.id}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={
              "rounded-full px-4 py-1.5 text-sm font-mono uppercase tracking-wider transition-colors " +
              (active
                ? "bg-accent text-accent-foreground"
                : "text-foreground-muted hover:text-foreground hover:bg-surface")
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
