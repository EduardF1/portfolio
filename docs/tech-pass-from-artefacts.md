# Tech pass from artefacts — LinkedIn screenshots + CV ledger

> **Senior Dev C, 2026-04-26.** Cross-references the existing `src/lib/tech.ts` against
> two off-site sources of truth that the GitHub harvest does not see:
>
> 1. The **LinkedIn skills list** as captured in `Desktop\Job search 2026\Linkedin sections (01.12.25)\Skills_*.png` (5 PNGs) plus the supplementary About / Experience / Education / Licenses screenshots in the same folder.
> 2. The **CV ledger DOCX** at `Desktop\Job search 2026\CV Ledger\Eduard_Fischer-Szava_CV_Ledger_FULL.docx`.
>
> Method: Read each PNG once via the `Read` tool (sub-300 KB each — image budget held). The DOCX was unzipped and `word/document.xml` was stripped of its WordprocessingML tags via PowerShell.
>
> Scope of "tech": everything that maps to a chip on `/work` — languages, frameworks, libraries, tooling, datastores, IDEs, CI systems, methodologies. Cross-cutting non-tech skills (Communication, Business, Economics, etc.) are listed separately for reference but are NOT proposed as chips.

## Section A — Tech missing from `src/lib/tech.ts` (proposed adds)

Each entry below appears in either the LinkedIn skills list or the CV ledger but is **not** currently in `tech.ts` (verified against the 60-entry catalogue read on this branch). Order: backend → frontend → mobile/data → testing → ops → modelling/methodology.

### Languages

| Tech | Source | Category | Suggested icon | Why it matters |
|---|---|---|---|---|
| **C (programming language)** | LinkedIn Skills_4 | backend (language) | Devicon: `c` → `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg` | Shows up on LinkedIn separately from C++. Honest to list — VIA bachelor & embedded coursework. |
| **JavaScript** *(language proper, not Node.js)* | Implied by jQuery / Jest / Express.js entries; LinkedIn certs ("JavaScript course – Sololearn") | frontend (language) | Devicon: `javascript` | Currently the catalogue has Node.js, Express, RxJS but no JS-the-language chip. Closes a glossary gap. |

### Frameworks / libraries

