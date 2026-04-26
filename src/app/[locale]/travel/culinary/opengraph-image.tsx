import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Culinary — Eduard Fischer-Szava";
export const runtime = "edge";

export default async function CulinaryOGImage() {
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
          backgroundColor: "#1F140F",
          backgroundImage:
            "radial-gradient(circle at 25% 75%, rgba(194,93,63,0.55) 0%, rgba(31,20,15,0) 55%), linear-gradient(180deg, #1F140F 0%, #2A1A12 100%)",
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
          <span style={{ color: "#E08B6E" }}>Travel · Culinary</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              maxWidth: 1000,
            }}
          >
            Notes from the table.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              fontStyle: "italic",
              color: "rgba(242,238,227,0.85)",
              maxWidth: 980,
            }}
          >
            Dishes that earned the trip — short tasting notes, where they were
            eaten, and whether I would order them again.
          </div>
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
          <span>Same trips, different lens</span>
        </div>
      </div>
    ),
    size,
  );
}
