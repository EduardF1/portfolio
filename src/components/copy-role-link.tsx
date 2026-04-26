"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Per-role "copy link" button. Builds an absolute URL pointing at the
 * #role-{slug} anchor on the home page so it can be pasted into a
 * recruiter conversation: "the relevant slice of my CV is here".
 *
 * Plain client component — uses navigator.clipboard.
 */
export function CopyRoleLink({
  slug,
  label,
}: {
  slug: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/#role-${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API blocked (older browsers, file://). Silent failure
      // is acceptable here — the anchor still works via the URL bar.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Copied link to ${label}` : `Copy link to ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-mono text-foreground-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Link2 className="h-3 w-3" aria-hidden="true" />
          <span>Copy link</span>
        </>
      )}
    </button>
  );
}
