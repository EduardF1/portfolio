import { cookies, headers } from "next/headers";

/**
 * POST /api/track-palette — anonymous palette × theme preference
 * counter (PROTOTYPE / SCOPE-ONLY scaffold).
 *
 * Off by default. Returns 404 unless the prototype flag
 * `NEXT_PUBLIC_PROTO_PALETTE_TRACK === "1"` is set at build time on
 * the prototype env. See `docs/palette-analytics-design.md` for the
 * full design and the contracts this handler is meant to honour.
 *
 * Privacy posture (matches /privacy page and /api/track):
 *   - No PII. Body is `{ palette, theme, sessionHash }` only.
 *   - sessionHash is a per-tab UUID generated client-side; we use it
 *     to dedup so we don't double-count one visitor.
 *   - Honours Sec-GPC: 1 and DNT: 1 — returns ok without writing.
 *   - When pf_admin=1 cookie is present (Eduard's own browser), we
 *     drop the hit silently.
 *   - When Upstash env vars are unset (local dev), we 200 instantly
 *     without touching Redis.
 *
 * Edge runtime to match the existing /api/track handler — Upstash
 * REST works cleanly from Edge.
 */
export const runtime = "edge";

const ADMIN_COOKIE = "pf_admin";
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 h dedup window
const COUNTER_TTL_SECONDS = 95 * 24 * 60 * 60; // 95 d safety net

// Single source of truth for accepted palette slugs. Mirrors the
// PALETTES constant in src/components/palette-provider.tsx. Keep them
// in sync until the shared-constant follow-up lands (see design doc
// §7 "drift in palette list").
const ALLOWED_PALETTES = new Set([
  "schwarzgelb",
  "mountain-navy",
  "woodsy-cabin",
]);
const ALLOWED_THEMES = new Set(["light", "dark"]);

// Reasonable upper bound on the client-supplied dedup hash. UUIDs are
// 36 chars; we accept up to 128 to allow for future hashing schemes
// without breaking the API.
const HASH_MIN = 8;
const HASH_MAX = 128;
const HASH_PATTERN = /^[a-zA-Z0-9_-]+$/;

type TrackPaletteBody = {
  palette?: unknown;
  theme?: unknown;
  sessionHash?: unknown;
};

function isFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_PROTO_PALETTE_TRACK === "1";
}

function notFound(): Response {
  // Indistinguishable from a generic 404 — no JSON body, no hint that
  // this route exists when the flag is off.
  return new Response("Not Found", { status: 404 });
}

function ok(): Response {
  return Response.json({ ok: true });
}

function redisEnv(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

type RedisCommand = (string | number)[];

/**
 * Best-effort Upstash pipeline. Mirrors the contract in
 * `src/lib/redis-analytics.ts` — never throws, returns `null` on every
 * failure mode. Inlined here to keep this scaffold self-contained;
 * the real wiring step should switch to importing from the shared
 * helper.
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
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[track-palette] redis ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as Array<{
      result?: unknown;
      error?: string;
    }>;
    return json.map((r) => (r.error ? null : r.result ?? null));
  } catch (e) {
    console.error("[track-palette] redis pipeline failed", e);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagOn()) return notFound();

  const headerStore = await headers();

  // Honour standard opt-out signals. We return ok rather than 404 so
  // an opted-out visitor's client code still resolves cleanly.
  const dnt = headerStore.get("dnt");
  const gpc = headerStore.get("sec-gpc");
  if (dnt === "1" || gpc === "1") return ok();

  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value === "1") {
    // Eduard's own browser — skip recording.
    return ok();
  }

  let body: TrackPaletteBody = {};
  try {
    body = (await request.json()) as TrackPaletteBody;
  } catch {
    // Malformed JSON — same response shape so we don't leak parser
    // diagnostics. Validation failure looks the same as success.
    return ok();
  }

  const palette =
    typeof body.palette === "string" && ALLOWED_PALETTES.has(body.palette)
      ? body.palette
      : null;
  const theme =
    typeof body.theme === "string" && ALLOWED_THEMES.has(body.theme)
      ? body.theme
      : null;
  const sessionHash =
    typeof body.sessionHash === "string" &&
    body.sessionHash.length >= HASH_MIN &&
    body.sessionHash.length <= HASH_MAX &&
    HASH_PATTERN.test(body.sessionHash)
      ? body.sessionHash
      : null;

  if (!palette || !theme || !sessionHash) {
    // Validation failed — silently drop. Don't echo the offending
    // values back; that's the privacy contract.
    return ok();
  }

  // SET … NX EX guarantees the increment is gated on this hash not
  // having been seen in the last 24 h. If NX returns null, the key
  // already existed and we treat it as a duplicate.
  const sessionKey = `palette-session:${sessionHash}`;
  const counterKey = `palette:${palette}:${theme}`;

  // Two-step pipeline: try to claim the session slot, then act on the
  // result. We can't do this in one pipeline because the second step
  // is conditional on the first.
  const claim = await execPipeline([
    ["SET", sessionKey, "1", "EX", SESSION_TTL_SECONDS, "NX"],
  ]);
  if (claim === null) {
    // Redis unavailable — silently succeed. Local dev path.
    return ok();
  }
  const claimResult = claim[0];
  // Upstash returns "OK" on a successful SET, null when NX blocks it.
  if (claimResult !== "OK") {
    return ok();
  }

  await execPipeline([
    ["INCR", counterKey],
    ["EXPIRE", counterKey, COUNTER_TTL_SECONDS],
  ]);

  return ok();
}

// Reject other methods cleanly. Mirrors /api/track's pattern.
export function GET(): Response {
  // When the flag is off, even GET should be a 404 so the route is
  // invisible to probes. When the flag is on, GET → 405.
  if (!isFlagOn()) return notFound();
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