| Tech | Source | Category | Suggested icon | Why it matters |
|---|---|---|---|---|
| **ASP.NET** *(distinct from .NET runtime)* | LinkedIn Skills_3 ("ASP.NET", "Passed LinkedIn Skill Assessment") | backend (framework) | Devicon: `dot-net` (or Simple Icons `dotnet`) | LinkedIn-assessed; the .NET chip currently maps to runtime/SDK only — ASP.NET is the actual web stack used on Netcompany work. |
| **Entity Framework Core** | CV ledger Netcompany & Greenbyte sections; Experience_7 | backend (data-access) | Simple Icons via brand: `https://github.com/dotnet.png?size=128` (no clean Devicon) | Specific ORM used for unit/integration tests with EF Core test databases — the actual abstraction Eduard ships against on .NET. |
| **JBoss** | CV ledger STIL contribution (Netcompany section) | backend (app server) | Simple Icons: `https://cdn.simpleicons.org/redhat` (closest brand) or `https://github.com/wildfly.png?size=128` | Real platform used on STIL EUD3/UADK/Uddannelse.dk work — not in catalogue and not a typical GitHub language. |
| **Hibernate** | CV ledger Greenbyte sections; Experience_7 | backend (data-access) | Devicon: `hibernate` | Java ORM paired with JSP/Tomcat at Greenbyte. Maps cleanly to Java repos. |
| **Tomcat** *(Apache Tomcat)* | CV ledger Greenbyte; Experience_7 | backend (server) | Devicon: `tomcat` | Servlet container behind the JSP/Spring backend at Greenbyte. |
| **JSP (JavaServer Pages)** | CV ledger Greenbyte; Experience_7 | frontend (templating) | Devicon: `java` (no JSP-specific Devicon) | Server-side templating for the legacy slice of Kalenda. Honest to list. |
| **JAX-RS** | LinkedIn Skills_4 | backend (API) | Simple Icons: `https://github.com/jakartaee.png?size=128` (no Devicon) | Java REST API standard. Listed by Eduard explicitly. |
| **JAX-WS** | LinkedIn Skills_5 | backend (API) | Simple Icons: same as JAX-RS | SOAP web-service standard. Older but real exposure. |
| **Behat** | LinkedIn Experience_4 (Boozt); CV ledger Boozt section | testing (BDD) | Simple Icons: `https://github.com/Behat.png?size=128` | PHP BDD framework used at Boozt alongside PHPUnit/Mockery. Closes a Boozt-stack chip gap. |
| **Mockery** | LinkedIn Experience_4 (Boozt); CV ledger | testing (mocking) | Simple Icons: `https://github.com/mockery.png?size=128` | Boozt PHP test stack — already adjacent to PHPUnit chip. |
| **Guzzle** | LinkedIn Experience_4 (Boozt) | backend (HTTP client) | Simple Icons: `https://github.com/guzzle.png?size=128` | PHP HTTP client used in Boozt automated tests. |
| **Lexik** *(LexikJWTAuthenticationBundle)* | LinkedIn Experience_4 (Boozt — "authentication module") | backend (auth) | No clean icon — fall back to text monogram (`icon: null`) | Symfony JWT bundle. Niche but specific. |
| **Karma (test runner)** | LinkedIn Experience_2 (Systematic — "Karma web runner") | testing | Devicon: `karma` (or Simple Icons `karma`) | Angular test runner. Pair with Jasmine. |
| **Jasmine** | LinkedIn Skills_5 ("Jasmine Framework"); Experience_2 | testing | Devicon: `jasmine` | Currently absent — only Cypress / Playwright cover JS testing. Jasmine is the Systematic-era runner. |
| **Jest** | LinkedIn Skills_4 | testing | Devicon: `jest` | Standard JS unit-test runner. Modern complement to Jasmine. |
| **Angular Material** | LinkedIn Skills_3 | frontend (UI library) | Simple Icons: `https://cdn.simpleicons.org/angular` (or `https://github.com/angular.png?size=128`) | The component library actually shipped with Angular at Netcompany / Greenbyte. |

### Build / CI / VCS / collaboration

| Tech | Source | Category | Suggested icon | Why it matters |
|---|---|---|---|---|
| **Maven** | LinkedIn Skills_3 | ops (build) | Devicon: `maven` (Devicon variant `apachemaven`) | JVM build tool — relevant for Java/Spring repos. |
| **Gradle** | LinkedIn Skills_5 | ops (build) | Devicon: `gradle` | Android / modern JVM build tool. Pairs with Android Studio chip. |
| **Bitbucket** | LinkedIn Skills_3; CV ledger (Greenbyte / Systematic) | ops (VCS host) | Devicon: `bitbucket` | Real VCS host used at Greenbyte and Systematic. The current catalogue has Git but not the host. |
| **Jira** | LinkedIn Skills_3; CV ledger | ops (issue tracker) | Devicon: `jira` | Standard issue tracker. |
| **Postman** | LinkedIn Experience_4; already in `tech.ts` | — | — | **Already present.** No action. |
| **Bash** | already in `tech.ts` | — | — | **Already present.** |

### Modelling / architecture

| Tech | Source | Category | Suggested icon | Why it matters |
|---|---|---|---|---|
| **UML** | LinkedIn Experience_4/6/7; CV ledger ubiquitous | modelling (chip OR description-only) | Simple Icons: `https://github.com/uml-foundation.png?size=128` (or `icon: null`) | Mentioned at every consultancy-style role (Boozt, Greenbyte, LEGO, Dansk Wilton). Worth a chip. |
| **AnyLogic** | LinkedIn Experience_6 (Advansor); CV ledger | modelling/simulation | `icon: null` (no Devicon, no SI entry) | Production-line simulation at Advansor. Distinctive — not "another framework." Niche but verifiable. |
| **Figma** | LinkedIn Experience_6 (Dansk Wilton); CV ledger | design | Devicon: `figma` | Light usage, but real for the Dansk Wilton mobile prototype. |

