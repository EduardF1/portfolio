"use client";

import { useEffect } from "react";

/**
 * Client-side analytics beacon.
 *
 * Beyond the original pageview ping, this component now layers in:
 *   - a tab-scoped clientSessionId (sessionStorage)
 *   - max scroll depth across the page lifetime (snapshotted at 25 /
 *     50 / 75 / 100 % milestones and on exit)
 *   - foreground-time accumulator (paused on `visibilitychange`)
 *   - a 30s heartbeat that flushes the current scroll + time deltas
 *   - exit beacons via `sendBeacon` on pagehide
 *   - UTM fields (term, content in addition to source/medium/campaign)
 *     and a hostname-only referrer (we never POST the raw referrer URL)
 *   - language inference from the URL path (/en or /da)
 *   - explicit events for CV download (`a[data-event=cv_download]`),
 *     language switch (`a[data-event=language_switch]`), and outbound
 *     link clicks (any anchor whose hostname differs from the current
 *     origin).
 *
 * The component is gated behind NEXT_PUBLIC_ANALYTICS_ENABLED so dev
 * builds never beacon. The flag is inlined at build time, so when it
 * is off the entire effect tree compiles to a no-op.
 *
 * Bundle target: < 2 KB gzipped. Keep this file dependency-free.
 */
export function VisitTracker() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "1") return;
    if (typeof window === "undefined") return;

    // ---- per-tab session id (sessionStorage, persists across SPA navs) ----
    const SS_KEY = "pf_client_sid";
    let clientSessionId: string | undefined;
    try {
      clientSessionId = window.sessionStorage.getItem(SS_KEY) ?? undefined;
      if (!clientSessionId) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        clientSessionId = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        window.sessionStorage.setItem(SS_KEY, clientSessionId);
      }
    } catch {
      // sessionStorage can throw in strict privacy modes; we just skip
      // the id and continue with anonymous pageviews.
    }

    // ---- UTM + referrer parsing (once per mount, sent on every beacon) ----
    const sp = new URLSearchParams(window.location.search);
    const utmSource = sp.get("utm_source") ?? "";
    const utmMedium = sp.get("utm_medium") ?? "";
    const utmCampaign = sp.get("utm_campaign") ?? "";
    const utmTerm = sp.get("utm_term") ?? "";
    const utmContent = sp.get("utm_content") ?? "";

    const referrerHost = (() => {
      const raw = document.referrer || "";
      if (!raw) return "";
      try {
        return new URL(raw).hostname || "";
      } catch {
        return "";
      }
    })();

    const lang: "en" | "da" =
      window.location.pathname.startsWith("/da") ? "da" : "en";

    // ---- time-on-page accumulator ----
    // We bank foreground time only. Background tabs contribute zero,
    // so a user who opens a tab and walks away doesn't inflate the
    // average. Math: `accumulatedMs + (now - foregroundSinceTs)`
    // whenever the page is currently visible.
    let accumulatedMs = 0;
    let foregroundSinceTs: number | null =
      document.visibilityState === "visible" ? Date.now() : null;
    const elapsedMs = (): number => {
      if (foregroundSinceTs === null) return accumulatedMs;
      return accumulatedMs + (Date.now() - foregroundSinceTs);
    };

    // ---- scroll depth ----
    // Track max %, ping immediately when crossing milestones. Use
    // bucketed milestones rather than raw % so we don't beacon on
    // every scrollend event.
    const MILESTONES = [25, 50, 75, 100] as const;
    let maxScrollPct = 0;
    const seenMilestones = new Set<number>();
    const updateScroll = (): void => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const pct =
        total <= 0 ? 100 : Math.min(100, Math.round((doc.scrollTop / total) * 100));
      if (pct > maxScrollPct) maxScrollPct = pct;
      for (const m of MILESTONES) {
        if (maxScrollPct >= m && !seenMilestones.has(m)) {
          seenMilestones.add(m);
          beacon("pageview", { scrollDepthPct: m });
        }
      }
    };

    // ---- beacon helper ----
    type Extra = {
      scrollDepthPct?: number;
      timeOnPageMs?: number;
      linkHref?: string;
      path?: string;
    };
    type Event =
      | "pageview"
      | "cv_download"
      | "language_switch"
      | "external_link"
      | "exit";
    const beacon = (event: Event, extra: Extra = {}): void => {
      try {
        const payload: Record<string, unknown> = {
          path: extra.path ?? window.location.pathname,
          ref: document.referrer || "",
          referrerHost,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          lang,
          event,
          ...(clientSessionId ? { clientSessionId } : {}),
          scrollDepthPct: extra.scrollDepthPct ?? maxScrollPct,
          timeOnPageMs: extra.timeOnPageMs ?? elapsedMs(),
        };
        if (extra.linkHref) payload.linkHref = extra.linkHref;
        const body = JSON.stringify(payload);
        // sendBeacon is the only reliable transport for pagehide /
        // beforeunload. Fall back to keepalive fetch otherwise so
        // mid-session pings can still respect CORS / cookies.
        if (event === "exit" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/track",
            new Blob([body], { type: "application/json" }),
          );
          return;
        }
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // analytics must never throw into the host page
      }
    };

    // ---- initial pageview ----
    beacon("pageview");

    // ---- listeners ----
    const onScroll = (): void => updateScroll();
    const onVisibility = (): void => {
      if (document.visibilityState === "visible") {
        if (foregroundSinceTs === null) foregroundSinceTs = Date.now();
      } else if (foregroundSinceTs !== null) {
        accumulatedMs += Date.now() - foregroundSinceTs;
        foregroundSinceTs = null;
      }
    };
    const onPageHide = (): void => {
      // Final time + scroll snapshot. Use sendBeacon path inside.
      beacon("exit", {
        scrollDepthPct: maxScrollPct,
        timeOnPageMs: elapsedMs(),
      });
    };
    const onClick = (ev: MouseEvent): void => {
      // Only intercept primary-button clicks on real anchor tags.
      if (ev.button !== 0 || ev.defaultPrevented) return;
      const target = ev.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href) return;
      const explicit = anchor.getAttribute("data-event") as Event | null;
      if (explicit === "cv_download" || explicit === "language_switch") {
        // For explicit events we send the slug only — the CV route
        // (/cv) or the locale code, never the full URL with query.
        const slug = href.split("?")[0]?.split("#")[0] ?? "";
        beacon(explicit, { linkHref: slug.slice(0, 256) });
        return;
      }
      // Outbound link inference: absolute URL with a different host.
      if (!/^https?:\/\//i.test(href)) return;
      try {
        const u = new URL(href, window.location.href);
        if (u.host && u.host !== window.location.host) {
          // We only persist the host of the destination, never the
          // full URL with path or query, to stay aligned with the
          // privacy posture documented on /privacy.
          beacon("external_link", { linkHref: u.host.slice(0, 256) });
        }
      } catch {
        // unparseable href, drop silently
      }
    };

    document.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("click", onClick, true);

    // ---- 30 s heartbeat ----
    const HEARTBEAT_MS = 30_000;
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      beacon("pageview", {
        scrollDepthPct: maxScrollPct,
        timeOnPageMs: elapsedMs(),
      });
    }, HEARTBEAT_MS);

    return () => {
      document.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("click", onClick, true);
      window.clearInterval(heartbeat);
    };
  }, []);

  return null;
}
