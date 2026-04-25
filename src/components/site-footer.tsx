import { Mail } from "lucide-react";
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
    label: "Email",
    icon: Mail,
    external: true,
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
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
