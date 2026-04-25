// usage:
//   node scripts/sync-gh-descriptions.mjs                     # dry-run
//   node scripts/sync-gh-descriptions.mjs --apply             # actually PATCH each repo
//   node scripts/sync-gh-descriptions.mjs --user EduardF1     # override GitHub user
//   node scripts/sync-gh-descriptions.mjs --limit 5           # process at most 5 repos
//
// For each public, non-fork, non-archived repo of the given GitHub user that has
// no description, this script proposes a one-line blurb derived from the README
// (first non-heading paragraph) or, failing that, a templated fallback based on
// the repo's primary language. Without --apply it only prints proposals; with
// --apply it PATCHes each repo via the GitHub REST API using a token from
// `gh auth token` or the GH_TOKEN env var.

import { execSync } from "node:child_process";
import process from "node:process";

const DEFAULT_USER = "EduardF1";
const MAX_DESC_LEN = 200;
const MIN_PARAGRAPH_LEN = 30;
const MAX_PARAGRAPH_LEN = 200;

// ---------------------------------------------------------------------------
// Description proposal (pure, exported for tests)
// ---------------------------------------------------------------------------

/**
 * Build a one-line description proposal.
 * @param {{ name: string, language?: string | null, readmeText?: string | null }} input
 * @returns {{ description: string, source: "from-readme" | "no-readme" | "templated" }}
 */
export function proposeDescription({ name, language, readmeText }) {
  if (readmeText && readmeText.trim().length > 0) {
    const paragraph = extractFirstParagraph(readmeText);
    if (paragraph) {
      return { description: finalize(paragraph), source: "from-readme" };
    }
    const tagline = extractH1Tagline(readmeText);
    if (tagline) {
      return { description: finalize(tagline), source: "from-readme" };
    }
    // README exists but nothing usable — fall through to templated.
    return { description: finalize(templated(name, language)), source: "templated" };
  }
  return { description: finalize(templated(name, language)), source: "no-readme" };
}

/**
 * Boilerplate paragraphs we never want to use as a description (CRA/NestJS/etc.).
 * Compared after stripping markdown and lower-casing.
 */
const BOILERPLATE_PATTERNS = [
  /this project was bootstrapped with create react app/i,
  /^npm (run|install|start)/i,
  /^\$\s*(npm|yarn|pnpm)\b/i,
  /^getting started with create react app/i,
  /^in the project directory,? you can run\b/i,
  /^you can learn more in the create react app documentation/i,
  /^to learn react,? check out the react documentation/i,
];

/**
 * Pull the first non-heading, non-list, non-badge paragraph from README markdown.
 * @param {string} md
 * @returns {string | null}
 */
