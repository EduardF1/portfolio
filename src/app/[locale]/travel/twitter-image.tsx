import OGImage, {
  size as ogSize,
  contentType as ogContentType,
  alt as ogAlt,
} from "./opengraph-image";

// Next 16 metadata-image routes need locally-declared `runtime` and
// `size`/`contentType`/`alt` — re-exporting them via `export { … } from`
// trips Turbopack. Mirror the values directly. (Same pattern as the root
// twitter-image.tsx.)
export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;
export const runtime = "edge";

export default OGImage;
