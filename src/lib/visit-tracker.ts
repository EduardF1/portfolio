import "server-only";

/**
 * Server-side visit tracking helpers for the daily digest cron.
 *
 * This file is the SERVER-side counterpart of the
 * `<VisitTracker />` component (`src/components/visit-tracker.tsx`).
 * The component beacons `{ path, ref }` to `/api/track`; that route
 * already records each hit into Redis via `recordHit` from
 * `redis-analytics.ts`. The digest needs ONE extra signal on top of
 * what `recordHit` writes — a per-day uniqueness counter keyed by an
 * anonymised IP-hash so we can answer "how many distinct devices
 * visited yesterday?" without storing IPs (the existing
 * `sessions:YYYY-MM-DD` SET keys cookie sessions, which expire after
 * 30 minutes and undercount cross-session visitors).
 *
 * The counter is a Redis SET keyed `visits:YYYY-MM-DD:<ip-hash>` (one
 * key per visitor per day, value irrelevant — presence is the signal).
 * Aggregating with `KEYS visits:YYYY-MM-DD:*` + `length` gives unique
 * visitors-per-day; we never read individual hashes back, never log
 * them, and never include them in the email.
 *
 * Privacy posture (matches the public commitment on `/privacy`):
 *   - The IP is hashed with SHA-256 of `IP + DAILY_SALT` and the
 *     digest is truncated to the first 16 hex chars (64 bits). 16 hex
 *     chars is enough to avoid collisions in a one-day window of <
 *     hundreds of unique visitors per day for a personal portfolio,
 *     and short enough that a brute-force pre-image with a known
 *     `DAILY_SALT` is the only attack — which is why the salt is
 *     server-only and rotates daily (the date itself is folded in).
 *   - The plaintext IP is never persisted, never logged, and never
 *     leaves this function.
 *   - We rely on the Vercel header `x-vercel-forwarded-for` which is
 *     already present at the edge; we DO NOT add any new IP-bearing
 *     code path.
 *
 * Coordinated with Senior Dev A3 (palette tracking): same KV instance
 * (Upstash via `KV_REST_API_*` or `UPSTASH_REDIS_REST_*`), same
 * privacy posture (no PII stored, aggregate-only).
 */
import { dayKey } from "./analytics";

const DEFAULT_SALT = "portfolio-visit-tracker-rotate-me";

/**
 * SHA-256 of `ip + dateKey + salt` truncated to the first 16 hex
 * chars (64 bits).
 *
 * 16 hex chars is a deliberate compromise: enough entropy to avoid
 * collisions in a personal-portfolio-scale day (~hundreds of uniques
 * tops), short enough that the hash is plainly anonymised in the eyes
 * of a privacy reviewer. Truncation also bounds the Redis key length.
 *
 * Inputs:
 *   - `ip`     : raw IPv4/IPv6 string from `x-vercel-forwarded-for`.
 *                Empty / falsy returns the literal "unknown" hash so
 *                callers can still increment a per-day bucket without
 *                special-casing missing IPs.
 *   - `dateKey`: yyyy-MM-dd UTC. Folded into the hash so the same IP
 *                produces a different hash each day, defeating
 *                cross-day correlation attacks even if `DAILY_SALT`
 *                is leaked.
 *   - `salt`   : defaults to `process.env.DAILY_SALT`, falling back
 *                to a constant. Operators MUST set `DAILY_SALT` in
 *                Vercel; the constant is only there so dev/test runs
 *                don't crash on missing env.
 *
 * Implemented with Web Crypto (`crypto.subtle.digest`) so it works in
 * BOTH the Edge runtime (where `/api/track` calls it) and the Node
 * runtime (where the cron + tests run). Async by necessity —
 * `subtle.digest` returns a Promise.
 */
export async function hashIpForDay(
  ip: string | null | undefined,
  dateKey: string,
  salt: string = process.env.DAILY_SALT ?? DEFAULT_SALT,
): Promise<string> {
  const safeIp = ip && ip.length > 0 ? ip : "unknown";
  const data = new TextEncoder().encode(`${safeIp}|${dateKey}|${salt}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex.slice(0, 16);
}

/**
 * Pull a likely-client IP out of a Vercel request header bag. We
 * prefer `x-vercel-forwarded-for` (Vercel's own) and fall back to
 * `x-forwarded-for` (first hop in the comma list). Returns null if
 * neither header is present — callers should treat that as a
 * "missing" signal and skip the increment rather than persist a
 * synthetic value.
 */
export function extractClientIp(headers: Headers): string | null {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

/**
 * Build the Redis key under which a given IP-hash is recorded for a
 * given day. Exported separately so the cron and tests can compose
 * keys without re-implementing the convention.
 */
export function visitKey(dateKey: string, ipHash: string): string {
  return `visits:${dateKey}:${ipHash}`;
}

/**
 * Build the Redis key for the per-day SET of all unique IP-hashes
 * seen that day. We use a SET (cardinality = unique visitors) plus
 * one short-lived per-hash key so that the cron only has to do
 * `SCARD visits-set:YYYY-MM-DD` to count unique visitors — no
 * `KEYS *` scan, which is forbidden in Upstash REST.
 */
export function visitsSetKey(dateKey: string): string {
  return `visits-set:${dateKey}`;
}

type RedisCommand = (string | number)[];

function redisEnv(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function execPipeline(
  commands: RedisCommand[],
): Promise<unknown[] | null> {
  const env = redisEnv();
  if (!env || commands.length === 0) return null;
  try {
    const res = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[visit-tracker] pipeline ${res.status}`);
      return null;
    }
    const json = (await res.json()) as Array<{
      result?: unknown;
      error?: string;
    }>;
    return json.map((r) => (r.error ? null : r.result ?? null));
  } catch (e) {
    console.error("[visit-tracker] pipeline failed", e);
    return null;
  }
}

