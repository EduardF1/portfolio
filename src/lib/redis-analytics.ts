import "server-only";

/**
 * Thin Upstash REST client + analytics-shaped helpers.
 *
 * We deliberately don't pull in `@upstash/redis` — the REST API is
 * a single endpoint that takes a JSON command array, so a direct
 * `fetch` saves a dependency and works on Edge runtime out of the
 * box (https://upstash.com/docs/redis/features/restapi).
 *
 * If the env vars are not set the helpers all degrade to no-op /
 * empty-data so the site still builds and runs locally without
 * Upstash. The /admin/stats dashboard renders an empty-state
 * banner in that case.
 *
 * Storage shape (per spec):
 *   hits:YYYY-MM-DD          ZSET   score=ms, value=JSON(Hit)
 *   sessions:YYYY-MM-DD      SET    sessionId members
 *   pageviews:YYYY-MM-DD:<p> STR    INCR counter
 *   referrers:YYYY-MM-DD     ZSET   ZINCRBY by referrer host
 *
 * TODO(retention): trim sets older than 90 days via a daily Vercel
 * Cron job (`docs/metrics-setup.md` flags this for follow-up).
 */
import { dayKey, type Hit } from "./analytics";

type RedisCommand = (string | number)[];

function redisEnv(): { url: string; token: string } | null {
  // Two naming conventions are supported:
  //   UPSTASH_REDIS_REST_URL/TOKEN  — when env vars are set manually
  //                                   from the Upstash console.
  //   KV_REST_API_URL/TOKEN         — what the Vercel↔Upstash
  //                                   marketplace integration injects.
  // Either one is sufficient; UPSTASH_* takes precedence so a manual
  // override always wins.
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function isAnalyticsEnabled(): boolean {
  return redisEnv() !== null;
}

/**
 * Run a batch of Redis commands through Upstash's `/pipeline` endpoint
 * in a single round-trip.
 *
 * Fault-tolerance contract:
 *   - Returns `null` (never throws) if env vars are unset, the network
 *     fails, the response is non-OK, or the JSON is malformed. Callers
 *     treat null as "Redis unavailable" and silently continue — the
 *     analytics layer is best-effort and must never break the request
 *     path or the admin dashboard.
 *   - On success, returns one element per input command preserving
 *     order. Per-command errors are mapped to `null`, so a partial
 *     pipeline failure doesn't poison the rest.
 *   - `commands.length === 0` short-circuits to null without calling
 *     fetch — Upstash rejects empty pipelines.
 */
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
      // No Next caching — analytics writes/reads are always live.
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[redis] pipeline ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    return json.map((r) => (r.error ? null : r.result ?? null));
  } catch (e) {
    console.error("[redis] pipeline failed", e);
    return null;
  }
}

/**
 * Run a single Redis command against Upstash's REST root. Same
 * fault-tolerance contract as `execPipeline`: returns `null` for
 * every failure mode (no env, network, non-OK status, error in the
 * response body), never throws. Generic `T` is the expected shape of
 * the `result` field in Upstash's response — the caller is responsible
 * for it being correct.
 */
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
    if (!res.ok) {
      console.error(`[redis] cmd ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) {
      console.error("[redis] cmd error", json.error);
      return null;
    }
    return (json.result ?? null) as T | null;
  } catch (e) {
    console.error("[redis] cmd failed", e);
    return null;
  }
}

/**
 * Append a single hit to the day's sorted set + bump the supporting
 * counters. Best-effort — if Redis is down we log and move on so
 * /api/track always returns 204.
 */
export async function recordHit(hit: Hit): Promise<void> {
  const env = redisEnv();
  if (!env) return;
  const day = dayKey(new Date(hit.ts));
  const refHost = (() => {
    try {
      return hit.ref ? new URL(hit.ref).host : "";
    } catch {
      return "";
    }
  })();

  const cmds: RedisCommand[] = [
    ["ZADD", `hits:${day}`, hit.ts, JSON.stringify(hit)],
    ["SADD", `sessions:${day}`, hit.sessionId],
    ["INCR", `pageviews:${day}:${hit.path}`],
  ];
  if (refHost) {
    cmds.push(["ZINCRBY", `referrers:${day}`, 1, refHost]);
  }
  // 95-day TTL on every key so cold paths self-expire even if the
  // cron purge isn't wired up. 90-day retention spec + 5-day safety.
  const ttl = 95 * 24 * 60 * 60;
  cmds.push(["EXPIRE", `hits:${day}`, ttl]);
  cmds.push(["EXPIRE", `sessions:${day}`, ttl]);
  cmds.push(["EXPIRE", `pageviews:${day}:${hit.path}`, ttl]);
  if (refHost) cmds.push(["EXPIRE", `referrers:${day}`, ttl]);

  await execPipeline(cmds);
}

/**
 * Read all hits across the given day keys. Returns an empty array
 * when Redis is unavailable so the dashboard renders an empty state
 * instead of throwing.
 */
export async function getHits(dayKeys: string[]): Promise<Hit[]> {
  if (dayKeys.length === 0) return [];
  const env = redisEnv();
  if (!env) return [];
  const cmds: RedisCommand[] = dayKeys.map((d) => [
    "ZRANGE",
    `hits:${d}`,
    0,
    -1,
  ]);
  const results = await execPipeline(cmds);
  if (!results) return [];
  const out: Hit[] = [];
  for (const r of results) {
    if (!Array.isArray(r)) continue;
    for (const raw of r) {
      if (typeof raw !== "string") continue;
      try {
        out.push(JSON.parse(raw) as Hit);
      } catch {
        // skip malformed entries — never crash the dashboard
      }
    }
  }
  return out;
}

/**
 * Sum of unique session counts per day. NB: this double-counts a
 * visitor who returns on a different day, which is the LinkedIn-style
 * behaviour Eduard asked for (a "visit" is per-day).
 */
export async function getUniqueSessionCount(
  dayKeys: string[],
): Promise<number> {
  if (dayKeys.length === 0) return 0;
  const cmds: RedisCommand[] = dayKeys.map((d) => ["SCARD", `sessions:${d}`]);
  const results = await execPipeline(cmds);
  if (!results) return 0;
  let sum = 0;
  for (const r of results) {
    if (typeof r === "number") sum += r;
  }
  return sum;
}

/** Whether a session id is already known for today (cookie sanity check). */
export async function sessionExists(
  day: string,
  sessionId: string,
): Promise<boolean> {
  const r = await execOne<number>(["SISMEMBER", `sessions:${day}`, sessionId]);
  return r === 1;
}
