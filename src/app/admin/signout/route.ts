import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /admin/signout
 *
 * Sign-out endpoint for the admin dashboard. Clears the pf_admin
 * cookie and redirects the visitor away from the admin tree.
 *
 * Posture is symmetric with `/admin/unlock`:
 *   - cookie mutation lives in a Route Handler because Next 16 forbids
 *     it inside Server Component render.
 *   - we use a 303 redirect so the browser switches to GET on the
 *     destination, even if this route was somehow reached from a POST.
 *   - on success the visitor lands on `/` rather than another /admin
 *     page; the dashboard 404s once the cookie is gone, so a self-
 *     redirect to /admin/stats would just bounce them to a 404 page.
 *
 * No CSRF protection — this is GET-triggered from a same-origin
 * anchor on a cookie-gated page. Worst case a forged link signs the
 * user out, which is the entire point of the route.
 */
export const runtime = "nodejs";

const ADMIN_COOKIE = "pf_admin";

export async function GET(req: Request): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  const target = new URL("/", req.url);
  return NextResponse.redirect(target, { status: 303 });
}
