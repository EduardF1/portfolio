"use client";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#FAF9F5",
          color: "#1F1B16",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <title>Something went wrong — Eduard Fischer-Szava</title>
        <main
          style={{
            maxWidth: "32rem",
            width: "100%",
          }}
        >
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(31,27,22,0.65)",
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            500 · Something went wrong
          </p>

          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "2.5rem",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            That broke in a way I didn&apos;t plan for.
          </h1>

          <p style={{ fontSize: "1.125rem", lineHeight: 1.6, margin: 0 }}>
            Try the button below to retry — most of the time it&apos;s a
            transient hiccup. If it keeps happening,{" "}
            <a
              href="mailto:fischer_eduard@yahoo.com"
              style={{
                color: "#C25D3F",
                textDecoration: "underline",
                textUnderlineOffset: "0.2em",
              }}
            >
              drop me a line
            </a>{" "}
            with the URL you were on and I&apos;ll get it fixed.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.75rem",
                color: "rgba(31,27,22,0.55)",
              }}
            >
              ref · {error.digest}
            </p>
          )}

          <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                appearance: "none",
                cursor: "pointer",
                border: "none",
                borderRadius: "9999px",
                backgroundColor: "#1F1B16",
                color: "#FAF9F5",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Try again
            </button>
            {/* Plain anchor on purpose: the global-error boundary fires
                when the root layout itself is broken, so we can't rely on
                the router being functional. A full reload is the safer reset. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                appearance: "none",
                cursor: "pointer",
                borderRadius: "9999px",
                border: "1px solid rgba(31,27,22,0.2)",
                color: "#1F1B16",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
