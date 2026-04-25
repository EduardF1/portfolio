import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export const mdxComponents: MDXComponents = {
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
    <Link
      href={href}
      className="text-accent underline-offset-4 hover:underline"
      {...props}
    >
      {children}
    </Link>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg bg-surface p-4 font-mono text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
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
