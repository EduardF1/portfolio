import { ImageResponse } from "next/og";
import { getTrip } from "@/lib/trips";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trip, Eduard Fischer-Szava";
// `nodejs` runtime so the route handler can read the on-disk catalogue
// via `getTrip` (the edge runtime forbids `node:fs`).
export const runtime = "nodejs";

export default async function TripPhotosOGImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  const headline = trip
    ? `${trip.primaryCity ?? trip.country}, ${trip.monthLabel}`
    : slug.replace(/-/g, " ");
  const placeline = trip
    ? `${trip.country.toUpperCase()} · ${trip.dateRange}`
    : "";
  const photoLine = trip
    ? `${trip.photoCount} ${trip.photoCount === 1 ? "photo" : "photos"}`
    : "";

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
          backgroundColor: "#FAF9F5",
          backgroundImage:
            "linear-gradient(135deg, #FAF9F5 0%, #F2EAD6 100%)",
          color: "#1F1B16",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
            color: "rgba(31,27,22,0.7)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#C25D3F",
                color: "#FAF9F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, serif",
                fontSize: 24,
              }}
            >
              EF
            </div>
            <span>EduardFischer.dev</span>
          </div>
          <span style={{ color: "#C25D3F" }}>Trip</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              maxWidth: 1000,
            }}
          >
            {headline}
          </div>
          {placeline && (
            <div
              style={{
                fontSize: 26,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                color: "rgba(31,27,22,0.78)",
              }}
            >
              {placeline}
            </div>
          )}
          {photoLine && (
            <div
              style={{
                fontSize: 26,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                color: "#C25D3F",
              }}
            >
              {photoLine}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
            color: "rgba(31,27,22,0.65)",
          }}
        >
          <span>Eduard Fischer-Szava · Aarhus</span>
          <span>Notes from the road</span>
        </div>
      </div>
    ),
    size,
  );
}
