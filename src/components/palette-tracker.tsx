"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePalette } from "@/components/palette-provider";

/**
 * Tiny client-side beacon for the palette × theme analytics scaffold.
 * POSTs `{ palette, theme, sessionHash }` to /api/track-palette once
 * per page mount when the prototype flag is on.
 *
 * Renders nothing.
 *
 * Flag: NEXT_PUBLIC_PROTO_PALETTE_TRACK. The env var is inlined at
 * build time — a static literal reference is required for Next to
 * tree-shake the body when the flag is unset (see the "Important
 * Next.js gotcha" comment in src/lib/proto-flags.ts).
 *
 * Mounting (intentionally NOT done in this scaffold — see
 * docs/palette-analytics-design.md §8):
 *   The component must be rendered inside both `<PaletteProvider>`
 *   and the `<ThemeProvider>` so the hooks have context. The natural
 *   home is alongside any existing `<VisitTracker />` in the locale
 *   layout (`src/app/[locale]/layout.tsx`) — but wiring is the
 *   follow-up step, not part of this scope.
 *
 * Failure modes are all swallowed — analytics must never break the
 * UI. Bundle target: dependency-free apart from the existing palette
 * and next-themes hooks.
 */

const HASH_STORAGE_KEY = "palette-track-hash";

function getOrCreateSessionHash(): string | null {
  // sessionStorage is per-tab and clears on close — exactly what the
  // dedup contract wants. Wrapped in try/catch because storage is
  // unavailable in some private-browsing modes and inside iframes
  // with sandboxing.
  try {
    const existing = window.sessionStorage.getItem(HASH_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    // crypto.randomUUID is widely supported in modern browsers; fall
    // back to a Math.random hash if not.
    const fresh =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `r-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(HASH_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

export function PaletteTracker() {
  const { palette } = usePalette();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PROTO_PALETTE_TRACK !== "1") return;

    // Only post once per mount, and only after next-themes has
    // resolved the user's theme (it's `undefined` on first render
    // until the cookie/localStorage hydrate). We deliberately do NOT
    // re-fire when the user toggles palette/theme — see design doc
    // §4 "Client trigger" for rationale.
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;

    const sessionHash = getOrCreateSessionHash();
    if (!sessionHash) return;

    try {
      void fetch("/api/track-palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palette,
          theme: resolvedTheme,
          sessionHash,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // never throw from analytics
    }
    // Empty deps: fire once per mount. We intentionally do NOT depend
    // on `palette` or `resolvedTheme` — a re-fire-on-change variant
    // would change the data semantics from "first impression" to
    // "engagement". That's a separate decision (design doc §7).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
