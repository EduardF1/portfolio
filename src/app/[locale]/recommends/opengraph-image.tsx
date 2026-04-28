import { ImageResponse } from "next/og";

// Per-route OG card for /recommends. Mirrors the root navy/cyan palette
// so LinkedIn previews read as part of the same site, with a
// route-specific tagline and a "/recommends" indicator in the corner.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Recommends — Eduard Fischer-Szava";
export const runtime = "edge";

export default async function RecommendsOGImage() {
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
          backgroundColor: "#0F172A",
          backgroundImage:
            "radial-gradient(circle at 78% 22%, #1E3A5F 0%, #0F172A 55%, #060A14 100%)",
          color: "#E2E8F0",
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
            color: "rgba(226, 232, 240, 0.85)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: "#22D3EE",
                color: "#0F172A",
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
          <span style={{ color: "#22D3EE" }}>/recommends</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 100,
              lineHeight: 1.0,
              letterSpacing: -2,
              fontWeight: 400,
              maxWidth: 1000,
            }}
          >
            Recommends.
          </div>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.3,
              fontStyle: "italic",
              color: "#22D3EE",
              maxWidth: 980,
            }}
          >
            Recommendations from colleagues and managers.
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
            color: "rgba(242, 238, 227, 0.65)",
          }}
        >
          <span>Eduard Fischer-Szava · Aarhus</span>
          <span>EN · DA</span>
        </div>
      </div>
    ),
    size,
  );
}
