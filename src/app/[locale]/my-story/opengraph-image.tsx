import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "How I got here — Eduard Fischer-Szava";
export const runtime = "edge";

export default async function MyStoryOGImage() {
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
            "radial-gradient(circle at 80% 20%, rgba(194,93,63,0.20) 0%, rgba(250,249,245,0) 60%)",
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
            color: "rgba(31,27,22,0.65)",
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
          <span style={{ color: "#C25D3F" }}>/my-story</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 110,
              lineHeight: 1.0,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            How I got here.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              fontStyle: "italic",
              color: "rgba(31,27,22,0.75)",
              maxWidth: 980,
            }}
          >
            A chronological version of the CV — the choices, not the
            achievements. Dated, honest, and short.
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
            color: "rgba(31,27,22,0.55)",
          }}
        >
          <span>Eduard Fischer-Szava · Aarhus</span>
          <span>2014 → today</span>
        </div>
      </div>
    ),
    size,
  );
}
