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
   * Logo identifier. Either:
   *   - a Devicon slug (e.g. "react", "dotnetcore") — rendered via
   *     https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<icon>/<icon>-original.svg
   *   - a full URL (starts with "http") — used as-is, e.g. Simple Icons CDN
   *     https://cdn.simpleicons.org/<slug>
   *   - null — consumer falls back to a text monogram tile
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
    slug: "nodejs",
    name: "Node.js",
    category: "backend",
    docsUrl: "https://nodejs.org/en/docs",
    description:
      "Node.js is a JavaScript runtime built on V8, enabling JS on the server. The default runtime for most modern JS/TS backends, CLI tooling, and build pipelines.",
    icon: "nodejs",
    ghLanguage: "JavaScript",
    aliases: ["node"],
  },
  {
    slug: "express",
    name: "Express",
    category: "backend",
    docsUrl: "https://expressjs.com/",
    description:
      "Express is the minimal, unopinionated web framework for Node.js. Still the de-facto choice for HTTP APIs and middleware-driven services on Node despite newer alternatives.",
    icon: "express",
    ghLanguage: "JavaScript",
    aliases: ["expressjs"],
  },
  {
    slug: "python",
    name: "Python",
    category: "backend",
    docsUrl: "https://docs.python.org/3/",
    description:
      "Python is a high-level general-purpose language widely used for scripting, data work, automation, and backend services. Lingua franca for ML / data engineering.",
    icon: "python",
    ghLanguage: "Python",
  },
  {
    slug: "scala",
    name: "Scala",
    category: "backend",
    docsUrl: "https://docs.scala-lang.org/",
    description:
      "Scala is a JVM language combining object-oriented and functional paradigms. Strong static typing and pattern matching make it a common choice for data-platform engines (Spark, Akka, Kafka tooling).",
    icon: "scala",
    ghLanguage: "Scala",
  },
  {
    slug: "haskell",
    name: "Haskell",
    category: "backend",
    docsUrl: "https://www.haskell.org/documentation/",
    description:
      "Haskell is a purely functional, statically-typed language with lazy evaluation. Used heavily in academia and in selected industry niches that prize correctness (compilers, finance, type-system research).",
    icon: "haskell",
    ghLanguage: "Haskell",
  },
  {
    slug: "cpp",
    name: "C++",
    category: "backend",
    docsUrl: "https://en.cppreference.com/",
    description:
      "C++ is a multi-paradigm systems language with deterministic memory management and zero-overhead abstractions. The default in performance-critical, embedded, and game-engine contexts.",
    icon: "cplusplus",
    ghLanguage: "C++",
    aliases: ["c++", "cplusplus"],
  },
  {
    slug: "doctrine",
    name: "Doctrine ORM",
    category: "backend",
    docsUrl: "https://www.doctrine-project.org/projects/orm.html",
    description:
      "Doctrine is the de-facto ORM for PHP, paired with most modern Symfony applications. Implements the Data Mapper pattern and provides DQL alongside its SQL query builder.",
    icon: "https://github.com/doctrine.png?size=128",
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
  {
    slug: "c",
    name: "C",
    category: "backend",
    docsUrl: "https://en.cppreference.com/w/c/language",
    description:
      "C is a low-level, statically-typed systems language that underpins operating systems, embedded firmware, and the runtime of higher-level languages.",
    icon: "c",
    ghLanguage: "C",
  },
  {
    slug: "aspnet",
    name: "ASP.NET",
    category: "backend",
    docsUrl: "https://learn.microsoft.com/en-us/aspnet/core/",
    description:
      "ASP.NET is Microsoft's web stack on top of the .NET runtime. It covers MVC, Web API, Razor Pages, and Blazor — the actual framework most C#/.NET web work ships against.",
    icon: "https://github.com/dotnet.png?size=128",
    ghLanguage: "C#",
    aliases: ["asp.net", "aspnetcore", "asp.net core"],
  },
  {
    slug: "ef-core",
    name: "Entity Framework Core",
    category: "backend",
    docsUrl: "https://learn.microsoft.com/en-us/ef/core/",
    description:
      "Entity Framework Core is Microsoft's ORM for .NET. Code-first or database-first, LINQ-driven query expressions, migrations, and a test-friendly InMemory provider.",
    icon: "https://github.com/dotnet.png?size=128",
    ghLanguage: "C#",
    aliases: ["entity framework", "efcore", "ef"],
  },
  {
    slug: "jboss",
    name: "JBoss / WildFly",
    category: "backend",
    docsUrl: "https://www.wildfly.org/",
    description:
      "JBoss (now WildFly) is an open-source Jakarta EE application server. It hosts enterprise Java services with JPA, EJB, JAX-RS, and CDI integrated out of the box.",
    icon: "https://github.com/wildfly.png?size=128",
    ghLanguage: "Java",
    aliases: ["wildfly"],
  },
  {
    slug: "hibernate",
    name: "Hibernate",
    category: "backend",
    docsUrl: "https://hibernate.org/orm/documentation/",
    description:
      "Hibernate is the long-standing ORM for Java. It implements JPA, manages transactions and lazy loading, and pairs naturally with Spring or Jakarta EE applications.",
    icon: "hibernate",
    ghLanguage: "Java",
  },
  {
    slug: "tomcat",
    name: "Apache Tomcat",
    category: "backend",
    docsUrl: "https://tomcat.apache.org/",
    description:
      "Tomcat is the reference Java servlet container — small, fast, embeddable. It powers most server-side Java that doesn't need a full Jakarta EE stack.",
    icon: "tomcat",
    ghLanguage: "Java",
  },
  {
    slug: "jsp",
    name: "JSP",
    category: "backend",
    docsUrl: "https://jakarta.ee/specifications/pages/",
    description:
      "JavaServer Pages is the long-running Java server-side templating standard, paired with servlets and a Jakarta EE container. Still common in legacy enterprise web apps.",
    icon: "java",
    ghLanguage: "Java",
    aliases: ["javaserver pages"],
  },
  {
    slug: "jax-rs",
    name: "JAX-RS",
    category: "backend",
    docsUrl: "https://jakarta.ee/specifications/restful-ws/",
    description:
      "JAX-RS is the Jakarta EE specification for building REST APIs in Java. Annotation-driven (@Path, @GET, @Produces) with implementations like RESTEasy and Jersey.",
    icon: "https://github.com/jakartaee.png?size=128",
    ghLanguage: "Java",
    aliases: ["jakarta rest"],
  },
  {
    slug: "jax-ws",
    name: "JAX-WS",
    category: "backend",
    docsUrl: "https://jakarta.ee/specifications/xml-web-services/",
    description:
      "JAX-WS is the Jakarta EE SOAP web-services specification. Older than REST but still ubiquitous in enterprise Java integrations and legacy contracts.",
    icon: "https://github.com/jakartaee.png?size=128",
    ghLanguage: "Java",
    aliases: ["jakarta soap"],
  },
  {
    slug: "guzzle",
    name: "Guzzle",
    category: "backend",
    docsUrl: "https://docs.guzzlephp.org/",
    description:
      "Guzzle is the standard PHP HTTP client. Promise-based, PSR-7 compliant, with a mock handler for testing — the de facto choice for outbound HTTP from PHP services.",
    icon: "https://github.com/guzzle.png?size=128",
    ghLanguage: "PHP",
  },
  {
    slug: "lexik-jwt",
    name: "Lexik JWT",
    category: "backend",
    docsUrl:
      "https://github.com/lexik/LexikJWTAuthenticationBundle",
    description:
      "LexikJWTAuthenticationBundle is the Symfony bundle for JWT-based authentication. Pluggable into the Symfony security firewall as a stateless token provider.",
    icon: null,
    ghLanguage: "PHP",
    aliases: ["lexik", "lexikjwt"],
  },

  // ──────────── Frontend ────────────
  {
    slug: "nextjs",
    name: "Next.js",
    category: "frontend",
    docsUrl: "https://nextjs.org/docs",
    description:
      "Next.js is a React framework from Vercel for building production web apps. It bundles routing, rendering modes (SSR/SSG/RSC), and an App Router built around React Server Components.",
    icon: "nextjs",
    ghLanguage: "TypeScript",
    aliases: ["next", "next.js"],
  },
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
    slug: "redux",
    name: "Redux",
    category: "frontend",
    docsUrl: "https://redux.js.org/",
    description:
      "Redux is a predictable state container for JavaScript apps, popularised alongside React. The modern Redux Toolkit reduces boilerplate while keeping the single-store, pure-reducer model intact.",
    icon: "redux",
    ghLanguage: "TypeScript",
  },
  {
    slug: "twig",
    name: "Twig",
    category: "frontend",
    docsUrl: "https://twig.symfony.com/doc/3.x/",
    description:
      "Twig is the templating engine bundled with Symfony, designed for clean, readable templates. Auto-escapes by default, supports inheritance and macros, and is widely reused outside Symfony too.",
    icon: "https://github.com/twigphp.png?size=128",
    ghLanguage: "PHP",
  },
  {
    slug: "rxjs",
    name: "RxJS",
    category: "frontend",
    docsUrl: "https://rxjs.dev/",
    description:
      "RxJS is the JavaScript implementation of ReactiveX — a library for composing asynchronous and event-based programs using observable sequences. It is the reactive backbone of Angular.",
    icon: "rxjs",
    ghLanguage: "TypeScript",
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
  {
    slug: "javascript",
    name: "JavaScript",
    category: "frontend",
    docsUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    description:
      "JavaScript is the language of the web — a dynamically-typed, prototype-based language that runs in every browser and on every server (via Node.js, Deno, Bun).",
    icon: "javascript",
    ghLanguage: "JavaScript",
    aliases: ["js"],
  },
  {
    slug: "angular-material",
    name: "Angular Material",
    category: "frontend",
    docsUrl: "https://material.angular.io/",
    description:
      "Angular Material is the official Angular component library implementing Google's Material Design. Production-grade form controls, dialogs, tables, and a CDK for building custom interactions.",
    icon: "https://cdn.simpleicons.org/angular",
    ghLanguage: "TypeScript",
  },

  // ──────────── Mobile ────────────
  {
    slug: "android",
    name: "Android",
    category: "mobile",
    docsUrl: "https://developer.android.com/docs",
    description:
      "Android is Google's mobile operating system and SDK. Native development centres on Kotlin or Java with the Android Jetpack libraries; the platform runs on the majority of mobile devices worldwide.",
    icon: "android",
    ghLanguage: "Java",
    aliases: ["android-native", "android sdk"],
  },
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
    slug: "firebase",
    name: "Firebase",
    category: "data",
    docsUrl: "https://firebase.google.com/docs",
    description:
      "Firebase is Google's backend-as-a-service platform: realtime database, Firestore, authentication, cloud functions, and analytics, all managed and tightly integrated for mobile and web apps.",
    icon: "firebase",
    ghLanguage: null,
  },
  {
    slug: "mongoose",
    name: "Mongoose",
    category: "data",
    docsUrl: "https://mongoosejs.com/docs/",
    description:
      "Mongoose is the most-used MongoDB ODM for Node.js. Schema declarations, validators, middleware, and population sit on top of the official MongoDB driver.",
    icon: "https://github.com/Automattic.png?size=128",
    ghLanguage: "JavaScript",
  },
  {
    slug: "mongodb-atlas",
    name: "MongoDB Atlas",
    category: "data",
    docsUrl: "https://www.mongodb.com/docs/atlas/",
    description:
      "MongoDB Atlas is the official managed cloud service for MongoDB, available on AWS, Azure, and GCP. It handles provisioning, backups, monitoring, and scaling so teams can run document workloads without operating the database tier.",
    icon: "mongodb",
    ghLanguage: null,
    aliases: ["atlas"],
  },
  {
    slug: "realm",
    name: "Realm",
    category: "data",
    docsUrl: "https://www.mongodb.com/docs/realm/",
    description:
      "Realm is an embedded, object-oriented mobile database now part of MongoDB. Its sync engine pairs naturally with MongoDB Atlas to keep mobile apps consistent across offline and online edges.",
    icon: "https://github.com/realm.png?size=128",
    ghLanguage: null,
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
    icon: "https://github.com/xunit.png?size=128",
    ghLanguage: null,
    aliases: ["xunit.net"],
  },
  {
    slug: "cucumber",
    name: "Cucumber",
    category: "testing",
    docsUrl: "https://cucumber.io/docs/cucumber/",
    description:
      "Cucumber is a BDD test framework that runs plain-language Gherkin specifications against step definitions. Common alongside Cypress / Selenium for human-readable acceptance suites.",
    icon: "https://github.com/cucumber.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "selenium",
    name: "Selenium",
    category: "testing",
    docsUrl: "https://www.selenium.dev/documentation/",
    description:
      "Selenium is the long-standing toolset for browser automation, driving real browsers via the W3C WebDriver protocol. It powers acceptance, integration, and regression testing across language ecosystems.",
    icon: "selenium",
    ghLanguage: null,
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
    icon: "https://github.com/robotframework.png?size=128",
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
    icon: "/logos/phpunit.svg",
    ghLanguage: "PHP",
  },
  {
    slug: "behat",
    name: "Behat",
    category: "testing",
    docsUrl: "https://docs.behat.org/",
    description:
      "Behat is the PHP behaviour-driven-development framework. Tests are written in Gherkin and translated into PHP step definitions — pairs naturally with PHPUnit and Mockery.",
    icon: "https://github.com/Behat.png?size=128",
    ghLanguage: "PHP",
  },
  {
    slug: "mockery",
    name: "Mockery",
    category: "testing",
    docsUrl: "https://docs.mockery.io/",
    description:
      "Mockery is a PHP mocking library. It plays the same role as PHPUnit's built-in mock builder but with a fluent API and support for partial mocks, expectations, and demeter chains.",
    icon: "https://github.com/mockery.png?size=128",
    ghLanguage: "PHP",
  },
  {
    slug: "karma",
    name: "Karma",
    category: "testing",
    docsUrl: "https://karma-runner.github.io/",
    description:
      "Karma is the JavaScript test runner that ships with Angular CLI by default. Drives real browsers (or headless Chrome) and integrates with Jasmine, Mocha, or QUnit for assertions.",
    icon: "karma",
    ghLanguage: "JavaScript",
  },
  {
    slug: "jasmine",
    name: "Jasmine",
    category: "testing",
    docsUrl: "https://jasmine.github.io/",
    description:
      "Jasmine is a behaviour-driven JavaScript testing framework with no external dependencies. The default assertion library for Angular projects via Karma.",
    icon: "jasmine",
    ghLanguage: "JavaScript",
  },
  {
    slug: "jest",
    name: "Jest",
    category: "testing",
    docsUrl: "https://jestjs.io/docs/getting-started",
    description:
      "Jest is the JavaScript testing framework maintained by Meta. Snapshot testing, isolated worker processes, and zero-config defaults — the standard choice for React and Node.js codebases.",
    icon: "jest",
    ghLanguage: "JavaScript",
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
  {
    slug: "splunk",
    name: "Splunk",
    category: "ops",
    docsUrl: "https://docs.splunk.com/Documentation",
    description:
      "Splunk is an enterprise platform for searching, monitoring, and analysing machine-generated data: logs, metrics, traces. It is widely used for operational visibility and security analytics.",
    icon: "https://github.com/splunk.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    category: "ops",
    docsUrl: "https://kubernetes.io/docs/",
    description:
      "Kubernetes is the dominant container orchestrator, pairing declarative manifests with a controller-driven control plane. Production runtime for almost every cloud-native workload.",
    icon: "kubernetes",
    ghLanguage: null,
    aliases: ["k8s"],
  },
  {
    slug: "terraform",
    name: "Terraform",
    category: "ops",
    docsUrl: "https://developer.hashicorp.com/terraform/docs",
    description:
      "Terraform is HashiCorp's IaC tool: declarative HCL describes cloud + SaaS resources, and the engine reconciles state against the desired graph. Cloud-agnostic and provider-extensible.",
    icon: "terraform",
    ghLanguage: null,
  },
  {
    slug: "ansible",
    name: "Ansible",
    category: "ops",
    docsUrl: "https://docs.ansible.com/",
    description:
      "Ansible is Red Hat's agentless configuration-management tool. Playbooks (YAML) drive idempotent state on remote hosts over SSH or WinRM, popular for fleet-wide system setup.",
    icon: "ansible",
    ghLanguage: null,
  },
  {
    slug: "powershell",
    name: "PowerShell",
    category: "ops",
    docsUrl: "https://learn.microsoft.com/en-us/powershell/",
    description:
      "PowerShell is Microsoft's object-oriented shell and scripting language, cross-platform since version 7. It is the default automation surface on Windows servers, Azure, and Microsoft 365.",
    icon: "powershell",
    ghLanguage: "PowerShell",
    aliases: ["pwsh", "ps"],
  },
  {
    slug: "bash",
    name: "Bash",
    category: "ops",
    docsUrl: "https://www.gnu.org/software/bash/manual/",
    description:
      "Bash is the GNU Bourne-Again SHell: the de-facto interactive and scripting shell on Linux and macOS. It powers most CI runners, container entrypoints, and operational scripts in the Unix world.",
    icon: "bash",
    ghLanguage: "Shell",
    aliases: ["sh", "shell"],
  },
  {
    slug: "cmd",
    name: "Windows CMD",
    category: "ops",
    docsUrl: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands",
    description:
      "Windows Command Prompt (cmd.exe) is the legacy Windows shell, still widely scripted in batch files (.bat / .cmd) for Windows-only build steps and on-machine automation.",
    icon: null,
    ghLanguage: "Batchfile",
    aliases: ["cmd.exe", "batch"],
  },
  {
    slug: "teamcity",
    name: "TeamCity",
    category: "ops",
    docsUrl: "https://www.jetbrains.com/help/teamcity/",
    description:
      "TeamCity is JetBrains' build management and continuous-integration server. Strong on .NET / JVM build orchestration, with first-class IntelliJ-family IDE integration.",
    icon: "https://github.com/JetBrains.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "circleci",
    name: "CircleCI",
    category: "ops",
    docsUrl: "https://circleci.com/docs/",
    description:
      "CircleCI is a hosted continuous integration and delivery platform configured via YAML. Common in JS / TS / Ruby ecosystems and integrates cleanly with GitHub and Bitbucket repositories.",
    icon: "https://github.com/circleci.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "redis",
    name: "Redis",
    category: "data",
    docsUrl: "https://redis.io/docs/",
    description:
      "Redis is an in-memory key/value data store. Used as cache, message broker, session store, and primary database for low-latency workloads. Lua scripting, pub/sub, streams, and replication are first-class.",
    icon: "redis",
    ghLanguage: null,
  },
  {
    slug: "kafka",
    name: "Apache Kafka",
    category: "data",
    docsUrl: "https://kafka.apache.org/documentation/",
    description:
      "Apache Kafka is a distributed event-streaming platform: durable, partitioned logs that decouple producers from consumers. Backbone of most modern event-driven and analytics pipelines.",
    icon: "apachekafka",
    ghLanguage: null,
    aliases: ["kafka"],
  },
  {
    slug: "postman",
    name: "Postman",
    category: "testing",
    docsUrl: "https://learning.postman.com/docs/",
    description:
      "Postman is the de-facto API client and collaborative test workbench. Used for ad-hoc HTTP debugging, automated API tests, and shared collections across teams.",
    icon: "postman",
    ghLanguage: null,
  },
  {
    slug: "vscode",
    name: "VS Code",
    category: "ops",
    docsUrl: "https://code.visualstudio.com/docs",
    description:
      "Visual Studio Code is Microsoft's free, cross-platform code editor with a vast extension ecosystem. The default editor for a large share of working developers, including many on .NET, Python, and frontend stacks.",
    icon: "vscode",
    ghLanguage: null,
    aliases: ["visual studio code", "code"],
  },
  {
    slug: "visualstudio",
    name: "Visual Studio",
    category: "ops",
    docsUrl: "https://learn.microsoft.com/en-us/visualstudio/",
    description:
      "Visual Studio is Microsoft's flagship IDE for .NET and C++ development on Windows (with Mac on retirement). Heavyweight tooling: profiler, designer, IntelliSense, integrated test runners.",
    icon: "visualstudio",
    ghLanguage: null,
    aliases: ["vs"],
  },
  {
    slug: "rider",
    name: "JetBrains Rider",
    category: "ops",
    docsUrl: "https://www.jetbrains.com/help/rider/",
    description:
      "Rider is JetBrains' cross-platform IDE for .NET. Combines ReSharper-grade refactorings and inspections with the IntelliJ platform's UX, popular among Mac/Linux .NET teams and Unity developers.",
    icon: "https://github.com/JetBrains.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "webstorm",
    name: "WebStorm",
    category: "ops",
    docsUrl: "https://www.jetbrains.com/help/webstorm/",
    description:
      "WebStorm is JetBrains' IDE for JavaScript / TypeScript and the wider web stack. Strong TypeScript-first refactorings, integrated debugging for Node and browsers, and deep framework support (React, Vue, Angular).",
    icon: "https://github.com/JetBrains.png?size=128",
    ghLanguage: null,
  },
  {
    slug: "android-studio",
    name: "Android Studio",
    category: "ops",
    docsUrl: "https://developer.android.com/studio",
    description:
      "Android Studio is the official IDE for native Android development, built on IntelliJ. Provides the Android Gradle plugin, layout inspector, profiler, and emulator tooling for Java and Kotlin app work.",
    icon: "androidstudio",
    ghLanguage: null,
  },
  {
    slug: "jetbrains-toolbox",
    name: "JetBrains Toolbox",
    category: "ops",
    docsUrl: "https://www.jetbrains.com/help/toolbox-app/",
    description:
      "JetBrains Toolbox is the install/update manager for the JetBrains IDE family (IntelliJ, Rider, WebStorm, PhpStorm, etc.). Central place for licences, settings sync, and side-by-side IDE versions.",
    icon: "https://github.com/JetBrains.png?size=128",
    ghLanguage: null,
    aliases: ["toolbox"],
  },
  {
    slug: "maven",
    name: "Apache Maven",
    category: "ops",
    docsUrl: "https://maven.apache.org/guides/index.html",
    description:
      "Maven is the long-running JVM build and dependency-management tool. Convention-over-configuration via POM XML, central repository for transitive dependencies, lifecycle phases for compile/test/package/deploy.",
    icon: "apachemaven",
    ghLanguage: "Java",
    aliases: ["mvn"],
  },
  {
    slug: "gradle",
    name: "Gradle",
    category: "ops",
    docsUrl: "https://docs.gradle.org/current/userguide/userguide.html",
    description:
      "Gradle is the modern JVM build tool — Groovy/Kotlin DSL, incremental builds, configuration caching. Default build system for Android and the most common choice for new Spring/Kotlin services.",
    icon: "gradle",
    ghLanguage: "Java",
  },
  {
    slug: "bitbucket",
    name: "Bitbucket",
    category: "ops",
    docsUrl: "https://support.atlassian.com/bitbucket-cloud/",
    description:
      "Bitbucket is Atlassian's git hosting platform. Pipelines for CI, native Jira integration, and IP-allowlist controls — the common choice in shops already standardised on Jira/Confluence.",
    icon: "bitbucket",
    ghLanguage: null,
  },
  {
    slug: "jira",
    name: "Jira",
    category: "ops",
    docsUrl: "https://support.atlassian.com/jira-software-cloud/",
    description:
      "Jira is Atlassian's issue tracker. Configurable workflows, sprint planning, JQL for filters, and a deep ecosystem of integrations — the default in most enterprise software organisations.",
    icon: "jira",
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