### Methodologies *(propose as a SEPARATE section on `/work` glossary, not as filterable chips — Janteloven hedge: methodology chips read as buzzwordy)*

| Methodology | Source |
|---|---|
| Scrum | LinkedIn Skills_2; Experience_2 (Systematic — "SCRUM") |
| Kanban | LinkedIn Experience_4 (Boozt — "Introduced Kanban"); CV ledger |
| FDD (Feature-Driven Development) | LinkedIn Experience_2 (Systematic — "Development guided by FDD") |
| CMMI / TMMI | LinkedIn Education_1 (VIA — "Process Management for Engineering CMMI + TMMI"); Experience_2 ("Working by CMMI5") |
| LEAN | LinkedIn Experience_2 (Systematic) |
| Agile | LinkedIn Skills_2; CV ledger |
| Clean Architecture | CV ledger (Netcompany Skills line) |
| BDD (via Cucumber/Gherkin) | LinkedIn Experience_2; already covered by Cucumber chip |
| ITIL, SAFe, XP | LinkedIn Experience_7 (mentioned in DevOps research article context) |

**Recommendation**: keep the `tech.ts` schema strictly for tools/frameworks/languages. Surface methodologies on `/work` as a **separate "How I work" prose paragraph** so they sit in the right semantic register for a Danish recruiter — see `feature-exploration-2026-04.md` for a sized proposal.

### Soft skills / cross-cutting non-tech skills *(NOT chips — for reference)*

LinkedIn Skills also includes: Project Management, Software Development Life Cycle (SDLC), Systems Thinking, Prototyping, Software Development, Mathematics, Design, Agile Methodologies, Design Patterns, Business, Economics, Digital Marketing, Responsive Web Design, Network Security, Distributed Systems, Object-Oriented Programming (OOP), Software Design Patterns, SOLID Design Principles, Computer Architecture, Communication, Business Modeling, Management, Solution Architecture, Testing, REST APIs, Representational State Transfer (REST). These are appropriately **NOT** in the tech catalogue — they're either methodologies (handled above), conceptual (OOP/SOLID/Design Patterns — already implicit in language chips), or non-tech cross-cutting (PM, SDLC, etc.). Keep them out of `tech.ts`.

### Numerical summary

| Bucket | Count |
|---|---|
| Tech genuinely missing from `tech.ts` and recommended for add | **22** |
| Of those, with clean Devicon / Simple Icons logo | 16 |
| Methodologies (separate "How I work" surface, not chips) | 9 |
| Soft skills (no portfolio surface needed) | ~25 |

The 22 chip-worthy adds are: C, JavaScript, ASP.NET, Entity Framework Core, JBoss, Hibernate, Tomcat, JSP, JAX-RS, JAX-WS, Behat, Mockery, Guzzle, Lexik, Karma, Jasmine, Jest, Angular Material, Maven, Gradle, Bitbucket, Jira, plus optional UML / AnyLogic / Figma if PO wants modelling/design surfaced as filterable.

---

## Section B — CV-ledger gaps in the live Experience timeline

The CV ledger lists **9 distinct paid roles** (some part-time / contract / sub-projects). The live Experience timeline on `src/app/[locale]/page.tsx` currently shows: **Mjølner Informatics**, **Netcompany**, **Greenbyte**, **Boozt**, **Systematic** — 5 roles. The remaining 4 roles are LEGO Group (master thesis), Advansor, Dansk Wilton, and Greenbyte (academic-article consultancy) — all from the Aug 2022 – Jun 2023 master's period.

### Roles in CV but NOT on the live timeline

