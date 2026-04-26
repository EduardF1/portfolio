/**
 * Pure aggregation helpers for the metrics POC.
 *
 * Kept dependency-free and side-effect-free so it's trivially unit-
 * testable. The Redis client lives in `./redis-analytics`; this file
 * only knows about Hit shapes and the bucketing maths.
 */
import type { DeviceType } from "./ua-parser";

export type Hit = {
  path: string;
  ref: string;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string;
  os: string;
  deviceType: DeviceType;
  sessionId: string;
  ts: number;
};

export type RangeKey = "today" | "7d" | "30d" | "all";

export const RANGE_DAYS: Record<RangeKey, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  all: 90, // soft cap — see `purgeOlderThan` TODO in redis-analytics.ts
};

/**
 * yyyy-MM-dd in UTC. We store hits keyed by UTC date so the bucketing
 * is stable across deploy regions; the dashboard renders "today" in
 * the visitor's locale at display time, not at storage time.
 */
export function dayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the list of yyyy-MM-dd keys covering the last `days` days,
 * inclusive, in chronological order. Always uses UTC.
 */
export function dayKeysForRange(now: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/**
 * Group hits by day. Returns a map of yyyy-MM-dd → count, padded with
 * zeroes for days in the requested range that have no hits. The
 * dashboard's tiny inline bar chart relies on this padding so the
 * x-axis shows continuous days, not just the days we have data for.
 */
export function bucketHitsByDay(
  hits: Pick<Hit, "ts">[],
  rangeDays: string[],
): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(
    rangeDays.map((d) => [d, 0]),
  );
  for (const h of hits) {
    const k = dayKey(new Date(h.ts));
    if (k in out) out[k] += 1;
  }
  return out;
}

/**
 * Pick the top N entries from a count map, sorted by count desc,
 * then by key asc for stable output. Used for top pages / top
 * referrers / top countries / browser mix.
 */
export function topN<K extends string>(
  counts: Record<K, number>,
  n: number,
): Array<{ key: K; count: number }> {
  return (Object.entries(counts) as Array<[K, number]>)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    })
    .slice(0, n);
}

/**
 * Count occurrences of `field` across hits. Hits where the field is
 * null/empty are dropped (we don't surface "unknown country" rows
 * because they're noise — the empty-state copy already covers that).
 */
export function countBy<K extends keyof Hit>(
  hits: Hit[],
  field: K,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of hits) {
    const raw = h[field];
    if (raw == null || raw === "") continue;
    const v = String(raw);
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

/** Count hits per device-type bucket. Always emits all three keys. */
export function deviceMix(hits: Hit[]): Record<DeviceType, number> {
  const out: Record<DeviceType, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const h of hits) out[h.deviceType] += 1;
  return out;
}

/** Unique session count — what we surface as "unique visitors". */
export function uniqueSessions(hits: Hit[]): number {
  const set = new Set<string>();
  for (const h of hits) set.add(h.sessionId);
  return set.size;
}

/**
 * Normalise a Referer header into a host. Drops self-referrals
 * (same-origin), querystrings, and anything we can't parse. Returns
 * null when the referrer is missing or matches the site's own host.
 */
export function normalizeReferrer(
  ref: string | null | undefined,
  selfHost: string | null = null,
): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    if (selfHost && u.host === selfHost) return null;
    return u.host || null;
  } catch {
    return null;
  }
}

/**
 * Generate a short, opaque, anonymous session id. We don't rely on
 * crypto.randomUUID because the Edge runtime guarantee for it is
 * uneven across Vercel regions; a 16-byte hex is plenty for our
 * 30-min TTL bucketing and works in every JS runtime we target.
 */
export function generateSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
