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

      <SvgCards user={stats.user} />
    </section>
  );
}

/**
 * SVG-rendered cards from anuraghazra/github-readme-stats and
 * DenverCoder1/github-readme-streak-stats. Two variants per card —
 * light and dark — toggled via <picture> + prefers-color-scheme so
 * the cards follow the visitor's OS theme. Colors mirror the
 * portfolio's accent palette: cyan #0E7490 in light, gold #D9BD86 in
 * dark. Backgrounds are transparent so the surrounding card border
 * shows through.
 *
 * Why <picture> instead of class-based theme switching: the SVG
 * service renders one PNG-equivalent per request, so we can't hot-
 * swap colors after load. prefers-color-scheme is the only signal
 * available to the browser before the HTML hydrates.
 */
function SvgCards({ user }: { user: string }) {
  const base = (theme: "light" | "dark") => {
    const title = theme === "dark" ? "D9BD86" : "0E7490";
    const text = theme === "dark" ? "a0aec0" : "4a5568";
    return `bg_color=00000000&title_color=${title}&icon_color=${title}&text_color=${text}&hide_border=true`;
  };
  const stats = (theme: "light" | "dark") =>
    `https://github-readme-stats.vercel.app/api?username=${user}&show_icons=true&include_all_commits=true&count_private=false&${base(theme)}`;
  const langs = (theme: "light" | "dark") =>
    `https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&langs_count=8&${base(theme)}`;
  const streak = (theme: "light" | "dark") => {
    const title = theme === "dark" ? "D9BD86" : "0E7490";
    const text = theme === "dark" ? "a0aec0" : "4a5568";
    return `https://github-readme-streak-stats.herokuapp.com?user=${user}&background=00000000&hide_border=true&stroke=${title}&ring=${title}&fire=${title}&currStreakLabel=${title}&sideLabels=${text}&dates=${text}&currStreakNum=${text}&sideNums=${text}`;
  };

  const cards: Array<{ label: string; light: string; dark: string }> = [
    { label: "GitHub stats", light: stats("light"), dark: stats("dark") },
    { label: "Top languages", light: langs("light"), dark: langs("dark") },
    { label: "Contribution streak", light: streak("light"), dark: streak("dark") },
  ];

  return (
    <div
      data-testid="github-stats-svg"
      className="mt-6 grid gap-4 lg:grid-cols-2"
    >
      {cards.map(({ label, light, dark }) => (
        <picture key={label}>
          <source media="(prefers-color-scheme: dark)" srcSet={dark} />
          <img
            src={light}
            alt={`${label} for @${user}`}
            loading="lazy"
            className="w-full max-w-full"
          />
        </picture>
      ))}
    </div>
  );
}
