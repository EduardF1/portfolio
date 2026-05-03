import { cookies, headers } from "next/headers";
import { generateSessionId, type Hit } from "@/lib/analytics";
import { isAnalyticsEnabled, recordHit } from "@/lib/redis-analytics";
import { parseUserAgent } from "@/lib/ua-parser";

export const runtime = "edge";

const SESSION_COOKIE = "pf_session";
const ADMIN_COOKIE = "pf_admin";
const SESSION_TTL_SECONDS = 30 * 60;

const KNOWN_FILES = new Set([
  "Eduard_Fischer-Szava_CV_EN.pdf",
  "Eduard_Fischer-Szava_CV_DA.pdf",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;

  if (!KNOWN_FILES.has(file)) {
    return new Response("Not Found", { status: 404 });
  }

  const cookieStore = await cookies();

  if (isAnalyticsEnabled() && cookieStore.get(ADMIN_COOKIE)?.value !== "1") {
    const headerStore = await headers();
    const ua = headerStore.get("user-agent");
    const { browser, os, deviceType } = parseUserAgent(ua);

    const country = headerStore.get("x-vercel-ip-country") || null;
    const region = headerStore.get("x-vercel-ip-country-region") || null;
    const city = (() => {
      const raw = headerStore.get("x-vercel-ip-city");
      if (!raw) return null;
      try {
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
      path: `/cv/${file}`,
      ref: request.headers.get("referer") ?? "",
      country,
      region,
      city,
      browser,
      os,
      deviceType,
      sessionId,
      ts: Date.now(),
    };

    await recordHit(hit);

    const response = Response.redirect(new URL(`/cv/${file}`, request.url), 307);
    if (mintedNew) {
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

  return Response.redirect(new URL(`/cv/${file}`, request.url), 307);
}
