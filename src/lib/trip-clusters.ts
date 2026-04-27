/**
 * Lightweight trip-clustering helper for the heatmap (chloropleth) view
 * on /travel.
 *
 * Why a separate file from `src/lib/trips.ts`?
 *   - `trips.ts` clusters by `(country, year-month)` with an adjacent-month
 *     merge for trips that straddle a calendar boundary. That model is
 *     tuned for the per-trip page-grouping in the rest of the site.
 *   - The heatmap brief asks for "distinct trips that landed in a
 *     country" using a stricter date+country, ≤3-day gap rule. That
 *     produces a slightly different (usually smaller) trip count for
 *     countries visited multiple times in the same month.
 *
 * The two models can converge later; for now this helper is local and
 * pure so it is trivial to unit-test and to swap when A1's helper
 * lands.
 */

/** Maximum gap (in days) between two photos in the same country
 *  before they are considered separate trips. The brief specifies
 *  "≤3-day gap = one trip", so a strictly-greater-than threshold of
 *  3 days starts a new cluster. */
export const TRIP_GAP_DAYS = 3;

/** Minimal shape we need from a catalogue entry. */
export type ClusterableEntry = {
  takenAt?: string;
  place?: { country?: string };
};

/**
 * Cluster catalogue entries into distinct trips.
 *
 * Algorithm:
 *   1. Drop entries without `takenAt` or `place.country`.
 *   2. Group by country.
 *   3. Inside each country, sort chronologically and walk: open a new
 *      cluster whenever the gap between consecutive photos exceeds
 *      `TRIP_GAP_DAYS`.
 *
 * Returns a Map keyed by country name, value = number of distinct
 * trips. Stable, deterministic, and dependency-free.
 */
export function tripCountByCountry(
  entries: ClusterableEntry[],
): Map<string, number> {
  const byCountry = new Map<string, number[]>();
  for (const e of entries) {
    if (!e.takenAt || !e.place?.country) continue;
    const t = Date.parse(e.takenAt);
    if (Number.isNaN(t)) continue;
    let list = byCountry.get(e.place.country);
    if (!list) {
      list = [];
      byCountry.set(e.place.country, list);
    }
    list.push(t);
  }

  const counts = new Map<string, number>();
  const dayMs = 24 * 60 * 60 * 1000;
  for (const [country, times] of byCountry) {
    times.sort((a, b) => a - b);
    let trips = 1;
    for (let i = 1; i < times.length; i += 1) {
      const gapDays = (times[i] - times[i - 1]) / dayMs;
      if (gapDays > TRIP_GAP_DAYS) trips += 1;
    }
    counts.set(country, trips);
  }
  return counts;
}

/**
 * Bucket a trip count into one of 5 fill tiers used by the chloropleth.
 *
 * Tiers (per the brief):
 *   0  → 0 trips        → neutral fill
 *   1  → 1 trip         → lightest accent
 *   2  → 2-3 trips      → mid
 *   3  → 4-5 trips      → mid-dark
 *   4  → 6+ trips       → darkest
 */
export function tierForTripCount(n: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 5) return 3;
  return 4;
}

/** Human-readable trip-count range labels for the legend, in tier order. */
export const TIER_RANGE_LABELS: readonly [string, string, string, string, string] = [
  "0",
  "1",
  "2–3",
  "4–5",
  "6+",
];
