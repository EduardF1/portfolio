"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

type Props = {
  kicker?: string;
  children: React.ReactNode;
  tooltip?: string;
  id?: string;
  level?: "h1" | "h2";
  headingClassName?: string;
};

export function SectionHeading({
  kicker,
  children,
  tooltip,
  id,
  level = "h2",
  headingClassName,
}: Props) {
  const Heading = level;
  const ariaLabel = `What is ${kicker || "this section"}?`;
  const baseHeadingClass = kicker ? "mt-4" : "";
  const mergedHeadingClass = [baseHeadingClass, headingClassName ?? ""]
    .filter(Boolean)
    .join(" ");

  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [edgeOffset, setEdgeOffset] = useState(0);

  // Tooltip sits ABOVE the icon, centered horizontally on it. If the natural
  // centred placement would clip the viewport (left or right), shift it
  // horizontally just enough to stay on-canvas. Recomputed on hover/focus.
  function checkEdge() {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let dx = 0;
    if (rect.left < margin) dx = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) {
      dx = window.innerWidth - margin - rect.right;
    }
    setEdgeOffset(dx);
  }

  useEffect(() => {
    if (!tooltip) return;
    function onResize() {
      checkEdge();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tooltip]);

  // Standardised layout: kicker + heading on the left, info icon (when
  // present) anchored to the upper-right of the heading row, aligned
  // with the heading baseline. This puts every section's tooltip in the
  // same place on the page rather than floating inline next to the
  // heading text — consistency Eduard called out in the V1 polish pass.
  const tooltipNode = tooltip ? (
    <span
      className="group/tooltip relative inline-flex shrink-0"
      onMouseEnter={checkEdge}
      onFocus={checkEdge}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className="inline-flex h-5 w-5 items-center justify-center text-foreground-subtle transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        ref={tooltipRef}
        role="tooltip"
        style={{
          width: "max-content",
          maxWidth: "min(90vw, 360px)",
          // edgeOffset is added to the centring transform so a
          // tooltip about to clip the viewport edge slides over
          // just enough to stay visible.
          ["--tt-dx" as string]: `${edgeOffset}px`,
        }}
        className={[
          // Anchor: above the icon, centred horizontally on it
          "pointer-events-none absolute right-0 bottom-full mb-2 z-10",
          "translate-x-[var(--tt-dx)]",
          // Visuals — fit content (no forced width), comfortable padding
          "rounded-md bg-foreground px-3 py-2 text-xs font-normal normal-case tracking-normal leading-[1.4] text-background shadow",
          "whitespace-normal",
          // Reveal: opacity + 4px translate-y rise (from below into above)
          "opacity-0 transition-[opacity,transform] duration-150",
          "group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-1",
          "group-focus-within/tooltip:pointer-events-auto group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:-translate-y-1",
          // Reduced motion
          "motion-reduce:transition-none motion-reduce:transform-none",
        ].join(" ")}
      >
        {tooltip}
      </span>
    </span>
  ) : null;

  return (
    <div>
      {kicker && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          {kicker}
        </p>
      )}
      <div className="flex items-start justify-between gap-4">
        <Heading id={id} className={mergedHeadingClass || undefined}>
          {children}
        </Heading>
        {tooltipNode && (
          <span
            className={[
              // Pin to the upper right of the heading row, baseline-aligned
              // with the heading text. mt-* mirrors the heading's own
              // top-margin (mt-4 when kicker is present).
              "shrink-0",
              kicker ? "mt-4 pt-1" : "pt-1",
            ].join(" ")}
          >
            {tooltipNode}
          </span>
        )}
      </div>
    </div>
  );
}
