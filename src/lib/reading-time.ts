/**
 * Estimate reading time for a piece of MDX/prose content.
 *
 * Heuristic: 200 words per minute (median English silent reading rate;
 * Danish ≈ same). Round up to the nearest minute, with a 1-minute floor
 * so a single-sentence post still reads as "1 min read", not "0".
 *
 * MDX gets stripped of code fences, JSX tags, and link/image markup
 * before counting so a 10-line code block doesn't inflate the estimate.
 */

const WORDS_PER_MINUTE = 200;

export function countWords(raw: string): number {
  if (!raw) return 0;
  const text = raw
    // strip fenced code blocks (```...```)
    .replace(/```[\s\S]*?```/g, " ")
    // strip inline code (`...`)
    .replace(/`[^`]*`/g, " ")
    // strip MDX/JSX tags (best effort — leaves text content intact)
    .replace(/<[^>]+>/g, " ")
    // strip markdown image markup ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    // collapse markdown links [text](url) → text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // strip frontmatter delimiters / setext headings
    .replace(/^---[\s\S]*?---/m, " ")
    // strip MD headers / lists / blockquote markers
    .replace(/^[#>*\-+]+\s*/gm, " ");

  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function readingMinutes(raw: string): number {
  const words = countWords(raw);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes: number, locale = "en"): string {
  if (minutes === 0) return "";
  if (locale === "da") return `${minutes} min læsning`;
  return `${minutes} min read`;
}
