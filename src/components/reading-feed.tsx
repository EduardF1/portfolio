import { ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getReadingFeed } from "@/lib/reading-feed";
import { SectionHeading } from "@/components/section-heading";

export async function ReadingFeed({
  kicker,
  heading,
  description,
  emptyMessage,
  tooltip,
  source,
  limit = 6,
}: {
  kicker: string;
  heading: string;
  description?: string;
  emptyMessage: string;
  tooltip: string;
  source: string;
  limit?: number;
}) {
  const items = await getReadingFeed(limit);

  return (
    <section className="container-page py-12 pb-24">
      <div className="flex items-end justify-between mb-8 gap-8">
        <div>
          <SectionHeading kicker={kicker} tooltip={tooltip}>
            {heading}
          </SectionHeading>
          {description && <p className="mt-4 max-w-xl">{description}</p>}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle text-right shrink-0">
          {source}
          {items.length > 0 && ` · ${items.length}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-foreground-subtle">{emptyMessage}</p>
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
                    {item.author}
                    {item.readingMinutes && ` · ${item.readingMinutes} min read`}
                    {item.tags.length > 0 && ` · ${item.tags.slice(0, 3).join(" · ")}`}
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
