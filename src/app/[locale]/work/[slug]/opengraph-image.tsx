import { ImageResponse } from "next/og";
import { getItem } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Case study, Eduard Fischer-Szava";
// `next/og` expects the Node runtime when the route also reads from the
// filesystem (gray-matter under getItem). Edge can't see content/.
export const runtime = "nodejs";

export default async function WorkOGImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem("work", slug);
  const title =
    typeof item?.frontmatter.title === "string"
      ? item.frontmatter.title
      : slug.replace(/-/g, " ");
  const kicker =
    typeof item?.frontmatter.kicker === "string"
      ? item.frontmatter.kicker
      : "Selected work";
  const description =
    typeof item?.frontmatter.description === "string"
      ? item.frontmatter.description
      : "Case study, business-critical system.";

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
          backgroundColor: "#15110D",
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(224,139,110,0.45) 0%, rgba(21,17,13,0.0) 55%), linear-gradient(180deg, #15110D 0%, #1f1814 100%)",
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
            color: "rgba(242, 238, 227, 0.75)",
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
                fontWeight: 400,
              }}
            >
              EF
            </div>
            <span>EduardFischer.dev</span>
          </div>
          <span style={{ color: "#E08B6E" }}>{kicker}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              fontWeight: 400,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              fontStyle: "italic",
              color: "rgba(242, 238, 227, 0.85)",
              maxWidth: 980,
            }}
          >
            {description.length > 180
              ? description.slice(0, 177) + "…"
              : description}
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
            color: "rgba(242, 238, 227, 0.7)",
          }}
        >
          <span>Eduard Fischer-Szava · Aarhus</span>
          <span>Selected work</span>
        </div>
      </div>
    ),
    size,
  );
}
