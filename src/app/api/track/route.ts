import { cookies, headers } from "next/headers";
import {
  generateSessionId,
  type Hit,
} from "@/lib/analytics";
import { isAnalyticsEnabled, recordHit } from "@/lib/redis-analytics";
import { parseUserAgent } from "@/lib/ua-parser";
import { extractClientIp, recordVisit } from "@/lib/visit-tracker";

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

type TrackBody = { path?: unknown; ref?: unknown; utmSource?: unknown; utmMedium?: unknown; utmCampaign?: unknown };

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
  const utmSource = typeof body.utmSource === "string" && body.utmSource ? body.utmSource.slice(0, 128) : undefined;
  const utmMedium = typeof body.utmMedium === "string" && body.utmMedium ? body.utmMedium.slice(0, 128) : undefined;
  const utmCampaign = typeof body.utmCampaign === "string" && body.utmCampaign ? body.utmCampaign.slice(0, 128) : undefined;

  const headerStore = await headers();
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
