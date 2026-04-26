"use client";

import { useEffect, useState } from "react";

export type SectionLink = {
  id: string;
  label: string;
};

type Props = {
  sections: ReadonlyArray<SectionLink>;
  /** Optional aria-label override (defaults to "On this page"). */
  ariaLabel?: string;
};

/**
 * Vertical "on this page" TOC fixed to the left edge of the viewport on
 * `lg+` screens. On smaller widths it is hidden — Dev C handles the
 * mobile equivalent.
 *
 * The active item flips when ~40% of a section is in the viewport, via
 * IntersectionObserver. Click smooth-scrolls (unless the user prefers
 * reduced motion). Lean by design — no library, no animation
 * machinery, no sticky-header coupling.
 */
export function SectionNav({ sections, ariaLabel = "On this page" }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  useEffect(() => {
    if (sections.length === 0) return;
    // Guard for environments without IntersectionObserver (test runners,
    // very old browsers). In that case we silently skip the active-state
    // tracking — the nav still works as plain anchor links.
    if (typeof IntersectionObserver === "undefined") return;
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // rootMargin tuned so a section becomes "active" once roughly its
    // upper-third clears the viewport top — feels right for long-scroll
    // single-page layouts.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-20% 0px -40% 0px",
        threshold: [0.4, 0.6, 0.8],
      },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  function handleClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    const target = document.getElementById(id);
    if (!target) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    // Update the URL hash without forcing a jump (we already scrolled).
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="hidden lg:block fixed left-6 top-1/3 z-20"
    >
      <ul className="flex flex-col gap-3 border-l border-border/60 pl-4">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                aria-current={active ? "location" : undefined}
                className={[
                  "group inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] transition-colors",
                  active
                    ? "font-bold text-accent"
                    : "text-foreground-subtle hover:text-accent",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "inline-block h-1.5 w-1.5 rounded-full transition-colors",
                    active
                      ? "bg-accent"
                      : "bg-border group-hover:bg-accent",
                  ].join(" ")}
                />
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