async function execOne<T>(command: RedisCommand): Promise<T | null> {
  const env = redisEnv();
  if (!env) return null;
  try {
    const res = await fetch(env.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) return null;
    return (json.result ?? null) as T | null;
  } catch {
    return null;
  }
}

/**
 * Record a visitor for the given day. Idempotent at the per-(IP-hash,
 * day) level — calling this twice for the same visitor on the same
 * day increments nothing the second time. Best-effort: if Redis is
 * unavailable the function is a silent no-op so the request path
 * never breaks.
 *
 * Side effects (per call, single Upstash pipeline round-trip):
 *   1. SET    visits:YYYY-MM-DD:<ip-hash>          1
 *      EXPIRE visits:YYYY-MM-DD:<ip-hash>           95 days
 *      → existence marker; not strictly needed by the digest but
 *        useful for ad-hoc investigation in upstash console.
 *   2. SADD   visits-set:YYYY-MM-DD                <ip-hash>
 *      EXPIRE visits-set:YYYY-MM-DD                 95 days
 *      → SCARD on this set is the digest's "unique visitors" number.
 */
export async function recordVisit(
  ip: string | null | undefined,
  now: Date = new Date(),
): Promise<void> {
  if (!redisEnv()) return;
  const day = dayKey(now);
  const ipHash = await hashIpForDay(ip, day);
  const ttl = 95 * 24 * 60 * 60;
  const cmds: RedisCommand[] = [
    ["SET", visitKey(day, ipHash), "1"],
    ["EXPIRE", visitKey(day, ipHash), ttl],
    ["SADD", visitsSetKey(day), ipHash],
    ["EXPIRE", visitsSetKey(day), ttl],
  ];
  await execPipeline(cmds);
}

/** Unique-visitor count for a given UTC day. Returns 0 on Redis miss. */
export async function getUniqueVisitorCount(day: string): Promise<number> {
  const r = await execOne<number>(["SCARD", visitsSetKey(day)]);
  return typeof r === "number" ? r : 0;
}

/**
 * Top page-view counts for a given UTC day. Reads the existing
 * `pageviews:YYYY-MM-DD:<path>` counter keys that `recordHit` writes,
 * so we share the source of truth with the dashboard.
 *
 * Implementation: Upstash REST forbids `KEYS` scans, so we ask Redis
 * for the SCAN cursor explicitly via the `SCAN` command. For a
 * personal-portfolio-scale dataset (~tens of distinct paths per day)
 * one SCAN call with COUNT 200 is enough; we cap iterations at 10 so
 * a runaway scan can never blow the cron's response time.
 */
export async function getTopPagesForDay(
  day: string,
  topN: number,
): Promise<Array<{ path: string; views: number }>> {
  if (!redisEnv()) return [];
  const prefix = `pageviews:${day}:`;
  let cursor = "0";
  const found: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = await execOne<[string, string[]]>([
      "SCAN",
      cursor,
      "MATCH",
      `${prefix}*`,
      "COUNT",
      200,
    ]);
    if (!r) break;
    cursor = r[0];
    for (const k of r[1]) found.push(k);
    if (cursor === "0") break;
  }
  if (found.length === 0) return [];
  // Pipeline the GET calls — one round-trip for all counters.
  const results = await execPipeline(found.map((k) => ["GET", k]));
  if (!results) return [];
  const rows: Array<{ path: string; views: number }> = [];
  for (let i = 0; i < found.length; i++) {
    const path = found[i].slice(prefix.length);
    const raw = results[i];
    const views = typeof raw === "string" ? Number(raw) : 0;
    if (Number.isFinite(views) && views > 0) rows.push({ path, views });
  }
  rows.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });
  return rows.slice(0, topN);
}

/**
 * Top palette × theme combo for a given UTC day. Reads the keys that
 * Senior Dev A3's palette-tracker writes, namespaced
 * `palette:YYYY-MM-DD:<palette>:<theme>` (e.g.
 * `palette:2026-04-27:mountain-navy:dark`). Returns at most one row —
 * the digest only surfaces the single most-popular combo.
 *
 * If A3's keys aren't present (e.g. flag off, or running before A3's
 * branch lands) this returns null and the digest renders a "—" line.
 * That graceful-degrade is deliberate: the digest must still ship
 * even if the palette signal is missing.
 */
export async function getTopPaletteThemeForDay(
  day: string,
): Promise<{ palette: string; theme: string; count: number } | null> {
  if (!redisEnv()) return null;
  const prefix = `palette:${day}:`;
  let cursor = "0";
  const found: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = await execOne<[string, string[]]>([
      "SCAN",
      cursor,
      "MATCH",
      `${prefix}*`,
      "COUNT",
      200,
    ]);
    if (!r) break;
    cursor = r[0];
    for (const k of r[1]) found.push(k);
    if (cursor === "0") break;
  }
  if (found.length === 0) return null;
  const results = await execPipeline(found.map((k) => ["GET", k]));
  if (!results) return null;
  let best: { palette: string; theme: string; count: number } | null = null;
  for (let i = 0; i < found.length; i++) {
    const tail = found[i].slice(prefix.length); // "<palette>:<theme>"
    const sep = tail.lastIndexOf(":");
    if (sep === -1) continue;
    const palette = tail.slice(0, sep);
    const theme = tail.slice(sep + 1);
    const raw = results[i];
    const count = typeof raw === "string" ? Number(raw) : 0;
    if (!Number.isFinite(count) || count <= 0) continue;
    if (
      !best ||
      count > best.count ||
      (count === best.count && `${palette}:${theme}` < `${best.palette}:${best.theme}`)
    ) {
      best = { palette, theme, count };
    }
  }
  return best;
}
