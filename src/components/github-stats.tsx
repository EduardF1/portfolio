import { Star, Users, BookOpen } from "lucide-react";
import { getProfileStats } from "@/lib/github-stats";

/**
 * Public, ISR-cached GitHub aggregate widget. Server Component —
 * runs at the edge during ISR, falls back to an empty state if the
 * GitHub API is rate-limited or down. Hardcoded EN labels for now,
 * Dev A will translate after the i18n sweep lands.
 *
 * Placement: rendered on /work above the public-repos feed (see
 * src/app/[locale]/work/page.tsx). It complements the existing
 * GithubFeed by providing a single-glance summary line, mirroring
 * the LinkedIn-style "at a glance" Eduard wanted.
 */
export async function GithubStats() {
  const stats = await getProfileStats();
  if (!stats) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground-subtle">
        {/* TODO i18n */}
        GitHub stats unavailable.
      </div>
    );
  }

  const cards: Array<{
    label: string;
    value: string;
    Icon: typeof Star;
  }> = [
    {
      label: "Public repos", // TODO i18n
      value: stats.publicRepos.toLocaleString("en-GB"),
      Icon: BookOpen,
    },
    {
      label: "Followers", // TODO i18n
      value: stats.followers.toLocaleString("en-GB"),
      Icon: Users,
    },
    {
      label: "Total stars", // TODO i18n
      value: stats.totalStars.toLocaleString("en-GB"),
      Icon: Star,
    },
  ];

  return (
    <section
      data-testid="github-stats"
      aria-label="GitHub profile stats"
      className="rounded-lg border border-border p-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {/* TODO i18n */}
            GitHub · @{stats.user}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {/* TODO i18n */}
            Live numbers from the public profile, refreshed hourly.
          </p>
        </div>
        <a
          href={`https://github.com/${stats.user}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-foreground-muted hover:text-accent"
        >
          {/* TODO i18n */}
          View on GitHub →
        </a>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, Icon }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-md border border-border/60 bg-surface/30 px-4 py-3"
          >
            <Icon className="h-4 w-4 text-foreground-subtle" aria-hidden />
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-foreground-subtle">
                {label}
              </p>
              <p className="text-lg font-medium tabular-nums">{value}</p>
            </div>
          </li>
        ))}
      </ul>

      {stats.topLanguages.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-foreground-subtle">
            {/* TODO i18n */}
            Top languages
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.topLanguages.map((l) => (
              <span
                key={l.name}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground-muted"
              >
                {l.name} ({l.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
