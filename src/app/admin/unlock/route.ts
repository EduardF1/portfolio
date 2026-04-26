import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /admin/unlock?key=<ADMIN_SECRET>
 *
 * Cookie-minting endpoint for the admin dashboard. Lives as a Route
 * Handler — not a Server Component — because Next 16 only permits
 * cookie mutation in Server Actions, Route Handlers, or Middleware.
 * `/admin/stats/page.tsx` was throwing a Server Component render
 * error when it tried to set the cookie inline.
 *
 * Behaviour matches the previous in-page auth gate:
 *   - exact match to process.env.ADMIN_SECRET unlocks; mints a 90-day
 *     pf_admin cookie (httpOnly + secure + sameSite=lax) and redirects
 *     to /admin/stats (with the range query param preserved).
 *   - any other request — empty key, wrong key, ADMIN_SECRET unset —
 *     returns 404 to avoid leaking the route's existence to probes.
 */
export const runtime = "nodejs";

const ADMIN_COOKIE = "pf_admin";
const COOKIE_TTL_DAYS = 90;

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const range = url.searchParams.get("range");
  const expected = process.env.ADMIN_SECRET;

  if (!key || !expected || key !== expected) {
    return new Response("Not Found", { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: COOKIE_TTL_DAYS * 24 * 60 * 60,
  });

  const target = new URL("/admin/stats", url.origin);
  if (range) target.searchParams.set("range", range);
  return NextResponse.redirect(target, { status: 303 });
}
