import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { TripStays } from "@/components/trip-stays";

export const mdxComponents: MDXComponents = {
  // Trip-scoped stays list. Embed in a trip MDX as
  // `<TripStays slug="2025-04-czechia-poland-slovakia-austria" />`.
  // Renders nothing if no stays match the slug, so it's safe to leave
  // in unrelated MDX too.
  TripStays,
  h1: ({ children, ...props }) => (
    <h1 className="mt-12 mb-6" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-12 mb-4" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-10 mb-3" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 text-foreground" {...props}>
      {children}
    </p>
  ),
  a: ({ href = "#", children, ...props }) => (
    // Body links are always underlined: WCAG SC 1.4.1 (Use of Color)
    // requires a non-color indicator for in-text links, and on the
    // schwarzgelb light palette the gold accent is 3.08:1 against
    // cream — clears AA-large/UI but not AA-body, so the underline is
    // the visual fallback. `decoration-1` keeps it subtle; `hover:`
    // bumps to a thicker underline as the affordance.
    <Link
      href={href}
      className="text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
      {...props}
    >
      {children}
    </Link>
  ),
  // Inline `code` (no fenced block). Fenced blocks are wrapped in <pre> by
  // rehype-pretty-code and styled via globals.css — see `pre[data-language]`.
  // We avoid clobbering rehype-pretty-code's `data-language` attribute on
  // <code> inside a highlighted block: when present, render a bare element
  // so the inline token <span style="--shiki-light..."> values win.
  code: ({ children, ...props }) => {
    const hasLang = "data-language" in (props as Record<string, unknown>);
    if (hasLang) {
      // Inside a highlighted <pre> block — let globals.css drive the styling.
      return <code {...props}>{children}</code>;
    }
    return (
      <code
        className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  // Plain (un-highlighted) <pre>. Highlighted blocks ship with
  // `data-language` and are styled in globals.css under `@layer components`.
  pre: ({ children, ...props }) => {
    const hasLang = "data-language" in (props as Record<string, unknown>);
    if (hasLang) {
      // Pass through — globals.css `pre[data-language]` rule owns the styling.
      return <pre {...props}>{children}</pre>;
    }
    return (
      <pre
        className="my-6 overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-sm"
        {...props}
      >
        {children}
      </pre>
    );
  },
  ul: ({ children, ...props }) => (
    <ul className="my-4 list-disc pl-6 marker:text-foreground-subtle" {...props}>
      {children}
    </ul>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-2 border-accent pl-5 italic text-foreground-muted"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
};
