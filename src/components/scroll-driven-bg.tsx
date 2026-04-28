/**
 * Scroll-driven background prototype.
 *
 * Renders a fixed-position decorative layer behind the hero/about that
 * uses CSS `animation-timeline: scroll()` to shift hue and position as
 * the page scrolls. Wrapped in `@supports (animation-timeline: scroll())`
 * (declared in `globals.css`) so Safari and Firefox fall back to the
 * static gradient without animation.
 *
 * No JS — server component, no client hydration cost. Mounting is gated
 * upstream by `scrollBackgroundEnabled()`.
 *
 * Honours `prefers-reduced-motion` via the `motion-reduce` Tailwind
 * variant, which falls back to the static gradient.
 */

export function ScrollDrivenBackground() {
  return (
    <div
      data-testid="scroll-driven-bg"
      aria-hidden="true"
      className="proto-scroll-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="proto-scroll-bg-layer absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-accent-soft)_0%,transparent_45%),radial-gradient(circle_at_70%_80%,var(--color-surface-strong)_0%,transparent_50%)] opacity-60 motion-reduce:animate-none" />
    </div>
  );
}
