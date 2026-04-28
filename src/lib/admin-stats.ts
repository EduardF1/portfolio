/**
 * Helpers for the /admin/stats dashboard's "extra" sections (palette ×
 * theme combos, search queries) plus the small CSS-bar-chart maths.
 *
 * Kept separate from `./analytics.ts` (which is dedicated to /api/track
 * visit shapes) so that:
 *   - this file can stay zero-dependency / pure
 *   - upcoming Round 6 sibling work (A3's `/api/track-palette`, the
 *     FlexSearch query log) can swap in real data sources without
 *     touching the dashboard component
 *
 * The `PaletteStats` shape mirrors A3's contract:
 *   GET /api/track-palette?secret=<ADMIN_SECRET>
 *     -> { counters, palettes, themes, updatedAt }
 * If A3 hasn't merged yet the fetcher returns an empty stub; the
 * dashboard renders a "no data yet" state without crashing.
 */

/** Single counter row used by the bar-chart helper. */
export type CountRow = { key: string; count: number };

/**
 * Compute pixel-percent widths for a horizontal bar chart, where the
 * widest bar is always 100% and every other bar scales proportionally.
 *
 * Edge-cases (locked in by tests):
 *   - empty input -> []
 *   - all zeroes  -> every pct is 0 (we don't divide by zero)
 *   - negatives are floored to 0 (defensive — counters should never be
 *     negative, but a corrupt Redis read shouldn't break rendering)
 *   - rows are returned in input order (caller decides sort)
 */
export function barChartPercents(
  rows: ReadonlyArray<CountRow>,
): Array<CountRow & { pct: number }> {
  if (rows.length === 0) return [];
  const max = rows.reduce((m, r) => Math.max(m, r.count > 0 ? r.count : 0), 0);
  return rows.map((r) => {
    const safe = r.count > 0 ? r.count : 0;
    const pct = max === 0 ? 0 : (safe / max) * 100;
    return { key: r.key, count: r.count, pct };
  });
}

/** Sort rows by count descending; stable on tie via key (asc) for determinism. */
export function sortByCountDesc<T extends CountRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.key.localeCompare(b.key);
  });
}

/** Cap at top N after sorting. */
export function topRows<T extends CountRow>(rows: T[], n: number): T[] {
  return sortByCountDesc(rows).slice(0, n);
}

/**
 * Shape returned by A3's `/api/track-palette?secret=…`. The `counters`
 * map is keyed by the literal string `"<palette>::<theme>"` to match
 * what the client emitter sends (palette/theme cartesian product).
 */
export type PaletteStats = {
  counters: Record<string, number>;
  palettes: string[];
  themes: string[];
  /** ISO8601 — last time a counter was bumped. Empty string when no data. */
  updatedAt: string;
};

export const EMPTY_PALETTE_STATS: PaletteStats = {
  counters: {},
  palettes: [],
  themes: [],
  updatedAt: "",
};

/**
 * Fetch the palette × theme counters from the sibling API. Server-side
 * only (uses absolute URL + the admin secret). Returns an empty stub
 * when:
 *   - ADMIN_SECRET is unset (dev)
 *   - the route hasn't shipped yet (404)
 *   - the response is malformed
 *
 * TODO(po): once A3 merges, drop the 404 fallback path.
 */
export async function fetchPaletteStats(
  baseUrl: string,
  secret: string | undefined,
): Promise<PaletteStats> {
  if (!secret) return EMPTY_PALETTE_STATS;
  const url = `${baseUrl.replace(/\/$/, "")}/api/track-palette?secret=${encodeURIComponent(secret)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return EMPTY_PALETTE_STATS;
    const json = (await res.json()) as Partial<PaletteStats> | null;
    if (!json || typeof json !== "object") return EMPTY_PALETTE_STATS;
    return {
      counters:
        json.counters && typeof json.counters === "object" ? json.counters : {},
      palettes: Array.isArray(json.palettes) ? json.palettes : [],
      themes: Array.isArray(json.themes) ? json.themes : [],
      updatedAt: typeof json.updatedAt === "string" ? json.updatedAt : "",
    };
  } catch {
    return EMPTY_PALETTE_STATS;
  }
}

/**
 * Convert PaletteStats counters into bar-chart rows of the form
 * `palette / theme` -> count, top N. Used directly by the dashboard.
 */
export function topPaletteCombos(
  stats: PaletteStats,
  n: number,
): Array<CountRow & { palette: string; theme: string }> {
  const rows: Array<CountRow & { palette: string; theme: string }> = [];
  for (const [key, count] of Object.entries(stats.counters)) {
    if (typeof count !== "number" || count < 0) continue;
    const [palette, theme] = key.split("::", 2);
    if (!palette || !theme) continue;
    rows.push({ key: `${palette} · ${theme}`, count, palette, theme });
  }
  return sortByCountDesc(rows).slice(0, n);
}

/**
 * Read the FlexSearch query log if one exists. Currently a no-op stub
 * — the FlexSearch client logs queries to localStorage only (privacy
 * default, no server round-trip). When PO greenlights server-side
 * search analytics this will read from `searchq:YYYY-MM-DD` ZSETs.
 *
 * TODO(po): wire to the search index once a privacy review is signed.
 */
export async function getSearchQueryStats(): Promise<CountRow[]> {
  return [];
}
