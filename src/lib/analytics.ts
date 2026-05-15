/**
 * Pure aggregation helpers for the metrics POC.
 *
 * Kept dependency-free and side-effect-free so it's trivially unit-
 * testable. The Redis client lives in `./redis-analytics`; this file
 * only knows about Hit shapes and the bucketing maths.
 */
import type { DeviceType } from "./ua-parser";

/**
 * Discrete client-side events the tracker can beacon. `pageview` is the
 * historic default and remains the implicit value when `event` is not
 * present on an older stored Hit. Newer enrichments add CV downloads,
 * EN/DA language toggles, outbound link clicks, and exit signals so we
 * can build a real journey view in the dashboard.
 */
export type TrackEvent =
  | "pageview"
  | "cv_download"
  | "language_switch"
  | "external_link"
  | "exit";

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
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  // --- enrichment fields (Phase 2, all optional for backwards compat) ---
  /**
   * Client-minted tab-scoped session id (sessionStorage). Distinct from
   * `sessionId` which is the server cookie. We keep both because the
   * cookie can be shared across tabs while this one cannot, and the
   * combination lets us split "visits" from "tabs" in the dashboard.
   */
  clientSessionId?: string;
  /** Max scroll depth reached during the session, 0..100. */
  scrollDepthPct?: number;
  /** Foreground time on page in milliseconds, sent on heartbeat / exit. */
  timeOnPageMs?: number;
  /** UTM term — captured from URL on first hit per session. */
  utmTerm?: string;
  /** UTM content — captured from URL on first hit per session. */
  utmContent?: string;
  /** Hostname-only referrer (no querystring / path), or "" for direct. */
  referrerHost?: string;
  /** "en" or "da" — inferred from current pathname. */
  lang?: "en" | "da";
  /** Event discriminator. Defaults to "pageview" when missing. */
  event?: TrackEvent;
  /**
   * For `cv_download` and `external_link` events: the target slug or
   * hostname. Never a full URL with query strings — those can carry PII
   * and we explicitly strip them client-side.
   */
  linkHref?: string;
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

/** Returns a Record<0..23, number> — count of hits per UTC hour. */
export function bucketHitsByHour(
  hits: Pick<Hit, "ts">[],
): Record<number, number> {
  const out: Record<number, number> = Object.fromEntries(
    Array.from({ length: 24 }, (_, h) => [h, 0]),
  );
  for (const h of hits) {
    out[new Date(h.ts).getUTCHours()] += 1;
  }
  return out;
}

const MIN_HITS_TO_CHECK = 15;
const SUSPICION_THRESHOLD = 0.9;

/**
 * Returns the set of yyyy-MM-dd keys where traffic looks bot-like:
 * a single session accounts for ≥ 90 % of that day's hits AND the
 * day has at least 15 total hits.
 */
export function suspiciousDays(hits: Hit[], days: string[]): Set<string> {
  const hitsByDay: Record<string, Hit[]> = Object.fromEntries(
    days.map((d) => [d, []]),
  );
  for (const h of hits) {
    const k = dayKey(new Date(h.ts));
    if (k in hitsByDay) hitsByDay[k].push(h);
  }
  const suspicious = new Set<string>();
  for (const [day, dayHits] of Object.entries(hitsByDay)) {
    if (dayHits.length < MIN_HITS_TO_CHECK) continue;
    const sessionCounts: Record<string, number> = {};
    for (const h of dayHits) {
      sessionCounts[h.sessionId] = (sessionCounts[h.sessionId] ?? 0) + 1;
    }
    const maxCount = Math.max(...Object.values(sessionCounts));
    if (maxCount / dayHits.length >= SUSPICION_THRESHOLD) {
      suspicious.add(day);
    }
  }
  return suspicious;
}
