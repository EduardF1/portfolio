/**
 * scripts/build-cv-pdf.mjs
 * ─────────────────────────────────────────────────────────────────
 * Generate the printed CV (one PDF per locale) from the same data
 * that drives the home page experience timeline and the case-study
 * pages. Run via `npm run build:cv`.
 *
 *   Inputs:
 *     - src/lib/experience.ts        — ROLES (single source of truth)
 *     - content/work/*.mdx           — case-study frontmatter
 *     - messages/{en,da}.json        — locale-aware section labels
 *
 *   Outputs:
 *     - public/cv/eduard-fischer-en.pdf
 *     - public/cv/eduard-fischer-da.pdf
 *
 * Single-page resume layout:
 *   ┌────────────────────────────────────────────────────┐
 *   │ Eduard Fischer-Szava            Aarhus, Denmark    │
 *   │ Software Engineer · IT Consultant   eduardfischer.dev │
 *   ├──────────────────┬─────────────────────────────────┤
 *   │ EXPERIENCE       │  SKILLS                         │
 *   │  Mjølner ...     │  Backend · Frontend · Mobile    │
 *   │  Netcompany ...  │                                 │
 *   │  Greenbyte ...   │  SELECTED CASE STUDIES          │
 *   │  Boozt ...       │   KOMBIT VALG ...               │
 *   │  Systematic ...  │   SitaWare Frontline ...        │
 *   ├──────────────────┴─────────────────────────────────┤
 *   │      eduardfischer.dev — full version online       │
 *   └────────────────────────────────────────────────────┘
 *
 * Palette: cocoa + amber/terracotta. These hex values mirror the
 * site's `schwarzgelb` / `woodsy-cabin` warm tones — the PDF should
 * read as the same "calm warm earth" identity even printed on
 * black-and-white office paper.
 *
 * Fonts: Geist (sans) + Instrument Serif (display). Loaded via
 * Google Fonts URLs by `@react-pdf/renderer`'s Font.register().
 *
 * The script is plain `.mjs` so it can run under Node without a
 * TypeScript build step. It consumes `src/lib/experience.ts` by
 * transpiling it through the existing `typescript` dep at runtime.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import matter from "gray-matter";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ─── Palette ─────────────────────────────────────────────────────
// Cocoa + amber/terracotta — matches the site's warm-earth identity.
const COLORS = {
  background: "#FAF6EE",
  surface: "#F1E8D5",
  border: "#D9CDB3",
  foreground: "#2A1F17", // cocoa
  foregroundMuted: "#5C4A3A",
  foregroundSubtle: "#8A7563",
  accent: "#B85C3A", // terracotta
  accentSoft: "#E5C58A", // amber
  link: "#9A4A2D",
};

// ─── Fonts ───────────────────────────────────────────────────────
// `@react-pdf/renderer` v4 needs a TTF/OTF URL — we point at the
// Google Fonts CDN which serves direct font files. Network access is
// required at build time.
// URLs resolved via the Google Fonts CSS API at the time of authoring;
// pinned (with version path segments) so the build is deterministic
// even if Google rotates the URLs. If a URL ever 404s, fetch fresh
// values from `https://fonts.googleapis.com/css2?family=Geist...`.
Font.register({
  family: "Geist",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4nQ.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4nQ.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RQuQ4nQ.ttf",
      fontWeight: 600,
    },
  ],
});

Font.register({
  family: "InstrumentSerif",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-2zI.ttf",
      fontWeight: 400,
    },
  ],
});

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    color: COLORS.foreground,
    fontFamily: "Geist",
    fontSize: 9,
    lineHeight: 1.4,
    padding: 32,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "column" },
  headerName: {
    fontFamily: "InstrumentSerif",
    fontSize: 26,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  headerRole: {
    fontSize: 10,
    color: COLORS.foregroundMuted,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: 8.5,
  },
  headerContact: {
    color: COLORS.foregroundMuted,
    marginBottom: 1,
  },
  headerLink: { color: COLORS.link, textDecoration: "none" },

  // Body — 2 columns
  body: {
    flexDirection: "row",
    flexGrow: 1,
    columnGap: 20,
  },
  colLeft: { width: "60%" },
  colRight: { width: "40%" },

  // Section
  sectionKicker: {
    fontFamily: "Geist",
    fontWeight: 600,
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: COLORS.accent,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  // Experience role card
  role: {
    marginBottom: 9,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: COLORS.accentSoft,
    borderLeftStyle: "solid",
  },
  roleHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  roleTitle: {
    fontWeight: 600,
    fontSize: 10,
    color: COLORS.foreground,
    flex: 1,
    paddingRight: 6,
  },
  rolePeriod: {
    fontSize: 7.5,
    color: COLORS.foregroundSubtle,
    fontFamily: "Geist",
  },
  roleCompany: {
    fontSize: 8.5,
    color: COLORS.foregroundMuted,
    marginBottom: 2,
  },
  roleSummary: {
    fontSize: 8.5,
    color: COLORS.foregroundMuted,
    lineHeight: 1.45,
  },
  roleTech: {
    fontSize: 7,
    color: COLORS.foregroundSubtle,
    marginTop: 2,
    fontFamily: "Geist",
  },

  // Skills
  skillCategory: {
    marginBottom: 6,
  },
  skillCategoryName: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  skillList: {
    fontSize: 8,
    color: COLORS.foregroundMuted,
    lineHeight: 1.4,
  },

  // Case studies (right column)
  caseStudy: {
    marginBottom: 7,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  caseTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.foreground,
    marginBottom: 1,
  },
  caseKicker: {
    fontSize: 7.5,
    color: COLORS.foregroundSubtle,
    fontFamily: "Geist",
    marginBottom: 2,
  },
  caseSummary: {
    fontSize: 8,
    color: COLORS.foregroundMuted,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COLORS.foregroundSubtle,
  },
  footerLink: { color: COLORS.link, textDecoration: "none" },
});

// ─── Helpers ─────────────────────────────────────────────────────

const e = React.createElement;

/**
 * Read messages/<locale>.json and return the parsed object.
 */
