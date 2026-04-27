import { Star, Users, BookOpen, CalendarClock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfileStats } from "@/lib/github-stats";

/**
 * Public, ISR-cached GitHub aggregate widget. Server Component —
 * runs at the edge during ISR, falls back to an empty state if the
 * GitHub API is rate-limited or down.
 *
 * Placement: rendered on /work above the public-repos feed (see
 * src/app/[locale]/work/page.tsx). It complements the existing
 * GithubFeed by providing a single-glance summary line, mirroring
 * the LinkedIn-style "at a glance" Eduard wanted.
 */
export async function GithubStats() {
  const stats = await getProfileStats();
  const tt = await getTranslations("tooltips");
  const t = await getTranslations("githubStats");
  const locale = await getLocale();
  // Numeric formatting follows the active UI locale: en-GB for English
  // (matches the rest of the site's date/number style), da-DK for Danish.
  const numberLocale = locale === "da" ? "da-DK" : "en-GB";
  if (!stats) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground-subtle">
        {t("unavailable")}
      </div>
    );
  }

  const cards: Array<{
    label: string;
    value: string;
    Icon: typeof Star;
    tooltip: string;
  }> = [
    {
      label: t("cards.publicRepos"),
      value: stats.publicRepos.toLocaleString(numberLocale),
      Icon: BookOpen,
      tooltip: tt("githubStatsRepos"),
    },
    {
      label: t("cards.followers"),
      value: stats.followers.toLocaleString(numberLocale),
      Icon: Users,
      tooltip: tt("githubStatsFollowers"),
    },
    {
      label: t("cards.totalStars"),
      value: stats.totalStars.toLocaleString(numberLocale),
      Icon: Star,
      tooltip: tt("githubStatsStars"),
    },
    {
      label: t("cards.memberSince"),
      value: String(stats.memberSince),
      Icon: CalendarClock,
      tooltip: tt("githubStatsSince"),
    },
  ];

  return (
    <section
      data-testid="github-stats"
      aria-label={t("ariaLabel")}
      title={tt("githubStats")}
      className="rounded-lg border border-border p-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("userLine", { user: stats.user })}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("description")}
          </p>
        </div>
        <a
          href={`https://github.com/${stats.user}`}
          target="_blank"
          rel="noopener noreferrer"
          title={tt("githubViewProfile")}
          className="text-xs text-foreground-muted hover:text-accent"
        >
          {t("viewProfile")}
        </a>
      </div>

      <ul className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {cards.map(({ label, value, Icon, tooltip }) => (
          <li
            key={label}
            title={tooltip}
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
            {t("topLanguages")}
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
