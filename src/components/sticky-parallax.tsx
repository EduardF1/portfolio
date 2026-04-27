/**
 * Sticky-parallax card wrapper for the prototype track.
 *
 * Wraps a list of cards (writing posts, recommends entries) and gives
 * each one a small height buffer + `position: sticky` so the card pins
 * briefly at the top of the viewport on scroll, then releases as the
 * next card slides over it. Pure CSS — no JS, no animation libraries.
 *
 * The `prefers-reduced-motion` media query disables the sticky stack
 * (cards become static block-flow) so the prototype doesn't disorient
 * users who opt out of motion.
 *
 * Mounting is gated upstream by `parallaxCardsEnabled()`.
 */

import type { ReactNode } from "react";

export function StickyParallaxStack({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="sticky-parallax-stack"
      className="proto-sticky-stack relative"
    >
      {children}
    </div>
  );
}

export function StickyParallaxItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  // Each card pins to the top of the viewport when scrolled into the
  // sticky region. Stagger the offset slightly so cards feel layered
  // rather than stacked atop one another at the same px.
  const top = 64 + (index % 4) * 8;
  return (
    <div
      data-testid="sticky-parallax-item"
      className="proto-sticky-item sticky"
      style={{ top: `${top}px` }}
    >
      {children}
    </div>
  );
}
