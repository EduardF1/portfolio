import { buildSearchIndex } from "@/lib/search/build-index";
import { routing } from "@/i18n/routing";

/**
 * Serve the per-locale search index as a JSON document.
 *
 * Cached aggressively at the edge — content rebuilds on deploy, so a
 * stale index between deploys is fine. The client palette fetches this
 * once, hydrates a FlexSearch document index, and never refetches.
 */
export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return new Response(
      JSON.stringify({ error: "unknown locale" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  const index = await buildSearchIndex(locale);
  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
