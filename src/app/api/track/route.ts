import { cookies, headers } from "next/headers";
import {
  generateSessionId,
  type Hit,
  type TrackEvent,
} from "@/lib/analytics";
import { isAnalyticsEnabled, recordHit } from "@/lib/redis-analytics";
import { parseUserAgent } from "@/lib/ua-parser";
import { extractClientIp, recordVisit } from "@/lib/visit-tracker";
import { rateLimit } from "@/lib/rate-limit";
import { isBotHit } from "@/lib/bot-detect";

/**
 * POST /api/track — anonymous page-view ingestion.
 *
 * Called from `<VisitTracker />` once per page mount (see
 * src/components/visit-tracker.tsx). The contract is intentionally
 * tiny: client sends `{ path, ref }`, the server stamps in everything
 * else (geo from x-vercel-ip-* headers, UA bucketing, anon session
 * cookie, server-side timestamp) so the client bundle stays under a
 * kilobyte gzipped.
 *
 * Privacy posture (matches /privacy page):
 *   - No raw IPs are stored. Only country/region/city from Vercel.
 *   - Session IDs are random, opaque, 30-min TTL, HTTP-only cookie.
 *   - When pf_admin=1 cookie is present (Eduard's own browser),
 *     hits are dropped on the floor so admin browsing doesn't
 *     pollute the dashboard.
 *   - When env vars are unset (local dev) we 204 instantly without
 *     touching Redis.
 *
 * Edge runtime: lower latency, smaller cold-start. Upstash REST works
 * cleanly from Edge so we don't need the Node fallback in practice.
 */
export const runtime = "edge";

const SESSION_COOKIE = "pf_session";
const ADMIN_COOKIE = "pf_admin";
const SESSION_TTL_SECONDS = 30 * 60; // 30 min

type TrackBody = {
  path?: unknown;
  ref?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  // Phase 2 enrichment payload — all optional so older clients keep
  // working unchanged. Each field is independently validated below.
  utmTerm?: unknown;
  utmContent?: unknown;
  referrerHost?: unknown;
  clientSessionId?: unknown;
  scrollDepthPct?: unknown;
  timeOnPageMs?: unknown;
  lang?: unknown;
  event?: unknown;
  linkHref?: unknown;
};

const VALID_EVENTS: ReadonlySet<TrackEvent> = new Set<TrackEvent>([
  "pageview",
  "cv_download",
  "language_switch",
  "external_link",
  "exit",
]);

/**
 * Coerce a raw string-ish payload field to a bounded string, or
 * undefined if it's missing / not a non-empty string. The `max`
 * defaults match the original `slice(0, 128)` convention.
 */
function safeStr(v: unknown, max = 128): string | undefined {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined;
}

/** Coerce a raw number-ish payload field to a clamped integer. */
function safeInt(
  v: unknown,
  { min, max }: { min: number; max: number },
): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const i = Math.round(v);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

