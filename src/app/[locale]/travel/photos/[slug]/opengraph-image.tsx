import { ImageResponse } from "next/og";
import { getTrip } from "@/lib/trips";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trip, Eduard Fischer-Szava";
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
          backgroundColor: "#0F1A1F",
          backgroundImage:
            "radial-gradient(circle at 70% 30%, rgba(8,145,178,0.45) 0%, rgba(15,26,31,0) 55%), linear-gradient(180deg, #0F1A1F 0%, #1a2a32 100%)",
          color: "#F2EEE3",
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
            color: "rgba(242,238,227,0.75)",
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
          <span style={{ color: "#22D3EE" }}>Trip</span>
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
                color: "rgba(242,238,227,0.85)",
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
                color: "rgba(34,211,238,0.85)",
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
            color: "rgba(242,238,227,0.65)",
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
