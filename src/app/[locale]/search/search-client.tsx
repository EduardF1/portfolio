"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import {
  buildClientIndex,
  hitHref,
  searchClient,
  type ClientIndex,
  type SearchHit,
} from "@/lib/search/client";
import type { SearchIndex } from "@/lib/search/build-index";

const RESULT_LIMIT = 100;

/**
 * Full-results fallback page for site-wide search.
 *
 * Mirrors the palette query logic but renders every match (up to a
 * generous cap) and persists the query in the URL via `?q=…` so links
 * are shareable.
 */
export function SearchPageClient({
  locale,
  initialQuery,
}: {
  locale: string;
  initialQuery: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [index, setIndex] = useState<ClientIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync if the URL changes externally — this IS
  // the canonical syncing pattern (URL is the external system).
  useEffect(() => {
    const fromUrl = params.get("q") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(fromUrl);
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`/api/search-index/${locale}`, { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
        const payload: SearchIndex = await res.json();
        if (cancelled) return;
        setIndex(buildClientIndex(payload));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const hits: SearchHit[] = useMemo(() => {
    if (!index) return [];
    return searchClient(index, query, RESULT_LIMIT);
  }, [index, query]);

  function syncUrl(next: string) {
    const trimmed = next.trim();
    const target =
      trimmed.length === 0
        ? "/search"
        : `/search?q=${encodeURIComponent(trimmed)}`;
    // i18n router preserves the locale prefix automatically.
    router.replace(target);
  }

  return (
    <section className="container-page pt-24 md:pt-28 pb-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {t("kicker")}
      </p>
      <h1 className="max-w-3xl">{t("title")}</h1>
      <p className="mt-6 max-w-2xl text-lg">{t("pageDescription")}</p>

      <div className="mt-10 max-w-xl">
        <label className="sr-only" htmlFor="site-search-input">
          {t("placeholder")}
        </label>
        <input
          id="site-search-input"
          type="search"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            syncUrl(next);
          }}
          placeholder={t("placeholder")}
          data-testid="search-page-input"
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="mt-10">
        {loading && (
          <p className="text-sm text-foreground-subtle">{t("loading")}</p>
        )}
        {!loading && error && (
          <p className="text-sm text-foreground-subtle">{t("errorGeneric")}</p>
        )}
        {!loading && !error && query.trim().length === 0 && (
          <p className="text-sm text-foreground-subtle">{t("hint")}</p>
        )}
        {!loading && !error && query.trim().length > 0 && hits.length === 0 && (
          <p className="text-sm text-foreground-subtle">{t("noResults")}</p>
        )}
        {!loading && !error && hits.length > 0 && (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {hits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={hitHref(hit)}
                  className="group flex flex-col gap-2 py-6 hover:bg-surface px-2 -mx-2 rounded-md transition-colors"
                  data-testid="search-page-result"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="rounded-full border border-border px-2 py-px font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">
                      {t(`collection.${hit.collection}`)}
                    </span>
                    <h3 className="text-xl group-hover:text-accent transition-colors">
                      {hit.title}
                    </h3>
                    {hit.localeFallback && (
                      <span
                        aria-label={t("enFallback")}
                        className="rounded-full border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-foreground-subtle"
                      >
                        EN
                      </span>
                    )}
                  </div>
                  {hit.description && (
                    <p className="text-sm">{hit.description}</p>
                  )}
                  {hit.excerpt && (
                    <p className="text-sm text-foreground-muted line-clamp-2">
                      {hit.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