export async function POST(request: Request): Promise<Response> {
  // Always 204 the client — analytics must never break the UI even
  // if Redis is down or the body is junk.
  const noContent = new Response(null, { status: 204 });

  if (!isAnalyticsEnabled()) return noContent;

  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value === "1") {
    // Eduard's own browser — skip recording but still 204 so the
    // client-side fetch resolves cleanly.
    return noContent;
  }

  const headerStoreEarly = await headers();
  const ipForLimit = extractClientIp(headerStoreEarly);
  // 60/min/IP is ~10× a real user. A loop attacker hits this in ms
  // and gets silently dropped, same 204 the client expects.
  const rl = await rateLimit({
    endpoint: "track",
    ip: ipForLimit,
    limit: 60,
  });
  if (!rl.allowed) return noContent;

  // Bot / datacenter filter. We drop these before touching Redis so
  // the stored data is human-traffic only by default. The dashboard
  // can still flip a "include bots" toggle, but that pulls from a
  // separate (yet to be built) raw stream rather than this clean one.
  // Detection is best-effort: matched by UA substring OR by the IP
  // falling in a known datacenter CIDR.
  const earlyUa = headerStoreEarly.get("user-agent");
  if (isBotHit({ ua: earlyUa, ip: ipForLimit })) return noContent;

  let body: TrackBody = {};
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return noContent;
  }

  const path =
    typeof body.path === "string" && body.path.startsWith("/")
      ? body.path.slice(0, 256)
      : "/";
  const ref = typeof body.ref === "string" ? body.ref.slice(0, 512) : "";
  const utmSource = safeStr(body.utmSource);
  const utmMedium = safeStr(body.utmMedium);
  const utmCampaign = safeStr(body.utmCampaign);
  const utmTerm = safeStr(body.utmTerm);
  const utmContent = safeStr(body.utmContent);
  // referrerHost is a hostname only — strip anything that looks like a
  // path or query so we never store a raw URL even if the client sends
  // one by mistake.
  const referrerHost = (() => {
    const raw = safeStr(body.referrerHost, 256);
    if (!raw) return undefined;
    const cleaned = raw.replace(/^https?:\/\//i, "").split("/")[0]?.split("?")[0];
    return cleaned || undefined;
  })();
  const clientSessionId = safeStr(body.clientSessionId, 64);
  const scrollDepthPct = safeInt(body.scrollDepthPct, { min: 0, max: 100 });
  const timeOnPageMs = safeInt(body.timeOnPageMs, {
    min: 0,
    max: 6 * 60 * 60 * 1000, // 6 hours; anything past that is bot-like
  });
  const lang =
    body.lang === "en" || body.lang === "da" ? body.lang : undefined;
  const event: TrackEvent = VALID_EVENTS.has(body.event as TrackEvent)
    ? (body.event as TrackEvent)
    : "pageview";
  // linkHref is only meaningful for cv_download / external_link. We
  // clamp size and explicitly strip query strings as a belt-and-braces
  // backup to the client-side strip.
  const linkHref = (() => {
    if (event !== "cv_download" && event !== "external_link") return undefined;
    const raw = safeStr(body.linkHref, 256);
    return raw ? raw.split("?")[0] : undefined;
  })();

  const headerStore = headerStoreEarly;
  const ua = headerStore.get("user-agent");
  const { browser, os, deviceType } = parseUserAgent(ua);

  // Vercel Edge geo headers — replace the removed `request.geo`. We
  // never read `x-forwarded-for` / `x-real-ip` because we never want
  // to handle a raw IP, even transiently.
  const country = headerStore.get("x-vercel-ip-country") || null;
  const region = headerStore.get("x-vercel-ip-country-region") || null;
  const city = (() => {
    const raw = headerStore.get("x-vercel-ip-city");
    if (!raw) return null;
    try {
      // Vercel URI-encodes city names with spaces (e.g. "New%20York").
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  let mintedNew = false;
  if (!sessionId || !/^[0-9a-f]{32}$/.test(sessionId)) {
    sessionId = generateSessionId();
    mintedNew = true;
  }

  const hit: Hit = {
    path,
    ref,
    country,
    region,
    city,
    browser,
    os,
    deviceType,
    sessionId,
    ts: Date.now(),
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
    ...(utmTerm ? { utmTerm } : {}),
    ...(utmContent ? { utmContent } : {}),
    ...(referrerHost !== undefined ? { referrerHost } : {}),
    ...(clientSessionId ? { clientSessionId } : {}),
    ...(scrollDepthPct !== undefined ? { scrollDepthPct } : {}),
    ...(timeOnPageMs !== undefined ? { timeOnPageMs } : {}),
    ...(lang ? { lang } : {}),
    event,
    ...(linkHref ? { linkHref } : {}),
  };

  // Per-IP-hash daily uniqueness counter for the digest cron. Sibling
  // signal to `recordHit`: shares the same KV instance and the same
  // privacy posture (no PII — IP is hashed with a daily-rotated salt
  // before it touches Redis). Best-effort, never throws.
  const ip = extractClientIp(headerStore);
  await Promise.all([recordHit(hit), recordVisit(ip)]);

  const response = new Response(null, { status: 204 });
  if (mintedNew) {
    // We can't use cookies().set() on the request-scoped store from
    // a route handler reliably across runtimes, so we set Set-Cookie
    // on the outgoing response directly.
    response.headers.append(
      "Set-Cookie",
      [
        `${SESSION_COOKIE}=${sessionId}`,
        `Max-Age=${SESSION_TTL_SECONDS}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Secure",
      ].join("; "),
    );
  }
  return response;
}

// Reject other methods cleanly (Next would otherwise return a 405
// page; we want a small body for diagnostics).
export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
