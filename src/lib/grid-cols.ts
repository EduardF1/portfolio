/**
 * Pick a `grid-cols-N` Tailwind class given the actual item count and a
 * desired maximum (the layout's "ideal" column count). When the item
 * count is below the maximum, we collapse the grid to that many columns
 * so a 2-up grid in a slot designed for 3 doesn't render with an empty
 * third rectangle.
 *
 * Returns full literal class strings so Tailwind's source scanner picks
 * them up at build time. Do not concatenate variants like `sm:` outside
 * — Tailwind needs the variant + utility to appear as a single literal
 * substring somewhere in source code.
 */
export function gridColsClass(count: number, max: 1 | 2 | 3 = 3): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return max >= 2 ? "grid-cols-2" : "grid-cols-1";
  return max >= 3 ? "grid-cols-3" : max === 2 ? "grid-cols-2" : "grid-cols-1";
}

/**
 * Responsive cols-class for a layout that wants up to 2-up at sm: and
 * up to 3-up at lg:, but never more rectangles than it has items. The
 * second arg is the cap — caps below 3 keep the grid at sm:grid-cols-2
 * top end (used by the /work case-study grid, which is 2-up).
 */
export function responsiveGridColsClass(
  count: number,
  cap: 2 | 3 = 3,
): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) {
    return cap >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  }
  // 3+
  if (cap === 2) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}
