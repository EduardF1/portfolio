export function PagePlaceholder({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <section className="container-page py-24 md:py-32">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {kicker}
      </p>
      <h1 className="max-w-3xl">{title}</h1>
      <p className="mt-8 max-w-2xl text-lg">{description}</p>
      <p className="mt-12 inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground-subtle">
        Placeholder · Content arriving soon
      </p>
    </section>
  );
}
