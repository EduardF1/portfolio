import { Mail } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import {
  formatLastSeenMonth,
  formatLastSeenPlace,
  getLastSeen,
} from "@/lib/last-seen";

const socials = [
  {
    href: "https://github.com/EduardF1",
    label: "GitHub",
    icon: GithubIcon,
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/eduard-fischer-szava/",
    label: "LinkedIn",
    icon: LinkedinIcon,
    external: true,
  },
  {
    href: "mailto:fischer_eduard@yahoo.com",
    label: "Email",
    icon: Mail,
    external: true,
  },
];

export async function SiteFooter() {
  const [locale, t, lastSeen] = await Promise.all([
    getLocale(),
    getTranslations("footer"),
    getLastSeen(),
  ]);

  return (
    <footer className="border-t border-border/60 mt-24">
      {lastSeen && (
        <div className="container-page pt-6">
          <p
            className="font-mono text-xs uppercase tracking-wider text-foreground-subtle"
            data-testid="footer-last-seen"
          >
            <span>{t("lastSeenIn")}: </span>
            <span className="text-foreground-muted normal-case tracking-normal">
              {formatLastSeenPlace(lastSeen)}
              {" — "}
              {formatLastSeenMonth(lastSeen, locale)}
            </span>
          </p>
        </div>
      )}
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-foreground-subtle">
          © {new Date().getFullYear()} Eduard Fischer-Szava · Aarhus, Denmark
        </p>
        <div className="flex items-center gap-5">
          {socials.map(({ href, label, icon: Icon, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-foreground-subtle hover:text-accent transition-colors"
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
              >
                <Icon className="h-5 w-5" />
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="text-foreground-subtle hover:text-accent transition-colors"
              >
                <Icon className="h-5 w-5" />
              </Link>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
