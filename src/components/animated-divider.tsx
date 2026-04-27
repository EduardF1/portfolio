"use client";

/**
 * Subtle animated divider for the prototype track.
 *
 * Renders a thin gradient line with an SVG sweep that animates in once
 * the divider scrolls into view. Implementation is pure CSS — the
 * IntersectionObserver only flips a `data-visible` attribute, all motion
 * is driven by the resulting attribute selector.
 *
 * - 600ms ease-out fade + sweep
 * - `motion-reduce:` variants keep the line static for users who prefer
 *   reduced motion (the divider still appears, it just doesn't sweep)
 * - Mounting is gated upstream by `animatedDividersEnabled()`; this
 *   component does not read env directly so it stays mock-friendly
 */

import { useEffect, useRef, useState } from "react";

export function AnimatedDivider() {
  const ref = useRef<HTMLDivElement | null>(null);
  // Initialise from the IntersectionObserver capability check — when the
  // API is missing (SSR or very old browsers) we render the divider as
  // permanently visible so the line still appears, just without the sweep.
  const [visible, setVisible] = useState<boolean>(() =>
    typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-testid="animated-divider"
      data-visible={visible ? "true" : "false"}
      aria-hidden="true"
      className="relative mx-auto h-px w-full max-w-5xl overflow-hidden"
    >
      {/* Base gradient line — fades in once visible */}
      <div
        className={[
          "absolute inset-0",
          "bg-[linear-gradient(90deg,transparent_0%,var(--color-border)_20%,var(--color-accent)_50%,var(--color-border)_80%,transparent_100%)]",
          "opacity-0 transition-opacity duration-[600ms] ease-out",
          "data-[visible=true]:opacity-100",
          "motion-reduce:opacity-100 motion-reduce:transition-none",
        ].join(" ")}
        data-visible={visible ? "true" : "false"}
      />
      {/* SVG sweep — a brighter highlight that slides across the line on entry */}
      <svg
        className={[
          "absolute inset-0 h-full w-full",
          "opacity-0 transition-opacity duration-[600ms] ease-out",
          "data-[visible=true]:opacity-100",
          "motion-reduce:hidden",
        ].join(" ")}
        data-visible={visible ? "true" : "false"}
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="proto-divider-sweep"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
            <stop
              offset="50%"
              stopColor="var(--color-accent)"
              stopOpacity="0.9"
            />
            <stop
              offset="100%"
              stopColor="var(--color-accent)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <rect
          x={visible ? "0" : "-100"}
          y="0"
          width="100"
          height="1"
          fill="url(#proto-divider-sweep)"
          className="proto-divider-sweep-rect"
        />
      </svg>
    </div>
  );
}
