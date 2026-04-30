"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Repo } from "@/lib/github";
import { cn } from "@/lib/utils";
import { responsiveGridColsClass } from "@/lib/grid-cols";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Java: "#b07219",
  PHP: "#4F5D95",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Dockerfile: "#384d54",
  EJS: "#a91e50",
  TSQL: "#e38c00",
};

function formatDate(iso: string) {
  const parsedDate = new Date(iso);
  return parsedDate.toLocaleDateString("en-GB", { year: "numeric", month: "short" });
}

export function GithubFeed({
  repos,
  initialLanguage = null,
}: {
  repos: Repo[];
  /**
   * Pre-select a language filter on first render. Only takes effect if at
   * least one repo actually has that language; otherwise the feed starts
   * unfiltered. Clicking "All" resets to null regardless.
   */
  initialLanguage?: string | null;
}) {
  const t = useTranslations("work");
  const [query, setQuery] = useState("");

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of repos) {
      if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [repos]);

  const [language, setLanguage] = useState<string | null>(() => {
    if (!initialLanguage) return null;
    // Only honour the prop if it's actually present in the repo list.
    return repos.some((r) => r.language === initialLanguage)
      ? initialLanguage
      : null;
  });

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return repos.filter((repo) => {
      if (language && repo.language !== language) return false;
      if (!normalizedQuery) return true;
      const haystack = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [repos, query, language]);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <input
          type="search"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:max-w-md rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-ring"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              language === null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground-muted hover:border-accent hover:text-accent",
            )}
          >
            {t("feedAllCount", { count: repos.length })}
          </button>
          {languages.map(([lang, count]) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang === language ? null : lang)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                language === lang
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground-muted hover:border-accent hover:text-accent",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LANGUAGE_COLORS[lang] ?? "#888" }}
              />
              {lang} ({count})
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs text-foreground-subtle mb-4">
        {t("feedShown", { shown: filtered.length, total: repos.length })}
      </p>

      <ul className={`grid gap-px bg-border/60 ${responsiveGridColsClass(filtered.length, 3)} rounded-lg overflow-hidden`}>
        {filtered.map((r, idx) => {
          const isLast = idx === filtered.length - 1;
          const lastRowLg = filtered.length % 3;
          const lastRowSm = filtered.length % 2;
          const lgSpan = isLast && lastRowLg !== 0 ? ` lg:col-span-${4 - lastRowLg}` : "";
          const smSpan = isLast && lastRowSm === 1 ? " sm:col-span-2" : "";
          return (
          <li key={r.id} className={`bg-background${smSpan}${lgSpan}`}>
            <a
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col p-5 transition-colors hover:bg-surface"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-medium font-sans group-hover:text-accent transition-colors">
                  {r.name}
                </h3>
                {r.stargazers_count > 0 && (
                  <span className="font-mono text-xs text-foreground-subtle whitespace-nowrap">
                    ★ {r.stargazers_count}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm flex-1 line-clamp-3">
                {r.description ?? t("noDescription")}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-foreground-subtle">
                {r.language && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: LANGUAGE_COLORS[r.language] ?? "#888" }}
                    />
                    {r.language}
                  </span>
                )}
                <span className="font-mono">
                  {t("updated", { date: formatDate(r.pushed_at) })}
                </span>
              </div>
            </a>
          </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-foreground-subtle">{t("noMatches")}</p>
        </div>
      )}
    </div>
  );
}
