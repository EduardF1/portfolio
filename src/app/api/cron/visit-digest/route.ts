/**
 * GET /api/cron/visit-digest — Vercel Cron daily-visitor digest.
 *
 * **Status: SCAFFOLD ONLY. Off by default.** This route exists so the
 * cron entry in `vercel.json` has somewhere to land, but the actual
 * aggregation + SMTP send is not yet wired. See
 * `docs/visit-notification-design.md` for the full design and ship
 * checklist.
 *
 * Gating contract (in this order):
 *   1. `VISIT_DIGEST_ENABLED === "1"` (server-side env, set in Vercel
 *      Production only). Otherwise 404 with body "feature gated".
 *      This guard runs BEFORE auth so a leaked CRON_SECRET cannot
 *      trigger the side effect (an outbound email) until Eduard
 *      explicitly flips the flag.
 *   2. `Authorization: Bearer ${CRON_SECRET}` header. Vercel sets this
 *      automatically on cron-triggered requests when CRON_SECRET is
 *      defined in the project's env vars. Anything else → 401.
 *
 * Runtime: nodejs. SMTP via nodemailer (the eventual implementation)
 * needs Node APIs; the Edge runtime cannot establish raw TLS sockets.
 * Cache Components compatibility is fine because route handlers are
 * not subject to `dynamic`/`revalidate` segment configs in Next 16
 * (those were removed — see node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/02-route-segment-config/index.md).
 *
 * Why no `dynamic = "force-dynamic"`? In Next 16 with Cache Components
 * the option is gone, and route handlers are dynamic by default for
 * non-GET methods anyway. For GET handlers that read env vars at
 * request time (which we do) Next correctly opts out of any caching
 * because env reads are observed as side effects.
 */

import type { NextRequest } from "next/server";

export const runtime = "nodejs";
// Cron runs are bursty (one per day) — let the function take its time
// if the SMTP handshake is slow. Vercel's hobby tier caps at 60s but
// we should be well under 5s in practice.
export const maxDuration = 30;

const FLAG_ON = "1";

function isFeatureEnabled(): boolean {
  // Either flag flips it on. The server-only flag is the production
  // switch; the NEXT_PUBLIC_* mirror is reserved for an eventual
  // "preview the digest in /admin/stats" UI and currently unused.
  return (
    process.env.VISIT_DIGEST_ENABLED === FLAG_ON ||
    process.env.NEXT_PUBLIC_PROTO_VISIT_DIGEST === FLAG_ON
  );
}

function isAuthorized(request: NextRequest | Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret set means we cannot verify — fail closed.
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  // Order matters: gate FIRST so a leaked secret cannot fire the
  // pipeline before the operator has opted in.
  if (!isFeatureEnabled()) {
    return new Response("feature gated", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!isAuthorized(request)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // ---------------------------------------------------------------
  // Eventual implementation (NOT WIRED YET — see design doc §11):
  //
  //   1. Read yesterday from Upstash:
  //        const yesterday = new Date();
  //        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  //        const keys = dayKeysForRange(yesterday, 1);
  //        const hits = await getHits(keys);
  //
  //   2. Aggregate via existing helpers in src/lib/analytics.ts:
  //        const summary = {
  //          total: hits.length,
  //          unique: uniqueSessions(hits),
  //          topPages: topN(countBy(hits, "path"), 5),
  //          topCountries: topN(countBy(hits, "country"), 5),
  //          devices: deviceMix(hits),
  //          referrers: topN(countReferrerHosts(hits), 5),
  //          standouts: detectStandouts(hits),
  //        };
  //
  //   3. Compose plain-text body (see design §5).
  //
  //   4. Send via SMTP using DIGEST_SMTP_* env vars:
  //        const transport = nodemailer.createTransport({
  //          host: process.env.DIGEST_SMTP_HOST,
  //          port: Number(process.env.DIGEST_SMTP_PORT ?? 465),
  //          secure: true,
  //          auth: {
  //            user: process.env.DIGEST_SMTP_USER,
  //            pass: process.env.DIGEST_SMTP_PASSWORD,
  //          },
  //        });
  //        await transport.sendMail({
  //          from: process.env.DIGEST_SMTP_USER,
  //          to: process.env.DIGEST_RECIPIENT ?? "fischer_eduard@yahoo.com",
  //          subject: `portfolio — ${summary.total} visits yesterday (${summary.unique} unique)`,
  //          text: composeDigestBody(summary),
  //        });
  //
  //   5. Log + return 200. On send failure return 500 so Vercel will
  //      retry on the next cron tick (24h later — acceptable per
  //      design §10).
  // ---------------------------------------------------------------

  return new Response(JSON.stringify({ status: "scaffold" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
