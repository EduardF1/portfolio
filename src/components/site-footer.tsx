import { Mail } from "lucide-react";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { GithubIcon, LinkedinIcon } from "@/components/icons";

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
    label: "Send email",
    icon: Mail,
    external: true,
  },
];

export async function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-foreground-subtle">
          © {new Date().getFullYear()} Eduard Fischer-Szava · Aarhus, Denmark
          {" · "}
          {/* TODO i18n — /privacy is an EN-only root POC. We use NextLink
              (not the i18n one) because /privacy lives outside `[locale]`
              and the i18n Link would prepend a locale prefix. Cross-
              root-layout navigation triggers a full page load by design,
              which is fine for a footer link. */}
          <NextLink
            href="/privacy"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            Privacy
          </NextLink>
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
