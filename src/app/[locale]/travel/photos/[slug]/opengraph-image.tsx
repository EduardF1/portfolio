import { ImageResponse } from "next/og";
import { tripCities } from "@/lib/trips-pure";
import { getTrip } from "@/lib/trips";

// Runtime note (Next 16): the per-trip `page.tsx` exports
// `generateStaticParams`, which prerenders every trip slug. Next.js
// refuses to mix `runtime = "edge"` with `generateStaticParams` in
// the same route segment, so this OG file MUST stay on the Node.js
// runtime to be prerendered alongside its page.
//
// What we still hold to (the brief): no JPG bytes are read here.
// `getTrip` does an `fs.readFile` on the small catalogue JSON only;
// it never opens any photo file. The card is pure JSX → PNG via
// Satori. That avoids the JPEG decoder crash the previous attempt
// hit when it tried to embed a hero photo as the OG background.
export const runtime = "nodejs";

// Standard OG card dimensions; same as every other OG route on the
// site so social-card crops match.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Travel photos";

// Warm Anthropic-inspired palette — matches the rest of the site.
const BG = "#FAF9F5";
const FG = "#1F1B16";
const ACCENT = "#C25D3F";

/**
 * Produce one OG image per real trip slug. The page-level
 * `generateStaticParams` already enumerates every trip slug, so
 * Next.js will call this metadata function once per slug at build
 * time and prerender the resulting card.
 */
export function generateImageMetadata({
  params,
}: {
  // Per Next 16's metadata-route loader, `generateImageMetadata`
  // receives a *plain* params object — only the default Image
  // function gets the Promise-shaped `params` and `id`. (See
  // node_modules/next/dist/.../next-metadata-route-loader.js.)
  //
  // The loader also calls this function during build-time page-data
  // collection with `params` possibly missing the slug (it walks the
  // outer route segments first). We default to a placeholder id so
  // the build still receives a valid `{ id }` shape; real slugs
  // arrive once the parent route's `generateStaticParams` has run.
  params?: { locale?: string; slug?: string };
}) {
  const slug = params?.slug ?? "default";
  return [{ id: slug, alt, size, contentType }];
}

/**
 * Build the city list shown in the card. Surface up to 4 distinct
 * cities (catalogue order) and append an ellipsis when the trip
 * touched more than that.
 */
function buildCityLine(cities: readonly string[]): string {
  if (cities.length === 0) return "";
  const top = cities.slice(0, 4);
  const suffix = cities.length > 4 ? ", …" : "";
  return top.join(", ") + suffix;
}

export default async function TripPhotosOGImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTrip(slug);

  // Fall back to a slug-titled card when the catalogue does not
  // contain this slug. Keeps preview crawlers from 500-ing during
  // the brief window between renaming a trip and rebuilding.
  const country = trip?.country ?? slug.replace(/-/g, " ");
  const cityLine = trip ? buildCityLine(tripCities(trip)) : "";
  const dateRange = trip?.dateRange ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          backgroundColor: BG,
          // Subtle warm gradient to give the card depth without
          // needing to embed any photos. Pure CSS — Satori renders
          // gradients natively.
          backgroundImage:
            "linear-gradient(135deg, #FAF9F5 0%, #F2EAD6 100%)",
          color: FG,
          // System serif fallback. Loading custom fonts in Edge needs
          // base64 embedding which bloats the bundle; the system
          // serif on every modern OS reads as "editorial" enough.
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Top kicker: TRIP marker in a mono face. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontFamily: "ui-monospace, Menlo, Consolas, monospace",
            color: ACCENT,
          }}
        >
          <span>Trip</span>
          {dateRange ? (
            <span
              style={{
                color: "rgba(31,27,22,0.7)",
                letterSpacing: 4,
              }}
            >
              {dateRange}
            </span>
          ) : null}
        </div>

        {/* Centre block: country + cities. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 120,
              lineHeight: 1.0,
              letterSpacing: -2.5,
              color: FG,
            }}
          >
            {country}
          </div>
          {cityLine ? (
            <div
              style={{
                fontSize: 36,
                lineHeight: 1.3,
                fontStyle: "italic",
                color: "rgba(31,27,22,0.78)",
                maxWidth: 1000,
              }}
            >
              {cityLine}
            </div>
          ) : null}
        </div>

        {/* Bottom row: author / watermark. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "ui-monospace, Menlo, Consolas, monospace",
            color: "rgba(31,27,22,0.65)",
          }}
        >
          <span>Eduard Fischer-Szava</span>
          <span style={{ color: ACCENT }}>EduardFischer.dev</span>
        </div>
      </div>
    ),
    size,
  );
}
