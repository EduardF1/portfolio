"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  buildClientIndex,
  findMatchRange,
  groupByCollection,
  hitHref,
  searchClient,
  type ClientIndex,
  type SearchHit,
} from "@/lib/search/client";
import type { SearchIndex } from "@/lib/search/build-index";
import { cn } from "@/lib/utils";

const RESULT_LIMIT = 8;

type CollectionKey = SearchHit["collection"];

const COLLECTION_ORDER: CollectionKey[] = [
  "writing",
  "articles",
  "work",
  "recommends",
];

/**
 * The site-wide command palette.
 *
 * Mounted once in the locale layout. Opens on Cmd+K / Ctrl+K, plus a
 * bare `/` keystroke when no input is focused (consistent with GitHub,
 * Notion, etc.). Renders an ARIA dialog with focus trap, ESC-to-close,
 * arrow-key navigation, Enter to open the active result. Top 8 results
 * grouped by collection. Matched substrings highlighted in titles.
 */
export function SearchPalette() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("search");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [index, setIndex] = useState<ClientIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Track whether we have already kicked off a fetch — the index is
  // immutable for the page lifetime, so we only ever load it once.
  // We use a ref instead of state to avoid the dep-array re-trigger
  // that would cancel the in-flight fetch the moment `setLoading(true)`
  // re-rendered the component.
  const fetchStarted = useRef(false);

  // Lazy-load the index the first time the palette opens. We never
  // refetch — content rebuilds on deploy.
  useEffect(() => {
    if (!open || index || fetchStarted.current) return;
    fetchStarted.current = true;
    let cancelled = false;
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
        // Allow a retry on the next open if the first fetch errored.
        fetchStarted.current = false;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, index, locale]);

  // Keyboard shortcuts: Cmd+K / Ctrl+K toggle; `/` opens (when not in input).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open && e.key === "/") {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isInput =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          (target?.isContentEditable ?? false);
        if (!isInput) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("portfolio:search-open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portfolio:search-open", onOpenEvent);
    };
  }, [open]);

  // Focus management on open/close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current =
        (document.activeElement as HTMLElement | null) ?? null;
      // Small timeout so the dialog mounts before we focus.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    previouslyFocused.current?.focus?.();
    return undefined;
  }, [open]);

  // Reset state on close — sync with the open/close external signal.
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIdx(0);
    }
  }, [open]);

  const hits: SearchHit[] = useMemo(() => {
    if (!index) return [];
    return searchClient(index, query, RESULT_LIMIT);
  }, [index, query]);

  // Clamp the active cursor inline (cheap, derived state — avoids the
  // setState-in-effect anti-pattern). When hits is empty, idx 0 is fine
  // since we render nothing under it.
  const safeActiveIdx =
    hits.length === 0 ? 0 : Math.min(activeIdx, hits.length - 1);

  const close = useCallback(() => setOpen(false), []);

  const openHit = useCallback(
    (hit: SearchHit) => {
      router.push(hitHref(hit));
      setOpen(false);
    },
    [router],
  );

  const onDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hits.length === 0) return;
        setActiveIdx((i) => (i + 1) % hits.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (hits.length === 0) return;
        setActiveIdx((i) => (i - 1 + hits.length) % hits.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const hit = hits[safeActiveIdx];
        if (hit) {
          openHit(hit);
        } else if (query.trim().length > 0) {
          // No top-8 hit — fall back to the full results page.
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          setOpen(false);
        }
        return;
      }
      if (e.key === "Tab") {
        // Simple focus trap — only the input is focusable; loop back.
        e.preventDefault();
        inputRef.current?.focus();
      }
    },
    [safeActiveIdx, close, hits, openHit, query, router],
  );

  if (!open) return null;

  const grouped = groupByCollection(hits);
  // Order groups by their best score so the user's first arrow-down
  // keystroke lands on the most relevant collection. Falls back to
  // COLLECTION_ORDER for stable ordering when scores tie.
  grouped.sort((a, b) => {
    const aBest = a.hits[0]?.score ?? 0;
    const bBest = b.hits[0]?.score ?? 0;
    if (aBest !== bBest) return bBest - aBest;
    return (
      COLLECTION_ORDER.indexOf(a.collection) -
      COLLECTION_ORDER.indexOf(b.collection)
    );
  });

  let runningIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      data-testid="search-palette"
      onKeyDown={onDialogKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("close")}
        onClick={close}
        tabIndex={-1}
        className={cn(
          "absolute inset-0 bg-foreground/40 backdrop-blur-sm",
          "transition-opacity duration-150",
          "motion-reduce:transition-none",
        )}
      />
      <div
        className={cn(
          "relative w-full max-w-xl rounded-lg border border-border bg-background shadow-xl",
          "transition-[opacity,transform] duration-150",
          "motion-reduce:transition-none motion-reduce:transform-none",
        )}
      >
        <h2 id={titleId} className="sr-only">
          {t("title")}
        </h2>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search
            aria-hidden="true"
            className="h-4 w-4 text-foreground-subtle"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${dialogId}-listbox`}
            aria-activedescendant={
              hits[safeActiveIdx]
                ? `${dialogId}-opt-${hits[safeActiveIdx].id}`
                : undefined
            }
            aria-autocomplete="list"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            data-testid="search-palette-input"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground-subtle"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="text-foreground-subtle hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul
          ref={listboxRef}
          id={`${dialogId}-listbox`}
          role="listbox"
          aria-label={t("resultsLabel")}
          className="max-h-[60vh] overflow-y-auto py-2"
        >
          {loading && (
            <li className="px-4 py-6 text-sm text-foreground-subtle">
              {t("loading")}
            </li>
          )}
          {!loading && error && (
            <li className="px-4 py-6 text-sm text-foreground-subtle">
              {t("errorGeneric")}
            </li>
          )}
          {!loading && !error && index && hits.length === 0 && (
            <li className="px-4 py-6 text-sm text-foreground-subtle">
              {query.trim().length === 0 ? t("hint") : t("noResults")}
            </li>
          )}
          {!loading && !error && grouped.map((group) => (
            <li
              key={group.collection}
              role="presentation"
              className="px-2 pb-2"
            >
              <div className="px-2 pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">
                {t(`collection.${group.collection}`)}
              </div>
              <ul role="presentation" className="mt-1">
                {group.hits.map((hit) => {
                  const idx = runningIdx++;
                  const isActive = idx === safeActiveIdx;
                  return (
                    <li
                      key={hit.id}
                      id={`${dialogId}-opt-${hit.id}`}
                      role="option"
                      aria-selected={isActive}
                      data-testid="search-palette-result"
                      data-active={isActive ? "true" : undefined}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => openHit(hit)}
                      className={cn(
                        "cursor-pointer rounded-md px-3 py-2",
                        isActive ? "bg-surface" : "hover:bg-surface/60",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-foreground">
                          <Highlight text={hit.title} needle={query} />
                        </span>
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
                        <p className="mt-0.5 text-xs text-foreground-muted line-clamp-2">
                          <Highlight text={hit.description} needle={query} />
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[11px] text-foreground-subtle">
          <span>{t("kbdHint")}</span>
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                setOpen(false);
              }}
              className="hover:text-accent"
            >
              {t("seeAll")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  const range = findMatchRange(text, needle.trim());
  if (!range) return <>{text}</>;
  const [a, b] = range;
  return (
    <>
      {text.slice(0, a)}
      <mark className="rounded-sm bg-accent-soft px-0.5 text-foreground">
        {text.slice(a, b)}
      </mark>
      {text.slice(b)}
    </>
  );
}
