"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const tt = useTranslations("tooltips");
  const [mounted, setMounted] = useState(false);
  // Hydration-safe pattern recommended by next-themes — server-rendered icon would mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? tt("themeToggleToLight") : tt("themeToggleToDark")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground-subtle hover:text-accent transition-colors"
    >
      {/* placeholder while unmounted to avoid hydration flash */}
      <span className="block h-4 w-4 [.mounted_&]:hidden" aria-hidden />
      {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  );
}