function readMessages(locale) {
  const file = path.join(ROOT, "messages", `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Read all `content/work/*.mdx` and return their frontmatter, sorted
 * newest-first by `date` (ISO string).
 */
function readCaseStudies() {
  const dir = path.join(ROOT, "content", "work");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const studies = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const fm = matter(raw).data;
    return {
      slug: fm.slug ?? f.replace(/\.mdx$/, ""),
      title: fm.title ?? "",
      company: fm.company ?? "",
      role: fm.role ?? "",
      period: fm.period ?? "",
      location: fm.location ?? "",
      summary: fm.summary ?? "",
      tech: Array.isArray(fm.tech) ? fm.tech : [],
      date: fm.date ?? "1970-01-01",
    };
  });
  studies.sort((a, b) => (a.date < b.date ? 1 : -1));
  return studies;
}

/**
 * Read `src/lib/experience.ts`, transpile to JS, load it via a data
 * URL import, and return its named exports.
 */
async function readExperience() {
  const tsFile = path.join(ROOT, "src", "lib", "experience.ts");
  const source = fs.readFileSync(tsFile, "utf8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  // Write to a temp file and import — data: URLs can't resolve relative
  // module specifiers, but our experience.ts has none, so this works.
  const tmpDir = path.join(ROOT, ".cache");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `experience-${Date.now()}.mjs`);
  fs.writeFileSync(tmpFile, out.outputText);
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return { ROLES: mod.ROLES, tokenizeSummary: mod.tokenizeSummary };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Read `src/lib/tech.ts` and return a `findTech(slug) → { name, category }`
 * function. Uses the same TS-transpile-and-import dance as the
 * experience module.
 */
async function readTech() {
  const tsFile = path.join(ROOT, "src", "lib", "tech.ts");
  const source = fs.readFileSync(tsFile, "utf8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const tmpDir = path.join(ROOT, ".cache");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `tech-${Date.now()}.mjs`);
  fs.writeFileSync(tmpFile, out.outputText);
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return { findTech: mod.findTech, techsByCategory: mod.techsByCategory };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

// ─── Components ──────────────────────────────────────────────────

function Header({ locale, messages }) {
  const m = messages;
  // Localised role line — pulled from the home hero for consistency.
  const roleLine =
    locale === "da"
      ? "Softwareingeniør · IT-konsulent"
      : "Software Engineer · IT Consultant";
  const contact = locale === "da" ? "Aarhus, Danmark" : "Aarhus, Denmark";
  return e(
    View,
    { style: styles.header },
    e(
      View,
      { style: styles.headerLeft },
      e(Text, { style: styles.headerName }, "Eduard Fischer-Szava"),
      e(Text, { style: styles.headerRole }, roleLine),
    ),
    e(
      View,
      { style: styles.headerRight },
      e(Text, { style: styles.headerContact }, contact),
      e(
        Link,
        { src: "https://eduardfischer.dev", style: styles.headerLink },
        "eduardfischer.dev",
      ),
      e(
        Link,
        { src: "https://www.linkedin.com/in/eduard-fischer-szava/", style: styles.headerLink },
        "linkedin.com/in/eduard-fischer-szava",
      ),
      e(
        Link,
        {
          src: "mailto:fischer_eduard@yahoo.com",
          style: styles.headerLink,
        },
        "fischer_eduard@yahoo.com",
      ),
      // Suppress unused-var lint: messages reserved for future header copy.
      m && null,
    ),
  );
}

function Experience({ locale, messages, roles, findTech }) {
  const kicker =
    messages?.home?.experienceKicker ??
    (locale === "da" ? "Erfaring" : "Experience");
  return e(
    View,
    { style: { marginBottom: 6 } },
    e(Text, { style: styles.sectionKicker }, kicker),
    ...roles.map((r) => {
      const techNames = r.tech
        .map((slug) => findTech(slug)?.name)
        .filter(Boolean)
        .slice(0, 8);
      return e(
        View,
        { style: styles.role, key: r.company, wrap: false },
        e(
          View,
          { style: styles.roleHead },
          e(Text, { style: styles.roleTitle }, r.role),
          e(Text, { style: styles.rolePeriod }, r.period),
        ),
        e(
          Text,
          { style: styles.roleCompany },
          `${r.company} · ${r.location}`,
        ),
        e(Text, { style: styles.roleSummary }, r.summary),
        techNames.length > 0
          ? e(Text, { style: styles.roleTech }, techNames.join(" · "))
          : null,
      );
    }),
  );
}

function Skills({ locale, messages, techsByCategory }) {
  const groups = techsByCategory();
  const categoryOrder = ["backend", "frontend", "mobile", "data", "testing", "ops"];
  const labels = messages?.skills?.categories ?? {};
  const fallbackLabels = {
    backend: locale === "da" ? "Backend" : "Backend",
    frontend: locale === "da" ? "Frontend" : "Frontend",
    mobile: locale === "da" ? "Mobil" : "Mobile",
    data: locale === "da" ? "Data" : "Data",
    testing: locale === "da" ? "Kvalitet" : "Quality",
    ops: locale === "da" ? "Drift" : "Operations",
  };
  const kicker =
    messages?.skills?.kicker ?? (locale === "da" ? "Arbejder med" : "Working with");
  return e(
    View,
    { style: { marginBottom: 10 } },
    e(Text, { style: styles.sectionKicker }, kicker),
    ...categoryOrder.map((cat) => {
      const techs = groups[cat] ?? [];
      if (techs.length === 0) return null;
      // Cap to the most representative — 8 per category — to keep
      // the column compact on a 1-page layout.
      const names = techs.slice(0, 8).map((t) => t.name).join(", ");
      return e(
        View,
        { style: styles.skillCategory, key: cat, wrap: false },
        e(Text, { style: styles.skillCategoryName }, labels[cat] ?? fallbackLabels[cat]),
        e(Text, { style: styles.skillList }, names),
      );
    }),
  );
}

function CaseStudies({ locale, messages, studies }) {
  const kicker =
    messages?.home?.selectedKicker ??
    (locale === "da" ? "Udvalgt arbejde" : "Selected work");
  // Top 4 — the same case studies surfaced in the home Featured grid.
  const top = studies.slice(0, 4);
  return e(
    View,
    { style: { marginBottom: 6 } },
    e(Text, { style: styles.sectionKicker }, kicker),
    ...top.map((s) =>
      e(
        View,
        { style: styles.caseStudy, key: s.slug, wrap: false },
        e(Text, { style: styles.caseTitle }, s.title),
        e(Text, { style: styles.caseKicker }, `${s.company} · ${s.period}`),
        e(Text, { style: styles.caseSummary }, s.summary),
      ),
    ),
  );
}

function Footer({ locale }) {
  const left =
    locale === "da"
      ? "Hele CV'et og udvalgt arbejde online:"
      : "Full CV and selected work online:";
  const right = locale === "da" ? "Genereret fra MDX" : "Generated from MDX";
  return e(
    View,
    { style: styles.footer },
    e(
      View,
      { style: { flexDirection: "row" } },
      e(Text, null, `${left} `),
      e(
        Link,
        { src: "https://eduardfischer.dev", style: styles.footerLink },
        "eduardfischer.dev",
      ),
    ),
    e(Text, null, right),
  );
}

function Resume({ locale, messages, roles, studies, findTech, techsByCategory }) {
  return e(
    Document,
    null,
    e(
      Page,
      { size: "A4", style: styles.page },
      e(Header, { locale, messages }),
      e(
        View,
        { style: styles.body },
        e(
          View,
          { style: styles.colLeft },
          e(Experience, { locale, messages, roles, findTech }),
        ),
        e(
          View,
          { style: styles.colRight },
          e(Skills, { locale, messages, techsByCategory }),
          e(CaseStudies, { locale, messages, studies }),
        ),
      ),
      e(Footer, { locale }),
    ),
  );
}

// ─── Build & write ───────────────────────────────────────────────

/**
 * Drain a Node ReadableStream to a single Buffer. `@react-pdf/renderer`
 * v4 returns a stream from `pdf().toBuffer()`, so we collect chunks
 * before writing the file.
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function buildOne(locale, ctx, outDir) {
  const messages = readMessages(locale);
  const tree = e(Resume, {
    locale,
    messages,
    roles: ctx.roles,
    studies: ctx.studies,
    findTech: ctx.findTech,
    techsByCategory: ctx.techsByCategory,
  });
  const stream = await pdf(tree).toBuffer();
  const buffer = await streamToBuffer(stream);
  const outFile = path.join(outDir, `eduard-fischer-${locale}.pdf`);
  fs.writeFileSync(outFile, buffer);
  return { locale, outFile, size: buffer.length };
}

/**
 * Public API — also used by the smoke test.
 *
 * @param {object} [opts]
 * @param {string} [opts.outDir] - override the output directory.
 * @returns {Promise<Array<{locale: string, outFile: string, size: number}>>}
 */
export async function buildCv(opts = {}) {
  const outDir = opts.outDir ?? path.join(ROOT, "public", "cv");
  fs.mkdirSync(outDir, { recursive: true });

  const { ROLES } = await readExperience();
  const { findTech, techsByCategory } = await readTech();
  const studies = readCaseStudies();

  const ctx = { roles: ROLES, studies, findTech, techsByCategory };
  const en = await buildOne("en", ctx, outDir);
  const da = await buildOne("da", ctx, outDir);
  return [en, da];
}

// CLI entrypoint — only when invoked directly (not when imported by a
// smoke test).
const isMain =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  buildCv()
    .then((results) => {
      for (const r of results) {
        const kb = (r.size / 1024).toFixed(1);
        console.log(`✓ ${r.locale.toUpperCase()}  ${r.outFile}  (${kb} KB)`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("CV build failed:", err);
      process.exit(1);
    });
}
