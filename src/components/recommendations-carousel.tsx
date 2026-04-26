"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Recommendation } from "@/lib/recommendations";

const DWELL_MS = 7000;
const SWIPE_THRESHOLD = 50;

type Mode = "auto" | "manual";

type Props = {
  recommendations: Recommendation[];
  /** Active locale — used to pick `quoteEn` over `quote` for DA-source items on `en`. */
  locale: "en" | "da";
};

function pickQuote(r: Recommendation, locale: "en" | "da"): string {
  if (locale === "en" && r.language === "da" && r.quoteEn) return r.quoteEn;
  return r.quote;
}

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function linkedinHref(r: Recommendation): string {
  if (r.linkedinUrl) return r.linkedinUrl;
  const q = encodeURIComponent(`${r.author} ${r.company}`.trim());
  return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
}

export function RecommendationsCarousel({ recommendations, locale }: Props) {
  const slides = recommendations;
  const total = slides.length;
  const id = useId();

  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<Mode>(() => (reduced ? "manual" : "auto"));
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Subscribe to prefers-reduced-motion changes (initial value already in state).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function onChange() {
      setReduced(mq.matches);
      if (mq.matches) setMode("manual");
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Auto-rotate timer.
  useEffect(() => {
    if (total <= 1) return;
    if (mode !== "auto") return;
    if (paused) return;
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % total);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [mode, paused, reduced, total]);

  const goTo = useCallback((next: number) => {
    setMode("manual");
    setActive(((next % total) + total) % total);
  }, [total]);

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const sx = touchStartX.current;
    const sy = touchStartY.current;
    if (sx == null || sy == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll, not a swipe
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx > 0) prev();
    else next();
  }

  if (total === 0) return null;

  const liveMode: "off" | "polite" = mode === "auto" ? "off" : "polite";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Recommendations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="@container group/carousel relative mx-auto w-full max-w-3xl"
    >
      {/* Slides */}
      <div
        aria-live={liveMode}
        aria-atomic="true"
        className="relative min-h-[320px] py-12 @md:py-16"
      >
        {slides.map((r, i) => {
          const isActive = i === active;
          return (
            <article
              key={r.slug}
              id={`${id}-slide-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${total}`}
              aria-hidden={!isActive}
              className={[
                isActive ? "relative" : "absolute inset-0 pointer-events-none",
                isActive ? "opacity-100" : "opacity-0",
                "transition-opacity duration-300 motion-reduce:transition-none",
              ].join(" ")}
            >
              {isActive && (
                <div className="text-center">
                  <p
                    className="font-serif italic text-2xl @md:text-3xl leading-[1.25] text-foreground"
                    style={{ textIndent: "-0.4em" }}
                  >
                    {`“${pickQuote(r, locale)}”`}
                  </p>
                  <p className="mt-8 text-foreground-subtle">{`—`}</p>
                  <div className="mt-3 flex items-center justify-center gap-3 text-sm text-foreground-muted">
                    {r.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.portrait}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface font-serif text-base"
                      >
                        {avatarInitial(r.author)}
                      </span>
                    )}
                    <span>
                      <a
                        href={linkedinHref(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-accent transition-colors"
                        aria-label={`${r.author} on LinkedIn`}
                      >
                        {r.author}
                      </a>
                      {r.role && ` · ${r.role}`}
                      {r.company && `, ${r.company}`}
                    </span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Arrows (desktop, hover only) */}
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 hidden @md:[@media(hover:hover)]:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground-subtle opacity-0 transition-opacity hover:text-accent group-hover/carousel:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden @md:[@media(hover:hover)]:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground-subtle opacity-0 transition-opacity hover:text-accent group-hover/carousel:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Dots + pause/play */}
      {total > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <ul className="flex items-center gap-2">
            {slides.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Go to slide ${i + 1} of ${total}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className={[
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === active
                      ? "bg-accent"
                      : "bg-border hover:bg-foreground-subtle",
                  ].join(" ")}
                />
              </li>
            ))}
          </ul>
          {!reduced && mode === "auto" && (
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="text-xs text-foreground-subtle hover:text-accent transition-colors"
            >
              Pause
            </button>
          )}
        </div>
      )}
    </div>
  );
}
