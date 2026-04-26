/**
 * Minimal User-Agent string parser for analytics bucketing.
 *
 * Returns rough buckets: browser, OS, deviceType. Designed to be
 * tiny and predictable rather than exhaustive — we're aggregating
 * for a personal-portfolio dashboard, not building a fingerprinting
 * library. If a UA does not match any known pattern we fall back to
 * "Other" (browser/OS) or "desktop" (deviceType).
 *
 * No third-party dep on purpose: this runs on the Edge runtime and
 * we don't want to ship ua-parser-js' ~30 KB just to bin into a
 * handful of buckets.
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

export type ParsedUA = {
  browser: string;
  os: string;
  deviceType: DeviceType;
};

const UNKNOWN: ParsedUA = {
  browser: "Other",
  os: "Other",
  deviceType: "desktop",
};

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) return UNKNOWN;
  const s = ua.toLowerCase();

  // Order matters — Edge/Opera embed "Chrome" in their UA, so they
  // must be tested before Chrome. Safari embeds "Version/x" but is
  // confusable with Chrome on iOS, so we test Chrome before Safari
  // but match Safari only when Chrome/Edge/Firefox are absent.
  let browser: string;
  if (s.includes("edg/") || s.includes("edge/")) browser = "Edge";
  else if (s.includes("opr/") || s.includes("opera")) browser = "Opera";
  else if (s.includes("firefox/")) browser = "Firefox";
  else if (s.includes("chrome/") && !s.includes("chromium")) browser = "Chrome";
  else if (s.includes("chromium")) browser = "Chromium";
  else if (s.includes("safari/") && !s.includes("chrome")) browser = "Safari";
  else browser = "Other";

  let os: string;
  if (s.includes("windows nt")) os = "Windows";
  else if (s.includes("android")) os = "Android";
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ipod"))
    os = "iOS";
  else if (s.includes("mac os x") || s.includes("macintosh")) os = "macOS";
  else if (s.includes("linux")) os = "Linux";
  else os = "Other";

  let deviceType: DeviceType;
  if (s.includes("ipad") || (s.includes("android") && !s.includes("mobile")))
    deviceType = "tablet";
  else if (
    s.includes("mobile") ||
    s.includes("iphone") ||
    s.includes("ipod") ||
    s.includes("android")
  )
    deviceType = "mobile";
  else deviceType = "desktop";

  return { browser, os, deviceType };
}
