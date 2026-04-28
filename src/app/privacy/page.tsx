// TODO i18n — EN-only POC; Dev A will localise once the i18n sweep lands
// and we decide whether to migrate this under `[locale]/privacy`.
export default function PrivacyPage() {
  return (
    <main className="container-page py-20 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        Privacy
      </p>
      <h1 className="mt-3 text-3xl font-medium">How this site uses data</h1>
      <p className="mt-6 text-lg leading-relaxed">
        This site uses minimal first-party analytics. We record anonymous,
        aggregate hit data (path, country, browser type, referrer). No IP
        addresses, names, or persistent identifiers are stored. The data is used
        by Eduard to understand which pages people read. No third-party
        trackers.
      </p>
      <p className="mt-8 text-sm text-foreground-muted">
        Questions? Contact{" "}
        <a
          href="mailto:fischer_eduard@yahoo.com"
          title="Send me an email at fischer_eduard@yahoo.com — I reply within a few business days."
          className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
        >
          fischer_eduard@yahoo.com
        </a>
        .
      </p>
    </main>
  );
}
