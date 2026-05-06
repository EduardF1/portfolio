import "server-only";

/**
 * Per-IP fixed-window rate limiter on Upstash KV.
 *
 * Best-effort and silent: callers should treat a `null` env or KV
 * failure as "allowed" so analytics never blocks the UI. The intent
 * is denial-of-wallet / denial-of-stats protection, not auth.
 *
 * Privacy: the IP is SHA-256-hashed and truncated to 16 hex chars
 * before it touches Redis, mirroring `hashIpForDay` in
 * `visit-tracker.ts`. Salt is the literal endpoint key so different
 * routes can't be correlated by hash even with the same IP.
 */

type KvEnv = { url: string; token: string };

function kvEnv(): KvEnv | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function shortHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const arr = new Uint8Array(buf).slice(0, 8);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type RateLimitResult = { allowed: boolean; count: number; limit: number };

/**
 * Increment a per-(endpoint, ip, minute) counter and return whether
 * the caller is under the limit.
 *
 * Returns `{ allowed: true }` when KV is unconfigured or unreachable
 * — the limiter must never become a single point of failure.
 */
export async function rateLimit(opts: {
  endpoint: string;
  ip: string | null | undefined;
  limit: number;
  windowSec?: number;
}): Promise<RateLimitResult> {
  const { endpoint, ip, limit } = opts;
  const windowSec = opts.windowSec ?? 60;
  const env = kvEnv();
  if (!env) return { allowed: true, count: 0, limit };

  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const ipHash = await shortHash(`${ip ?? "unknown"}|${endpoint}`);
  const key = `rl:${endpoint}:${ipHash}:${bucket}`;

  try {
    const res = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return { allowed: true, count: 0, limit };
    const json = (await res.json()) as Array<{
      result?: unknown;
      error?: string;
    }>;
    const incr = json[0]?.result;
    const count = typeof incr === "number" ? incr : Number(incr ?? 0);
    return { allowed: count <= limit, count, limit };
  } catch {
    return { allowed: true, count: 0, limit };
  }
}
