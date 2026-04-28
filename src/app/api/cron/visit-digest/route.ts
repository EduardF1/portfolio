import { dayKey } from "@/lib/analytics";
import { composeDigest } from "@/lib/visit-digest";
import {
  getTopPagesForDay,
  getTopPaletteThemeForDay,
  getUniqueVisitorCount,
} from "@/lib/visit-tracker";

/**
 * GET /api/cron/visit-digest — Vercel Cron handler.
 *
 * See `docs/visit-notification-design.md` for the full design.
 * Schedule: `0 7 * * *` UTC (≈ 09:00 CET / 08:00 CEST), wired in
 * `vercel.json` at the project root.
 *
 * Guards (in this order — the flag check runs FIRST so a leaked
 * CRON_SECRET cannot trigger the side-effect (an outbound email)
 * until the operator explicitly flips the flag):
 *   1. Feature flag: NEXT_PUBLIC_PROTO_VISIT_DIGEST === "1" OR
 *      VISIT_DIGEST_ENABLED === "1" must be set, else 404.
 *   2. Auth header: `Authorization: Bearer ${CRON_SECRET}` must
 *      match, else 401. Vercel signs scheduled requests with this
 *      header automatically when CRON_SECRET is set in the project
 *      env vars.
 *
 * Both guards are off-by-default-safe: missing env vars fail closed.
 *
 * Runs on the Node runtime (NOT edge). The `recordHit` /
 * `recordVisit` writes happen on edge from `/api/track`, but the
 * digest itself uses `node:crypto` indirectly via shared modules and
 * runs once a day, so latency doesn't matter and Node is the safer
 * choice for outbound HTTP (Resend) compatibility.
 */
export const runtime = "nodejs";
// Force dynamic — never cache or pre-render this route. The cron must
// always execute the handler.
export const dynamic = "force-dynamic";

const DEFAULT_RECIPIENT = "fischer_eduard@yahoo.com";

function isFlagOn(): boolean {
  return (
    process.env.NEXT_PUBLIC_PROTO_VISIT_DIGEST === "1" ||
    process.env.VISIT_DIGEST_ENABLED === "1"
  );
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = request.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

/** Returns yesterday's UTC dayKey relative to the given `now`. */
function yesterdayDayKey(now: Date): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  return dayKey(d);
}

async function sendDigestEmail(
  subject: string,
  body: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.DIGEST_RECIPIENT ?? DEFAULT_RECIPIENT;
  if (!apiKey) {
    // No provider configured — log + treat as success so the cron
    // pipeline is testable end-to-end without burning Resend quota.
    console.info("[digest] (no RESEND_API_KEY) would send:", {
      subject,
      to: recipient,
    });
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio Digest <noreply@eduardfischer.dev>",
        to: recipient,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[digest] resend failed ${res.status}`, text);
      return { ok: false, reason: `resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[digest] resend threw", e);
    return { ok: false, reason: "resend threw" };
  }
}

export async function GET(request: Request): Promise<Response> {
  // Guard 1: feature flag. Off by default ⇒ 404.
  if (!isFlagOn()) {
    return new Response("feature gated", { status: 404 });
  }

  // Guard 2: Vercel cron auth. Reject anything that isn't signed
  // with the project's CRON_SECRET — that includes random external
  // probes AND a developer hitting the URL by hand in a browser.
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const day = yesterdayDayKey(new Date());

  // Read all three signals in parallel — three independent Upstash
  // round-trips, no ordering dependency between them.
  const [uniqueVisitors, topPages, topPaletteTheme] = await Promise.all([
    getUniqueVisitorCount(day),
    getTopPagesForDay(day, 5),
    getTopPaletteThemeForDay(day),
  ]);

  const totalPageViews = topPages.reduce((sum, p) => sum + p.views, 0);

  const { subject, body } = composeDigest({
    day,
    totalPageViews,
    uniqueVisitors,
    topPages,
    topPaletteTheme,
  });

  const result = await sendDigestEmail(subject, body);
  if (!result.ok) {
    // 500 so Vercel logs surface the failure; cron will retry on the
    // next tick (24h). One missed day is acceptable.
    return new Response(`send failed: ${result.reason}`, { status: 500 });
  }

  console.info(`[digest] sent for ${day}`);
  return new Response(JSON.stringify({ ok: true, day }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