export function extractFirstParagraph(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  /** @type {string[]} */
  let buf = [];

  /** @returns {string | null} */
  const flush = () => {
    if (buf.length === 0) return null;
    const joined = buf.join(" ").replace(/\s+/g, " ").trim();
    buf = [];
    const stripped = stripMarkdown(joined);
    if (BOILERPLATE_PATTERNS.some((re) => re.test(stripped))) {
      return null;
    }
    if (joined.length >= MIN_PARAGRAPH_LEN && joined.length <= MAX_PARAGRAPH_LEN) {
      return joined;
    }
    // If too long, keep the first sentence if it fits.
    if (joined.length > MAX_PARAGRAPH_LEN) {
      const firstSentence = joined.split(/(?<=[.!?])\s+/)[0];
      if (firstSentence && firstSentence.length >= MIN_PARAGRAPH_LEN) {
        return firstSentence;
      }
    }
    return null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const isBlank = line.length === 0;
    const isHeading = /^#{1,6}\s/.test(line);
    const isList = /^([-*+]|\d+\.)\s/.test(line);
    const isQuote = /^>/.test(line);
    const isHtml = /^<[^>]+>/.test(line);
    const isBadge = /!\[[^\]]*\]\([^)]*\)/.test(line) && !/[a-z]{4,}/i.test(line.replace(/!\[[^\]]*\]\([^)]*\)/g, ""));
    const isCodeFence = /^```/.test(line);
    const isHr = /^([-*_])\1{2,}$/.test(line);
    // Reference-style link defs: `[label]: url "title"` — typical at top of NestJS/CI READMEs.
    const isRefDef = /^\[[^\]]+\]:\s*\S+/.test(line);

    if (isCodeFence) {
      const flushed = flush();
      if (flushed) return stripMarkdown(flushed);
      // Skip until matching fence
      continue;
    }

    if (isBlank) {
      const flushed = flush();
      if (flushed) return stripMarkdown(flushed);
      continue;
    }

    if (isHeading || isList || isQuote || isHtml || isBadge || isHr || isRefDef) {
      // Discard any partially-collected buffer; restart on next paragraph.
      buf = [];
      continue;
    }

    buf.push(line);
  }
  const flushed = flush();
  return flushed ? stripMarkdown(flushed) : null;
}

/**
 * Use a top H1 + the next non-empty content line as a tagline.
 * @param {string} md
 * @returns {string | null}
 */
export function extractH1Tagline(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let sawH1 = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!sawH1) {
      if (/^#\s+\S/.test(line)) sawH1 = true;
      continue;
    }
    if (line.length === 0) continue;
    if (/^#{1,6}\s/.test(line)) return null;
    if (/^([-*+]|\d+\.)\s/.test(line)) return null;
    if (/^<[^>]+>/.test(line)) continue;
    const cleaned = stripMarkdown(line);
    if (cleaned.length >= MIN_PARAGRAPH_LEN || cleaned.length > 0) {
      return cleaned;
    }
  }
  return null;
}

/**
 * Strip basic markdown decorations: links, emphasis, inline code, badges.
 * @param {string} text
 */
export function stripMarkdown(text) {
  return text
    // Image badges first so the alt text doesn't leak.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // Link [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Bare HTML tags
    .replace(/<[^>]+>/g, "")
    // Bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    // Inline code
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trim, dedupe whitespace, cap at MAX_DESC_LEN, and ensure trailing punctuation.
 * @param {string} text
 */
export function finalize(text) {
  let out = text.replace(/\s+/g, " ").trim();
  if (out.length > MAX_DESC_LEN) {
    out = out.slice(0, MAX_DESC_LEN).trimEnd();
    // Avoid leaving a half-broken word before adding punctuation.
    out = out.replace(/[\s,;:\-]+$/, "");
  }
  if (!/[.!?]$/.test(out)) {
    if (out.length >= MAX_DESC_LEN) {
      // Make room for the period.
      out = out.slice(0, MAX_DESC_LEN - 1).trimEnd().replace(/[\s,;:\-]+$/, "");
    }
    out += ".";
  }
  return out;
}

/**
 * Fallback description generated from name + language only.
 * @param {string} name
 * @param {string | null | undefined} language
 */
export function templated(name, language) {
  const pretty = humanizeName(name);
  const lang = (language || "").toLowerCase();
  switch (lang) {
    case "javascript":
      return `A small project for practicing ${pretty} in JavaScript`;
    case "typescript":
      return `A small project for practicing ${pretty} in TypeScript`;
    case "java":
      return `A small project for practicing ${pretty} in Java`;
    case "kotlin":
      return `A small project for practicing ${pretty} in Kotlin`;
    case "python":
      return `A small project for practicing ${pretty} in Python`;
    case "c#":
      return `A small project for practicing ${pretty} in C#`;
    case "c++":
      return `A small project for practicing ${pretty} in C++`;
    case "c":
      return `A small project for practicing ${pretty} in C`;
    case "go":
      return `A small project for practicing ${pretty} in Go`;
    case "rust":
      return `A small project for practicing ${pretty} in Rust`;
    case "php":
      return `A small project for practicing ${pretty} in PHP`;
    case "ruby":
      return `A small project for practicing ${pretty} in Ruby`;
    case "html":
      return `A small static site exploring ${pretty} with HTML`;
    case "css":
      return `A small project exploring ${pretty} with CSS`;
    case "shell":
      return `A small shell scripting project around ${pretty}`;
    case "dockerfile":
      return `A small containerization exercise around ${pretty}`;
    case "":
    case null:
    case undefined:
      return `A small project exploring ${pretty}`;
    default:
      return `A small project for practicing ${pretty} in ${language}`;
  }
}

/**
 * Convert a slug-like repo name into a readable phrase.
 * @param {string} name
 */
