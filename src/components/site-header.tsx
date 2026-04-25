"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
    { href: "/contact", label: t("contact") },
  ] as const;

  const otherLocale = locale === "en" ? "da" : "en";

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight hover:text-accent"
          aria-label="Home"
        >
          Eduard Fischer-Szava
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-foreground-muted",
                "hover:text-accent transition-colors",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
