/**
 * Single source of truth for the experience timeline rendered on the home
 * page (`src/app/[locale]/page.tsx`) AND for the printed CV produced by
 * `scripts/build-cv-pdf.mjs`.
 *
 * Why a plain-data file (no JSX): the build-cv-pdf script runs under Node
 * (not Next.js) and consumes this module via dynamic import after a
 * small `tsx`-free reader. Keeping the data JSX-free means a `.mjs`
 * Node script can read it without a TypeScript compile step (the script
 * uses a tiny TS-comment stripper — see scripts/build-cv-pdf.mjs).
 *
 * Rich rendering on the home page is layered on top via
 * `tokenizeSummary()` below — it splits the plain summary on the
 * registered link labels and the page wraps each match in an <a>.
 */

/**
 * One inline product/company link inside a role summary. The label is
 * the verbatim text that appears in the `summary` string; the page
 * uses it to find and wrap the substring.
 */
export type RoleLink = {
  label: string;
  href: string;
};

export type Role = {
  /** Display name of the company. */
  company: string;
  /** Company website (external link from the company name in the timeline). */
  url: string;
  /** Job title at the company. */
  role: string;
  /** Free-form period string (matches site copy: "Apr 2026 – Present"). */
  period: string;
  /** "City, Country" — rendered next to the company name. */
  location: string;
  /**
   * Plain text role summary. Words/phrases that should render as links
   * on the home page must appear verbatim and also be listed in `links`.
   */
  summary: string;
  /** Optional inline links — wrapped on the home page, plain text in the PDF. */
  links?: RoleLink[];
  /** Tech slugs — looked up via `findTech()` for chips and PDF mentions. */
  tech: string[];
};

/**
 * Roles in reverse-chronological order — most recent first. Order here
 * is the rendered order on the home page and in the PDF.
 */
export const ROLES: readonly Role[] = [
  {
    company: "Mjølner Informatics",
    url: "https://mjolner.dk/en/",
    role: "Frontend Engineer / Consultant",
    period: "Apr 2026 – Present",
    location: "Aarhus, Denmark",
    summary:
      "Frontend engineering on business-critical software for Danish enterprise and public-sector clients, with backend work alongside as the brief calls for it.",
    tech: ["typescript", "react", "angular", "csharp", "dotnet"],
  },
  {
    company: "Netcompany",
    url: "https://www.netcompany.com/",
    role: "IT Consultant",
    period: "Oct 2024 – Feb 2026",
    location: "Aarhus, Denmark",
    summary:
      "KOMBIT VALG, Denmark's administrative election platform. Full-stack C#/.NET + Angular. Jun–Sep 2025 stint at STIL on UA.dk EUD III, building a reusable UI component catalog on JBoss + TypeScript + jQuery.",
    links: [
      { label: "KOMBIT VALG", href: "https://kombit.dk/valg" },
      { label: "STIL", href: "https://www.stil.dk/" },
      { label: "UA.dk", href: "https://uddannelsesadministration.dk/forside.aspx" },
    ],
    tech: [
      "csharp",
      "dotnet",
      "aspnet",
      "ef-core",
      "angular",
      "mssql",
      "azure-devops",
      "jboss",
      "typescript",
      "jquery",
    ],
  },
  {
    company: "Greenbyte",
    url: "https://www.greenbyte.dk/",
    role: "Software Engineer",
    period: "Nov 2021 – Sep 2024",
    location: "Horsens, Denmark",
    summary:
      "Renewable-energy SaaS, Kalenda, part of Greenbyte's renewable-energy SaaS suite. .NET Core + EF Core + React on the platform side; architect and lead developer of the mobile companion app.",
    links: [
      { label: "Kalenda", href: "https://www.greenbyte.dk/produkter/kalenda/" },
    ],
    tech: ["dotnet", "react", "flutter", "dart"],
  },
  {
    company: "Boozt Fashion",
    url: "https://www.booztgroup.com/",
    role: "System Engineer",
    period: "Oct 2021 – May 2022",
    location: "Malmö, Sweden",
    summary:
      "Large-scale e-commerce backend on boozt.com in PHP/Symfony. Introduced Kanban; quality and test automation focus.",
    links: [{ label: "boozt.com", href: "https://www.boozt.com/" }],
    tech: ["php", "symfony", "doctrine", "mysql", "behat", "mockery", "guzzle", "phpunit"],
  },
  {
    company: "Systematic",
    url: "https://systematic.com/",
    role: "Junior Systems Engineer",
    period: "Feb 2021 – Jun 2021",
    location: "Aarhus, Denmark",
    summary:
      "Mission-critical SitaWare suite (Frontline, Edge). Java + Angular. NATO interoperability.",
    links: [
      {
        label: "SitaWare",
        href: "https://systematic.com/en-gb/industries/defence/products/sitaware-suite/",
      },
      {
        label: "Frontline",
        href: "https://systematic.com/en-gb/industries/defence/products/sitaware-suite/sitaware-frontline/",
      },
      {
        label: "Edge",
        href: "https://systematic.com/en-gb/industries/defence/products/sitaware-suite/sitaware-edge/",
      },
    ],
    tech: ["java", "angular", "junit", "karma", "jasmine", "robot-framework"],
  },
] as const;

/**
 * One token in a tokenised summary — either a plain text run or an
 * inline link. The home page renders these as text/<a> alternately;
 * the PDF builder flattens to plain text.
 */
export type SummaryToken =
  | { kind: "text"; value: string }
  | { kind: "link"; value: string; href: string };

/**
 * Split a role summary into plain-text and link tokens, in order, so
 * each link in `links` is wrapped where it appears in the summary.
 *
 * Greedy left-to-right scan: at each position we look for the longest
 * matching link label that starts there; if none, we keep accumulating
 * plain text until the next match. Labels that do not appear in the
 * summary are silently skipped (defensive — caller is the source of
 * truth for label spelling).
 */
export function tokenizeSummary(role: Role): SummaryToken[] {
  const links = role.links ?? [];
  if (links.length === 0) {
    return [{ kind: "text", value: role.summary }];
  }
  // Sort labels by length desc so "KOMBIT VALG" beats "VALG" if ever
  // both appeared as labels — defensive against future entries.
  const sorted = [...links].sort((a, b) => b.label.length - a.label.length);
  const tokens: SummaryToken[] = [];
  const text = role.summary;
  let i = 0;
  let buf = "";
  while (i < text.length) {
    let hit: RoleLink | null = null;
    for (const link of sorted) {
      if (text.startsWith(link.label, i)) {
        hit = link;
        break;
      }
    }
    if (hit) {
      if (buf.length > 0) {
        tokens.push({ kind: "text", value: buf });
        buf = "";
      }
      tokens.push({ kind: "link", value: hit.label, href: hit.href });
      i += hit.label.length;
    } else {
      buf += text[i];
      i += 1;
    }
  }
  if (buf.length > 0) {
    tokens.push({ kind: "text", value: buf });
  }
  return tokens;
}
