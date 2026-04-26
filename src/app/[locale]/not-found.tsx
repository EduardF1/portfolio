import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Not found",
  description: "That page could not be found.",
};

const SUGGESTED = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Selected work" },
  { href: "/writing", label: "Posts and articles" },
  { href: "/recommends", label: "Recommendations" },
  { href: "/travel", label: "Travel" },
  { href: "/personal", label: "Personal" },
  { href: "/contact", label: "Contact" },
] as const;

export default function NotFound() {
  return (
    <section className="container-page pt-32 md:pt-40 pb-32 max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        404 · Not found
      </p>
      <h1 className="max-w-2xl">That page is not where it used to be.</h1>
      <p className="mt-6 text-lg max-w-2xl">
        The link may be stale, the slug may have changed, or it may never have
        existed in the first place. Try one of these instead:
      </p>

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
                {s.label}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-foreground-muted">
        Still stuck? <Link href="/contact" className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent">Drop me a line</Link> with the URL you were trying to reach and I&apos;ll fix the link.
      </p>
    </section>
  );
}
