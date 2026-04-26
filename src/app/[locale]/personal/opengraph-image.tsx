import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Personal — Eduard Fischer-Szava";
export const runtime = "edge";

export default async function PersonalOGImage() {
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
          backgroundColor: "#1A1A1A",
          backgroundImage:
            "linear-gradient(135deg, #1A1A1A 0%, #1A1A1A 60%, #FDE047 60.01%, #FDE047 100%)",
          color: "#FDE047",
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
            color: "rgba(253,224,71,0.85)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#FDE047",
                color: "#1A1A1A",
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
          <span style={{ color: "#1A1A1A", fontWeight: 600 }}>/personal</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              maxWidth: 1000,
            }}
          >
            Schwarzgelb, Stuttgart, the road.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              fontStyle: "italic",
              color: "rgba(253,224,71,0.92)",
              maxWidth: 980,
            }}
          >
            Football, cars, and travel: the bits of life that are not on my
            CV but show up in how I work.
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
            color: "rgba(253,224,71,0.7)",
          }}
        >
          <span>Eduard Fischer-Szava · Aarhus</span>
          <span style={{ color: "#1A1A1A", fontWeight: 600 }}>BVB · 09</span>
        </div>
      </div>
    ),
    size,
  );
}
