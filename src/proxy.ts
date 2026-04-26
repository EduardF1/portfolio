import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(da|en)/:path*",
    // Exclude /admin and /privacy too — these are EN-only roots that
    // sit outside `[locale]` (admin is gated, privacy is EN-only POC).
    // Letting next-intl rewrite them would 404 the underlying routes.
    "/((?!_next|_vercel|api|admin|privacy|.*\\..*).*)",
  ],
};
