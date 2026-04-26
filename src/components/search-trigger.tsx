"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small "Search (⌘K)" affordance for the header.
 *
 * Doesn't own the dialog state itself — dispatches a `portfolio:search-open`
 * custom event that the globally-mounted palette listens for. Keeps the
 * header lightweight and avoids a context provider for a one-shot signal.
 */
export function SearchTrigger() {
  const t = useTranslations("search");
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const platform =
      // navigator.userAgentData is the modern API; fall back to userAgent.
      // We only use this for the cosmetic kbd hint.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).userAgentData?.platform ?? navigator.platform ?? "";
    // Hydration-safe: platform-based UI must not differ between server
    // render (no `navigator`) and client render. This is the canonical
    // sync pattern and the lint rule's allowed exception.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/mac|iphone|ipad/i.test(String(platform)));
  }, []);

  function open() {
    window.dispatchEvent(new CustomEvent("portfolio:search-open"));
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("openLabel")}
      data-testid="search-trigger"
      className={cn(
        // Use foreground-muted (not -subtle) for the small "Search ⌘K" label
        // so it clears WCAG AA 4.5:1 against the translucent header
        // background on every palette/theme combination.
        "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-foreground-muted",
        "hover:border-accent hover:text-accent transition-colors",
      )}
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{t("short")}</span>
      <kbd className="hidden md:inline font-mono text-[10px] tracking-wide">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