| Role | Period | Source | Action item for PO |
|---|---|---|---|
| **Consultant (Master Thesis) — The LEGO Group** | Sep 2023 – Feb 2024 | CV ledger; LinkedIn Experience_6 | Already partially surfaced via the Master's thesis MDX (`content/articles/`). Decision: do we want a Career-timeline "fellowship" entry too, or is the article surface enough? Recommendation: **keep as-is** (article surface is honest; adding a fake "role" inflates the timeline). |
| **Consultant — Advansor** (Feb–Jun 2023) | Feb 2023 – Jun 2023 | CV ledger | Real paid consulting. AnyLogic simulation work. **Add as a sub-bullet** under the Greenbyte student period (or as its own short timeline entry) — currently invisible. |
| **Consultant — Dansk Wilton** (Feb–Jun 2023) | Feb 2023 – Jun 2023 | CV ledger | Same period — real business-modelling consultancy. Same recommendation. |
| **Consultant — Greenbyte (DevOps research article)** | Feb 2023 – Jun 2023 | CV ledger; LinkedIn Experience_7 | Academic article companion. **Optionally** surface under a "Research output" sub-section on the timeline or `/writing`. |
| **Consultant — The LEGO Group (knowledge-management research article)** | Aug 2022 – Jan 2023 | CV ledger; LinkedIn Experience_7 | Same as above — academic article. Recommend: link from `/writing/articles/` if/when published; do not add as separate role chip. |
| **Goods Receiving Operator — REITAN AS** | May 2019 – May 2021 (part-time) | LinkedIn Experience_2 | **Out of scope.** Pre-tech, manual labour while studying. Honest to omit. |
| **Goods Receiving Operator — GLS** (Mar 2017 – Sep 2018) | LinkedIn Experience_1 | Out of scope. |
| **Call Center Agent — eMAG** (Sep 2016 – Jan 2017) | LinkedIn Experience_1 | Out of scope. |
| **Sales Assistant — LPP RESERVED UK LIMITED** (Apr–Sep 2016) | LinkedIn Experience_1 | Out of scope. |
| **Sales Intern — SC Domisis Construct SRL** (Jul–Oct 2018) | LinkedIn Experience_2 | Out of scope. Romanian real-estate analyses. |

### Sub-projects / details in CV that aren't on the live timeline

