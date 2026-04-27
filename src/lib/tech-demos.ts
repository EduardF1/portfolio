/**
 * Typed loader for the GitHub-language → demo-repos map produced by
 * `scripts/build-tech-demos.mjs`. Imported by tech chips to render a
 * "demo" badge that links to live public repositories whose primary
 * language matches the chip's `ghLanguage`.
 *
 * The JSON is committed; rebuild via `npm run build:tech-demos`.
 */
import demosJson from "../../scripts/tech-demos.json";

export type TechDemo = {
  /** GitHub repository name (e.g. "scala-hands-on"). */
  name: string;
  /** Full HTTPS GitHub URL. */
  url: string;
  /** Repo description, possibly empty. */
  description: string;
};

/** Map keyed by GitHub primary language name (e.g. "C#", "TypeScript"). */
export type TechDemosMap = Record<string, readonly TechDemo[]>;

const DEMOS: TechDemosMap = demosJson as TechDemosMap;

/**
 * Look up demo repositories for a given GitHub language. Returns an empty
 * array when there's no match — the caller can use that to hide the badge.
 *
 * Defensive: handles `null` / `undefined` (chips for techs with no
 * `ghLanguage` mapping).
 */
export function demosForLanguage(language: string | null | undefined): readonly TechDemo[] {
  if (!language) return [];
  const list = DEMOS[language];
  return Array.isArray(list) ? list : [];
}

/**
 * Whole map, exported for tests and tooling. Treat as read-only.
 */
export function allTechDemos(): TechDemosMap {
  return DEMOS;
}
