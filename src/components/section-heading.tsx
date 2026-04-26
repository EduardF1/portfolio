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

  return (
    <div>
      {kicker && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          {kicker}
        </p>
      )}
      <Heading id={id} className={mergedHeadingClass || undefined}>
        <span className="inline-flex items-baseline gap-2">
          <span>{children}</span>
          {tooltip && (
            <span
              className="group/tooltip relative inline-flex"
              onMouseEnter={checkEdge}
              onFocus={checkEdge}
            >
              <button
                type="button"
                aria-label={ariaLabel}
                className="inline-flex h-4 w-4 items-center justify-center text-foreground-subtle transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
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
                  "pointer-events-none absolute left-1/2 bottom-full mb-2 z-10",
                  "-translate-x-1/2 translate-x-[var(--tt-dx)]",
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
          )}
        </span>
      </Heading>
    </div>
  );
}
