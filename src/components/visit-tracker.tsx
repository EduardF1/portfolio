"use client";

import { useEffect } from "react";

/**
 * Tiny client-side beacon: POSTs `{ path, ref }` to /api/track once
 * per page mount. Server fills in everything else (geo from headers,
 * UA bucketing, session cookie). Failures are swallowed — analytics
 * never breaks the UI.
 *
 * Gated behind NEXT_PUBLIC_ANALYTICS_ENABLED so dev / preview builds
 * don't pollute prod data. The env var is inlined at build time so
 * the entire component compiles to ~empty when disabled.
 *
 * Bundle target: < 1 KB gzipped. Keep this file dependency-free.
 */
export function VisitTracker() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "1") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          ref: document.referrer || "",
          utmSource: sp.get("utm_source") ?? "",
          utmMedium: sp.get("utm_medium") ?? "",
          utmCampaign: sp.get("utm_campaign") ?? "",
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // never throw from analytics
    }
  }, []);
  return null;
}