| Detail | Source | Action item |
|---|---|---|
| **STIL stint (Jun–Sep 2025)** at Netcompany — EUD3 / UADK / Uddannelse.dk on JBoss + jQuery + TypeScript + Oracle SQL Developer; built a reusable UI component design catalog | CV ledger Netcompany section | Already noted in `docs/handoff.md` as a 2026-04 refinement, but the timeline copy at `src/app/[locale]/page.tsx` doesn't currently call it out. **Add a sentence** to the Netcompany role description: "Including a Jun–Sep 2025 stint at STIL on EUD3 / UADK / Uddannelse.dk where I built a reusable UI component catalog." |
| **NCSCE work** (senior election platform, distinct from KMT Valg) | CV ledger Netcompany section | The current Netcompany copy mentions KOMBIT VALG product link; consider adding NCSCE as a second product link or sub-bullet ("Also contributed to NCSCE — the senior election platform — on stability + workflow improvements"). |
| **Performance testing on real datasets (~5 million records)** | CV ledger Netcompany section | A concrete factual line worth surfacing on the role description — Danish recruiters value scale specifics framed factually. |
| **100+ PRs to KMT Valg** | CV ledger Career Highlights | Already implied; could be added as a metric in the StatsRow. |
| **399 → 250 functional + non-functional requirements consolidation** at LEGO thesis | CV ledger Education / LinkedIn Education_1 | Concrete number worth surfacing on the thesis MDX summary. |
| **22,500 records data-processing** (master's research, MongoDB Atlas + Charts) | LinkedIn Experience_5 | Specific factual line. Could land as a footnote in the LEGO thesis MDX if not already there. |

### Certifications / credentials in CV / LinkedIn but not on the site

| Credential | Source | Action item |
|---|---|---|
| **TOEFL iBT — 100/120**, ETS, Jul 2022 | LinkedIn Licenses_And_Certifications | Optional `/about` or `/my-story` mention — modest factual line. |
| **Full Stack Project: Spring Boot 2.0, ReactJS, Redux** — Udemy, Sep 2021 | LinkedIn L&C | Optional. Course cert; don't over-surface. |
| **The Complete 2021 PHP Full Stack Web Developer Bootcamp** — Udemy, Sep 2021 | LinkedIn L&C | Optional. |
| **Python for Beginners** — Sololearn, Aug 2021 | LinkedIn L&C | Optional. |
| **JavaScript course** — Sololearn, Jul 2021 | LinkedIn L&C | Optional. |
| **The Complete 2021 Web Development Bootcamp** — Udemy, Jul 2021 | LinkedIn L&C | Optional. |
| **Danish education for adult foreigners** — Danish Ministry of Foreigners and Integration | LinkedIn L&C | **Recommend surface.** Useful confidence signal for Danish recruiters. Could land in `/my-story` or `/personal`. |
| **.NET Framework — LinkedIn Skill Assessment passed** | LinkedIn Skills_3 | Low priority. |
| **Android — LinkedIn Skill Assessment passed** | LinkedIn Skills_4 | Low priority. |

### Languages

The live site (per `feedback_audience_benchmark.md` + `next-intl` config) ships EN + DA. The CV ledger lists:

- Romanian — Native
- English — Full professional proficiency
- Danish — Full professional proficiency
- Norwegian, Swedish — Limited working proficiency

LinkedIn Languages adds: Danish (Professional working), English (Full professional), Romanian (Native or bilingual). Slight discrepancy — the CV bumps Danish to "Full professional"; assume CV is the more current truth (consistent with Eduard's 2026 active job-search framing).

**Action item for PO**: when the third locale (`ro`) ships per the future-features list, the language hierarchy is RO (native) > EN (full) > DA (full) > NO/SE (limited). Don't surface NO/SE on the site — claiming limited working in two extra languages reads as inflation in DK register.

### Section B summary — PO action items

1. **Surface STIL Jun–Sep 2025 stint** on the Netcompany timeline entry (one sentence, factual). *S, ≤30 min.*
2. **Add Advansor + Dansk Wilton 2023 consultancies** as sub-bullets under the Greenbyte student period — currently invisible on the live site. *S–M, 1–2h.*
3. **Add NCSCE** as a second product link / sub-bullet under Netcompany. *S, ≤30 min.*
4. **Mention "tested on ~5 million records"** in the Netcompany role description — concrete scale, factual register. *S.*
5. **Surface the Danish-language certification** somewhere modest — `/my-story` or `/personal`. *S.*
6. **Decision needed**: does PO want a "Research output" surface for the two academic articles (DevOps in SMEs + Employee Knowledge Management Framework + Master's thesis)? They're partially in `/writing/articles/` but the DevOps article isn't there. *M, 2–3h to model and seed if yes.*
7. **Decision needed**: do we model "passed LinkedIn skill assessments" as a small badge on tech chips? Risk: looks LinkedIn-clout-y for a DK audience. Recommendation: **skip**. *0.*

---

## Method notes (for the next session)

- **DOCX extraction**: `unzip -o file.docx -d cv_extract/`, then strip XML tags via PowerShell regex on `word/document.xml`. Pandoc is **not** installed on this machine (`which pandoc` → not found). Python is installed but the Microsoft Store stub intercepts plain `python` calls inside Git Bash; using PowerShell directly is the path of least resistance.
- **PNG reading**: each Skills/About/Experience/Education/Languages PNG is 17–300 KB; reading one at a time via the `Read` tool (multimodal) was well under image budget. Did not need to downsize.
- **Photo catalogue**: `scripts/photo-catalogue.json` (NOT `public/photos/photo-catalogue.json` — the path in the brief is stale). 253 entries; 215 with GPS; 20 distinct countries. See `docs/trip-clusters.md`.
