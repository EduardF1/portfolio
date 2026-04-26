import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Not found",
  description: "That page could not be found.",
};

const SUGGESTED = [
  { href: "/", labelKey: "home" },
  { href: "/work", labelKey: "work" },
  { href: "/writing", labelKey: "writing" },
  { href: "/travel", labelKey: "travel" },
  { href: "/personal", labelKey: "personal" },
  { href: "/contact", labelKey: "contact" },
] as const;

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="container-page pt-32 md:pt-40 pb-32 max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {t("kicker")}
      </p>
      <h1 className="max-w-2xl">{t("heading")}</h1>
      <p className="mt-6 text-lg max-w-2xl">{t("lead")}</p>

      <ul className="mt-8 grid gap-px bg-border/60 sm:grid-cols-2 rounded-lg overflow-hidden">
        {SUGGESTED.map((s) => (
          <li key={s.href} className="bg-background">
            <Link
              href={s.href}
              className="block p-6 hover:bg-surface transition-colors"
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
                {s.href}
              </p>
              <p className="mt-1 text-foreground hover:text-accent transition-colors">
                {t(`links.${s.labelKey}`)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-foreground-muted">
        {t.rich("stuck", {
          contact: (chunks) => (
            <Link
              href="/contact"
              className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </section>
  );
}
