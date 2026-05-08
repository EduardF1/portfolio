import { z } from "zod";
import { PALETTES, THEMES } from "@/lib/palettes";
import { rateLimit } from "@/lib/rate-limit";
import { extractClientIp } from "@/lib/visit-tracker";

/**
 * POST /api/track-palette — anonymous palette × theme × locale
 * preference counter.
 *
 * Stores two counter shapes per accepted hit so A7's /admin/stats
 * dashboard can answer both "palette × theme" and the more granular
 * "palette × theme × locale" question:
 *
 *   palette:<palette>:<theme>                 INCR
 *   palette-pair:<palette>:<theme>:<locale>   INCR
 *
 * GET /api/track-palette?secret=<ADMIN_SECRET> — read all counters
 * back as JSON. Used by the admin dashboard.
 *
 * Privacy posture (see docs/palette-analytics-design.md §Privacy):
 *   - No PII. We never read or persist the visitor's IP, User-Agent,
 *     referer, geolocation, cookies, or any device fingerprint.
 *   - The body fields { palette, theme, locale, path } are the
 *     entire surface. `path` is bucketed into a counter shape, never
 *     stored verbatim alongside an identifier.
 *   - No session identifier or correlation key — concurrent or
 *     repeat visits cannot be linked back to a single visitor server-
 *     side.
 *   - When KV/Upstash is unset (local dev) we log to stderr only.
 *
 * Storage: Vercel KV / Upstash Redis via REST. Activated when
 * `KV_REST_API_URL` is present. Failures are swallowed so a flapping
 * KV never breaks the UI.
 *
 * Edge runtime: lower latency, smaller cold-start, and Upstash REST
 * works cleanly from Edge.
 */
export const runtime = "edge";

// Zod validators for the inbound body. Palette and theme are closed
// enums; locale is a 2-letter app locale; path is a leading-slash
// string with a sane upper bound to keep counter keys finite.
const PaletteSchema = z.enum(PALETTES);
const ThemeSchema = z.enum(THEMES);
const LocaleSchema = z.enum(["en", "da"]);
const PathSchema = z
  .string()
  .min(1)
  .max(256)
  .startsWith("/");

const BodySchema = z.object({
  palette: PaletteSchema,
  theme: ThemeSchema,
  locale: LocaleSchema,
  path: PathSchema,
});

const ALLOWED_THEMES = ThemeSchema.options;

function kvEnv(): { url: string; token: string } | null {
  // Vercel's KV → Upstash integration sets KV_REST_API_URL/TOKEN.
  // We also accept the bare UPSTASH_* names so a manual override
  // works locally without renaming. KV_* takes precedence because
  // that's the variable the task spec gates on.
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

type RedisCommand = (string | number)[];

/**
 * Fire a pipeline of Redis commands at Upstash REST. Returns null on
 * any failure mode (no env, network, non-OK status, malformed JSON);
 * never throws. Mirrors the contract in `src/lib/redis-analytics.ts`.
 */
async function execPipeline(
  commands: RedisCommand[],
): Promise<unknown[] | null> {
  const env = kvEnv();
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
      console.error(
        `[track-palette] kv ${res.status} ${res.statusText}`,
      );
      return null;
    }
    const json = (await res.json()) as Array<{
      result?: unknown;
      error?: string;
    }>;
    return json.map((r) => (r.error ? null : r.result ?? null));
  } catch (e) {
    console.error("[track-palette] kv pipeline failed", e);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  // Palette changes are rare per session (a few clicks), so 30/min
  // per IP is generous for real users and tight against loops.
  const ipForLimit = extractClientIp(request.headers);
  const rl = await rateLimit({
    endpoint: "palette",
    ip: ipForLimit,
    limit: 30,
  });
  if (!rl.allowed) return Response.json({ ok: true, stored: false });

  // Best-effort ingestion: on any validation or storage error we
  // return ok with no data leaked. The client never branches on the
  // response, so the response body is effectively a heartbeat.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { ok: false, reason: "invalid-body" },
      { status: 400 },
    );
  }

  const { palette, theme, locale } = parsed.data;
  const env = kvEnv();

  const counterKey = `palette:${palette}:${theme}`;
  const pairKey = `palette-pair:${palette}:${theme}:${locale}`;

  if (!env) {
    // Dev path — log to stderr so a developer can see hits in the
    // Next dev server output without standing up a KV instance.
    console.error(
      `[track-palette] (dev) hit palette=${palette} theme=${theme} locale=${locale}`,
    );
    return Response.json({ ok: true, stored: false });
  }

  const result = await execPipeline([
    ["INCR", counterKey],
    ["INCR", pairKey],
  ]);

  if (result === null) {
    // KV is configured but unreachable — surface that to the client
    // as ok: true so analytics never blocks the UI, but flag it for
    // server-side observability.
    return Response.json({ ok: true, stored: false });
  }
  return Response.json({ ok: true, stored: true });
}

/**
 * Read all palette counters. Gated by `secret=<ADMIN_SECRET>` query
 * param to keep the dashboard surface invisible to drive-by probes.
 *
 * Response shape (contract with A7's /admin/stats):
 *   {
 *     counters:   { [key: string]: number },
 *     palettes:   string[],   // closed enum, ordered as in PALETTES
 *     themes:     string[],   // ["light", "dark"]
 *     updatedAt:  string      // ISO timestamp
 *   }
 *
 * The counters map is keyed by the same strings used as Redis keys,
 * e.g. `palette:mountain-navy:dark` and
 * `palette-pair:mountain-navy:dark:en`. The dashboard knows the
 * palette/theme/locale enumeration up-front and looks values up by
 * composing the key locally.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.ADMIN_SECRET;

  if (!secret || !expected || secret !== expected) {
    // 404 (not 401/403) so the route's existence isn't confirmed to
    // an attacker without the secret. Same posture as /admin/stats.
    return new Response("Not Found", { status: 404 });
  }

  const themes = [...ALLOWED_THEMES];
  const palettes = [...PALETTES];
  const locales: ReadonlyArray<z.infer<typeof LocaleSchema>> =
    LocaleSchema.options;

  const env = kvEnv();
  const updatedAt = new Date().toISOString();

  if (!env) {
    // Dev / unconfigured path — return an empty counter map but the
    // shape is still complete so the dashboard renders zeros.
    return Response.json({
      counters: {},
      palettes,
      themes,
      updatedAt,
    });
  }

  // 3 palettes × 2 themes = 6 keys, plus 3 × 2 × 2 = 12 pair keys.
  // 18 GET commands fit comfortably in one pipeline round-trip.
  const keys: string[] = [];
  for (const p of palettes) {
    for (const t of themes) {
      keys.push(`palette:${p}:${t}`);
      for (const l of locales) {
        keys.push(`palette-pair:${p}:${t}:${l}`);
      }
    }
  }
  const cmds: RedisCommand[] = keys.map((k) => ["GET", k]);
  const results = await execPipeline(cmds);

  const counters: Record<string, number> = {};
  if (results) {
    for (let i = 0; i < keys.length; i += 1) {
      const r = results[i];
      // Upstash returns the integer as a string from a counter GET.
      // Treat any non-numeric reply as zero rather than emitting it,
      // so the dashboard sees a sparse map of only-non-zero counts.
      const n = typeof r === "string" ? Number(r) : typeof r === "number" ? r : 0;
      if (Number.isFinite(n) && n > 0) counters[keys[i]] = n;
    }
  }

  return Response.json({
    counters,
    palettes,
    themes,
    updatedAt,
  });
}
