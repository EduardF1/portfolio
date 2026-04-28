// usage:
//   node scripts/build-tech-demos.mjs                  # pulls repos via `gh`
//   node scripts/build-tech-demos.mjs --user EduardF1  # override the GitHub user
//   node scripts/build-tech-demos.mjs --limit 100      # cap the number of repos
//
// Pulls Eduard's public, non-fork, non-archived GitHub repositories via the
// `gh` CLI and writes scripts/tech-demos.json: a map keyed by GitHub language
// name to up to three repos that can serve as live demo links from a tech
// chip. Reuses the boilerplate short-circuit logic from
// sync-gh-descriptions.mjs so CRA / Next.js starter / NestJS template repos
// without their own descriptions are excluded.
//
// Idempotent: running with no arguments produces a deterministic JSON file
// (sorted by stars then name, capped at 3 entries per language) suitable for
// committing to the repository.
//
// Requires the `gh` CLI to be installed and authenticated (`gh auth login`).
// If `gh` is missing the script exits with a helpful error so the JSON cache
// can be left as an empty `{}` placeholder.
//
// Why a CLI script and not a build-time fetch? Vercel build does not have
// `gh` and we want the JSON to be reviewable in PRs.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_USER = "EduardF1";
const DEFAULT_LIMIT = 100;
const TOP_N_PER_LANGUAGE = 3;

/**
 * Patterns identifying repos whose only description came from a starter
 * template (CRA, Next.js bootstrap, NestJS scaffold). Mirrors the short-circuit
 * in sync-gh-descriptions.mjs so we don't link to "demo" repos that are
 * effectively empty scaffolds.
 *
 * @type {RegExp[]}
 */
export const TEMPLATE_DESCRIPTION_PATTERNS = [
  /create[-\s]?react[-\s]?app/i,
  /this is a \[next\.js\]\(https:\/\/nextjs\.org\) project bootstrapped/i,
  /a progressive \[node\.js\] framework/i,
];

/**
 * Repo names that look like an unmodified scaffold, regardless of description.
 * Conservative on purpose — we'd rather miss a few demos than link to a CRA
 * shell.
 *
 * @type {RegExp[]}
 */
export const TEMPLATE_NAME_PATTERNS = [
  /^create-react-app(-\w+)*$/i,
  /^my-app$/i,
  /^nextjs?-(starter|template|boilerplate)$/i,
];

/**
 * Decide whether a repo is a CRA / Next / NestJS template scaffold and should
 * be excluded from demo lists.
 *
 * @param {{ name: string; description?: string | null }} repo
 * @returns {boolean}
 */
export function isTemplateRepo(repo) {
  if (!repo || typeof repo.name !== "string") return false;
  if (TEMPLATE_NAME_PATTERNS.some((re) => re.test(repo.name))) return true;
  const desc = typeof repo.description === "string" ? repo.description : "";
  if (desc && TEMPLATE_DESCRIPTION_PATTERNS.some((re) => re.test(desc))) {
    return true;
  }
  return false;
}

/**
 * Normalise a `gh repo list` row into the flat shape we serialise into JSON.
 *
 * The CLI reports `primaryLanguage` as `{ name: "TypeScript" }` or `null`; we
 * flatten that to a plain string for downstream code.
 *
 * @param {Record<string, unknown>} row
 * @returns {{
 *   name: string;
 *   url: string;
 *   language: string | null;
 *   description: string | null;
 *   stargazerCount: number;
 *   isFork: boolean;
 *   isArchived: boolean;
 * }}
 */
export function normaliseRepo(row) {
  const lang =
    row && typeof row === "object" && row.primaryLanguage && typeof row.primaryLanguage === "object"
      ? /** @type {{ name?: unknown }} */ (row.primaryLanguage).name
      : null;
  return {
    name: typeof row?.name === "string" ? row.name : "",
    url: typeof row?.url === "string" ? row.url : "",
    language: typeof lang === "string" && lang.length > 0 ? lang : null,
    description: typeof row?.description === "string" ? row.description : null,
    stargazerCount:
      typeof row?.stargazerCount === "number" && Number.isFinite(row.stargazerCount)
        ? row.stargazerCount
        : 0,
    isFork: row?.isFork === true,
    isArchived: row?.isArchived === true,
  };
}

