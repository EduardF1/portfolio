"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { usePalette } from "@/components/palette-provider";

/**
 * `<PaletteTracker />` — anonymous palette × theme preference beacon.
 *
 * Posts `{ palette, theme, locale, path }` to `/api/track-palette`
 * exactly once per browser tab session. A boolean flag in
 * `sessionStorage` ("palette-track-fired") guarantees the beacon
 * fires at most once per tab — toggling palette or theme mid-session
 * will not re-fire (we want first-impression counts, not engagement
 * signal).
 *
 * Privacy posture (matches /privacy and /api/track):
 *   - No PII. Never sends IP, UA, fingerprint, referer, or session
 *     identifier. The four fields above are everything the server
 *     receives.
 *   - Off-by-default. The route handler responds (or no-ops) on its
 *     own; this component still fires whenever it's mounted, so the
 *     primary kill switch is the layout wiring.
 *   - Failures are swallowed. Analytics must never break the UI.
 *
 * Mounted from `src/app/[locale]/layout.tsx`, inside both
 * `<PaletteProvider>` and `<ThemeProvider>` so both hooks have
 * context. Renders nothing.
 */

const FIRED_STORAGE_KEY = "palette-track-fired";

function alreadyFired(): boolean {
  // sessionStorage is per-tab and clears on close. Wrapped in try/catch
  // because storage is unavailable in some private-browsing modes and
  // inside sandboxed iframes.
  try {
    return window.sessionStorage.getItem(FIRED_STORAGE_KEY) === "1";
  } catch {
    // No storage → assume "not fired" but the post below will run on
    // every mount. That's acceptable: the server-side dedup window
    // (when wired) takes the brunt of the load.
    return false;
  }
}

function markFired(): void {
  try {
    window.sessionStorage.setItem(FIRED_STORAGE_KEY, "1");
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function PaletteTracker(): null {
  const { palette } = usePalette();
  const { resolvedTheme } = useTheme();
  const locale = useLocale();

  useEffect(() => {
    // next-themes resolves `resolvedTheme` to undefined on first
    // server-rendered paint; wait until the client value materialises
    // before posting. This also gives the palette provider time to
    // hydrate from localStorage.
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;

    if (alreadyFired()) return;
    // Mark BEFORE posting so a re-render mid-flight can't double-fire.
    markFired();

    try {
      void fetch("/api/track-palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palette,
          theme: resolvedTheme,
          locale,
          path: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // never throw from analytics
    }
  }, [palette, resolvedTheme, locale]);

  return null;
}
