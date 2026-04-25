export type Tech = {
  /** kebab-case identifier used in URLs and as the canonical lookup key. */
  slug: string;
  /** Human-readable display name shown on chips and headings. */
  name: string;
  /** Coarse grouping used by `techsByCategory()` for rendered indexes. */
  category: "backend" | "frontend" | "mobile" | "data" | "testing" | "ops";
  /** Official documentation URL — rendered as an external "Official docs" link. */
  docsUrl: string;
  /** 1–2 sentence, framework-agnostic description of what the tool IS. */
  description: string;
  /**
   * Devicon icon name (e.g. "react", "dotnetcore"). Logos render via:
   *   https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<icon>/<icon>-original.svg
   * If devicon doesn't have a clean variant, set null and the consumer falls
   * back to text.
   */
  icon: string | null;
  /**
   * GitHub language label this tech maps to (must match GitHub's "language"
   * field on a repo for filter wiring). null means the tech doesn't map to a
   * single GitHub language (e.g. databases, docs-style frameworks).
   */
  ghLanguage: string | null;
  /** Optional alternate spellings the chip text or query might match. */
  aliases?: string[];
};

/**
 * Single source of truth for technology chips, glossary entries, and the
 * GitHub-feed pre-filter. Order within a category controls display order.
 *
 * Notes on ghLanguage choices:
 *  - Razor / Blazor / .NET / Spring / Symfony all live inside a host language
 *    (C#, Java, PHP). We map them to that host so the GitHub feed pre-filters
 *    to the language repos the user would actually expect to see.
 *  - For databases and tools where GitHub doesn't tag a clean language
 *    (MongoDB, Neo4j, Git, Jenkins), ghLanguage is null and the feed simply
 *    won't pre-filter — only the glossary entry shows.
 */