/**
 * Group repos by language, drop forks/archived/templates, and keep the top N
 * by stars (ties broken alphabetically). Pure for testability.
 *
 * @param {Array<{ name: string; url: string; language: string | null; description: string | null; stargazerCount: number; isFork: boolean; isArchived: boolean }>} repos
 * @param {number} [topN]
 * @returns {Record<string, Array<{ name: string; url: string; description: string }>>}
 */
export function buildLanguageMap(repos, topN = TOP_N_PER_LANGUAGE) {
  /** @type {Record<string, Array<{ name: string; url: string; description: string; stars: number }>>} */
  const grouped = {};
  for (const r of repos) {
    if (!r || !r.name || !r.url) continue;
    if (r.isFork || r.isArchived) continue;
    if (!r.language) continue;
    if (isTemplateRepo(r)) continue;
    const list = grouped[r.language] ?? (grouped[r.language] = []);
    list.push({
      name: r.name,
      url: r.url,
      description: r.description ?? "",
      stars: r.stargazerCount,
    });
  }
  /** @type {Record<string, Array<{ name: string; url: string; description: string }>>} */
  const out = {};
  for (const lang of Object.keys(grouped).sort()) {
    const sorted = grouped[lang]
      .slice()
      .sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.name.localeCompare(b.name);
      })
      .slice(0, topN)
      .map(({ name, url, description }) => ({ name, url, description }));
    if (sorted.length > 0) out[lang] = sorted;
  }
  return out;
}

/**
 * Parse process argv into a typed options object.
 *
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  /** @type {{ user: string; limit: number; help?: boolean }} */
  const opts = { user: DEFAULT_USER, limit: DEFAULT_LIMIT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--user") opts.user = argv[++i];
    else if (a === "--limit") {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (a === "-h" || a === "--help") opts.help = true;
  }
  return opts;
}

const HELP = `Usage:
  node scripts/build-tech-demos.mjs [--user EduardF1] [--limit 100]

Writes scripts/tech-demos.json — a map of GitHub language names to up to
three demo repositories, sorted by stars then name. Requires \`gh\` CLI.
`;

/**
 * Shell out to `gh repo list` and return the parsed JSON array. Isolated so
 * the build pipeline can be tested without the CLI.
 *
 * @param {string} user
 * @param {number} limit
 * @returns {Array<Record<string, unknown>>}
 */
export function fetchReposViaGh(user, limit) {
  const args = [
    "repo",
    "list",
    user,
    "--json",
    "name,url,primaryLanguage,description,stargazerCount,isFork,isArchived",
    "--limit",
    String(limit),
  ];
  const stdout = execFileSync("gh", args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed)) {
    throw new Error("`gh repo list` did not return a JSON array");
  }
  return parsed;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  /** @type {Array<Record<string, unknown>>} */
  let raw;
  try {
    raw = fetchReposViaGh(opts.user, opts.limit);
  } catch (err) {
    const msg = err && /** @type {Error} */ (err).message ? /** @type {Error} */ (err).message : String(err);
    console.error(`ERROR: \`gh repo list\` failed: ${msg}`);
    console.error(
      "Make sure the GitHub CLI is installed and authenticated (`gh auth login`).",
    );
    return 1;
  }

  const repos = raw.map(normaliseRepo);
  const map = buildLanguageMap(repos);

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = `${here}/tech-demos.json`;
  mkdirSync(here, { recursive: true });
  writeFileSync(outPath, JSON.stringify(map, null, 2) + "\n", "utf8");

  const totalDemos = Object.values(map).reduce((n, list) => n + list.length, 0);
  const langs = Object.keys(map).length;
  console.log(
    `Wrote ${outPath}: ${langs} language(s), ${totalDemos} demo entr${totalDemos === 1 ? "y" : "ies"} (top ${TOP_N_PER_LANGUAGE} per language).`,
  );
  return 0;
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`
) {
  main().then(
    (code) => process.exit(code ?? 0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
