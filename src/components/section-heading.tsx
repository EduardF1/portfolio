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
  const [flipped, setFlipped] = useState(false);

  // Right-edge overflow detection — flip the tooltip to the left of the icon
  // when the right edge would clip outside the viewport. Recomputed on every
  // hover/focus to handle scroll position and resize.
  function checkOverflow() {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFlipped(rect.right > window.innerWidth - 8);
  }

  useEffect(() => {
    if (!tooltip) return;
    function onResize() {
      checkOverflow();
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
              onMouseEnter={checkOverflow}
              onFocus={checkOverflow}
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
                data-flip={flipped ? "true" : "false"}
                style={{
                  width: "clamp(280px, 38vw, 480px)",
                  maxHeight: "6em",
                }}
                className={[
                  // Default (<640px): drop below the icon, page-padding-aware
                  "pointer-events-none absolute left-0 top-full mt-2 z-10",
                  // Default width override on small viewports
                  "max-[639px]:!w-[min(calc(100vw-2rem),320px)]",
                  // Above sm: anchor to the right of the icon, vertically centered
                  "sm:left-full sm:top-1/2 sm:mt-0 sm:ml-2 sm:-translate-y-1/2",
                  // Right-edge flip: switch to left-of-icon
                  "data-[flip=true]:sm:left-auto data-[flip=true]:sm:right-full data-[flip=true]:sm:ml-0 data-[flip=true]:sm:mr-2",
                  // Visuals
                  "overflow-hidden rounded-md bg-foreground px-3 py-2 text-xs font-normal normal-case tracking-normal leading-[1.4] text-background shadow",
                  // Reveal animation: opacity + 4px translate-x slide
                  "opacity-0 translate-x-0 transition-[opacity,transform] duration-150",
                  "group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-1",
                  "group-focus-within/tooltip:pointer-events-auto group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:translate-x-1",
                  // Flipped slide direction
                  "data-[flip=true]:group-hover/tooltip:-translate-x-1 data-[flip=true]:group-focus-within/tooltip:-translate-x-1",
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
