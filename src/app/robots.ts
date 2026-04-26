import type { MetadataRoute } from "next";

const SITE = "https://eduardfischer.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin/ — gated by secret cookie, but we belt-and-braces
        // disallow it so casual probes / search engines don't even
        // ask. The route itself returns notFound() for unauth visits.
        disallow: ["/api/", "/_next/", "/admin/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
