import { ImageResponse } from "next/og";

// Standard OpenGraph card size.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Eduard Fischer-Szava — Software Engineer & IT Consultant";

// Edge runtime keeps cold-start fast and matches Vercel's recommended setup
// for `next/og`.
export const runtime = "edge";

export default async function OGImage() {
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
          backgroundColor: "#C25D3F",
          backgroundImage:
            "radial-gradient(circle at 75% 25%, #d97a5c 0%, #C25D3F 55%, #a04429 100%)",
          color: "#FAF9F5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
            color: "rgba(250, 249, 245, 0.85)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: "rgba(250, 249, 245, 0.95)",
              color: "#C25D3F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
            }}
          >
            EF
          </div>
          <span>EduardFischer.dev</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              fontWeight: 400,
              maxWidth: 1000,
            }}
          >
            Eduard Fischer-Szava
          </div>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.25,
              fontStyle: "italic",
              color: "rgba(250, 249, 245, 0.92)",
              maxWidth: 920,
            }}
          >
            Software Engineer building stable, business-critical systems.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
            color: "rgba(250, 249, 245, 0.8)",
          }}
        >
          <span>Aarhus · Mjølner Informatics</span>
          <span>EN · DA</span>
        </div>
      </div>
    ),
    size,
  );
}
