import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(da|en)/:path*",
    // Exclude /admin and /privacy too — these are EN-only roots that
    // sit outside `[locale]` (admin is gated, privacy is EN-only POC).
    // Also exclude the root metadata image routes (opengraph-image,
    // twitter-image) — they're served from `src/app/` directly and
    // have no file extension, so the dot-path exclusion doesn't catch
    // them; without this, next-intl rewrites them into a non-existent
    // locale path and they 404 (breaking social link previews).
    // Letting next-intl rewrite them would 404 the underlying routes.
    "/((?!_next|_vercel|api|admin|privacy|opengraph-image|twitter-image|.*\\..*).*)",
  ],
};
