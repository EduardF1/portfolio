import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Toggle with `ANALYZE=true npm run build` — opens treemap reports for the
// client/server/edge bundles. Off by default so dev/build is unaffected.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    // Next 15+ silently ignores `<Image quality={90}>` unless the value
    // is enumerated here. Without 90 in the list the optimiser falls
    // back to the default 75, which keeps the hero portrait softer than
    // intended on high-DPI screens.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        // Belt-and-braces noindex for the admin tree. The page itself
        // returns notFound() to unauth visitors, but this header keeps
        // any future bots that ignore the route's robots metadata
        // from listing it.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, nocache" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
