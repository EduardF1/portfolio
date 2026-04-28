import OGImage, {
  size as ogSize,
  contentType as ogContentType,
  alt as ogAlt,
} from "./opengraph-image";

// Next 16 metadata-image routes need locally-declared `runtime` and
// `size`/`contentType`/`alt` — re-exporting them via `export { … } from`
// trips Turbopack. Mirror the values directly. The OG card already
// uses 1200×630 with terracotta-on-cream, which is what Twitter wants
// for `summary_large_image`.
export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;
// Same runtime as the OG image: needs `node:fs` to read the catalogue.
export const runtime = "nodejs";

// Twitter card and OG card are visually identical for this route, so
// re-use the same renderer. `generateStaticParams` is inherited from
// the page segment, so no need to redeclare it here.
export default OGImage;