export const TECHS: readonly Tech[] = [
  // ──────────── Backend ────────────
  {
    slug: "csharp",
    name: "C#",
    category: "backend",
    docsUrl: "https://learn.microsoft.com/en-us/dotnet/csharp/",
    description:
      "C# is a statically-typed, object-oriented language designed by Microsoft. It is the primary language of the .NET platform and is widely used for backend services, desktop apps, and enterprise systems.",
    icon: "csharp",
    ghLanguage: "C#",
    aliases: ["c#", "c-sharp"],
  },
  {
    slug: "dotnet",
    name: ".NET",
    category: "backend",
    docsUrl: "https://learn.microsoft.com/en-us/dotnet/",
    description:
      ".NET is a cross-platform runtime and standard library from Microsoft for building backend services, web APIs, desktop, and mobile apps. It hosts languages such as C#, F#, and VB and powers ASP.NET Core for the web.",
    icon: "dotnetcore",
    ghLanguage: "C#",
    aliases: [".net", "dotnet core", ".net core", "net"],
  },
  {
    slug: "java",
    name: "Java",
    category: "backend",
    docsUrl: "https://docs.oracle.com/en/java/",
    description:
      "Java is a statically-typed, object-oriented language that runs on the JVM. It is a long-standing default for enterprise backends, mission-critical systems, and Android tooling thanks to its mature ecosystem and strong portability.",
    icon: "java",
    ghLanguage: "Java",
  },
  {
    slug: "spring",
    name: "Spring",
    category: "backend",
    docsUrl: "https://spring.io/projects/spring-framework",
    description:
      "Spring is the dominant application framework for the Java ecosystem, providing dependency injection, web (MVC/WebFlux), data access, and security building blocks. Spring Boot adds opinionated auto-configuration for production-ready services.",
    icon: "spring",
    ghLanguage: "Java",
    aliases: ["spring boot", "spring-boot", "springboot"],
  },
  {
    slug: "php",
    name: "PHP",
    category: "backend",
    docsUrl: "https://www.php.net/docs.php",
    description:
      "PHP is a server-side scripting language built for the web. It powers a large share of the public internet and is the language behind frameworks such as Symfony, Laravel, and platforms like WordPress.",
    icon: "php",
    ghLanguage: "PHP",
  },
  {
    slug: "symfony",
    name: "Symfony",
    category: "backend",
    docsUrl: "https://symfony.com/doc/current/index.html",
    description:
      "Symfony is a mature PHP framework built from reusable, decoupled components. It targets large, long-lived applications and is the foundation under many other PHP tools — including parts of Laravel and Drupal.",
    icon: "symfony",
    ghLanguage: "PHP",
  },

  // ──────────── Frontend ────────────
  {
    slug: "angular",
    name: "Angular",
    category: "frontend",
    docsUrl: "https://angular.dev/",
    description:
      "Angular is Google's batteries-included frontend framework written in TypeScript. It bundles routing, forms, HTTP, and dependency injection into a single opinionated platform suited to large enterprise SPAs.",
    icon: "angular",
    ghLanguage: "TypeScript",
    aliases: ["angular2", "angularjs"],
  },
  {
    slug: "typescript",
    name: "TypeScript",
    category: "frontend",
    docsUrl: "https://www.typescriptlang.org/docs/",
    description:
      "TypeScript is a statically-typed superset of JavaScript that compiles to plain JS. It adds an optional type system on top of JavaScript so teams can ship safer code at scale without leaving the JS ecosystem.",
    icon: "typescript",
    ghLanguage: "TypeScript",
    aliases: ["ts"],
  },
  {
    slug: "react",
    name: "React",
    category: "frontend",
    docsUrl: "https://react.dev/",
    description:
      "React is a JavaScript library from Meta for building component-based user interfaces. It pioneered the declarative, virtual-DOM rendering model and underpins frameworks such as Next.js and Remix.",
    icon: "react",
    ghLanguage: "TypeScript",
    aliases: ["reactjs", "react.js"],
  },
  {
    slug: "vue",
    name: "Vue.js",
    category: "frontend",
    docsUrl: "https://vuejs.org/guide/introduction.html",
    description:
      "Vue is a progressive JavaScript framework for building user interfaces, designed to be incrementally adoptable. Its reactive single-file components offer a middle ground between React's flexibility and Angular's structure.",
    icon: "vuejs",
    ghLanguage: null,
    aliases: ["vuejs", "vue.js"],
  },
  {
    slug: "jquery",
    name: "jQuery",
    category: "frontend",
    docsUrl: "https://api.jquery.com/",
    description:
      "jQuery is a small JavaScript library that simplified DOM manipulation, AJAX, and event handling across browsers. Largely superseded by modern frameworks, it still ships in countless legacy and enterprise codebases.",
    icon: "jquery",
    ghLanguage: "JavaScript",
  },
  {
    slug: "razor",
    name: "Razor",
    category: "frontend",
    docsUrl: "https://learn.microsoft.com/en-us/aspnet/core/mvc/views/razor",
    description:
      "Razor is the server-side templating syntax used by ASP.NET Core to generate HTML by mixing C# with markup. It powers Razor Pages, MVC views, and Blazor components.",
    icon: "dot-net",
    ghLanguage: "C#",
  },
  {
    slug: "blazor",
    name: "Blazor",
    category: "frontend",
    docsUrl: "https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor",
    description:
      "Blazor is a .NET UI framework for building interactive web apps using C# and Razor instead of JavaScript. It runs either in the browser via WebAssembly or on the server with SignalR.",
    icon: "dot-net",
    ghLanguage: "C#",
  },

  // ──────────── Mobile ────────────
  {
    slug: "flutter",
    name: "Flutter",
    category: "mobile",
    docsUrl: "https://docs.flutter.dev/",
    description:
      "Flutter is Google's UI toolkit for building natively-compiled apps for mobile, web, and desktop from a single Dart codebase. It renders its own widgets via Skia/Impeller for a consistent look across platforms.",
    icon: "flutter",
    ghLanguage: "Dart",
  },
  {
    slug: "dart",
    name: "Dart",
    category: "mobile",
    docsUrl: "https://dart.dev/guides",
    description:
      "Dart is a client-optimized, statically-typed language by Google. It compiles to native code or JavaScript and is the language behind Flutter.",
    icon: "dart",
    ghLanguage: "Dart",
  },

  // ──────────── Data ────────────
  {
    slug: "mssql",
    name: "MS SQL",
    category: "data",
    docsUrl: "https://learn.microsoft.com/en-us/sql/sql-server/",
    description:
      "Microsoft SQL Server is an enterprise relational database engine using T-SQL. It is widely used in .NET stacks and offers tight integration with Azure, SSIS, and SSRS for analytics and reporting.",
    icon: "microsoftsqlserver",
    ghLanguage: "TSQL",
    aliases: ["sql server", "mssql server", "sqlserver"],
  },
  {
    slug: "postgresql",
    name: "PostgreSQL",
    category: "data",
    docsUrl: "https://www.postgresql.org/docs/",
    description:
      "PostgreSQL is an open-source, standards-compliant relational database known for correctness, extensibility, and rich SQL support including JSONB, full-text search, and window functions.",
    icon: "postgresql",
    ghLanguage: null,
    aliases: ["postgres"],
  },
  {
    slug: "mysql",
    name: "MySQL",
    category: "data",
    docsUrl: "https://dev.mysql.com/doc/",
    description:
      "MySQL is a widely-deployed open-source relational database, popular in LAMP-stack web applications. It pairs strong read performance with mature replication and a familiar SQL dialect.",
    icon: "mysql",
    ghLanguage: null,
  },
  {
    slug: "mongodb",
    name: "MongoDB",
    category: "data",
    docsUrl: "https://www.mongodb.com/docs/",
    description:
      "MongoDB is a document-oriented NoSQL database that stores data as flexible, JSON-like BSON documents. It targets workloads where the schema evolves quickly or doesn't fit a tabular shape.",
    icon: "mongodb",
    ghLanguage: null,
    aliases: ["mongo"],
  },
  {
    slug: "neo4j",
    name: "Neo4j",
    category: "data",
    docsUrl: "https://neo4j.com/docs/",
    description:
      "Neo4j is a native graph database that stores data as nodes and relationships and queries it with the Cypher language. It excels at deeply connected data such as social, fraud, and recommendation graphs.",
    icon: "neo4j",
    ghLanguage: null,
  },

  // ──────────── Testing ────────────
  {
    slug: "xunit",
    name: "xUnit",
    category: "testing",
    docsUrl: "https://xunit.net/",
    description:
      "xUnit.net is a free, open-source unit-testing framework for .NET, designed by the original NUnit author. It is the de-facto modern choice for C# projects and integrates cleanly with the dotnet CLI.",
    icon: null,
    ghLanguage: null,
    aliases: ["xunit.net"],
  },
  {
    slug: "playwright",
    name: "Playwright",
    category: "testing",
    docsUrl: "https://playwright.dev/docs/intro",
    description:
      "Playwright is an end-to-end browser automation framework from Microsoft that drives Chromium, Firefox, and WebKit through a single API. It is built for modern apps with auto-waiting, tracing, and parallel execution.",
    icon: "playwright",
    ghLanguage: "JavaScript",
  },
  {
    slug: "cypress",
    name: "Cypress",
    category: "testing",
    docsUrl: "https://docs.cypress.io/",
    description:
      "Cypress is a JavaScript end-to-end testing framework that runs tests in the same event loop as the app under test. Its time-travel debugger and rich tooling popularised approachable browser tests.",
    icon: "cypressio",
    ghLanguage: "JavaScript",
  },
  {
    slug: "robot-framework",
    name: "Robot Framework",
    category: "testing",
    docsUrl: "https://robotframework.org/",
    description:
      "Robot Framework is a generic, keyword-driven test automation framework with a human-readable, plain-text syntax. It is widely used for acceptance testing and RPA across web, API, and desktop targets.",
    icon: null,
    ghLanguage: null,
    aliases: ["robotframework", "robot"],
  },
  {
    slug: "junit",
    name: "JUnit",
    category: "testing",
    docsUrl: "https://junit.org/junit5/docs/current/user-guide/",
    description:
      "JUnit is the standard unit-testing framework for Java. The current JUnit 5 generation (Jupiter) brings extensions, parameterised tests, and a modern, modular runner to the JVM.",
    icon: "junit",
    ghLanguage: "Java",
  },
  {
    slug: "phpunit",
    name: "PHPUnit",
    category: "testing",
    docsUrl: "https://docs.phpunit.de/",
    description:
      "PHPUnit is the de-facto unit-testing framework for PHP, modelled after the xUnit family. It is the default test runner for Symfony, Laravel, and most modern PHP applications.",
    icon: null,
    ghLanguage: "PHP",
  },

  // ──────────── Ops ────────────
  {
    slug: "docker",
    name: "Docker",
    category: "ops",
    docsUrl: "https://docs.docker.com/",
    description:
      "Docker packages applications and their dependencies into portable container images that run identically across environments. It is the foundation of most modern container workflows and CI/CD pipelines.",
    icon: "docker",
    ghLanguage: "Dockerfile",
  },
  {
    slug: "git",
    name: "Git",
    category: "ops",
    docsUrl: "https://git-scm.com/doc",
    description:
      "Git is the distributed version-control system created by Linus Torvalds, now ubiquitous in software development. It tracks changes via content-addressable snapshots and underpins GitHub, GitLab, and Bitbucket.",
    icon: "git",
    ghLanguage: null,
  },
  {
    slug: "azure-devops",
    name: "Azure DevOps",
    category: "ops",
    docsUrl: "https://learn.microsoft.com/en-us/azure/devops/",
    description:
      "Azure DevOps is Microsoft's hosted suite for source control (Repos), CI/CD (Pipelines), boards, artifacts, and test plans. It is a common choice in enterprises building on the Microsoft stack.",
    icon: "azuredevops",
    ghLanguage: null,
    aliases: ["azure-devops", "ado", "vsts"],
  },
  {
    slug: "jenkins",
    name: "Jenkins",
    category: "ops",
    docsUrl: "https://www.jenkins.io/doc/",
    description:
      "Jenkins is a long-standing open-source automation server for building, testing, and deploying software. Its plugin ecosystem covers virtually every CI/CD scenario, especially for self-hosted pipelines.",
    icon: "jenkins",
    ghLanguage: null,
  },
] as const;

/** Internal index built once per module load. */
const BY_KEY: Map<string, Tech> = (() => {
  const map = new Map<string, Tech>();
  for (const t of TECHS) {
    map.set(t.slug.toLowerCase(), t);
    map.set(t.name.toLowerCase(), t);
    for (const alias of t.aliases ?? []) {
      map.set(alias.toLowerCase(), t);
    }
  }
  return map;
})();

/**
 * Look up a Tech by slug, display name, or any registered alias. Matching is
 * case-insensitive and trims surrounding whitespace.
 */
export function findTech(slugOrName: string): Tech | undefined {
  if (!slugOrName) return undefined;
  return BY_KEY.get(slugOrName.trim().toLowerCase());
}

/** Group all known techs by category, preserving insertion order within each group. */
export function techsByCategory(): Record<Tech["category"], Tech[]> {
  const groups: Record<Tech["category"], Tech[]> = {
    backend: [],
    frontend: [],
    mobile: [],
    data: [],
    testing: [],
    ops: [],
  };
  for (const t of TECHS) {
    groups[t.category].push(t);
  }
  return groups;
}