export function humanizeName(name) {
  return name
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/**
 * Parse process argv into a typed options object.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const opts = { apply: false, user: DEFAULT_USER, limit: Number.POSITIVE_INFINITY };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") opts.apply = true;
    else if (a === "--user") opts.user = argv[++i];
    else if (a === "--limit") {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (a === "-h" || a === "--help") {
      opts.help = true;
    }
  }
  return opts;
}

const HELP = `Usage:
  node scripts/sync-gh-descriptions.mjs [--apply] [--user EduardF1] [--limit N]

Without --apply: dry-run. Lists every repo without a description with the
proposed description. Exits 0.

With --apply: same listing PLUS calls PATCH on each repo to set the
description. Prints OK / FAILED per repo. Exits non-zero if any repo fails.
`;

function getToken() {
  if (process.env.GH_TOKEN && process.env.GH_TOKEN.trim().length > 0) {
    return process.env.GH_TOKEN.trim();
  }
  try {
    const out = execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} url
 * @param {{ token?: string | null, method?: string, body?: unknown }} [init]
 */
async function gh(url, init = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sync-gh-descriptions-script",
  };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  /** @type {RequestInit} */
  const reqInit = { method: init.method || "GET", headers };
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    reqInit.body = JSON.stringify(init.body);
  }
  const res = await fetch(url, reqInit);
  return res;
}

/**
 * Fetch every owned repo for the user (paginated).
 * @param {string} user
 * @param {string | null} token
 */
async function listAllRepos(user, token) {
  /** @type {any[]} */
  const all = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&type=owner&page=${page}`;
    const res = await gh(url, { token });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GET ${url} failed (${res.status}): ${body}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

/**
 * Fetch the README content as plain UTF-8, or null if missing/empty.
 * @param {string} user
 * @param {string} repo
 * @param {string | null} token
 */
async function fetchReadme(user, repo, token) {
  const url = `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/readme`;
  const res = await gh(url, { token });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${url} failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  if (!data || typeof data.content !== "string") return null;
  try {
    const decoded = Buffer.from(data.content, data.encoding || "base64").toString("utf8");
    return decoded;
  } catch {
    return null;
  }
}

/**
 * @param {string} user
 * @param {string} repo
 * @param {string} description
 * @param {string} token
 */
async function patchDescription(user, repo, description, token) {
  const url = `https://api.github.com/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}`;
  const res = await gh(url, { token, method: "PATCH", body: { description } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${url} failed (${res.status}): ${body}`);
  }
  return true;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const token = getToken();
  if (opts.apply && !token) {
    console.error("ERROR: --apply requires a GitHub token. Run `gh auth login` or set GH_TOKEN.");
    return 2;
  }
  if (!token) {
    console.warn("WARN: no token available. Running unauthenticated (60 req/hr cap). --apply will fail without a token.");
  }

  let repos;
  try {
    repos = await listAllRepos(opts.user, token);
  } catch (err) {
    console.error(`ERROR: failed to list repos: ${(err && err.message) || err}`);
    return 1;
  }

  const candidates = repos.filter(
    (r) => r && r.fork === false && r.archived === false && (!r.description || String(r.description).trim() === ""),
  );
  const skipped = repos.filter((r) => r && r.fork === false && r.archived === false && r.description && String(r.description).trim() !== "");

  for (const r of skipped) {
    console.log(`[skipped] ${r.name}   (already has description: "${r.description}")`);
  }

  let processed = 0;
  let failures = 0;
  for (const r of candidates) {
    if (processed >= opts.limit) break;
    processed++;

    let readmeText = null;
    try {
      readmeText = await fetchReadme(opts.user, r.name, token);
    } catch (err) {
      console.warn(`[warn] ${r.name}: README fetch failed (${(err && err.message) || err}); falling back.`);
    }

    const { description, source } = proposeDescription({
      name: r.name,
      language: r.language,
      readmeText,
    });

    const tag = source === "from-readme" ? "[from-readme]" : source === "no-readme" ? "[no-readme]" : "[templated]";
    let line = `${tag} ${r.name}  -> "${description}"`;

    if (opts.apply) {
      try {
        await patchDescription(opts.user, r.name, description, /** @type {string} */ (token));
        line += "  -> OK";
      } catch (err) {
        failures++;
        line += `  -> FAILED ${(err && err.message) || err}`;
      }
    }
    console.log(line);
  }

  console.log(`\nProcessed ${processed} of ${candidates.length} repo(s) without descriptions (skipped ${skipped.length} with existing descriptions).`);
  if (opts.apply && failures > 0) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  main().then(
    (code) => process.exit(code ?? 0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
