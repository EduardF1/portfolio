import { ImageResponse } from "next/og";
import { getItem } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Posts and articles, Eduard Fischer-Szava";
export const runtime = "nodejs";

export default async function WritingOGImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  // Try writing first, fall back to articles (same /writing route).
  const item =
    (await getItem("writing", slug)) ?? (await getItem("articles", slug));
  const title =
    typeof item?.frontmatter.title === "string"
      ? item.frontmatter.title
      : slug.replace(/-/g, " ");
  const description =
    typeof item?.frontmatter.description === "string"
      ? item.frontmatter.description
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
            "radial-gradient(circle at 25% 25%, rgba(194,93,63,0.18) 0%, rgba(250,249,245,0) 55%)",
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
          <span style={{ color: "#C25D3F" }}>Posts and articles</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.35,
                fontStyle: "italic",
                color: "rgba(31,27,22,0.78)",
                maxWidth: 980,
              }}
            >
              {description.length > 180
                ? description.slice(0, 177) + "…"
                : description}
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
          <span>Notes from practice</span>
        </div>
      </div>
    ),
    size,
  );
}
