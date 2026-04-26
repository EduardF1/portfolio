"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaletteSelector } from "@/components/palette-selector";
import { SearchTrigger } from "@/components/search-trigger";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/work", label: t("work") },
    { href: "/writing", label: t("writing") },
    { href: "/recommends", label: t("recommends") },
    { href: "/personal", label: t("personal") },
    { href: "/travel", label: t("travel") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const otherLocale = locale === "en" ? "da" : "en";

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  // Mobile sheet state. We render our own focus-trapped div (Radix not
  // available in this stack) — escape-closable, click-outside-closable,
  // and respects prefers-reduced-motion.
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Each <Link> in the open sheet already calls closeMenu onClick, so a
  // tap on a nav item navigates AND closes — no route-change effect
  // needed (which would otherwise fall foul of react-hooks/set-state-in-effect).

  // ESC closes; lock body scroll while open.
  useEffect(() => {
    if (!menuOpen) return;

    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);

    // Move focus into the sheet so screen readers / keyboards land there.
    const id = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [menuOpen]);

  // Focus trap: keep Tab inside the open sheet.
  function onSheetKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex min-h-16 items-center justify-between gap-3 py-3 md:py-0">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight hover:text-accent leading-tight"
          aria-label="Eduard Fischer-Szava"
        >
          {/* Stack on mobile so "Eduard Fischer-Szava" doesn't wrap mid-word
              on narrow viewports — single line ≥md. The aria-label above
              keeps the screen-reader experience as one name. */}
          <span className="flex flex-col md:flex-row md:gap-2" aria-hidden="true">
            <span>Eduard</span>
            <span>Fischer-Szava</span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-accent",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SearchTrigger />
          <button
            type="button"
            onClick={switchLocale}
            data-testid="locale-toggle"
            className="text-xs uppercase tracking-wider text-foreground-subtle hover:text-accent"
            aria-label={
              otherLocale === "da" ? t("switchToDanish") : t("switchToEnglish")
            }
          >
            <span className={locale === "en" ? "text-foreground" : ""}>EN</span>
            <span className="mx-1.5 text-foreground-subtle">/</span>
            <span className={locale === "da" ? "text-foreground" : ""}>DA</span>
          </button>
          <PaletteSelector />
          <ThemeToggle />

          {/* Hamburger — only on screens where the inline nav is hidden.
              Sits at the end of the right cluster so it's the rightmost,
              thumb-reachable affordance on mobile. */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("openMenu")}
            aria-expanded={menuOpen}
            aria-controls={dialogId}
            data-testid="mobile-menu-trigger"
            className={cn(
              "md:hidden inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground-muted",
              "hover:border-accent hover:text-accent transition-colors",
            )}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("openMenu")}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-testid="mobile-menu"
          ref={sheetRef}
          onKeyDown={onSheetKeyDown}
          className="fixed inset-0 z-50 md:hidden"
        >
          {/* Backdrop — click to close. Reduced-motion users get no fade. */}
          <button
            type="button"
            aria-label={t("closeMenu")}
            tabIndex={-1}
            onClick={closeMenu}
            className={cn(
              "absolute inset-0 bg-foreground/40 backdrop-blur-sm",
              "transition-opacity duration-150",
              "motion-reduce:transition-none",
            )}
          />

          <div
            className={cn(
              "absolute inset-x-0 top-0 bg-background border-b border-border shadow-lg",
              "max-h-[100svh] overflow-y-auto",
              "transition-transform duration-150",
              "motion-reduce:transition-none",
            )}
          >
            <div className="container-page flex items-center justify-between py-3">
              <span
                id={titleId}
                className="font-serif text-lg tracking-tight"
              >
                {t("menuTitle")}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMenu}
                aria-label={t("closeMenu")}
                data-testid="mobile-menu-close"
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground-muted",
                  "hover:border-accent hover:text-accent transition-colors",
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t("closeMenu")}</span>
              </button>
            </div>

            <nav
              aria-label="Mobile primary"
              className="container-page pb-6 flex flex-col"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "py-3 text-base border-b border-border/40 transition-colors",
                    isActive(item.href)
                      ? "text-accent"
                      : "text-foreground hover:text-accent",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
