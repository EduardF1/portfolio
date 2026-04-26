import { useTranslations } from "next-intl";
import { techsByCategory, type Tech } from "@/lib/tech";

const CATEGORY_ORDER: ReadonlyArray<Tech["category"]> = [
  "backend",
  "frontend",
  "mobile",
  "data",
  "testing",
  "ops",
];

function iconUrl(icon: string): string {
  if (icon.startsWith("http")) return icon;
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${icon}/${icon}-original.svg`;
}

function TechTile({ tech }: { tech: Tech }) {
  return (
    <a
      href={tech.docsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={tech.name}
      className="group flex flex-col items-center gap-2 p-4 rounded-md border border-border hover:border-accent transition-colors"
    >
      {tech.icon ? (
        // Devicon CDN — using <img> (not next/image) so we don't need
        // a remotePatterns entry in next.config.ts for cdn.jsdelivr.net.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl(tech.icon)}
          alt={tech.name}
          width={32}
          height={32}
          loading="lazy"
          className="h-8 w-8"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-border/80 font-mono text-[0.6rem] uppercase tracking-wider text-foreground-subtle group-hover:border-accent group-hover:text-accent transition-colors"
        >
          {tech.name.slice(0, 3)}
        </span>
      )}
      <span className="font-mono text-[0.7rem] uppercase tracking-wider text-foreground-muted group-hover:text-accent transition-colors text-center">
        {tech.name}
      </span>
    </a>
  );
}

export function Skills() {
  const t = useTranslations();
  const groups = techsByCategory();

  return (
    <section className="container-page py-20 md:py-28 border-t border-border/60">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            {t("skills.kicker")}
          </p>
          <h2 className="mt-4">{t("skills.heading")}</h2>
          <p className="mt-4 max-w-md">{t("skills.description")}</p>
        </div>
        <div className="md:col-span-8 space-y-10">
          {CATEGORY_ORDER.map((category) => {
            const techs = groups[category];
            if (techs.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-4">
                  {t(`skills.categories.${category}`)}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {techs.map((tech) => (
                    <TechTile key={tech.slug} tech={tech} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
